
import React, { useState, useCallback, useEffect } from 'react';
import { Task, KanbanStatus, TaskType, BusinessLine, Client, Deal, Document, DocumentCategory, Opportunity, DocumentOwnerType, Playbook, PlaybookStep, CRMEntry, CRMEntryType, Suggestion, Prospect, ClientPulse, CompetitorInsight, SearchTrend, FilterOptions, GeminiType, PlatformInsight, Project, TeamMember, Contact, Role, UniversalInputContext, SocialPost, GeminiModality, ProjectStage, ProjectDealType, Organization, Event, HRCandidate, HREmployee } from '../types';
import { getAiInstance } from '../config/geminiConfig';
import { processTextMessage } from '../services/routerBrainService';
import { generateContentWithSearch, generateVideos } from '../services/geminiService';
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
                  // Swallow RLS errors safely to prevent UI crash if no invites exist
                  console.warn("Invite check safe fail:", updateError.message);
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


  // --- CRUD ACTIONS ---

  const addTask = useCallback(async (itemData: Partial<Task> & { itemType?: TaskType, title: string, businessLineName?: string }) => {
    if (!orgId) return "No organization found";
    
    let businessLineId = itemData.businessLineId;
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

    if (error) { console.error('Error creating task:', error); return `Error creating task.`; }

    if (inserted) {
        setTasks(prev => [inserted as Task, ...prev]);
        return `${inserted.type} "${inserted.title}" created.`;
    }
    return "Failed.";
  }, [orgId, businessLines, clients]);

  const addClient = useCallback(async (data: any) => {
      if (!orgId) return "";
      const payload = { ...data, organization_id: orgId };
      const { data: inserted, error } = await supabase.from('clients').insert(payload).select().single();
      if (!error && inserted) {
          setClients(prev => [inserted as Client, ...prev]);
          return `Client ${inserted.name} added`;
      }
      return "Failed";
  }, [orgId]);

  const updateClient = useCallback(async (id: string, data: Partial<Client>) => {
      const { error } = await supabase.from('clients').update(data).eq('id', id);
      if (!error) setClients(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
      return "Updated";
  }, []);

  const deleteClient = useCallback(async (id: string) => {
      await supabase.from('clients').delete().eq('id', id);
      setClients(prev => prev.filter(c => c.id !== id));
  }, []);

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
      let clientId = data.clientId;
      if (!clientId && data.clientName) {
          const client = clients.find(c => c.name.toLowerCase() === data.clientName.toLowerCase());
          clientId = client?.id;
      }
      let businessLineId = data.businessLineId;
      if (!businessLineId && clientId) {
          const client = clients.find(c => c.id === clientId);
          businessLineId = client?.businessLineId;
      }

      if (!clientId) return "Could not find client for this deal.";

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
  }, [orgId, clients]);

  const addProject = useCallback(async (data: any) => {
      if (!orgId) return "Error";
      let clientId = data.clientId;
      if (!clientId && data.partnerName) {
           const client = clients.find(c => c.name.toLowerCase().includes(data.partnerName.toLowerCase()));
           clientId = client?.id;
      }
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

  // --- Event & HR (Real Implementation) ---

  const addEvent = useCallback(async (data: Partial<Event>) => {
      if (!orgId) return;
      const payload = { ...data, organization_id: orgId, status: 'Planning', checklist: [] };
      const { data: inserted, error } = await supabase.from('events').insert(payload).select().single();
      if (!error && inserted) setEvents(prev => [inserted, ...prev]);
  }, [orgId]);

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

  // --- AI DISPATCHER ---
  
  const processTextAndExecute = useCallback(async (text: string, context: UniversalInputContext, file?: any) => {
      const result = await processTextMessage(text, { 
          clients: clients.map(c => c.name), 
          deals: deals.map(d => d.name), 
          businessLines: businessLines.map(b => b.name) 
      }, context, "User is active", file);

      // 1. Tasks
      if (result.action === 'create_task' || result.action === 'both') {
          result.tasks.forEach(t => addTask({ 
              title: t.title, 
              dueDate: t.due_date || undefined,
              priority: t.priority || 'Medium'
          }));
      }
      
      // 2. Notes / CRM Entries
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

      // 3. Business Line
      if (result.action === 'create_business_line' && result.businessLine) {
          addBusinessLine(result.businessLine);
      }

      // 4. Client
      if (result.action === 'create_client' && result.client) {
           let blId = context.businessLineId;
           if (result.client.businessLineName) {
               const bl = businessLines.find(b => b.name.toLowerCase() === result.client!.businessLineName!.toLowerCase());
               if (bl) blId = bl.id;
           }
           if (!blId && businessLines.length > 0) blId = businessLines[0].id;
           if (blId) {
               addClient({
                   name: result.client.name,
                   description: result.client.description,
                   aiFocus: result.client.aiFocus,
                   businessLineId: blId
               });
           }
      }
      
      // 5. Deal
      if (result.action === 'create_deal' && result.deal) {
          addDeal({
              name: result.deal.name,
              description: result.deal.description,
              clientName: result.deal.clientName,
              value: result.deal.value,
              currency: result.deal.currency,
              revenueModel: result.deal.revenueModel
          });
      }

      // 6. Project
      if (result.action === 'create_project' && result.project) {
          addProject(result.project);
      }

      // 7. Event (NEW)
      if (result.action === 'create_event' && result.event) {
          addEvent(result.event);
      }

      // 8. Candidate (NEW)
      if (result.action === 'create_candidate' && result.candidate) {
          addCandidate({
              name: result.candidate.name,
              roleApplied: result.candidate.roleApplied,
              email: result.candidate.email || 'pending@email.com'
          });
      }

  }, [clients, deals, businessLines, addTask, addClient, addCRMEntry, addDeal, addBusinessLine, addProject, addEvent, addCandidate]);

  const findProspectsByName = useCallback(async ({ businessLineName }: { businessLineName: string }) => {
      return "Feature placeholder: Found prospects logic would run here.";
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
          await supabase.from('business_lines').delete().eq('id', id);
          setBusinessLines(prev => prev.filter(b => b.id !== id));
      },
      updateDeal: async (id: string, d: Partial<Deal>) => {
          await supabase.from('deals').update(d).eq('id', id);
          setDeals(prev => prev.map(deal => deal.id === id ? {...deal, ...d} : deal));
          return "Updated";
      },
      deleteDeal: async (id: string) => {
          await supabase.from('deals').delete().eq('id', id);
          setDeals(prev => prev.filter(d => d.id !== id));
      },
      updateProject: async (id: string, d: Partial<Project>) => {
          await supabase.from('projects').update(d).eq('id', id);
          setProjects(prev => prev.map(p => p.id === id ? {...p, ...d} : p));
          return "Updated";
      },
      deleteProject: async (id: string) => {
          await supabase.from('projects').delete().eq('id', id);
          setProjects(prev => prev.filter(p => p.id !== id));
      },
      addDocument: async (file: any, category: DocumentCategory, ownerId: string, ownerType: DocumentOwnerType, note?: string) => {
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
      },
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
      
      generateSocialCalendarFromChat: async (businessLine: BusinessLine, chat: string) => [],
      generateSocialPostDetails: async (prompt: string, channel: string, businessLine: BusinessLine, file?: string, mimeType?: string, link?: string) => ({ caption: "", visualPrompt: "" }),
      generateSocialImage: async (prompt: string) => null,
      generateSocialVideo: async (prompt: string) => null,
      
      generateLeadScore: async (client: Client) => {},
      updateClientFromInteraction: async (id: string, text: string) => {},
      approveClientUpdate: (id: string) => {},
      clearProposedClientUpdate: (id: string) => {},
      updateDealFromInteraction: async (id: string, text: string) => {},
      approveDealUpdate: (id: string) => {},
      clearProposedDealUpdate: (id: string) => {},
      updateProjectFromInteraction: async (id: string, text: string) => {},
      approveProjectUpdate: (id: string) => {},
      clearProposedProjectUpdate: (id: string) => {},
      generateDocumentDraft: async (prompt: string, category: DocumentCategory, owner: any, ownerType: string) => "Draft content...",
      generateMarketingCollateralContent: async (prompt: string, type: string, owner: any) => "Marketing content...",
      enhanceUserPrompt: async (prompt: string) => "Enhanced prompt...",
      logPaymentOnDeal: (id: string, amount: number, note: string) => {},
      findProspects: async (businessLine: BusinessLine, prompt: string) => ({ prospects: [], sources: [] }),
      getClientPulse: async (client: Client, filters: any, prompt?: string) => [],
      getCompetitorInsights: async (businessLine: BusinessLine, filters: any, prompt?: string) => ({ insights: [], trends: [] }),
      getPlatformInsights: () => [],
      generateDocumentFromSubtask: async (task: Task, subtaskText: string) => null,
      researchSubtask: async (subtask: string, context: string) => "Research results...",
      refineTaskChecklist: async (taskId: string, command: string) => {},
      generateMeetingTranscript: async (taskId: string) => {},
      toggleSubTask: async (taskId: string, subTaskId: string) => {},
      dismissSuggestions: (type: string, id: string) => {},
      getDealOpportunities: async (deal: Deal) => ({ opportunities: [] }),
      getClientOpportunities: async (client: Client) => ({ opportunities: [] }),
      generateSocialMediaIdeas: async (businessLine: BusinessLine, prompt: string) => [],
      regeneratePlaybook: async (businessLine: BusinessLine) => {},
      updatePlaybook: async (id: string, steps: any[]) => {},
      promoteSubtaskToTask: (taskId: string, subTaskId: string) => {},
      getPlatformQueryResponse: async (query: string) => "",
      logEmailToCRM: () => {},
      updateTeamMember: async (id: string, data: any) => {},
      deleteTeamMember: async (id: string) => {},
      updateCRMEntry: async (id: string, data: any) => {},
      deleteCRMEntry: async (id: string) => {},
  };
};
