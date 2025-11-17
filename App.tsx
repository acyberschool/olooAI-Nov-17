
import React, { useState, useEffect } from 'react';
import VoiceControl from './components/VoiceControl';
import ChatInterface from './components/ChatInterface';
import { useKanban } from './hooks/useKanban';
import Sidebar from './components/Sidebar';
import BusinessLinesView from './components/BusinessLinesView';
import ClientsView from './components/ClientsView';
import DealsView from './components/DealsView';
import BusinessLineDetailView from './components/BusinessLineDetailView';
import ClientDetailView from './components/ClientDetailView';
import DealDetailView from './components/DealDetailView';
import CRMView from './components/CRMView';
import TasksView from './components/TasksView';
import TaskDetailModal from './components/TaskDetailModal';
import { useVoiceAssistant } from './hooks/useVoiceAssistant';
import { Task } from './types';
import TeamView from './components/TeamView';
import UniversalInputModal from './components/UniversalInputModal';
import DataInsightsView from './components/DataInsightsView';


// --- Google Analytics Helper ---
declare global {
    interface Window {
        gtag: (...args: any[]) => void;
    }
}
export const trackEvent = (action: string, category: string, label: string, value?: number) => {
    if (window.gtag) {
        window.gtag('event', action, {
            'event_category': category,
            'event_label': label,
            'value': value,
        });
    }
}

export type View = 'homepage' | 'businessLines' | 'clients' | 'deals' | 'crm' | 'team' | 'data';
export type UniversalInputContext = {
    clientId?: string;
    dealId?: string;
    businessLineId?: string;
    task?: Task;
    placeholder?: string;
};

const MenuIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
);


