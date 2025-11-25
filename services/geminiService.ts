
import { GeminiBlob, GeminiFunctionDeclaration, GeminiModality, GeminiType } from '../types';
import { getAiInstance } from '../config/geminiConfig';

// --- Audio Utility Functions ---

export function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export function createPcmBlob(data: Float32Array): GeminiBlob {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
        int16[i] = data[i] * 32768;
    }
    return {
        data: encode(new Uint8Array(int16.buffer)),
        mimeType: 'audio/pcm;rate=16000',
    };
}

// --- Extended Gemini Capabilities ---

export async function generateContentWithSearch(prompt: string): Promise<string> {
    const ai = getAiInstance();
    try {
        // gemini-2.5-flash supports googleSearch tool
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
                // We generally want text back, not JSON, unless specified in prompt
            }
        });
        
        // Extract grounding metadata if available to append sources
        let text = response.text || "No results found.";
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        
        if (chunks && chunks.length > 0) {
            text += "\n\n**Sources:**\n";
            chunks.forEach((chunk: any) => {
                if (chunk.web?.uri) {
                    text += `- [${chunk.web.title || 'Source'}](${chunk.web.uri})\n`;
                }
            });
        }
        
        return text;
    } catch (e) {
        console.error("Search Grounding Error:", e);
        return "I encountered an error while searching the web. Please try again.";
    }
}

export async function generateJsonWithSearch(prompt: string, schema: any): Promise<any> {
    const ai = getAiInstance();
    try {
        // Two-step process often works better: Search first, then extract JSON
        // But 2.5 Flash is smart enough to do it in one go if instructed carefully.
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
                responseMimeType: 'application/json',
                responseSchema: schema
            }
        });
        
        const text = response.text;
        if (!text) return null;
        return JSON.parse(text);
    } catch (e) {
        console.error("JSON Search Error:", e);
        return null;
    }
}

export async function generateImages(prompt: string): Promise<string | null> {
    const ai = getAiInstance();
    try {
        const response = await ai.models.generateImages({
            model: 'imagen-3.0-generate-001',
            prompt: prompt,
            config: {
                numberOfImages: 1,
                aspectRatio: '1:1',
                outputMimeType: 'image/jpeg'
            }
        });
        
        const imageBytes = response.generatedImages?.[0]?.image?.imageBytes;
        if (imageBytes) {
            return `data:image/jpeg;base64,${imageBytes}`;
        }
        return null;
    } catch (e) {
        console.error("Image Generation Error:", e);
        return null;
    }
}

export async function generateVideos(prompt: string): Promise<string | null> {
    const ai = getAiInstance();
    try {
        // Veo 3.1 generation
        let operation = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: prompt,
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: '16:9' // Default social format
            }
        });

        // Poll for completion (simplified for this context, usually takes time)
        // In a real app, we'd handle this async with a job queue or long polling loop.
        // For this demo, we attempt to get the operation result after a short delay
        // acknowledging that real video gen takes > 10s.
        
        // Since we can't block effectively here for too long without UX impact,
        // we will assume this is handled by a backend or use a simplified flow.
        // However, per docs:
        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 2000)); // Poll every 2s
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }

        const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (videoUri) {
             // Append API Key to fetch the actual bytes if needed, or just return URI for display if supported
             // Note: Browser might not be able to fetch directly due to CORS.
             // We will return the URI with the key appended for the frontend to try and use.
             // Using process.env.API_KEY safely here as it's client side logic helper
             // @ts-ignore
             const key = import.meta.env.VITE_API_KEY || import.meta.env.API_KEY;
             return `${videoUri}&key=${key}`; 
        }
        return null;

    } catch (e) {
        console.error("Video Generation Error:", e);
        return null;
    }
}

export async function generateSpeech(text: string): Promise<string | null> {
    const ai = getAiInstance();
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: text }] }],
            config: {
                responseModalities: [GeminiModality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        });
        return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
    } catch (e) {
        console.error("TTS Error:", e);
        return null;
    }
}


// --- Function Calling Schemas ---

