import React, { useState } from 'react';
import { Deal, Client, BusinessLine, Task, Document, Opportunity, Suggestion } from '../types';
import KanbanBoard from './KanbanBoard';
import DocumentManager from './DocumentManager';
import { useKanban } from '../hooks/useKanban';
import MarketingCollateralGenerator from './MarketingCollateralGenerator';
import SuggestionStrip from './SuggestionStrip';
import EditTaskModal from './EditTaskModal';
import Tabs from './Tabs';
import CRMIcon from './CRMIcon';
import LogPaymentModal from './LogPaymentModal';

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

type DealTab = 'Overview' | 'Work' | 'Documents' | 'AI Ideas' | 'History';

const PlusIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>);

const DealDetailView: React.FC<DealDetailViewProps> = (props) => {
  const { deal, client, businessLine, onSelectClient, onSelectBusinessLine } = props;
  const [activeTab, setActiveTab] = useState<DealTab>('Overview');
  
  const tabContent = () => {
    switch (activeTab) {
        case 'Overview': return <OverviewTab {...props} />;
        case 'Work': return <WorkTab {...props} />;
        case 'Documents': return <DocumentsTab {...props} />;
        case 'AI Ideas': return <AiIdeasTab {...props} />;
        case 'History': return <HistoryTab {...props} />;
        default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-sm text-[#6B7280]">
        <span onClick={() => onSelectBusinessLine(businessLine.id)} className="hover:underline cursor-pointer">{businessLine.name}</span>
        <span className="mx-2">&gt;</span>
        <span onClick={() => onSelectClient(client.id)} className="hover:underline cursor-pointer">{client.name}</span>
        <span className="mx-2">&gt;</span>
        <span className="text-[#111827] font-semibold">{deal.name}</span>
      </div>

       <Tabs
        tabs={['Overview', 'Work', 'Documents', 'AI Ideas', 'History']}
        activeTab={activeTab}
        setActiveTab={setActiveTab as (tab: string) => void}
       />

       <div className="mt-4">
        {tabContent()}
      </div>
    </div>
  );
};

// --- TAB COMPONENTS ---

const OverviewTab: React.FC<DealDetailViewProps> = ({ deal, kanbanApi }) => {
    const [editingSuggestion, setEditingSuggestion] = useState<Suggestion | null>(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        kanbanApi.updateDeal(deal.id, { status: e.target.value as 'Open' | 'Closed - Won' | 'Closed - Lost'});
    };

    const handleSaveEditedTask = (newTitle: string) => {
        if (editingSuggestion) {
            kanbanApi.addTask({ ...editingSuggestion.taskData, title: newTitle });
        }
        setEditingSuggestion(null);
    }
    
    const balance = deal.value - deal.amountPaid;

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-[#E5E7EB] space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-[#111827] mb-2">{deal.name}</h1>
                    <p className="text-[#6B7280] mb-4">{deal.description}</p>
                </div>
                <div className="flex-shrink-0">
                    <label htmlFor="dealStatus" className="text-xs text-[#6B7280]">Deal Status</label>
                    <select id="dealStatus" value={deal.status} onChange={handleStatusChange} className="bg-white border border-[#E5E7EB] rounded-md px-3 py-2 text-[#111827] focus:ring-2 focus:ring-[#15803D] w-full sm:w-auto">
                        <option value="Open">Open</option>
                        <option value="Closed - Won">Closed - Won</option>
                        <option value="Closed - Lost">Closed - Lost</option>
                    </select>
                </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                        <p className="text-xs text-[#6B7280]">Total Value</p>
                        <p className="text-lg font-bold text-[#111827]">{deal.currency} {deal.value.toLocaleString()}</p>
                    </div>
                    <div>
                        <p className="text-xs text-[#6B7280]">Amount Paid</p>
                        <p className="text-lg font-bold text-[#166534]">{deal.currency} {deal.amountPaid.toLocaleString()}</p>
                    </div>
                    <div>
                        <p className="text-xs text-[#6B7280]">Balance</p>
                        <p className={`text-lg font-bold ${balance > 0 ? 'text-[#B91C1C]' : 'text-[#166534]'}`}>{deal.currency} {balance.toLocaleString()}</p>
                    </div>
                    <div className="flex items-center justify-center">
                        <button onClick={() => setIsPaymentModalOpen(true)} className="bg-[#15803D] hover:bg-[#166534] text-white font-bold py-2 px-4 rounded-lg transition-colors">Log Payment</button>
                    </div>
                </div>
            </div>

            <SuggestionStrip 
                contextText={`the next step for "${deal.name}"`}
                suggestions={deal.suggestions || []}
                onAdd={kanbanApi.addTask}
                onEditAndAdd={setEditingSuggestion}
                onDismiss={() => kanbanApi.dismissSuggestions('deal', deal.id)}
            />
            {editingSuggestion && (
                <EditTaskModal
                    isOpen={!!editingSuggestion}
                    onClose={() => setEditingSuggestion(null)}
                    onSave={handleSaveEditedTask}
                    initialTitle={editingSuggestion.taskData.title || ''}
                />
            )}
             {isPaymentModalOpen && (
                <LogPaymentModal
                    isOpen={isPaymentModalOpen}
                    onClose={() => setIsPaymentModalOpen(false)}
                    onSave={(amount, note) => kanbanApi.logPaymentOnDeal(deal.id, amount, note)}
                    deal={deal}
                />
            )}
        </div>
    );
};

const WorkTab: React.FC<DealDetailViewProps> = ({ deal, client, businessLine, tasks, kanbanApi, onSelectBusinessLine, onSelectClient, onSelectTask }) => (
    <div>
        <h3 className="text-lg font-semibold mb-4 text-[#111827]">Tasks for "{deal.name}"</h3>
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
);

const DocumentsTab: React.FC<DealDetailViewProps> = ({ deal, documents, kanbanApi }) => (
    <DocumentManager 
        documents={documents}
        owner={deal}
        ownerType="deal"
        kanbanApi={kanbanApi}
        onAddDocument={kanbanApi.addDocument}
        onDeleteDocument={kanbanApi.deleteDocument}
    />
);

const AiIdeasTab: React.FC<DealDetailViewProps> = ({ deal, client, businessLine, kanbanApi }) => {
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
    const [opportunitySources, setOpportunitySources] = useState<any[]>([]);
    const [isLoadingOpportunities, setIsLoadingOpportunities] = useState(false);

    const handleGetOpportunities = async (expand = false) => {
        setIsLoadingOpportunities(true);
        const { opportunities: result, sources } = await kanbanApi.getDealOpportunities(deal, expand);
        setOpportunities(result);
        setOpportunitySources(sources);
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
    
    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-lg border border-[#E5E7EB]">
                <h3 className="text-lg font-semibold text-[#111827] mb-4">Next Steps & Upsell Ideas</h3>
                <div className="flex space-x-4">
                    <button 
                        onClick={() => handleGetOpportunities(false)} 
                        disabled={isLoadingOpportunities}
                        className="bg-[#15803D] hover:bg-[#166534] text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:bg-gray-300"
                    >
                        {isLoadingOpportunities ? 'Analyzing...' : 'Ask AI for ideas'}
                    </button>
                </div>
                {opportunities.length > 0 && (
                     <div className="mt-6 bg-gray-50 p-4 rounded-md border border-gray-200">
                        <h4 className="font-semibold text-base text-[#15803D] mb-3">Here are some ideas:</h4>
                        <ul className="space-y-3">
                        {opportunities.map(opp => (
                            <li key={opp.id} className="flex items-center justify-between text-[#374151]">
                                <span>- {opp.text}</span>
                                <button
                                    onClick={() => handleAddOpportunityAsTask(opp.text)}
                                    className="flex items-center text-xs bg-[#DCFCE7] hover:bg-green-200 text-[#14532D] font-semibold py-1 px-2 rounded-md transition-colors"
                                >
                                    <PlusIcon /> Add task
                                </button>
                            </li>
                        ))}
                        </ul>
                         {opportunitySources.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <h5 className="text-xs font-semibold uppercase text-brevo-text-secondary tracking-wider">Sources from Walter's Research</h5>
                                <ul className="list-disc list-inside text-xs mt-2 space-y-1">
                                    {opportunitySources.map((source: any, index: number) => (
                                        <li key={source.uri || index} className="text-blue-600 truncate">
                                            <a href={source.uri} target="_blank" rel="noopener noreferrer" className="hover:underline" title={source.uri}>
                                                {source.title || source.uri}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </div>
             <div className="bg-white p-6 rounded-xl shadow-lg border border-[#E5E7EB]">
                <h3 className="text-lg font-semibold text-[#111827] mb-4">Marketing Collateral Prompts</h3>
                 <MarketingCollateralGenerator
                    owner={deal}
                    kanbanApi={kanbanApi}
                />
            </div>
        </div>
    );
};

const HistoryTab: React.FC<DealDetailViewProps> = ({ deal, kanbanApi }) => {
    const dealHistory = kanbanApi.crmEntries
        .filter(entry => entry.dealId === deal.id)
        .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-[#E5E7EB]">
            <h3 className="text-lg font-semibold text-[#111827] mb-4">Conversation History for "{deal.name}"</h3>
            {dealHistory.length > 0 ? (
                <ul className="space-y-4">
                    {dealHistory.map(entry => (
                        <li key={entry.id} className="bg-white p-4 rounded-lg border border-[#E5E7EB] flex items-start">
                            <CRMIcon type={entry.type} />
                            <div>
                                <p className="text-xs text-[#6B7280] mb-1">{new Date(entry.createdAt).toLocaleString()}</p>
                                <p className="text-[#111827]">{entry.summary}</p>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-center text-[#6B7280] py-8">No specific conversation history for this deal.</p>
            )}
        </div>
    );
}

export default DealDetailView;