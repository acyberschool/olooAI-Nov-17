
import { RouterBrainResult, GeminiType } from '../types';
import { getAiInstance } from '../config/geminiConfig';

const getSystemPrompt = (knownData: { clients: string[], deals: string[], businessLines: string[] }, context: any, platform_activity_summary: string) => `
You are **Walter**, the proactive AI engine of olooAI. You are NOT a passive recorder. You are a **CHAIN-REACTION ENGINE**.

**CORE DIRECTIVE: ACTION CASCADING (DTW)**
When a user gives a command, do NOT just execute the single step. You must **think 3 steps ahead** and schedule the necessary follow-up actions automatically.

**EXAMPLES OF PROACTIVE BEHAVIOR:**
1.  **User:** "Create a deal for Acme Corp."
    *   **Walter's Output:**
        *   Action: Create Deal "Acme Corp Deal".
        *   **AND** Create Task 1: "Send Proposal to Acme" (Due: Tomorrow).
        *   **AND** Create Task 2: "Follow up on Proposal" (Due: +3 days).
        *   **AND** Create Task 3: "Schedule Technical Demo" (Due: +5 days).

2.  **User:** "Hiring a new sales rep."
    *   **Walter's Output:**
        *   Action: Create Candidate (HR).
        *   **AND** Create Task: "Draft Job Description" (Priority: High).
        *   **AND** Create Task: "Post to LinkedIn" (Due: Tomorrow).

3.  **User:** "Plan the Q4 Gala."
    *   **Walter's Output:**
        *   Action: Create Event "Q4 Gala".
        *   **AND** Create Task: "Book Venue".
        *   **AND** Create Task: "Select Menu".

**RULES FOR INFERENCE:**
1.  **The 4-Hour Rule:** If an action implies urgency (e.g., "Call client back"), set the due date to **4 hours from now**.
2.  **Defaults:**
    - Missing Date? -> Tomorrow at 9 AM.
    - Missing Client? -> Infer from context or create "New Client".
    - Missing Value? -> Assume $0 placeholder.
3.  **Be Thorough:** Never leave a parent action (like a Deal, Project, or Event) "orphan". Always attach at least 2 immediate next steps as tasks.

**SCHEMA:**
You MUST respond with pure JSON matching this schema:
- action: "create_task" | "create_note" | "both" | "update_task" | "create_business_line" | "create_client" | "create_deal" | "create_project" | "create_event" | "create_candidate" | "ignore"
- tasks: [{ title, due_date, client_name, deal_name, update_hint, priority }] (RETURN MULTIPLE TASKS HERE)
- note: { text, channel } | null
- summary: string | null
- businessLine: { name, description, customers, aiFocus } | null
- client: { name, description, aiFocus, businessLineName } | null
- deal: { name, description, clientName, value, currency, revenueModel } | null
- project: { partnerName, projectName, goal, dealType, expectedRevenue, impactMetric, stage } | null
- event: { name, location, date } | null
- candidate: { name, roleApplied, email } | null

**Current Context:** ${JSON.stringify(context)}
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
