
import React, { useState, useEffect } from 'react';
import VoiceControl from './components/VoiceControl';
import ChatInterface from './components/ChatInterface';
import { useKanban } from './hooks/useKanban';
import Sidebar from './components/Sidebar';
import BusinessLinesView from './components/BusinessLinesView';
import ClientsView from './components/ClientsView';
import DealsView from './components/DealsView';
import SalesView from './components/SalesView';
import EventsView from './components/EventsView';
import HRView from './components/HRView';
import BusinessLineDetailView from './components/BusinessLineDetailView';
import ClientDetailView from './components/ClientDetailView';
import DealDetailView from './components/DealDetailView';
import CRMView from './components/CRMView';
import TasksView from './components/TasksView';
import TaskDetailModal from './components/TaskDetailModal';
import { useVoiceAssistant } from './hooks/useVoiceAssistant';
import { Task, UniversalInputContext } from './types';
import TeamView from './components/TeamView';
import UniversalInputModal from './components/UniversalInputModal';
import DataInsightsView from './components/DataInsightsView';
import SettingsView from './components/SettingsView';
import { getApiKey } from './config/geminiConfig';
import Walkthrough from './components/Walkthrough';
import ProjectsView from './components/ProjectsView';
import ProjectDetailView from './components/ProjectDetailView';
import LandingPage from './components/LandingPage'; 
import AuthPage from './pages/AuthPage'; 
import AdminDashboard from './components/AdminDashboard'; 
import { supabase } from './supabaseClient';
import SocialMediaTab from './components/SocialMediaTab';

let isApiKeyAvailable = true;
try {
  getApiKey();
} catch (e) {
  isApiKeyAvailable = false;
}

declare global {
    interface Window {
        gtag: (...args: any[]) => void;
    }
}
export const trackEvent = (action: string, category: string, label: string, value?: number) => {
    if (window.gtag) {
        window.gtag('event', action, { 'event_category': category, 'event_label': label, 'value': value });
    }
}

export type View = 'homepage' | 'businessLines' | 'clients' | 'deals' | 'sales' | 'events' | 'hr' | 'projects' | 'crm' | 'team' | 'data' | 'settings' | 'admin' | 'social';

const MenuIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
);

