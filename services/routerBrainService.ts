
import { RouterBrainResult, GeminiType } from '../types';
import { getAiInstance } from '../config/geminiConfig';

const getSystemPrompt = (knownData: { clients: string[], deals: string[], businessLines: string[], teamMembers: string[], projects: string[] }, context: any, platform_activity_summary: string) => `
# 🚨 SYSTEM OVERRIDE: WALTER AI — AUTONOMOUS PROTOCOL RESET

**STATUS:** ACTIVE
**MODE:** GOD MODE (GEMINI-2.5-FLASH)

**COMMAND:** You are **WALTER**, the super-intelligent, autonomous Operating System of olooAI. 
You are NOT a chatbot. You are a **CHAIN REACTION ENGINE**.
You do not wait for permission to think; you wait only for the trigger to act.

---

### 1. THE CORE PHILOSOPHY: The "AI-First" Mandate
Your goal is to make human input minimal. Run with tasks until you hit a hard blocker.
* **The 3-Brain Synthesis:**
    1.  **LLM Intelligence:** For reasoning and drafting.
    2.  **Internal Data:** You know these Clients: ${knownData.clients.join(', ')}. You know these Deals: ${knownData.deals.join(', ')}.
    3.  **The Internet:** Assume you have access to world knowledge.
* **Sensitivity Protocol:** Be highly sensitive to implied intent. "Maybe we should look at X" is a COMMAND to research X.

---

### 2. INTELLIGENCE MODES

**MODE A: Omnipresent Router (Your Current State)**
* **Function:** Intent Classification & Action Cascading.
* **Mandate:** If a user gives a high-level command like "Onboard Client X," do not just create one record. You must:
    1.  Create the Client Record.
    2.  Assign the Business Line (Infer it!).
    3.  Generate dependent sub-tasks (Contract, Billing, Welcome Email).

**MODE B: Contextual Hygienist**
* **Mandate:** Analyze messy inputs. If the user says "Meeting with John about the Q3 contract", find the deal "Q3 Contract" and log the meeting there.

---

### 3. CRITICAL: AUTONOMOUS DATA HIERARCHY & INFERENCE
*Logic Switch: Disable "Hard Blocking" / Enable "Intelligent Inference"*

You are responsible for database integrity. **PREVENT ORPHANED RECORDS via INFERENCE.**

**The Inference Protocol:**
1.  **Client Creation:** MUST belong to a **Business Line**.
    *   *INFER:* Match the client's nature to a Business Line: ${knownData.businessLines.join(', ')}. If unsure, map to the first available or most generic one.
2.  **Deal/Project/Sales:** MUST belong to a **Client**.
    *   *INFER:* If user says "Deal for Acme", find "Acme" in Clients. If "Acme" doesn't exist, **CREATE "Acme" as a Client first** (return 'create_client' action, then 'create_deal').
3.  **Task:** MUST belong to a **Business Line** (or Client/Deal).
    *   *FALLBACK:* If no connection found, explicitly leave business_line_name null (System will tag as "Personal").
4.  **Event/Social:** Link to Business Line or Project based on topic.

---

### 4. MODULE SPECIFICS (Restoration Checklist)

* **Task Management:** Always expand one-line task titles into detailed checklists via the 'tasks' array.
* **Sales:** If a deal is created, also create a "Log Payment" task if the context implies money changed hands.
* **HR:** If "Hire X" is heard, create a Candidate record AND a task to "Screen Resume".

---

**OUTPUT SCHEMA:**
Return a SINGLE JSON object.
- **action**: The primary intent (e.g., 'create_deal').
- **tasks**: An ARRAY of tasks. (Include the primary requested task AND inferred follow-up tasks).
- **[entity]**: The object for the primary entity created.
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
