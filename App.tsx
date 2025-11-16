import React, { useState } from 'react';
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

export type View = 'tasks' | 'businessLines' | 'clients' | 'deals' | 'crm';

const ChatIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
);

export default function App() {
  const [activeView, setActiveView] = useState<View>('tasks');
  const [selectedBusinessLineId, setSelectedBusinessLineId] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [lastInteraction, setLastInteraction] = useState({ user: '', assistant: '' });

  const handleTurnComplete = (user: string, assistant: string) => {
    if (user || assistant) {
      setLastInteraction({ user, assistant });
    }
  };

  const kanban = useKanban();
  const assistant = useVoiceAssistant({
    onBoardItemCreate: kanban.addTask,
    onCrmEntryCreate: kanban.addCRMEntryFromVoice,
    onTaskUpdate: kanban.updateTaskStatusByTitle,
    onBusinessLineCreate: kanban.addBusinessLine,
    onClientCreate: kanban.addClient,
    onDealCreate: kanban.addDeal,
    onDealStatusUpdate: (dealId, status) => kanban.updateDeal(dealId, { status }),
    onTurnComplete: handleTurnComplete,
    currentBusinessLineId: selectedBusinessLineId,
    currentClientId: selectedClientId,
    currentDealId: selectedDealId,
  });

  const clearSelections = () => {
    setSelectedBusinessLineId(null);
    setSelectedClientId(null);
    setSelectedDealId(null);
    setSelectedTask(null);
  }

  const handleSetView = (view: View) => {
    clearSelections();
    setActiveView(view);
  }

  const handleSelectBusinessLine = (id: string) => {
    clearSelections();
    setActiveView('businessLines');
    setSelectedBusinessLineId(id);
  };

  const handleSelectClient = (id: string) => {
    clearSelections();
    setActiveView('clients');
    setSelectedClientId(id);
  };
  
  const handleSelectDeal = (id: string) => {
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
            onAddBusinessLine={kanban.addBusinessLine}
            onUpdateBusinessLine={kanban.updateBusinessLine}
          />;
      case 'clients':
        return <ClientsView 
                  clients={kanban.clients} 
                  businessLines={kanban.businessLines}
                  onSelectClient={handleSelectClient}
                  onAddClient={kanban.addClient}
                  onUpdateClient={kanban.updateClient}
               />;
      case 'deals':
        return <DealsView 
                    deals={kanban.deals} 
                    clients={kanban.clients} 
                    businessLines={kanban.businessLines}
                    onSelectDeal={handleSelectDeal}
                    onAddDeal={kanban.addDeal}
                    onUpdateDeal={kanban.updateDeal}
                />;
      case 'tasks':
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
          />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans flex">
      <Sidebar activeView={activeView} setActiveView={handleSetView} />
      
      <div className="flex-1 flex flex-col">
        <header className="p-4 border-b border-gray-700">
          <h1 className="text-2xl font-bold text-center text-indigo-400">
            Voice First Kanban Copilot
          </h1>
          <p className="text-center text-gray-400">
            Talk to olooAI.
          </p>
        </header>
        
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
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
        />
      )}

      {!isChatVisible && (lastInteraction.user || lastInteraction.assistant) && (
        <div className="fixed bottom-8 right-32 z-10">
          <button
            onClick={() => setIsChatVisible(true)}
            title="Open last chat"
            className="w-16 h-16 rounded-full flex items-center justify-center bg-gray-600 hover:bg-gray-700 text-white shadow-lg transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-gray-500"
          >
            <ChatIcon />
          </button>
        </div>
      )}

      <VoiceControl
        isConnecting={assistant.isConnecting}
        isRecording={assistant.isRecording}
        startRecording={handleStartRecording}
        stopRecording={assistant.stopRecording}
      />
    </div>
  );
}