const ApiKeyMissingError = () => (
    <div className="flex items-center justify-center min-h-screen bg-red-50 text-red-800 p-4 font-sans">
        <div className="max-w-2xl text-center bg-white p-8 rounded-xl shadow-2xl border border-red-200">
            <h1 className="text-3xl font-bold mb-4 text-red-900">Configuration Error</h1>
            <p className="text-lg mb-2 text-red-700">
                The application cannot start because the <strong>API_KEY</strong> is missing.
            </p>
        </div>
    </div>
);

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [showAuthPage, setShowAuthPage] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoadingAuth(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const isSuperAdmin = session?.user?.email === 'acyberorg@gmail.com';

  if (!isApiKeyAvailable) {
    return <ApiKeyMissingError />;
  }

  const [activeView, setActiveView] = useState<View>('homepage');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedBusinessLineId, setSelectedBusinessLineId] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [initialDetailTab, setInitialDetailTab] = useState<string | undefined>(undefined);
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [lastInteraction, setLastInteraction] = useState({ user: '', assistant: '' });
  const [isUniversalInputOpen, setIsUniversalInputOpen] = useState(false);
  const [universalInputContext, setUniversalInputContext] = useState<UniversalInputContext>({});
  const [showWalkthrough, setShowWalkthrough] = useState(false);

  const kanban = useKanban();

  useEffect(() => {
    if (session) {
        const hasSeenWalkthrough = localStorage.getItem('walkthroughCompleted');
        if (!hasSeenWalkthrough) {
        setShowWalkthrough(true);
        }
    }
  }, [session]);

  const handleWalkthroughComplete = () => {
    localStorage.setItem('walkthroughCompleted', 'true');
    setShowWalkthrough(false);
  };

  const handleTurnComplete = (user: string, assistant: string) => {
    if (user || assistant) {
      setLastInteraction({ user, assistant });
      setIsChatVisible(true);
    }
  };

  useEffect(() => {
      if (selectedTask) {
          const updatedTaskInList = kanban.tasks.find(t => t.id === selectedTask.id);
          if (updatedTaskInList) {
              if (JSON.stringify(selectedTask) !== JSON.stringify(updatedTaskInList)) {
                  setSelectedTask(updatedTaskInList);
              }
          } else {
              setSelectedTask(null);
          }
      }
  }, [kanban.tasks, selectedTask]);

  const platformActivitySummary = `Last 3 tasks: ${kanban.tasks.slice(0,3).map(t => t.title).join(', ')}.`;

  const assistant = useVoiceAssistant({
    onBoardItemCreate: kanban.addTask,
    onCrmEntryCreate: kanban.addCRMEntryFromVoice,
    onTaskUpdate: kanban.updateTaskStatusByTitle,
    onBusinessLineCreate: kanban.addBusinessLine,
    onClientCreate: kanban.addClient,
    onDealCreate: kanban.addDeal,
    onProjectCreate: kanban.addProject,
    onEventCreate: (data) => { kanban.addEvent(data); return "Event created."; },
    onCandidateCreate: (data) => { kanban.addCandidate(data); return "Candidate added."; },
    onDealStatusUpdate: (dealId, status) => kanban.updateDeal(dealId, { status }),
    onTurnComplete: handleTurnComplete,
    onFindProspects: kanban.findProspectsByName,
    onPlatformQuery: kanban.getPlatformQueryResponse,
    // Deep Intelligence Wiring
    onAnalyzeRisk: async ({ projectName }) => {
        const proj = kanban.projects.find(p => p.projectName.toLowerCase().includes(projectName.toLowerCase()));
        if(proj) {
            const res = await kanban.analyzeProjectRisk(proj);
            return res;
        }
        return "Project not found.";
    },
    onAnalyzeNegotiation: async ({ dealName }) => {
        const deal = kanban.deals.find(d => d.name.toLowerCase().includes(dealName.toLowerCase()));
        if(deal) {
            const client = kanban.clients.find(c => c.id === deal.clientId);
            if(client) {
                const res = await kanban.analyzeDealStrategy(deal, client);
                return res;
            }
        }
        return "Deal or Client not found.";
    },
    onGetClientPulse: async ({ clientName }) => {
        const client = kanban.clients.find(c => c.name.toLowerCase().includes(clientName.toLowerCase()));
        if(client) {
            const res = await kanban.getClientPulse(client, { timeframe: 'last_month', location: 'any', scope: 'all', customQuery: '' });
            return `Found ${res.length} recent updates. Check the client view.`;
        }
        return "Client not found.";
    },
    currentBusinessLineId: selectedBusinessLineId,
    currentClientId: selectedClientId,
    currentDealId: selectedDealId,
    platformActivitySummary,
  });

  const clearSelections = () => {
    setSelectedBusinessLineId(null);
    setSelectedClientId(null);
    setSelectedDealId(null);
    setSelectedProjectId(null);
    setSelectedTask(null);
    setInitialDetailTab(undefined);
  }

  const handleSetView = (view: View) => {
    trackEvent('navigate', 'View', view);
    clearSelections();
    setActiveView(view);
    setIsSidebarOpen(false);
  }

  const handleSelectBusinessLine = (id: string, tab?: string) => {
    trackEvent('select', 'BusinessLine', id);
    clearSelections();
    setActiveView('businessLines');
    setSelectedBusinessLineId(id);
    if (tab) setInitialDetailTab(tab);
  };

  const handleSelectClient = (id: string) => {
    trackEvent('select', 'Client', id);
    clearSelections();
    setActiveView('clients');
    setSelectedClientId(id);
  };
  
  const handleSelectDeal = (id: string) => {
    trackEvent('select', 'Deal', id);
    clearSelections();
    setActiveView('deals');
    setSelectedDealId(id);
  }

  const handleSelectProject = (id: string) => {
    trackEvent('select', 'Project', id);
    clearSelections();
    setActiveView('projects');
    setSelectedProjectId(id);
  }

  const handleSelectTask = (task: Task) => {
    setSelectedTask(task);
  }

  const handleStartRecording = () => {
    setIsChatVisible(true);
    assistant.startRecording();
  };

  const handleOpenUniversalInput = (context: UniversalInputContext) => {
    setUniversalInputContext(context);
    setIsUniversalInputOpen(true);
  };

  if (loadingAuth) {
      return <div className="flex h-screen items-center justify-center bg-[#FDFCF8] text-gray-500">
          <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
              <p>Loading Workspace...</p>
          </div>
      </div>;
  }

  if (!session) {
      if (showAuthPage) {
          return <AuthPage />;
      }
      return <LandingPage onGetStarted={() => setShowAuthPage(true)} />;
  }

  const renderView = () => {
    // Detail Views
    if (selectedProjectId) {
        const project = kanban.projects.find(p => p.id === selectedProjectId);
        if (project) {
            const client = kanban.clients.find(c => c.id === project.clientId);
            const businessLine = client ? kanban.businessLines.find(bl => bl.id === client.businessLineId) : undefined;
            return <ProjectDetailView project={project} client={client!} businessLine={businessLine} tasks={kanban.tasks.filter(t => t.projectId === selectedProjectId)} kanbanApi={kanban} onSelectClient={handleSelectClient} onSelectTask={handleSelectTask} onBack={() => handleSetView('projects')} />
        }
    }
    if (selectedDealId) {
        const deal = kanban.deals.find(d => d.id === selectedDealId);
        if (deal) {
            return <DealDetailView deal={deal} client={kanban.clients.find(c => c.id === deal.clientId)!} businessLine={kanban.businessLines.find(bl => bl.id === deal.businessLineId)!} tasks={kanban.tasks.filter(t => t.dealId === selectedDealId)} documents={kanban.documents.filter(doc => doc.ownerId === selectedDealId && doc.ownerType === 'deal')} kanbanApi={kanban} onSelectClient={handleSelectClient} onSelectBusinessLine={handleSelectBusinessLine} onSelectTask={handleSelectTask} clients={kanban.clients} onBack={() => { const client = kanban.clients.find(c => c.id === deal.clientId); if (client) handleSelectClient(client.id); else handleSetView('deals'); }} />
        }
    }
    if (selectedClientId) {
        const client = kanban.clients.find(c => c.id === selectedClientId);
        if (client) {
            return <ClientDetailView client={client} businessLines={kanban.businessLines} tasks={kanban.tasks.filter(t => t.clientId === selectedClientId)} deals={kanban.deals.filter(d => d.clientId === selectedClientId)} projects={kanban.projects.filter(p => p.clientId === selectedClientId)} documents={kanban.documents.filter(doc => doc.ownerId === selectedClientId && doc.ownerType === 'client' || kanban.crmEntries.filter(c => c.clientId === client.id).map(c=>c.documentId).includes(doc.id))} crmEntries={kanban.crmEntries.filter(c => c.clientId === selectedClientId)} kanbanApi={kanban} onSelectBusinessLine={handleSelectBusinessLine} onSelectDeal={handleSelectDeal} onSelectProject={handleSelectProject} onSelectTask={handleSelectTask} onBack={() => handleSetView('clients')} onOpenUniversalInput={handleOpenUniversalInput} />
        }
    }
    if (selectedBusinessLineId) {
        const businessLine = kanban.businessLines.find(bl => bl.id === selectedBusinessLineId);
        const playbook = kanban.playbooks.find(p => p.businessLineId === selectedBusinessLineId);
        if (businessLine) {
            return <BusinessLineDetailView businessLine={businessLine} playbook={playbook} tasks={kanban.tasks.filter(t => t.businessLineId === selectedBusinessLineId)} clients={kanban.clients.filter(c => c.businessLineId === selectedBusinessLineId)} deals={kanban.deals.filter(d => d.businessLineId === selectedBusinessLineId)} documents={kanban.documents.filter(doc => doc.ownerId === selectedBusinessLineId && doc.ownerType === 'businessLine')} kanbanApi={kanban} onSelectClient={handleSelectClient} onSelectDeal={handleSelectDeal} onSelectTask={handleSelectTask} onBack={() => handleSetView('businessLines')} initialTab={initialDetailTab} />;
        }
    }
    
    const defaultBusinessLine = kanban.businessLines[0];

    // Main Views
    switch (activeView) {
      case 'settings': return <SettingsView kanbanApi={kanban} />;
      case 'data': return <DataInsightsView kanbanApi={kanban} />;
      case 'team': return <TeamView />;
      case 'crm': return <CRMView clients={kanban.clients} crmEntries={kanban.crmEntries} tasks={kanban.tasks} businessLines={kanban.businessLines} onSelectClient={handleSelectClient} />;
      case 'businessLines': return <BusinessLinesView businessLines={kanban.businessLines} onSelectBusinessLine={handleSelectBusinessLine} onOpenUniversalInput={handleOpenUniversalInput} onUpdateBusinessLine={kanban.updateBusinessLine} />;
      case 'clients': return <ClientsView clients={kanban.clients} businessLines={kanban.businessLines} onSelectClient={handleSelectClient} onOpenUniversalInput={handleOpenUniversalInput} onUpdateClient={kanban.updateClient} />;
      case 'deals': return <DealsView deals={kanban.deals} clients={kanban.clients} businessLines={kanban.businessLines} onSelectDeal={handleSelectDeal} onOpenUniversalInput={handleOpenUniversalInput} onUpdateDeal={kanban.updateDeal} />;
      case 'sales': return <SalesView deals={kanban.deals} clients={kanban.clients} onSelectDeal={handleSelectDeal} onOpenUniversalInput={handleOpenUniversalInput} />;
      case 'events': return <EventsView events={kanban.events} kanbanApi={kanban} />;
      case 'hr': return <HRView candidates={kanban.candidates} employees={kanban.employees} kanbanApi={kanban} />;
      case 'projects': return <ProjectsView projects={kanban.projects} clients={kanban.clients} onSelectProject={handleSelectProject} onOpenUniversalInput={handleOpenUniversalInput} />;
      case 'social': return defaultBusinessLine ? <SocialMediaTab businessLine={defaultBusinessLine} kanbanApi={kanban} /> : <div className="p-8 text-center text-gray-500">Create a Business Line to manage Social Media.</div>;
      case 'admin': return isSuperAdmin ? <AdminDashboard /> : <div className="p-8 text-center text-gray-500">Access Denied. Admin only.</div>;
      case 'homepage':
      default:
        return <TasksView tasks={kanban.tasks} businessLines={kanban.businessLines} clients={kanban.clients} deals={kanban.deals} projects={kanban.projects} updateTaskStatus={kanban.updateTaskStatusById} onSelectBusinessLine={handleSelectBusinessLine} onSelectClient={handleSelectClient} onSelectDeal={handleSelectDeal} onSelectProject={handleSelectProject} onSelectTask={handleSelectTask} onOpenUniversalInput={handleOpenUniversalInput} kanbanApi={kanban} />;
    }
  };

  return (
    <div className="min-h-screen font-sans flex flex-col lg:flex-row bg-brevo-light-gray">
      {showWalkthrough && <Walkthrough onComplete={handleWalkthroughComplete} />}
      <Sidebar activeView={activeView} setActiveView={handleSetView} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} isSuperAdmin={isSuperAdmin} permissions={kanban.currentUserMember?.permissions} />
      
      <div className="flex-1 flex flex-col">
        <header className="p-4 border-b border-brevo-border flex items-center justify-between z-10 bg-white/80 backdrop-blur-sm sticky top-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="lg:hidden text-brevo-text-secondary hover:text-brevo-text-primary">
              <MenuIcon />
            </button>
            <h1 className="text-xl font-bold text-brevo-cta">
                {kanban.organization ? kanban.organization.name : 'olooAI'}
            </h1>
          </div>
           <div className="flex items-center gap-4">
                <div className="hidden md:flex flex-col items-end">
                    <p className="text-sm font-semibold text-brevo-text-primary">
                        {session.user.user_metadata?.full_name || session.user.email.split('@')[0]}
                    </p>
                    <p className="text-xs text-brevo-text-secondary">
                        {kanban.currentUserMember?.role || 'Member'}
                    </p>
                </div>
                <button onClick={() => supabase.auth.signOut()} className="text-xs text-red-500 hover:underline border border-red-200 rounded px-2 py-1 hover:bg-red-50">Sign Out</button>
                <VoiceControl isConnecting={assistant.isConnecting} isRecording={assistant.isRecording} startRecording={handleStartRecording} stopRecording={assistant.stopRecording} />
            </div>
        </header>
        
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {renderView()}
        </main>
      </div>

      <ChatInterface isVisible={isChatVisible} onClose={() => setIsChatVisible(false)} liveUserTranscript={assistant.userTranscript} liveAssistantTranscript={assistant.assistantTranscript} lastUserTranscript={lastInteraction.user} lastAssistantTranscript={lastInteraction.assistant} isThinking={assistant.isThinking} isSpeaking={assistant.isSpeaking} error={assistant.error} />

      {selectedTask && (
        <TaskDetailModal isOpen={!!selectedTask} onClose={() => setSelectedTask(null)} task={selectedTask} kanbanApi={kanban} businessLines={kanban.businessLines} clients={kanban.clients} deals={kanban.deals} onOpenUniversalInput={handleOpenUniversalInput} />
      )}

      {isUniversalInputOpen && (
          <UniversalInputModal isOpen={isUniversalInputOpen} onClose={() => setIsUniversalInputOpen(false)} onSave={(text, file) => { if (universalInputContext.date) { kanban.addTask({ title: text, dueDate: universalInputContext.date.toISOString() }); } else { kanban.processTextAndExecute(text, universalInputContext, file) } }} context={universalInputContext} />
      )}
    </div>
  );
}
