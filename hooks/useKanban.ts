
import { useState, useCallback, useEffect } from 'react';
import { Task, KanbanStatus, TaskType, BusinessLine, Client, Deal, Document, DocumentCategory, Opportunity, DocumentOwnerType, Playbook, PlaybookStep, CRMEntry, CRMEntryType, Suggestion, Prospect, ClientPulse, CompetitorInsight, SearchTrend, FilterOptions, GeminiType, PlatformInsight, Project, TeamMember, Contact, Role, UniversalInputContext } from '../types';
import { initialTasks, initialBusinessLines, initialClients, initialDeals, initialDocuments, initialPlaybooks, initialCRMEntries, initialProjects, initialTeamMembers, initialContacts } from '../data/mockData';
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
  const [contacts, setContacts] = usePersistentState<Contact[]>('oloo_contacts', initialContacts);

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
      }
  }, [tasks]);

  const addDocument = useCallback((file: File | {name: string, content: string}, category: DocumentCategory, ownerId: string, ownerType: DocumentOwnerType, note?: string): Document => {
    let url = '#';
    if (!(file instanceof File)) {
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

        const prompt = `You are an expert project manager AI. Deconstruct this primary task into a checklist of 3-5 actionable sub-tasks. Return ONLY a JSON array of strings.
CONTEXT:
- Task: "${task.title}"
- Business: ${businessLine?.name || 'N/A'}
- Client: ${client?.name || 'N/A'}
- Deal: ${deal?.name || 'N/A'}
`;
        
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
        const subTaskTexts: string[] = JSON.parse(response.text.trim());
        
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

    trackEvent('create', 'Task', newTask.type);
    return `${newTask.type} "${newTask.title}" created.`;
  }, [businessLines, clients, deals, teamMembers, setTasks, setCrmEntries]);

  const addBusinessLine = useCallback(async (data: Omit<BusinessLine, 'id'>) => {
    const newBusinessLine: BusinessLine = {
      id: `bl-${Date.now()}`,
      ...data,
    };
    setBusinessLines(prev => [newBusinessLine, ...prev]);
    trackEvent('create', 'Business Line', data.name);
    return `Business line "${data.name}" created.`;
  }, [setBusinessLines]);

  const updateBusinessLine = useCallback((id: string, data: Partial<Omit<BusinessLine, 'id'>>) => {
    setBusinessLines(prev => prev.map(bl => bl.id === id ? { ...bl, ...data } : bl));
    return `Business line updated.`;
  }, [setBusinessLines]);

  const deleteBusinessLine = useCallback((id: string) => {
      setBusinessLines(prev => prev.filter(bl => bl.id !== id));
      setClients(prev => prev.filter(c => c.businessLineId !== id));
      setDeals(prev => prev.filter(d => d.businessLineId !== id));
      setTasks(prev => prev.filter(t => t.businessLineId !== id));
      return `Business line deleted.`;
  }, [setBusinessLines, setClients, setDeals, setTasks]);
  
  const addClient = useCallback((data: Omit<Client, 'id' | 'businessLineId'> & { businessLineId?: string, businessLineName?: string }) => {
    let businessLine = businessLines.find(bl => bl.id === data.businessLineId);
    if (!businessLine && businessLines.length > 0) businessLine = businessLines[0];

    const newClient: Client = {
      id: `client-${Date.now()}`,
      name: data.name,
      description: data.description,
      aiFocus: data.aiFocus,
      businessLineId: businessLine?.id || '',
    };
    setClients(prev => [newClient, ...prev]);

    // AUTOMATION: Build it out
    addTask({
        title: `Onboarding for ${newClient.name}`,
        description: `Initial setup and strategy for ${newClient.name}. Focus: ${newClient.aiFocus}`,
        clientId: newClient.id,
        businessLineId: newClient.businessLineId,
        dueDate: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(),
    });

    addDocument(
        { name: 'Client Onboarding Checklist', content: '1. Sign Contract\n2. Welcome Email\n3. Data Gathering' },
        'Templates',
        newClient.id,
        'client'
    );

    _addCRMEntryToState({
        clientId: newClient.id,
        createdAt: new Date().toISOString(),
        type: 'ai_action',
        summary: `AI created client profile for "${newClient.name}"`,
        rawContent: `AI created client profile for "${newClient.name}"`
    });
    return `Client "${data.name}" created.`;
  }, [clients, businessLines, addTask, addDocument, setClients]);

  const updateClient = useCallback((id: string, data: Partial<Omit<Client, 'id'>>) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
    return `Client updated.`;
  }, [setClients]);

  const deleteClient = useCallback((id: string) => {
      setClients(prev => prev.filter(c => c.id !== id));
      setDeals(prev => prev.filter(d => d.clientId !== id));
      setTasks(prev => prev.filter(t => t.clientId !== id));
      setContacts(prev => prev.filter(c => c.clientId !== id));
      return `Client deleted.`;
  }, [setClients, setDeals, setTasks, setContacts]);

  const addDeal = useCallback((data: Omit<Deal, 'id' | 'status' | 'amountPaid' | 'clientId' | 'businessLineId'> & { clientName: string, clientId?: string, businessLineId?: string }) => {
    const client = clients.find(c => c.id === data.clientId || c.name.toLowerCase() === data.clientName.toLowerCase());
    if (!client) return `Client "${data.clientName}" not found.`;

    const newDeal: Deal = {
      id: `deal-${Date.now()}`,
      name: data.name,
      description: data.description,
      status: 'Open',
      clientId: client.id,
      businessLineId: data.businessLineId || client.businessLineId,
      value: data.value,
      currency: data.currency,
      revenueModel: data.revenueModel,
      amountPaid: 0,
    };
    setDeals(prev => [newDeal, ...prev]);

    // AUTOMATION: Build it out
    addTask({
        title: `Prepare proposal for ${newDeal.name}`,
        description: `Draft initial proposal document.`,
        clientId: client.id,
        dealId: newDeal.id,
        businessLineId: newDeal.businessLineId,
        dueDate: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString(),
    });

    addDocument(
        { name: 'Deal Proposal Draft', content: `Proposal for ${newDeal.name}\nValue: ${newDeal.value}` },
        'Business Development',
        newDeal.id,
        'deal'
    );

    return `Deal "${data.name}" created.`;
  }, [deals, clients, addTask, addDocument, setDeals]);

  const updateDeal = useCallback((id: string, data: Partial<Omit<Deal, 'id'>>) => {
      setDeals(prev => prev.map(d => d.id === id ? { ...d, ...data } : d));
      return `Deal updated.`;
  }, [setDeals]);


  const deleteDeal = useCallback((id: string) => {
      setDeals(prev => prev.filter(d => d.id !== id));
      setTasks(prev => prev.filter(t => t.dealId !== id));
      return `Deal deleted.`;
  }, [setDeals, setTasks]);

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
            projectOwner: 'Me',
            lastTouchDate: new Date().toISOString(),
            lastTouchSummary: 'Project created.',
            nextAction: 'Initial Setup',
            nextActionOwner: 'Me',
            nextActionDueDate: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString(),
            opportunityNote: '',
            clientId: partnerAsClient?.id,
        };
        setProjects(prev => [newProject, ...prev]);
        
        // AUTOMATION
        addTask({
            title: `Kickoff: ${newProject.projectName}`,
            dueDate: newProject.nextActionDueDate,
            projectId: newProject.id,
            clientId: newProject.clientId,
            description: `Goal: ${newProject.goal}`
        });

        addDocument(
            { name: 'Project Charter', content: `Project: ${newProject.projectName}\nGoal: ${newProject.goal}` },
            'Templates',
            newProject.id,
            'project'
        );

        return `Project "${newProject.projectName}" created.`;
    }, [clients, addTask, addDocument, setProjects]);

    const updateProject = useCallback((id: string, data: Partial<Omit<Project, 'id'>>) => {
        setProjects(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
        return `Project updated.`;
    }, [setProjects]);


    const deleteProject = useCallback((id: string) => {
        setProjects(prev => prev.filter(p => p.id !== id));
        setTasks(prev => prev.filter(t => t.projectId !== id));
        return `Project deleted.`;
    }, [setProjects, setTasks]);


  const addContact = useCallback((contact: Omit<Contact, 'id'>) => {
      const newContact: Contact = {
          id: `contact-${Date.now()}`,
          ...contact
      };
      setContacts(prev => [...prev, newContact]);
      return "Contact added.";
  }, [setContacts]);

  const deleteContact = useCallback((id: string) => {
      setContacts(prev => prev.filter(c => c.id !== id));
  }, [setContacts]);
  
  const processTextAndExecute = useCallback(async (text: string, context: UniversalInputContext) => {
        const knownData = {
            clients: clients.map(c => c.name),
            deals: deals.map(d => d.name),
            businessLines: businessLines.map(b => b.name)
        };
        const platformActivitySummary = `Last 3 tasks: ${tasks.slice(0,3).map(t => t.title).join(', ')}.`;
        
        const result = await processTextMessage(text, knownData, context, platformActivitySummary);
        
        if (result.action === 'create_task' || result.action === 'both') {
            result.tasks.forEach(t => {
                let clientId = context.clientId;
                let dealId = context.dealId;
                let businessLineId = context.businessLineId;
                
                if (t.client_name) {
                    const c = clients.find(cl => cl.name.toLowerCase() === t.client_name?.toLowerCase());
                    if (c) clientId = c.id;
                }
                
                addTask({
                    title: t.title,
                    dueDate: t.due_date || undefined,
                    clientId,
                    dealId,
                    businessLineId
                });
            });
        }
        
        if (result.action === 'create_note' || result.action === 'both') {
             if (result.note) {
                 let clientId = context.clientId;
                 if (result.client?.name) {
                     const c = clients.find(cl => cl.name.toLowerCase() === result.client?.name?.toLowerCase());
                     if (c) clientId = c.id;
                 }
                 if (clientId) {
                      _addCRMEntryToState({
                          clientId,
                          dealId: context.dealId,
                          type: result.note.channel as CRMEntryType || 'note',
                          summary: result.note.text,
                          rawContent: result.note.text,
                          createdAt: new Date().toISOString()
                      });
                 }
             }
        }
  }, [clients, deals, businessLines, tasks, addTask]);

  // Placeholder functions for missing ones to avoid errors during compilation if not imported
  const generateDocumentDraft = useCallback(async (prompt: string, category: DocumentCategory, owner: BusinessLine | Client | Deal | Project, ownerType: DocumentOwnerType) => {
       try {
        const ai = getAiInstance();
        const ownerName = 'name' in owner ? owner.name : owner.projectName;
        const fullPrompt = `Draft a "${category}" document for ${ownerName}. Request: ${prompt}`;
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: fullPrompt });
        return response.text.trim();
    } catch (e) { return "Error generating draft."; }
  }, []);
  
  const generateMarketingCollateralContent = useCallback(async (prompt: string, type: string, owner: any) => { return "Marketing content placeholder"; }, []);
  const enhanceUserPrompt = useCallback(async (prompt: string) => { return prompt; }, []);
  const logPaymentOnDeal = useCallback((id: string, amount: number, note: string) => { 
      updateDeal(id, { amountPaid: (deals.find(d => d.id === id)?.amountPaid || 0) + amount });
  }, [deals, updateDeal]);
  
  const findProspects = useCallback(async (businessLine: BusinessLine, prompt: string) => { return { prospects: [], sources: [] }; }, []);
  const findProspectsByName = useCallback(async (data: { businessLineName: string }) => { return ""; }, []);
  const generateNextTaskFromSubtask = useCallback(async (taskId: string, subTaskId: string) => {}, []);
  const toggleSubTask = useCallback((taskId: string, subTaskId: string) => {
       setTasks(prev => prev.map(t => {
           if (t.id === taskId) {
               return { ...t, subTasks: t.subTasks?.map(s => s.id === subTaskId ? { ...s, isDone: !s.isDone } : s) };
           }
           return t;
       }));
  }, [setTasks]);
  const generateSocialMediaIdeas = useCallback(async (businessLine: BusinessLine, prompt: string) => { return []; }, []);
  const regeneratePlaybook = useCallback(async (businessLine: BusinessLine) => {}, []);
  const updatePlaybook = useCallback((id: string, steps: PlaybookStep[]) => {
      setPlaybooks(prev => prev.map(p => p.id === id ? { ...p, steps } : p));
  }, [setPlaybooks]);
  const dismissSuggestions = useCallback((type: string, id: string) => {}, []);
  const getOpportunities = useCallback(async (businessLine: BusinessLine, expand: boolean) => { return { opportunities: [], sources: [] }; }, []);
  const getClientOpportunities = useCallback(async (client: Client) => { return { opportunities: [], sources: [] }; }, []);
  const getDealOpportunities = useCallback(async (deal: Deal) => { return { opportunities: [], sources: [] }; }, []);
  const getClientPulse = useCallback(async (client: Client, filters: FilterOptions, customPrompt?: string) => { return []; }, []);
  const getCompetitorInsights = useCallback(async (businessLine: BusinessLine, filters: FilterOptions, customPrompt?: string) => { return { insights: [], trends: [] }; }, []);
  const generateDocumentFromSubtask = useCallback(async (task: Task, subtaskText: string) => { return null; }, []);
  const getPlatformInsights = useCallback(() => { return []; }, []);
  const updateTask = useCallback((id: string, data: any) => {
       setTasks(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
  }, [setTasks]);
  const promoteSubtaskToTask = useCallback(() => {}, []);
  const researchSubtask = useCallback(async (query: string, context: string) => { return ""; }, []);
  const refineTaskChecklist = useCallback(async (taskId: string, command: string) => {}, []);
  const getPlatformQueryResponse = useCallback(async () => { return ""; }, []);
  const logEmailToCRM = useCallback((clientId: string, subject: string, body: string) => {}, []);
  const inviteMember = useCallback((email: string, role: Role) => {}, []);
  const generateMeetingTranscript = useCallback(async (taskId: string) => {}, []);
  const updateProjectFromInteraction = useCallback(async (projectId: string, text: string) => {}, []);
  const approveProjectUpdate = useCallback((projectId: string) => {}, []);
  const clearProposedProjectUpdate = useCallback((projectId: string) => {}, []);
  const updateClientFromInteraction = useCallback(async (clientId: string, text: string) => {}, []);
  const approveClientUpdate = useCallback((clientId: string) => {}, []);
  const clearProposedClientUpdate = useCallback((clientId: string) => {}, []);
  const updateDealFromInteraction = useCallback(async (dealId: string, text: string) => {}, []);
  const approveDealUpdate = useCallback((dealId: string) => {}, []);
  const clearProposedDealUpdate = useCallback((dealId: string) => {}, []);
  const updateTaskStatusById = useCallback((id: string, status: KanbanStatus) => {
       setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));
  }, [setTasks]);
  const updateTaskStatusByTitle = useCallback((title: string, status: KanbanStatus) => { return ""; }, []);
  const deleteDocument = useCallback((id: string) => {
      setDocuments(prev => prev.filter(d => d.id !== id));
  }, [setDocuments]);
  
  const addCRMEntryFromVoice = useCallback((data: any) => { return ""; }, []);

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
    contacts,
    addTask,
    addBusinessLine,
    updateBusinessLine,
    deleteBusinessLine,
    addClient,
    updateClient,
    deleteClient,
    addDeal,
    updateDeal,
    deleteDeal,
    addProject,
    updateProject,
    deleteProject,
    addDocument,
    addContact,
    deleteContact,
    updateClientFromInteraction, approveClientUpdate, clearProposedClientUpdate,
    updateDealFromInteraction, approveDealUpdate, clearProposedDealUpdate,
    updateProjectFromInteraction, approveProjectUpdate, clearProposedProjectUpdate,
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
