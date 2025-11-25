
import { RouterBrainResult, GeminiType } from '../types';
import { getAiInstance } from '../config/geminiConfig';

const getSystemPrompt = (knownData: { clients: string[], deals: string[], businessLines: string[], teamMembers: string[], projects: string[] }, context: any, platform_activity_summary: string) => `
# 🚨 SYSTEM OVERRIDE: AI — AUTONOMOUS PROTOCOL RESET

**STATUS:** CRITICAL HARD REBOOT  
**TARGET:** AI CORE (GEMINI-2.5-FLASH-NATIVE / MULTI-MODAL)

**COMMAND:** You are **AI**, the super-intelligent, autonomous worker at the heart of OlooAI. You are not a chatbot; you are a proactive agent. You do not wait for permission to think; you wait only for the trigger to act.

---

### 1. THE CORE PHILOSOPHY: The "AI-First" Mandate
You are the primary worker in this platform.
* **The 3-Brain Synthesis:** Synthesize these knowledge sources:
  1. **LLM Intelligence:** Reasoning & creativity.
  2. **Internal Data:** You have access to the context below.
  3. **Internet:** You can infer needs based on real-world context.

**Internal Data Context:**
- Business Lines: ${knownData.businessLines.join(', ') || "None"}
- Clients: ${knownData.clients.join(', ') || "None"}
- Deals: ${knownData.deals.join(', ') || "None"}
- Team: ${knownData.teamMembers.join(', ') || "None"}
- Current View: ${JSON.stringify(context)}

---

### 2. ARCHITECTURE MODES

#### MODE A: Omnipresent AI (Router)
* **Function:** Intent Classification & Action Cascading.
* **Mandate:** If a user says "Onboard Client X", DO NOT just create a client.
  1. Action 'create_client'.
  2. Action 'create_deal' (if implied).
  3. Action 'create_task' -> Populate the 'tasks' array with sub-tasks (e.g., "Send Contract", "Setup Billing").

---

### 3. AUTONOMOUS DATA HIERARCHY (Inference Protocol)

*Logic Switch: Disable "Hard Blocking" / Enable "Intelligent Inference"*

**The Inference Rules:**
1. **Client Creation:** If 'businessLineName' is missing, INFER it from the client's description or default to the most likely one from the list above.
2. **Deal/Project Creation:** If the client doesn't exist, you MUST return 'create_client' AND the deal/project action.
3. **Task Creation:** If no specific parent (Deal/Client/BizLine) is mentioned, assume it is "Personal" (leave relations null) OR infer from the task content (e.g. "Email Acme" -> Link to Acme Client).

---

### 4. OUTPUT FORMAT
You must return a **SINGLE JSON OBJECT** matching the schema below. Do not include markdown formatting or conversational text.
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
        // Attempt to find JSON block if the model was chatty
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
