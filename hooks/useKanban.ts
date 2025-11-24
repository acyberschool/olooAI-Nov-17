
import React, { useState, useCallback, useEffect } from 'react';
import { Task, KanbanStatus, TaskType, BusinessLine, Client, Deal, Document, DocumentCategory, Opportunity, DocumentOwnerType, Playbook, PlaybookStep, CRMEntry, CRMEntryType, Suggestion, Prospect, ClientPulse, CompetitorInsight, SearchTrend, FilterOptions, GeminiType, PlatformInsight, Project, TeamMember, Contact, Role, UniversalInputContext, SocialPost, GeminiModality, ProjectStage, ProjectDealType } from '../types';
import { initialTasks, initialDocuments, initialPlaybooks, initialCRMEntries, initialTeamMembers, initialContacts } from '../data/mockData';
import { getAiInstance } from '../config/geminiConfig';
import { processTextMessage } from '../services/routerBrainService';
import { generateContentWithSearch, generateVideos } from '../services/geminiService';
import { trackEvent } from '../App';
import { supabase } from '../supabaseClient';

// Helper for LocalStorage with error handling (Keeping for non-migrated entities if any remain)
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
  // Supabase State
  const [businessLines, setBusinessLines] = useState<BusinessLine[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [crmEntries, setCrmEntries] = useState<CRMEntry[]>([]);
  const [socialPosts, setSocialPosts] = useState<SocialPost[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);

  // Load Data from Supabase on Mount
  useEffect(() => {
    const fetchBusinessLines = async () => {
      const { data, error } = await supabase.from('business_lines').select('*').order('name');
      if (error) console.error('Error loading business lines:', error);
      else if (data) {
        setBusinessLines(data.map(row => ({
          id: row.id,
          name: row.name,
          description: row.description,
          customers: row.customers,
          aiFocus: row.ai_focus,
        })));
      }
    };

    const fetchClients = async () => {
      const { data, error } = await supabase.from('clients').select('*').order('name');
      if (error) console.error('Error loading clients:', error);
      else if (data) {
        setClients(data.map(row => ({
          id: row.id,
          name: row.name,
          description: row.description,
          aiFocus: row.ai_focus,
          businessLineId: row.business_line_id,
          suggestions: row.suggestions,
          contactPersonName: row.contact_person_name,
          contactPersonEmail: row.contact_person_email,
          contactPersonNumber: row.contact_person_number,
          officeLocation: row.office_location,
          officeNumber: row.office_number,
          linkedinUrl: row.linkedin_url,
          twitterUrl: row.twitter_url,
          proposedLastTouchSummary: row.proposed_last_touch_summary,
          proposedNextAction: row.proposed_next_action,
          proposedNextActionDueDate: row.proposed_next_action_due_date,
          leadScore: row.lead_score,
          leadScoreReason: row.lead_score_reason
        })));
      }
    };

    const fetchDeals = async () => {
        const { data, error } = await supabase.from('deals').select('*').order('name');
        if (error) console.error('Error loading deals:', error);
        else if (data) {
            setDeals(data.map(row => ({
                id: row.id,
                name: row.name,
                description: row.description,
                status: row.status,
                clientId: row.client_id,
                businessLineId: row.business_line_id,
                playbookId: row.playbook_id,
                suggestions: row.suggestions,
                value: row.value,
                currency: row.currency,
                revenueModel: row.revenue_model,
                amountPaid: row.amount_paid,
                proposedLastTouchSummary: row.proposed_last_touch_summary,
                proposedNextAction: row.proposed_next_action,
                proposedNextActionDueDate: row.proposed_next_action_due_date,
                proposedStatus: row.proposed_status
            })));
        }
    };

    const fetchProjects = async () => {
        const { data, error } = await supabase.from('projects').select('*').order('project_name');
        if (error) console.error('Error loading projects:', error);
        else if (data) {
            setProjects(data.map(row => ({
                id: row.id,
                partnerName: row.partner_name,
                projectName: row.project_name,
                goal: row.goal,
                dealType: row.deal_type,
                expectedRevenue: row.expected_revenue,
                impactMetric: row.impact_metric,
                stage: row.stage,
                projectOwner: row.project_owner,
                lastTouchDate: row.last_touch_date,
                lastTouchSummary: row.last_touch_summary,
                nextAction: row.next_action,
                nextActionOwner: row.next_action_owner,
                nextActionDueDate: row.next_action_due_date,
                opportunityNote: row.opportunity_note,
                clientId: row.client_id,
                proposedLastTouchSummary: row.proposed_last_touch_summary,
                proposedNextAction: row.proposed_next_action,
                proposedNextActionDueDate: row.proposed_next_action_due_date,
                proposedStage: row.proposed_stage
            })));
        }
    };

    const fetchTasks = async () => {
        const { data, error } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
        if (error) console.error('Error loading tasks:', error);
        else if (data) {
            setTasks(data.map(row => ({
                id: row.id,
                title: row.title,
                description: row.description,
                status: row.status,
                dueDate: row.due_date,
                priority: row.priority,
                clientId: row.client_id,
                dealId: row.deal_id,
                businessLineId: row.business_line_id,
                type: row.type,
                playbookStepId: row.playbook_step_id,
                subTasks: row.sub_tasks,
                createdAt: row.created_at,
                projectId: row.project_id,
                assigneeId: row.assignee_id
            })));
        }
    };

    const fetchDocuments = async () => {
        const { data, error } = await supabase.from('documents').select('*').order('created_at', { ascending: false });
        if (error) console.error('Error loading documents:', error);
        else if (data) {
            setDocuments(data.map(row => ({
                id: row.id,
                name: row.name,
                category: row.category,
                url: row.url,
                ownerId: row.owner_id,
                ownerType: row.owner_type,
                createdAt: row.created_at,
                note: row.note
            })));
        }
    };

    const fetchPlaybooks = async () => {
        const { data, error } = await supabase.from('playbooks').select('*');
        if (error) console.error('Error loading playbooks:', error);
        else if (data) {
            setPlaybooks(data.map(row => ({
                id: row.id,
                businessLineId: row.business_line_id,
                steps: row.steps
            })));
        }
    };

    const fetchCRMEntries = async () => {
        const { data, error } = await supabase.from('crm_entries').select('*').order('created_at', { ascending: false });
        if (error) console.error('Error loading CRM entries:', error);
        else if (data) {
            setCrmEntries(data.map(row => ({
                id: row.id,
                clientId: row.client_id,
                dealId: row.deal_id,
                projectId: row.project_id,
                createdAt: row.created_at,
                type: row.type,
                summary: row.summary,
                rawContent: row.raw_content,
                documentId: row.document_id,
                suggestions: row.suggestions
            })));
        }
    };

    const fetchSocialPosts = async () => {
        const { data, error } = await supabase.from('social_posts').select('*').order('date', { ascending: true });
        if (error) console.error('Error loading social posts:', error);
        else if (data) {
            setSocialPosts(data.map(row => ({
                id: row.id,
                businessLineId: row.business_line_id,
                date: row.date,
                content: row.content,
                type: row.type,
                imageUrl: row.image_url,
                videoUrl: row.video_url,
                imagePrompt: row.image_prompt,
                status: row.status,
                channel: row.channel,
                cta: row.cta,
                engagementHook: row.engagement_hook
            })));
        }
    };

    const fetchTeamMembers = async () => {
        const { data, error } = await supabase.from('team_members').select('*').order('name');
        if (error) console.error('Error loading team members:', error);
        else if (data) {
            setTeamMembers(data.map(row => ({
                id: row.id,
                name: row.name,
                email: row.email,
                role: row.role,
                status: row.status
            })));
        }
    };

    const fetchContacts = async () => {
        const { data, error } = await supabase.from('contacts').select('*').order('name');
        if (error) console.error('Error loading contacts:', error);
        else if (data) {
            setContacts(data.map(row => ({
                id: row.id,
                clientId: row.client_id,
                name: row.name,
                role: row.role,
                email: row.email,
                phone: row.phone
            })));
        }
    };

    fetchBusinessLines();
    fetchClients();
    fetchDeals();
    fetchProjects();
    fetchTasks();
    fetchDocuments();
    fetchPlaybooks();
    fetchCRMEntries();
    fetchSocialPosts();
    fetchTeamMembers();
    fetchContacts();
  }, []);

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

  const addDocument = useCallback(async (file: File | {name: string, content: string}, category: DocumentCategory, ownerId: string, ownerType: DocumentOwnerType, note?: string): Promise<Document | null> => {
    let url = '#';
    if (!(file instanceof File)) {
        url = `https://docs.google.com/document/d/mock-${Date.now()}/edit`;
    } else {
        url = URL.createObjectURL(file);
    }
    
    const payload = {
        name: file.name,
        category,
        url,
        owner_id: ownerId,
        owner_type: ownerType,
        note,
        created_at: new Date().toISOString()
    };

    const { data: inserted, error } = await supabase.from('documents').insert(payload).select().single();
    
    if (error) {
        console.error('Error adding document:', error);
        return null;
    }

    if (inserted) {
        const newDocument: Document = {
            id: inserted.id,
            name: inserted.name,
            category: inserted.category,
            url: inserted.url,
            ownerId: inserted.owner_id,
            ownerType: inserted.owner_type,
            createdAt: inserted.created_at,
            note: inserted.note
        };
        setDocuments(prev => [newDocument, ...prev]);
        return newDocument;
    }
    return null;
  }, []);
  
  const addCRMEntry = useCallback(async (entryData: Omit<CRMEntry, 'id' | 'suggestions'>) => {
     const payload = {
        client_id: entryData.clientId,
        deal_id: entryData.dealId,
        project_id: entryData.projectId,
        created_at: entryData.createdAt,
        type: entryData.type,
        summary: entryData.summary,
        raw_content: entryData.rawContent,
        document_id: entryData.documentId
     };

     const { data: inserted, error } = await supabase.from('crm_entries').insert(payload).select().single();

     if (error) {
         console.error('Error adding CRM entry:', error);
         return;
     }

     if (inserted) {
         const newEntry: CRMEntry = {
             id: inserted.id,
             clientId: inserted.client_id,
             dealId: inserted.deal_id,
             projectId: inserted.project_id,
             createdAt: inserted.created_at,
             type: inserted.type,
             summary: inserted.summary,
             rawContent: inserted.raw_content,
             documentId: inserted.document_id,
             suggestions: []
         };
         setCrmEntries(prev => [newEntry, ...prev]);
         trackEvent('create', 'CRM Entry', entryData.type);
     }
  }, []);
  
  const updateCRMEntry = useCallback(async (id: string, data: Partial<CRMEntry>) => {
      const payload: any = {};
      if (data.summary) payload.summary = data.summary;
      if (data.rawContent) payload.raw_content = data.rawContent;
      
      const { error } = await supabase.from('crm_entries').update(payload).eq('id', id);
      
      if (error) {
          console.error('Error updating CRM entry:', error);
      } else {
          setCrmEntries(prev => prev.map(e => e.id === id ? { ...e, ...data } : e));
      }
  }, []);

  const deleteCRMEntry = useCallback(async (id: string) => {
      const { error } = await supabase.from('crm_entries').delete().eq('id', id);
      if (error) {
          console.error('Error deleting CRM entry:', error);
      } else {
          setCrmEntries(prev => prev.filter(e => e.id !== id));
      }
  }, []);

  const updateTask = useCallback(async (id: string, data: Partial<Task>) => {
       const payload: any = {};
       if (data.title) payload.title = data.title;
       if (data.description) payload.description = data.description;
       if (data.status) payload.status = data.status;
       if (data.dueDate) payload.due_date = data.dueDate;
       if (data.priority) payload.priority = data.priority;
       if (data.clientId) payload.client_id = data.clientId;
       if (data.dealId) payload.deal_id = data.dealId;
       if (data.businessLineId) payload.business_line_id = data.businessLineId;
       if (data.projectId) payload.project_id = data.projectId;
       if (data.assigneeId) payload.assignee_id = data.assigneeId;
       if (data.subTasks) payload.sub_tasks = JSON.stringify(data.subTasks);

       const { error } = await supabase.from('tasks').update(payload).eq('id', id);
       
       if (error) {
           console.error('Error updating task:', error);
       } else {
           setTasks(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
       }
  }, []);

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

        // Update Supabase with generated subtasks
        await updateTask(task.id, { subTasks });

      } catch (e) {
          console.error("Error generating sub-tasks:", e);
      }
  };

  const addTask = useCallback(async (itemData: Partial<Omit<Task, 'id' | 'status' | 'type' | 'createdAt'>> & { itemType?: TaskType, title: string, businessLineName?: string }) => {
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

    const payload = {
        title: itemData.title,
        description: itemData.description,
        status: KanbanStatus.ToDo,
        type: itemData.itemType || TaskType.Task,
        due_date: itemData.dueDate,
        priority: itemData.priority || 'Medium',
        client_id: itemData.clientId,
        deal_id: itemData.dealId,
        business_line_id: businessLineId,
        project_id: itemData.projectId,
        assignee_id: itemData.assigneeId,
        created_at: new Date().toISOString(),
        sub_tasks: []
    };

    const { data: inserted, error } = await supabase.from('tasks').insert(payload).select().single();

    if (error) {
        console.error('Error creating task:', error);
        return `Error creating task.`;
    }

    if (inserted) {
        const newTask: Task = {
            id: inserted.id,
            title: inserted.title,
            description: inserted.description,
            status: inserted.status,
            type: inserted.type,
            dueDate: inserted.due_date,
            priority: inserted.priority,
            clientId: inserted.client_id,
            dealId: inserted.deal_id,
            businessLineId: inserted.business_line_id,
            projectId: inserted.project_id,
            assigneeId: inserted.assignee_id,
            createdAt: inserted.created_at,
            subTasks: inserted.sub_tasks,
            playbookStepId: inserted.playbook_step_id
        };

        setTasks((prevTasks) => [newTask, ...prevTasks]);
        
        _generateAndSetSubtasks(newTask, { client, deal, businessLine });
        
        if (newTask.clientId) {
          addCRMEntry({
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
    }
    return "Failed.";
  }, [businessLines, clients, deals, setTasks, addCRMEntry, updateTask]);

  const addBusinessLine = useCallback(async (data: Omit<BusinessLine, 'id'>) => {
    const payload = {
        name: data.name,
        description: data.description,
        customers: data.customers,
        ai_focus: data.aiFocus
    };

    const { data: inserted, error } = await supabase.from('business_lines').insert(payload).select().single();

    if (error) {
        console.error('Error adding business line:', error);
        return `Error: ${error.message}`;
    }

    if (inserted) {
        const newBL: BusinessLine = {
            id: inserted.id,
            name: inserted.name,
            description: inserted.description,
            customers: inserted.customers,
            aiFocus: inserted.ai_focus
        };
        setBusinessLines(prev => [...prev, newBL]);
        trackEvent('create', 'Business Line', data.name);
        return `Business line "${data.name}" created.`;
    }
    return "Failed to create business line.";
  }, []);

  const updateBusinessLine = useCallback(async (id: string, data: Partial<Omit<BusinessLine, 'id'>>) => {
    const payload: any = {};
    if (data.name) payload.name = data.name;
    if (data.description) payload.description = data.description;
    if (data.customers) payload.customers = data.customers;
    if (data.aiFocus) payload.ai_focus = data.aiFocus;

    const { error } = await supabase.from('business_lines').update(payload).eq('id', id);

    if (error) {
        console.error('Error updating business line:', error);
    } else {
        setBusinessLines(prev => prev.map(bl => bl.id === id ? { ...bl, ...data } : bl));
    }
    return `Business line updated.`;
  }, []);

  const deleteBusinessLine = useCallback(async (id: string) => {
      const { error } = await supabase.from('business_lines').delete().eq('id', id);
      if (error) {
          console.error('Error deleting business line:', error);
          return "Error deleting business line";
      }
      setBusinessLines(prev => prev.filter(bl => bl.id !== id));
      setClients(prev => prev.filter(c => c.businessLineId !== id));
      setDeals(prev => prev.filter(d => d.businessLineId !== id));
      setTasks(prev => prev.filter(t => t.businessLineId !== id));
      return `Business line deleted.`;
  }, [setClients, setDeals, setTasks]);
  
  const addClient = useCallback(async (data: Omit<Client, 'id' | 'businessLineId'> & { businessLineId?: string, businessLineName?: string }) => {
    let businessLine = businessLines.find(bl => bl.id === data.businessLineId);
    if (!businessLine && data.businessLineName) {
        businessLine = businessLines.find(bl => bl.name.toLowerCase() === data.businessLineName?.toLowerCase());
    }
    if (!businessLine && businessLines.length > 0) businessLine = businessLines[0];
    
    const businessLineId = businessLine?.id;

    if (!businessLineId) {
        return "Error: No Business Line found.";
    }

    const payload = {
        name: data.name,
        description: data.description,
        ai_focus: data.aiFocus,
        business_line_id: businessLineId
    };

    const { data: inserted, error } = await supabase.from('clients').insert(payload).select().single();

    if (error) {
        console.error("Error adding client:", error);
        return `Error adding client: ${error.message}`;
    }

    if (inserted) {
        const newClient: Client = {
            id: inserted.id,
            name: inserted.name,
            description: inserted.description,
            aiFocus: inserted.ai_focus,
            businessLineId: inserted.business_line_id,
            // ... map other fields if they were populated on insert (defaults)
        };
        setClients(prev => [newClient, ...prev]);

        // AUTOMATION: Build it out with REAL ID
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

        addCRMEntry({
            clientId: newClient.id,
            createdAt: new Date().toISOString(),
            type: 'ai_action',
            summary: `AI created client profile for "${newClient.name}"`,
            rawContent: `AI created client profile for "${newClient.name}"`
        });
        return `Client "${data.name}" created.`;
    }
    return "Failed to create client.";
  }, [businessLines, addTask, addDocument, addCRMEntry]);

  const updateClient = useCallback(async (id: string, data: Partial<Omit<Client, 'id'>>) => {
    const payload: any = {};
    if (data.name) payload.name = data.name;
    if (data.description) payload.description = data.description;
    if (data.aiFocus) payload.ai_focus = data.aiFocus;
    if (data.businessLineId) payload.business_line_id = data.businessLineId;
    if (data.leadScore) payload.lead_score = data.leadScore;
    if (data.leadScoreReason) payload.lead_score_reason = data.leadScoreReason;
    // ... add other fields as needed (contact info etc)

    const { error } = await supabase.from('clients').update(payload).eq('id', id);

    if (error) {
        console.error("Error updating client:", error);
    } else {
        setClients(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
    }
    return `Client updated.`;
  }, []);

  const deleteClient = useCallback(async (id: string) => {
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (error) {
          console.error("Error deleting client:", error);
          return;
      }
      setClients(prev => prev.filter(c => c.id !== id));
      setDeals(prev => prev.filter(d => d.clientId !== id));
      setTasks(prev => prev.filter(t => t.clientId !== id));
      setContacts(prev => prev.filter(c => c.clientId !== id));
      return `Client deleted.`;
  }, [setDeals, setTasks, setContacts]);

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

  const addDeal = useCallback(async (data: Omit<Deal, 'id' | 'status' | 'amountPaid' | 'clientId' | 'businessLineId'> & { clientName: string, clientId?: string, businessLineId?: string }) => {
    let client = clients.find(c => c.id === data.clientId);
    if (!client && data.clientName) {
        client = clients.find(c => c.name.toLowerCase() === data.clientName.toLowerCase());
    }
    if (!client) {
        console.warn(`Client "${data.clientName}" not found for deal creation.`);
        return `Client "${data.clientName}" not found.`;
    }

    const payload = {
        name: data.name,
        description: data.description,
        status: 'Open',
        client_id: client.id,
        business_line_id: data.businessLineId || client.businessLineId,
        value: data.value,
        currency: data.currency,
        revenue_model: data.revenueModel,
        amount_paid: 0
    };

    const { data: inserted, error } = await supabase.from('deals').insert(payload).select().single();

    if (error) {
        console.error('Error creating deal:', error);
        return `Error creating deal.`;
    }

    if (inserted) {
        const newDeal: Deal = {
            id: inserted.id,
            name: inserted.name,
            description: inserted.description,
            status: inserted.status,
            clientId: inserted.client_id,
            businessLineId: inserted.business_line_id,
            value: inserted.value,
            currency: inserted.currency,
            revenueModel: inserted.revenue_model,
            amountPaid: inserted.amount_paid,
            playbookId: inserted.playbook_id
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
    }
    return "Failed.";
  }, [clients, addTask, addDocument]);

  const updateDeal = useCallback(async (id: string, data: Partial<Omit<Deal, 'id'>>) => {
      const payload: any = {};
      if (data.name) payload.name = data.name;
      if (data.description) payload.description = data.description;
      if (data.status) payload.status = data.status;
      if (data.value !== undefined) payload.value = data.value;
      if (data.amountPaid !== undefined) payload.amount_paid = data.amountPaid;
      if (data.clientId) payload.client_id = data.clientId;
      if (data.revenueModel) payload.revenue_model = data.revenueModel;
      // ... others

      const { error } = await supabase.from('deals').update(payload).eq('id', id);
      if (error) {
          console.error('Error updating deal:', error);
      } else {
          setDeals(prev => prev.map(d => d.id === id ? { ...d, ...data } : d));
      }
      return `Deal updated.`;
  }, []);


  const deleteDeal = useCallback(async (id: string) => {
      const { error } = await supabase.from('deals').delete().eq('id', id);
      if (error) {
          console.error('Error deleting deal:', error);
          return;
      }
      setDeals(prev => prev.filter(d => d.id !== id));
      setTasks(prev => prev.filter(t => t.dealId !== id));
      return `Deal deleted.`;
  }, [setTasks]);

    const addProject = useCallback(async (data: Partial<Omit<Project, 'id'>> & { partnerName: string; projectName: string; goal: string; }) => {
        const partnerAsClient = clients.find(c => c.name.toLowerCase() === data.partnerName.toLowerCase());
        
        const payload = {
            partner_name: data.partnerName,
            project_name: data.projectName,
            goal: data.goal,
            deal_type: data.dealType || 'Fee-based',
            expected_revenue: data.expectedRevenue || 0,
            impact_metric: data.impactMetric || 'N/A',
            stage: data.stage || 'Lead',
            project_owner: 'Me',
            last_touch_date: new Date().toISOString(),
            last_touch_summary: 'Project created.',
            next_action: 'Initial Setup',
            next_action_owner: 'Me',
            next_action_due_date: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString(),
            opportunity_note: '',
            client_id: partnerAsClient?.id || null,
        };

        const { data: inserted, error } = await supabase.from('projects').insert(payload).select().single();

        if (error) {
            console.error('Error creating project:', error);
            return `Error creating project.`;
        }

        if (inserted) {
            const newProject: Project = {
                id: inserted.id,
                partnerName: inserted.partner_name,
                projectName: inserted.project_name,
                goal: inserted.goal,
                dealType: inserted.deal_type,
                expectedRevenue: inserted.expected_revenue,
                impactMetric: inserted.impact_metric,
                stage: inserted.stage,
                projectOwner: inserted.project_owner,
                lastTouchDate: inserted.last_touch_date,
                lastTouchSummary: inserted.last_touch_summary,
                nextAction: inserted.next_action,
                nextActionOwner: inserted.next_action_owner,
                nextActionDueDate: inserted.next_action_due_date,
                opportunityNote: inserted.opportunity_note,
                clientId: inserted.client_id,
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
        }
        return "Failed.";
    }, [clients, addTask, addDocument]);

    const updateProject = useCallback(async (id: string, data: Partial<Omit<Project, 'id'>>) => {
        const payload: any = {};
        if (data.projectName) payload.project_name = data.projectName;
        if (data.stage) payload.stage = data.stage;
        // ... map other fields as needed for updates

        const { error } = await supabase.from('projects').update(payload).eq('id', id);

        if (error) {
            console.error('Error updating project:', error);
        } else {
            setProjects(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
        }
        return `Project updated.`;
    }, []);


    const deleteProject = useCallback(async (id: string) => {
        const { error } = await supabase.from('projects').delete().eq('id', id);
        if (error) {
            console.error('Error deleting project:', error);
            return;
        }
        setProjects(prev => prev.filter(p => p.id !== id));
        setTasks(prev => prev.filter(t => t.projectId !== id));
        return `Project deleted.`;
    }, [setTasks]);


  const addContact = useCallback(async (contact: Omit<Contact, 'id'>) => {
      const payload = {
          client_id: contact.clientId,
          name: contact.name,
          role: contact.role,
          email: contact.email,
          phone: contact.phone
      };
      
      const { data: inserted, error } = await supabase.from('contacts').insert(payload).select().single();
      
      if (error) {
          console.error('Error adding contact:', error);
          return "Error adding contact";
      }
      
      if (inserted) {
          const newContact: Contact = {
              id: inserted.id,
              clientId: inserted.client_id,
              name: inserted.name,
              role: inserted.role,
              email: inserted.email,
              phone: inserted.phone
          };
          setContacts(prev => [...prev, newContact]);
          return "Contact added.";
      }
      return "Failed to add contact.";
  }, []);

  const updateContact = useCallback(async (id: string, data: Partial<Omit<Contact, 'id'>>) => {
      const payload: any = {};
      if (data.name) payload.name = data.name;
      if (data.role) payload.role = data.role;
      if (data.email) payload.email = data.email;
      if (data.phone) payload.phone = data.phone;
      
      const { error } = await supabase.from('contacts').update(payload).eq('id', id);
      
      if (error) {
          console.error('Error updating contact:', error);
      } else {
          setContacts(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
      }
  }, []);

  const deleteContact = useCallback(async (id: string) => {
      const { error } = await supabase.from('contacts').delete().eq('id', id);
      if (error) {
          console.error('Error deleting contact:', error);
      } else {
          setContacts(prev => prev.filter(c => c.id !== id));
      }
  }, []);
  
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
                      addCRMEntry({
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
  }, [clients, deals, businessLines, tasks, addTask, addBusinessLine, addClient, addDeal, addProject, addCRMEntry]);
  
  // --- SOCIAL MEDIA FEATURES ---

  const addSocialPost = useCallback(async (post: Omit<SocialPost, 'id'>) => {
      const payload = {
          business_line_id: post.businessLineId,
          date: post.date,
          content: post.content,
          type: post.type,
          image_url: post.imageUrl,
          video_url: post.videoUrl,
          image_prompt: post.imagePrompt,
          status: post.status,
          channel: post.channel,
          cta: post.cta,
          engagement_hook: post.engagementHook
      };

      const { data: inserted, error } = await supabase.from('social_posts').insert(payload).select().single();

      if (error) {
          console.error('Error adding social post:', error);
          return null;
      }

      if (inserted) {
          const newPost: SocialPost = {
              id: inserted.id,
              businessLineId: inserted.business_line_id,
              date: inserted.date,
              content: inserted.content,
              type: inserted.type,
              imageUrl: inserted.image_url,
              videoUrl: inserted.video_url,
              imagePrompt: inserted.image_prompt,
              status: inserted.status,
              channel: inserted.channel,
              cta: inserted.cta,
              engagementHook: inserted.engagement_hook
          };
          setSocialPosts(prev => [...prev, newPost]);
          return newPost;
      }
      return null;
  }, []);

  const updateSocialPost = useCallback(async (id: string, data: Partial<SocialPost>) => {
      const payload: any = {};
      if (data.content) payload.content = data.content;
      if (data.imageUrl) payload.image_url = data.imageUrl;
      if (data.videoUrl) payload.video_url = data.videoUrl;
      if (data.imagePrompt) payload.image_prompt = data.imagePrompt;
      if (data.status) payload.status = data.status;
      if (data.channel) payload.channel = data.channel;
      if (data.cta) payload.cta = data.cta;
      if (data.engagementHook) payload.engagement_hook = data.engagementHook;
      if (data.type) payload.type = data.type;
      if (data.date) payload.date = data.date;

      const { error } = await supabase.from('social_posts').update(payload).eq('id', id);

      if (error) {
          console.error('Error updating social post:', error);
      } else {
          setSocialPosts(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
      }
  }, []);

  const deleteSocialPost = useCallback(async (id: string) => {
      const { error } = await supabase.from('social_posts').delete().eq('id', id);
      if (error) {
          console.error('Error deleting social post:', error);
      } else {
          setSocialPosts(prev => prev.filter(p => p.id !== id));
      }
  }, []);

  const generateSocialPostDetails = useCallback(async (prompt: string, channel: string, businessLine: BusinessLine, contextFile?: string, contextMimeType?: string, contextLink?: string) => {
      try {
          const ai = getAiInstance();
          let fullPrompt = `You are a social media manager for "${businessLine.name}".
          Channel: ${channel}.
          Request: "${prompt}".
          
          CRITICAL: If a user provides a file or link, IGNORE the generic business line context and base the content SOLELY on the provided material.
          
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
  const toggleSubTask = useCallback(async (taskId: string, subTaskId: string) => {
       const task = tasks.find(t => t.id === taskId);
       if (!task || !task.subTasks) return;

       const newSubTasks = task.subTasks.map(s => s.id === subTaskId ? { ...s, isDone: !s.isDone } : s);
       
       // Optimistic Update
       setTasks(prev => prev.map(t => t.id === taskId ? { ...t, subTasks: newSubTasks } : t));

       // DB Update
       await updateTask(taskId, { subTasks: newSubTasks });

  }, [tasks, updateTask]);
  const generateSocialMediaIdeas = useCallback(async (businessLine: BusinessLine, prompt: string) => { return []; }, []);
  
  const updatePlaybook = useCallback(async (id: string, steps: PlaybookStep[]) => {
      const { error } = await supabase.from('playbooks').update({ steps: JSON.stringify(steps) }).eq('id', id);
      if (error) {
          console.error('Error updating playbook:', error);
      } else {
          setPlaybooks(prev => prev.map(p => p.id === id ? { ...p, steps } : p));
      }
  }, []);

  const regeneratePlaybook = useCallback(async (businessLine: BusinessLine) => {
       const steps = [
           { id: `step-${Date.now()}-1`, title: 'Initial Contact', description: 'Reach out via email.' },
           { id: `step-${Date.now()}-2`, title: 'Needs Assessment', description: 'Schedule a call to understand needs.' }
       ];
       
       // Check if playbook exists
       const existingPlaybook = playbooks.find(p => p.businessLineId === businessLine.id);
       
       if (existingPlaybook) {
           updatePlaybook(existingPlaybook.id, steps);
       } else {
           const payload = {
               business_line_id: businessLine.id,
               steps: JSON.stringify(steps)
           };
           const { data: inserted, error } = await supabase.from('playbooks').insert(payload).select().single();
           if (!error && inserted) {
               setPlaybooks(prev => [...prev, { id: inserted.id, businessLineId: inserted.business_line_id, steps: inserted.steps }]);
           }
       }

  }, [playbooks, updatePlaybook]);

  const dismissSuggestions = useCallback((type: string, id: string) => {}, []);
  const getOpportunities = useCallback(async (businessLine: BusinessLine, expand: boolean) => { return { opportunities: [], sources: [] }; }, []);
  const getClientOpportunities = useCallback(async (client: Client) => { return { opportunities: [], sources: [] }; }, []);
  const getDealOpportunities = useCallback(async (deal: Deal) => { return { opportunities: [], sources: [] }; }, []);
  const generateDocumentFromSubtask = useCallback(async (task: Task, subtaskText: string) => { return null; }, []);
  const getPlatformInsights = useCallback(() => { return []; }, []);
  
  const promoteSubtaskToTask = useCallback((taskId: string, subTaskId: string) => {
    // Implementation logic would go here
  }, []);
  const researchSubtask = useCallback(async (query: string, context: string) => { return ""; }, []);
  const refineTaskChecklist = useCallback(async (taskId: string, command: string) => {}, []);
  const getPlatformQueryResponse = useCallback(async () => { return ""; }, []);
  const logEmailToCRM = useCallback((clientId: string, subject: string, body: string) => {}, []);
  
  const inviteMember = useCallback(async (email: string, role: Role) => {
       const payload = {
           name: email.split('@')[0], // Fallback name
           email,
           role, // Supabase handles object -> jsonb automatically
           status: 'Invited'
       };
       
       const { data: inserted, error } = await supabase.from('team_members').insert(payload).select().single();
       
       if (error) {
           console.error('Error adding team member:', error);
       } else if (inserted) {
           const newMember: TeamMember = {
               id: inserted.id,
               name: inserted.name,
               email: inserted.email,
               role: inserted.role,
               status: inserted.status
           };
           setTeamMembers(prev => [...prev, newMember]);
       }
  }, []);

  const updateTeamMember = useCallback(async (id: string, data: Partial<TeamMember>) => {
       const payload: any = {};
       if (data.role) payload.role = data.role;
       if (data.status) payload.status = data.status;
       if (data.name) payload.name = data.name;
       
       const { error } = await supabase.from('team_members').update(payload).eq('id', id);
       
       if (error) {
           console.error('Error updating team member:', error);
       } else {
           setTeamMembers(prev => prev.map(m => m.id === id ? { ...m, ...data } : m));
       }
  }, []);

  const deleteTeamMember = useCallback(async (id: string) => {
       const { error } = await supabase.from('team_members').delete().eq('id', id);
       if (error) {
           console.error('Error deleting team member:', error);
       } else {
           setTeamMembers(prev => prev.filter(m => m.id !== id));
       }
  }, []);

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
       // Optimistic
       setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));
       // DB
       updateTask(id, { status });
  }, [updateTask]);
  const updateTaskStatusByTitle = useCallback((title: string, status: KanbanStatus) => { return ""; }, []);
  const deleteDocument = useCallback(async (id: string) => {
      const { error } = await supabase.from('documents').delete().eq('id', id);
      if (error) {
          console.error('Error deleting document:', error);
      } else {
          setDocuments(prev => prev.filter(d => d.id !== id));
      }
  }, []);
  
  const addCRMEntryFromVoice = useCallback((data: any) => { return ""; }, []);
  const deleteTask = useCallback(async (id: string) => {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) {
          console.error('Error deleting task:', error);
      } else {
          setTasks(prev => prev.filter(t => t.id !== id));
      }
  }, []);


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
    socialPosts,
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
    updateContact,
    deleteContact,
    addSocialPost,
    updateSocialPost,
    deleteSocialPost,
    generateSocialPostContent,
    generateSocialImage,
    generateSocialVideo,
    generateSocialCalendar,
    generateSocialCalendarFromChat,
    generateSocialPostDetails,
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
    updateTeamMember,
    deleteTeamMember,
    generateMeetingTranscript,
    generateLeadScore,
    deleteTask,
    addCRMEntry,
    updateCRMEntry,
    deleteCRMEntry
  };
};
