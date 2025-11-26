
import { getAiInstance } from '../config/geminiConfig';
import { DelegationPlan, GeminiSchema, GeminiType } from '../types';

// Schema for the Plan Phase
const delegationPlanSchema: GeminiSchema = {
    type: GeminiType.OBJECT,
    properties: {
        summary_text: { type: GeminiType.STRING, description: "A friendly explanation of what Walter will do." },
        businessLinesToCreate: {
            type: GeminiType.ARRAY,
            items: { type: GeminiType.OBJECT, properties: { name: { type: GeminiType.STRING }, description: { type: GeminiType.STRING } } }
        },
        clientsToCreateOrUpdate: {
            type: GeminiType.ARRAY,
            items: { type: GeminiType.OBJECT, properties: { name: { type: GeminiType.STRING }, businessLineName: { type: GeminiType.STRING }, description: { type: GeminiType.STRING } } }
        },
        projectsToCreate: {
            type: GeminiType.ARRAY,
            items: { type: GeminiType.OBJECT, properties: { projectName: { type: GeminiType.STRING }, clientName: { type: GeminiType.STRING }, goal: { type: GeminiType.STRING } } }
        },
        dealsToCreate: {
            type: GeminiType.ARRAY,
            items: { type: GeminiType.OBJECT, properties: { name: { type: GeminiType.STRING }, clientName: { type: GeminiType.STRING }, value: { type: GeminiType.NUMBER }, stage: { type: GeminiType.STRING } } }
        },
        eventsToCreate: {
            type: GeminiType.ARRAY,
            items: { type: GeminiType.OBJECT, properties: { name: { type: GeminiType.STRING }, date: { type: GeminiType.STRING }, location: { type: GeminiType.STRING } } }
        },
        tasksToCreate: {
            type: GeminiType.ARRAY,
            items: { type: GeminiType.OBJECT, properties: { title: { type: GeminiType.STRING }, clientName: { type: GeminiType.STRING }, projectName: { type: GeminiType.STRING }, priority: { type: GeminiType.STRING } } }
        },
        wikiPagesToCreate: {
            type: GeminiType.ARRAY,
            items: { type: GeminiType.OBJECT, properties: { title: { type: GeminiType.STRING }, type: { type: GeminiType.STRING }, clientName: { type: GeminiType.STRING }, content: { type: GeminiType.STRING } } }
        },
        crmEntriesToCreate: {
            type: GeminiType.ARRAY,
            items: { type: GeminiType.OBJECT, properties: { summary: { type: GeminiType.STRING }, clientName: { type: GeminiType.STRING } } }
        }
    },
    required: ['summary_text']
};

export const planDelegation = async (
    files: { base64: string, mimeType: string, name: string }[],
    instruction: string,
    knownData: any
): Promise<DelegationPlan | null> => {
    const ai = getAiInstance();
    
    const contextStr = `
    **CURRENT SYSTEM DATA:**
    - Business Lines: ${knownData.businessLines.join(', ')}
    - Clients: ${knownData.clients.join(', ')}
    `;

    const systemInstruction = `
    You are WALTER, the autonomous Upload & Delegate agent.
    
    **Mission:**
    Read the user instruction and any attached files (notes, spreadsheets, docs).
    Design a comprehensive execution plan to structure this data into the olooAI platform.
    
    ${contextStr}
    
    **Rules:**
    1. Identify entities: Business Lines, Clients, Projects, Deals, Events, Tasks.
    2. Infer relationships: Connect Deals to Clients, Clients to Business Lines. Use existing names if they match.
    3. Generate Wiki Content: If a document is attached, plan to create a "Wiki Page" for the relevant client summarizing it.
    4. Bulk Actions: Handle large lists (e.g., 20 tasks).
    5. Output JSON: Strictly adhere to the schema. Do NOT execute tools yet. Just plan.
    `;

    try {
        const contents: any[] = [];
        
        if (instruction) {
            contents.push({ role: 'user', parts: [{ text: instruction }] });
        } else {
             contents.push({ role: 'user', parts: [{ text: "Analyze these files and organize the work." }] });
        }

        // Attach files
        files.forEach(file => {
            contents[0].parts.push({
                inlineData: {
                    mimeType: file.mimeType,
                    data: file.base64
                }
            });
        });

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: contents,
            config: {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: delegationPlanSchema
            }
        });

        if (response.text) {
            return JSON.parse(response.text) as DelegationPlan;
        }
        return null;

    } catch (e) {
        console.error("Walter's Desk Planning Error:", e);
        return null;
    }
};
