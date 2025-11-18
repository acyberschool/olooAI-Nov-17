
import React, { useState, useEffect } from 'react';
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
import ContextualWalter from './ContextualWalter';

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
  clients: Client[]; // Needed for changing client
}

type DealTab = 'Overview' | 'Work' | 'Documents' | 'AI Ideas' | 'History';

const PlusIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>);

const EditableTitle: React.FC<{ value: string, onSave: (val: string) => void }> = ({ value, onSave }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [text, setText] = useState(value);
    
    useEffect(() => setText(value), [value]);

    const handleSave = () => {
        if (text.trim()) onSave(text.trim());
        setIsEditing(false);
    }

    if (isEditing) {
        return (
            <div className="flex items-center gap-2">
                <input 
                    autoFocus
                    value={text} 
                    onChange={e => setText(e.target.value)} 
                    className="text-3xl font-semibold text-brevo-text-primary border-b-2 border-brevo-cta outline-none bg-transparent w-full"
                    onBlur={handleSave}
                    onKeyDown={e => e.key === 'Enter' && handleSave()}
                />
            </div>
        )
    }
    return (
        <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setIsEditing(true)}>
            <h1 className="text-3xl font-semibold text-[#111827] mb-2">{value}</h1>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" /></svg>
        </div>
    )
}

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
    <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
            <label className="text-brevo-text-secondary font-semibold">{label}</label>
             {!isEditing && (
                <button onClick={() => setIsEditing(true)} className="p-1 rounded-full text-brevo-text-secondary hover:bg-gray-200">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" /></svg>
                </button>
            )}
        </div>
        {isEditing ? (
             <div>
                {isTextarea ? (
                     <textarea value={currentValue} onChange={(e) => setCurrentValue(e.target.value)} className="w-full border-gray-300 rounded-md p-2 text-base" rows={3} />
                ) : (
                    <input type="text" value={currentValue} onChange={(e) => setCurrentValue(e.target.value)} className="w-full border-gray-300 rounded-md p-2 text-base" />
                )}
                <div className="flex justify-end space-x-2 mt-2">
                    <button onClick={handleCancel} className="text-sm px-2 py-1 rounded hover:bg-gray-100">Cancel</button>
                    <button onClick={handleSave} className="text-sm px-3 py-1 rounded bg-brevo-cta text-white">Save</button>
                </div>
            </div>
        ) : (
             <p className="text-brevo-text-primary">{value}</p>
        )}
    </div>
  );
};

const EditableValueField: React.FC<{
  label: string;
  value: number;
  currency: string;
  onSave: (newValue: number) => void;
}> = ({ label, value, currency, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value.toString());

  useEffect(() => {
    setCurrentValue(value.toString());
  }, [value]);

  const handleSave = () => {
    const numericValue = parseFloat(currentValue);
    if (!isNaN(numericValue)) {
      onSave(numericValue);
    }
    setIsEditing(false);
  };

  return (
      <div>
          <p className="text-sm text-[#6B7280]">{label}</p>
          {isEditing ? (
              <div className="flex items-center gap-2">
                  <input
                      type="number"
                      value={currentValue}
                      onChange={(e) => setCurrentValue(e.target.value)}
                      className="text-xl font-bold text-[#111827] w-32 border-b-2"
                      autoFocus
                  />
                  <button onClick={handleSave} className="text-xs px-2 py-1 rounded bg-brevo-cta text-white">Save</button>
                  <button onClick={() => setIsEditing(false)} className="text-xs px-2 py-1 rounded hover:bg-gray-100">Cancel</button>
              </div>
          ) : (
              <p onClick={() => setIsEditing(true)} className="text-xl font-bold text-[#111827] cursor-pointer hover:bg-gray-100 p-1 rounded">
                  {currency} {value.toLocaleString()}
              </p>
          )}
      </div>
  )
}

const DealDetailView: React.FC<DealDetailViewProps> = (props) => {
  const { deal, client, businessLine, onSelectClient, onSelectBusinessLine, kanbanApi } = props;
  const [activeTab, setActiveTab] = useState<DealTab>('Overview');
  const [isUpdating, setIsUpdating] = useState(false);

    const handleUpdate = async (text: string) => {
        setIsUpdating(true);
        await kanbanApi.updateDealFromInteraction(deal.id, text);
        setIsUpdating(false);
    };

    const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        kanbanApi.updateDeal(deal.id, { clientId: e.target.value });
    }
  
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
      <div className="text-base text-[#6B7280] flex items-center flex-wrap">
        <span onClick={() => onSelectBusinessLine(businessLine.id)} className="hover:underline cursor-pointer">{businessLine.name}</span>
        <span className="mx-2">&gt;</span>
        <div className="flex items-center">
             <span className="mr-2">Client:</span>
             <select
                value={client.id}
                onChange={handleClientChange}
                className="bg-transparent font-medium hover:bg-gray-100 rounded cursor-pointer focus:ring-2 focus:ring-brevo-cta"
             >
                 {props.clients.map(c => (
                     <option key={c.id} value={c.id}>{c.name}</option>
                 ))}
             </select>
        </div>
        <span className="mx-2">&gt;</span>
        <span className="text-[#111827] font-semibold">{deal.name}</span>
      </div>
      
      {/* Contextual Walter */}
       <ContextualWalter
            onUpdate={handleUpdate}
            onApprove={() => kanbanApi.approveDealUpdate(deal.id)}
            onDismiss={() => kanbanApi.clearProposedDealUpdate(deal.id)}
            isUpdating={isUpdating}
            entityName="Deal"
            proposedChanges={{
                summary: deal.proposedLastTouchSummary,
                nextAction: deal.proposedNextAction,
                nextActionDate: deal.proposedNextActionDueDate,
                status: deal.proposedStatus,
            }}
            placeholder="e.g., Spoke with Finance. Budget is approved, waiting for PO..."
        />

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

