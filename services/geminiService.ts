
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
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            }
        });
        
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
        let operation = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: prompt,
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: '16:9'
            }
        });

        // Simple polling for demo purposes
        let attempts = 0;
        while (!operation.done && attempts < 10) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            operation = await ai.operations.getVideosOperation({ operation: operation });
            attempts++;
        }

        const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (videoUri) {
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

// --- Function Calling Schemas (Relaxed for AI Inference) ---

const queryPlatformDeclaration: GeminiFunctionDeclaration = {
    name: 'queryPlatform',
    parameters: {
        type: GeminiType.OBJECT,
        description: 'Answers user questions about their own data within the platform.',
        properties: {
            query: { type: GeminiType.STRING, description: 'The user\'s question.' },
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
            businessLineName: { type: GeminiType.STRING, description: 'The name of the business line.' },
        },
        required: ['businessLineName'],
    },
};

const analyzeRiskDeclaration: GeminiFunctionDeclaration = {
    name: 'analyzeRisk',
    parameters: {
        type: GeminiType.OBJECT,
        description: 'Performs a "Pre-Mortem" risk analysis on a project.',
        properties: {
            projectName: { type: GeminiType.STRING, description: 'The name of the project.' },
        },
        required: ['projectName'],
    },
};

const analyzeNegotiationDeclaration: GeminiFunctionDeclaration = {
    name: 'analyzeNegotiation',
    parameters: {
        type: GeminiType.OBJECT,
        description: 'Researches client financials/news to suggest negotiation strategies.',
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
        description: 'Searches for recent news and social media activity about a client.',
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
    description: 'Logs a past interaction (call, email, meeting) to CRM.',
    properties: {
      interactionType: { type: GeminiType.STRING, description: 'One of: "call", "email", "meeting", "message", "note".' },
      content: { type: GeminiType.STRING, description: 'Details of the interaction.' },
      clientName: { type: GeminiType.STRING, description: 'Client name.' },
      dealName: { type: GeminiType.STRING, description: 'Optional deal name.' },
    },
    required: ['interactionType', 'content'],
  },
};

const createBoardItemDeclaration: GeminiFunctionDeclaration = {
  name: 'createBoardItem',
  parameters: {
    type: GeminiType.OBJECT,
    description: 'Creates a task, reminder, or meeting.',
    properties: {
      itemType: { type: GeminiType.STRING, description: '"Task", "Reminder", "Meeting".' },
      title: { type: GeminiType.STRING, description: 'Title of the item.' },
      description: { type: GeminiType.STRING, description: 'Optional description.' },
      dueDate: { type: GeminiType.STRING, description: 'ISO date/time.' },
      priority: { type: GeminiType.STRING, description: '"Low", "Medium", "High".' },
      clientName: { type: GeminiType.STRING, description: 'Client name.' },
      dealName: { type: GeminiType.STRING, description: 'Deal name.' },
      businessLineName: { type: GeminiType.STRING, description: 'Business Line name.' },
    },
    required: ['title'], 
  },
};

const moveTaskDeclaration: GeminiFunctionDeclaration = {
    name: 'moveTask',
    parameters: {
        type: GeminiType.OBJECT,
        description: 'Moves a task to a new status.',
        properties: {
            taskTitle: { type: GeminiType.STRING, description: 'Title of the task.' },
            newStatus: { type: GeminiType.STRING, description: '"To Do", "Doing", "Done", "Terminated".' },
        },
        required: ['taskTitle', 'newStatus'],
    },
};

const createBusinessLineDeclaration: GeminiFunctionDeclaration = {
  name: 'createBusinessLine',
  parameters: {
    type: GeminiType.OBJECT,
    description: 'Creates a new business line.',
    properties: {
      name: { type: GeminiType.STRING },
      description: { type: GeminiType.STRING },
      customers: { type: GeminiType.STRING },
      aiFocus: { type: GeminiType.STRING },
    },
    required: ['name'], 
  },
};

const createClientDeclaration: GeminiFunctionDeclaration = {
  name: 'createClient',
  parameters: {
    type: GeminiType.OBJECT,
    description: 'Creates a new client.',
    properties: {
      name: { type: GeminiType.STRING },
      description: { type: GeminiType.STRING },
      aiFocus: { type: GeminiType.STRING },
      businessLineName: { type: GeminiType.STRING },
    },
    required: ['name'],
  },
};

const createDealDeclaration: GeminiFunctionDeclaration = {
  name: 'createDeal',
  parameters: {
    type: GeminiType.OBJECT,
    description: 'Creates a new deal.',
    properties: {
      name: { type: GeminiType.STRING },
      description: { type: GeminiType.STRING },
      clientName: { type: GeminiType.STRING },
      value: { type: GeminiType.NUMBER },
      currency: { type: GeminiType.STRING },
      revenueModel: { type: GeminiType.STRING },
    },
    required: ['name'], 
  },
};

const createProjectDeclaration: GeminiFunctionDeclaration = {
    name: 'createProject',
    parameters: {
        type: GeminiType.OBJECT,
        description: 'Creates a new project.',
        properties: {
            partnerName: { type: GeminiType.STRING },
            projectName: { type: GeminiType.STRING },
            goal: { type: GeminiType.STRING },
            dealType: { type: GeminiType.STRING },
            expectedRevenue: { type: GeminiType.NUMBER },
            impactMetric: { type: GeminiType.STRING },
            stage: { type: GeminiType.STRING },
        },
        required: ['projectName'], 
    },
};

const createEventDeclaration: GeminiFunctionDeclaration = {
    name: 'createEvent',
    parameters: {
        type: GeminiType.OBJECT,
        description: 'Creates a new Event record.',
        properties: {
            name: { type: GeminiType.STRING },
            location: { type: GeminiType.STRING },
            date: { type: GeminiType.STRING },
        },
        required: ['name'],
    },
};

const createCandidateDeclaration: GeminiFunctionDeclaration = {
    name: 'createCandidate',
    parameters: {
        type: GeminiType.OBJECT,
        description: 'Adds a new HR candidate.',
        properties: {
            name: { type: GeminiType.STRING },
            roleApplied: { type: GeminiType.STRING },
            email: { type: GeminiType.STRING },
        },
        required: ['name'], 
    },
};

const createSocialPostDeclaration: GeminiFunctionDeclaration = {
    name: 'createSocialPost',
    parameters: {
        type: GeminiType.OBJECT,
        description: 'Drafts a social media post.',
        properties: {
            content: { type: GeminiType.STRING },
            channel: { type: GeminiType.STRING },
            visualPrompt: { type: GeminiType.STRING },
            date: { type: GeminiType.STRING }
        },
        required: ['content', 'channel'],
    },
};

const updateDealStatusDeclaration: GeminiFunctionDeclaration = {
    name: 'updateDealStatus',
    parameters: {
        type: GeminiType.OBJECT,
        description: "Updates a deal's status.",
        properties: {
            dealName: { type: GeminiType.STRING },
            newStatus: { type: GeminiType.STRING },
        },
        required: ['dealName', 'newStatus'],
    },
};

const sendEmailDeclaration: GeminiFunctionDeclaration = {
    name: 'sendEmail',
    parameters: {
        type: GeminiType.OBJECT,
        description: "Drafts an email.",
        properties: {
            recipientEmail: { type: GeminiType.STRING },
            subject: { type: GeminiType.STRING },
            body: { type: GeminiType.STRING },
        },
        required: ['subject', 'body'],
    },
};

const logPaymentDeclaration: GeminiFunctionDeclaration = {
    name: 'logPayment',
    parameters: {
        type: GeminiType.OBJECT,
        description: "Logs a payment on a deal.",
        properties: {
            dealName: { type: GeminiType.STRING },
            amount: { type: GeminiType.NUMBER },
            currency: { type: GeminiType.STRING },
            note: { type: GeminiType.STRING },
        },
        required: ['amount'],
    },
};

const refineTaskChecklistDeclaration: GeminiFunctionDeclaration = {
    name: 'refineTaskChecklist',
    parameters: {
        type: GeminiType.OBJECT,
        description: "Refines a task checklist.",
        properties: {
            taskTitle: { type: GeminiType.STRING },
            command: { type: GeminiType.STRING },
        },
        required: ['taskTitle'],
    },
};

const generateSocialImageDeclaration: GeminiFunctionDeclaration = {
    name: 'generateSocialImage',
    parameters: {
        type: GeminiType.OBJECT,
        description: "Generates a social media image.",
        properties: {
            prompt: { type: GeminiType.STRING },
        },
        required: ['prompt'],
    },
};

const generateSocialVideoDeclaration: GeminiFunctionDeclaration = {
    name: 'generateSocialVideo',
    parameters: {
        type: GeminiType.OBJECT,
        description: "Generates a social media video.",
        properties: {
            prompt: { type: GeminiType.STRING },
        },
        required: ['prompt'],
    },
};

const generateDocumentDraftDeclaration: GeminiFunctionDeclaration = {
    name: 'generateDocumentDraft',
    parameters: {
        type: GeminiType.OBJECT,
        description: "Drafts a document.",
        properties: {
            prompt: { type: GeminiType.STRING },
            category: { type: GeminiType.STRING },
            ownerName: { type: GeminiType.STRING },
            ownerType: { type: GeminiType.STRING },
        },
        required: ['prompt', 'category'],
    },
};

const enhanceUserPromptDeclaration: GeminiFunctionDeclaration = {
    name: 'enhanceUserPrompt',
    parameters: {
        type: GeminiType.OBJECT,
        description: "Enhances a user prompt.",
        properties: {
            prompt: { type: GeminiType.STRING },
        },
        required: ['prompt'],
    },
};

// --- Tools Export ---

export const assistantTools = [{ functionDeclarations: [
    createCrmEntryDeclaration,
    createBoardItemDeclaration, 
    moveTaskDeclaration,
    createBusinessLineDeclaration,
    createClientDeclaration,
    createDealDeclaration,
    createProjectDeclaration,
    createEventDeclaration,
    createCandidateDeclaration,
    createSocialPostDeclaration,
    updateDealStatusDeclaration,
    findProspectsDeclaration,
    queryPlatformDeclaration,
    sendEmailDeclaration,
    analyzeRiskDeclaration,
    analyzeNegotiationDeclaration,
    getClientPulseDeclaration,
    logPaymentDeclaration,
    refineTaskChecklistDeclaration,
    generateSocialImageDeclaration,
    generateSocialVideoDeclaration,
    generateDocumentDraftDeclaration,
    enhanceUserPromptDeclaration
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
