
import React, { useState, useCallback, useEffect } from 'react';
import { Task, KanbanStatus, TaskType, BusinessLine, Client, Deal, Document, DocumentCategory, Opportunity, DocumentOwnerType, Playbook, PlaybookStep, CRMEntry, CRMEntryType, Suggestion, Prospect, ClientPulse, CompetitorInsight, SearchTrend, FilterOptions, GeminiType, PlatformInsight, Project, TeamMember, Contact, Role, UniversalInputContext, SocialPost, GeminiModality } from '../types';
import { initialTasks, initialBusinessLines, initialClients, initialDeals, initialDocuments, initialPlaybooks, initialCRMEntries, initialProjects, initialTeamMembers, initialContacts } from '../data/mockData';
import { getAiInstance } from '../config/geminiConfig';
import { processTextMessage } from '../services/routerBrainService';
import { generateContentWithSearch, generateVideos } from '../services/geminiService';
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
  const [socialPosts, setSocialPosts] = usePersistentState<SocialPost[]>('oloo_socialPosts', []);

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
    if (!businessLine && data.businessLineName) {
        businessLine = businessLines.find(bl => bl.name.toLowerCase() === data.businessLineName?.toLowerCase());
    }
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

  const generateLeadScore = useCallback(async (client: Client) => {
      try {
          const ai = getAiInstance();
          const prompt = `Analyze this client and assign a Lead Score (0-100) based on their potential value and engagement.
          Client: ${client.name}
          Description: ${client.description}
          AI Focus: ${client.aiFocus}
          
          Return JSON: { "score": number, "reason": string }`;
          
          const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: prompt,
              config: { responseMimeType: 'application/json' }
          });
          
          const result = JSON.parse(response.text.trim());
          updateClient(client.id, { leadScore: result.score, leadScoreReason: result.reason });
      } catch (e) {
          console.error("Lead scoring error:", e);
      }
  }, [updateClient]);

  const addDeal = useCallback((data: Omit<Deal, 'id' | 'status' | 'amountPaid' | 'clientId' | 'businessLineId'> & { clientName: string, clientId?: string, businessLineId?: string }) => {
    let client = clients.find(c => c.id === data.clientId);
    if (!client && data.clientName) {
        client = clients.find(c => c.name.toLowerCase() === data.clientName.toLowerCase());
    }
    if (!client) {
        console.warn(`Client "${data.clientName}" not found for deal creation.`);
        return `Client "${data.clientName}" not found.`;
    }

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
  
  const processTextAndExecute = useCallback(async (text: string, context: UniversalInputContext, file?: { base64: string, mimeType: string }) => {
        const knownData = {
            clients: clients.map(c => c.name),
            deals: deals.map(d => d.name),
            businessLines: businessLines.map(b => b.name)
        };
        const platformActivitySummary = `Last 3 tasks: ${tasks.slice(0,3).map(t => t.title).join(', ')}.`;
        
        const result = await processTextMessage(text, knownData, context, platformActivitySummary, file);
        
        // 1. Create Business Line
        if (result.action === 'create_business_line' && result.businessLine) {
             addBusinessLine(result.businessLine);
        }

        // 2. Create Client
        if (result.action === 'create_client' && result.client) {
            addClient(result.client);
        }

        // 3. Create Deal
        if (result.action === 'create_deal' && result.deal) {
            addDeal(result.deal);
        }
        
        // 4. Create Project
        if (result.action === 'create_project' && result.project) {
            addProject(result.project);
        }

        // 5. Create Task(s)
        if (result.action === 'create_task' || result.action === 'both') {
            result.tasks.forEach(t => {
                let clientId = context.clientId;
                let dealId = context.dealId;
                let businessLineId = context.businessLineId;
                
                // If AI identified a specific client name, override context
                if (t.client_name) {
                    const c = clients.find(cl => cl.name.toLowerCase() === t.client_name?.toLowerCase());
                    if (c) clientId = c.id;
                }

                // If AI did NOT identify a date, but we have a context date (e.g. calendar click), use it
                let dueDate = t.due_date;
                if (!dueDate && context.date) {
                    dueDate = context.date.toISOString();
                }
                
                addTask({
                    title: t.title,
                    dueDate: dueDate || undefined,
                    clientId,
                    dealId,
                    businessLineId
                });
            });
        }
        
        // 6. Create Note
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
  }, [clients, deals, businessLines, tasks, addTask, addBusinessLine, addClient, addDeal, addProject]);
  
  // --- SOCIAL MEDIA FEATURES ---

  const addSocialPost = useCallback((post: Omit<SocialPost, 'id'>) => {
      const newPost: SocialPost = {
          id: `post-${Date.now()}`,
          ...post
      };
      setSocialPosts(prev => [...prev, newPost]);
      return newPost;
  }, [setSocialPosts]);

  const updateSocialPost = useCallback((id: string, data: Partial<SocialPost>) => {
      setSocialPosts(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
  }, [setSocialPosts]);

  const deleteSocialPost = useCallback((id: string) => {
      setSocialPosts(prev => prev.filter(p => p.id !== id));
  }, [setSocialPosts]);

  const generateSocialPostDetails = useCallback(async (prompt: string, channel: string, businessLine: BusinessLine, contextFile?: string, contextMimeType?: string, contextLink?: string) => {
      try {
          const ai = getAiInstance();
          let fullPrompt = `You are a social media manager for "${businessLine.name}".
          Channel: ${channel}.
          Request: "${prompt}".
          
          Task:
          1. Write an engaging caption (including hashtags).
          2. Write a detailed prompt for an AI image generator to create a visual for this post.
          
          Return JSON object: { "caption": string, "visualPrompt": string }`;

          if (contextLink) fullPrompt += `\nContext Link: ${contextLink}`;
          
          const parts: any[] = [{ text: fullPrompt }];
          if (contextFile && contextMimeType) {
              parts.unshift({ inlineData: { mimeType: contextMimeType, data: contextFile } });
          }

          const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: { parts },
              config: {
                  responseMimeType: "application/json",
                  responseSchema: {
                      type: GeminiType.OBJECT,
                      properties: {
                          caption: { type: GeminiType.STRING },
                          visualPrompt: { type: GeminiType.STRING }
                      },
                      required: ["caption", "visualPrompt"]
                  }
              }
          });
          return JSON.parse(response.text.trim());
      } catch (e) {
          console.error(e);
          return { caption: "Error", visualPrompt: "Error" };
      }
  }, []);

  const generateSocialPostContent = useCallback(async (prompt: string, businessLine: BusinessLine, contextFile?: string, contextMimeType?: string, contextLink?: string) => {
      // Fallback to just returning caption if called directly
      const result = await generateSocialPostDetails(prompt, "Social Media", businessLine, contextFile, contextMimeType, contextLink);
      return result.caption;
  }, [generateSocialPostDetails]);

  const generateSocialImage = useCallback(async (prompt: string) => {
      try {
          const ai = getAiInstance();
          // Note: 'gemini-2.5-flash-image' (nano banana) for general image generation
          const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash-image',
              contents: {
                  parts: [{ text: prompt }]
              },
              config: {
                  responseModalities: [GeminiModality.IMAGE]
              }
          });
          
          // Extract base64 image
          const part = response.candidates?.[0]?.content?.parts?.[0];
          if (part && part.inlineData) {
              return `data:image/png;base64,${part.inlineData.data}`;
          }
          return null;
      } catch (e) {
          console.error("Error generating social image:", e);
          return null;
      }
  }, []);

  const generateSocialVideo = useCallback(async (prompt: string) => {
      try {
          const videoUrl = await generateVideos(prompt);
          return videoUrl;
      } catch (e) {
          console.error("Error generating video:", e);
          return null;
      }
  }, []);

  // CHAT-TO-CALENDAR (Gemini Intelligence)
  const generateSocialCalendarFromChat = useCallback(async (businessLine: BusinessLine, chatInput: string) => {
    try {
        const ai = getAiInstance();
        // Using Flash for speed, or Pro if we want high reasoning.
        const systemPrompt = `You are Walter, the Digital Campaign Engine for "${businessLine.name}" (${businessLine.description}).
        
        USER REQUEST: "${chatInput}"

        YOUR JOB:
        1.  **Analyze & Infer**: From the user's natural language request, infer the Campaign Duration (e.g., 2 weeks, 1 month), the Goal, the Target Audience, and the Best Channels.
        2.  **Strategize**: Plan a content calendar that fits this inference.
        3.  **Generate**: Return a JSON array of posts.

        SCHEMA:
        Array of objects:
        {
            "date": "YYYY-MM-DD" (start from tomorrow),
            "channel": "string" (e.g., "LinkedIn", "Instagram"),
            "content": "string" (caption),
            "type": "Post" | "Reel" | "Story",
            "engagementHook": "string" (first line hook),
            "cta": "string" (call to action),
            "imagePrompt": "string" (visual description for Nano Banana)
        }
        `;
        
        const response = await ai.models.generateContent({ 
            model: 'gemini-2.5-flash', 
            contents: systemPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: GeminiType.ARRAY,
                    items: {
                        type: GeminiType.OBJECT,
                        properties: {
                            date: { type: GeminiType.STRING },
                            channel: { type: GeminiType.STRING },
                            content: { type: GeminiType.STRING },
                            type: { type: GeminiType.STRING, enum: ["Post", "Reel", "Story", "Idea"] },
                            engagementHook: { type: GeminiType.STRING },
                            cta: { type: GeminiType.STRING },
                            imagePrompt: { type: GeminiType.STRING }
                        },
                        required: ["date", "channel", "content", "type", "engagementHook", "cta", "imagePrompt"]
                    }
                }
            }
        });
        
        return JSON.parse(response.text.trim());
    } catch (e) {
        console.error("Error generating calendar from chat:", e);
        return [];
    }
  }, []);

  const generateSocialCalendar = useCallback(async (businessLine: BusinessLine, duration: string, goal: string, contextFile?: string, contextMimeType?: string, contextLink?: string) => {
      // Legacy function wrapper - redirects to the Chat engine logic if needed, or keeps structured.
      // For consistency with the new "Digital Campaign Engine", we can just construct a prompt and use the same logic,
      // OR keep this structured one. The prompt requested replacing the form with chat, so this might become deprecated or internal helper.
      // But for now, let's keep it as a fallback or structured entry point.
      
      const chatEquivalent = `Create a ${duration} campaign for ${goal}. ${contextLink ? `Refer to ${contextLink}` : ''}`;
      // Note: We can't easily pass file to the Chat function unless we update it.
      // Let's leave this as is for now but ensure it uses smart inference too.
       try {
        const ai = getAiInstance();
        let systemPrompt = `You are a Digital Campaign Engine and Senior Social Strategist for "${businessLine.name}" (${businessLine.description}).
        
        CAMPAIGN BRIEF:
        - Duration: ${duration}
        - Goal & Context: ${goal}
        ${contextLink ? `- Reference Link: ${contextLink}` : ''}

        YOUR JOB:
        1. Infer the Target Audience and Best Channels based on the business and goal.
        2. Generate a strategic content calendar.
        3. For each post, provide:
           - Date (starting tomorrow)
           - Channel (e.g. LinkedIn, Instagram, TikTok - inferred from strategy)
           - Content (Caption/Script)
           - Type (Post, Reel, Story)
           - Engagement Hook (First sentence/visual hook)
           - Call to Action (CTA)
           - Visual Prompt (Detailed prompt for Nano Banana AI to generate the image)

        Create enough posts to fill the duration (e.g., 3-5 per week).
        `;
        
        const parts: any[] = [{ text: systemPrompt }];

        if (contextFile && contextMimeType) {
             parts.unshift({
                inlineData: {
                    mimeType: contextMimeType,
                    data: contextFile
                }
            });
        }
        
        const response = await ai.models.generateContent({ 
            model: 'gemini-2.5-flash', 
            contents: { parts },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: GeminiType.ARRAY,
                    items: {
                        type: GeminiType.OBJECT,
                        properties: {
                            date: { type: GeminiType.STRING },
                            channel: { type: GeminiType.STRING },
                            content: { type: GeminiType.STRING },
                            type: { type: GeminiType.STRING, enum: ["Post", "Reel", "Story", "Idea"] },
                            engagementHook: { type: GeminiType.STRING },
                            cta: { type: GeminiType.STRING },
                            imagePrompt: { type: GeminiType.STRING }
                        },
                        required: ["date", "channel", "content", "type", "engagementHook", "cta", "imagePrompt"]
                    }
                }
            }
        });
        
        return JSON.parse(response.text.trim());
    } catch (e) {
        console.error("Error generating calendar:", e);
        return [];
    }
  }, []);


  // Updated Pulse/Prospects with Search Grounding
  const findProspects = useCallback(async (businessLine: BusinessLine, prompt: string) => { 
      try {
        const searchQuery = `Find potential clients for a "${businessLine.name}" business (${businessLine.description}). Criteria: ${prompt}. Return list with names and likely needs.`;
        const rawResult = await generateContentWithSearch(searchQuery);
        
        // We need to structure this text back into JSON. A two-step process or structured prompt with search is ideal.
        // For simplicity in this hook, we'll ask Gemini to format the *search result* into JSON.
        const ai = getAiInstance();
        const formatPrompt = `Extract a list of prospects from this research text. Return JSON: { "prospects": [{ "name": string, "likelyNeed": string }], "sources": [{ "title": string, "uri": string }] }
        
        RESEARCH TEXT:
        ${rawResult}`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: formatPrompt,
            config: { responseMimeType: 'application/json' }
        });
        
        return JSON.parse(response.text.trim());
      } catch (e) {
          console.error("Prospect search error", e);
          return { prospects: [], sources: [] };
      }
  }, []);

  const getClientPulse = useCallback(async (client: Client, filters: FilterOptions, customPrompt?: string) => {
       try {
        const query = customPrompt || `Latest news, social media mentions, or public updates about "${client.name}". Timeframe: ${filters.timeframe}. Location: ${filters.location}.`;
        const rawResult = await generateContentWithSearch(query);
        
        const ai = getAiInstance();
        const formatPrompt = `Extract key updates from this text into a JSON array of objects: { "source": "News" | "Social Media", "content": string, "url": string, "date": string }.
        
        TEXT: ${rawResult}`;

         const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: formatPrompt,
            config: { responseMimeType: 'application/json' }
        });
        return JSON.parse(response.text.trim());
       } catch (e) {
           return [];
       }
  }, []);
  
  const getCompetitorInsights = useCallback(async (businessLine: BusinessLine, filters: FilterOptions, customPrompt?: string) => {
       try {
        const query = customPrompt || `Key competitors for "${businessLine.name}" in ${filters.location} and their recent activities or customer trends.`;
        const rawResult = await generateContentWithSearch(query);
        
        const ai = getAiInstance();
        const formatPrompt = `Extract competitor insights and search trends from this text. Return JSON: { "insights": [{"competitorName": string, "insight": string, "source": string}], "trends": [{"keyword": string, "insight": string}] }
        
        TEXT: ${rawResult}`;

         const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: formatPrompt,
            config: { responseMimeType: 'application/json' }
        });
        return JSON.parse(response.text.trim());
       } catch (e) {
           return { insights: [], trends: [] };
       }
  }, []);

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
  const generateDocumentFromSubtask = useCallback(async (task: Task, subtaskText: string) => { return null; }, []);
  const getPlatformInsights = useCallback(() => { return []; }, []);
  const updateTask = useCallback((id: string, data: any) => {
       setTasks(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
  }, [setTasks]);
  const promoteSubtaskToTask = useCallback((taskId: string, subTaskId: string) => {
    // Implementation logic would go here
  }, []);
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
  const deleteTask = useCallback((id: string) => {
      setTasks(prev => prev.filter(t => t.id !== id));
  }, [setTasks]);


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
    socialPosts, // Export social posts state
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
    addSocialPost, // Export social methods
    updateSocialPost,
    deleteSocialPost,
    generateSocialPostContent,
    generateSocialImage,
    generateSocialVideo, // Export Veo
    generateSocialCalendar,
    generateSocialCalendarFromChat, // Export Chat-to-Calendar
    generateSocialPostDetails, // Export new function
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
    generateLeadScore,
    deleteTask
  };
};
