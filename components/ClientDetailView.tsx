import React, { useState } from 'react';
import { Client, Task, Deal, Opportunity, Document, BusinessLine, CRMEntry, Suggestion } from '../types';
import KanbanBoard from './KanbanBoard';
import { useKanban } from '../hooks/useKanban';
import DocumentManager from './DocumentManager';
import MarketingCollateralGenerator from './MarketingCollateralGenerator';
import CRMIcon from './CRMIcon';
import SuggestionStrip from './SuggestionStrip';
import EditTaskModal from './EditTaskModal';
import Tabs from './Tabs';
import { UniversalInputContext } from '../App';
import ClientPulseView from './ClientPulseView';

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
  onOpenUniversalInput: (context: UniversalInputContext) => void;
}

type ClientTab = 'Overview' | 'Work' | 'CRM' | 'Client Pulse' | 'Documents' | 'AI Ideas';

const PlusIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>);
const PaperclipIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>);


const ClientDetailView: React.FC<ClientDetailViewProps> = (props) => {
    const { client, onBack, onSelectBusinessLine } = props;
    const [activeTab, setActiveTab] = useState<ClientTab>('Overview');

    const getBusinessLineName = (id: string) => {
        return props.businessLines.find(bl => bl.id === id)?.name || 'N/A';
    }

    const tabContent = () => {
        switch (activeTab) {
            case 'Overview': return <OverviewTab {...props} getBusinessLineName={getBusinessLineName} />;
            case 'Work': return <WorkTab {...props} />;
            case 'CRM': return <CrmTab {...props} />;
            case 'Client Pulse': return <ClientPulseView client={props.client} kanbanApi={props.kanbanApi} />;
            case 'Documents': return <DocumentsTab {...props} />;
            case 'AI Ideas': return <AiIdeasTab {...props} />;
            default: return null;
        }
    };

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-start">
            <div>
                 <button onClick={onBack} className="text-sm text-brevo-cta hover:underline font-medium mb-2">
                    &larr; Back to all Clients
                </button>
                <h1 className="text-2xl font-semibold text-brevo-text-primary">{client.name}</h1>
                <div className="flex items-center space-x-4 mt-2">
                    <span onClick={() => onSelectBusinessLine(client.businessLineId)} className="text-sm bg-gray-100 text-gray-800 rounded-full px-3 py-1 w-fit cursor-pointer hover:bg-gray-200">
                        Part of: {getBusinessLineName(client.businessLineId)}
                    </span>
                </div>
            </div>
        </div>
        <Tabs
            tabs={['Overview', 'Work', 'CRM', 'Client Pulse', 'Documents', 'AI Ideas']}
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

const OverviewTab: React.FC<ClientDetailViewProps & { getBusinessLineName: (id: string) => string }> = ({ client }) => (
    <div className="bg-white p-6 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-brevo-border">
        <h2 className="text-lg font-semibold text-brevo-text-primary mb-4">Summary</h2>
        <p className="text-brevo-text-secondary mb-4"><strong className="text-brevo-text-primary">Who they are:</strong> {client.description}</p>
        <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
            <h4 className="font-semibold text-brevo-text-primary">AI Focus</h4>
            <p className="text-brevo-text-secondary">{client.aiFocus}</p>
        </div>
    </div>
);

const WorkTab: React.FC<ClientDetailViewProps> = ({ client, tasks, deals, businessLines, onSelectBusinessLine, onSelectDeal, onSelectTask, kanbanApi, onOpenUniversalInput }) => {
    const handleAddDeal = () => {
        onOpenUniversalInput({
            clientId: client.id,
            placeholder: `Create a new deal "Q4 Contract" for ${client.name} worth 10000 KES...`
        });
    }
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-brevo-text-primary mb-4">Tasks</h3>
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
            <div className="bg-white p-6 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-brevo-border">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-brevo-text-primary">Deals</h3>
                    <button onClick={handleAddDeal} className="flex items-center text-sm bg-brevo-cta hover:bg-brevo-cta-hover text-white font-bold py-1 px-3 rounded-lg transition-colors"><PlusIcon />Add Deal</button>
                </div>
                 {deals.length > 0 ? (
                    <ul className="space-y-3">
                        {deals.map(deal => (
                            <li key={deal.id} onClick={() => onSelectDeal(deal.id)} className="bg-gray-50 p-3 rounded-md flex justify-between items-center border border-gray-200 cursor-pointer hover:border-brevo-cta-hover">
                                <span className="font-medium text-brevo-text-primary">{deal.name}</span>
                                <span className={`text-xs rounded-full px-2 py-1 ${deal.status === 'Open' ? 'bg-blue-100 text-blue-800' : 'bg-gray-200 text-gray-800'}`}>{deal.status}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-center text-brevo-text-secondary py-4">No deals for this client yet.</p>
                )}
            </div>
        </div>
    );
};

const CrmTab: React.FC<ClientDetailViewProps> = ({ client, crmEntries, documents, kanbanApi, onOpenUniversalInput }) => {
    const [editingSuggestion, setEditingSuggestion] = useState<Suggestion | null>(null);
    
    const handleTypeNoteClick = () => {
        onOpenUniversalInput({
            clientId: client.id,
            placeholder: `Log a call with ${client.name}...`
        });
    };

    const handleSaveEditedTask = (newTitle: string) => {
        if (editingSuggestion) {
            kanbanApi.addTask({ ...editingSuggestion.taskData, title: newTitle });
        }
        setEditingSuggestion(null);
    }
    const sortedCrmEntries = [...crmEntries].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return (
        <div className="bg-white p-6 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-brevo-border">
            <div className="flex justify-end mb-4">
                 <button onClick={handleTypeNoteClick} className="text-sm text-brevo-cta hover:underline">
                    Type a note instead
                </button>
            </div>
            {sortedCrmEntries.length > 0 ? (
                <ul className="space-y-4">
                    {sortedCrmEntries.map(entry => {
                        const doc = entry.documentId ? documents.find(d => d.id === entry.documentId) : null;
                        return (
                        <li key={entry.id} className="bg-white p-4 rounded-lg border border-brevo-border">
                            <div className="flex items-start">
                                <CRMIcon type={entry.type} />
                                <div className="flex-1">
                                    <p className="text-xs text-brevo-text-secondary mb-1">{new Date(entry.createdAt).toLocaleString()}</p>
                                    <p className="text-brevo-text-primary">{entry.summary}</p>
                                    {doc && (
                                        <a href={doc.url} target="_blank" rel="noopener noreferrer" className="mt-2 flex items-center text-sm text-brevo-cta hover:underline">
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
                <p className="text-center text-brevo-text-secondary py-8">No conversations logged yet. Use your voice or add a note to get started!</p>
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

const DocumentsTab: React.FC<ClientDetailViewProps> = ({ documents, client, kanbanApi }) => (
    <DocumentManager 
        documents={documents}
        owner={client}
        ownerType="client"
        kanbanApi={kanbanApi}
        onAddDocument={kanbanApi.addDocument}
        onDeleteDocument={kanbanApi.deleteDocument}
    />
);

const AiIdeasTab: React.FC<ClientDetailViewProps> = ({ client, kanbanApi }) => {
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
    const [isLoadingOpportunities, setIsLoadingOpportunities] = useState(false);
    
    const handleGetOpportunities = async (expand = false) => {
        setIsLoadingOpportunities(true);
        const result = await kanbanApi.getClientOpportunities(client, expand);
        setOpportunities(result);
        setIsLoadingOpportunities(false);
    };

    const handleAddOpportunityAsTask = (opportunityText: string) => {
        kanbanApi.addTask({
            title: opportunityText,
            clientId: client.id,
            businessLineId: client.businessLineId,
        });
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-brevo-border">
                <h3 className="text-lg font-semibold text-brevo-text-primary mb-4">Growth Opportunities</h3>
                <div className="flex space-x-4">
                    <button 
                        onClick={() => handleGetOpportunities(false)} 
                        disabled={isLoadingOpportunities}
                        className="bg-brevo-cta hover:bg-brevo-cta-hover text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:bg-gray-300"
                    >
                        {isLoadingOpportunities ? 'Analyzing...' : 'Ask AI for ideas'}
                    </button>
                </div>
                {opportunities.length > 0 && (
                    <div className="mt-6 bg-gray-50 p-4 rounded-md border border-gray-200">
                        <h4 className="font-semibold text-base text-green-700 mb-3">Here are some ideas:</h4>
                        <ul className="space-y-3">
                        {opportunities.map(opp => (
                            <li key={opp.id} className="flex items-center justify-between text-brevo-text-secondary">
                                <span>- {opp.text}</span>
                                <button
                                    onClick={() => handleAddOpportunityAsTask(opp.text)}
                                    className="flex items-center text-xs bg-gray-200 hover:bg-gray-300 text-brevo-text-primary font-semibold py-1 px-2 rounded-md transition-colors"
                                >
                                    <PlusIcon /> Add task
                                </button>
                            </li>
                        ))}
                        </ul>
                    </div>
                )}
            </div>
             <div className="bg-white p-6 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-brevo-border">
                 <h3 className="text-lg font-semibold text-brevo-text-primary mb-4">Marketing Collateral Prompts</h3>
                 <MarketingCollateralGenerator
                    owner={client}
                    kanbanApi={kanbanApi}
                />
             </div>
        </div>
    );
};

export default ClientDetailView;