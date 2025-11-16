import React, { useState } from 'react';
import { Deal, Client, BusinessLine, Task, Document, Opportunity, Suggestion } from '../types';
import KanbanBoard from './KanbanBoard';
import DocumentManager from './DocumentManager';
import { useKanban } from '../hooks/useKanban';
import MarketingCollateralGenerator from './MarketingCollateralGenerator';
import SuggestionStrip from './SuggestionStrip';
import EditTaskModal from './EditTaskModal';

interface DealDetailViewProps {
  deal: Deal;
  client: Client;
  businessLine: BusinessLine;
  tasks: Task[];
  documents: Document[];
  kanbanApi: ReturnType<typeof useKanban>;
  onSelectClient: (id: string) => void;
  onSelectBusinessLine: (id: string) => void;
  onBack: () => void;
  onSelectTask: (task: Task) => void;
}

const BackIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
);
const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
);

const DealDetailView: React.FC<DealDetailViewProps> = ({
  deal,
  client,
  businessLine,
  tasks,
  documents,
  kanbanApi,
  onSelectClient,
  onSelectBusinessLine,
  onBack,
  onSelectTask,
}) => {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [isLoadingOpportunities, setIsLoadingOpportunities] = useState(false);
  const [editingSuggestion, setEditingSuggestion] = useState<Suggestion | null>(null);

  const handleGetOpportunities = async (expand = false) => {
    setIsLoadingOpportunities(true);
    const result = await kanbanApi.getDealOpportunities(deal, expand);
    setOpportunities(result);
    setIsLoadingOpportunities(false);
  };
  
  const handleAddOpportunityAsTask = (opportunityText: string) => {
    kanbanApi.addTask({
        title: opportunityText,
        dealId: deal.id,
        clientId: client.id,
        businessLineId: businessLine.id,
    });
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      kanbanApi.updateDeal(deal.id, { status: e.target.value as 'Open' | 'Closed'});
  };

  const handleSaveEditedTask = (newTitle: string) => {
    if (editingSuggestion) {
      kanbanApi.addTask({ ...editingSuggestion.taskData, title: newTitle });
    }
    setEditingSuggestion(null);
  }

  return (
    <div className="space-y-8">
      {/* Breadcrumbs / Back Button */}
      <div className="text-sm text-gray-400">
        <span onClick={() => onSelectBusinessLine(businessLine.id)} className="hover:underline cursor-pointer">{businessLine.name}</span>
        <span className="mx-2">&gt;</span>
        <span onClick={() => onSelectClient(client.id)} className="hover:underline cursor-pointer">{client.name}</span>
        <span className="mx-2">&gt;</span>
        <span className="text-white font-semibold">{deal.name}</span>
      </div>

      {/* Summary Section */}
      <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
        <div className="flex justify-between items-start">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">{deal.name}</h1>
                <p className="text-gray-400 mb-4">{deal.description}</p>
            </div>
            <div className="flex-shrink-0">
                <label htmlFor="dealStatus" className="text-xs text-gray-400">Deal Status</label>
                <select id="dealStatus" value={deal.status} onChange={handleStatusChange} className="bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500">
                    <option value="Open">Open</option>
                    <option value="Closed">Closed</option>
                </select>
            </div>
        </div>
        <SuggestionStrip 
            contextText={`the next step for "${deal.name}"`}
            suggestions={deal.suggestions || []}
            onAdd={kanbanApi.addTask}
            onEditAndAdd={setEditingSuggestion}
            onDismiss={() => kanbanApi.dismissSuggestions('deal', deal.id)}
        />
      </div>
      
      {/* Work Section */}
      <div>
        <h2 className="text-2xl font-bold mb-4 text-indigo-400">Work for this deal</h2>
        <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
            <h3 className="text-xl font-semibold mb-4 text-gray-200">Tasks for "{deal.name}"</h3>
            <KanbanBoard 
                tasks={tasks} 
                businessLines={[businessLine]}
                clients={[client]}
                deals={[deal]}
                updateTaskStatus={kanbanApi.updateTaskStatusById}
                onSelectBusinessLine={onSelectBusinessLine}
                onSelectClient={onSelectClient}
                onSelectDeal={() => {}} // no-op
                onSelectTask={onSelectTask}
            />
        </div>
      </div>
      
      {/* AI Opportunities Section */}
      <div>
        <h2 className="text-2xl font-bold mb-4 text-indigo-400">AI Opportunities with this deal</h2>
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
                owner={deal}
                kanbanApi={kanbanApi}
            />
        </div>

       {/* Documents Section */}
        <div>
            <h2 className="text-2xl font-bold mb-4 text-indigo-400">Documents for this deal</h2>
            <DocumentManager 
                documents={documents}
                owner={deal}
                ownerType="deal"
                kanbanApi={kanbanApi}
                onAddDocument={kanbanApi.addDocument}
                onDeleteDocument={kanbanApi.deleteDocument}
            />
        </div>

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

export default DealDetailView;