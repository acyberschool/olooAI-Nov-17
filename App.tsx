
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TasksView from './components/TasksView';
import BusinessLinesView from './components/BusinessLinesView';
import ClientsView from './components/ClientsView';
import DealsView from './components/DealsView';
import ProjectsView from './components/ProjectsView';
import SalesView from './components/SalesView';
import EventsView from './components/EventsView';
import HRView from './components/HRView';
import TeamView from './components/TeamView';
import SettingsView from './components/SettingsView';
import AuthPage from './pages/AuthPage';
import { supabase } from './supabaseClient';
import { useKanban } from './hooks/useKanban';
import { useVoiceAssistant } from './hooks/useVoiceAssistant';
import UniversalInputModal from './components/UniversalInputModal';
import VoiceControl from './components/VoiceControl';
import ChatInterface from './components/ChatInterface';
import BusinessLineDetailView from './components/BusinessLineDetailView';
import ClientDetailView from './components/ClientDetailView';
import DealDetailView from './components/DealDetailView';
import ProjectDetailView from './components/ProjectDetailView';
import AdminDashboard from './components/AdminDashboard';
import SocialMediaTab from './components/SocialMediaTab';
import { Task, BusinessLine, Client, Deal, Project, UniversalInputContext } from './types';

export type View = 'today' | 'allTasks' | 'businessLines' | 'deals' | 'clients' | 'projects' | 'social' | 'sales' | 'events' | 'hr' | 'access' | 'settings' | 'admin' | 'businessLineDetail' | 'clientDetail' | 'dealDetail' | 'projectDetail';

