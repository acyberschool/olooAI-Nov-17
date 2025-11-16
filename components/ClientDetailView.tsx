import React, { useState } from 'react';
import { Client, Task, Deal, Opportunity, Document, BusinessLine, CRMEntry, Suggestion } from '../types';
import KanbanBoard from './KanbanBoard';
import { useKanban } from '../hooks/useKanban';
import DocumentManager from './DocumentManager';
import MarketingCollateralGenerator from './MarketingCollateralGenerator';
import AddCRMNoteModal from './AddCRMNoteModal';
import CRMIcon from './CRMIcon';
import SuggestionStrip from './SuggestionStrip';
import EditTaskModal from './EditTaskModal';

interface ClientDetailViewProps {
  client: Client;
  businessLines: BusinessLine[];
  tasks: Task[];
  deals: Deal[];
  documents: Document[];
  crmEntries: CRMEntry[];
  onBack: () => void;
  kanbanApi: ReturnType<typeof useKanban>;
  onSelectBusinessLine: (id: string) => void;
  onSelectDeal: (id: string) => void;
  onSelectTask: (task: Task) => void;
}

const BackIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
);

const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
);

const PaperclipIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
);


const ClientDetailView: React.FC<ClientDetailViewProps> = ({
  client,
  businessLines,
  tasks,
  deals,
  documents,
  crmEntries,
  onBack,
  kanbanApi,
  onSelectBusinessLine,
  onSelectDeal,
  onSelectTask,
}) => {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [isLoadingOpportunities, setIsLoadingOpportunities] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [editingSuggestion, setEditingSuggestion] = useState<Suggestion | null>(null);
  
  const getBusinessLineName = (id: string) => {
    return businessLines.find(bl => bl.id === id)?.name || 'N/A';
  }

  const handleGetOpportunities = async (expand = false) => {
    setIsLoadingOpportunities(true);
    const result = await kanbanApi.getClientOpportunities(client, expand);
    setOpportunities(result);
    setIsLoadingOpportunities(false);
  }
  
  const handleAddOpportunityAsTask = (opportunityText: string) => {
    kanbanApi.addTask({
        title: opportunityText,
        clientId: client.id,
        businessLineId: client.businessLineId,
    });
  }
  
  const handleAddDeal = () => {
    const name = prompt("What is the deal name?");
    const description = prompt("What is this deal about?");
    if (name && description) {
        kanbanApi.addDeal({ name, description, clientName: client.name, clientId: client.id, businessLineId: client.businessLineId });
    }
  }

  const handleSaveEditedTask = (newTitle: string) => {
    if (editingSuggestion) {
      kanbanApi.addTask({ ...editingSuggestion.taskData, title: newTitle });
    }
    setEditingSuggestion(null);
  }

  const sortedCrmEntries = [...crmEntries].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="space-y-8">
      <button onClick={onBack} className="flex items-center text-indigo-400 hover:text-indigo-300 font-medium">
        <BackIcon />
        Back to all Clients
      </button>

      {/* Summary Section */}
      <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
        <h1 className="text-3xl font-bold text-white mb-2">{client.name}</h1>
        <div className="flex items-center space-x-4 mb-4">
             <span onClick={() => onSelectBusinessLine(client.businessLineId)} className="text-sm bg-gray-700/50 text-indigo-300 rounded-full px-3 py-1 w-fit cursor-pointer hover:bg-gray-700">
                Part of: {getBusinessLineName(client.businessLineId)}
            </span>
        </div>
        <p className="text-gray-400 mb-4"><strong className="text-gray-300">Who they are:</strong> {client.description}</p>
        <div className="bg-gray-800 p-3 rounded-md">
            <h4 className="font-semibold text-gray-300">AI Focus</h4>
            <p className="text-gray-400">{client.aiFocus}</p>
        </div>
      </div>

      {/* Conversations Section */}
      <div>
        <h2 className="text-2xl font-bold mb-4 text-indigo-400">Conversations with this client</h2>
        <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
            <div className="flex justify-end mb-4">
                 <button onClick={() => setIsNoteModalOpen(true)} className="text-sm text-indigo-400 hover:underline">
                    Type a note instead
                </button>
            </div>
            {sortedCrmEntries.length > 0 ? (
                <ul className="space-y-4">
                    {sortedCrmEntries.map(entry => {
                        const doc = entry.documentId ? documents.find(d => d.id === entry.documentId) : null;
                        return (
                        <li key={entry.id} className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                            <div className="flex items-start">
                                <CRMIcon type={entry.type} />
                                <div className="flex-1">
                                    <p className="text-xs text-gray-400 mb-1">{new Date(entry.createdAt).toLocaleString()}</p>
                                    <p className="text-gray-200">{entry.summary}</p>
                                    {doc && (
                                        <a href={doc.url} target="_blank" rel="noopener noreferrer" className="mt-2 flex items-center text-sm text-indigo-400 hover:underline">
                                            <PaperclipIcon /> {doc.name}
                                        </a>
                                    )}
                                </div>
                            </div>
                            <SuggestionStrip 
                                suggestions={entry.suggestions || []}
                                onAdd={kanbanApi.addTask}
                                onEditAndAdd={setEditingSuggestion}
                                onDismiss={() => {}} // This should clear suggestions on the entry
                            />
                        </li>
                    )})}
                </ul>
            ) : (
                <p className="text-center text-gray-500 py-8">No conversations logged yet. Use your voice or add a note to get started!</p>
            )}
        </div>
      </div>
      
      {/* Work Section */}
      <div>
        <h2 className="text-2xl font-bold mb-4 text-indigo-400">Work with {client.name}</h2>
        <div className="space-y-6">
            {/* Tasks */}
            <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-gray-200">Tasks</h3>
                </div>
                <KanbanBoard 
                    tasks={tasks} 
                    businessLines={businessLines}
                    clients={[client]}
                    deals={deals}
                    updateTaskStatus={kanbanApi.updateTaskStatusById}
                    onSelectBusinessLine={onSelectBusinessLine}
                    onSelectClient={() => {}} // no-op
                    onSelectDeal={onSelectDeal}
                    onSelectTask={onSelectTask}
                />
            </div>
            {/* Deals */}
            <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-gray-200">Deals</h3>
                    <button onClick={handleAddDeal} className="flex items-center text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1 px-3 rounded-lg transition-colors"><PlusIcon />Add Deal</button>
                </div>
                 {deals.length > 0 ? (
                    <ul className="space-y-3">
                        {deals.map(deal => (
                            <li key={deal.id} onClick={() => onSelectDeal(deal.id)} className="bg-gray-800 p-3 rounded-md flex justify-between items-center border border-gray-700 cursor-pointer hover:border-indigo-500">
                                <span className="font-medium text-gray-300">{deal.name}</span>
                                <span className={`text-xs rounded-full px-2 py-1 ${deal.status === 'Open' ? 'bg-green-900/50 text-green-300' : 'bg-gray-700 text-gray-400'}`}>{deal.status}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-center text-gray-500 py-4">No deals for this client yet.</p>
                )}
            </div>
        </div>
      </div>
        
      {/* AI Opportunities Section */}
      <div>
        <h2 className="text-2xl font-bold mb-4 text-indigo-400">AI Opportunities with {client.name}</h2>
         <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
            <div className="flex space-x-4">
                 <button 
                    onClick={() => handleGetOpportunities(false)} 
                    disabled={isLoadingOpportunities}
                    className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:bg-gray-500"
                >
                    {isLoadingOpportunities ? 'Analyzing...' : 'Ask AI for opportunities'}
                </button>
            </div>
           
            {opportunities.length > 0 && (
                <div className="mt-6 bg-gray-800 p-4 rounded-md">
                    <h4 className="font-semibold text-lg text-teal-300 mb-3">Here are some ideas:</h4>
                    <ul className="space-y-3">
                       {opportunities.map(opp => (
                         <li key={opp.id} className="flex items-center justify-between text-gray-300">
                            <span>- {opp.text}</span>
                            <button
                                onClick={() => handleAddOpportunityAsTask(opp.text)}
                                className="flex items-center text-xs bg-indigo-500 hover:bg-indigo-600 text-white py-1 px-2 rounded-md transition-colors"
                            >
                                <PlusIcon />
                                Add to tasks
                            </button>
                         </li>
                       ))}
                    </ul>
                </div>
            )}
         </div>
      </div>
        
       {/* AI Marketing Collateral Section */}
        <div>
            <h2 className="text-2xl font-bold mb-4 text-indigo-400">Ask AI for marketing collateral</h2>
            <MarketingCollateralGenerator
                owner={client}
                kanbanApi={kanbanApi}
            />
        </div>

       {/* Documents & Notes Section */}
        <div>
            <h2 className="text-2xl font-bold mb-4 text-indigo-400">Documents & Notes for {client.name}</h2>
            <DocumentManager 
                documents={documents}
                owner={client}
                ownerType="client"
                kanbanApi={kanbanApi}
                onAddDocument={kanbanApi.addDocument}
                onDeleteDocument={kanbanApi.deleteDocument}
            />
        </div>

        {isNoteModalOpen && (
            <AddCRMNoteModal 
                isOpen={isNoteModalOpen}
                onClose={() => setIsNoteModalOpen(false)}
                onSave={(note, type, file) => kanbanApi.addCRMEntry(client.id, note, type, undefined, file)}
            />
        )}
        
        {editingSuggestion && (
            <EditTaskModal
                isOpen={!!editingSuggestion}
                onClose={() => setEditingSuggestion(null)}
                onSave={handleSaveEditedTask}
                initialTitle={editingSuggestion.taskData.title || ''}
            />
        )}
    </div>
  );
};

export default ClientDetailView;