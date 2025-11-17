

import { GoogleGenAI } from "@google/genai";
import { GeminiBlob, GeminiFunctionDeclaration, GeminiModality, GeminiType } from '../types';

// FIX: Use process.env.API_KEY as per guidelines to resolve TypeScript error.
if (!process.env.API_KEY) {
    // FIX: Updated error message to reflect the correct environment variable.
    console.error("API_KEY environment variable is not set. The app will display a configuration error message.");
}

// FIX: Use process.env.API_KEY as per guidelines to resolve TypeScript error.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

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


// --- Function Calling Schemas ---

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

const assistantTools = [{ functionDeclarations: [
    createCrmEntryDeclaration,
    createBoardItemDeclaration, 
    moveTaskDeclaration,
    createBusinessLineDeclaration,
    createClientDeclaration,
    createDealDeclaration,
    updateDealStatusDeclaration,
    findProspectsDeclaration,
] }];

// --- Live API Service ---

interface LiveSessionCallbacks {
    onOpen: () => void;
    onMessage: (message: any) => void;
    onError: (event: ErrorEvent) => void;
    onClose: (event: CloseEvent) => void;
}

export function connectToLiveSession(callbacks: LiveSessionCallbacks, systemInstruction: string, useTools: boolean = true) {
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