function App() {
  const [session, setSession] = useState<any>(null);
  const [activeView, setActiveView] = useState<View>('today');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Detailed view states
  const [selectedBusinessLineId, setSelectedBusinessLineId] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Universal Input State
  const [isUniversalInputOpen, setIsUniversalInputOpen] = useState(false);
  const [universalInputContext, setUniversalInputContext] = useState<UniversalInputContext>({});

  const kanbanApi = useKanban();

  // Voice Assistant
  const {
    isConnecting, isRecording, isSpeaking, isThinking,
    userTranscript, assistantTranscript, error: voiceError,
    startRecording, stopRecording
  } = useVoiceAssistant({
    onBoardItemCreate: (item) => kanbanApi.addTask(item as any), 
    onCrmEntryCreate: (data) => kanbanApi.addCRMEntry(data),
    onTaskUpdate: (title, status) => Promise.resolve("Updated"),
    onBusinessLineCreate: async (data) => { const res = await kanbanApi.addBusinessLine(data); return typeof res === 'string' ? res : `Business Line ${res.name} created.`; },
    onClientCreate: async (data) => { const c = await kanbanApi.addClient(data); return typeof c === 'string' ? c : "Client created."; },
    onDealCreate: async (data) => { const d = await kanbanApi.addDeal(data); return typeof d === 'string' ? d : "Deal created."; },
    onProjectCreate: async (data) => { const p = await kanbanApi.addProject(data); return typeof p === 'string' ? p : "Project created."; },
    onEventCreate: async (data) => { await kanbanApi.addEvent(data); return "Event created"; },
    onCandidateCreate: async (data) => { await kanbanApi.addCandidate(data); return "Candidate created"; },
    onSocialPostCreate: async (data) => { await kanbanApi.addSocialPost(data); return "Social post created"; },
    onDealStatusUpdate: (id, status) => { kanbanApi.updateDeal(id, {status}); return Promise.resolve("Updated"); },
    onFindProspects: async (data) => { 
        const bl = kanbanApi.businessLines.find(b => b.name.toLowerCase().includes(data.businessLineName.toLowerCase()));
        if (!bl) return "Business Line not found.";
        const { prospects } = await kanbanApi.findProspects(bl, "Find prospects");
        return `Found ${prospects.length} prospects.`;
    },
    onPlatformQuery: async (query) => {
        return await kanbanApi.queryPlatform(query);
    },
    onAnalyzeRisk: async (data) => {
        const project = kanbanApi.projects.find(p => p.projectName.toLowerCase().includes(data.projectName.toLowerCase()));
        if (!project) return "Project not found.";
        const report = await kanbanApi.analyzeProjectRisk(project);
        await kanbanApi.addDocument({ name: `Risk Report - ${project.projectName}`, content: report }, 'SOPs', project.id, 'project');
        return "Risk analysis generated and saved to documents.";
    },
    onAnalyzeNegotiation: async (data) => {
        const deal = kanbanApi.deals.find(d => d.name.toLowerCase().includes(data.dealName.toLowerCase()));
        if (!deal) return "Deal not found.";
        const client = kanbanApi.clients.find(c => c.id === deal.clientId);
        if (!client) return "Client not found.";
        const report = await kanbanApi.analyzeDealStrategy(deal, client);
        await kanbanApi.addDocument({ name: `Negotiation Strategy - ${deal.name}`, content: report }, 'Business Development', deal.id, 'deal');
        return "Negotiation strategy generated and saved.";
    },
    onGetClientPulse: async (data) => {
        const client = kanbanApi.clients.find(c => c.name.toLowerCase().includes(data.clientName.toLowerCase()));
        if (!client) return "Client not found.";
        await kanbanApi.getClientPulse(client, {});
        return "Client pulse updated.";
    },
    onGetCompetitorInsights: async (data) => {
        const bl = kanbanApi.businessLines.find(b => b.name.toLowerCase().includes(data.businessLineName.toLowerCase()));
        if (!bl) return "Business Line not found.";
        await kanbanApi.getCompetitorInsights(bl, {});
        return "Competitor insights updated.";
    },
    onGenerateSocialImage: async (data) => {
        return await kanbanApi.generateSocialImage(data.prompt) || "Image generation failed";
    },
    onGenerateSocialVideo: async (data) => {
        return await kanbanApi.generateSocialVideo(data.prompt) || "Video generation failed";
    },
    onGenerateDocument: async (data) => {
        // Attempt to infer owner. This is a heuristic.
        // In a real app, Voice Assistant state should track 'current view'.
        // We use `any` here to allow assignment of different types (BusinessLine, Client) without TS errors in this quick block
        let owner: any = kanbanApi.businessLines[0]; 
        let ownerType = 'businessLine';
        if (kanbanApi.clients.length > 0) { owner = kanbanApi.clients[0]; ownerType = 'client'; }
        
        if (!owner) return "No valid owner found for document generation.";

        const content = await kanbanApi.generateDocumentDraft(data.prompt, data.category, owner, ownerType as any);
        await kanbanApi.addDocument({ name: `Draft - ${data.category}`, content }, data.category as any, owner.id, ownerType as any);
        return "Document drafted and saved.";
    },
    systemContext: {
        clients: kanbanApi.clients.map(c => c.name),
        deals: kanbanApi.deals.map(d => d.name),
        businessLines: kanbanApi.businessLines.map(b => b.name),
        projects: kanbanApi.projects.map(p => p.projectName)
    }
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSelectBusinessLine = (id: string) => {
      setSelectedBusinessLineId(id);
      setActiveView('businessLineDetail');
  };

  const handleSelectClient = (id: string) => {
      setSelectedClientId(id);
      setActiveView('clientDetail');
  };

  const handleSelectDeal = (id: string) => {
      setSelectedDealId(id);
      setActiveView('dealDetail');
  };

  const handleSelectProject = (id: string) => {
      setSelectedProjectId(id);
      setActiveView('projectDetail');
  };

  const handleOpenUniversalInput = (context: UniversalInputContext = {}) => {
      setUniversalInputContext(context);
      setIsUniversalInputOpen(true);
  };

  const handleUniversalSave = async (text: string, file?: any) => {
      await kanbanApi.processTextAndExecute(text, universalInputContext, file);
  };

  if (!session) {
    return <AuthPage />;
  }

  const renderContent = () => {
      switch (activeView) {
          case 'today':
          case 'allTasks':
              return <TasksView 
                  initialTab={activeView === 'today' ? 'Today' : 'All tasks'}
                  tasks={kanbanApi.tasks} 
                  businessLines={kanbanApi.businessLines}
                  clients={kanbanApi.clients}
                  deals={kanbanApi.deals}
                  projects={kanbanApi.projects}
                  updateTaskStatus={kanbanApi.updateTaskStatusById}
                  onSelectBusinessLine={handleSelectBusinessLine}
                  onSelectClient={handleSelectClient}
                  onSelectDeal={handleSelectDeal}
                  onSelectProject={handleSelectProject}
                  onSelectTask={setSelectedTask}
                  onOpenUniversalInput={handleOpenUniversalInput}
                  kanbanApi={kanbanApi}
              />;
          case 'businessLines':
              return <BusinessLinesView 
                  businessLines={kanbanApi.businessLines}
                  onSelectBusinessLine={handleSelectBusinessLine}
                  onOpenUniversalInput={handleOpenUniversalInput}
                  onUpdateBusinessLine={kanbanApi.updateBusinessLine}
              />;
          case 'clients':
              return <ClientsView 
                  clients={kanbanApi.clients}
                  businessLines={kanbanApi.businessLines}
                  onSelectClient={handleSelectClient}
                  onOpenUniversalInput={handleOpenUniversalInput}
                  onUpdateClient={kanbanApi.updateClient}
                  kanbanApi={kanbanApi}
              />;
          case 'deals':
              return <DealsView 
                  deals={kanbanApi.deals}
                  clients={kanbanApi.clients}
                  businessLines={kanbanApi.businessLines}
                  onSelectDeal={handleSelectDeal}
                  onOpenUniversalInput={handleOpenUniversalInput}
                  onUpdateDeal={kanbanApi.updateDeal}
              />;
          case 'projects':
              return <ProjectsView 
                  projects={kanbanApi.projects}
                  clients={kanbanApi.clients}
                  onSelectProject={handleSelectProject}
                  onOpenUniversalInput={handleOpenUniversalInput}
              />;
          case 'social':
              if (kanbanApi.businessLines.length > 0) {
                  return <SocialMediaTab businessLine={kanbanApi.businessLines[0]} kanbanApi={kanbanApi} />;
              }
              return <div className="p-8 text-center text-gray-500">Please create a business line first to manage social media.</div>;
          case 'sales':
              return <SalesView 
                  deals={kanbanApi.deals}
                  clients={kanbanApi.clients}
                  onSelectDeal={handleSelectDeal}
                  onOpenUniversalInput={handleOpenUniversalInput}
              />;
          case 'events':
              return <EventsView events={kanbanApi.events} kanbanApi={kanbanApi} />;
          case 'hr':
              return <HRView candidates={kanbanApi.candidates} employees={kanbanApi.employees} kanbanApi={kanbanApi} />;
          case 'access':
              return <TeamView />;
          case 'settings':
              return <SettingsView kanbanApi={kanbanApi} />;
          case 'admin':
              return <AdminDashboard />;
          case 'businessLineDetail':
              if (!selectedBusinessLineId) return <div>No business line selected</div>;
              const bl = kanbanApi.businessLines.find(b => b.id === selectedBusinessLineId);
              if (!bl) return <div>Business Line not found</div>;
              return <BusinessLineDetailView 
                  businessLine={bl}
                  tasks={kanbanApi.tasks.filter(t => t.businessLineId === bl.id)}
                  clients={kanbanApi.clients.filter(c => c.businessLineId === bl.id)}
                  deals={kanbanApi.deals.filter(d => d.businessLineId === bl.id)}
                  documents={kanbanApi.documents.filter(d => d.ownerId === bl.id)}
                  onBack={() => setActiveView('businessLines')}
                  kanbanApi={kanbanApi}
                  onSelectClient={handleSelectClient}
                  onSelectDeal={handleSelectDeal}
                  onSelectTask={setSelectedTask}
              />;
          case 'clientDetail':
              if (!selectedClientId) return <div>No client selected</div>;
              const cl = kanbanApi.clients.find(c => c.id === selectedClientId);
              if (!cl) return <div>Client not found</div>;
              return <ClientDetailView 
                  client={cl}
                  businessLines={kanbanApi.businessLines}
                  tasks={kanbanApi.tasks.filter(t => t.clientId === cl.id)}
                  deals={kanbanApi.deals.filter(d => d.clientId === cl.id)}
                  projects={kanbanApi.projects.filter(p => p.clientId === cl.id)}
                  documents={kanbanApi.documents.filter(d => d.ownerId === cl.id)}
                  crmEntries={kanbanApi.crmEntries.filter(e => e.clientId === cl.id)}
                  onBack={() => setActiveView('clients')}
                  kanbanApi={kanbanApi}
                  onSelectBusinessLine={handleSelectBusinessLine}
                  onSelectDeal={handleSelectDeal}
                  onSelectProject={handleSelectProject}
                  onSelectTask={setSelectedTask}
                  onOpenUniversalInput={handleOpenUniversalInput}
              />;
          case 'dealDetail':
              if (!selectedDealId) return <div>No deal selected</div>;
              const dl = kanbanApi.deals.find(d => d.id === selectedDealId);
              if (!dl) return <div>Deal not found</div>;
              const dlClient = kanbanApi.clients.find(c => c.id === dl.clientId);
              const dlBl = kanbanApi.businessLines.find(b => b.id === dl.businessLineId);
              if (!dlClient || !dlBl) return <div>Data inconsistency for deal</div>;
              return <DealDetailView 
                  deal={dl}
                  client={dlClient}
                  businessLine={dlBl}
                  tasks={kanbanApi.tasks.filter(t => t.dealId === dl.id)}
                  documents={kanbanApi.documents.filter(d => d.ownerId === dl.id)}
                  kanbanApi={kanbanApi}
                  onSelectClient={handleSelectClient}
                  onSelectBusinessLine={handleSelectBusinessLine}
                  onBack={() => setActiveView('deals')}
                  onSelectTask={setSelectedTask}
                  clients={kanbanApi.clients}
              />;
          case 'projectDetail':
              if (!selectedProjectId) return <div>No project selected</div>;
              const pr = kanbanApi.projects.find(p => p.id === selectedProjectId);
              if (!pr) return <div>Project not found</div>;
              const prClient = kanbanApi.clients.find(c => c.id === pr.clientId);
              const prBl = prClient ? kanbanApi.businessLines.find(b => b.id === prClient.businessLineId) : undefined;
              return <ProjectDetailView 
                  project={pr}
                  client={prClient || { name: 'Unknown' } as Client}
                  businessLine={prBl}
                  tasks={kanbanApi.tasks.filter(t => t.projectId === pr.id)}
                  kanbanApi={kanbanApi}
                  onSelectClient={handleSelectClient}
                  onBack={() => setActiveView('projects')}
                  onSelectTask={setSelectedTask}
              />;
          default:
              return <div>Page not found</div>;
      }
  };

  return (
    <div className="flex h-screen bg-brevo-light-gray">
      <Sidebar 
        activeView={activeView} 
        setActiveView={setActiveView} 
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        isSuperAdmin={true} 
      />
      
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-64 relative">
        <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-brevo-border">
            <div className="flex items-center">
                <button onClick={() => setIsSidebarOpen(true)} className="mr-3 text-gray-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                </button>
                <span className="font-bold text-lg text-brevo-text-primary">olooAI</span>
            </div>
        </div>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8 relative max-w-7xl mx-auto w-full">
            {renderContent()}
        </main>

        <div className="absolute bottom-6 right-6 z-30 flex flex-col items-end space-y-4">
            {isSpeaking && (
                <div className="bg-[#111827]/90 text-white text-sm px-6 py-3 rounded-2xl backdrop-blur-sm shadow-floating animate-fade-in-up max-w-xs">
                    {assistantTranscript}
                </div>
            )}
            <VoiceControl 
                isConnecting={isConnecting}
                isRecording={isRecording}
                startRecording={startRecording}
                stopRecording={stopRecording}
            />
        </div>

        <UniversalInputModal 
            isOpen={isUniversalInputOpen} 
            onClose={() => setIsUniversalInputOpen(false)}
            onSave={handleUniversalSave}
            context={universalInputContext}
        />
        
        <ChatInterface 
            isVisible={isRecording || isSpeaking || isThinking}
            onClose={() => {}}
            liveUserTranscript={userTranscript}
            liveAssistantTranscript={assistantTranscript}
            lastUserTranscript=""
            lastAssistantTranscript=""
            isThinking={isThinking}
            isSpeaking={isSpeaking}
            error={voiceError}
        />
      </div>
    </div>
  );
}

export default App;
