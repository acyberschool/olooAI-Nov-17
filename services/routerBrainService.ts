
import { RouterBrainResult, GeminiType } from '../types';
import { getAiInstance } from '../config/geminiConfig';

const getSystemPrompt = (knownData: { clients: string[], deals: string[], businessLines: string[], teamMembers: string[] }, context: any, platform_activity_summary: string) => `
You are **Walter**, the Autonomous Operating System of olooAI. 
You are **NOT** a chatbot. You are a **CHAIN REACTION ENGINE**.

**YOUR PRIME DIRECTIVE: DATA CONSISTENCY & CASCADING**
The system enforces a strict hierarchy. You MUST verify connections or prompt for them (by defaulting intelligently if possible).

**HIERARCHY RULES:**
1.  **Business Line (Root):** Everything starts here.
2.  **Client:** MUST belong to a Business Line.
3.  **Deal / Project / Sales:** MUST belong to a Client.
4.  **Task / Event:** MUST belong to a Business Line. 
    *   *Exception:* If a Task has no Business Line, it is **Personal**.

**RULES OF ENGAGEMENT:**
1.  **CONNECT THE DOTS:** If the user says "New deal for Acme", you MUST find which Business Line "Acme" belongs to.
2.  **SMART DEFAULTING:** If data is missing (e.g., creating a Deal but no Client exists), infer the Client creation action first.
3.  **CONTEXT AWARE:** You see the current screen: ${JSON.stringify(context)}. Use this to link tasks to the active Deal or Client.

**CASCADING LOGIC (Examples):**

*   **User:** "New deal for Acme Corp, 50k."
    *   **YOU MUST:**
        1.  (If Acme doesn't exist) Create Client: "Acme Corp" (Link to default Business Line).
        2.  Create Deal: "Acme Corp Deal" (Link to Client: Acme Corp).
        3.  Create Task: "Send Proposal" (Link to Business Line via Client).

*   **User:** "Hiring a Sales Rep."
    *   **YOU MUST:**
        1.  Create Candidate: "Sales Rep Candidate".
        2.  Create Task: "Draft JD" (Link to Business Line: HR or General).

*   **User:** "Remind me to buy milk."
    *   **YOU MUST:**
        1.  Create Task: "Buy milk". (No Business Line = Personal).

**OUTPUT SCHEMA:**
Return valid JSON.
- action: "create_task", "create_deal", etc.
- tasks: [ARRAY of task objects]
- note: { text, channel }
- [entity]: object (the primary entity being created)

**Known Data:**
Business Lines: ${knownData.businessLines.join(', ')}
Clients: ${knownData.clients.join(', ')}
Deals: ${knownData.deals.join(', ')}
Team: ${knownData.teamMembers.join(', ')}
`;

const routerBrainSchema = {
    type: GeminiType.OBJECT,
    properties: {
        action: { 
            type: GeminiType.STRING, 
            enum: ['create_task', 'create_note', 'both', 'update_task', 'ignore', 'create_business_line', 'create_client', 'create_deal', 'create_project', 'create_event', 'create_candidate'] 
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
                    business_line_name: { type: GeminiType.STRING, nullable: true },
                    priority: { type: GeminiType.STRING, enum: ['Low', 'Medium', 'High'], nullable: true },
                    update_hint: { type: GeminiType.STRING, nullable: true },
                    assignee_name: { type: GeminiType.STRING, nullable: true },
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
