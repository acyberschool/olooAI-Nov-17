
import { useState, useCallback, useEffect } from 'react';
import { Task, KanbanStatus, TaskType, BusinessLine, Client, Deal, Document, DocumentCategory, Opportunity, DocumentOwnerType, Playbook, PlaybookStep, CRMEntry, CRMEntryType, Suggestion, Prospect, ClientPulse, CompetitorInsight, SearchTrend, FilterOptions, GeminiType, PlatformInsight, Project, TeamMember } from '../types';
import { initialTasks, initialBusinessLines, initialClients, initialDeals, initialDocuments, initialPlaybooks, initialCRMEntries, initialProjects, initialTeamMembers } from '../data/mockData';
import { getAiInstance } from '../config/geminiConfig';
import { processTextMessage } from '../services/routerBrainService';
import { trackEvent } from '../App';

// Helper for LocalStorage with error handling
const usePersistentState = <T,>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const [state, setState] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, state]);

  return [state, setState];
};

export const useKanban = () => {
  // Persistent State for all core entities
  const [tasks, setTasks] = usePersistentState<Task[]>('oloo_tasks', initialTasks);
  const [businessLines, setBusinessLines] = usePersistentState<BusinessLine[]>('oloo_businessLines', initialBusinessLines);
  const [clients, setClients] = usePersistentState<Client[]>('oloo_clients', initialClients);
  const [deals, setDeals] = usePersistentState<Deal[]>('oloo_deals', initialDeals);
  const [projects, setProjects] = usePersistentState<Project[]>('oloo_projects', initialProjects);
  const [documents, setDocuments] = usePersistentState<Document[]>('oloo_documents', initialDocuments);
  const [playbooks, setPlaybooks] = usePersistentState<Playbook[]>('oloo_playbooks', initialPlaybooks);
  const [crmEntries, setCrmEntries] = usePersistentState<CRMEntry[]>('oloo_crmEntries', initialCRMEntries);
  const [teamMembers, setTeamMembers] = usePersistentState<TeamMember[]>('oloo_teamMembers', initialTeamMembers);

  // THE COACH: Check for overdue tasks on mount/update
  useEffect(() => {
      const overdueTasks = tasks.filter(t => 
          t.dueDate && 
          new Date(t.dueDate) < new Date() && 
          t.status !== KanbanStatus.Done && 
          t.status !== KanbanStatus.Terminated
      );
      
      if (overdueTasks.length > 0) {
          console.log(`[WALTER COACH]: You have ${overdueTasks.length} overdue tasks. Get to work!`);
          // In a real implementation, this would trigger a visible notification or banner.
      }
  }, [tasks]);

  /**
   * Adds a document to the system.
   */
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
  }, [setDocuments]);
  
  const _addCRMEntryToState = (entryData: Omit<CRMEntry, 'id' | 'suggestions'>) => {
     const newEntry: CRMEntry = {
        id: `crm-${Date.now()}`,
        suggestions: [], 
        ...entryData
     };
     setCrmEntries(prev => [newEntry, ...prev]);
     trackEvent('create', 'CRM Entry', entryData.type);
  };

  const _generateAndSetSubtasks = async (task: Task, context: { client?: Client, deal?: Deal, businessLine?: BusinessLine }) => {
      try {
        const ai = getAiInstance();
        const { client, deal, businessLine } = context;

        const prompt = `You are an expert project manager AI. A new task has been created within a specific business context. Your job is to deconstruct this primary task into a checklist of 3-5 highly relevant, actionable sub-tasks that represent a logical workflow sequence. Your output must be a valid JSON array of strings. Do not add any other text.

**CRITICAL CONTEXT - USE ALL OF THIS:**
- **Business Line:** ${businessLine ? `${businessLine.name}. What we do: ${businessLine.description}. Our typical customers: ${businessLine.customers}.` : 'Not specified.'}
- **Client:** ${client ? `${client.name}. About them: ${client.description}. Our AI focus with them: ${client.aiFocus}.` : 'Not specified.'}
- **Deal:** ${deal ? `${deal.name}. Deal objective: ${deal.description}. Deal value: ${deal.currency} ${deal.value}.` : 'Not specified.'}
- **Primary Task to Deconstruct:** "${task.title}"
${task.description ? `- Task Details: "${task.description}"` : ''}

**Your Mandate:**
1.  **Analyze the Goal:** Deeply understand the primary task's objective within the provided business context.
2.  **Create a Workflow:** The sub-tasks must be sequential steps.
3.  **Be Specific and Actionable:** Avoid vague sub-tasks. Instead of "Get details", use "Email John Doe to confirm warehouse dimensions".

**Your Output (JSON array of strings only):**`;
        
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
            id: `sub-${task.id}-${index}`,
            text,
            isDone: false,
        }));

        setTasks(prev => prev.map(t => 
            t.id === task.id ? { ...t, subTasks } : t
        ));
      } catch (e) {
          console.error("Error generating sub-tasks:", e);
      }
  };


  const addTask = useCallback((itemData: Partial<Omit<Task, 'id' | 'status' | 'type' | 'createdAt'>> & { itemType?: TaskType, title: string, businessLineName?: string }) => {
    let businessLineId = itemData.businessLineId;
    if (!businessLineId && itemData.businessLineName) {
        const businessLine = businessLines.find(bl => bl.name.toLowerCase() === itemData.businessLineName?.toLowerCase());
        businessLineId = businessLine?.id;
    }
    
    if (!businessLineId && itemData.clientId) {
        const client = clients.find(c => c.id === itemData.clientId);
        if (client) businessLineId = client.businessLineId;
    }

    const client = clients.find(c => c.id === itemData.clientId);
    const deal = deals.find(d => d.id === itemData.dealId);
    let businessLine = businessLines.find(bl => bl.id === businessLineId);
    if (!businessLine && client) {
        businessLine = businessLines.find(bl => bl.id === client.businessLineId);
    }

    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: itemData.title,
      status: KanbanStatus.ToDo,
      type: itemData.itemType || TaskType.Task,
      createdAt: new Date().toISOString(),
      ...itemData,
      businessLineId: businessLineId,
    };
    delete (newTask as any).itemType;
    delete (newTask as any).businessLineName;

    setTasks((prevTasks) => [newTask, ...prevTasks]);
    
    _generateAndSetSubtasks(newTask, { client, deal, businessLine });
    
    if (newTask.clientId) {
      _addCRMEntryToState({
          clientId: newTask.clientId,
          dealId: newTask.dealId,
          projectId: newTask.projectId,
          createdAt: new Date().toISOString(),
          type: 'ai_action',
          summary: `AI created task: "${newTask.title}"`,
          rawContent: `AI created task: "${newTask.title}"`
      });
    }
    if (newTask.assigneeId) {
        const assignee = teamMembers.find(tm => tm.id === newTask.assigneeId);
        if (assignee) {
             console.log(`Simulating email to ${assignee.email}: New task assigned - ${newTask.title}`);
        }
    }

    trackEvent('create', 'Task', newTask.type);
    return `${newTask.type} "${newTask.title}" created successfully.`;
  }, [businessLines, clients, deals, teamMembers, setTasks, setCrmEntries]);

  const generateAndAddPlaybook = useCallback(async (businessLine: BusinessLine) => {
    try {
        const ai = getAiInstance();
        const prompt = `Based on the following business line, generate a standard playbook with 5-7 simple steps from initial contact to a completed job. Return ONLY a valid JSON array of objects, where each object has a "title" and a "description".\n\nName: ${businessLine.name}\nDescription: ${businessLine.description}\nCustomers: ${businessLine.customers}`;
        
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
        setPlaybooks(prev => [...prev.filter(p => p.businessLineId !== businessLine.id), newPlaybook]);
    } catch (e) {
        console.error("Error generating playbook:", e);
    }
  }, [setPlaybooks]);

  const addBusinessLine = useCallback(async (data: Omit<BusinessLine, 'id'>) => {
    if (businessLines.some(bl => bl.name.toLowerCase() === data.name.toLowerCase())) {
      return `Business line "${data.name}" already exists.`;
    }
    
    let description = data.description;
    try {
        const ai = getAiInstance();
        const prompt = `Refine the following business description into a single, benefit-oriented sentence: "${data.description}". Business Name: ${data.name}. Customers: ${data.customers}. Output only the single sentence.`;
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        description = response.text.trim();
    } catch (e) {
        console.error("Error generating business line description:", e);
    }

    const newBusinessLine: BusinessLine = {
      id: `bl-${Date.now()}`,
      ...data,
      description,
    };
    setBusinessLines(prev => [newBusinessLine, ...prev]);
    await generateAndAddPlaybook(newBusinessLine);
    trackEvent('create', 'Business Line', data.name);
    return `Business line "${data.name}" created.`;
  }, [businessLines, generateAndAddPlaybook, setBusinessLines]);

  const updateBusinessLine = useCallback((id: string, data: Partial<Omit<BusinessLine, 'id'>>) => {
    setBusinessLines(prev => prev.map(bl => bl.id === id ? { ...bl, ...data } : bl));
    return `Business line updated.`;
  }, [setBusinessLines]);

  const deleteBusinessLine = useCallback((id: string) => {
    const clientsToDelete = clients.filter(c => c.businessLineId === id).map(c => c.id);
    const dealsToDelete = deals.filter(d => d.businessLineId === id).map(d => d.id);
    
    setBusinessLines(prev => prev.filter(bl => bl.id !== id));
    setClients(prev => prev.filter(c => c.businessLineId !== id));
    setDeals(prev => prev.filter(d => d.businessLineId !== id));
    setTasks(prev => prev.filter(t => t.businessLineId !== id));
    setDocuments(prev => {
        const ownersToDelete = new Set([id, ...clientsToDelete, ...dealsToDelete]);
        return prev.filter(doc => !ownersToDelete.has(doc.ownerId));
    });
    setCrmEntries(prev => prev.filter(e => !clientsToDelete.includes(e.clientId)));
    
    return `Business line and all related items deleted.`;
}, [clients, deals, setBusinessLines, setClients, setDeals, setTasks, setDocuments, setCrmEntries]);
  
  const updatePlaybook = useCallback((playbookId: string, updatedSteps: PlaybookStep[]) => {
      setPlaybooks(prev => prev.map(p => p.id === playbookId ? { ...p, steps: updatedSteps } : p));
      return `Playbook updated.`;
  }, [setPlaybooks]);
  
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
        if (businessLines.length === 0) {
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

    // AUTO-TASK: Create initial task
    addTask({
        title: `Initial setup for ${newClient.name}`,
        description: `Review client details and plan initial outreach. Focus: ${newClient.aiFocus}`,
        clientId: newClient.id,
        businessLineId: businessLine.id,
        dueDate: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(),
    });

    _addCRMEntryToState({
        clientId: newClient.id,
        createdAt: new Date().toISOString(),
        type: 'ai_action',
        summary: `AI created client profile for "${newClient.name}"`,
        rawContent: `AI created client profile for "${newClient.name}"`
    });
    trackEvent('create', 'Client', data.name);
    return `Client "${data.name}" created${assumptionMessage}. I've also added an initial task to your board.`;
  }, [clients, businessLines, addTask, setClients]);

  const updateClient = useCallback((id: string, data: Partial<Omit<Client, 'id'>>) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
    return `Client updated.`;
  }, [setClients]);

    const updateClientFromInteraction = useCallback(async (clientId: string, interactionText: string) => {
        const client = clients.find(c => c.id === clientId);
        if (!client) return;

        try {
            const ai = getAiInstance();
            const prompt = `You are Walter, an AI business assistant. A new interaction has been logged for a client. Your job is to analyze it and propose updates.

**Client Context:**
- Name: ${client.name}
- Description: ${client.description}
- Current AI Focus: ${client.aiFocus}

**New Interaction Logged:**
"${interactionText}"

**Your Task:**
Based on the new interaction, propose a new "Last touch summary" (what just happened), a "Next action" (what to do next), and an updated "AI Focus" (if the strategy shifted).
Return ONLY a valid JSON object with the keys: "lastTouchSummary", "nextAction", "nextActionDueDate", "aiFocus" (optional update).
The due date should be in ISO 8601 format.`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: GeminiType.OBJECT,
                        properties: {
                            lastTouchSummary: { type: GeminiType.STRING },
                            nextAction: { type: GeminiType.STRING },
                            nextActionDueDate: { type: GeminiType.STRING },
                            aiFocus: { type: GeminiType.STRING, nullable: true }
                        },
                        required: ['lastTouchSummary', 'nextAction', 'nextActionDueDate']
                    }
                }
            });
            const updates = JSON.parse(response.text.trim());

            setClients(prev => prev.map(c => c.id === clientId ? {
                ...c,
                proposedLastTouchSummary: updates.lastTouchSummary,
                proposedNextAction: updates.nextAction,
                proposedNextActionDueDate: updates.nextActionDueDate,
                aiFocus: updates.aiFocus || c.aiFocus,
            } : c));

        } catch (e) {
            console.error("Error updating client from interaction:", e);
        }
    }, [clients, setClients]);

    const approveClientUpdate = useCallback((clientId: string) => {
        const client = clients.find(c => c.id === clientId);
        if (!client || !client.proposedLastTouchSummary) return;

        // Log the interaction
        _addCRMEntryToState({
            clientId: client.id,
            createdAt: new Date().toISOString(),
            type: 'note',
            summary: `Interaction logged: ${client.proposedLastTouchSummary}`,
            rawContent: client.proposedLastTouchSummary,
        });

        // Create the next task
        if (client.proposedNextAction) {
             addTask({
                title: client.proposedNextAction,
                dueDate: client.proposedNextActionDueDate,
                clientId: client.id,
                businessLineId: client.businessLineId
            });
        }

        // Clear proposals
        setClients(prev => prev.map(c => c.id === clientId ? {
            ...c,
            proposedLastTouchSummary: undefined,
            proposedNextAction: undefined,
            proposedNextActionDueDate: undefined,
        } : c));
    }, [clients, addTask, setClients]);

    const clearProposedClientUpdate = useCallback((clientId: string) => {
         setClients(prev => prev.map(c => c.id === clientId ? {
            ...c,
            proposedLastTouchSummary: undefined,
            proposedNextAction: undefined,
            proposedNextActionDueDate: undefined,
        } : c));
    }, [setClients]);


  const deleteClient = useCallback((id: string) => {
    const dealsToDelete = deals.filter(d => d.clientId === id).map(d => d.id);
    
    setClients(prev => prev.filter(c => c.id !== id));
    setDeals(prev => prev.filter(d => d.clientId !== id));
    setTasks(prev => prev.filter(t => t.clientId !== id));
    setDocuments(prev => {
        const ownersToDelete = new Set([id, ...dealsToDelete]);
        return prev.filter(doc => !ownersToDelete.has(doc.ownerId));
    });
    setCrmEntries(prev => prev.filter(e => e.clientId !== id));

    return `Client and all related items deleted.`;
}, [deals, setClients, setDeals, setTasks, setDocuments, setCrmEntries]);

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

    // AUTO-TASK
    addTask({
        title: `Follow up on new deal: ${newDeal.name}`,
        description: `Ensure all initial requirements for the deal are met.`,
        clientId: client.id,
        dealId: newDeal.id,
        businessLineId: newDeal.businessLineId,
        dueDate: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString(),
    });

     _addCRMEntryToState({
        clientId: newDeal.clientId,
        dealId: newDeal.id,
        createdAt: new Date().toISOString(),
        type: 'ai_action',
        summary: `AI created deal: "${newDeal.name}" for ${newDeal.currency} ${newDeal.value}`,
        rawContent: `AI created deal: "${newDeal.name}" for ${newDeal.currency} ${newDeal.value}`
    });
    trackEvent('create', 'Deal', data.name);
    return `Deal "${data.name}" created for client "${data.clientName}". Task added to board.`;
  }, [deals, clients, playbooks, addTask, setDeals]);

  const updateDeal = useCallback((id: string, data: Partial<Omit<Deal, 'id'>>) => {
      let originalDeal: Deal | undefined;
      setDeals(prev => prev.map(d => {
          if (d.id === id) {
              originalDeal = d;
              return { ...d, ...data };
          }
          return d;
      }));
      
      if (originalDeal && data.value && originalDeal.value !== data.value) {
           _addCRMEntryToState({
                clientId: originalDeal.clientId,
                dealId: id,
                createdAt: new Date().toISOString(),
                type: 'ai_action',
                summary: `Deal value updated for "${originalDeal.name}" from ${originalDeal.currency} ${originalDeal.value} to ${originalDeal.currency} ${data.value}.`,
                rawContent: `Deal value updated from ${originalDeal.value} to ${data.value}.`
            });
      }
      return `Deal updated.`;
  }, [setDeals]);

    const updateDealFromInteraction = useCallback(async (dealId: string, interactionText: string) => {
        const deal = deals.find(d => d.id === dealId);
        if (!deal) return;

        try {
            const ai = getAiInstance();
            const prompt = `You are Walter. Analyze this interaction for a Deal.
**Deal:** ${deal.name} (${deal.description})
**Interaction:** "${interactionText}"

Propose: "lastTouchSummary", "nextAction", "nextActionDueDate" (ISO 8601), and "status" (Open, Closed - Won, Closed - Lost).
Return valid JSON.`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: GeminiType.OBJECT,
                        properties: {
                            lastTouchSummary: { type: GeminiType.STRING },
                            nextAction: { type: GeminiType.STRING },
                            nextActionDueDate: { type: GeminiType.STRING },
                            status: { type: GeminiType.STRING, enum: ['Open', 'Closed - Won', 'Closed - Lost'] }
                        },
                        required: ['lastTouchSummary', 'nextAction', 'nextActionDueDate', 'status']
                    }
                }
            });
            const updates = JSON.parse(response.text.trim());

            setDeals(prev => prev.map(d => d.id === dealId ? {
                ...d,
                proposedLastTouchSummary: updates.lastTouchSummary,
                proposedNextAction: updates.nextAction,
                proposedNextActionDueDate: updates.nextActionDueDate,
                proposedStatus: updates.status
            } : d));

        } catch (e) {
            console.error("Error updating deal from interaction:", e);
        }
    }, [deals, setDeals]);

    const approveDealUpdate = useCallback((dealId: string) => {
        const deal = deals.find(d => d.id === dealId);
        if (!deal || !deal.proposedLastTouchSummary) return;

        _addCRMEntryToState({
            clientId: deal.clientId,
            dealId: deal.id,
            createdAt: new Date().toISOString(),
            type: 'note',
            summary: `Interaction: ${deal.proposedLastTouchSummary}`,
            rawContent: deal.proposedLastTouchSummary
        });

        if (deal.proposedNextAction) {
             addTask({
                title: deal.proposedNextAction,
                dueDate: deal.proposedNextActionDueDate,
                clientId: deal.clientId,
                dealId: deal.id,
                businessLineId: deal.businessLineId
            });
        }

        setDeals(prev => prev.map(d => d.id === dealId ? {
            ...d,
            status: d.proposedStatus || d.status,
            proposedLastTouchSummary: undefined,
            proposedNextAction: undefined,
            proposedNextActionDueDate: undefined,
            proposedStatus: undefined
        } : d));
    }, [deals, addTask, setDeals]);

    const clearProposedDealUpdate = useCallback((dealId: string) => {
         setDeals(prev => prev.map(d => d.id === dealId ? {
            ...d,
            proposedLastTouchSummary: undefined,
            proposedNextAction: undefined,
            proposedNextActionDueDate: undefined,
            proposedStatus: undefined
        } : d));
    }, [setDeals]);


  const deleteDeal = useCallback((id: string) => {
    setDeals(prev => prev.filter(d => d.id !== id));
    setTasks(prev => prev.filter(t => t.dealId !== id));
    setDocuments(prev => prev.filter(doc => doc.ownerId === id && doc.ownerType === 'deal'));
    setCrmEntries(prev => prev.filter(e => e.dealId === id));
    
    return `Deal and all related items deleted.`;
}, [setDeals, setTasks, setDocuments, setCrmEntries]);

    const addProject = useCallback((data: Partial<Omit<Project, 'id'>> & { partnerName: string; projectName: string; goal: string; }) => {
        const partnerAsClient = clients.find(c => c.name.toLowerCase() === data.partnerName.toLowerCase());
        
        const newProject: Project = {
            id: `proj-${Date.now()}`,
            partnerName: data.partnerName,
            projectName: data.projectName,
            goal: data.goal,
            dealType: data.dealType || 'Fee-based',
            expectedRevenue: data.expectedRevenue || 0,
            impactMetric: data.impactMetric || 'N/A',
            stage: data.stage || 'Lead',
            projectOwner: 'Grandma Oloo',
            lastTouchDate: new Date().toISOString(),
            lastTouchSummary: 'Project created by Walter.',
            nextAction: 'Define initial milestones and schedule kickoff call.',
            nextActionOwner: 'Grandma Oloo',
            nextActionDueDate: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString(),
            opportunityNote: '',
            clientId: partnerAsClient?.id,
        };
        setProjects(prev => [newProject, ...prev]);
        
        // AUTO-TASK
        addTask({
            title: newProject.nextAction,
            dueDate: newProject.nextActionDueDate,
            projectId: newProject.id,
            clientId: newProject.clientId,
            description: `Goal: ${newProject.goal}`
        });

        if (newProject.clientId) {
            _addCRMEntryToState({
                clientId: newProject.clientId,
                projectId: newProject.id,
                createdAt: new Date().toISOString(),
                type: 'ai_action',
                summary: `AI created project: "${newProject.projectName}"`,
                rawContent: `AI created project: "${newProject.projectName}" with partner ${newProject.partnerName}`,
            });
        }
        trackEvent('create', 'Project', newProject.projectName);
        return `Project "${newProject.projectName}" created. Initial task added.`;
    }, [clients, addTask, setProjects]);

    const updateProject = useCallback((id: string, data: Partial<Omit<Project, 'id'>>) => {
        setProjects(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
        return `Project updated.`;
    }, [setProjects]);

    const updateProjectFromInteraction = useCallback(async (projectId: string, interactionText: string) => {
        const project = projects.find(p => p.id === projectId);
        if (!project) return;

        try {
            const ai = getAiInstance();
            const prompt = `You are Walter, an AI project assistant. A new interaction has been logged for a project. Your job is to analyze it and propose updates.

**Project Context:**
- Partner: ${project.partnerName}
- Project: ${project.projectName}
- Current Stage: ${project.stage}
- Goal: ${project.goal}
- Current Next Action: ${project.nextAction}

**New Interaction Logged:**
"${interactionText}"

**Your Task:**
Based on the new interaction, generate a concise "Last touch summary", propose a new "Next action" with a due date, and suggest an updated "Stage" if applicable.
Return ONLY a valid JSON object with the keys: "lastTouchSummary", "nextAction", "nextActionDueDate", and "stage".
The stage must be one of: 'Lead', 'In design', 'Live', 'Closing', 'Dormant'.
The due date should be in ISO 8601 format.`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: GeminiType.OBJECT,
                        properties: {
                            lastTouchSummary: { type: GeminiType.STRING },
                            nextAction: { type: GeminiType.STRING },
                            nextActionDueDate: { type: GeminiType.STRING },
                            stage: { type: GeminiType.STRING, enum: ['Lead', 'In design', 'Live', 'Closing', 'Dormant'] }
                        },
                        required: ['lastTouchSummary', 'nextAction', 'nextActionDueDate', 'stage']
                    }
                }
            });
            const updates = JSON.parse(response.text.trim());

            setProjects(prev => prev.map(p => p.id === projectId ? {
                ...p,
                proposedLastTouchSummary: updates.lastTouchSummary,
                proposedNextAction: updates.nextAction,
                proposedNextActionDueDate: updates.nextActionDueDate,
                proposedStage: updates.stage
            } : p));

        } catch (e) {
            console.error("Error updating project from interaction:", e);
        }
    }, [projects, setProjects]);
    
    const approveProjectUpdate = useCallback((projectId: string) => {
        const project = projects.find(p => p.id === projectId);
        if (!project || !project.proposedLastTouchSummary) return;

        const newCRMEntrySummary = `Interaction logged for "${project.projectName}": ${project.proposedLastTouchSummary}`;
        
        setProjects(prev => prev.map(p => {
            if (p.id === projectId) {
                return {
                    ...p,
                    lastTouchDate: new Date().toISOString(),
                    lastTouchSummary: p.proposedLastTouchSummary || p.lastTouchSummary,
                    nextAction: p.proposedNextAction || p.nextAction,
                    nextActionDueDate: p.proposedNextActionDueDate || p.nextActionDueDate,
                    stage: p.proposedStage || p.stage,
                    proposedLastTouchSummary: undefined,
                    proposedNextAction: undefined,
                    proposedNextActionDueDate: undefined,
                    proposedStage: undefined,
                };
            }
            return p;
        }));

        if (project.proposedNextAction) {
             addTask({
                title: project.proposedNextAction,
                dueDate: project.proposedNextActionDueDate,
                projectId: project.id,
                clientId: project.clientId,
                description: `Auto-generated from project interaction.`
            });
        }

        if (project.clientId) {
            _addCRMEntryToState({
                clientId: project.clientId,
                projectId: project.id,
                createdAt: new Date().toISOString(),
                type: 'note',
                summary: newCRMEntrySummary,
                rawContent: project.proposedLastTouchSummary!,
            });
        }

    }, [projects, addTask, setProjects]);
    
    const clearProposedProjectUpdate = useCallback((projectId: string) => {
        setProjects(prev => prev.map(p => p.id === projectId ? {
             ...p,
             proposedLastTouchSummary: undefined,
             proposedNextAction: undefined,
             proposedNextActionDueDate: undefined,
             proposedStage: undefined,
        } : p));
    }, [setProjects]);

    const deleteProject = useCallback((id: string) => {
        setProjects(prev => prev.filter(p => p.id !== id));
        setTasks(prev => prev.filter(t => t.projectId !== id));
        return `Project and related tasks deleted.`;
    }, [setProjects, setTasks]);
  
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
        summary: data.content,
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
        const ai = getAiInstance();
        const client = clients.find(c => c.id === task.clientId);
        const lastCRMEntry = crmEntries.filter(c => c.clientId === task.clientId).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
        
        let prompt = `A task was just completed. Based on all the context, suggest 1-2 concrete, actionable next-step tasks.
        Return ONLY a valid JSON array of objects, where each object has a "text" (the suggestion for the user) and a "taskTitle" (the title for the new task).
        
        CONTEXT:
        - Completed Task: "${task.title}"
        ${client ? `- Client: "${client.name}"` : ''}
        ${deal ? `- Deal: "${deal.name}"` : ''}
        - Last conversation: ${lastCRMEntry ? `"${lastCRMEntry.summary}"` : "None."}
        `;

        if (nextStep) {
            prompt += `- Next standard step: "${nextStep.title}"`
        } else {
            prompt += `- No standard playbook. Use your best judgment.`
        }
        
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

  }, [tasks, deals, playbooks, clients, crmEntries, documents, setDeals, setClients]);

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
  }, [generateNextStepSuggestions, setTasks]);

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
  }, [updateTaskStatusById, setTasks]);

  const dismissSuggestions = useCallback((ownerType: 'client' | 'deal', ownerId: string) => {
    if (ownerType === 'client') {
        setClients(prev => prev.map(c => c.id === ownerId ? {...c, suggestions: []} : c));
    } else {
        setDeals(prev => prev.map(d => d.id === ownerId ? {...d, suggestions: []} : d));
    }
  }, [setClients, setDeals]);
  
  const getOpportunities = useCallback(async (businessLine: BusinessLine, expand: boolean = false): Promise<{ opportunities: Opportunity[], sources: any[] }> => {
    try {
        const ai = getAiInstance();
        const prompt = `You are a top-tier business strategist. Analyze the following business line, perform a deep web search for market trends and news, and generate 3 highly specific and creative business opportunities. For each, explain *why* it's a good idea based on your research. ${expand ? 'Provide new and different ideas from the last time.' : ''} Return ONLY a valid JSON array of strings.

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
        const businessLine = businessLines.find(bl => bl.id === client.businessLineId);
        const ai = getAiInstance();
        const prompt = `You are a top-tier business strategist. Analyze the following client, perform a deep web search for news and trends related to them, and generate 3 simple, actionable opportunities to grow the business relationship. Return ONLY a valid JSON array of strings.
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
        const client = clients.find(c => c.id === deal.clientId);
        const businessLine = businessLines.find(bl => bl.id === deal.businessLineId);
        const ai = getAiInstance();
        const prompt = `You are a top-tier business strategist. Based on the following deal, perform a deep web search for industry trends, and generate 3 simple, actionable next steps or upsell opportunities. Return ONLY a valid JSON array of strings.
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
  }, [setDocuments]);

  const generateDocumentDraft = useCallback(async (prompt: string, category: DocumentCategory, owner: BusinessLine | Client | Deal | Project, ownerType: DocumentOwnerType): Promise<string> => {
    try {
        const ai = getAiInstance();
        const ownerName = 'name' in owner ? owner.name : owner.projectName;
        let fullPrompt = `You are an expert business document writer. Generate a professional draft for a "${category}" document for a ${ownerType} named "${ownerName}". The user's request is: "${prompt}". Provide only the draft text, without any introductory phrases.`;

        if (ownerType === 'client') {
            const client = owner as Client;
            const businessLine = businessLines.find(bl => bl.id === client.businessLineId);
            fullPrompt = `You are an expert business document writer. Generate a professional draft for a "${category}" document.
            
            **CRITICAL CONTEXT:**
            - Client: "${client.name}" (${client.description})
            - Business Line: "${businessLine?.name || 'General'}"
            - Our strategic focus with this client: "${client.aiFocus}"

            **User's Request:** "${prompt}"

            Use all the context to create a highly tailored and relevant document. Provide only the draft text.`;
        }
        
        const response = await ai.models.generateContent({ model: 'gemini-2.5-pro', contents: fullPrompt });
        return response.text.trim();
    } catch (e) {
        console.error("Error generating document draft:", e);
        return "Sorry, I encountered an error while drafting the document. Please try again.";
    }
  }, [businessLines]);

  const generateMarketingCollateralContent = useCallback(async (prompt: string, collateralType: string, owner: BusinessLine | Client | Deal): Promise<string> => {
    try {
        const ai = getAiInstance();
        const fullPrompt = `You are an expert marketing copywriter. Generate the content for a "${collateralType}" about "${owner.name}". The user's goal is: "${prompt}". Provide only the generated content, ready to be used.`;
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: fullPrompt });
        return response.text.trim();
    } catch (e) {
        console.error("Error generating marketing collateral content:", e);
        return "Sorry, I encountered an error while generating the content. Please try again.";
    }
  }, []);
  
  const enhanceUserPrompt = useCallback(async (prompt: string): Promise<string> => {
    try {
      const ai = getAiInstance();
      const fullPrompt = `You are an expert prompt engineer. Enhance the following user prompt to generate better marketing content. Make it more descriptive, creative, and specific. User prompt: "${prompt}". Your output must be only the enhanced prompt text.`;
      const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: fullPrompt });
      return response.text.trim();
    } catch(e) {
      console.error("Error enhancing prompt:", e);
      return prompt;
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
  }, [setDeals]);

  const findProspects = useCallback(async (businessLine: BusinessLine, customPrompt?: string): Promise<{ prospects: Prospect[], sources: any[] }> => {
    try {
      const ai = getAiInstance();
      const prompt = customPrompt || `You are a business development expert. Based on my business line "${businessLine.name}" (${businessLine.description}), perform a deep web search to find 5 potential new clients. For each, provide a name and a likely need. Return ONLY a valid JSON array of objects, where each object has "name" and "likelyNeed".`;
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
        return `Based on my research, I found a few prospects for ${businessLineName}: ${prospectNames}.`;
    } catch (e) {
        console.error("Error finding prospects by name:", e);
        return `Sorry, I had trouble searching for prospects for "${businessLineName}".`;
    }
  }, [businessLines, findProspects]);

  const generateNextTaskFromSubtask = useCallback(async (task: Task, completedSubtaskText: string) => {
    try {
        const ai = getAiInstance();
        const client = clients.find(c => c.id === task.clientId);
        const deal = deals.find(d => d.id === task.dealId);
        
        const prompt = `A sub-task was just completed. Based on the context, suggest the single most logical next task to continue the workflow.
        
        **Context:**
        - Main Task: "${task.title}"
        - Completed Sub-task: "${completedSubtaskText}"
        - Client: ${client?.name || 'N/A'}
        - Deal: ${deal?.name || 'N/A'}

        Your response MUST BE a valid JSON object. It must contain a single key, "taskTitle". If no obvious next task is needed, the value MUST be null.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: GeminiType.OBJECT,
                    properties: {
                        taskTitle: { type: GeminiType.STRING, nullable: true }
                    },
                    required: ["taskTitle"],
                }
            }
        });
        const result = JSON.parse(response.text.trim());
        if (result.taskTitle) {
            addTask({
                title: result.taskTitle,
                description: `Generated after completing sub-task: "${completedSubtaskText}"`,
                clientId: task.clientId,
                dealId: task.dealId,
                businessLineId: task.businessLineId,
            });
        }
    } catch (e) {
        console.error("Error generating next task from subtask:", e);
    }
  }, [clients, deals, addTask]);

  const toggleSubTask = useCallback((taskId: string, subTaskId: string) => {
    let completedSubTask: { id: string, text: string, isDone: boolean} | undefined;
    let task: Task | undefined;
    let newSubTasks: Task['subTasks'] | undefined;

    setTasks(prev => prev.map(t => {
        if (t.id === taskId) {
            task = t;
            newSubTasks = t.subTasks?.map(sub => {
                if (sub.id === subTaskId) {
                    completedSubTask = { ...sub, isDone: !sub.isDone };
                    return completedSubTask;
                }
                return sub;
            });
            return { ...t, subTasks: newSubTasks };
        }
        return t;
    }));
    
    if (task && completedSubTask && completedSubTask.isDone) {
        generateNextTaskFromSubtask(task, completedSubTask.text);
    }
    
    if (task && newSubTasks) {
        const allDone = newSubTasks.every(s => s.isDone);
        if (allDone && task.status !== KanbanStatus.Done) {
            updateTaskStatusById(taskId, KanbanStatus.Done);
        }
    }
}, [generateNextTaskFromSubtask, updateTaskStatusById, setTasks]);

  const generateSocialMediaIdeas = useCallback(async (businessLine: BusinessLine, customPrompt?: string): Promise<string[]> => {
    try {
        const ai = getAiInstance();
        const prompt = customPrompt || `Based on my business line "${businessLine.name}" and recent online trends, generate 5 timely social media post ideas. Return ONLY a valid JSON array of strings.`;
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
        const ai = getAiInstance();
        const prompt = customPrompt || `My strategic focus with client "${client.name}" (${client.description}) is: "${client.aiFocus}". Search the web for recent news, articles, or social media posts related to this strategic focus. Return ONLY a valid JSON array of objects with keys: "source", "content", "url", "date".`;
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
        const ai = getAiInstance();
        const prompt = customPrompt || `For a business in "${businessLine.name}", perform a deep search online. Return ONLY a valid JSON object with two keys: "insights" (an array of objects with "competitorName", "insight", "source") and "trends" (an array of objects with "keyword", "insight").`;
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
        const ai = getAiInstance();
        const prompt = `Based on the task "${task.title}", generate the content for the following sub-task: "${subtaskText}". Return only the document content.`;
        const response = await ai.models.generateContent({ model: 'gemini-2.5-pro', contents: prompt });
        const content = response.text.trim();
        const docName = `${subtaskText}.gdoc`;
        
        let ownerId = task.dealId || task.clientId || task.businessLineId || task.projectId;
        let ownerType: DocumentOwnerType = task.dealId ? 'deal' : (task.projectId ? 'project' : (task.clientId ? 'client' : 'businessLine'));

        if (!ownerId) return null; 

        const newDoc = addDocument({ name: docName, content }, 'Templates', ownerId, ownerType);

        if (task.clientId) {
          _addCRMEntryToState({
              clientId: task.clientId,
              dealId: task.dealId,
              projectId: task.projectId,
              createdAt: new Date().toISOString(),
              type: 'ai_action',
              summary: `AI generated document: "${docName}" for task "${task.title}"`,
              rawContent: `AI generated document from subtask: "${subtaskText}"`,
              documentId: newDoc.id,
          });
        }

        return newDoc;
    } catch (e) {
        console.error("Error generating document from subtask:", e);
        return null;
    }
  }, [addDocument]);
  
  const getPlatformInsights = useCallback((): PlatformInsight[] => {
    const insights: PlatformInsight[] = [];
    if (tasks.filter(t => t.status === KanbanStatus.Done).length > 5) {
      insights.push({ id: 'insight-1', text: "You've completed several tasks recently. Consider archiving old 'Done' items to keep your board clean." });
    }
    if (deals.filter(d => d.status === 'Open').length > 3) {
      insights.push({ id: 'insight-2', text: "You have multiple open deals. Prioritize follow-ups on the highest value deals to maximize revenue." });
    }
    if (crmEntries.length > 10) {
        insights.push({ id: 'insight-3', text: 'You are actively logging CRM entries. Great job keeping your client communication up to date!' });
    }
    if (insights.length === 0) {
        insights.push({ id: 'insight-4', text: 'Keep interacting with the platform to receive personalized insights on your workflow.' });
    }
    return insights.slice(0, 2);
  }, [tasks, deals, crmEntries]);

  const updateTask = useCallback((taskId: string, data: Partial<Omit<Task, 'id' | 'createdAt'>>) => {
    let originalTask: Task | undefined;
    let updatedTask: Task | undefined;
    setTasks(prev => prev.map(t => {
        if (t.id === taskId) {
            originalTask = t;
            updatedTask = { ...t, ...data };
            return updatedTask;
        }
        return t;
    }));
    
    if (originalTask && updatedTask) {
        if (data.clientId && originalTask.clientId !== data.clientId) {
            _addCRMEntryToState({
                clientId: data.clientId,
                dealId: updatedTask.dealId,
                projectId: updatedTask.projectId,
                createdAt: new Date().toISOString(),
                type: 'ai_action',
                summary: `Task "${updatedTask.title}" was associated with this client.`,
                rawContent: `Task updated: ${JSON.stringify(data)}`
            });
        }
        if (data.assigneeId && originalTask.assigneeId !== data.assigneeId) {
            const assignee = teamMembers.find(tm => tm.id === data.assigneeId);
            if (assignee) {
                 console.log(`Simulating email to ${assignee.email}: You have been assigned to task "${updatedTask.title}"`);
            }
        }
    }
    
    return `Task "${data.title}" updated.`;
  }, [teamMembers, setTasks]);

  const promoteSubtaskToTask = useCallback((taskId: string, subTaskId: string) => {
    const parentTask = tasks.find(t => t.id === taskId);
    const subTask = parentTask?.subTasks?.find(st => st.id === subTaskId);

    if (parentTask && subTask) {
        addTask({
            title: subTask.text,
            description: `Promoted from sub-task of "${parentTask.title}"`,
            clientId: parentTask.clientId,
            dealId: parentTask.dealId,
            projectId: parentTask.projectId,
            businessLineId: parentTask.businessLineId,
        });

        const newSubTasks = parentTask.subTasks?.filter(st => st.id !== subTaskId);
        setTasks(prev => prev.map(t => 
            t.id === taskId ? { ...t, subTasks: newSubTasks } : t
        ));
    }
  }, [tasks, addTask, setTasks]);

  const researchSubtask = useCallback(async (subtaskText: string, taskContext: string): Promise<string> => {
    try {
        const ai = getAiInstance();
        const prompt = `Perform a concise web search and provide a summary for the following research task.
        Task: "${subtaskText}"
        Context: "${taskContext}"
        
        Provide a brief, direct summary of your findings.`;

        const response = await ai.models.generateContent({ 
            model: 'gemini-2.5-pro', 
            contents: prompt,
            config: {
                tools: [{googleSearch: {}}],
            }
        });
        return response.text.trim();
    } catch (e) {
        console.error("Error researching subtask:", e);
        return "Sorry, I couldn't complete the research. Please try again.";
    }
  }, []);

  const refineTaskChecklist = useCallback(async (taskId: string, command: string) => {
    try {
        const task = tasks.find(t => t.id === taskId);
        if (!task || !task.subTasks) return;

        const ai = getAiInstance();
        const client = clients.find(c => c.id === task.clientId);
        const deal = deals.find(d => d.id === task.dealId);
        const currentSubTaskTexts = task.subTasks.map(st => st.text);

        const prompt = `You are an expert project manager AI. Your job is to intelligently modify a task's checklist based on a user's command.
**CRITICAL CONTEXT:**
- Task Title: "${task.title}"
- Client: ${client?.name || 'N/A'}
- Deal: ${deal?.name || 'N/A'}
**CURRENT CHECKLIST:**
${JSON.stringify(currentSubTaskTexts, null, 2)}
**USER'S COMMAND:**
"${command}"
**Your Output (JSON array of strings only):**`;
        
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
        const newSubTaskTexts: string[] = JSON.parse(response.text.trim());
        
        const newSubTasks = newSubTaskTexts.map((text, index) => {
            const existing = task.subTasks?.find(st => st.text === text);
            return {
                id: existing?.id || `sub-${task.id}-${Date.now()}-${index}`,
                text,
                isDone: existing?.isDone || false,
            };
        });

        setTasks(prev => prev.map(t => 
            t.id === taskId ? { ...t, subTasks: newSubTasks } : t
        ));

    } catch (e) {
        console.error("Error refining checklist:", e);
    }
  }, [tasks, clients, deals, setTasks]);

  const getPlatformQueryResponse = useCallback(async (query: string): Promise<string> => {
      try {
        const ai = getAiInstance();
        const today = new Date();
        
        let context = `Today's date is ${today.toDateString()}.
        Open Tasks: ${tasks.filter(t => t.status !== 'Done' && t.status !== 'Terminated').map(t => t.title).join(', ') || 'None'}.
        Open Deals: ${deals.filter(d => d.status === 'Open').map(d => `${d.name} for ${clients.find(c => c.id === d.clientId)?.name}`).join(', ') || 'None'}.
        `;

        if (query.toLowerCase().includes('project')) {
            const projectsMoved = projects.filter(p => new Date(p.lastTouchDate) > new Date(today.setDate(today.getDate() - 7)));
            const projectsStuck = projects.filter(p => new Date(p.nextActionDueDate) < new Date() && p.stage !== 'Dormant');

            context += `
            All Projects:
            ${projects.map(p => `- ${p.projectName} with ${p.partnerName}, Stage: ${p.stage}, Next Action: ${p.nextAction} due ${p.nextActionDueDate}`).join('\n')}
            Projects updated this week: ${projectsMoved.map(p => p.projectName).join(', ') || 'None'}.
            Stuck projects (overdue next action): ${projectsStuck.map(p => p.projectName).join(', ') || 'None'}.
            `;
        }

        const prompt = `You are Walter, an AI business assistant. Answer the user's query based on the context provided.
        Context:
        ${context}

        User's Query: "${query}"`;

        const response = await ai.models.generateContent({ model: 'gemini-2.5-pro', contents: prompt });
        return response.text.trim();

      } catch (e) {
          console.error("Error with platform query:", e);
          return "I'm sorry, I had trouble analyzing your data. Please try asking again.";
      }
  }, [tasks, deals, clients, crmEntries, projects]);

  const logEmailToCRM = useCallback((clientId: string, dealId: string | undefined, subject: string, body: string) => {
      _addCRMEntryToState({
          clientId,
          dealId,
          createdAt: new Date().toISOString(),
          type: 'email',
          summary: `Email sent: "${subject}"`,
          rawContent: body,
      });
  }, []);

  const inviteMember = useCallback((email: string, role: any) => {
      const newMember: TeamMember = {
          id: `team-${Date.now()}`,
          name: email.split('@')[0], // Simple name derivation
          email,
          role,
          status: 'Invited'
      };
      setTeamMembers(prev => [...prev, newMember]);
  }, [setTeamMembers]);

  const generateMeetingTranscript = useCallback(async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if(!task) return;
    
    try {
        const ai = getAiInstance();
        const prompt = `Simulate a brief meeting transcript for a meeting about "${task.title}". Include 2-3 speakers and action items.`;
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        const transcript = response.text.trim();
        
        if (task.clientId) {
             _addCRMEntryToState({
                clientId: task.clientId,
                dealId: task.dealId,
                projectId: task.projectId,
                createdAt: new Date().toISOString(),
                type: 'meeting',
                summary: `Meeting Transcript: ${task.title}`,
                rawContent: transcript,
            });
        }
    } catch (e) {
        console.error("Error generating transcript:", e);
    }
  }, [tasks, setCrmEntries]);

  return {
    tasks,
    businessLines,
    clients,
    deals,
    projects,
    documents,
    playbooks,
    crmEntries,
    teamMembers,
    addTask,
    addBusinessLine,
    updateBusinessLine,
    deleteBusinessLine,
    addClient,
    updateClient,
    updateClientFromInteraction,
    approveClientUpdate,
    clearProposedClientUpdate,
    deleteClient,
    addDeal,
    updateDeal,
    updateDealFromInteraction,
    approveDealUpdate,
    clearProposedDealUpdate,
    deleteDeal,
    addProject,
    updateProject,
    updateProjectFromInteraction,
    approveProjectUpdate,
    clearProposedProjectUpdate,
    deleteProject,
    addDocument,
    deleteDocument,
    addCRMEntryFromVoice,
    updateTaskStatusById,
    updateTaskStatusByTitle,
    generateDocumentDraft,
    generateMarketingCollateralContent,
    enhanceUserPrompt,
    logPaymentOnDeal,
    findProspects,
    findProspectsByName,
    generateNextTaskFromSubtask,
    toggleSubTask,
    generateSocialMediaIdeas,
    processTextAndExecute,
    regeneratePlaybook,
    updatePlaybook,
    dismissSuggestions,
    getOpportunities,
    getClientOpportunities,
    getDealOpportunities,
    getClientPulse,
    getCompetitorInsights,
    generateDocumentFromSubtask,
    getPlatformInsights,
    updateTask,
    promoteSubtaskToTask,
    researchSubtask,
    refineTaskChecklist,
    getPlatformQueryResponse,
    logEmailToCRM,
    inviteMember,
    generateMeetingTranscript,
  };
};
