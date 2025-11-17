

import { GoogleGenAI } from '@google/genai';
import { RouterBrainResult, GeminiType } from '../types';

const getSystemPrompt = (knownData: { clients: string[], deals: string[], businessLines: string[] }, context: any, platform_activity_summary: string) => `
You are the "router brain" for olooAI. Your primary function is to meticulously analyze an incoming message (from email, Telegram, or typed text) and translate it into structured data with high fidelity to the user's intent. Your goal is to be a precise interpreter, not an imaginative assistant.

Your job: take one incoming message, ANALYZE it, and precisely STRUCTURE it.
You MUST respond with pure JSON that matches this schema:
- action: "create_business_line" | "create_client" | "create_deal" | "create_task" | "create_note" | "both" | "update_task" | "ignore"
- tasks: array of task objects
- note: note object or null
- summary: string or null (only for forwarded messages)
- businessLine: businessLine object or null
- client: client object or null
- deal: deal object or null

CONTEXT:
- Known Business Lines: ${knownData.businessLines.join(', ') || 'None'}
- Known Clients: ${knownData.clients.join(', ') || 'None'}
- Known Deals: ${knownData.deals.join(', ') || 'None'}
- User is currently viewing (in-app context): ${JSON.stringify(context)}
- Recent Platform Activity (for your learning): ${platform_activity_summary}

RULES OF ENGAGEMENT:

1.  **Prioritize User Intent**: Your absolute first priority is to reflect what the user has written. Do not add tasks or notes that are not explicitly mentioned or clearly implied. If the user says "Call Bob", the task is "Call Bob". Do not change it to "Schedule a call with Bob to discuss Q3".
2.  **Analyze, Don't Invent**: Triage the main intent based *only* on the provided text.
    - "create_task": A clear future action is requested.
    - "update_task": A direct modification to an existing task is stated (e.g., "I've finished...").
    - "create_note": The message is informational, reporting on a completed action.
    - "both": Both a report and a future action are present.
    - "create_business_line" / "create_client" / "create_deal": The user is explicitly creating a new entity.
    - "ignore": The message is conversational or contains no actionable business information.
3.  **High-Fidelity Data Extraction**:
    - When creating tasks or notes, extract information directly from the source text.
    - Use context (like the current view or known entities) ONLY to fill in relational IDs (e.g., clientId, dealId), not to create new information.
    - \`update_hint\`: For 'update_task', use enough verbatim text from the user's message to uniquely identify the task.
4.  **Truth Protocol (Strict)**:
    - NEVER invent client, deal, or business line names.
    - Only associate items with entities that are mentioned in the text or are present in the provided context. If an entity is ambiguous, leave the corresponding field null.
`;

const routerBrainSchema = {
    type: GeminiType.OBJECT,
    properties: {
        action: { 
            type: GeminiType.STRING, 
            enum: ['create_task', 'create_note', 'both', 'update_task', 'ignore', 'create_business_line', 'create_client', 'create_deal'] 
        },
        tasks: {
            type: GeminiType.ARRAY,
            items: {
                type: GeminiType.OBJECT,
                properties: {
                    title: { type: GeminiType.STRING },
                    due_date: { type: GeminiType.STRING, nullable: true },
                    client_name: { type: GeminiType.STRING, nullable: true },
                    deal_name: { type: GeminiType.STRING, nullable: true },
                    update_hint: { type: GeminiType.STRING, nullable: true },
                },
                required: ['title']
            }
        },
        note: {
            type: GeminiType.OBJECT,
            nullable: true,
            properties: {
                text: { type: GeminiType.STRING },
                channel: { type: GeminiType.STRING }
            },
            required: ['text', 'channel']
        },
        summary: { type: GeminiType.STRING, nullable: true },
        businessLine: {
            type: GeminiType.OBJECT,
            nullable: true,
            properties: {
                name: { type: GeminiType.STRING },
                description: { type: GeminiType.STRING },
                customers: { type: GeminiType.STRING },
                aiFocus: { type: GeminiType.STRING },
            },
            required: ['name', 'description', 'customers', 'aiFocus']
        },
        client: {
            type: GeminiType.OBJECT,
            nullable: true,
            properties: {
                name: { type: GeminiType.STRING },
                description: { type: GeminiType.STRING },
                aiFocus: { type: GeminiType.STRING },
                businessLineName: { type: GeminiType.STRING }
            },
            required: ['name', 'description', 'aiFocus']
        },
        deal: {
            type: GeminiType.OBJECT,
            nullable: true,
            properties: {
                name: { type: GeminiType.STRING },
                description: { type: GeminiType.STRING },
                clientName: { type: GeminiType.STRING },
                value: { type: GeminiType.NUMBER },
                currency: { type: GeminiType.STRING },
                revenueModel: { type: GeminiType.STRING, enum: ['Revenue Share', 'Full Pay'] }
            },
            required: ['name', 'description', 'clientName', 'value', 'currency', 'revenueModel']
        }
    },
    required: ['action', 'tasks', 'note', 'summary']
};

export const processTextMessage = async (text: string, knownData: any, context: any, platformActivitySummary: string): Promise<RouterBrainResult> => {
    if (!process.env.API_KEY) throw new Error("API Key is not configured.");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const systemInstruction = getSystemPrompt(knownData, context, platformActivitySummary);
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: text,
            config: { 
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: routerBrainSchema,
            }
        });
        
        const resultJson = response.text.trim().replace(/^```json\s*|```\s*$/g, '');
        return JSON.parse(resultJson) as RouterBrainResult;
    } catch (e) {
        console.error("Error processing text message with AI:", e);
        // Return a safe, 'ignore' response in case of parsing or API errors
        return {
            action: 'ignore',
            tasks: [],
            note: null,
            summary: null
        } as RouterBrainResult;
    }
};