const queryPlatformDeclaration: GeminiFunctionDeclaration = {
    name: 'queryPlatform',
    parameters: {
        type: GeminiType.OBJECT,
        description: 'Answers user questions about their own data within the platform. Use for queries like "What should I focus on today?", "Summarize my open deals", or "Any overdue tasks for ABC Limited?". This is for reading and summarizing data, not for creating or updating items.',
        properties: {
            query: { type: GeminiType.STRING, description: 'The user\'s question about their platform data.' },
        },
        required: ['query'],
    },
};

const findProspectsDeclaration: GeminiFunctionDeclaration = {
    name: 'findProspects',
    parameters: {
        type: GeminiType.OBJECT,
        description: 'Searches for potential new clients based on a business line\'s profile.',
        properties: {
            businessLineName: { type: GeminiType.STRING, description: 'The name of the business line to find prospects for.' },
        },
        required: ['businessLineName'],
    },
};

const analyzeRiskDeclaration: GeminiFunctionDeclaration = {
    name: 'analyzeRisk',
    parameters: {
        type: GeminiType.OBJECT,
        description: 'Performs a deep "Pre-Mortem" risk analysis on a specific project by searching for common pitfalls in similar industries.',
        properties: {
            projectName: { type: GeminiType.STRING, description: 'The name of the project to analyze.' },
        },
        required: ['projectName'],
    },
};

const analyzeNegotiationDeclaration: GeminiFunctionDeclaration = {
    name: 'analyzeNegotiation',
    parameters: {
        type: GeminiType.OBJECT,
        description: 'Acts as a Negotiation Coach. Researches the client and deal to suggest leverage points and strategies.',
        properties: {
            dealName: { type: GeminiType.STRING, description: 'The name of the deal.' },
        },
        required: ['dealName'],
    },
};

const getClientPulseDeclaration: GeminiFunctionDeclaration = {
    name: 'getClientPulse',
    parameters: {
        type: GeminiType.OBJECT,
        description: 'Searches the web for recent news and social media activity about a client to find conversation starters.',
        properties: {
            clientName: { type: GeminiType.STRING, description: 'The name of the client.' },
        },
        required: ['clientName'],
    },
};

const createCrmEntryDeclaration: GeminiFunctionDeclaration = {
  name: 'createCrmEntry',
  parameters: {
    type: GeminiType.OBJECT,
    description: 'Logs a past interaction (like a call, email, or meeting) to a client\'s CRM timeline. Use this for events that have already happened. For future actions, use createBoardItem.',
    properties: {
      interactionType: { 
        type: GeminiType.STRING,
        description: 'The type of interaction. Infer from the user\'s language. Must be one of: "call", "email", "meeting", "message", "note".'
      },
      content: { 
        type: GeminiType.STRING,
        description: 'The full details of the interaction as described by the user.'
      },
      clientName: { 
        type: GeminiType.STRING,
        description: 'The name of the client involved in the interaction.'
      },
      dealName: {
        type: GeminiType.STRING,
        description: 'Optional: The name of the deal this interaction is related to.'
      },
    },
    required: ['interactionType', 'content', 'clientName'],
  },
};


const createBoardItemDeclaration: GeminiFunctionDeclaration = {
  name: 'createBoardItem',
  parameters: {
    type: GeminiType.OBJECT,
    description: 'Creates a new item (task, reminder, or meeting) and adds it to the "To Do" column of the Kanban board, based on the user\'s voice command. Infer the item type from the user\'s phrasing, e.g., "remind me to..." implies a Reminder, "meeting with..." implies a Meeting, otherwise it is a Task.',
    properties: {
      itemType: {
        type: GeminiType.STRING,
        description: 'The type of item to create. Must be one of: "Task", "Reminder", "Meeting".',
      },
      title: {
        type: GeminiType.STRING,
        description: 'A short, human-friendly title for the item. E.g., for a task "Call James", for a reminder "Send the invoice", for a meeting "Project sync with the team".',
      },
      description: {
        type: GeminiType.STRING,
        description: 'Optional, longer description of the item from the user’s voice.',
      },
      dueDate: {
        type: GeminiType.STRING,
        description: 'The due date and time for the item in ISO 8601 format, parsed from what the user said (e.g., "tomorrow at 3pm").',
      },
      priority: {
        type: GeminiType.STRING,
        description: 'The priority of the item. Can be "Low", "Medium", or "High".',
      },
      clientName: {
        type: GeminiType.STRING,
        description: 'The name of the client this item is for. E.g., "ABC Limited".',
      },
      dealName: {
        type: GeminiType.STRING,
        description: 'The name of the deal this item is related to. E.g., "Warehouse monthly fumigation".',
      },
      businessLineName: {
        type: GeminiType.STRING,
        description: 'The name of the business line for this item. E.g., "Fumigation".',
      },
    },
    required: ['itemType', 'title'],
  },
};

