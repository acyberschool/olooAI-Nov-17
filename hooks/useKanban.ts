

import { useState, useCallback } from 'react';
import { Task, KanbanStatus, TaskType, BusinessLine, Client, Deal, Document, DocumentCategory, Opportunity, DocumentOwnerType, Playbook, PlaybookStep, CRMEntry, CRMEntryType, Suggestion, Prospect, ClientPulse, CompetitorInsight, SearchTrend, PlatformInsight, FilterOptions, GeminiType } from '../types';
import { initialTasks, initialBusinessLines, initialClients, initialDeals, initialDocuments, initialPlaybooks, initialCRMEntries } from '../data/mockData';
import { GoogleGenAI } from '@google/genai';
import { processTextMessage } from '../services/routerBrainService';
import { trackEvent } from '../App';

export const useKanban = () => {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [businessLines, setBusinessLines] = useState<BusinessLine[]>(initialBusinessLines);
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [deals, setDeals] = useState<Deal[]>(initialDeals);
  const [documents, setDocuments] = useState<Document[]>(initialDocuments);
  const [playbooks, setPlaybooks] = useState<Playbook[]>(initialPlaybooks);
  const [crmEntries, setCrmEntries] = useState<CRMEntry[]>(initialCRMEntries);

  const addDocument = useCallback((file: File | {name: string, content: string}, category: DocumentCategory, ownerId: string, ownerType: DocumentOwnerType, note?: string): Document => {
    
    let url = '#';
    if (!(file instanceof File)) {
        // Mock google doc link
        url = `https://docs.google.com/document/d/mock-${Date.now()}/edit`;
    } else {
        url = URL.createObjectURL(file);
    }
    
    const newDocument: Document = {
      id: `doc-${Date.now()}`,
      name: file.name,
      category,
      ownerId,
      ownerType,
      url,
      createdAt: new Date().toISOString(),
      note,
    };
    setDocuments(prev => [newDocument, ...prev]);
    return newDocument;
  }, []);
  
  const _addCRMEntryToState = (entryData: Omit<CRMEntry, 'id' | 'suggestions'>) => {
     const newEntry: CRMEntry = {
        id: `crm-${Date.now()}`,
        suggestions: [], 
        ...entryData
     };
     setCrmEntries(prev => [newEntry, ...prev]);
     trackEvent('create', 'CRM Entry', entryData.type);
  };

  const _generateAndSetSubtasks = async (taskId: string, taskTitle: string) => {
      try {
        // FIX: Use process.env.API_KEY as per guidelines to resolve TypeScript error.
        if (!process.env.API_KEY) throw new Error("API Key is not configured.");
        // FIX: Use process.env.API_KEY as per guidelines to resolve TypeScript error.
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `Break down the following task into a simple checklist of 3-5 sub-tasks. Return ONLY a valid JSON array of strings. For example: ["Sub-task 1", "Sub-task 2"].\n\nTask: "${taskTitle}"`;
        const response = await ai.models.generateContent({ 
            model: 'gemini-2.5-flash', 
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: GeminiType.ARRAY,
                    items: { type: GeminiType.STRING }
                }
            }
        });
        let jsonString = response.text.trim();
        const subTaskTexts: string[] = JSON.parse(jsonString);
        
        const subTasks = subTaskTexts.map((text, index) => ({
            id: `sub-${taskId}-${index}`,
            text,
            isDone: false,
        }));

        setTasks(prev => prev.map(task => 
            task.id === taskId ? { ...task, subTasks } : task
        ));
      } catch (e) {
          console.error("Error generating sub-tasks:", e);
      }
  };


  const addTask = useCallback((itemData: Partial<Omit<Task, 'id' | 'status' | 'type'>> & { itemType?: TaskType, title: string, businessLineName?: string }) => {
    let businessLineId = itemData.businessLineId;
    if (!businessLineId && itemData.businessLineName) {
        const businessLine = businessLines.find(bl => bl.name.toLowerCase() === itemData.businessLineName?.toLowerCase());
        businessLineId = businessLine?.id;
    }
    
    if (!businessLineId && itemData.clientId) {
        const client = clients.find(c => c.id === itemData.clientId);
        if (client) businessLineId = client.businessLineId;
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
    
    _generateAndSetSubtasks(newTask.id, newTask.title);
    
    if (newTask.clientId) {
      _addCRMEntryToState({
          clientId: newTask.clientId,
          dealId: newTask.dealId,
          createdAt: new Date().toISOString(),
          type: 'ai_action',
          summary: `AI created task: "${newTask.title}"`,
          rawContent: `AI created task: "${newTask.title}"`
      });
    }
    trackEvent('create', 'Task', newTask.type);
    return `${newTask.type} "${newTask.title}" created successfully.`;
  }, [businessLines, clients]);

  const generateAndAddPlaybook = useCallback(async (businessLine: BusinessLine) => {
    try {
        // FIX: Use process.env.API_KEY as per guidelines to resolve TypeScript error.
        if (!process.env.API_KEY) throw new Error("API Key is not configured.");
        // FIX: Use process.env.API_KEY as per guidelines to resolve TypeScript error.
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `Based on the following business line, generate a standard playbook with 5-7 simple steps from initial contact to a completed job. Return ONLY a valid JSON array of objects, where each object has a "title" and a "description". For example: [{"title": "Step 1", "description": "Details for step 1"}].\n\nName: ${businessLine.name}\nDescription: ${businessLine.description}\nCustomers: ${businessLine.customers}`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: GeminiType.ARRAY,
                    items: {
                        type: GeminiType.OBJECT,
                        properties: {
                            title: { type: GeminiType.STRING },
                            description: { type: GeminiType.STRING },
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
        // Remove existing playbook if it exists, then add the new one.
        setPlaybooks(prev => [...prev.filter(p => p.businessLineId !== businessLine.id), newPlaybook]);
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
    trackEvent('create', 'Business Line', data.name);
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
  
  const addClient = useCallback((data: Omit<Client, 'id' | 'businessLineId'> & { businessLineId?: string, businessLineName?: string }) => {
    if (clients.some(c => c.name.toLowerCase() === data.name.toLowerCase())) {
      return `Client "${data.name}" already exists.`;
    }
    
    let businessLine: BusinessLine | undefined;
    let assumptionMessage = '';

    if (data.businessLineId) {
        businessLine = businessLines.find(bl => bl.id === data.businessLineId);
    } else if (data.businessLineName) {
        businessLine = businessLines.find(bl => bl.name.toLowerCase() === data.businessLineName?.toLowerCase());
    }

    if (!businessLine) {
        if (!businessLines || businessLines.length === 0) {
            return "To create a client, you first need to set up at least one business line.";
        }
        businessLine = businessLines[0];
        assumptionMessage = `, and I've placed them under "${businessLine.name}" by default. You can change this later`;
    }

    const newClient: Client = {
      id: `client-${Date.now()}`,
      name: data.name,
      description: data.description,
      aiFocus: data.aiFocus,
      businessLineId: businessLine.id,
    };
    setClients(prev => [newClient, ...prev]);
    _addCRMEntryToState({
        clientId: newClient.id,
        createdAt: new Date().toISOString(),
        type: 'ai_action',
        summary: `AI created client profile for "${newClient.name}"`,
        rawContent: `AI created client profile for "${newClient.name}"`
    });
    trackEvent('create', 'Client', data.name);
    return `Client "${data.name}" created${assumptionMessage}.`;
  }, [clients, businessLines]);

  const updateClient = useCallback((id: string, data: Partial<Omit<Client, 'id'>>) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
    return `Client "${data.name}" updated.`;
  }, []);

  const addDeal = useCallback((data: Omit<Deal, 'id' | 'status' | 'amountPaid' | 'clientId' | 'businessLineId'> & { clientName: string, clientId?: string, businessLineId?: string }) => {
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
      value: data.value,
      currency: data.currency,
      revenueModel: data.revenueModel,
      amountPaid: 0,
    };
    setDeals(prev => [newDeal, ...prev]);
     _addCRMEntryToState({
        clientId: newDeal.clientId,
        dealId: newDeal.id,
        createdAt: new Date().toISOString(),
        type: 'ai_action',
        summary: `AI created deal: "${newDeal.name}" for ${newDeal.currency} ${newDeal.value}`,
        rawContent: `AI created deal: "${newDeal.name}" for ${newDeal.currency} ${newDeal.value}`
    });
    trackEvent('create', 'Deal', data.name);
    return `Deal "${data.name}" created for client "${data.clientName}".`;
  }, [deals, clients, playbooks]);

  const updateDeal = useCallback((id: string, data: Partial<Omit<Deal, 'id'>>) => {
      setDeals(prev => prev.map(d => d.id === id ? { ...d, ...data } : d));
      return `Deal updated.`;
  }, []);
  
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
    _addCRMEntryToState({
        clientId: client.id,
        dealId: dealId,
        createdAt: new Date().toISOString(),
        type: data.interactionType,
        summary: data.content, // Voice assistant should provide a good summary
        rawContent: data.content,
    });
    return `Note added to ${client.name}'s timeline.`;
  }, [clients, deals]);

  const generateNextStepSuggestions = useCallback(async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const deal = deals.find(d => d.id === task.dealId);
    let playbook: Playbook | undefined;
    if (deal) {
      playbook = playbooks.find(p => p.id === deal.playbookId);
    } else if (task.businessLineId) {
      playbook = playbooks.find(p => p.businessLineId === task.businessLineId);
    }
    
    let nextStep: PlaybookStep | undefined;
    if (playbook && task.playbookStepId) {
        const currentStepIndex = playbook.steps.findIndex(s => s.id === task.playbookStepId);
        if (currentStepIndex > -1 && currentStepIndex < playbook.steps.length - 1) {
            nextStep = playbook.steps[currentStepIndex + 1];
        }
    }

    try {
        // FIX: Use process.env.API_KEY as per guidelines to resolve TypeScript error.
        if (!process.env.API_KEY) throw new Error("API Key is not configured.");
        // FIX: Use process.env.API_KEY as per guidelines to resolve TypeScript error.
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const client = clients.find(c => c.id === task.clientId);
        const lastCRMEntry = crmEntries.filter(c => c.clientId === task.clientId).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
        const dealDocuments = documents.filter(doc => doc.ownerId === deal?.id).map(d => d.name).join(', ');

        let prompt = `A task was just completed. Based on all the context, suggest 1-2 concrete, actionable next-step tasks. Use your vast knowledge of business processes if no playbook is available.
        Return ONLY a valid JSON array of objects, where each object has a "text" (the suggestion for the user) and a "taskTitle" (the title for the new task).
        
        CONTEXT:
        - Completed Task: "${task.title}"
        ${client ? `- Client: "${client.name}"` : ''}
        ${deal ? `- Deal: "${deal.name}" (${deal.description})` : ''}
        - Last conversation with client: ${lastCRMEntry ? `"${lastCRMEntry.summary}"` : "None recorded."}
        - Relevant documents for this deal: ${dealDocuments || 'None'}
        `;

        if (nextStep) {
            prompt += `- The next step in our standard process is: "${nextStep.title}" (${nextStep.description}). Base your suggestions on this step.`
        } else if (playbook) {
            prompt += `- This task wasn't part of our standard playbook. Use your own reasoning to figure out the best next step to move the deal forward.`
        } else {
            prompt += `- There is no standard playbook. Use your vast knowledge of business processes to figure out the best next step.`
        }
        
        // FIX: Added responseMimeType and responseSchema to ensure reliable JSON parsing.
        const response = await ai.models.generateContent({ 
            model: 'gemini-2.5-flash', 
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: GeminiType.ARRAY,
                    items: {
                        type: GeminiType.OBJECT,
                        properties: {
                            text: { type: GeminiType.STRING },
                            taskTitle: { type: GeminiType.STRING }
                        },
                        required: ["text", "taskTitle"]
                    }
                }
            }
        });
        let jsonString = response.text.trim();
        const suggestionsRaw = JSON.parse(jsonString);
        const newSuggestions: Suggestion[] = suggestionsRaw.map((s: any) => ({
            id: `sugg-${Date.now()}-${Math.random()}`,
            text: s.text,
            taskData: { 
                title: s.taskTitle,
                dealId: deal?.id,
                clientId: client?.id,
                businessLineId: task.businessLineId
            }
        }));
        
        if (deal) {
            setDeals(prev => prev.map(d => d.id === deal.id ? { ...d, suggestions: newSuggestions } : d));
        } else if (client) {
            setClients(prev => prev.map(c => c.id === client.id ? { ...c, suggestions: newSuggestions } : c));
        }

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
        trackEvent('update_status', 'Task', newStatus, parseInt(originalTask.id.replace('task-', '')));
        if (newStatus === KanbanStatus.Done) {
            await generateNextStepSuggestions(taskId);
        } else if (originalTask.clientId) {
            let noteContent = '';
            let entryType: CRMEntryType = 'ai_action';
            switch(newStatus) {
                case KanbanStatus.Doing: noteContent = `Started task: "${originalTask.title}"`; break;
                case KanbanStatus.ToDo: noteContent = `Task moved back to To Do: "${originalTask.title}"`; break;
                case KanbanStatus.Terminated: noteContent = `Task terminated: "${originalTask.title}"`; break;
            }
            if (noteContent) {
                _addCRMEntryToState({ clientId: originalTask.clientId, dealId: originalTask.dealId, createdAt: new Date().toISOString(), type: entryType, summary: noteContent, rawContent: noteContent });
            }
        }
    }
  }, [generateNextStepSuggestions]);

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
  
  const getOpportunities = useCallback(async (businessLine: BusinessLine, expand: boolean = false): Promise<{ opportunities: Opportunity[], sources: any[] }> => {
    try {
        // FIX: Use process.env.API_KEY as per guidelines to resolve TypeScript error.
        if (!process.env.API_KEY) throw new Error("API Key is not configured.");
        // FIX: Use process.env.API_KEY as per guidelines to resolve TypeScript error.
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `You are a top-tier business strategist. Analyze the following business line, perform a deep web search for market trends and news, and generate 3 highly specific and creative business opportunities. For each, explain *why* it's a good idea based on your research. ${expand ? 'Provide new and different ideas from the last time.' : ''} Return ONLY a valid JSON array of strings.
Example: ["Partner with local real estate agencies for a 'new tenant welcome package', as recent articles show a boom in rental property occupancy."]

Business Line Information:
Name: ${businessLine.name}
Description: ${businessLine.description}
Customers: ${businessLine.customers}
AI Focus: ${businessLine.aiFocus}`;
        
        const response = await ai.models.generateContent({ 
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                tools: [{googleSearch: {}}],
            }
        });

        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        
        let jsonString = response.text.trim().replace(/^```json\s*|```\s*$/g, '');
        const ideas: string[] = JSON.parse(jsonString);
        
        const opportunities = ideas.map((idea, index) => ({ id: `opp-${Date.now()}-${index}`, text: idea }));
        return { opportunities, sources: groundingChunks.map((chunk: any) => chunk.web) };

    } catch (e) {
        console.error("Error getting opportunities:", e);
        return { opportunities: [{ id: 'opp-error', text: "Sorry, I had trouble generating opportunities right now. Try again." }], sources: [] };
    }
  }, []);
  
  const getClientOpportunities = useCallback(async (client: Client, expand: boolean = false): Promise<{ opportunities: Opportunity[], sources: any[] }> => {
    try {
        // FIX: Use process.env.API_KEY as per guidelines to resolve TypeScript error.
        if (!process.env.API_KEY) throw new Error("API Key is not configured.");
        const businessLine = businessLines.find(bl => bl.id === client.businessLineId);
        // FIX: Use process.env.API_KEY as per guidelines to resolve TypeScript error.
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `You are a top-tier business strategist. Analyze the following client, perform a deep web search for news and trends related to them, and generate 3 simple, actionable opportunities to grow the business relationship. For each, explain *why* it's a good idea based on your research. ${expand ? 'Provide new and different ideas from the last time.' : ''} Return ONLY a valid JSON array of strings.
Client Name: ${client.name}
Description: ${client.description}
Business Line: ${businessLine?.name}
AI Focus: ${client.aiFocus}`;

        const response = await ai.models.generateContent({ 
            model: 'gemini-2.5-pro', 
            contents: prompt,
            config: {
                tools: [{googleSearch: {}}],
            }
        });

        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        let jsonString = response.text.trim().replace(/^```json\s*|```\s*$/g, '');
        const ideas: string[] = JSON.parse(jsonString);

        const opportunities = ideas.map((idea, index) => ({ id: `opp-client-${Date.now()}-${index}`, text: idea }));
        return { opportunities, sources: groundingChunks.map((chunk: any) => chunk.web) };
    } catch (e) {
        console.error("Error getting client opportunities:", e);
        return { opportunities: [{ id: 'opp-client-error', text: "Sorry, I had trouble generating opportunities for this client right now." }], sources: [] };
    }
  }, [businessLines]);
  
  const getDealOpportunities = useCallback(async (deal: Deal, expand: boolean = false): Promise<{ opportunities: Opportunity[], sources: any[] }> => {
    try {
        // FIX: Use process.env.API_KEY as per guidelines to resolve TypeScript error.
        if (!process.env.API_KEY) throw new Error("API Key is not configured.");
        const client = clients.find(c => c.id === deal.clientId);
        const businessLine = businessLines.find(bl => bl.id === deal.businessLineId);
        // FIX: Use process.env.API_KEY as per guidelines to resolve TypeScript error.
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `You are a top-tier business strategist. Based on the following deal, perform a deep web search for industry trends, and generate 3 simple, actionable next steps or upsell opportunities. For each, explain *why* it's a good idea based on your research. ${expand ? 'Provide new and different ideas from the last time.' : ''} Return ONLY a valid JSON array of strings.
Deal Name: ${deal.name}
Description: ${deal.description}
Status: ${deal.status}
Client: ${client?.name}
Business Line: ${businessLine?.name}`;
        const response = await ai.models.generateContent({ 
            model: 'gemini-2.5-pro', 
            contents: prompt,
            config: {
                tools: [{googleSearch: {}}],
            }
        });
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        let jsonString = response.text.trim().replace(/^```json\s*|```\s*$/g, '');
        const ideas: string[] = JSON.parse(jsonString);

        const opportunities = ideas.map((idea, index) => ({ id: `opp-deal-${Date.now()}-${index}`, text: idea }));
        return { opportunities, sources: groundingChunks.map((chunk: any) => chunk.web) };
    } catch (e) {
        console.error("Error getting deal opportunities:", e);
        return { opportunities: [{ id: 'opp-deal-error', text: "Sorry, I had trouble generating opportunities for this deal right now." }], sources: [] };
    }
  }, [clients, businessLines]);

  const deleteDocument = useCallback((docId: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== docId));
  }, []);

  const generateDocumentDraft = useCallback(async (prompt: string, category: DocumentCategory, owner: BusinessLine | Client | Deal, ownerType: DocumentOwnerType): Promise<string> => {
    try {
        // FIX: Use process.env.API_KEY as per guidelines to resolve TypeScript error.
        if (!process.env.API_KEY) throw new Error("API Key is not configured.");
        // FIX: Use process.env.API_KEY as per guidelines to resolve TypeScript error.
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
        // FIX: Use process.env.API_KEY as per guidelines to resolve TypeScript error.
        if (!process.env.API_KEY) throw new Error("API Key is not configured.");
        // FIX: Use process.env.API_KEY as per guidelines to resolve TypeScript error.
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const fullPrompt = `You are an expert marketing assistant. Generate a creative prompt for a "${collateralType}" about "${owner.name}". The user's goal is: "${prompt}". The prompt should be something they can copy and paste into another AI tool (like an image generator or video creator). Provide only the creative prompt itself, without any introductory phrases. Make it descriptive and inspiring.`;
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: fullPrompt });
        return response.text.trim();
    } catch (e) {
        console.error("Error generating marketing collateral prompt:", e);
        return "Sorry, I encountered an error while generating the marketing idea. Please try again.";
    }
  }, []);

  const logPaymentOnDeal = useCallback((dealId: string, amount: number, note: string) => {
    let dealToUpdate: Deal | undefined;
    setDeals(prevDeals => {
      const newDeals = prevDeals.map(d => {
        if (d.id === dealId) {
          dealToUpdate = d;
          const newAmountPaid = d.amountPaid + amount;
          const newStatus = newAmountPaid >= d.value ? 'Closed - Won' : d.status;
          return { ...d, amountPaid: newAmountPaid, status: newStatus };
        }
        return d;
      });
      return newDeals;
    });

    if (dealToUpdate) {
        _addCRMEntryToState({ 
            clientId: dealToUpdate.clientId, 
            dealId: dealToUpdate.id, 
            createdAt: new Date().toISOString(), 
            type: 'ai_action', 
            summary: `Logged payment of ${dealToUpdate.currency} ${amount} for deal "${dealToUpdate.name}". Note: ${note}`,
            rawContent: `Logged payment of ${dealToUpdate.currency} ${amount}. Note: ${note}`
        });
        return `Payment of ${amount} logged for "${dealToUpdate.name}".`;
    }
    return 'Could not find deal to log payment.';
  }, []);

  const findProspects = useCallback(async (businessLine: BusinessLine, customPrompt?: string): Promise<{ prospects: Prospect[], sources: any[] }> => {
    try {
      // FIX: Use process.env.API_KEY as per guidelines to resolve TypeScript error.
      if (!process.env.API_KEY) throw new Error("API Key is not configured.");
      // FIX: Use process.env.API_KEY as per guidelines to resolve TypeScript error.
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = customPrompt || `You are a business development expert. Based on my business line "${businessLine.name}" (${businessLine.description}), perform a deep web search to find 5 potential new clients. For each, provide a name and a likely need, explaining your reasoning. Return ONLY a valid JSON array of objects, where each object has "name" and "likelyNeed".`;
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
          tools: [{googleSearch: {}}],
        },
      });

      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const prospectsRaw = JSON.parse(response.text.trim());
      const prospects = prospectsRaw.map((p: any, i: number) => ({ ...p, id: `prospect-${Date.now()}-${i}` }));
      return { prospects, sources: groundingChunks.map((chunk: any) => chunk.web) };
    } catch (e) {
      console.error("Error finding prospects:", e);
      return { prospects: [], sources: [] };
    }
  }, []);

  const findProspectsByName = useCallback(async ({ businessLineName }: { businessLineName: string }): Promise<string> => {
    const businessLine = businessLines.find(bl => bl.name.toLowerCase() === businessLineName.toLowerCase());
    if (!businessLine) {
        return `I couldn't find a business line named "${businessLineName}".`;
    }
    try {
        const { prospects } = await findProspects(businessLine);
        if (prospects.length === 0) {
            return `I couldn't find any new prospects for "${businessLineName}" right now.`;
        }
        const prospectNames = prospects.map(p => p.name).join(', ');
        return `Based on my research, I found a few prospects for ${businessLineName}: ${prospectNames}. You can see the full list in the Prospects tab.`;
    } catch (e) {
        console.error("Error finding prospects by name:", e);
        return `Sorry, I had trouble searching for prospects for "${businessLineName}". Please try again from the Prospects tab.`;
    }
  }, [businessLines, findProspects]);

  const toggleSubTask = useCallback((taskId: string, subTaskId: string) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId && task.subTasks) {
        return {
          ...task,
          subTasks: task.subTasks.map(sub => 
            sub.id === subTaskId ? { ...sub, isDone: !sub.isDone } : sub
          )
        };
      }
      return task;
    }));
  }, []);

  const generateSocialMediaIdeas = useCallback(async (businessLine: BusinessLine, customPrompt?: string): Promise<string[]> => {
    try {
        // FIX: Use process.env.API_KEY as per guidelines to resolve TypeScript error.
        if (!process.env.API_KEY) throw new Error("API Key is not configured.");
        // FIX: Use process.env.API_KEY as per guidelines to resolve TypeScript error.
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = customPrompt || `Based on my business line "${businessLine.name}" and recent online trends, generate 5 timely social media post ideas. State that this is based on your knowledge and external research. Return ONLY a valid JSON array of strings.`;
        const response = await ai.models.generateContent({ 
            model: 'gemini-2.5-flash', 
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: { type: GeminiType.ARRAY, items: { type: GeminiType.STRING } }
            }
        });
        let jsonString = response.text.trim();
        return JSON.parse(jsonString);
    } catch (e) {
        console.error("Error generating social media ideas:", e);
        return ["Sorry, I had trouble generating ideas right now."];
    }
  }, []);

  const processTextAndExecute = useCallback(async (text: string, context: any) => {
    try {
        const knownData = {
            clients: clients.map(c => c.name),
            deals: deals.map(d => d.name),
            businessLines: businessLines.map(b => b.name)
        };
        const platformActivitySummary = `Last 3 tasks: ${tasks.slice(0,3).map(t => t.title).join(', ')}. Last 3 CRM notes: ${crmEntries.slice(0,3).map(c => c.summary).join(', ')}.`;
        const result = await processTextMessage(text, knownData, context, platformActivitySummary);

        if (result.action === 'ignore') {
            return;
        }

        if (result.action === 'create_business_line' && result.businessLine) {
            await addBusinessLine(result.businessLine);
        }
        if (result.action === 'create_client' && result.client) {
            addClient(result.client);
        }
        if (result.action === 'create_deal' && result.deal) {
            addDeal(result.deal);
        }
        if (result.action === 'update_task' && result.tasks.length > 0) {
            const taskToUpdate = result.tasks[0];
            if (taskToUpdate.update_hint) {
                updateTaskStatusByTitle(taskToUpdate.update_hint, KanbanStatus.Done);
            }
        }
        
        if (result.action === 'create_note' || result.action === 'both') {
            if (result.note) {
                let clientId = context.clientId;
                 if (!clientId && result.tasks.length > 0 && result.tasks[0].client_name) {
                    const client = clients.find(c => c.name.toLowerCase() === result.tasks[0].client_name?.toLowerCase());
                    if (client) clientId = client.id;
                } else if (!clientId && result.client?.name) {
                    const client = clients.find(c => c.name.toLowerCase() === result.client!.name.toLowerCase());
                    if (client) clientId = client.id;
                }
                
                if(clientId) {
                    _addCRMEntryToState({
                        clientId,
                        dealId: context.dealId,
                        createdAt: new Date().toISOString(),
                        type: result.note.channel,
                        summary: result.note.text,
                        rawContent: text,
                    });
                }
            }
        }
        
        if (result.action === 'create_task' || result.action === 'both') {
            result.tasks.forEach(task => {
                const client = clients.find(c => c.name.toLowerCase() === task.client_name?.toLowerCase());
                const deal = deals.find(d => d.name.toLowerCase() === task.deal_name?.toLowerCase());
                addTask({
                    title: task.title,
                    dueDate: task.due_date || undefined,
                    clientId: client?.id,
                    dealId: deal?.id
                });
            });
        }
    } catch (e) {
        console.error("Error processing text command:", e);
    }
    }, [clients, deals, businessLines, addBusinessLine, addClient, addDeal, updateTaskStatusByTitle, addTask, tasks, crmEntries]);
    
  const regeneratePlaybook = useCallback(async (businessLine: BusinessLine) => {
    await generateAndAddPlaybook(businessLine);
  }, [generateAndAddPlaybook]);

  const getClientPulse = useCallback(async (client: Client, filters: FilterOptions, customPrompt?: string): Promise<ClientPulse[]> => {
    try {
        // FIX: Use process.env.API_KEY as per guidelines to resolve TypeScript error.
        if (!process.env.API_KEY) throw new Error("API Key is not configured.");
        // FIX: Use process.env.API_KEY as per guidelines to resolve TypeScript error.
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = customPrompt || `Based on external research, find recent public social media posts or news articles mentioning "${client.name}". Apply the following filters: ${JSON.stringify(filters)}. For each result, provide the source, content snippet, a URL, and a date. Return ONLY a valid JSON array of objects with keys: "source", "content", "url", "date".`;
        const response = await ai.models.generateContent({ 
            model: 'gemini-2.5-flash', 
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: GeminiType.ARRAY,
                    items: {
                        type: GeminiType.OBJECT,
                        properties: {
                            source: { type: GeminiType.STRING },
                            content: { type: GeminiType.STRING },
                            url: { type: GeminiType.STRING },
                            date: { type: GeminiType.STRING }
                        },
                        required: ["source", "content", "url", "date"]
                    }
                }
            }
        });
        let jsonString = response.text.trim();
        const pulseItems: Omit<ClientPulse, 'id'>[] = JSON.parse(jsonString);
        return pulseItems.map((item, index) => ({ ...item, id: `pulse-${Date.now()}-${index}` }));
    } catch (e) {
        console.error("Error getting client pulse:", e);
        return [];
    }
  }, []);

  const getCompetitorInsights = useCallback(async (businessLine: BusinessLine, filters: FilterOptions, customPrompt?: string): Promise<{ insights: CompetitorInsight[], trends: SearchTrend[] }> => {
    try {
        // FIX: Use process.env.API_KEY as per guidelines to resolve TypeScript error.
        if (!process.env.API_KEY) throw new Error("API Key is not configured.");
        // FIX: Use process.env.API_KEY as per guidelines to resolve TypeScript error.
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = customPrompt || `For a business in "${businessLine.name}", perform a deep search online. Apply these filters: ${JSON.stringify(filters)}.
        1. Identify 2-3 key competitors and provide a recent insight for each.
        2. Identify 2-3 recent customer search trends related to this business.
        Return ONLY a valid JSON object with two keys: "insights" (an array of objects with "competitorName", "insight", "source") and "trends" (an array of objects with "keyword", "insight").`;
        const response = await ai.models.generateContent({ 
            model: 'gemini-2.5-flash', 
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: GeminiType.OBJECT,
                    properties: {
                        insights: {
                            type: GeminiType.ARRAY,
                            items: {
                                type: GeminiType.OBJECT,
                                properties: {
                                    competitorName: { type: GeminiType.STRING },
                                    insight: { type: GeminiType.STRING },
                                    source: { type: GeminiType.STRING }
                                },
                                required: ["competitorName", "insight", "source"]
                            }
                        },
                        trends: {
                            type: GeminiType.ARRAY,
                            items: {
                                type: GeminiType.OBJECT,
                                properties: {
                                    keyword: { type: GeminiType.STRING },
                                    insight: { type: GeminiType.STRING }
                                },
                                required: ["keyword", "insight"]
                            }
                        }
                    },
                    required: ["insights", "trends"]
                }
            }
        });
        let jsonString = response.text.trim();
        const results = JSON.parse(jsonString);
        return {
            insights: results.insights.map((item: any, i: number) => ({...item, id: `ci-${Date.now()}-${i}`})),
            trends: results.trends.map((item: any, i: number) => ({...item, id: `st-${Date.now()}-${i}`})),
        };
    } catch (e) {
        console.error("Error getting competitor insights:", e);
        return { insights: [], trends: [] };
    }
  }, []);

  const generateDocumentFromSubtask = useCallback(async (task: Task, subtaskText: string): Promise<Document | null> => {
    try {
        // FIX: Use process.env.API_KEY as per guidelines to resolve TypeScript error.
        if (!process.env.API_KEY) throw new Error("API Key is not configured.");
        // FIX: Use process.env.API_KEY as per guidelines to resolve TypeScript error.
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `Based on the task "${task.title}", generate the content for the following sub-task: "${subtaskText}". Return only the document content.`;
        const response = await ai.models.generateContent({ model: 'gemini-2.5-pro', contents: prompt });
        const content = response.text.trim();
        const docName = `${subtaskText}.gdoc`; // Mock Google Doc
        
        let ownerId = task.dealId || task.clientId || task.businessLineId;
        let ownerType: DocumentOwnerType = task.dealId ? 'deal' : (task.clientId ? 'client' : 'businessLine');

        if (!ownerId) return null; // Can't create a doc without an owner

        const newDoc = addDocument({ name: docName, content }, 'Templates', ownerId, ownerType);

        _addCRMEntryToState({
            clientId: task.clientId!,
            dealId: task.dealId,
            createdAt: new Date().toISOString(),
            type: 'ai_action',
            summary: `AI generated document: "${docName}" for task "${task.title}"`,
            rawContent: `AI generated document from subtask: "${subtaskText}"`,
            documentId: newDoc.id,
        });

        return newDoc;
    } catch (e) {
        console.error("Error generating document from subtask:", e);
        return null;
    }
  }, [addDocument]);
  
  const getPlatformInsights = useCallback((): PlatformInsight[] => {
    // This is a mock function. In a real app, this would query a database
    // or an analytics service where AI-derived insights are stored.
    return [
      { id: 'pi-1', text: "You're most productive on Tuesday mornings. 75% of your 'Done' tasks last week were completed then." },
      { id: 'pi-2', text: "The 'Fumigation' business line has the fastest deal-closing time, averaging 8 days from creation to 'Closed-Won'." },
      { id: 'pi-3', text: "You haven't logged a conversation with 'Bright Schools' in over 2 weeks. It might be time to follow up." },
    ];
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
    logPaymentOnDeal,
    findProspects,
    findProspectsByName,
    toggleSubTask,
    generateSocialMediaIdeas,
    processTextAndExecute,
    regeneratePlaybook,
    getClientPulse,
    getCompetitorInsights,
    generateDocumentFromSubtask,
    getPlatformInsights,
  };
};