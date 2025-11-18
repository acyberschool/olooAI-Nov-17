import React, { useState, useEffect } from 'react';
import { Client, Task, Deal, Opportunity, Document, BusinessLine, CRMEntry, Suggestion, Project } from '../types';
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
import EmailClientModal from './EmailClientModal';

interface ClientDetailViewProps {
  client: Client;
  businessLines: BusinessLine[];
  tasks: Task[];
  deals: Deal[];
  projects: Project[];
  documents: Document[];
  crmEntries: CRMEntry[];
  onBack: () => void;
  kanbanApi: ReturnType<typeof useKanban>;
  onSelectBusinessLine: (id: string) => void;
  onSelectDeal: (id: string) => void;
  onSelectProject: (id: string) => void;
  onSelectTask: (task: Task) => void;
  onOpenUniversalInput: (context: UniversalInputContext) => void;
}

type ClientTab = 'Overview' | 'Work' | 'Conversations' | 'Client Pulse' | 'Documents' | 'AI Ideas';

const PlusIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>);
const PaperclipIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>);

const EditableField: React.FC<{
  label: string;
  value: string;
  onSave: (newValue: string) => void;
  isTextarea?: boolean;
}> = ({ label, value, onSave, isTextarea = false }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value);

  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  const handleSave = () => {
    onSave(currentValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setCurrentValue(value);
    setIsEditing(false);
  };

  return (
    <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
      <div className="flex justify-between items-center mb-1">
        <h4 className="font-semibold text-brevo-text-primary">{label}</h4>
        {!isEditing && (
          <button onClick={() => setIsEditing(true)} className="p-1 rounded-full text-brevo-text-secondary hover:bg-gray-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" /></svg>
          </button>
        )}
      </div>
      {isEditing ? (
        <div>
          {isTextarea ? (
            <textarea value={currentValue} onChange={(e) => setCurrentValue(e.target.value)} className="w-full border-gray-300 rounded-md p-1 text-base" rows={3} />
          ) : (
            <input type="text" value={currentValue} onChange={(e) => setCurrentValue(e.target.value)} className="w-full border-gray-300 rounded-md p-1 text-base" />
          )}
          <div className="flex justify-end space-x-2 mt-2">
            <button onClick={handleCancel} className="text-sm px-2 py-1 rounded hover:bg-gray-100">Cancel</button>
            <button onClick={handleSave} className="text-sm px-3 py-1 rounded bg-brevo-cta text-white">Save</button>
          </div>
        </div>
      ) : (
        <p className="text-brevo-text-secondary">{value}</p>
      )}
    </div>
  );
};


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
            case 'Conversations': return <ConversationsTab {...props} />;
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
                <h1 className="text-3xl font-semibold text-brevo-text-primary">{client.name}</h1>
                <div className="flex items-center space-x-4 mt-2">
                    <span onClick={() => onSelectBusinessLine(client.businessLineId)} className="bg-gray-100 text-gray-800 rounded-full px-3 py-1 w-fit cursor-pointer hover:bg-gray-200">
                        Part of: {getBusinessLineName(client.businessLineId)}
                    </span>
                </div>
            </div>
        </div>
        <Tabs
            tabs={['Overview', 'Work', 'Conversations', 'Client Pulse', 'Documents', 'AI Ideas']}
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