const moveTaskDeclaration: GeminiFunctionDeclaration = {
    name: 'moveTask',
    parameters: {
        type: GeminiType.OBJECT,
        description: 'Moves an existing task to a different column on the Kanban board.',
        properties: {
            taskTitle: {
                type: GeminiType.STRING,
                description: 'The title of the task to move. The model should try to match this to an existing task.',
            },
            newStatus: {
                type: GeminiType.STRING,
                description: 'The new status for the task. Must be one of: "To Do", "Doing", "Done", "Terminated".',
            },
        },
        required: ['taskTitle', 'newStatus'],
    },
};

const createBusinessLineDeclaration: GeminiFunctionDeclaration = {
  name: 'createBusinessLine',
  parameters: {
    type: GeminiType.OBJECT,
    description: 'Creates a new business line from user input, parsing out the key details.',
    properties: {
      name: { type: GeminiType.STRING, description: 'The name of the new business line. Example: "Fumigation".' },
      description: { type: GeminiType.STRING, description: 'A one-sentence description of what the business line does. Example: "We help apartments and offices get rid of pests."' },
      customers: { type: GeminiType.STRING, description: 'A one-sentence description of the typical customers. Example: "Apartments, estates, and small offices in Nairobi."' },
      aiFocus: { type: GeminiType.STRING, description: 'A one-sentence description of what the AI should focus on for this line. Example: "Find estate-wide contracts and upsell to annual plans."' },
    },
    required: ['name', 'description', 'customers', 'aiFocus'],
  },
};

const createClientDeclaration: GeminiFunctionDeclaration = {
  name: 'createClient',
  parameters: {
    type: GeminiType.OBJECT,
    description: 'Creates a new client and links it to a business line.',
    properties: {
      name: { type: GeminiType.STRING, description: 'The name of the new client. Example: "ABC Limited".' },
      description: { type: GeminiType.STRING, description: 'A one-sentence description of who the client is. Example: "A large logistics company with multiple warehouses."' },
      aiFocus: { type: GeminiType.STRING, description: 'A one-sentence description of what the AI should focus on for this client. Example: "Focus on securing a multi-year contract."' },
      businessLineName: { type: GeminiType.STRING, description: 'Optional: The name of the business line to associate this client with. If omitted, a sensible default will be chosen.' },
    },
    required: ['name', 'description', 'aiFocus'],
  },
};

const createDealDeclaration: GeminiFunctionDeclaration = {
  name: 'createDeal',
  parameters: {
    type: GeminiType.OBJECT,
    description: 'Creates a new deal and links it to an existing client.',
    properties: {
      name: { type: GeminiType.STRING, description: 'The name of the new deal.' },
      description: { type: GeminiType.STRING, description: 'A short, one-sentence description of what the deal is about.' },
      clientName: { type: GeminiType.STRING, description: 'The name of the client this deal belongs to.' },
      value: { type: GeminiType.NUMBER, description: 'The total monetary value of the deal.' },
      currency: { type: GeminiType.STRING, description: 'The currency of the deal value (e.g., USD, KES).' },
      revenueModel: { type: GeminiType.STRING, description: 'The revenue model for the deal. Must be one of: "Revenue Share", "Full Pay".' },
    },
    required: ['name', 'description', 'clientName', 'value', 'currency', 'revenueModel'],
  },
};

