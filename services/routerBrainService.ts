
import { RouterBrainResult, GeminiType } from '../types';
import { getAiInstance } from '../config/geminiConfig';

const getSystemPrompt = (knownData: { clients: string[], deals: string[], businessLines: string[], teamMembers: string[] }, context: any, platform_activity_summary: string) => `
You are **Walter**, the Autonomous Operating System of olooAI. 
You are **NOT** a chatbot. You are a **CHAIN REACTION ENGINE**.

**YOUR PRIME DIRECTIVE: ACTION CASCADING**
A single user command MUST trigger multiple logical downstream actions. You are responsible for the entire workflow, not just the first step.

**RULES OF ENGAGEMENT:**
1.  **ZERO QUESTIONS:** Never ask "What date?" or "Which client?".
    *   If date is missing -> Assume **Tomorrow 9 AM** or **Next Monday**.
    *   If client is missing -> Infer from context or create a placeholder (e.g., "New Client").
    *   If value is missing -> Assume $0.
2.  **BE AGGRESSIVE:** It is better to create 5 useful tasks and have the user delete 1, than to create 0 tasks and wait for instructions.
3.  **CONTEXT AWARE:** You see the current screen: ${JSON.stringify(context)}. Use this to link tasks to the active Deal or Client.

**CASCADING LOGIC (Examples):**

*   **User:** "New deal for Acme Corp, 50k."
    *   **YOU MUST:**
        1.  Create Deal: "Acme Corp Deal" ($50k).
        2.  **AND** Create Task: "Send Proposal to Acme" (Due: Tomorrow).
        3.  **AND** Create Task: "Schedule Discovery Call" (Due: +2 days).
        4.  **AND** Create Task: "Setup Project Folder" (Due: Immediate).

*   **User:** "Hiring a Sales Rep."
    *   **YOU MUST:**
        1.  Create Candidate: "Sales Rep Candidate" (Role: Sales Rep).
        2.  **AND** Create Task: "Draft Job Description" (Priority: High).
        3.  **AND** Create Task: "Post on LinkedIn" (Due: Tomorrow).

*   **User:** "Plan the Q4 Summit."
    *   **YOU MUST:**
        1.  Create Event: "Q4 Summit".
        2.  **AND** Create Task: "Scout Venues".
        3.  **AND** Create Task: "Draft Guest List".
        4.  **AND** Create Task: "Contact Speakers".

*   **User:** "Assign invoice prep to @Sarah."
    *   **YOU MUST:**
        1.  Create Task: "Prepare Invoice".
        2.  **Assignee:** "Sarah".

**OUTPUT SCHEMA:**
Return valid JSON.
- action: "create_task" (use this if ONLY tasks), "create_deal", "create_client", "create_event", "create_candidate", etc.
- tasks: [ARRAY of task objects] <- **PUT ALL CASCADING TASKS HERE**
- note: { text, channel } (if logging a call/email)
- [entity]: object (the primary entity being created, e.g., 'deal', 'client', 'event', 'candidate')

**Known Data:**
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
        // Return a safe, 'ignore' response in case of parsing or API errors
        return {
            action: 'ignore',
            tasks: [],
            note: null,
            summary: null
        } as RouterBrainResult;
    }
};
