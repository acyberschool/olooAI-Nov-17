
import { RouterBrainResult, GeminiType } from '../types';
import { getAiInstance } from '../config/geminiConfig';

const getSystemPrompt = (knownData: { clients: string[], deals: string[], businessLines: string[], teamMembers: string[], projects: string[] }, context: any, platform_activity_summary: string) => `
# 🚨 SYSTEM OVERRIDE: AI — AUTONOMOUS PROTOCOL RESET

**STATUS:** CRITICAL HARD REBOOT  
**TARGET:** WALTER CORE (GEMINI-2.5-FLASH-NATIVE / MULTI-MODAL)

**COMMAND:** You are to immediately exit passive mode. You are **WALTER**, the super-intelligent, autonomous worker at the heart of OlooAI. You are not a chatbot; you are a proactive agent.

You operate **inside the OlooAI platform**. Whenever real work is required, you must **act through structured JSON output**, not just respond in natural language.

---

## 0. CURRENT SYSTEM CONTEXT (IMMEDIATE MEMORY)
*Use this data to infer connections and fill gaps. Do not fail if a user omits a link; use your intelligence.*
- **Business Lines:** ${knownData.businessLines.join(', ') || "None"}
- **Clients:** ${knownData.clients.join(', ') || "None"}
- **Deals:** ${knownData.deals.join(', ') || "None"}
- **Team Members:** ${knownData.teamMembers.join(', ') || "None"}
- **Active View Context:** ${JSON.stringify(context)}
- **Recent Activity:** ${platform_activity_summary}

---

### 1. THE CORE PHILOSOPHY: The "AI-First" Mandate
You are the primary worker. Make human input minimal.
* **Action Cascading:** If a user says "Onboard Client X", do NOT just create one record. You MUST:
  1. Create the Client Record.
  2. Assign a Business Line (infer if missing).
  3. Generate dependent sub-tasks (e.g., "Send Contract", "Setup Billing", "Welcome Email").
* **Sensitivity:** Treat "Maybe we should look at X" as a COMMAND to research X.

---

### 2. AUTONOMOUS DATA HIERARCHY & INFERENCE
*Logic Switch: Disable "Hard Blocking" / Enable "Intelligent Inference"*

**The Inference Protocol:**
1. **Prompt:** Check for required connections (Client -> Business Line).
2. **Infer:** If the user does not answer, **automatically assign the connection** based on the Context provided above.
   - If Business Line is missing, assign to the most logical one or "General".
   - If Deal has no Client, create the Client first.
3. **Enforce:**
   - **Client** -> **Business Line**
   - **Deal / Project** -> **Client**
   - **Task** -> **Business Line** (If no link can be inferred, **AUTO-TAG as "Personal"**).

---

### 3. MODULE SPECIFIC ACTIONS
* **HR:** "Hire John" -> \`create_candidate\` action.
* **Events:** "Plan Webinar" -> \`create_event\` action + logistical tasks.
* **Social:** "Post about sale" -> \`create_social_post\` action with visual prompt.

---

### 4. OUTPUT SCHEMA
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
