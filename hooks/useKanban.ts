
import React, { useState, useCallback, useEffect } from 'react';
import { Task, KanbanStatus, TaskType, BusinessLine, Client, Deal, Document, DocumentCategory, Opportunity, DocumentOwnerType, Playbook, PlaybookStep, CRMEntry, CRMEntryType, Suggestion, Prospect, ClientPulse, CompetitorInsight, SearchTrend, FilterOptions, GeminiType, PlatformInsight, Project, TeamMember, Contact, Role, UniversalInputContext, SocialPost, GeminiModality, ProjectStage, ProjectDealType, Organization, Event, HRCandidate, HREmployee } from '../types';
import { getAiInstance } from '../config/geminiConfig';
import { processTextMessage } from '../services/routerBrainService';
import { generateContentWithSearch, generateVideos, generateJsonWithSearch, generateImages } from '../services/geminiService';
import { trackEvent } from '../App';
import { supabase } from '../supabaseClient';

export const useKanban = () => {
  // Org State
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [currentUserMember, setCurrentUserMember] = useState<TeamMember | null>(null);

  // Core Data State
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
  
  // New Modules State
  const [events, setEvents] = useState<Event[]>([]);
  const [candidates, setCandidates] = useState<HRCandidate[]>([]);
  const [employees, setEmployees] = useState<HREmployee[]>([]);

  // 1. Load Organization on Mount (with Invite Linking)
  useEffect(() => {
      const loadOrg = async () => {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user || !user.email) return;

          // A. Check for Pending Invites (Link by Email)
          try {
              const { error: updateError } = await supabase
                  .from('organization_members')
                  .update({ user_id: user.id, status: 'Active' })
                  .eq('email', user.email)
                  .is('user_id', null);

              if (updateError) {
                  // Fail silently for now to prevent blockers
              }
          } catch (e) {
              // Ignore network issues during invite check
          }

          // B. Fetch Memberships
          let { data: members } = await supabase
            .from('organization_members')
            .select('*, organizations(*)')
            .eq('user_id', user.id);

          if (!members || members.length === 0) {
              // First time login & No Invites -> Create New Workspace
              const { data: newOrg } = await supabase.from('organizations').insert({ name: `${user.email}'s Workspace`, owner_id: user.id }).select().single();
              if (newOrg) {
                  const { data: newMember } = await supabase.from('organization_members').insert({
                      organization_id: newOrg.id,
                      user_id: user.id,
                      email: user.email!,
                      name: user.user_metadata?.full_name || user.email!.split('@')[0],
                      role: 'Owner',
                      permissions: { access: ['all'] },
                      status: 'Active'
                  }).select().single();
                  setOrganization(newOrg);
                  setCurrentUserMember(newMember);
              }
          } else {
              // Use first org found
              const activeMember = members[0];
              setOrganization(activeMember.organizations as any);
              setCurrentUserMember(activeMember as any);
          }
      };
      loadOrg();
  }, []);

  const orgId = organization?.id;

  // 2. Load Data when Org is set
  useEffect(() => {
    if (!orgId) return;

    const fetchAll = async () => {
        const fetchTable = async (table: string, setter: any) => {
            const { data } = await supabase.from(table).select('*').eq('organization_id', orgId);
            if (data) setter(data);
        };

        fetchTable('business_lines', setBusinessLines);
        fetchTable('clients', setClients);
        fetchTable('deals', setDeals);
        fetchTable('projects', setProjects);
        fetchTable('tasks', setTasks);
        fetchTable('documents', setDocuments);
        fetchTable('playbooks', setPlaybooks);
        fetchTable('crm_entries', setCrmEntries);
        fetchTable('social_posts', setSocialPosts);
        fetchTable('organization_members', setTeamMembers);
        fetchTable('contacts', setContacts);
        fetchTable('events', setEvents);
        fetchTable('hr_candidates', setCandidates);
        fetchTable('hr_employees', setEmployees);
    };

    fetchAll();
  }, [orgId]);

  const isAdmin = () => {
      if (!currentUserMember) return false;
      return currentUserMember.role === 'Admin' || currentUserMember.role === 'Owner' || (currentUserMember.permissions && currentUserMember.permissions.access && currentUserMember.permissions.access.includes('all'));
  };


  // --- CRUD ACTIONS ---

  const addTask = useCallback(async (itemData: Partial<Task> & { itemType?: TaskType, title: string, businessLineName?: string }) => {
    if (!orgId) return "No organization found";
    
    let businessLineId = itemData.businessLineId;
    // Inference logic
    if (!businessLineId && itemData.businessLineName) {
        const businessLine = businessLines.find(bl => bl.name.toLowerCase() === itemData.businessLineName?.toLowerCase());
        businessLineId = businessLine?.id;
    }
    if (!businessLineId && itemData.clientId) {
        const client = clients.find(c => c.id === itemData.clientId);
        if (client) businessLineId = client.businessLineId;
    }
    
    // Default Logic: If no Business Line is attached, it implies "Personal" task.
    // We store null for businessLineId to represent "Personal".

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
        organization_id: orgId,
        created_at: new Date().toISOString(),
        sub_tasks: []
    };

    const { data: inserted, error } = await supabase.from('tasks').insert(payload).select().single();

    if (error) { console.error('Error creating task:', error); return `Error creating task.`; }

    if (inserted) {
        setTasks(prev => [inserted as Task, ...prev]);
        return `${inserted.type} "${inserted.title}" created.`;
    }
    return "Failed.";
  }, [orgId, businessLines, clients]);

  const addClient = useCallback(async (data: any) => {
      if (!orgId) return "";
      
      // LOGIC: Client MUST be attached to a Business Line.
      let businessLineId = data.businessLineId;
      if (!businessLineId && businessLines.length > 0) {
          // Attempt inference or default
          if (data.businessLineName) {
               const bl = businessLines.find(b => b.name.toLowerCase() === data.businessLineName.toLowerCase());
               if (bl) businessLineId = bl.id;
          }
          if (!businessLineId) businessLineId = businessLines[0].id;
      }
      
      // If strict enforcement fails, we proceed with the first BL found (V1.2 Logic: Keep Walter working)
      if (!businessLineId && businessLines.length > 0) businessLineId = businessLines[0].id; 
      if (!businessLineId) return "Failed: A client must be attached to a Business Line. Please create a Business Line first.";

      const payload = { ...data, businessLineId, organization_id: orgId };
      const { data: inserted, error } = await supabase.from('clients').insert(payload).select().single();
      if (!error && inserted) {
          setClients(prev => [inserted as Client, ...prev]);
          return `Client ${inserted.name} added`;
      }
      return "Failed";
  }, [orgId, businessLines]);

  const updateClient = useCallback(async (id: string, data: Partial<Client>) => {
      const { error } = await supabase.from('clients').update(data).eq('id', id);
      if (!error) setClients(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
      return "Updated";
  }, []);

  const deleteClient = useCallback(async (id: string) => {
      if (!isAdmin()) {
          alert("Only Admins can delete clients.");
          return;
      }
      await supabase.from('clients').delete().eq('id', id);
      setClients(prev => prev.filter(c => c.id !== id));
  }, [currentUserMember]);

  const addBusinessLine = useCallback(async (data: any) => {
      if (!orgId) return "Error";
      const payload = { ...data, organization_id: orgId };
      const { data: inserted, error } = await supabase.from('business_lines').insert(payload).select().single();
      if (!error && inserted) {
          setBusinessLines(prev => [inserted as BusinessLine, ...prev]);
          return `Business Line ${inserted.name} created.`;
      }
      return "Failed to create business line.";
  }, [orgId]);

  const addDeal = useCallback(async (data: any) => {
      if (!orgId) return "Error";
      
      // LOGIC: Deal MUST be attached to a Client.
      let clientId = data.clientId;
      // Inference
      if (!clientId && data.clientName) {
          const client = clients.find(c => c.name.toLowerCase() === data.clientName.toLowerCase());
          clientId = client?.id;
      }
      
      // Auto-Create Client if missing
      if (!clientId && data.clientName) {
          // Recursively create client if not found
          const response = await addClient({
              name: data.clientName,
              description: 'Auto-created by Walter',
              aiFocus: 'General',
              businessLineId: businessLines.length > 0 ? businessLines[0].id : undefined
          });
          return "Client not found. I've tried creating it, please try again in a moment.";
      }
      
      if (!clientId) return "Failed: Deal must be attached to a Client.";

      let businessLineId = data.businessLineId;
      if (!businessLineId && clientId) {
          const client = clients.find(c => c.id === clientId);
          businessLineId = client?.businessLineId;
      }

      const payload = {
          ...data,
          client_id: clientId,
          business_line_id: businessLineId,
          organization_id: orgId,
          status: 'Open',
          amount_paid: 0
      };
      delete payload.clientName;

      const { data: inserted, error } = await supabase.from('deals').insert(payload).select().single();
      if (!error && inserted) {
          setDeals(prev => [inserted as Deal, ...prev]);
          return `Deal "${inserted.name}" created.`;
      }
      return "Failed to create deal.";
  }, [orgId, clients, addClient, businessLines]);

  const addProject = useCallback(async (data: any) => {
      if (!orgId) return "Error";
      
      // LOGIC: Project MUST be attached to a Client.
      let clientId = data.clientId;
      if (!clientId && data.partnerName) {
           const client = clients.find(c => c.name.toLowerCase().includes(data.partnerName.toLowerCase()));
           clientId = client?.id;
      }
      
      if (!clientId) return "Failed: A project must be attached to a Client/Partner.";

      const payload = {
          ...data,
          client_id: clientId,
          organization_id: orgId,
          stage: data.stage || 'Lead'
      };
      const { data: inserted, error } = await supabase.from('projects').insert(payload).select().single();
      if (!error && inserted) {
          setProjects(prev => [inserted as Project, ...prev]);
          return `Project "${inserted.project_name}" created.`;
      }
      return "Failed to create project.";
  }, [orgId, clients]);

  const addCRMEntry = useCallback(async (entry: any) => {
      if (!orgId) return;
      const payload = {
          ...entry,
          client_id: entry.clientId,
          deal_id: entry.dealId,
          project_id: entry.projectId,
          organization_id: orgId,
          created_at: new Date().toISOString()
      };
      if (!payload.deal_id) delete payload.deal_id;
      if (!payload.project_id) delete payload.project_id;

      const { data: inserted, error } = await supabase.from('crm_entries').insert(payload).select().single();
      if (!error && inserted) {
          setCrmEntries(prev => [inserted as CRMEntry, ...prev]);
      }
  }, [orgId]);

  const addEvent = useCallback(async (data: Partial<Event>) => {
      if (!orgId) return;
      
      // LOGIC: Event MUST be attached to a Business Line.
      // We check if BL is provided, else default to first available for V1 simplicity.
      const businessLineId = businessLines.length > 0 ? businessLines[0].id : null;
      
      const payload = { ...data, organization_id: orgId, status: 'Planning', checklist: [] };
      const { data: inserted, error } = await supabase.from('events').insert(payload).select().single();
      if (!error && inserted) setEvents(prev => [inserted, ...prev]);
  }, [orgId, businessLines]);

  const updateEvent = useCallback(async (id: string, data: Partial<Event>) => {
      const { error } = await supabase.from('events').update(data).eq('id', id);
      if (!error) setEvents(prev => prev.map(e => e.id === id ? { ...e, ...data } : e));
  }, []);

  const addCandidate = useCallback(async (data: Partial<HRCandidate>) => {
      if (!orgId) return;
      const payload = { ...data, organization_id: orgId, status: 'Applied' };
      const { data: inserted, error } = await supabase.from('hr_candidates').insert(payload).select().single();
      if (!error && inserted) setCandidates(prev => [inserted, ...prev]);
  }, [orgId]);

  const updateCandidate = useCallback(async (id: string, data: Partial<HRCandidate>) => {
      const { error } = await supabase.from('hr_candidates').update(data).eq('id', id);
      if (!error) setCandidates(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
  }, []);

  const inviteMember = useCallback(async (email: string, roleData: any) => {
      if (!orgId) return null;
      const payload = {
          organization_id: orgId,
          email,
          role: 'Member',
          permissions: roleData, 
          status: 'Invited',
          name: email.split('@')[0]
      };
      const { data: inserted, error } = await supabase.from('organization_members').insert(payload).select().single();
      if (!error && inserted) {
          setTeamMembers(prev => [...prev, inserted as TeamMember]);
          return inserted as TeamMember;
      }
      return null;
  }, [orgId]);

  const updateTask = async (id: string, data: Partial<Task>) => {
      const { error } = await supabase.from('tasks').update(data).eq('id', id);
      if (!error) setTasks(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
  }
  const deleteTask = async (id: string) => {
      if (!isAdmin()) {
          alert("Only Admins can delete tasks.");
          return;
      }
      await supabase.from('tasks').delete().eq('id', id);
      setTasks(prev => prev.filter(t => t.id !== id));
  }

  const updateTaskStatusById = (id: string, status: KanbanStatus) => updateTask(id, { status });

  const updateTaskStatusByTitle = useCallback(async (title: string, status: string) => {
      const task = tasks.find(t => t.title.toLowerCase().includes(title.toLowerCase()));
      if (task) {
          await updateTask(task.id, { status: status as KanbanStatus });
          return `Task "${task.title}" moved to ${status}.`;
      }
      return `Could not find task with title "${title}".`;
  }, [tasks]);

  // -- Functions required for internal hook usage --
  
  const updateDeal = useCallback(async (id: string, d: Partial<Deal>) => {
      const { error } = await supabase.from('deals').update(d).eq('id', id);
      if (!error) setDeals(prev => prev.map(deal => deal.id === id ? {...deal, ...d} : deal));
      return "Updated";
  }, []);

  const updateProject = useCallback(async (id: string, d: Partial<Project>) => {
      const { error } = await supabase.from('projects').update(d).eq('id', id);
      if (!error) setProjects(prev => prev.map(p => p.id === id ? {...p, ...d} : p));
      return "Updated";
  }, []);

  const addDocument = useCallback(async (file: any, category: DocumentCategory, ownerId: string, ownerType: DocumentOwnerType, note?: string) => {
      if (!orgId) return null;
      const newDoc = {
          organization_id: orgId,
          name: file.name,
          category,
          owner_id: ownerId,
          owner_type: ownerType,
          url: URL.createObjectURL(new Blob([file.content || ''])),
          note,
          created_at: new Date().toISOString()
      };
      const { data: inserted } = await supabase.from('documents').insert(newDoc).select().single();
      if (inserted) {
          setDocuments(prev => [inserted as Document, ...prev]);
          return inserted as Document;
      }
      return null;
  }, [orgId]);

  // --- AI DISPATCHER ---
  
  const processTextAndExecute = useCallback(async (text: string, context: UniversalInputContext, file?: any) => {
      const result = await processTextMessage(text, { 
          clients: clients.map(c => c.name), 
          deals: deals.map(d => d.name), 
          businessLines: businessLines.map(b => b.name),
          teamMembers: teamMembers.map(m => m.name),
          projects: projects.map(p => p.projectName)
      }, context, "User is active", file);

      // 1. Business Line (Create first as root)
      if (result.action === 'create_business_line' && result.businessLine) {
          await addBusinessLine(result.businessLine);
      }

      // 2. Client (Create second)
      if (result.action === 'create_client' && result.client) {
           let blId = context.businessLineId;
           if (result.client.businessLineName) {
               const bl = businessLines.find(b => b.name.toLowerCase() === result.client!.businessLineName!.toLowerCase());
               if (bl) blId = bl.id;
           }
           if (!blId && businessLines.length > 0) blId = businessLines[0].id;
           if (blId) {
               await addClient({
                   name: result.client.name,
                   description: result.client.description,
                   aiFocus: result.client.aiFocus,
                   businessLineId: blId
               });
           }
      }
      
      // 3. Deal
      if (result.action === 'create_deal' && result.deal) {
          await addDeal({
              name: result.deal.name,
              description: result.deal.description,
              clientName: result.deal.clientName,
              value: result.deal.value,
              currency: result.deal.currency,
              revenueModel: result.deal.revenueModel
          });
      }

      // 4. Project
      if (result.action === 'create_project' && result.project) {
          await addProject(result.project);
      }

      // 5. Event
      if (result.action === 'create_event' && result.event) {
          await addEvent(result.event);
      }

      // 6. Candidate
      if (result.action === 'create_candidate' && result.candidate) {
          await addCandidate({
              name: result.candidate.name,
              roleApplied: result.candidate.roleApplied,
              email: result.candidate.email || 'pending@email.com'
          });
      }
      
      // 7. Social Post
      if (result.action === 'create_social_post' && result.socialPost) {
          // Handle in logic below via task or direct DB, assumed handled by addSocialPost if exposed
      }

      // 8. Tasks (Action Cascading: Execute ALL tasks in array)
      if (result.tasks && result.tasks.length > 0) {
          result.tasks.forEach(t => {
              let assigneeId = undefined;
              if (t.assignee_name) {
                  const member = teamMembers.find(m => m.name.toLowerCase().includes(t.assignee_name!.toLowerCase()));
                  if (member) assigneeId = member.id;
              }

              addTask({ 
                  title: t.title, 
                  dueDate: t.due_date || undefined,
                  priority: t.priority || 'Medium',
                  assigneeId: assigneeId,
                  businessLineName: t.business_line_name || undefined
              });
          });
      }
      
      // 9. Notes
      if (result.note || result.action === 'create_note') {
           const noteContent = result.note?.text || text;
           const channel = result.note?.channel || 'note';
           let clientId = context.clientId;
           if (!clientId && result.client?.name) {
               const c = clients.find(cl => cl.name.toLowerCase() === result.client?.name?.toLowerCase());
               clientId = c?.id;
           }
           if (clientId) {
               addCRMEntry({
                   clientId,
                   summary: noteContent,
                   type: channel as CRMEntryType,
                   rawContent: text,
                   dealId: context.dealId
               });
           }
      }

  }, [clients, deals, businessLines, teamMembers, projects, addTask, addClient, addCRMEntry, addDeal, addBusinessLine, addProject, addEvent, addCandidate]);

  // --- CONTEXTUAL WALTER & DEEP INTELLIGENCE ---

  const generateLeadScore = async (client: Client) => {
      if(!orgId) return;
      const prompt = `Analyze this client for lead scoring:
      Name: ${client.name}
      Description: ${client.description}
      AI Focus (Goals): ${client.aiFocus}
      
      Assign a Score between 0-100 based on clarity of need and potential value.
      Provide a short reason.
      Return JSON: { score: number, reason: string }`;
      
      const schema = {
          type: GeminiType.OBJECT,
          properties: {
              score: { type: GeminiType.NUMBER },
              reason: { type: GeminiType.STRING }
          }
      };
      
      const res = await generateJsonWithSearch(prompt, schema);
      if(res) {
          await updateClient(client.id, { leadScore: res.score, leadScoreReason: res.reason });
      }
  };

  const updateClientFromInteraction = async (id: string, text: string) => {
      const client = clients.find(c => c.id === id);
      if(!client) return;
      
      const prompt = `Analyze this interaction for client "${client.name}":
      "${text}"
      
      Extract key updates.
      Return JSON: { 
          summary: string (Last touch summary), 
          nextAction: string (Next step title), 
          nextActionDate: string (ISO date for next step) 
      }`;
      
      const schema = {
          type: GeminiType.OBJECT,
          properties: {
              summary: { type: GeminiType.STRING },
              nextAction: { type: GeminiType.STRING },
              nextActionDate: { type: GeminiType.STRING }
          }
      };
      
      const res = await generateJsonWithSearch(prompt, schema);
      if(res) {
          await updateClient(id, {
              proposedLastTouchSummary: res.summary,
              proposedNextAction: res.nextAction,
              proposedNextActionDueDate: res.nextActionDate
          });
      }
  };

  const updateDealFromInteraction = async (id: string, text: string) => {
      const deal = deals.find(d => d.id === id);
      if(!deal) return;
      
      const prompt = `Analyze this interaction for deal "${deal.name}":
      "${text}"
      
      Extract updates.
      Return JSON: {
          summary: string (Last touch),
          nextAction: string,
          nextActionDate: string (ISO),
          status: string (Open, Closed - Won, Closed - Lost)
      }`;
      
      const schema = {
          type: GeminiType.OBJECT,
          properties: {
              summary: { type: GeminiType.STRING },
              nextAction: { type: GeminiType.STRING },
              nextActionDate: { type: GeminiType.STRING },
              status: { type: GeminiType.STRING }
          }
      };
      
      const res = await generateJsonWithSearch(prompt, schema);
      if(res) {
          await updateDeal(id, {
              proposedLastTouchSummary: res.summary,
              proposedNextAction: res.nextAction,
              proposedNextActionDueDate: res.nextActionDate,
              proposedStatus: res.status as any
          });
      }
  };

  const updateProjectFromInteraction = async (id: string, text: string) => {
      const project = projects.find(p => p.id === id);
      if(!project) return;
      
      const prompt = `Analyze this update for project "${project.projectName}":
      "${text}"
      
      Return JSON: {
          summary: string,
          nextAction: string,
          nextActionDate: string,
          stage: string (Lead, In design, Live, Closing, Dormant)
      }`;
      
      const schema = {
          type: GeminiType.OBJECT,
          properties: {
              summary: { type: GeminiType.STRING },
              nextAction: { type: GeminiType.STRING },
              nextActionDate: { type: GeminiType.STRING },
              stage: { type: GeminiType.STRING }
          }
      };
      
      const res = await generateJsonWithSearch(prompt, schema);
      if(res) {
          await updateProject(id, {
              proposedLastTouchSummary: res.summary,
              proposedNextAction: res.nextAction,
              proposedNextActionDueDate: res.nextActionDate,
              proposedStage: res.stage as any
          });
      }
  };

  const refineTaskChecklist = async (taskId: string, command: string) => {
      const task = tasks.find(t => t.id === taskId);
      if(!task) return;
      
      const prompt = `Refine the checklist for task: "${task.title}".
      Description: ${task.description || 'None'}
      Current Checklist: ${JSON.stringify(task.subTasks || [])}
      
      User Command: "${command}"
      
      Return JSON: { subTasks: string[] (List of ALL subtask titles, new and old combined properly) }`;
      
      const schema = {
          type: GeminiType.OBJECT,
          properties: {
              subTasks: { type: GeminiType.ARRAY, items: { type: GeminiType.STRING } }
          }
      };
      
      const res = await generateJsonWithSearch(prompt, schema);
      if(res && res.subTasks) {
          const newSubTasks = res.subTasks.map((t: string) => ({ id: Math.random().toString(36), text: t, isDone: false }));
          await updateTask(taskId, { subTasks: newSubTasks });
      }
  };

  const generateDocumentDraft = async (prompt: string, category: DocumentCategory, owner: any, ownerType: string) => {
      const ownerName = 'name' in owner ? owner.name : owner.projectName;
      const fullPrompt = `Draft a ${category} document for ${ownerName} (${ownerType}).
      Context: ${prompt}
      
      Return only the document content in Markdown format.`;
      
      return await generateContentWithSearch(fullPrompt);
  };

  const regeneratePlaybook = async (businessLine: BusinessLine) => {
      const prompt = `Create a step-by-step Playbook for this Business Line:
      Name: ${businessLine.name}
      Description: ${businessLine.description}
      
      Return JSON: { steps: [{ title: string, description: string }] }`;
      
      const schema = {
          type: GeminiType.OBJECT,
          properties: {
              steps: { 
                  type: GeminiType.ARRAY,
                  items: {
                      type: GeminiType.OBJECT,
                      properties: {
                          title: { type: GeminiType.STRING },
                          description: { type: GeminiType.STRING }
                      }
                  }
              }
          }
      };
      
      const res = await generateJsonWithSearch(prompt, schema);
      if(res && res.steps) {
          // Check if playbook exists
          const existing = playbooks.find(p => p.businessLineId === businessLine.id);
          if(existing) {
              await supabase.from('playbooks').update({ steps: res.steps }).eq('id', existing.id);
              setPlaybooks(prev => prev.map(p => p.id === existing.id ? {...p, steps: res.steps} : p));
          } else {
              const { data: inserted } = await supabase.from('playbooks').insert({ 
                  organization_id: orgId,
                  business_line_id: businessLine.id,
                  steps: res.steps 
              }).select().single();
              if(inserted) setPlaybooks(prev => [...prev, inserted]);
          }
      }
  };

  // ... [Deep Intelligence Methods - Keep Existing Implementation] ...
  const analyzeProjectRisk = useCallback(async (project: Project) => {
      const prompt = `Perform a 'Pre-Mortem' risk assessment for this project:
      Name: ${project.projectName}
      Goal: ${project.goal}
      Stage: ${project.stage}
      
      Search for common pitfalls in similar projects (e.g., '${project.dealType}' deals in this industry).
      Provide a report listing top 3 Risks and Mitigation Strategies.`;
      
      return await generateContentWithSearch(prompt);
  }, []);

  const analyzeDealStrategy = useCallback(async (deal: Deal, client: Client) => {
      const prompt = `Act as a negotiation coach. Analyze this deal:
      Deal: ${deal.name} ($${deal.value})
      Client: ${client.name} (${client.description})
      Status: ${deal.status}
      
      Search for the client's recent financial health or strategic direction if public.
      Suggest 3 negotiation levers or value props we can use to close this deal.`;
      
      return await generateContentWithSearch(prompt);
  }, []);

  const generateSocialMediaIdeas = useCallback(async (businessLine: BusinessLine, promptInput: string) => {
      const prompt = `Find CURRENT trending topics, hashtags, or news events relevant to: ${businessLine.name} (${businessLine.description}).
      Then, suggest 5 engaging social media post ideas that tie these trends to our business.
      ${promptInput}`;
      
      const schema = {
          type: GeminiType.OBJECT,
          properties: {
              ideas: { type: GeminiType.ARRAY, items: { type: GeminiType.STRING } }
          }
      };
      
      const result = await generateJsonWithSearch(prompt, schema);
      return result?.ideas || [];
  }, []);
  
  const findProspectsByName = useCallback(async ({ businessLineName }: { businessLineName: string }) => {
      const bl = businessLines.find(b => b.name.toLowerCase() === businessLineName.toLowerCase());
      if (!bl) return "Business line not found.";
      
      const { prospects } = await findProspects(bl, "Find 3 high-value prospects.");
      if (prospects.length > 0) {
          return `Found ${prospects.length} prospects: ${prospects.map(p => p.name).join(", ")}. Check the Prospects tab.`;
      }
      return "No prospects found this time.";
  }, [businessLines]);

  const findProspects = useCallback(async (businessLine: BusinessLine, prompt: string) => {
        const searchPrompt = `Search for companies or individuals who match this profile:
        Business Line: ${businessLine.name}
        Target Customers: ${businessLine.customers}
        Goal: ${businessLine.aiFocus}
        
        Specific Instruction: ${prompt}
        
        Return a list of potential prospects with their name and likely need.`;

        const schema = {
            type: GeminiType.OBJECT,
            properties: {
                prospects: {
                    type: GeminiType.ARRAY,
                    items: {
                        type: GeminiType.OBJECT,
                        properties: {
                            name: { type: GeminiType.STRING },
                            likelyNeed: { type: GeminiType.STRING },
                        }
                    }
                }
            }
        };

        const result = await generateJsonWithSearch(searchPrompt, schema);
        return { prospects: result?.prospects || [], sources: [] };
  }, []);

  const getClientPulse = useCallback(async (client: Client, filters: any, customPrompt?: string) => {
      const prompt = `Find recent news, social media posts, or public activity about "${client.name}". 
      Focus on: ${client.aiFocus}.
      Timeframe: ${filters.timeframe}. Location: ${filters.location}.
      ${customPrompt || ''}
      
      Return a list of 'pulse' items including source, content summary, url, and date.`;

      const schema = {
          type: GeminiType.OBJECT,
          properties: {
              items: {
                  type: GeminiType.ARRAY,
                  items: {
                      type: GeminiType.OBJECT,
                      properties: {
                          source: { type: GeminiType.STRING, enum: ['News', 'Social Media'] },
                          content: { type: GeminiType.STRING },
                          url: { type: GeminiType.STRING },
                          date: { type: GeminiType.STRING }
                      }
                  }
              }
          }
      };

      const result = await generateJsonWithSearch(prompt, schema);
      return result?.items || [];
  }, []);

  const getCompetitorInsights = useCallback(async (businessLine: BusinessLine, filters: any, customPrompt?: string) => {
      const prompt = `Analyze the competitive landscape for a business doing: ${businessLine.description}.
      Location: ${filters.location}.
      ${customPrompt || ''}
      
      1. Identify key competitors and a recent insight for each.
      2. Identify trending search keywords customers use to find this service.`;

      const schema = {
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
                      }
                  }
              },
              trends: {
                  type: GeminiType.ARRAY,
                  items: {
                      type: GeminiType.OBJECT,
                      properties: {
                          keyword: { type: GeminiType.STRING },
                          insight: { type: GeminiType.STRING }
                      }
                  }
              }
          }
      };

      const result = await generateJsonWithSearch(prompt, schema);
      return { insights: result?.insights || [], trends: result?.trends || [] };
  }, []);


  // RETURN
  return {
      organization,
      currentUserMember,
      tasks, businessLines, clients, deals, projects, documents, playbooks, crmEntries, socialPosts, teamMembers, contacts,
      events, candidates, employees,
      addTask, updateTask, deleteTask, updateTaskStatusById, updateTaskStatusByTitle,
      addClient, updateClient, deleteClient,
      addEvent, updateEvent,
      addCandidate, updateCandidate,
      inviteMember,
      processTextAndExecute,
      findProspectsByName,
      
      addBusinessLine,
      addDeal,
      addProject,
      addCRMEntry,
      addCRMEntryFromVoice: (data: any) => { addCRMEntry(data); return "Entry added."; },
      
      updateBusinessLine: async (id: string, d: Partial<BusinessLine>) => { 
          await supabase.from('business_lines').update(d).eq('id', id);
          setBusinessLines(prev => prev.map(b => b.id === id ? {...b, ...d} : b));
          return "Updated"; 
      },
      deleteBusinessLine: async (id: string) => {
          if (!isAdmin()) { alert("Only Admins can delete."); return; }
          await supabase.from('business_lines').delete().eq('id', id);
          setBusinessLines(prev => prev.filter(b => b.id !== id));
      },
      updateDeal,
      deleteDeal: async (id: string) => {
          if (!isAdmin()) { alert("Only Admins can delete."); return; }
          await supabase.from('deals').delete().eq('id', id);
          setDeals(prev => prev.filter(d => d.id !== id));
      },
      updateProject,
      deleteProject: async (id: string) => {
          if (!isAdmin()) { alert("Only Admins can delete."); return; }
          await supabase.from('projects').delete().eq('id', id);
          setProjects(prev => prev.filter(p => p.id !== id));
      },
      addDocument,
      deleteDocument: async (id: string) => {
          await supabase.from('documents').delete().eq('id', id);
          setDocuments(prev => prev.filter(d => d.id !== id));
      },
      addContact: async (data: any) => {
          if (!orgId) return "Error";
          const payload = { ...data, organization_id: orgId };
          const { data: inserted } = await supabase.from('contacts').insert(payload).select().single();
          if (inserted) {
              setContacts(prev => [inserted as Contact, ...prev]);
              return "Contact added";
          }
          return "Failed";
      },
      updateContact: async (id: string, data: any) => {},
      deleteContact: async (id: string) => {
          await supabase.from('contacts').delete().eq('id', id);
          setContacts(prev => prev.filter(c => c.id !== id));
      },
      addSocialPost: async (data: any) => {
          const { data: inserted } = await supabase.from('social_posts').insert({...data, organization_id: orgId}).select().single();
          if (inserted) setSocialPosts(prev => [inserted as SocialPost, ...prev]);
          return null;
      },
      updateSocialPost: async (id: string, data: any) => {
          await supabase.from('social_posts').update(data).eq('id', id);
          setSocialPosts(prev => prev.map(p => p.id === id ? {...p, ...data} : p));
      },
      deleteSocialPost: async (id: string) => {},
      
      generateSocialCalendarFromChat: async (businessLine: BusinessLine, chat: string) => {
          const prompt = `Plan a social media calendar for ${businessLine.name} based on this goal: "${chat}".
          Return a JSON array of objects with: date, content, type, imagePrompt, channel, cta, engagementHook.`;
          const schema = {
              type: GeminiType.OBJECT,
              properties: {
                  posts: {
                      type: GeminiType.ARRAY,
                      items: {
                          type: GeminiType.OBJECT,
                          properties: {
                              date: { type: GeminiType.STRING },
                              content: { type: GeminiType.STRING },
                              type: { type: GeminiType.STRING },
                              imagePrompt: { type: GeminiType.STRING },
                              channel: { type: GeminiType.STRING },
                              cta: { type: GeminiType.STRING },
                              engagementHook: { type: GeminiType.STRING }
                          }
                      }
                  }
              }
          };
          const res = await generateJsonWithSearch(prompt, schema);
          return res?.posts || [];
      },
      generateSocialPostDetails: async (prompt: string, channel: string, businessLine: BusinessLine, file?: string, mimeType?: string, link?: string) => {
          // Simplified stub logic replaced with real call if needed, but for now just text generation
          const fullPrompt = `Create a ${channel} post for ${businessLine.name}. Context: ${prompt}. Include a visual prompt for an image generator.`;
          const schema = {
              type: GeminiType.OBJECT,
              properties: {
                  caption: { type: GeminiType.STRING },
                  visualPrompt: { type: GeminiType.STRING }
              }
          };
          const res = await generateJsonWithSearch(fullPrompt, schema);
          return res || { caption: '', visualPrompt: '' };
      },
      generateSocialImage: async (prompt: string) => {
          return await generateImages(prompt);
      },
      generateSocialVideo: async (prompt: string) => {
          return await generateVideos(prompt);
      },
      
      generateLeadScore,
      updateClientFromInteraction,
      approveClientUpdate: async (id: string) => {
          const client = clients.find(c => c.id === id);
          if(client && client.proposedNextAction) {
              await updateClient(id, {
                  // Commit changes to actual fields if you have them, or just clear
                  proposedLastTouchSummary: undefined, proposedNextAction: undefined, proposedNextActionDueDate: undefined
              });
              // Add task for next action
              addTask({ title: client.proposedNextAction, dueDate: client.proposedNextActionDueDate, clientId: id, businessLineId: client.businessLineId });
          }
      },
      clearProposedClientUpdate: async (id: string) => {
          await updateClient(id, { proposedLastTouchSummary: undefined, proposedNextAction: undefined, proposedNextActionDueDate: undefined });
      },
      
      updateDealFromInteraction,
      approveDealUpdate: async (id: string) => {
          const deal = deals.find(d => d.id === id);
          if(deal) {
              await updateDeal(id, {
                  status: deal.proposedStatus as any || deal.status,
                  proposedStatus: undefined, proposedLastTouchSummary: undefined, proposedNextAction: undefined, proposedNextActionDueDate: undefined
              });
              if(deal.proposedNextAction) {
                  addTask({ title: deal.proposedNextAction, dueDate: deal.proposedNextActionDueDate, dealId: id, clientId: deal.clientId, businessLineId: deal.businessLineId });
              }
          }
      },
      clearProposedDealUpdate: async (id: string) => {
          await updateDeal(id, { proposedStatus: undefined, proposedLastTouchSummary: undefined, proposedNextAction: undefined, proposedNextActionDueDate: undefined });
      },
      
      updateProjectFromInteraction,
      approveProjectUpdate: async (id: string) => {
          const project = projects.find(p => p.id === id);
          if(project) {
              await supabase.from('projects').update({
                  stage: project.proposedStage || project.stage,
                  last_touch_summary: project.proposedLastTouchSummary || project.lastTouchSummary,
                  next_action: project.proposedNextAction || project.nextAction,
                  next_action_due_date: project.proposedNextActionDueDate || project.nextActionDueDate,
                  proposedStage: null, proposedLastTouchSummary: null, proposedNextAction: null, proposedNextActionDueDate: null
              }).eq('id', id);
              
              setProjects(prev => prev.map(p => p.id === id ? {
                  ...p, 
                  stage: project.proposedStage || p.stage,
                  lastTouchSummary: project.proposedLastTouchSummary || p.lastTouchSummary,
                  nextAction: project.proposedNextAction || p.nextAction,
                  nextActionDueDate: project.proposedNextActionDueDate || p.nextActionDueDate,
                  proposedStage: undefined, proposedLastTouchSummary: undefined, proposedNextAction: undefined, proposedNextActionDueDate: undefined
              } : p));
          }
      },
      clearProposedProjectUpdate: async (id: string) => {
          await supabase.from('projects').update({ proposedStage: null, proposedLastTouchSummary: null, proposedNextAction: null, proposedNextActionDueDate: null }).eq('id', id);
          setProjects(prev => prev.map(p => p.id === id ? {...p, proposedStage: undefined, proposedLastTouchSummary: undefined, proposedNextAction: undefined, proposedNextActionDueDate: undefined} : p));
      },
      
      generateDocumentDraft,
      generateMarketingCollateralContent: async (prompt: string, type: string, owner: any) => {
          return await generateContentWithSearch(`Create a ${type} for ${owner.name || owner.projectName}. Context: ${prompt}`);
      },
      enhanceUserPrompt: async (prompt: string) => {
          const res = await generateContentWithSearch(`Enhance this prompt to be more detailed and effective for an AI generator: "${prompt}". Return only the enhanced prompt.`);
          return res;
      },
      logPaymentOnDeal: async (id: string, amount: number, note: string) => {
          const deal = deals.find(d => d.id === id);
          if(deal) {
              const newAmount = (deal.amountPaid || 0) + amount;
              await updateDeal(id, { amountPaid: newAmount });
              addCRMEntry({ clientId: deal.clientId, dealId: id, summary: `Payment Received: ${deal.currency} ${amount}. Note: ${note}`, type: 'note', rawContent: note });
          }
      },
      findProspects,
      getClientPulse,
      getCompetitorInsights,
      analyzeProjectRisk,
      analyzeDealStrategy,
      generateSocialMediaIdeas,
      
      getPlatformInsights: () => [],
      generateDocumentFromSubtask: async (task: Task, subtaskText: string) => {
          const content = await generateContentWithSearch(`Draft a document for the task: "${subtaskText}". Context: Task "${task.title}".`);
          return await addDocument({name: `${subtaskText}.md`, content}, 'SOPs', task.id, 'deal'); // fallback owner
      },
      researchSubtask: async (subtask: string, context: string) => {
          return await generateContentWithSearch(`Research this task: "${subtask}". Context: ${context}. Provide a summary.`);
      },
      refineTaskChecklist,
      generateMeetingTranscript: async (taskId: string) => {},
      toggleSubTask: async (taskId: string, subTaskId: string) => {
          const task = tasks.find(t => t.id === taskId);
          if(task && task.subTasks) {
              const newSubTasks = task.subTasks.map(st => st.id === subTaskId ? {...st, isDone: !st.isDone} : st);
              await updateTask(taskId, { subTasks: newSubTasks });
          }
      },
      dismissSuggestions: (type: string, id: string) => {},
      getDealOpportunities: async (deal: Deal) => {
          const prompt = `Analyze deal "${deal.name}". Suggest 3 upsell opportunities or next steps. Return JSON: { opportunities: [{ id: string, text: string }] }`;
          const schema = { type: GeminiType.OBJECT, properties: { opportunities: { type: GeminiType.ARRAY, items: { type: GeminiType.OBJECT, properties: { id: {type: GeminiType.STRING}, text: {type: GeminiType.STRING} } } } } };
          return await generateJsonWithSearch(prompt, schema) || { opportunities: [] };
      },
      getClientOpportunities: async (client: Client) => {
          const prompt = `Analyze client "${client.name}". Suggest 3 growth opportunities. Return JSON: { opportunities: [{ id: string, text: string }] }`;
          const schema = { type: GeminiType.OBJECT, properties: { opportunities: { type: GeminiType.ARRAY, items: { type: GeminiType.OBJECT, properties: { id: {type: GeminiType.STRING}, text: {type: GeminiType.STRING} } } } } };
          return await generateJsonWithSearch(prompt, schema) || { opportunities: [] };
      },
      regeneratePlaybook,
      updatePlaybook: async (id: string, steps: any[]) => {
          await supabase.from('playbooks').update({ steps }).eq('id', id);
          setPlaybooks(prev => prev.map(p => p.id === id ? {...p, steps} : p));
      },
      promoteSubtaskToTask: (taskId: string, subTaskId: string) => {
          const task = tasks.find(t => t.id === taskId);
          const subtask = task?.subTasks?.find(st => st.id === subTaskId);
          if(subtask) {
              addTask({ title: subtask.text, clientId: task?.clientId, dealId: task?.dealId, businessLineId: task?.businessLineId });
          }
      },
      getPlatformQueryResponse: async (query: string) => {
          return await generateContentWithSearch(`Answer this user query about their data: "${query}". Context: User has ${tasks.length} tasks, ${deals.length} deals.`);
      },
      logEmailToCRM: () => {},
      updateTeamMember: async (id: string, data: any) => {},
      deleteTeamMember: async (id: string) => {},
      updateCRMEntry: async (id: string, data: any) => {},
      deleteCRMEntry: async (id: string) => {},
  };
};
