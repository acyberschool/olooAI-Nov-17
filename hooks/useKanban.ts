
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


  // --- CRUD ACTIONS WITH FALLBACK LOGIC & ERROR SURFACING ---

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

    if (error) { 
        console.error('Error creating task:', error); 
        return `Error creating task: ${error.message}`; 
    }

    if (inserted) {
        setTasks(prev => [inserted as Task, ...prev]);
        return `${inserted.type} "${inserted.title}" created.`;
    }
    return "Failed to create task.";
  }, [orgId, businessLines, clients]);

  const addClient = useCallback(async (data: any) => {
      if (!orgId) return null;
      
      let businessLineId = data.businessLineId;
      if (!businessLineId && businessLines.length > 0) {
          if (data.businessLineName) {
               const bl = businessLines.find(b => b.name.toLowerCase() === data.businessLineName.toLowerCase());
               if (bl) businessLineId = bl.id;
          }
          if (!businessLineId) businessLineId = businessLines[0].id;
      }
      
      if (!businessLineId) {
          const { data: defaultBL } = await supabase.from('business_lines').insert({
              organization_id: orgId,
              name: 'General',
              description: 'Default business line',
              customers: 'General',
              ai_focus: 'General'
          }).select().single();
          if (defaultBL) {
              setBusinessLines(prev => [defaultBL as BusinessLine, ...prev]);
              businessLineId = defaultBL.id;
          } else {
              return null;
          }
      }

      const payload = { ...data, businessLineId, organization_id: orgId };
      const { data: inserted, error } = await supabase.from('clients').insert(payload).select().single();
      
      if (error) {
          console.error("Error creating client:", error);
          return null; // Or handle error display
      }

      if (inserted) {
          setClients(prev => [inserted as Client, ...prev]);
          return inserted as Client;
      }
      return null;
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
      return `Failed to create business line: ${error?.message}`;
  }, [orgId]);

  const addDeal = useCallback(async (data: any) => {
      if (!orgId) return "Error";
      
      let clientId = data.clientId;
      if (!clientId && data.clientName) {
          const client = clients.find(c => c.name.toLowerCase() === data.clientName.toLowerCase());
          clientId = client?.id;
      }
      
      if (!clientId && data.clientName) {
          const newClient = await addClient({
              name: data.clientName,
              description: 'Auto-created by Walter for Deal',
              aiFocus: 'General',
              businessLineId: businessLines.length > 0 ? businessLines[0].id : undefined
          });
          if (newClient) {
              clientId = newClient.id;
          } else {
              return "Failed to infer or create client for deal.";
          }
      }
      
      if (!clientId) return "Failed: Deal must be attached to a Client.";

      let businessLineId = data.businessLineId;
      if (!businessLineId && clientId) {
          const client = clients.find(c => c.id === clientId) || (await supabase.from('clients').select('*').eq('id', clientId).single()).data;
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
          return inserted; 
      }
      return `Failed to create deal: ${error?.message}`;
  }, [orgId, clients, addClient, businessLines]);

  const addProject = useCallback(async (data: any) => {
      if (!orgId) return "Error";
      
      let clientId = data.clientId;
      if (!clientId && data.partnerName) {
           const client = clients.find(c => c.name.toLowerCase().includes(data.partnerName.toLowerCase()));
           clientId = client?.id;
      }
      
      if (!clientId && data.partnerName) {
          const newClient = await addClient({
              name: data.partnerName,
              description: 'Auto-created for Project',
              aiFocus: 'Partnership',
              businessLineId: businessLines.length > 0 ? businessLines[0].id : undefined
          });
          if (newClient) clientId = newClient.id;
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
          return inserted;
      }
      return `Failed to create project: ${error?.message}`;
  }, [orgId, clients, addClient, businessLines]);

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
      if (!orgId) return "Error";
      const payload = { ...data, organization_id: orgId, status: 'Planning', checklist: [] };
      const { data: inserted, error } = await supabase.from('events').insert(payload).select().single();
      if (!error && inserted) {
          setEvents(prev => [inserted, ...prev]);
          return "Event created.";
      }
      return `Failed: ${error?.message}`;
  }, [orgId, businessLines]);

  const updateEvent = useCallback(async (id: string, data: Partial<Event>) => {
      const { error } = await supabase.from('events').update(data).eq('id', id);
      if (!error) setEvents(prev => prev.map(e => e.id === id ? { ...e, ...data } : e));
  }, []);

  const addCandidate = useCallback(async (data: Partial<HRCandidate>) => {
      if (!orgId) return "Error";
      const payload = { ...data, organization_id: orgId, status: 'Applied' };
      const { data: inserted, error } = await supabase.from('hr_candidates').insert(payload).select().single();
      if (!error && inserted) {
          setCandidates(prev => [inserted, ...prev]);
          return "Candidate added.";
      }
      return `Failed: ${error?.message}`;
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

  const addSocialPost = useCallback(async (data: any) => {
      if (!orgId) return null;
      const blId = data.business_line_id || (businessLines.length > 0 ? businessLines[0].id : null);
      
      const { data: inserted, error } = await supabase.from('social_posts').insert({...data, organization_id: orgId, business_line_id: blId}).select().single();
      if (inserted) {
          setSocialPosts(prev => [inserted as SocialPost, ...prev]);
          return inserted as SocialPost;
      }
      console.error("Failed to create post:", error?.message);
      return null;
  }, [orgId, businessLines]);

  const updateSocialPost = useCallback(async (id: string, data: any) => { 
      await supabase.from('social_posts').update(data).eq('id', id); 
      setSocialPosts(prev => prev.map(p => p.id === id ? {...p, ...data} : p)); 
  }, []);

  // --- AI DISPATCHER (REBUILT for FUNCTION CALLING) ---
  
  const processTextAndExecute = useCallback(async (text: string, context: UniversalInputContext, file?: any) => {
      const result = await processTextMessage(text, { 
          clients: clients.map(c => c.name), 
          deals: deals.map(d => d.name), 
          businessLines: businessLines.map(b => b.name),
          teamMembers: teamMembers.map(m => m.name),
          projects: projects.map(p => p.projectName)
      }, context, "User is active", file);

      if (result.functionCalls.length > 0) {
          console.log("🛠️ Executing Tools:", result.functionCalls);
          
          // Dynamic Context Injection for Chaining
          let lastCreatedClientId: string | undefined;
          let lastCreatedDealId: string | undefined;
          let lastCreatedProjectId: string | undefined;

          for (const call of result.functionCalls) {
              try {
                  const args = call.args as any;
                  
                  // --- Chaining Logic ---
                  if (!args.clientId && lastCreatedClientId) args.clientId = lastCreatedClientId;
                  if (!args.dealId && lastCreatedDealId) args.dealId = lastCreatedDealId;
                  if (!args.projectId && lastCreatedProjectId) args.projectId = lastCreatedProjectId;

                  switch (call.name) {
                      case 'createBusinessLine':
                          await addBusinessLine(args);
                          break;
                      case 'createClient':
                          const newClient = await addClient(args);
                          if (newClient) lastCreatedClientId = newClient.id;
                          break;
                      case 'createDeal':
                          // addDeal handles internal client creation if needed, but for chaining we track the ID
                          const newDeal = await addDeal(args);
                          if (newDeal && typeof newDeal !== 'string') {
                              lastCreatedDealId = newDeal.id;
                              lastCreatedClientId = newDeal.clientId;
                          }
                          break;
                      case 'createProject':
                          const newProject = await addProject(args);
                          if (newProject && typeof newProject !== 'string') {
                              lastCreatedProjectId = newProject.id;
                              lastCreatedClientId = newProject.clientId;
                          }
                          break;
                      case 'createBoardItem': // Tasks
                          // Inject defaults if missing
                          if (!args.businessLineId && !args.clientId && !args.dealId && !args.projectId) {
                               if (lastCreatedDealId) args.dealId = lastCreatedDealId;
                               else if (lastCreatedProjectId) args.projectId = lastCreatedProjectId;
                               else if (lastCreatedClientId) args.clientId = lastCreatedClientId;
                          }
                          await addTask(args);
                          break;
                      case 'createSocialPost':
                          const newPost = await addSocialPost(args);
                          if (newPost && args.visualPrompt) {
                              // Generate image in background and auto-attach to the new post
                              generateImages(args.visualPrompt).then(async (imageUrl) => {
                                  if (imageUrl) {
                                      await updateSocialPost(newPost.id, { imageUrl });
                                  }
                              });
                          }
                          break;
                      case 'createEvent':
                          await addEvent(args);
                          break;
                      case 'createCandidate':
                          await addCandidate(args);
                          break;
                      case 'createCrmEntry':
                          // Link to recent context
                          if (!args.clientId && lastCreatedClientId) args.clientId = lastCreatedClientId;
                          if (!args.dealId && lastCreatedDealId) args.dealId = lastCreatedDealId;
                          await addCRMEntry(args);
                          break;
                      default:
                          console.warn(`Tool ${call.name} not handled in Text Router.`);
                  }
              } catch (err) {
                  console.error(`Error executing ${call.name}:`, err);
              }
          }
      }

      // Return the text response from the model
      return result.text;

  }, [clients, deals, businessLines, teamMembers, projects, addTask, addClient, addCRMEntry, addDeal, addBusinessLine, addProject, addEvent, addCandidate, addSocialPost, updateSocialPost]);

  // --- DEEP INTELLIGENCE & HELPERS ---
  
  const generateLeadScore = async (client: Client) => {
      if(!orgId) return;
      const prompt = `Analyze this client: ${client.name}, ${client.description}. Goal: ${client.aiFocus}. Score 0-100. Return JSON: {score, reason}`;
      const schema = { type: GeminiType.OBJECT, properties: { score: { type: GeminiType.NUMBER }, reason: { type: GeminiType.STRING } } };
      const res = await generateJsonWithSearch(prompt, schema);
      if(res) await updateClient(client.id, { leadScore: res.score, leadScoreReason: res.reason });
  };

  const updateClientFromInteraction = async (id: string, text: string) => {
      const client = clients.find(c => c.id === id);
      if(!client) return;
      const prompt = `Analyze interaction for "${client.name}": "${text}". Return JSON: { summary, nextAction, nextActionDate }`;
      const schema = { type: GeminiType.OBJECT, properties: { summary: { type: GeminiType.STRING }, nextAction: { type: GeminiType.STRING }, nextActionDate: { type: GeminiType.STRING } } };
      const res = await generateJsonWithSearch(prompt, schema);
      if(res) await updateClient(id, { proposedLastTouchSummary: res.summary, proposedNextAction: res.nextAction, proposedNextActionDueDate: res.nextActionDate });
  };

  const updateDealFromInteraction = async (id: string, text: string) => {
      const deal = deals.find(d => d.id === id);
      if(!deal) return;
      const prompt = `Analyze interaction for deal "${deal.name}": "${text}". Return JSON: { summary, nextAction, nextActionDate, status }`;
      const schema = { type: GeminiType.OBJECT, properties: { summary: { type: GeminiType.STRING }, nextAction: { type: GeminiType.STRING }, nextActionDate: { type: GeminiType.STRING }, status: { type: GeminiType.STRING } } };
      const res = await generateJsonWithSearch(prompt, schema);
      if(res) await updateDeal(id, { proposedLastTouchSummary: res.summary, proposedNextAction: res.nextAction, proposedNextActionDueDate: res.nextActionDate, proposedStatus: res.status as any });
  };

  const updateProjectFromInteraction = async (id: string, text: string) => {
      const project = projects.find(p => p.id === id);
      if(!project) return;
      const prompt = `Analyze update for "${project.projectName}": "${text}". Return JSON: { summary, nextAction, nextActionDate, stage }`;
      const schema = { type: GeminiType.OBJECT, properties: { summary: { type: GeminiType.STRING }, nextAction: { type: GeminiType.STRING }, nextActionDate: { type: GeminiType.STRING }, stage: { type: GeminiType.STRING } } };
      const res = await generateJsonWithSearch(prompt, schema);
      if(res) await updateProject(id, { proposedLastTouchSummary: res.summary, proposedNextAction: res.nextAction, proposedNextActionDueDate: res.nextActionDate, proposedStage: res.stage as any });
  };

  const approveClientUpdate = async(id: string) => {
      const client = clients.find(c => c.id === id);
      if(client) {
          await updateClient(id, {
              proposedLastTouchSummary: null, proposedNextAction: null, proposedNextActionDueDate: null
          } as any);
      }
  };
  const clearProposedClientUpdate = async(id: string) => updateClient(id, { proposedLastTouchSummary: null, proposedNextAction: null, proposedNextActionDueDate: null });

  const approveDealUpdate = async(id: string) => {
      const deal = deals.find(d => d.id === id);
      if(deal) {
          await updateDeal(id, { status: deal.proposedStatus || deal.status, proposedStatus: null, proposedLastTouchSummary: null, proposedNextAction: null, proposedNextActionDueDate: null });
      }
  };
  const clearProposedDealUpdate = async(id: string) => updateDeal(id, { proposedStatus: null, proposedLastTouchSummary: null, proposedNextAction: null, proposedNextActionDueDate: null });

  const approveProjectUpdate = async(id: string) => {
        const project = projects.find(p => p.id === id);
        if(project) {
            await updateProject(id, { stage: project.proposedStage || project.stage, lastTouchSummary: project.proposedLastTouchSummary, nextAction: project.proposedNextAction, nextActionDueDate: project.proposedNextActionDueDate, proposedStage: null, proposedLastTouchSummary: null, proposedNextAction: null, proposedNextActionDueDate: null });
        }
  };
  const clearProposedProjectUpdate = async(id: string) => updateProject(id, { proposedStage: null, proposedLastTouchSummary: null, proposedNextAction: null, proposedNextActionDueDate: null });


  const refineTaskChecklist = async (taskId: string, command: string) => {
      const task = tasks.find(t => t.id === taskId);
      if(!task) return;
      const prompt = `Refine checklist for "${task.title}". Command: "${command}". Return JSON: { subTasks: string[] }`;
      const schema = { type: GeminiType.OBJECT, properties: { subTasks: { type: GeminiType.ARRAY, items: { type: GeminiType.STRING } } } };
      const res = await generateJsonWithSearch(prompt, schema);
      if(res && res.subTasks) {
          const newSubTasks = res.subTasks.map((t: string) => ({ id: Math.random().toString(36), text: t, isDone: false }));
          await updateTask(taskId, { subTasks: newSubTasks });
      }
  };

  const generateDocumentDraft = async (prompt: string, category: DocumentCategory, owner: any, ownerType: string) => {
      return await generateContentWithSearch(`Draft a ${category} document for ${owner.name || owner.projectName} (${ownerType}). Context: ${prompt}`);
  };

  const regeneratePlaybook = async (businessLine: BusinessLine) => {
      const prompt = `Create Playbook for ${businessLine.name}. Return JSON: { steps: [{ title, description }] }`;
      const schema = { type: GeminiType.OBJECT, properties: { steps: { type: GeminiType.ARRAY, items: { type: GeminiType.OBJECT, properties: { title: { type: GeminiType.STRING }, description: { type: GeminiType.STRING } } } } } };
      const res = await generateJsonWithSearch(prompt, schema);
      if(res && res.steps) {
          const existing = playbooks.find(p => p.businessLineId === businessLine.id);
          if(existing) await supabase.from('playbooks').update({ steps: res.steps }).eq('id', existing.id);
          else await supabase.from('playbooks').insert({ organization_id: orgId, business_line_id: businessLine.id, steps: res.steps });
          // Refresh handled by subscription or re-fetch in real app, here we assume optimistic or re-fetch
      }
  };

  const analyzeProjectRisk = useCallback(async (project: Project) => {
      return await generateContentWithSearch(`Risk assessment for project: ${project.projectName}. Goal: ${project.goal}.`);
  }, []);

  const analyzeDealStrategy = useCallback(async (deal: Deal, client: Client) => {
      return await generateContentWithSearch(`Negotiation strategy for deal: ${deal.name} ($${deal.value}). Client: ${client.name}.`);
  }, []);

  const generateSocialMediaIdeas = useCallback(async (businessLine: BusinessLine, promptInput: string) => {
      const prompt = `Social media ideas for ${businessLine.name}. ${promptInput}. Return JSON: { ideas: string[] }`;
      const schema = { type: GeminiType.OBJECT, properties: { ideas: { type: GeminiType.ARRAY, items: { type: GeminiType.STRING } } } };
      const result = await generateJsonWithSearch(prompt, schema);
      return result?.ideas || [];
  }, []);
  
  const findProspectsByName = useCallback(async ({ businessLineName }: { businessLineName: string }) => {
      const bl = businessLines.find(b => b.name.toLowerCase() === businessLineName.toLowerCase());
      if (!bl) return "Business line not found.";
      const { prospects } = await findProspects(bl, "Find 3 prospects.");
      return prospects.length > 0 ? `Found ${prospects.length} prospects.` : "No prospects found.";
  }, [businessLines]);

  const findProspects = useCallback(async (businessLine: BusinessLine, prompt: string) => {
        const searchPrompt = `Search prospects for ${businessLine.name}. ${prompt}. Return JSON: { prospects: [{ name, likelyNeed }] }`;
        const schema = { type: GeminiType.OBJECT, properties: { prospects: { type: GeminiType.ARRAY, items: { type: GeminiType.OBJECT, properties: { name: { type: GeminiType.STRING }, likelyNeed: { type: GeminiType.STRING } } } } } };
        const result = await generateJsonWithSearch(searchPrompt, schema);
        return { prospects: result?.prospects || [], sources: [] };
  }, []);

  const getClientPulse = useCallback(async (client: Client, filters: any, customPrompt?: string) => {
      const prompt = `News/Socials for "${client.name}". ${customPrompt || ''}. Return JSON: { items: [{ source, content, url, date }] }`;
      const schema = { type: GeminiType.OBJECT, properties: { items: { type: GeminiType.ARRAY, items: { type: GeminiType.OBJECT, properties: { source: { type: GeminiType.STRING }, content: { type: GeminiType.STRING }, url: { type: GeminiType.STRING }, date: { type: GeminiType.STRING } } } } } };
      const result = await generateJsonWithSearch(prompt, schema);
      return result?.items || [];
  }, []);

  const getCompetitorInsights = useCallback(async (businessLine: BusinessLine, filters: any, customPrompt?: string) => {
      const prompt = `Competitor analysis for ${businessLine.name}. ${customPrompt || ''}. Return JSON: { insights: [{ competitorName, insight, source }], trends: [{ keyword, insight }] }`;
      const schema = { type: GeminiType.OBJECT, properties: { insights: { type: GeminiType.ARRAY, items: { type: GeminiType.OBJECT, properties: { competitorName: { type: GeminiType.STRING }, insight: { type: GeminiType.STRING }, source: { type: GeminiType.STRING } } } }, trends: { type: GeminiType.ARRAY, items: { type: GeminiType.OBJECT, properties: { keyword: { type: GeminiType.STRING }, insight: { type: GeminiType.STRING } } } } } };
      const result = await generateJsonWithSearch(prompt, schema);
      return { insights: result?.insights || [], trends: result?.trends || [] };
  }, []);

  return {
      organization, currentUserMember,
      tasks, businessLines, clients, deals, projects, documents, playbooks, crmEntries, socialPosts, teamMembers, contacts, events, candidates, employees,
      addTask, updateTask, deleteTask, updateTaskStatusById, updateTaskStatusByTitle,
      addClient, updateClient, deleteClient,
      addEvent, updateEvent, addCandidate, updateCandidate, inviteMember,
      processTextAndExecute, findProspectsByName, addBusinessLine, addDeal, addProject, addCRMEntry,
      addCRMEntryFromVoice: (data: any) => { addCRMEntry(data); return "Entry added."; },
      updateBusinessLine: async (id: string, d: any) => { await supabase.from('business_lines').update(d).eq('id', id); setBusinessLines(prev => prev.map(b => b.id === id ? {...b, ...d} : b)); return "Updated"; },
      deleteBusinessLine: async (id: string) => { await supabase.from('business_lines').delete().eq('id', id); setBusinessLines(prev => prev.filter(b => b.id !== id)); },
      updateDeal, deleteDeal: async (id: string) => { await supabase.from('deals').delete().eq('id', id); setDeals(prev => prev.filter(d => d.id !== id)); },
      updateProject, deleteProject: async (id: string) => { await supabase.from('projects').delete().eq('id', id); setProjects(prev => prev.filter(p => p.id !== id)); },
      addDocument, deleteDocument: async (id: string) => { await supabase.from('documents').delete().eq('id', id); setDocuments(prev => prev.filter(d => d.id !== id)); },
      addContact: async (data: any) => { if(!orgId) return "Error"; const {data: inserted} = await supabase.from('contacts').insert({...data, organization_id: orgId}).select().single(); if(inserted) { setContacts(prev => [inserted, ...prev]); return "Added"; } return "Failed"; },
      deleteContact: async (id: string) => { await supabase.from('contacts').delete().eq('id', id); setContacts(prev => prev.filter(c => c.id !== id)); },
      addSocialPost, updateSocialPost,
      generateSocialCalendarFromChat: async (bl: BusinessLine, chat: string) => {
          const prompt = `Social calendar for ${bl.name}. Goal: ${chat}. Return JSON: { posts: [{ date, content, type, imagePrompt, channel, cta, engagementHook }] }`;
          const schema = { type: GeminiType.OBJECT, properties: { posts: { type: GeminiType.ARRAY, items: { type: GeminiType.OBJECT, properties: { date: { type: GeminiType.STRING }, content: { type: GeminiType.STRING }, type: { type: GeminiType.STRING }, imagePrompt: { type: GeminiType.STRING }, channel: { type: GeminiType.STRING }, cta: { type: GeminiType.STRING }, engagementHook: { type: GeminiType.STRING } } } } } };
          const res = await generateJsonWithSearch(prompt, schema);
          return res?.posts || [];
      },
      generateSocialPostDetails: async (prompt: string, channel: string, bl: BusinessLine, fileBase64?: string, mimeType?: string, link?: string) => {
          let contextStr = '';
          if (link) contextStr += ` Link: ${link}`;
          if (fileBase64) contextStr += ` [Image/File Attached]`;
          const res = await generateJsonWithSearch(`${channel} post for ${bl.name}. ${prompt} ${contextStr}. Return JSON: { caption, visualPrompt }`, { type: GeminiType.OBJECT, properties: { caption: { type: GeminiType.STRING }, visualPrompt: { type: GeminiType.STRING } } });
          return res || { caption: '', visualPrompt: '' };
      },
      generateSocialImage: async (prompt: string) => await generateImages(prompt),
      generateSocialVideo: async (prompt: string) => await generateVideos(prompt),
      generateLeadScore, updateClientFromInteraction, approveClientUpdate, clearProposedClientUpdate,
      updateDealFromInteraction, approveDealUpdate, clearProposedDealUpdate,
      updateProjectFromInteraction, approveProjectUpdate, clearProposedProjectUpdate,
      generateDocumentDraft, generateMarketingCollateralContent: async (prompt: string, type: string, owner: any) => await generateContentWithSearch(`Create ${type} for ${owner.name}. ${prompt}`),
      enhanceUserPrompt: async (prompt: string) => await generateContentWithSearch(`Enhance prompt: "${prompt}"`),
      logPaymentOnDeal: async (id: string, amount: number, note: string) => {
          const deal = deals.find(d => d.id === id);
          if(deal) {
              await updateDeal(id, { amountPaid: (deal.amountPaid || 0) + amount });
              addCRMEntry({ clientId: deal.clientId, dealId: id, summary: `Payment: ${amount}. ${note}`, type: 'note', rawContent: note });
          }
      },
      findProspects, getClientPulse, getCompetitorInsights, analyzeProjectRisk, analyzeDealStrategy, generateSocialMediaIdeas,
      getPlatformInsights: () => [],
      generateDocumentFromSubtask: async (task: Task, text: string) => {
          const content = await generateContentWithSearch(`Draft doc for task: ${text}`);
          await addDocument({name: `${text}.md`, content}, 'SOPs', task.id, 'deal');
      },
      researchSubtask: async (text: string, ctx: string) => await generateContentWithSearch(`Research: ${text}. Context: ${ctx}`),
      refineTaskChecklist,
      generateMeetingTranscript: async (taskId?: string) => {},
      toggleSubTask: async (tid: string, sid: string) => {
          const t = tasks.find(x => x.id === tid);
          if(t && t.subTasks) await updateTask(tid, { subTasks: t.subTasks.map(s => s.id === sid ? {...s, isDone: !s.isDone} : s) });
      },
      dismissSuggestions: (entityType?: string, entityId?: string) => {},
      getDealOpportunities: async (deal: Deal) => {
          const res = await generateJsonWithSearch(`Upsell ideas for deal ${deal.name}. Return JSON: { opportunities: [{id, text}] }`, { type: GeminiType.OBJECT, properties: { opportunities: { type: GeminiType.ARRAY, items: { type: GeminiType.OBJECT, properties: { id: { type: GeminiType.STRING }, text: { type: GeminiType.STRING } } } } } });
          return res || { opportunities: [] };
      },
      getClientOpportunities: async (client: Client) => {
          const res = await generateJsonWithSearch(`Growth ideas for client ${client.name}. Return JSON: { opportunities: [{id, text}] }`, { type: GeminiType.OBJECT, properties: { opportunities: { type: GeminiType.ARRAY, items: { type: GeminiType.OBJECT, properties: { id: { type: GeminiType.STRING }, text: { type: GeminiType.STRING } } } } } });
          return res || { opportunities: [] };
      },
      regeneratePlaybook, updatePlaybook: async (id: string, steps: any[]) => { await supabase.from('playbooks').update({ steps }).eq('id', id); setPlaybooks(prev => prev.map(p => p.id === id ? {...p, steps} : p)); },
      promoteSubtaskToTask: (tid: string, sid: string) => {
          const t = tasks.find(x => x.id === tid);
          const s = t?.subTasks?.find(x => x.id === sid);
          if(s) addTask({ title: s.text, clientId: t?.clientId, dealId: t?.dealId, businessLineId: t?.businessLineId });
      },
      getPlatformQueryResponse: async (q: string) => await generateContentWithSearch(`Query: ${q}. Context: ${tasks.length} tasks.`),
      logEmailToCRM: () => {}, updateTeamMember: async () => {}, deleteTeamMember: async () => {}, updateCRMEntry: async () => {}, deleteCRMEntry: async () => {},
  };
};
