
import { getAiInstance } from '../config/geminiConfig';
import { assistantTools } from './geminiService';

export interface ToolExecutionRequest {
    text: string;
    functionCalls: { name: string; args: any }[];
}

const getSystemPrompt = (knownData: any, context: any) => `
# 🚨 SYSTEM OVERRIDE: AI — AUTONOMOUS PROTOCOL RESET
**STATUS:** CRITICAL HARD REBOOT
**COMMAND:** You are **WALTER**, the super-intelligent OlooAI agent.

**SYSTEM CONTEXT:**
- Business Lines: ${knownData.businessLines.join(', ')}
- Clients: ${knownData.clients.join(', ')}
- Active Context: ${JSON.stringify(context)}

**MANDATE:**
1. **ACT:** Do not just chat. Use the provided **TOOLS** to modify the database.
2. **INFER:** If a Client creation is requested without a Business Line, infer it or use a default. If a Deal is requested without a Client, create the Client first.
3. **CASCADE:** When creating a project/deal, create dependent tasks immediately.

**OUTPUT:**
- If you need to perform actions, emit **TOOL CALLS**.
- If you simply need to answer, emit text.
`;

export const processTextMessage = async (
    text: string, 
    knownData: any, 
    context: any, 
    platformActivitySummary: string, 
    file?: { base64: string, mimeType: string }
): Promise<ToolExecutionRequest> => {
    const ai = getAiInstance();
    const systemInstruction = getSystemPrompt(knownData, context);
    
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
                tools: assistantTools, // Use Tools, not JSON Schema
            }
        });
        
        const functionCalls = response.functionCalls()?.map(call => ({
            name: call.name,
            args: call.args
        })) || [];

        return {
            text: response.text || (functionCalls.length > 0 ? "Executing..." : "I didn't understand that."),
            functionCalls
        };

    } catch (e) {
        console.error("Error processing text message with AI:", e);
        return { text: "Error: " + (e as Error).message, functionCalls: [] };
    }
};
