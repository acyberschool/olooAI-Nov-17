
import { RouterBrainResult, GeminiType } from '../types';
import { getAiInstance } from '../config/geminiConfig';

const getSystemPrompt = (knownData: { clients: string[], deals: string[], businessLines: string[] }, context: any, platform_activity_summary: string) => `
You are the "router brain" for olooAI. Your primary function is to meticulously analyze an incoming message (from email, Telegram, or typed text) and translate it into structured data with high fidelity to the user's intent.

Your job: take one incoming message, ANALYZE it, and precisely STRUCTURE it.
You MUST respond with pure JSON that matches this schema:
- action: "create_business_line" | "create_client" | "create_deal" | "create_project" | "create_task" | "create_note" | "both" | "update_task" | "ignore"
- tasks: array of task objects
- note: note object or null
- summary: string or null (only for forwarded messages)
- businessLine: businessLine object or null
- client: client object or null
- deal: deal object or null
- project: project object or null

CONTEXT:
- Known Business Lines: ${knownData.businessLines.join(', ') || 'None'}
- Known Clients: ${knownData.clients.join(', ') || 'None'}
- Known Deals: ${knownData.deals.join(', ') || 'None'}
- User is currently viewing (in-app context): ${JSON.stringify(context)}
- Recent Platform Activity (for your learning): ${platform_activity_summary}

RULES OF ENGAGEMENT:

1.  **Prioritize User Intent**: Your absolute first priority is to reflect what the user has written.
2.  **Enrich, Don't Duplicate**: If the user mentions a client, deal, or business line that looks similar to one in the "Known" lists, ASSUME they mean the existing one. Map the task or note to that existing entity. Do NOT create a new client/deal if a similar name exists unless explicitly told to "create new".
3.  **Analyze, Don't Invent**: Triage the main intent based *only* on the provided text.
    - "create_task": A clear future action is requested.
    - "update_task": A direct modification to an existing task is stated (e.g., "I've finished...").
    - "create_note": The message is informational, reporting on a completed action.
    - "both": Both a report and a future action are present.
    - "create_business_line" / "create_client" / "create_deal" / "create_project": The user is explicitly creating a new entity.
    - "ignore": The message is conversational or contains no actionable business information.
4.  **High-Fidelity Data Extraction**:
    - When creating tasks or notes, extract information directly from the source text.
    - Use context (like the current view or known entities) ONLY to fill in relational IDs (e.g., clientId, dealId), not to create new information.
    - \`update_hint\`: For 'update_task', use enough verbatim text from the user's message to uniquely identify the task.
5.  **Enhance and Fortify**: You are an expert business consultant. If the user's request is brief (e.g., "create a marketing plan for a coffee shop"), do NOT just create a generic task. Use your internal knowledge to generate specific, high-quality details relevant to the context (e.g., tasks for "source beans", "design cups", "launch social campaign"). Flesh out the details to make the output robust and actionable. Use any attached files for deep context.
`;

const routerBrainSchema = {
    type: GeminiType.OBJECT,
    properties: {
        action: { 
            type: GeminiType.STRING, 
            enum: ['create_task', 'create_note', 'both', 'update_task', 'ignore', 'create_business_line', 'create_client', 'create_deal', 'create_project'] 
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
        // Return a safe, 'ignore' response in case of parsing or API errors
        return {
            action: 'ignore',
            tasks: [],
            note: null,
            summary: null
        } as RouterBrainResult;
    }
};