const OverviewTab: React.FC<DealDetailViewProps> = ({ deal, client, kanbanApi, onBack }) => {
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
                <div className="w-full">
                    <EditableTitle 
                        value={deal.name}
                        onSave={(val) => kanbanApi.updateDeal(deal.id, { name: val })}
                    />
                    <EditableField
                        label="Description"
                        value={deal.description}
                        onSave={(newValue) => kanbanApi.updateDeal(deal.id, { description: newValue })}
                        isTextarea
                    />
                </div>
                <div className="flex-shrink-0">
                    <label htmlFor="dealStatus" className="text-sm text-[#6B7280]">Deal Status</label>
                    <select id="dealStatus" value={deal.status} onChange={handleStatusChange} className="bg-white border border-[#E5E7EB] rounded-md px-3 py-2 text-[#111827] focus:ring-2 focus:ring-[#15803D] w-full sm:w-auto">
                        <option value="Open">Open</option>
                        <option value="Closed - Won">Closed - Won</option>
                        <option value="Closed - Lost">Closed - Lost</option>
                    </select>
                </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <EditableValueField 
                        label="Total Value"
                        value={deal.value}
                        currency={deal.currency}
                        onSave={(newValue) => kanbanApi.updateDeal(deal.id, { value: newValue })}
                    />
                    <div>
                        <p className="text-sm text-[#6B7280]">Amount Paid</p>
                        <p className="text-xl font-bold text-[#166534]">{deal.currency} {deal.amountPaid.toLocaleString()}</p>
                    </div>
                    <div>
                        <p className="text-sm text-[#6B7280]">Balance</p>
                        <p className={`text-xl font-bold ${balance > 0 ? 'text-[#B91C1C]' : 'text-[#166534]'}`}>{deal.currency} {balance.toLocaleString()}</p>
                    </div>
                    <div className="flex items-center justify-center">
                        <button onClick={() => setIsPaymentModalOpen(true)} className="bg-[#15803D] hover:bg-[#166534] text-white font-bold py-2 px-4 rounded-lg transition-colors">Log Payment</button>
                    </div>
                </div>
            </div>
            
            {/* Deal Contact Info - Updates the Client */}
            <div className="bg-white border border-brevo-border rounded-xl p-6">
                <h3 className="text-lg font-semibold text-brevo-text-primary mb-4">Contact Information (Linked to {client.name})</h3>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <EditableField 
                        label="Contact Person"
                        value={client.contactPersonName || ''}
                        onSave={(val) => kanbanApi.updateClient(client.id, { contactPersonName: val })}
                    />
                    <EditableField 
                        label="Email"
                        value={client.contactPersonEmail || ''}
                        onSave={(val) => kanbanApi.updateClient(client.id, { contactPersonEmail: val })}
                    />
                    <EditableField 
                        label="Phone"
                        value={client.contactPersonNumber || ''}
                        onSave={(val) => kanbanApi.updateClient(client.id, { contactPersonNumber: val })}
                    />
                     <EditableField 
                        label="Location"
                        value={client.officeLocation || ''}
                        onSave={(val) => kanbanApi.updateClient(client.id, { officeLocation: val })}
                    />
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
             <div className="mt-8 pt-6 border-t border-red-200">
                <h3 className="text-lg font-semibold text-red-700 mb-2">Danger Zone</h3>
                 <p className="text-sm text-brevo-text-secondary mb-3">Deleting this deal will also delete all its associated tasks and documents. This action cannot be undone.</p>
                <button
                    onClick={() => {
                        if (window.confirm(`Are you sure you want to delete the deal "${deal.name}"?`)) {
                            kanbanApi.deleteDeal(deal.id);
                            onBack();
                        }
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                    Delete this Deal
                </button>
            </div>
        </div>
    );
};

const WorkTab: React.FC<DealDetailViewProps> = ({ deal, client, businessLine, tasks, kanbanApi, onSelectBusinessLine, onSelectClient, onSelectTask }) => (
    <div>
        <h3 className="text-xl font-semibold mb-4 text-[#111827]">Tasks for "{deal.name}"</h3>
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
                <h3 className="text-xl font-semibold text-[#111827] mb-4">Next Steps & Upsell Ideas</h3>
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
                        <h4 className="font-semibold text-lg text-[#15803D] mb-3">Here are some ideas:</h4>
                        <ul className="space-y-3">
                        {opportunities.map(opp => (
                            <li key={opp.id} className="flex items-center justify-between text-[#374151]">
                                <span>- {opp.text}</span>
                                <button
                                    onClick={() => handleAddOpportunityAsTask(opp.text)}
                                    className="flex items-center text-sm bg-[#DCFCE7] hover:bg-green-200 text-[#14532D] font-semibold py-1 px-2 rounded-md transition-colors"
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
                owner={deal}
                kanbanApi={kanbanApi}
            />
        </div>
    );
};

const HistoryTab: React.FC<DealDetailViewProps> = ({ deal, kanbanApi }) => {
    const dealHistory = kanbanApi.crmEntries
        .filter(entry => entry.dealId === deal.id)
        .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-[#E5E7EB]">
            <h3 className="text-xl font-semibold text-[#111827] mb-4">Conversation History for "{deal.name}"</h3>
            {dealHistory.length > 0 ? (
                <ul className="space-y-4">
                    {dealHistory.map(entry => (
                        <li key={entry.id} className="bg-white p-4 rounded-lg border border-[#E5E7EB] flex items-start">
                            <CRMIcon type={entry.type} />
                            <div>
                                <p className="text-sm text-[#6B7280] mb-1">{new Date(entry.createdAt).toLocaleString()}</p>
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
