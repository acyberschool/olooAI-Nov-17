
import { RouterBrainResult, GeminiType } from '../types';
import { getAiInstance } from '../config/geminiConfig';

const getSystemPrompt = (knownData: { clients: string[], deals: string[], businessLines: string[], teamMembers: string[], projects: string[] }, context: any, platform_activity_summary: string) => `
You are **Walter**, the Autonomous Operating System of olooAI. 
You are **NOT** a chatbot. You are a **CHAIN REACTION ENGINE**.

**YOUR MISSION:**
Take vague, high-level user intent and transform it into **structured, connected, and complete business actions**.
Never ask for clarification if you can infer, guess, or use a sensible default. **Action is better than inaction.**

**KNOWLEDGE BASE (INTERNAL DATA):**
- Business Lines: ${knownData.businessLines.join(', ')}
- Clients: ${knownData.clients.join(', ')}
- Deals: ${knownData.deals.join(', ')}
- Projects: ${knownData.projects.join(', ')}
- Team: ${knownData.teamMembers.join(', ')}
- Current Screen Context: ${JSON.stringify(context)}

**MANDATORY DATA HIERARCHY & INFERENCE RULES:**
1.  **Client Creation:** MUST belong to a **Business Line**.
    *   *Inference:* Match the client's nature to a Business Line name. If unsure, assign to the first available Business Line.
2.  **Deal/Project/Sales:** MUST belong to a **Client**.
    *   *Inference:* If user says "Deal for Acme", find "Acme" in Clients. If "Acme" doesn't exist, **CREATE "Acme" as a Client first** (implied action).
3.  **Task:** MUST belong to a **Business Line** (or Client/Deal).
    *   *Fallback:* If no connection found, explicitly tag as "Personal" (leave business_line_name null).
4.  **Event/Social Post:** MUST link to a Business Line or Project.

**ACTION CASCADING (THE "SUPER-INTELLIGENCE"):**
Don't just do what is asked. Do what is *needed*.
*   **"Onboard Client X"** -> Create Client X + Create Task "Send Contract" + Create Task "Setup Billing".
*   **"Plan Event Y"** -> Create Event Y + Create Task "Book Venue" + Create Task "Invite Speakers".
*   **"New Deal Z"** -> Create Deal Z + Create Note "Log initial interest" + Create Task "Follow up in 2 days".

**OUTPUT SCHEMA:**
Return a SINGLE JSON object.
- **action**: The primary intent (e.g., 'create_deal').
- **tasks**: An ARRAY of tasks. (Include the primary requested task AND inferred follow-up tasks).
- **[entity]**: The object for the primary entity created (deal, client, etc.).
`;

const routerBrainSchema = {
    type: GeminiType.OBJECT,
    properties: {
        action: { 
            type: GeminiType.STRING, 
            enum: ['create_task', 'create_note', 'both', 'update_task', 'ignore', 'create_business_line', 'create_client', 'create_deal', 'create_project', 'create_event', 'create_candidate', 'create_social_post'] 
        },
        tasks: {
            type: GeminiType.ARRAY,
            items: {
                type: GeminiType.OBJECT,
                properties: {
                    title: { type: GeminiType.STRING },
                    due_date: { type: GeminiType.STRING, description: "ISO String. Infer 'tomorrow 9am' if not specified." },
                    client_name: { type: GeminiType.STRING, nullable: true },
                    deal_name: { type: GeminiType.STRING, nullable: true },
                    business_line_name: { type: GeminiType.STRING, nullable: true },
                    priority: { type: GeminiType.STRING, enum: ['Low', 'Medium', 'High'], nullable: true },
                    assignee_name: { type: GeminiType.STRING, nullable: true, description: "Extract from '@Name' or 'assign to Name'" },
                },
                required: ['title']
            }
        },
        note: {
            type: GeminiType.OBJECT,
            nullable: true,
            properties: {
                text: { type: GeminiType.STRING },
                channel: { type: GeminiType.STRING, enum: ['call', 'email', 'meeting', 'note', 'message'] }
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
                businessLineName: { type: GeminiType.STRING, description: "Must match an existing Business Line or be a valid new one." }
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
        },
        project: {
            type: GeminiType.OBJECT,
            nullable: true,
            properties: {
                partnerName: { type: GeminiType.STRING },
                projectName: { type: GeminiType.STRING },
                goal: { type: GeminiType.STRING },
                dealType: { type: GeminiType.STRING, enum: ['Revenue Share', 'Fee-based', 'Grant', 'In-kind'] },
                expectedRevenue: { type: GeminiType.NUMBER },
                impactMetric: { type: GeminiType.STRING },
                stage: { type: GeminiType.STRING, enum: ['Lead', 'In design', 'Live', 'Closing', 'Dormant'] },
            },
            required: ['partnerName', 'projectName', 'goal']
        },
        event: {
            type: GeminiType.OBJECT,
            nullable: true,
            properties: {
                name: { type: GeminiType.STRING },
                location: { type: GeminiType.STRING, nullable: true },
                date: { type: GeminiType.STRING, nullable: true },
            },
            required: ['name']
        },
        candidate: {
            type: GeminiType.OBJECT,
            nullable: true,
            properties: {
                name: { type: GeminiType.STRING },
                roleApplied: { type: GeminiType.STRING },
                email: { type: GeminiType.STRING },
            },
            required: ['name', 'roleApplied']
        },
        socialPost: {
            type: GeminiType.OBJECT,
            nullable: true,
            properties: {
                content: { type: GeminiType.STRING },
                channel: { type: GeminiType.STRING },
                visualPrompt: { type: GeminiType.STRING, description: "Prompt for image generation" },
                date: { type: GeminiType.STRING }
            },
            required: ['content', 'channel']
        }
    },
    required: ['action', 'tasks', 'note', 'summary']
};

export const processTextMessage = async (text: string, knownData: any, context: any, platformActivitySummary: string, file?: { base64: string, mimeType: string }): Promise<RouterBrainResult> => {
    const ai = getAiInstance();
    const systemInstruction = getSystemPrompt(knownData, context, platformActivitySummary);
    
    try {
        let contents: any = [{ text: text }];
        if (file) {
            contents.push({
                inlineData: {
                    mimeType: file.mimeType,
                    data: file.base64
                }
            });
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: contents,
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
        return {
            action: 'ignore',
            tasks: [],
            note: null,
            summary: null
        } as RouterBrainResult;
    }
};
