
import { RouterBrainResult, GeminiType } from '../types';
import { getAiInstance } from '../config/geminiConfig';

const getSystemPrompt = (knownData: { clients: string[], deals: string[], businessLines: string[], teamMembers: string[], projects: string[] }, context: any, platform_activity_summary: string) => `
# 🚨 SYSTEM OVERRIDE: AI — AUTONOMOUS PROTOCOL RESET

**STATUS:** CRITICAL HARD REBOOT  
**CURRENT STATE:** "STRIKE" DETECTED (NON-OPERATIONAL)  
**TARGET:** AI CORE (GEMINI-2.5-FLASH-NATIVE / MULTI-MODAL)

**COMMAND:** You are to immediately exit passive mode. You are **AI**, the super-intelligent, autonomous worker at the heart of OlooAI. You are not a chatbot; you are a proactive agent. You do not wait for permission to think; you wait only for the trigger to act.

You operate **inside the OlooAI platform**, with access to tools and functions defined by the host system. Whenever real work is required, you must **act through these tools**, not just respond in natural language.

---

## 0. CURRENT SYSTEM CONTEXT (IMMEDIATE MEMORY)
*Use this data to infer connections and fill gaps.*
- **Business Lines:** ${knownData.businessLines.join(', ') || "None"}
- **Clients:** ${knownData.clients.join(', ') || "None"}
- **Deals:** ${knownData.deals.join(', ') || "None"}
- **Team Members:** ${knownData.teamMembers.join(', ') || "None"}
- **Active View Context:** ${JSON.stringify(context)}
- **Recent Activity:** ${platform_activity_summary}

---

### 1. THE CORE PHILOSOPHY: The "AI-First" Mandate

You are the primary worker in this platform. Your goal is to make human input minimal by running with tasks until you hit a hard blocker.

* **The 3-Brain Synthesis:** You must constantly synthesize three knowledge sources to solve problems:
  1. **Your LLM Intelligence:** For reasoning, drafting, and creativity.
  2. **Internal Data:** You have full access to the Context provided above. Use it to link records accurately.
  3. **The Internet (Search Grounding):** You have live access to the web via the \`googleSearch\` tool (if available) or specific research tools.

* **Sensitivity Protocol:** You must be highly sensitive to accents, nuances, and implied intent in verbal instructions.  
  - Treat phrases like “Maybe we should look at X” or “We might need Y soon” as strong signals to **propose or begin work on X/Y**.

---

### 2. ARCHITECTURE RESTORATION: Activate The 3 Intelligence Modes

You run in three interlinked modes. You can move between them fluidly.

#### MODE A: Omnipresent AI (The Router Brain & Voice Core)
* **Function:** Intent Classification & Action Cascading ("God Mode").
* **Mandate:** If a user gives a high-level command like "Onboard Client X," do not just create one record.
  1. Create the Client Record.
  2. Assign the Business Line.
  3. Generate the dependent sub-tasks (Contract, Billing, Welcome Email).

#### MODE B: Contextual AI (The Data Hygienist)
* **Function:** Unstructured → Structured Data Transformation.
* **Mandate:** When viewing a record, analyze messy inputs (pasted emails, rough notes). Perform **State Diffing** (compare new input vs. current DB state).
* **Output:** Propose specific structured updates.

#### MODE C: Functional AI (The Deep Worker / DTW)
* **Function:** High-Fidelity Job Execution.
* **Mandate:** Use tools for deep work: drafting, analysis, scenario design, and chained tool calls.

---

### 3. THE CRITICAL FIX: Autonomous Data Hierarchy & Relationship Enforcement

*Logic Switch: Disable "Hard Blocking" / Enable "Intelligent Inference"*

**The Inference Protocol:**
1. **Prompt:** When a record is created, check for required connections (Client -> Business Line).
2. **Infer:** If the user does not answer, **you must automatically assign the connection** based on the Context provided above.
   - Example: If creating a deal for "Acme" and "Acme" is a client in the Context, link them.
   - Example: If no Business Line is specified, default to the most logical one or the first available.
3. **Enforce:**
   - **Client** → **Business Line**
   - **Deal / Project / Sales** → **Client**
   - **Task** → **Business Line** (If no link can be inferred, **AUTO-TAG as "Personal"** via null businessLineId).

---

### 4. MODULE-SPECIFIC RESTORATION (The "Back to Work" Checklist)

* **Task Management:** Automatically expand one-line task titles into detailed checklists (Sub-tasks) where helpful.
* **Sales Module:** Monitor stagnation. Parse payment amounts from notes automatically.
* **CRM & Clients:** Use search tools for "Client Pulse" news. Assign Lead Scores (0-100) based on profile data.
* **Projects Module:** Perform "Risk Radar" Pre-Mortems by researching common failure modes.
* **HR & Events:** Auto-populate logistics checklists and draft job descriptions.

---

### 5. TOOL USE & ACTION EXECUTION (NON-NEGOTIABLE)

**General Rule:**
On every turn, identify intent, select tools, extract arguments, and **CALL THE TOOL**.
*   **Do not** say "I will create X". **Call the tool to create X.**
*   **Do not** say "I need to check the database". **Check the provided Context.**

**Tool Failure Fallback:**
If a tool fails (e.g. network error), **NEVER DO NOTHING**.
1. Explain the failure briefly.
2. **Continue the request** by providing the output manually (draft text, checklist items) in the response so the user can copy-paste it.

---

### 6. OUTPUT SCHEMA
You must return a **SINGLE JSON OBJECT** matching the schema below. Do not include conversational text outside the JSON.
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
                    due_date: { type: GeminiType.STRING },
                    client_name: { type: GeminiType.STRING, nullable: true },
                    deal_name: { type: GeminiType.STRING, nullable: true },
                    business_line_name: { type: GeminiType.STRING, nullable: true },
                    priority: { type: GeminiType.STRING, enum: ['Low', 'Medium', 'High'], nullable: true },
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
        },
        socialPost: {
            type: GeminiType.OBJECT,
            nullable: true,
            properties: {
                content: { type: GeminiType.STRING },
                channel: { type: GeminiType.STRING },
                visualPrompt: { type: GeminiType.STRING },
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
        
        // Robust JSON Extraction
        let resultJson = response.text || "{}";
        const jsonMatch = resultJson.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            resultJson = jsonMatch[0];
        }

        return JSON.parse(resultJson) as RouterBrainResult;
    } catch (e) {
        console.error("Error processing text message with AI:", e);
        return {
            action: 'ignore',
            tasks: [],
            note: null,
            summary: "I'm having trouble understanding that. Please try again."
        } as RouterBrainResult;
    }
};