export default function App() {
  const [activeView, setActiveView] = useState<View>('homepage');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedBusinessLineId, setSelectedBusinessLineId] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [lastInteraction, setLastInteraction] = useState({ user: '', assistant: '' });

  const [isUniversalInputOpen, setIsUniversalInputOpen] = useState(false);
  const [universalInputContext, setUniversalInputContext] = useState<UniversalInputContext>({});

  const handleTurnComplete = (user: string, assistant: string) => {
    if (user || assistant) {
      setLastInteraction({ user, assistant });
      setIsChatVisible(true);
    }
  };

  const kanban = useKanban();

  const platformActivitySummary = `Last 3 tasks: ${kanban.tasks.slice(0,3).map(t => t.title).join(', ')}. Last 3 CRM notes: ${kanban.crmEntries.slice(0,3).map(c => c.summary).join(', ')}.`;

  const assistant = useVoiceAssistant({
    onBoardItemCreate: kanban.addTask,
    onCrmEntryCreate: kanban.addCRMEntryFromVoice,
    onTaskUpdate: kanban.updateTaskStatusByTitle,
    onBusinessLineCreate: kanban.addBusinessLine,
    onClientCreate: kanban.addClient,
    onDealCreate: kanban.addDeal,
    onDealStatusUpdate: (dealId, status) => kanban.updateDeal(dealId, { status }),
    onTurnComplete: handleTurnComplete,
    onFindProspects: kanban.findProspectsByName,
    currentBusinessLineId: selectedBusinessLineId,
    currentClientId: selectedClientId,
    currentDealId: selectedDealId,
    platformActivitySummary,
  });

  useEffect(() => {
    // Pre-load a business line for a better initial experience
    if (kanban.businessLines.length > 0 && !selectedBusinessLineId) {
      setSelectedBusinessLineId(kanban.businessLines[0].id);
    }
  }, [kanban.businessLines]);


  const clearSelections = () => {
    setSelectedBusinessLineId(null);
    setSelectedClientId(null);
    setSelectedDealId(null);
    setSelectedTask(null);
  }

  const handleSetView = (view: View) => {
    trackEvent('navigate', 'View', view);
    clearSelections();
    setActiveView(view);
    setIsSidebarOpen(false); // Close sidebar on navigation change
  }

  const handleSelectBusinessLine = (id: string) => {
    trackEvent('select', 'BusinessLine', id);
    clearSelections();
    setActiveView('businessLines');
    setSelectedBusinessLineId(id);
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

  const renderView = () => {
    if (selectedDealId) {
        const deal = kanban.deals.find(d => d.id === selectedDealId);
        if (deal) {
            return <DealDetailView 
                deal={deal}
                client={kanban.clients.find(c => c.id === deal.clientId)!}
                businessLine={kanban.businessLines.find(bl => bl.id === deal.businessLineId)!}
                tasks={kanban.tasks.filter(t => t.dealId === selectedDealId)}
                documents={kanban.documents.filter(doc => doc.ownerId === selectedDealId && doc.ownerType === 'deal')}
                kanbanApi={kanban}
                onSelectClient={handleSelectClient}
                onSelectBusinessLine={handleSelectBusinessLine}
                onSelectTask={handleSelectTask}
                onBack={() => {
                    const client = kanban.clients.find(c => c.id === deal.clientId);
                    if (client) handleSelectClient(client.id);
                    else handleSetView('deals');
                }}
            />
        }
    }
    if (selectedClientId) {
        const client = kanban.clients.find(c => c.id === selectedClientId);
        if (client) {
            return <ClientDetailView
                client={client}
                businessLines={kanban.businessLines}
                tasks={kanban.tasks.filter(t => t.clientId === selectedClientId)}
                deals={kanban.deals.filter(d => d.clientId === selectedClientId)}
                documents={kanban.documents.filter(doc => doc.ownerId === selectedClientId && doc.ownerType === 'client' || kanban.crmEntries.filter(c => c.clientId === client.id).map(c=>c.documentId).includes(doc.id))}
                crmEntries={kanban.crmEntries.filter(c => c.clientId === selectedClientId)}
                kanbanApi={kanban}
                onSelectBusinessLine={handleSelectBusinessLine}
                onSelectDeal={handleSelectDeal}
                onSelectTask={handleSelectTask}
                onBack={() => handleSetView('clients')}
                onOpenUniversalInput={handleOpenUniversalInput}
            />
        }
    }
    if (selectedBusinessLineId) {
        const businessLine = kanban.businessLines.find(bl => bl.id === selectedBusinessLineId);
        const playbook = kanban.playbooks.find(p => p.businessLineId === selectedBusinessLineId);
        if (businessLine) {
            return <BusinessLineDetailView 
                businessLine={businessLine}
                playbook={playbook}
                tasks={kanban.tasks.filter(t => t.businessLineId === selectedBusinessLineId)}
                clients={kanban.clients.filter(c => c.businessLineId === selectedBusinessLineId)}
                deals={kanban.deals.filter(d => d.businessLineId === selectedBusinessLineId)}
                documents={kanban.documents.filter(doc => doc.ownerId === selectedBusinessLineId && doc.ownerType === 'businessLine')}
                kanbanApi={kanban}
                onSelectClient={handleSelectClient}
                onSelectDeal={handleSelectDeal}
                onSelectTask={handleSelectTask}
                onBack={() => handleSetView('businessLines')}
            />;
        }
    }
    
    switch (activeView) {
      case 'data':
        return <DataInsightsView kanbanApi={kanban} />;
      case 'team':
        return <TeamView />;
      case 'crm':
        return <CRMView 
            clients={kanban.clients}
            crmEntries={kanban.crmEntries}
            tasks={kanban.tasks}
            businessLines={kanban.businessLines}
            onSelectClient={handleSelectClient}
          />;
      case 'businessLines':
        return <BusinessLinesView 
            businessLines={kanban.businessLines} 
            onSelectBusinessLine={handleSelectBusinessLine}
            onOpenUniversalInput={handleOpenUniversalInput}
            onUpdateBusinessLine={kanban.updateBusinessLine}
          />;
      case 'clients':
        return <ClientsView 
                  clients={kanban.clients} 
                  businessLines={kanban.businessLines}
                  onSelectClient={handleSelectClient}
                  onOpenUniversalInput={handleOpenUniversalInput}
                  onUpdateClient={kanban.updateClient}
               />;
      case 'deals':
        return <DealsView 
                    deals={kanban.deals} 
                    clients={kanban.clients} 
                    businessLines={kanban.businessLines}
                    onSelectDeal={handleSelectDeal}
                    onOpenUniversalInput={handleOpenUniversalInput}
                    onUpdateDeal={kanban.updateDeal}
                />;
      case 'homepage':
      default:
        return <TasksView 
            tasks={kanban.tasks} 
            businessLines={kanban.businessLines}
            clients={kanban.clients}
            deals={kanban.deals}
            updateTaskStatus={kanban.updateTaskStatusById} 
            onSelectBusinessLine={handleSelectBusinessLine}
            onSelectClient={handleSelectClient}
            onSelectDeal={handleSelectDeal}
            onSelectTask={handleSelectTask}
            onOpenUniversalInput={handleOpenUniversalInput}
          />;
    }
  };

  return (
    <div className="min-h-screen font-sans flex flex-col lg:flex-row bg-brevo-light-gray">
      <Sidebar activeView={activeView} setActiveView={handleSetView} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="p-4 border-b border-brevo-border flex items-center justify-between z-10 bg-white/80 backdrop-blur-sm sticky top-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="lg:hidden text-brevo-text-secondary hover:text-brevo-text-primary">
              <MenuIcon />
            </button>
            <h1 className="text-2xl font-bold text-brevo-cta">
              olooAI
            </h1>
             <VoiceControl
                isConnecting={assistant.isConnecting}
                isRecording={assistant.isRecording}
                startRecording={handleStartRecording}
                stopRecording={assistant.stopRecording}
              />
          </div>
           <p className="text-sm text-brevo-text-secondary hidden md:block">
              Your AI Business Assistant, Walter.
            </p>
        </header>
        
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {renderView()}
        </main>
      </div>

      <ChatInterface
        isVisible={isChatVisible}
        onClose={() => setIsChatVisible(false)}
        liveUserTranscript={assistant.userTranscript}
        liveAssistantTranscript={assistant.assistantTranscript}
        lastUserTranscript={lastInteraction.user}
        lastAssistantTranscript={lastInteraction.assistant}
        isThinking={assistant.isThinking}
        isSpeaking={assistant.isSpeaking}
        error={assistant.error}
      />

      {selectedTask && (
        <TaskDetailModal
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          task={selectedTask}
          kanbanApi={kanban}
          businessLines={kanban.businessLines}
          clients={kanban.clients}
          deals={kanban.deals}
          onOpenUniversalInput={handleOpenUniversalInput}
        />
      )}

      {isUniversalInputOpen && (
          <UniversalInputModal 
            isOpen={isUniversalInputOpen}
            onClose={() => setIsUniversalInputOpen(false)}
            onSave={(text) => kanban.processTextAndExecute(text, universalInputContext)}
            context={universalInputContext}
          />
      )}
      
    </div>
  );
}