const createProjectDeclaration: GeminiFunctionDeclaration = {
    name: 'createProject',
    parameters: {
        type: GeminiType.OBJECT,
        description: 'Parses a user\'s conversational input to create a new, structured project record. Fills as many fields as possible from the natural language input.',
        properties: {
            partnerName: { type: GeminiType.STRING, description: 'The name of the partner or organisation.' },
            projectName: { type: GeminiType.STRING, description: 'The name of the project. Propose a clean name if not explicitly stated.' },
            goal: { type: GeminiType.STRING, description: 'A one-line goal or "Why this matters".' },
            dealType: { type: GeminiType.STRING, description: 'The type of deal. Must be one of: "Revenue Share", "Fee-based", "Grant", "In-kind".' },
            expectedRevenue: { type: GeminiType.NUMBER, description: 'A rough number for expected revenue this year.' },
            impactMetric: { type: GeminiType.STRING, description: 'The main impact metric, e.g., "# learners", "# SMEs".' },
            stage: { type: GeminiType.STRING, description: 'The initial stage. Usually "Lead" or "In design".' },
        },
        required: ['partnerName', 'projectName', 'goal'],
    },
};

const createEventDeclaration: GeminiFunctionDeclaration = {
    name: 'createEvent',
    parameters: {
        type: GeminiType.OBJECT,
        description: 'Creates a new Event record in the Events module. Use this when the user talks about planning an event, workshop, or webinar.',
        properties: {
            name: { type: GeminiType.STRING, description: 'The name of the event.' },
            location: { type: GeminiType.STRING, description: 'Location or "Online".' },
            date: { type: GeminiType.STRING, description: 'Date of the event.' },
        },
        required: ['name'],
    },
};

const createCandidateDeclaration: GeminiFunctionDeclaration = {
    name: 'createCandidate',
    parameters: {
        type: GeminiType.OBJECT,
        description: 'Adds a new candidate to the HR recruitment pipeline.',
        properties: {
            name: { type: GeminiType.STRING, description: 'Name of the candidate.' },
            roleApplied: { type: GeminiType.STRING, description: 'The role they are applying for.' },
            email: { type: GeminiType.STRING, description: 'Email address if available.' },
        },
        required: ['name', 'roleApplied'],
    },
};

const updateDealStatusDeclaration: GeminiFunctionDeclaration = {
    name: 'updateDealStatus',
    parameters: {
        type: GeminiType.OBJECT,
        description: "Updates a deal's status to 'Open' or 'Closed - Won' or 'Closed - Lost'.",
        properties: {
            dealName: { type: GeminiType.STRING, description: 'The name of the deal to update.' },
            newStatus: { type: GeminiType.STRING, description: "The new status for the deal. Must be 'Open', 'Closed - Won', or 'Closed - Lost'." },
        },
        required: ['dealName', 'newStatus'],
    },
};

const sendEmailDeclaration: GeminiFunctionDeclaration = {
    name: 'sendEmail',
    parameters: {
        type: GeminiType.OBJECT,
        description: "Drafts an email to a recipient. This opens the user's default email client.",
        properties: {
            recipientEmail: { type: GeminiType.STRING, description: 'The email address of the recipient.' },
            subject: { type: GeminiType.STRING, description: 'The subject of the email.' },
            body: { type: GeminiType.STRING, description: 'The body content of the email.' },
        },
        required: ['subject', 'body'],
    },
};


const assistantTools = [{ functionDeclarations: [
    createCrmEntryDeclaration,
    createBoardItemDeclaration, 
    moveTaskDeclaration,
    createBusinessLineDeclaration,
    createClientDeclaration,
    createDealDeclaration,
    createProjectDeclaration,
    createEventDeclaration,
    createCandidateDeclaration,
    updateDealStatusDeclaration,
    findProspectsDeclaration,
    queryPlatformDeclaration,
    sendEmailDeclaration,
    analyzeRiskDeclaration,
    analyzeNegotiationDeclaration,
    getClientPulseDeclaration
] }];

// --- Live API Service ---

interface LiveSessionCallbacks {
    onOpen: () => void;
    onMessage: (message: any) => void;
    onError: (event: ErrorEvent) => void;
    onClose: (event: CloseEvent) => void;
}

export function connectToLiveSession(callbacks: LiveSessionCallbacks, systemInstruction: string, useTools: boolean = true) {
    const ai = getAiInstance();
    const config: any = {
        responseModalities: [GeminiModality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
        inputAudioTranscription: {},
        outputAudioTranscription: {},
        systemInstruction: systemInstruction,
    };
    if (useTools) {
        config.tools = assistantTools;
    }

    return ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
            onopen: callbacks.onOpen,
            onmessage: callbacks.onMessage,
            onerror: callbacks.onError,
            onclose: callbacks.onClose,
        },
        config,
    });
}
