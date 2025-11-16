import { useState, useCallback } from 'react';
import { Task, KanbanStatus, TaskType, BusinessLine, Client, Deal, Document, DocumentCategory, Opportunity, DocumentOwnerType, Playbook, PlaybookStep, CRMEntry, CRMEntryType, Suggestion } from '../types';
import { initialTasks, initialBusinessLines, initialClients, initialDeals, initialDocuments, initialPlaybooks, initialCRMEntries } from '../data/mockData';
import { GoogleGenAI, Type } from '@google/genai';

export const useKanban = () => {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [businessLines, setBusinessLines] = useState<BusinessLine[]>(initialBusinessLines);
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [deals, setDeals] = useState<Deal[]>(initialDeals);
  const [documents, setDocuments] = useState<Document[]>(initialDocuments);
  const [playbooks, setPlaybooks] = useState<Playbook[]>(initialPlaybooks);
  const [crmEntries, setCrmEntries] = useState<CRMEntry[]>(initialCRMEntries);

  const addTask = useCallback((itemData: Partial<Omit<Task, 'id' | 'status' | 'type'>> & { itemType?: TaskType, title: string, businessLineName?: string }) => {
    let businessLineId = itemData.businessLineId;
    if (!businessLineId && itemData.businessLineName) {
        const businessLine = businessLines.find(bl => bl.name.toLowerCase() === itemData.businessLineName?.toLowerCase());
        businessLineId = businessLine?.id;
    }

    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: itemData.title,
      status: KanbanStatus.ToDo,
      type: itemData.itemType || TaskType.Task,
      ...itemData,
      businessLineId: businessLineId,
    };
    delete (newTask as any).itemType;
    delete (newTask as any).businessLineName;

    setTasks((prevTasks) => [newTask, ...prevTasks]);
    return `${newTask.type} "${newTask.title}" created successfully.`;
  }, [businessLines]);

  const generateAndAddPlaybook = useCallback(async (businessLine: BusinessLine) => {
    try {
        if (!process.env.API_KEY) throw new Error("API Key is not configured.");
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `Based on the following business line, generate a standard playbook with 5-7 simple steps from initial contact to a completed job. Return ONLY a valid JSON array of objects, where each object has a "title" and a "description". For example: [{"title": "Step 1", "description": "Details for step 1"}].\n\nName: ${businessLine.name}\nDescription: ${businessLine.description}\nCustomers: ${businessLine.customers}`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            description: { type: Type.STRING },
                        },
                        required: ["title", "description"],
                    },
                },
            },
        });

        const stepsRaw = JSON.parse(response.text.trim());
        const steps: PlaybookStep[] = stepsRaw.map((step: any, index: number) => ({
            id: `step-${Date.now()}-${index}`,
            ...step,
        }));

        const newPlaybook: Playbook = {
            id: `playbook-${Date.now()}`,
            businessLineId: businessLine.id,
            steps,
        };
        setPlaybooks(prev => [...prev, newPlaybook]);
    } catch (e) {
        console.error("Error generating playbook:", e);
    }
  }, []);

  const addBusinessLine = useCallback(async (data: Omit<BusinessLine, 'id'>) => {
    if (businessLines.some(bl => bl.name.toLowerCase() === data.name.toLowerCase())) {
      return `Business line "${data.name}" already exists.`;
    }
    const newBusinessLine: BusinessLine = {
      id: `bl-${Date.now()}`,
      ...data,
    };
    setBusinessLines(prev => [newBusinessLine, ...prev]);
    await generateAndAddPlaybook(newBusinessLine);
    return `Business line "${data.name}" created.`;
  }, [businessLines, generateAndAddPlaybook]);

  const updateBusinessLine = useCallback((id: string, data: Partial<Omit<BusinessLine, 'id'>>) => {
    setBusinessLines(prev => prev.map(bl => bl.id === id ? { ...bl, ...data } : bl));
    return `Business line "${data.name}" updated.`;
  }, []);
  
  const updatePlaybook = useCallback((playbookId: string, updatedSteps: PlaybookStep[]) => {
      setPlaybooks(prev => prev.map(p => p.id === playbookId ? { ...p, steps: updatedSteps } : p));
      return `Playbook updated.`;
  }, []);
  
  const addClient = useCallback((data: Omit<Client, 'id'> & { businessLineName?: string }) => {
    if (clients.some(c => c.name.toLowerCase() === data.name.toLowerCase())) {
      return `Client "${data.name}" already exists.`;
    }
    
    let foundBusinessLineId = data.businessLineId;
    if (data.businessLineName && !foundBusinessLineId) {
      const businessLine = businessLines.find(bl => bl.name.toLowerCase() === data.businessLineName?.toLowerCase());
      if (!businessLine) {
          return `I couldn't find the business line "${data.businessLineName}". Please create it first.`;
      }
      foundBusinessLineId = businessLine.id;
    }
    
    if (!foundBusinessLineId) {
        return "Could not create client: Business Line is required.";
    }

    const newClient: Client = {
      id: `client-${Date.now()}`,
      name: data.name,
      description: data.description,
      aiFocus: data.aiFocus,
      businessLineId: foundBusinessLineId,
    };
    setClients(prev => [newClient, ...prev]);
    return `Client "${data.name}" created.`;
  }, [clients, businessLines]);

  const updateClient = useCallback((id: string, data: Partial<Omit<Client, 'id'>>) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
    return `Client "${data.name}" updated.`;
  }, []);

  const addDeal = useCallback((data: Omit<Deal, 'id' | 'status' > & { clientName: string }) => {
    const client = clients.find(c => c.id === data.clientId || c.name.toLowerCase() === data.clientName.toLowerCase());
    if (!client) {
        return `I couldn't find the client "${data.clientName}". Please create them first.`;
    }
    if (deals.some(d => d.name.toLowerCase() === data.name.toLowerCase() && d.clientId === client.id)) {
      return `Deal "${data.name}" already exists for this client.`;
    }

    const playbook = playbooks.find(p => p.businessLineId === (data.businessLineId || client.businessLineId));

    const newDeal: Deal = {
      id: `deal-${Date.now()}`,
      name: data.name,
      description: data.description,
      status: 'Open',
      clientId: client.id,
      businessLineId: data.businessLineId || client.businessLineId,
      playbookId: playbook?.id,
    };
    setDeals(prev => [newDeal, ...prev]);
    return `Deal "${data.name}" created for client "${data.clientName}".`;
  }, [deals, clients, playbooks]);

  const updateDeal = useCallback((id: string, data: Partial<Omit<Deal, 'id'>>) => {
      setDeals(prev => prev.map(d => d.id === id ? { ...d, ...data } : d));
      return `Deal updated.`;
  }, []);

  const addDocument = useCallback((file: File, category: DocumentCategory, ownerId: string, ownerType: DocumentOwnerType, note?: string): Document => {
    const newDocument: Document = {
      id: `doc-${Date.now()}`,
      name: file.name,
      category,
      ownerId,
      ownerType,
      url: URL.createObjectURL(file), // Mock URL
      createdAt: new Date().toISOString(),
      note,
    };
    setDocuments(prev => [newDocument, ...prev]);
    return newDocument;
  }, []);


  const addCRMEntry = useCallback(async (clientId: string, rawContent: string, type: CRMEntryType, dealId?: string, file?: File) => {
    try {
        if (!process.env.API_KEY) throw new Error("API Key is not configured.");
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const client = clients.find(c => c.id === clientId);
        if (!client) return;

        let newDocumentId: string | undefined = undefined;
        if (file) {
            const newDoc = addDocument(file, 'Templates', clientId, 'client', `Attachment for CRM note on ${new Date().toLocaleDateString()}`);
            newDocumentId = newDoc.id;
        }

        // 1. Get Summary
        const summaryPrompt = `Summarize the following interaction with a client in one sentence. Client: ${client?.name}. Interaction: "${rawContent}"`;
        const summaryResponse = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: summaryPrompt });
        const summary = summaryResponse.text.trim();
        
        // 2. Get Suggestions
        const suggestionsPrompt = `Read this interaction with a client and suggest 1-2 concrete, actionable next-step tasks. Return ONLY a valid JSON array of objects, where each object has "text" and "taskTitle". If no action is needed, return an empty array [].\n\nInteraction: "${rawContent}"`;
        const suggestionsResponse = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: suggestionsPrompt });
        let suggestionsJson = suggestionsResponse.text.trim().replace(/^```json\s*|```\s*$/g, '');
        const suggestionsRaw = JSON.parse(suggestionsJson);

        const newSuggestions: Suggestion[] = suggestionsRaw.map((s: any) => ({
            id: `sugg-${Date.now()}-${Math.random()}`,
            text: s.text,
            taskData: { 
                title: s.taskTitle,
                clientId: clientId,
                dealId: dealId,
                businessLineId: client?.businessLineId
            }
        }));

        const newEntry: CRMEntry = {
            id: `crm-${Date.now()}`,
            clientId,
            dealId,
            type,
            rawContent,
            summary,
            createdAt: new Date().toISOString(),
            suggestions: newSuggestions,
            documentId: newDocumentId,
        };

        setCrmEntries(prev => [newEntry, ...prev]);

    } catch (e) {
        console.error("Error processing CRM entry:", e);
    }
  }, [clients, addDocument]);
  
  const addCRMEntryFromVoice = useCallback((data: { interactionType: CRMEntryType, content: string, clientName?: string, dealName?: string }) => {
    if (!data.clientName) {
        return "Sorry, I didn't catch the client's name.";
    }
    const client = clients.find(c => c.name.toLowerCase() === data.clientName?.toLowerCase());
    if (!client) {
        return `I couldn't find a client named "${data.clientName}".`;
    }
    let dealId: string | undefined = undefined;
    if (data.dealName) {
        const deal = deals.find(d => d.clientId === client.id && d.name.toLowerCase() === data.dealName?.toLowerCase());
        dealId = deal?.id;
    }

    addCRMEntry(client.id, data.content, data.interactionType, dealId);
    return `Note added to ${client.name}'s timeline.`;
  }, [clients, deals, addCRMEntry]);

  const generateNextStepSuggestions = useCallback(async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.dealId) return;

    const deal = deals.find(d => d.id === task.dealId);
    if (!deal) return;

    const playbook = playbooks.find(p => p.id === deal.playbookId);
    let nextStep: PlaybookStep | undefined;
    if (playbook && task.playbookStepId) {
        const currentStepIndex = playbook.steps.findIndex(s => s.id === task.playbookStepId);
        if (currentStepIndex > -1 && currentStepIndex < playbook.steps.length - 1) {
            nextStep = playbook.steps[currentStepIndex + 1];
        }
    }

    try {
        if (!process.env.API_KEY) throw new Error("API Key is not configured.");
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const client = clients.find(c => c.id === deal.clientId);
        const lastCRMEntry = crmEntries.filter(c => c.clientId === deal.clientId).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
        const dealDocuments = documents.filter(doc => doc.ownerId === deal.id).map(d => d.name).join(', ');

        let prompt = `A task was just completed for a deal. Based on all the context, suggest 1-2 concrete, actionable next-step tasks.
        Return ONLY a valid JSON array of objects, where each object has a "text" (the suggestion for the user) and a "taskTitle" (the title for the new task).
        
        CONTEXT:
        - Completed Task: "${task.title}"
        - Deal: "${deal.name}" (${deal.description}) for client ${client?.name}
        - Last conversation with client: ${lastCRMEntry ? `"${lastCRMEntry.summary}"` : "None recorded."}
        - Relevant documents for this deal: ${dealDocuments || 'None'}
        `;

        if (nextStep) {
            prompt += `- The next step in our standard process is: "${nextStep.title}" (${nextStep.description}). Base your suggestions on this step.`
        } else if (playbook) {
            prompt += `- This task wasn't part of our standard playbook. Use your own reasoning to figure out the best next step to move the deal forward.`
        } else {
            prompt += `- There is no standard playbook. Use your own reasoning to figure out the best next step to move the deal forward.`
        }
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
        });

        let jsonString = response.text.trim().replace(/^```json\s*|```\s*$/g, '');
        const suggestionsRaw = JSON.parse(jsonString);
        const newSuggestions: Suggestion[] = suggestionsRaw.map((s: any) => ({
            id: `sugg-${Date.now()}-${Math.random()}`,
            text: s.text,
            taskData: { 
                title: s.taskTitle,
                dealId: deal.id,
                clientId: deal.clientId,
                businessLineId: deal.businessLineId
            }
        }));

        setDeals(prev => prev.map(d => d.id === deal.id ? { ...d, suggestions: newSuggestions } : d));

    } catch (e) {
        console.error("Error generating next step:", e);
    }

  }, [tasks, deals, playbooks, clients, crmEntries, documents]);

  const updateTaskStatusById = useCallback(async (taskId: string, newStatus: KanbanStatus) => {
    let originalTask: Task | undefined;
    setTasks((prevTasks) => {
      originalTask = prevTasks.find(task => task.id === taskId);
      if (originalTask && originalTask.status !== newStatus) {
        return prevTasks.map((task) => 
          task.id === taskId ? { ...task, status: newStatus } : task
        );
      }
      return prevTasks;
    });

    if (originalTask && originalTask.status !== newStatus) {
        if (newStatus === KanbanStatus.Done) {
            await generateNextStepSuggestions(taskId);
        } else if (originalTask.clientId) {
            // Log other status changes to CRM for a paper trail
            let noteContent = '';
            let entryType: CRMEntryType = 'ai_action';
            switch(newStatus) {
                case KanbanStatus.Doing:
                    noteContent = `Started task: "${originalTask.title}"`;
                    break;
                case KanbanStatus.ToDo:
                    noteContent = `Task moved back to To Do: "${originalTask.title}"`;
                    break;
                case KanbanStatus.Terminated:
                    noteContent = `Task terminated: "${originalTask.title}"`;
                    break;
            }
            if (noteContent) {
                await addCRMEntry(originalTask.clientId, noteContent, entryType, originalTask.dealId);
            }
        }
    }
  }, [generateNextStepSuggestions, addCRMEntry]);

  const updateTaskStatusByTitle = useCallback((taskTitle: string, newStatus: KanbanStatus) => {
    let taskUpdated = false;
    let foundTaskTitle = '';
    let foundTaskId: string | null = null;

    setTasks((prevTasks) =>
      prevTasks.map((task) => {
        if (!taskUpdated && task.title.toLowerCase().includes(taskTitle.toLowerCase())) {
          taskUpdated = true;
          foundTaskTitle = task.title;
          foundTaskId = task.id;
          return { ...task, status: newStatus };
        }
        return task;
      })
    );
    
    if (foundTaskId) {
        updateTaskStatusById(foundTaskId, newStatus);
    }

    return taskUpdated ? `Task "${foundTaskTitle}" moved to ${newStatus}.` : `Sorry, I couldn't find a task with the title "${taskTitle}".`;
  }, [updateTaskStatusById]);

  const dismissSuggestions = useCallback((ownerType: 'client' | 'deal', ownerId: string) => {
    if (ownerType === 'client') {
        setClients(prev => prev.map(c => c.id === ownerId ? {...c, suggestions: []} : c));
    } else {
        setDeals(prev => prev.map(d => d.id === ownerId ? {...d, suggestions: []} : d));
    }
  }, []);
  
  const getOpportunities = useCallback(async (businessLine: BusinessLine, expand: boolean = false): Promise<Opportunity[]> => {
    try {
        if (!process.env.API_KEY) throw new Error("API Key is not configured.");
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `Based on the following business line, provide 3 simple, actionable opportunities. ${expand ? 'Provide new and different ideas from the last time.' : ''} Return ONLY a valid JSON array of strings. For example: ["Idea 1", "Idea 2", "Idea 3"]\n\nName: ${businessLine.name}\nDescription: ${businessLine.description}\nCustomers: ${businessLine.customers}\nAI Focus: ${businessLine.aiFocus}`;
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        let jsonString = response.text.trim().replace(/^```json\s*|```\s*$/g, '');
        const ideas: string[] = JSON.parse(jsonString);
        return ideas.map((idea, index) => ({ id: `opp-${Date.now()}-${index}`, text: idea }));
    } catch (e) {
        console.error("Error getting opportunities:", e);
        return [{ id: 'opp-error', text: "Sorry, I had trouble generating opportunities right now. Try again." }];
    }
  }, []);
  
  const getClientOpportunities = useCallback(async (client: Client, expand: boolean = false): Promise<Opportunity[]> => {
    try {
        if (!process.env.API_KEY) throw new Error("API Key is not configured.");
        const businessLine = businessLines.find(bl => bl.id === client.businessLineId);
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `Based on the following client, provide 3 simple, actionable opportunities to grow the business relationship. ${expand ? 'Provide new and different ideas from the last time.' : ''} Return ONLY a valid JSON array of strings. For example: ["Idea 1", "Idea 2", "Idea 3"]\n\nClient Name: ${client.name}\nDescription: ${client.description}\nBusiness Line: ${businessLine?.name}\nAI Focus: ${client.aiFocus}`;
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        let jsonString = response.text.trim().replace(/^```json\s*|```\s*$/g, '');
        const ideas: string[] = JSON.parse(jsonString);
        return ideas.map((idea, index) => ({ id: `opp-client-${Date.now()}-${index}`, text: idea }));
    } catch (e) {
        console.error("Error getting client opportunities:", e);
        return [{ id: 'opp-client-error', text: "Sorry, I had trouble generating opportunities for this client right now." }];
    }
  }, [businessLines]);
  
  const getDealOpportunities = useCallback(async (deal: Deal, expand: boolean = false): Promise<Opportunity[]> => {
    try {
        if (!process.env.API_KEY) throw new Error("API Key is not configured.");
        const client = clients.find(c => c.id === deal.clientId);
        const businessLine = businessLines.find(bl => bl.id === deal.businessLineId);
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `Based on the following deal, provide 3 simple, actionable next steps or upsell opportunities. ${expand ? 'Provide new and different ideas from the last time.' : ''} Return ONLY a valid JSON array of strings. For example: ["Idea 1", "Idea 2", "Idea 3"]\n\nDeal Name: ${deal.name}\nDescription: ${deal.description}\nStatus: ${deal.status}\nClient: ${client?.name}\nBusiness Line: ${businessLine?.name}`;
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        let jsonString = response.text.trim().replace(/^```json\s*|```\s*$/g, '');
        const ideas: string[] = JSON.parse(jsonString);
        return ideas.map((idea, index) => ({ id: `opp-deal-${Date.now()}-${index}`, text: idea }));
    } catch (e) {
        console.error("Error getting deal opportunities:", e);
        return [{ id: 'opp-deal-error', text: "Sorry, I had trouble generating opportunities for this deal right now." }];
    }
  }, [clients, businessLines]);

  const deleteDocument = useCallback((docId: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== docId));
  }, []);

  const generateDocumentDraft = useCallback(async (prompt: string, category: DocumentCategory, owner: BusinessLine | Client | Deal, ownerType: DocumentOwnerType): Promise<string> => {
    try {
        if (!process.env.API_KEY) throw new Error("API Key is not configured.");
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const fullPrompt = `You are an expert business document writer. Generate a professional draft for a "${category}" document for a ${ownerType} named "${owner.name}". The user's request is: "${prompt}". Provide only the draft text, without any introductory phrases like "Here is the draft:".`;
        const response = await ai.models.generateContent({ model: 'gemini-2.5-pro', contents: fullPrompt });
        return response.text.trim();
    } catch (e) {
        console.error("Error generating document draft:", e);
        return "Sorry, I encountered an error while drafting the document. Please try again.";
    }
  }, []);

  const generateMarketingCollateralPrompt = useCallback(async (prompt: string, collateralType: string, owner: BusinessLine | Client | Deal): Promise<string> => {
    try {
        if (!process.env.API_KEY) throw new Error("API Key is not configured.");
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const fullPrompt = `You are an expert marketing assistant. Generate a creative prompt for a "${collateralType}" about "${owner.name}". The user's goal is: "${prompt}". The prompt should be something they can copy and paste into another AI tool (like an image generator or video creator). Provide only the creative prompt itself, without any introductory phrases. Make it descriptive and inspiring.`;
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: fullPrompt });
        return response.text.trim();
    } catch (e) {
        console.error("Error generating marketing collateral prompt:", e);
        return "Sorry, I encountered an error while generating the marketing idea. Please try again.";
    }
  }, []);

  return { 
    tasks, 
    businessLines,
    clients,
    deals,
    documents,
    playbooks,
    crmEntries,
    addTask,
    addBusinessLine,
    updateBusinessLine,
    updatePlaybook,
    addClient,
    updateClient,
    addDeal,
    updateDeal,
    addCRMEntry,
    addCRMEntryFromVoice,
    updateTaskStatusById, 
    updateTaskStatusByTitle,
    dismissSuggestions,
    getOpportunities,
    getClientOpportunities,
    getDealOpportunities,
    addDocument,
    deleteDocument,
    generateDocumentDraft,
    generateMarketingCollateralPrompt,
  };
};