const ContactInfoCard: React.FC<{ client: Client, onEmailClick: () => void }> = ({ client, onEmailClick }) => (
    <div className="bg-white p-6 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-brevo-border">
         <h2 className="text-xl font-semibold text-brevo-text-primary mb-4">Contact Information</h2>
         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-base">
            {client.contactPersonName && <div><p className="font-semibold text-brevo-text-secondary">Contact Person</p><p>{client.contactPersonName}</p></div>}
            {client.contactPersonEmail && <div><p className="font-semibold text-brevo-text-secondary">Email</p><button onClick={onEmailClick} className="text-blue-600 hover:underline">{client.contactPersonEmail}</button></div>}
            {client.contactPersonNumber && <div><p className="font-semibold text-brevo-text-secondary">Phone</p><a href={`tel:${client.contactPersonNumber}`} className="text-blue-600 hover:underline">{client.contactPersonNumber}</a></div>}
            {client.officeLocation && <div><p className="font-semibold text-brevo-text-secondary">Location</p><p>{client.officeLocation}</p></div>}
            {client.linkedinUrl && <div><p className="font-semibold text-brevo-text-secondary">LinkedIn</p><a href={client.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View Profile</a></div>}
            {client.twitterUrl && <div><p className="font-semibold text-brevo-text-secondary">Twitter</p><a href={client.twitterUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View Profile</a></div>}
         </div>
    </div>
);


const OverviewTab: React.FC<ClientDetailViewProps & { getBusinessLineName: (id: string) => string }> = ({ client, kanbanApi, onBack }) => {
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-brevo-border">
                <h2 className="text-xl font-semibold text-brevo-text-primary mb-4">Summary</h2>
                <div className="space-y-4">
                    <EditableField 
                        label="Who they are"
                        value={client.description}
                        onSave={(newValue) => kanbanApi.updateClient(client.id, { description: newValue })}
                        isTextarea
                    />
                    <EditableField 
                        label="AI Focus"
                        value={client.aiFocus}
                        onSave={(newValue) => kanbanApi.updateClient(client.id, { aiFocus: newValue })}
                        isTextarea
                    />
                </div>
            </div>
            
            <ContactInfoCard client={client} onEmailClick={() => setIsEmailModalOpen(true)} />

            <div className="mt-8 pt-6 border-t border-red-200 bg-white p-6 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
                <h3 className="text-lg font-semibold text-red-700 mb-2">Danger Zone</h3>
                <p className="text-sm text-brevo-text-secondary mb-3">Deleting this client will also delete all their associated deals, tasks, and documents. This action cannot be undone.</p>
                <button
                    onClick={() => {
                        if (window.confirm(`Are you sure you want to delete "${client.name}"? This will also delete all associated deals and tasks.`)) {
                            kanbanApi.deleteClient(client.id);
                            onBack();
                        }
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                    Delete this Client
                </button>
            </div>
            {isEmailModalOpen && (
                <EmailClientModal
                    isOpen={isEmailModalOpen}
                    onClose={() => setIsEmailModalOpen(false)}
                    client={client}
                    onSend={(subject, body) => kanbanApi.logEmailToCRM(client.id, undefined, subject, body)}
                />
            )}
        </div>
    )
};

const WorkTab: React.FC<ClientDetailViewProps> = ({ client, tasks, deals, projects, businessLines, onSelectBusinessLine, onSelectDeal, onSelectProject, onSelectTask, kanbanApi, onOpenUniversalInput }) => {
    const handleAddDeal = () => {
        onOpenUniversalInput({
            clientId: client.id,
            placeholder: `Create a new deal "Q4 Contract" for ${client.name} worth 10000 KES...`
        });
    }
    const handleAddProject = () => {
        onOpenUniversalInput({
            clientId: client.id,
            placeholder: `Create a new project "Community Health Drive" for ${client.name}...`
        });
    }
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-semibold text-brevo-text-primary mb-4">Tasks</h3>
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
                    <h3 className="text-xl font-semibold text-brevo-text-primary">Deals</h3>
                    <button onClick={handleAddDeal} className="flex items-center text-sm bg-brevo-cta hover:bg-brevo-cta-hover text-white font-bold py-1 px-3 rounded-lg transition-colors"><PlusIcon />Add Deal</button>
                </div>
                 {deals.length > 0 ? (
                    <ul className="space-y-3">
                        {deals.map(deal => (
                            <li key={deal.id} onClick={() => onSelectDeal(deal.id)} className="bg-gray-50 p-3 rounded-md flex justify-between items-center border border-gray-200 cursor-pointer hover:border-brevo-cta-hover">
                                <span className="font-medium text-brevo-text-primary">{deal.name}</span>
                                <span className={`text-sm rounded-full px-2 py-1 ${deal.status === 'Open' ? 'bg-blue-100 text-blue-800' : 'bg-gray-200 text-gray-800'}`}>{deal.status}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-center text-brevo-text-secondary py-4">No deals for this client yet.</p>
                )}
            </div>
            <div className="bg-white p-6 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-brevo-border">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-brevo-text-primary">Projects</h3>
                    <button onClick={handleAddProject} className="flex items-center text-sm bg-brevo-cta hover:bg-brevo-cta-hover text-white font-bold py-1 px-3 rounded-lg transition-colors"><PlusIcon />Add Project</button>
                </div>
                 {projects.length > 0 ? (
                    <ul className="space-y-3">
                        {projects.map(project => (
                            <li key={project.id} onClick={() => onSelectProject(project.id)} className="bg-gray-50 p-3 rounded-md flex justify-between items-center border border-gray-200 cursor-pointer hover:border-brevo-cta-hover">
                                <span className="font-medium text-brevo-text-primary">{project.projectName}</span>
                                <span className={`text-sm rounded-full px-2 py-1 bg-purple-100 text-purple-800`}>{project.stage}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-center text-brevo-text-secondary py-4">No projects for this client yet.</p>
                )}
            </div>
        </div>
    );
};

const ConversationsTab: React.FC<ClientDetailViewProps> = ({ client, crmEntries, documents, onOpenUniversalInput }) => {
    
    const handleTypeNoteClick = () => {
        onOpenUniversalInput({
            clientId: client.id,
            placeholder: `Log a call with ${client.name}...`
        });
    };

    const sortedCrmEntries = [...crmEntries].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return (
        <div className="bg-white p-6 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-brevo-border">
            <div className="flex justify-end mb-4">
                 <button onClick={handleTypeNoteClick} className="text-base text-brevo-cta hover:underline">
                    Type a note instead
                </button>
            </div>
            {sortedCrmEntries.length > 0 ? (
                <div className="relative border-l-2 border-gray-200 ml-4">
                    <ul className="space-y-8">
                        {sortedCrmEntries.map(entry => {
                            const doc = entry.documentId ? documents.find(d => d.id === entry.documentId) : null;
                            return (
                                <li key={entry.id} className="relative pl-8">
                                    <div className="absolute -left-[1.05rem] top-0">
                                        <CRMIcon type={entry.type} />
                                    </div>
                                    <div className="pl-4">
                                        <p className="text-sm text-brevo-text-secondary mb-1">{new Date(entry.createdAt).toLocaleString()}</p>
                                        <div className="bg-gray-50 p-4 rounded-lg border border-brevo-border">
                                            <p className="text-brevo-text-primary">{entry.summary}</p>
                                            {doc && (
                                                <a href={doc.url} target="_blank" rel="noopener noreferrer" className="mt-2 flex items-center text-base text-brevo-cta hover:underline">
                                                    <PaperclipIcon /> {doc.name}
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </li>
                        )})}
                    </ul>
                </div>
            ) : (
                <p className="text-center text-brevo-text-secondary py-8">No conversations logged yet. Use your voice or add a note to get started!</p>
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
    const [opportunitySources, setOpportunitySources] = useState<any[]>([]);
    const [isLoadingOpportunities, setIsLoadingOpportunities] = useState(false);
    
    const handleGetOpportunities = async (expand = false) => {
        setIsLoadingOpportunities(true);
        const { opportunities: result, sources } = await kanbanApi.getClientOpportunities(client, expand);
        setOpportunities(result);
        setOpportunitySources(sources);
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
                <h3 className="text-xl font-semibold text-brevo-text-primary mb-4">Growth Opportunities</h3>
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
                        <h4 className="font-semibold text-lg text-green-700 mb-3">Here are some ideas:</h4>
                        <ul className="space-y-3">
                        {opportunities.map(opp => (
                            <li key={opp.id} className="flex items-center justify-between text-brevo-text-secondary">
                                <span>- {opp.text}</span>
                                <button
                                    onClick={() => handleAddOpportunityAsTask(opp.text)}
                                    className="flex items-center text-sm bg-gray-200 hover:bg-gray-300 text-brevo-text-primary font-semibold py-1 px-2 rounded-md transition-colors"
                                >
                                    <PlusIcon /> Add task
                                </button>
                            </li>
                        ))}
                        </ul>
                         {opportunitySources.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <h5 className="text-sm font-semibold uppercase text-brevo-text-secondary tracking-wider">Sources from Walter's Research</h5>
                                <ul className="list-disc list-inside text-sm mt-2 space-y-1">
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
             <MarketingCollateralGenerator
                owner={client}
                kanbanApi={kanbanApi}
            />
        </div>
    );
};

export default ClientDetailView;