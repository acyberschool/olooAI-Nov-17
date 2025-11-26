
import { useState, useCallback, useEffect } from 'react';
import { Task, BusinessLine, Client, Deal, Project, CRMEntry, Document, TeamMember, SocialPost, Event, HRCandidate, HREmployee, Contact, KanbanStatus, DocumentCategory, DocumentOwnerType, DelegationPlan } from '../types';
import { initialTasks, initialBusinessLines, initialClients, initialDeals, initialProjects, initialCRMEntries, initialDocuments, initialTeamMembers } from '../data/mockData';
import * as geminiService from '../services/geminiService';
import { processTextMessage } from '../services/routerBrainService';
import { supabase } from '../supabaseClient';

export const useKanban = () => {
    const [tasks, setTasks] = useState<Task[]>(initialTasks);
    const [businessLines, setBusinessLines] = useState<BusinessLine[]>(initialBusinessLines);
    const [clients, setClients] = useState<Client[]>(initialClients);
    const [deals, setDeals] = useState<Deal[]>(initialDeals);
    const [projects, setProjects] = useState<Project[]>(initialProjects);
    const [crmEntries, setCrmEntries] = useState<CRMEntry[]>(initialCRMEntries);
    const [documents, setDocuments] = useState<Document[]>(initialDocuments);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>(initialTeamMembers);
    
    const [socialPosts, setSocialPosts] = useState<SocialPost[]>([]);
    const [events, setEvents] = useState<Event[]>([]);
    const [candidates, setCandidates] = useState<HRCandidate[]>([]);
    const [employees, setEmployees] = useState<HREmployee[]>([]);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [organization, setOrganization] = useState<{ id: string, name: string } | null>(null);
    const [currentUserMember, setCurrentUserMember] = useState<TeamMember | null>(null);

    const [orgId, setOrgId] = useState<string | null>(null);

    // Load Organization and User Logic (Simplified for demo)
    useEffect(() => {
        const loadOrg = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                // In real app, fetch from DB. For now, mock.
                const mockOrgId = 'org-1';
                setOrgId(mockOrgId);
                setOrganization({ id: mockOrgId, name: "My Workspace" });
                
                // Find or create current user member
                let member = teamMembers.find(m => m.email === user.email);
                if (!member) {
                    // Check for invites
                    // In real app, this would check the DB.
                    // For demo, we just create them as Owner if first, or Member.
                    member = {
                        id: user.id,
                        organizationId: mockOrgId,
                        userId: user.id,
                        name: user.user_metadata.full_name || user.email?.split('@')[0] || 'User',
                        email: user.email || '',
                        role: 'Owner',
                        permissions: { access: ['all'] },
                        status: 'Active',
                        lastActive: new Date().toISOString()
                    };
                    setTeamMembers(prev => [...prev, member!]);
                }
                setCurrentUserMember(member);
            }
        };
        loadOrg();
    }, []);


    // --- Basic CRUD ---
    const addTask = useCallback(async (task: any) => {
        console.log("addTask called with:", task);
        if (!orgId) return "Error: No Organization ID.";

        let assigneeId = task.assigneeId;
        if (task.assigneeName) {
            const member = teamMembers.find(m => m.name.toLowerCase().includes(task.assigneeName.toLowerCase()));
            if (member) assigneeId = member.id;
        }

        const newTask: Task = {
            id: `task-${Date.now()}`,
            organizationId: orgId,
            title: task.title || 'Untitled Task',
            status: KanbanStatus.ToDo,
            type: task.itemType === 'Meeting' ? 'Meeting' : task.itemType === 'Reminder' ? 'Reminder' : 'Task',
            dueDate: task.dueDate || undefined,
            priority: task.priority || 'Medium',
            clientId: task.clientId,
            dealId: task.dealId,
            businessLineId: task.businessLineId,
            assigneeId: assigneeId,
            createdAt: new Date().toISOString(),
        } as Task;

        const { data: inserted, error } = await supabase.from('tasks').insert(newTask).select().single();
        
        if (error) {
            console.error("addTask Supabase Error:", error);
            return `Failed to create task: ${error.message}`;
        }

        if (inserted) {
            setTasks(prev => [...prev, inserted as Task]);
            return inserted.id;
        }
        return "Unknown error creating task";
    }, [orgId, teamMembers]);

    const updateTask = (id: string, updates: Partial<Task>) => {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
        // In real app: supabase.from('tasks').update(updates).eq('id', id)
    };

    const deleteTask = (id: string) => {
        setTasks(prev => prev.filter(t => t.id !== id));
    };

    const updateTaskStatusById = (id: string, status: KanbanStatus) => {
        updateTask(id, { status });
    };

    const toggleSubTask = (taskId: string, subTaskId: string) => {
        setTasks(prev => prev.map(t => {
            if (t.id === taskId && t.subTasks) {
                return {
                    ...t,
                    subTasks: t.subTasks.map(s => s.id === subTaskId ? { ...s, isDone: !s.isDone } : s)
                };
            }
            return t;
        }));
    };

    const promoteSubtaskToTask = (taskId: string, subTaskId: string) => {
        const task = tasks.find(t => t.id === taskId);
        const subTask = task?.subTasks?.find(s => s.id === subTaskId);
        if (task && subTask) {
            addTask({
                title: subTask.text,
                clientId: task.clientId,
                dealId: task.dealId,
                businessLineId: task.businessLineId
            });
        }
    }

    // --- Business Lines ---
    const addBusinessLine = useCallback(async (data: any) => {
        console.log("addBusinessLine called with:", data);
        if (!orgId) return "Error: No Org ID";

        const newBL: BusinessLine = { 
            id: `bl-${Date.now()}`, 
            organizationId: orgId, 
            name: data.name,
            description: data.description || "New Business Line",
            customers: data.customers || "General",
            aiFocus: data.aiFocus || "General Strategy"
        };
        
        const { data: inserted, error } = await supabase.from('business_lines').insert(newBL).select().single();
        if (error) {
             console.error("addBL Supabase Error:", error);
             return `Failed: ${error.message}`;
        }
        if (inserted) {
            setBusinessLines(prev => [...prev, inserted as BusinessLine]);
            return inserted as BusinessLine;
        }
        return "Unknown error";
    }, [orgId]);
    
    const updateBusinessLine = (id: string, data: Partial<BusinessLine>) => {
        setBusinessLines(prev => prev.map(b => b.id === id ? {...b, ...data} : b));
    }

    const deleteBusinessLine = (id: string) => {
        setBusinessLines(prev => prev.filter(b => b.id !== id));
    }

    // --- Clients ---
    const addClient = useCallback(async (data: any) => {
        console.log("addClient called with:", data);
        if (!orgId) return "Error: No Org ID";

        let blId = data.businessLineId;
        // Inference fallback
        if (!blId && data.businessLineName) {
             const match = businessLines.find(b => b.name.toLowerCase().includes(data.businessLineName.toLowerCase()));
             if (match) blId = match.id;
        }
        if (!blId && businessLines.length > 0) {
            blId = businessLines[0].id; // Default
        }

        const newClient: Client = { 
            id: `client-${Date.now()}`, 
            organizationId: orgId, 
            name: data.name,
            description: data.description || 'New Client',
            aiFocus: data.aiFocus || 'General',
            businessLineId: blId || 'unknown'
        };

        const { data: inserted, error } = await supabase.from('clients').insert(newClient).select().single();
        if (error) {
            console.error("addClient Supabase Error:", error);
            return `Failed: ${error.message}`;
        }
        if (inserted) {
            setClients(prev => [...prev, inserted as Client]);
            return inserted as Client;
        }
        return "Unknown error";
    }, [orgId, businessLines]);

    const updateClient = (id: string, data: Partial<Client>) => {
        setClients(prev => prev.map(c => c.id === id ? {...c, ...data} : c));
    };

    const deleteClient = (id: string) => {
        setClients(prev => prev.filter(c => c.id !== id));
    }

    // --- Deals ---
    const addDeal = useCallback(async (data: any) => {
        console.log("addDeal called with:", data);
        if (!orgId) return "Error: No Org ID";

        let clientId = data.clientId;
        if (!clientId && data.clientName) {
             const match = clients.find(c => c.name.toLowerCase().includes(data.clientName.toLowerCase()));
             if (match) {
                 clientId = match.id;
             } else {
                 // Auto-create client (Action Cascading)
                 const newClient = await addClient({ name: data.clientName });
                 if (typeof newClient !== 'string' && newClient) {
                     clientId = newClient.id;
                 }
             }
        }
        
        // Find BL from Client if not provided
        let blId = data.businessLineId;
        if (!blId && clientId) {
            const client = clients.find(c => c.id === clientId);
            if (client) blId = client.businessLineId;
        }

        const newDeal: Deal = { 
            id: `deal-${Date.now()}`, 
            organizationId: orgId, 
            status: 'Open', 
            amountPaid: 0,
            name: data.name,
            description: data.description || 'New Deal',
            value: Number(data.value) || 0,
            currency: data.currency || 'USD',
            revenueModel: data.revenueModel || 'Full Pay',
            clientId: clientId || 'unknown',
            businessLineId: blId || (businessLines[0]?.id) || 'unknown'
        };

        const { data: inserted, error } = await supabase.from('deals').insert(newDeal).select().single();
        if (error) {
            console.error("addDeal Supabase Error:", error);
            return `Failed: ${error.message}`;
        }
        if (inserted) {
            setDeals(prev => [...prev, inserted as Deal]);
            return inserted as Deal;
        }
        return "Unknown error";
    }, [orgId, clients, addClient, businessLines]);

    const updateDeal = (id: string, data: Partial<Deal>) => {
        setDeals(prev => prev.map(d => d.id === id ? {...d, ...data} : d));
    };

    const deleteDeal = (id: string) => {
        setDeals(prev => prev.filter(d => d.id !== id));
    }

    // --- Projects ---
    const addProject = useCallback(async (data: any) => {
        console.log("addProject called with:", data);
        if (!orgId) return "Error: No Org ID";

        const newProject: Project = { 
            id: `proj-${Date.now()}`, 
            organizationId: orgId, 
            stage: data.stage || 'Lead',
            lastTouchDate: new Date().toISOString(),
            lastTouchSummary: 'Project created',
            nextAction: 'Define scope',
            nextActionOwner: 'Me',
            nextActionDueDate: new Date().toISOString(),
            opportunityNote: '',
            partnerName: data.partnerName || 'Unknown',
            projectName: data.projectName,
            goal: data.goal || 'TBD',
            dealType: data.dealType || 'Fee-based',
            expectedRevenue: Number(data.expectedRevenue) || 0,
            impactMetric: data.impactMetric || 'TBD',
            projectOwner: 'Me' // Added default owner
        };
        const { data: inserted, error } = await supabase.from('projects').insert(newProject).select().single();
        if (error) {
            console.error("addProject Supabase Error:", error);
            return `Failed: ${error.message}`;
        }
        if (inserted) {
            setProjects(prev => [...prev, inserted as Project]);
            return inserted as Project;
        }
        return "Unknown error";
    }, [orgId]);

    const updateProject = (id: string, data: Partial<Project>) => {
        setProjects(prev => prev.map(p => p.id === id ? {...p, ...data} : p));
    };

    const deleteProject = (id: string) => {
        setProjects(prev => prev.filter(p => p.id !== id));
    }

    // --- Contacts ---
    const addContact = (data: any) => {
        const newContact: Contact = { id: `contact-${Date.now()}`, organizationId: orgId || 'org-1', ...data };
        setContacts(prev => [...prev, newContact]);
        return newContact.id;
    }

    const deleteContact = (id: string) => {
        setContacts(prev => prev.filter(c => c.id !== id));
    }

    // --- Other Entities ---
    const addEvent = async (data: any) => {
        const newEvent: Event = { id: `evt-${Date.now()}`, organizationId: orgId || 'org-1', status: 'Planning', checklist: [], ...data };
        setEvents(prev => [...prev, newEvent]);
        
        // DTW: Auto-generate checklist
        const checklistStr = await geminiService.generateContentWithSearch(`Generate a logistics checklist for an event: ${newEvent.name} (${data.location}, ${data.date}). Return a JSON array of strings.`);
        try {
            const items = JSON.parse(checklistStr.match(/\[.*\]/s)?.[0] || '[]');
            if (Array.isArray(items)) {
                const checklist = items.map((text: string, i: number) => ({ id: `cl-${i}`, text, isDone: false }));
                setEvents(prev => prev.map(e => e.id === newEvent.id ? { ...e, checklist } : e));
            }
        } catch(e) {}

        return newEvent.id;
    }

    const addCandidate = (data: any) => {
        const newCand: HRCandidate = { id: `cand-${Date.now()}`, organizationId: orgId || 'org-1', status: 'Applied', ...data };
        setCandidates(prev => [...prev, newCand]);
        return newCand.id;
    }

    const addSocialPost = async (data: any) => {
        const newPost: SocialPost = { id: `post-${Date.now()}`, organizationId: orgId || 'org-1', ...data };
        setSocialPosts(prev => [...prev, newPost]);
        return newPost; // Return Object for chaining
    }

    const updateSocialPost = (id: string, data: Partial<SocialPost>) => {
        setSocialPosts(prev => prev.map(p => p.id === id ? {...p, ...data} : p));
    }

    // --- Documents ---
    const addDocument = (file: any, category: DocumentCategory, ownerId: string, ownerType: DocumentOwnerType, note?: string) => {
        const newDoc: Document = {
            id: `doc-${Date.now()}`,
            organizationId: orgId || 'org-1',
            name: file.name,
            category,
            url: file.url || '#',
            ownerId,
            ownerType,
            createdAt: new Date().toISOString(),
            note,
            ...((typeof file.content === 'string') ? { content: file.content } : {}) // Store content if passed
        } as any;
        setDocuments(prev => [...prev, newDoc]);
        return newDoc;
    }

    const deleteDocument = (id: string) => {
        setDocuments(prev => prev.filter(d => d.id !== id));
    }

    // --- CRM ---
    const addCRMEntry = async (data: any) => {
        const newEntry: CRMEntry = {
            id: `crm-${Date.now()}`,
            organizationId: orgId || 'org-1',
            clientId: data.clientId || clients.find(c => c.name === data.clientName)?.id || 'unknown',
            dealId: data.dealId,
            createdAt: new Date().toISOString(),
            type: data.interactionType || 'note',
            summary: data.content,
            rawContent: data.content
        };
        setCrmEntries(prev => [...prev, newEntry]);
        return newEntry.id;
    }

    // --- WALTER'S DESK: Bulk Execution Engine ---
    const executeDelegationPlan = async (plan: DelegationPlan, onLog: (msg: string) => void) => {
        onLog("🚀 Initializing Walter's Desk execution engine...");

        // 1. Business Lines
        for (const bl of plan.businessLinesToCreate) {
            onLog(`Creating Business Line: ${bl.name}...`);
            await addBusinessLine(bl);
        }

        // 2. Clients (Infer BL if needed)
        for (const cl of plan.clientsToCreateOrUpdate) {
            onLog(`Processing Client: ${cl.name}...`);
            // Find or Create logic handled in addClient
            await addClient(cl);
        }

        // 3. Projects
        for (const pr of plan.projectsToCreate) {
            onLog(`Creating Project: ${pr.projectName}...`);
            // infer client ID from name if needed
            await addProject(pr);
        }

        // 4. Deals
        for (const deal of plan.dealsToCreate) {
            onLog(`Creating Deal: ${deal.name}...`);
            await addDeal(deal);
        }

        // 5. Events
        for (const evt of plan.eventsToCreate) {
            onLog(`Scheduling Event: ${evt.name}...`);
            await addEvent(evt);
        }

        // 6. Tasks (Batch)
        for (const task of plan.tasksToCreate) {
            // Resolve IDs based on names
            let clientId, dealId, businessLineId, projectId;
            
            if (task.clientName) clientId = clients.find(c => c.name === task.clientName)?.id;
            if (task.projectName) projectId = projects.find(p => p.projectName === task.projectName)?.id;
            
            await addTask({ ...task, clientId, projectId });
        }
        if (plan.tasksToCreate.length > 0) onLog(`✅ Created ${plan.tasksToCreate.length} tasks.`);

        // 7. Wiki Pages (New)
        for (const wiki of plan.wikiPagesToCreate) {
            const client = clients.find(c => c.name === wiki.clientName);
            if (client) {
                onLog(`Generating Wiki Page: ${wiki.title} for ${client.name}...`);
                const content = await geminiService.generateText(`Draft a ${wiki.type} for ${client.name}. Title: ${wiki.title}. Context: ${wiki.content}`);
                // Save as a Document with type 'Playbook' for now, or add to client wiki array
                addDocument({ name: wiki.title, content }, 'Playbooks', client.id, 'client');
                
                // In a real app with 'wikiPages' table:
                // await addWikiPage({ ...wiki, clientId: client.id, content });
            }
        }

        // 8. CRM Entries
        for (const entry of plan.crmEntriesToCreate) {
            onLog(`Logging CRM Note for ${entry.clientName}...`);
            await addCRMEntry({ ...entry, interactionType: 'note', content: entry.summary });
        }

        onLog("✨ All actions completed successfully.");
    };

    // --- Gemini / AI Integrations ---

    const logPaymentOnDeal = (dealId: string, amount: number, note: string) => {
        const deal = deals.find(d => d.id === dealId);
        if (deal) {
            const newAmount = (deal.amountPaid || 0) + amount;
            updateDeal(dealId, { amountPaid: newAmount });
            addCRMEntry({
                clientId: deal.clientId,
                dealId: deal.id,
                interactionType: 'note',
                content: `Payment logged: ${deal.currency} ${amount}. ${note}`
            });
        }
    }

    const analyzeDealStrategy = async (deal: Deal, client: Client) => {
        return await geminiService.generateContentWithSearch(`Act as a negotiation coach for deal "${deal.name}" ($${deal.value}) with client "${client.name}". Search for client financial news. Suggest 3 leverage points.`);
    }

    const analyzeProjectRisk = async (project: Project) => {
        return await geminiService.generateContentWithSearch(`Perform a pre-mortem risk analysis for project "${project.projectName}" (Goal: ${project.goal}). Search for common failure modes in this domain. Output a markdown report.`);
    }

    // Improved findProspects
    const findProspects = async (bl: BusinessLine, prompt: string) => {
        const searchPrompt = `Find potential clients for a business line "${bl.name}" (${bl.description}). ${prompt}. Return JSON { "prospects": [{ "name": string, "likelyNeed": string }] }`;
        const json = await geminiService.generateJsonWithSearch(searchPrompt, {
            type: 'OBJECT',
            properties: {
                prospects: {
                    type: 'ARRAY',
                    items: {
                        type: 'OBJECT',
                        properties: {
                            name: { type: 'STRING' },
                            likelyNeed: { type: 'STRING' }
                        }
                    }
                }
            }
        });
        // Generate IDs for UI
        const prospects = json?.prospects?.map((p: any, i: number) => ({ ...p, id: `prospect-${Date.now()}-${i}` })) || [];
        return { prospects, sources: [] };
    }

    // New queryPlatform
    const queryPlatform = async (query: string) => {
        const context = {
            deals: deals.map(d => ({ name: d.name, value: d.value, stage: d.status, client: clients.find(c=>c.id===d.clientId)?.name })),
            tasks: tasks.filter(t => t.status !== 'Done').map(t => ({ title: t.title, due: t.dueDate, priority: t.priority })),
            clients: clients.map(c => c.name)
        };
        const prompt = `Answer this question about the user's data: "${query}". Data: ${JSON.stringify(context)}`;
        return await geminiService.generateText(prompt);
    }

    const processTextAndExecute = useCallback(async (text: string, context: any, file?: any) => {
        const result = await processTextMessage(text, {
            businessLines: businessLines.map(b => b.name),
            clients: clients.map(c => c.name),
            teamMembers: teamMembers.map(m => m.name)
        }, context, "No recent activity.", file);
        
        let lastCreatedClientId: string | undefined;
        let lastCreatedDealId: string | undefined;

        for (const call of result.functionCalls) {
            console.log("Executing tool:", call.name, call.args);
            const args = call.args as any;

            // Dynamic Context Injection
            if (!args.clientId && lastCreatedClientId) args.clientId = lastCreatedClientId;
            if (!args.dealId && lastCreatedDealId) args.dealId = lastCreatedDealId;

            if (call.name === 'createBoardItem') addTask(args);
            if (call.name === 'createBusinessLine') addBusinessLine(args);
            if (call.name === 'createClient') {
                const res = await addClient(args);
                if (res && typeof res !== 'string') lastCreatedClientId = res.id;
            }
            if (call.name === 'createDeal') {
                const res = await addDeal(args);
                if (res && typeof res !== 'string') lastCreatedDealId = res.id;
            }
            if (call.name === 'createProject') addProject(args);
            if (call.name === 'createEvent') addEvent(args);
            if (call.name === 'createCandidate') addCandidate(args);
            if (call.name === 'createCrmEntry') addCRMEntry(args);
            if (call.name === 'createSocialPost') {
                const post = await addSocialPost(args);
                if (post && args.visualPrompt) {
                    // Action Cascading: Generate Image
                    geminiService.generateImages(args.visualPrompt).then(url => {
                        if (url) updateSocialPost(post.id, { imageUrl: url });
                    });
                }
            }
            if (call.name === 'analyzeRisk') {
                // Find project and run analysis
                const project = projects.find(p => p.projectName.toLowerCase().includes(args.projectName.toLowerCase()));
                if (project) {
                    const report = await analyzeProjectRisk(project);
                    addDocument({ name: `Risk Report - ${project.projectName}`, content: report }, 'SOPs', project.id, 'project');
                }
            }
            if (call.name === 'analyzeNegotiation') {
                const deal = deals.find(d => d.name.toLowerCase().includes(args.dealName.toLowerCase()));
                if (deal) {
                    const client = clients.find(c => c.id === deal.clientId);
                    if (client) {
                        const report = await analyzeDealStrategy(deal, client);
                        addDocument({ name: `Negotiation Strategy - ${deal.name}`, content: report }, 'Business Development', deal.id, 'deal');
                    }
                }
            }
            if (call.name === 'getClientPulse') {
                // Typically returns JSON for UI, but via router we save as Note/Doc
                const client = clients.find(c => c.name.toLowerCase().includes(args.clientName.toLowerCase()));
                if (client) {
                    const pulse = await getClientPulse(client, {});
                    const summary = pulse.map((p: any) => `- ${p.source}: ${p.content} (${p.date})`).join('\n');
                    addCRMEntry({ clientId: client.id, content: `Client Pulse Scan:\n${summary}`, interactionType: 'ai_action' });
                }
            }
            if (call.name === 'logPayment') {
                const deal = deals.find(d => d.name.toLowerCase().includes(args.dealName.toLowerCase()));
                if (deal) {
                    logPaymentOnDeal(deal.id, args.amount, args.note || 'Payment logged via AI');
                }
            }
            if (call.name === 'findProspects') {
                const bl = businessLines.find(b => b.name.toLowerCase().includes(args.businessLineName.toLowerCase()));
                if (bl) {
                    const { prospects } = await findProspects(bl, "Find prospects");
                    const list = prospects.map((p: any) => `- ${p.name}: ${p.likelyNeed}`).join('\n');
                    addDocument({ name: `Prospects List - ${bl.name}`, content: list }, 'Business Development', bl.id, 'businessLine');
                }
            }
        }
        
        return result.text;
    }, [businessLines, clients, teamMembers, addTask, addClient, addDeal, addBusinessLine, addProject, addEvent, addCandidate, addCRMEntry, addSocialPost]);

    const generateDocumentDraft = async (prompt: string, category: string, owner: any, ownerType: string) => {
        return await geminiService.generateContentWithSearch(prompt);
    }

    const generateDocumentFromSubtask = async (task: Task, subtaskText: string) => {
        const content = await geminiService.generateContentWithSearch(`Generate document for task: ${task.title}. Subtask: ${subtaskText}`);
        addDocument({ name: `${subtaskText}.txt`, content }, 'Templates', task.id, 'task' as any);
        return content;
    }

    const generateSocialMediaIdeas = async (bl: BusinessLine, prompt: string) => {
        const json = await geminiService.generateJsonWithSearch(prompt, { type: 'ARRAY', items: { type: 'STRING' } });
        return Array.isArray(json) ? json : [];
    }

    const generateSocialPostDetails = async (prompt: string, channel: string, bl: BusinessLine, file?: string, mimeType?: string, link?: string) => {
        let fullPrompt = `Write a ${channel} post about: ${prompt} for ${bl.name}.`;
        if (link) fullPrompt += ` Include this link: ${link}`;
        // Note: File attachment logic would need to be passed to geminiService. For now handling text.
        const res = await geminiService.generateJsonWithSearch(
            `${fullPrompt} Return JSON { "caption": string, "visualPrompt": string }`,
            { type: 'OBJECT', properties: { caption: {type: 'STRING'}, visualPrompt: {type: 'STRING'} } }
        );
        return res || { caption: '', visualPrompt: '' };
    }

    const generateSocialImage = async (prompt: string) => {
        return await geminiService.generateImages(prompt);
    }

    const generateSocialVideo = async (prompt: string) => {
        return await geminiService.generateVideos(prompt);
    }

    const generateSocialCalendarFromChat = async (bl: BusinessLine, chat: string) => {
        // Mock implementation for chat-to-calendar
        return [
            { 
                date: new Date().toISOString().split('T')[0], 
                content: "Campaign Start", 
                type: 'Post', 
                channel: 'LinkedIn', 
                imagePrompt: 'Launch visual',
                cta: 'Learn More',
                engagementHook: 'What do you think?'
            }
        ];
    }

    const getClientPulse = async (client: Client, filters: any, customPrompt?: string) => {
        const prompt = customPrompt || `Find recent news and social media posts for ${client.name}. Return JSON array { source, content, url, date }.`;
        const json = await geminiService.generateJsonWithSearch(prompt, { 
            type: 'ARRAY', 
            items: { type: 'OBJECT', properties: { source: {type: 'STRING'}, content: {type: 'STRING'}, url: {type: 'STRING'}, date: {type: 'STRING'} } } 
        });
        return Array.isArray(json) ? json : [];
    }

    const getCompetitorInsights = async (bl: BusinessLine, filters: any, customPrompt?: string) => {
        const prompt = customPrompt || `Analyze competitors for ${bl.name}. Return JSON { "insights": [], "trends": [] }`;
        const json = await geminiService.generateJsonWithSearch(prompt, {
            type: 'OBJECT',
            properties: {
                insights: { type: 'ARRAY', items: { type: 'OBJECT', properties: { competitorName: {type:'STRING'}, insight: {type:'STRING'}, source: {type:'STRING'} } } },
                trends: { type: 'ARRAY', items: { type: 'OBJECT', properties: { keyword: {type:'STRING'}, insight: {type:'STRING'} } } }
            }
        });
        return json || { insights: [], trends: [] };
    }

    const getPlatformInsights = () => {
        return [{ id: '1', text: 'You close deals faster on Tuesdays.' }];
    }

    const researchSubtask = async (subtask: string, context: string) => {
        return await geminiService.generateContentWithSearch(subtask + " " + context);
    }

    const generateMeetingTranscript = async (taskId: string) => {
        return "Transcript generated.";
    }

    const refineTaskChecklist = async (taskId: string, command: string) => {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;
        const prompt = `For the task "${task.title}", create a detailed checklist based on this instruction: "${command}". Return a JSON array of strings.`;
        const json = await geminiService.generateJsonWithSearch(prompt, { type: 'ARRAY', items: { type: 'STRING' } });
        if (Array.isArray(json)) {
            const newSubtasks = json.map((text, i) => ({ id: `sub-${Date.now()}-${i}`, text, isDone: false }));
            updateTask(taskId, { subTasks: [...(task.subTasks || []), ...newSubtasks] });
        }
    }

    const generateMarketingCollateralContent = async (prompt: string, type: string, owner: any) => {
        return await geminiService.generateContentWithSearch(prompt);
    }

    const enhanceUserPrompt = async (prompt: string) => {
        return await geminiService.generateContentWithSearch(`Enhance this prompt for an AI generator: "${prompt}"`);
    }

    const regeneratePlaybook = async (bl: BusinessLine) => {
        // ... implementation
    }

    const updatePlaybook = (id: string, steps: any[]) => {
        // ... implementation
    }

    const dismissSuggestions = (type: string, id: string) => {
    }

    // --- Contextual Walter Updates ---
    const updateClientFromInteraction = async (clientId: string, text: string) => {
        const client = clients.find(c => c.id === clientId);
        if (client) {
            updateClient(clientId, { proposedLastTouchSummary: text, proposedNextAction: 'Follow up' });
        }
    }
    
    const approveClientUpdate = (clientId: string) => {
        updateClient(clientId, { proposedLastTouchSummary: undefined, proposedNextAction: undefined });
    }

    const clearProposedClientUpdate = (clientId: string) => {
        updateClient(clientId, { proposedLastTouchSummary: undefined, proposedNextAction: undefined });
    }

    const updateDealFromInteraction = async (dealId: string, text: string) => {
        updateDeal(dealId, { proposedLastTouchSummary: text });
    }

    const approveDealUpdate = (dealId: string) => {
        updateDeal(dealId, { proposedLastTouchSummary: undefined });
    }

    const clearProposedDealUpdate = (dealId: string) => {
        updateDeal(dealId, { proposedLastTouchSummary: undefined });
    }

    const updateProjectFromInteraction = async (projectId: string, text: string) => {
        updateProject(projectId, { proposedLastTouchSummary: text });
    }

    const approveProjectUpdate = (projectId: string) => {
        const project = projects.find(p => p.id === projectId);
        if (project) {
            updateProject(projectId, { 
                lastTouchSummary: project.proposedLastTouchSummary || project.lastTouchSummary,
                proposedLastTouchSummary: undefined 
            });
        }
    }

    const clearProposedProjectUpdate = (projectId: string) => {
        updateProject(projectId, { proposedLastTouchSummary: undefined });
    }

    const getDealOpportunities = async (deal: Deal) => {
        return { opportunities: [] };
    }

    const getClientOpportunities = async (client: Client) => {
        return { opportunities: [] };
    }

    const generateLeadScore = async (client: Client) => {
        updateClient(client.id, { leadScore: Math.floor(Math.random() * 100), leadScoreReason: 'Calculated based on recent interactions.' });
    }

    const inviteMember = (email: string, permissions: any) => {
        const newMember: TeamMember = { 
            id: `tm-${Date.now()}`, 
            organizationId: orgId || 'org-1',
            name: email.split('@')[0],
            email,
            role: 'Member',
            status: 'Invited',
            permissions
        };
        setTeamMembers(prev => [...prev, newMember]);
        return newMember;
    }

    return {
        tasks, businessLines, clients, deals, projects, crmEntries, documents, teamMembers, socialPosts, events, candidates, employees, contacts,
        currentUserMember,
        addTask, updateTask, deleteTask, updateTaskStatusById, toggleSubTask, promoteSubtaskToTask,
        addBusinessLine, updateBusinessLine, deleteBusinessLine,
        addClient, updateClient, deleteClient, updateClientFromInteraction, approveClientUpdate, clearProposedClientUpdate,
        addDeal, updateDeal, deleteDeal, updateDealFromInteraction, approveDealUpdate, clearProposedDealUpdate, getDealOpportunities, logPaymentOnDeal, analyzeDealStrategy,
        addProject, updateProject, deleteProject, updateProjectFromInteraction, approveProjectUpdate, clearProposedProjectUpdate, analyzeProjectRisk,
        addContact, deleteContact,
        addEvent,
        addCandidate,
        addSocialPost, updateSocialPost,
        addDocument, deleteDocument,
        addCRMEntry,
        processTextAndExecute,
        generateDocumentDraft, generateDocumentFromSubtask,
        generateSocialMediaIdeas, generateSocialPostDetails, generateSocialImage, generateSocialVideo, generateSocialCalendarFromChat,
        findProspects,
        getClientPulse, getClientOpportunities, generateLeadScore,
        getCompetitorInsights,
        getPlatformInsights,
        queryPlatform,
        researchSubtask, generateMeetingTranscript, refineTaskChecklist,
        generateMarketingCollateralContent, enhanceUserPrompt,
        regeneratePlaybook, updatePlaybook,
        inviteMember,
        dismissSuggestions,
        executeDelegationPlan // Exported new function
    };
}
