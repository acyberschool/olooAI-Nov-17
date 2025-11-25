
import React, { useState, useEffect } from 'react';
import { BusinessLine, Task, Client, Deal, Opportunity, Document, Playbook } from '../types';
import KanbanBoard from './KanbanBoard';
import { useKanban } from '../hooks/useKanban';
import DocumentManager from './DocumentManager';
import ClientListModal from './ClientListModal';
import MarketingCollateralGenerator from './MarketingCollateralGenerator';
import PlaybookEditorModal from './PlaybookEditorModal';
import Tabs from './Tabs';
import ProspectsView from './ProspectsView';
import RevenueView from './RevenueView';
import SocialMediaIdeas from './SocialMediaIdeas';
import CompetitorsView from './CompetitorsView';
import SocialMediaTab from './SocialMediaTab';

interface BusinessLineDetailViewProps {
  businessLine: BusinessLine;
  playbook?: Playbook;
  tasks: Task[];
  clients: Client[];
  deals: Deal[];
  documents: Document[];
  onBack: () => void;
  kanbanApi: ReturnType<typeof useKanban>;
  onSelectClient: (id: string) => void;
  onSelectDeal: (id: string) => void;
  onSelectTask: (task: Task) => void;
  initialTab?: string;
}

type BusinessLineTab = 'Overview' | 'Work' | 'Clients' | 'Revenue' | 'Social Media' | 'Prospects' | 'Playbook' | 'Documents' | 'Competitors';

const EditIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" /></svg>);

// Reusable Editable Title
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
            <h1 className="text-3xl font-semibold text-brevo-text-primary">{value}</h1>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" /></svg>
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

const BusinessLineDetailView: React.FC<BusinessLineDetailViewProps> = (props) => {
  const { businessLine, onBack, initialTab } = props;
  const [activeTab, setActiveTab] = useState<BusinessLineTab>((initialTab as BusinessLineTab) || 'Overview');
  
  useEffect(() => {
      if (initialTab) setActiveTab(initialTab as BusinessLineTab);
  }, [initialTab]);

  const tabContent = () => {
    switch (activeTab) {
      case 'Overview': return <OverviewTab {...props} />;
      case 'Work': return <WorkTab {...props} />;
      case 'Clients': return <ClientsTab {...props} />;
      case 'Revenue': return <RevenueView deals={props.deals} />;
      case 'Social Media': return <SocialMediaTab businessLine={businessLine} kanbanApi={props.kanbanApi} />;
      case 'Prospects': return <ProspectsView businessLine={businessLine} kanbanApi={props.kanbanApi} />;
      case 'Playbook': return <PlaybookTab {...props} />;
      case 'Documents': return <DocumentsTab {...props} />;
      case 'Competitors': return <CompetitorsView businessLine={props.businessLine} kanbanApi={props.kanbanApi} />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-start">
            <div>
                <button onClick={onBack} className="text-sm text-brevo-cta hover:underline font-medium mb-2">
                    &larr; Back to all Business Lines
                </button>
                <EditableTitle 
                    value={businessLine.name}
                    onSave={(val) => props.kanbanApi.updateBusinessLine(businessLine.id, { name: val })}
                />
            </div>
        </div>
      <Tabs
        tabs={['Overview', 'Work', 'Clients', 'Revenue', 'Social Media', 'Prospects', 'Playbook', 'Documents', 'Competitors']}
        activeTab={activeTab}
        setActiveTab={setActiveTab as (tab: string) => void}
      />
      <div className="mt-4">
        {tabContent()}
      </div>
    </div>
  );
};

const OverviewTab: React.FC<BusinessLineDetailViewProps> = ({ businessLine, kanbanApi, onBack }) => (
    <div className="bg-white p-6 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-brevo-border">
        <h2 className="text-xl font-semibold text-brevo-text-primary mb-4">Summary</h2>
        <div className="space-y-4">
            <EditableField 
                label="What we do (Description)"
                value={businessLine.description}
                onSave={(newValue) => kanbanApi.updateBusinessLine(businessLine.id, { description: newValue })}
                isTextarea
            />
             <EditableField 
                label="Who it's for (Customers)"
                value={businessLine.customers}
                onSave={(newValue) => kanbanApi.updateBusinessLine(businessLine.id, { customers: newValue })}
                isTextarea
            />
            <EditableField 
                label="AI Focus"
                value={businessLine.aiFocus}
                onSave={(newValue) => kanbanApi.updateBusinessLine(businessLine.id, { aiFocus: newValue })}
                isTextarea
            />
        </div>
        <div className="mt-8 pt-6 border-t border-red-200">
            <h3 className="text-lg font-semibold text-red-700 mb-2">Danger Zone</h3>
            <p className="text-sm text-brevo-text-secondary mb-3">Deleting this business line will also delete all associated clients, deals, tasks, and documents. This action cannot be undone.</p>
            <button
                onClick={async () => {
                    if (window.confirm(`Are you sure you want to delete "${businessLine.name}"? This will also delete all associated clients, deals, and tasks.`)) {
                        await kanbanApi.deleteBusinessLine(businessLine.id);
                        onBack();
                    }
                }}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
                Delete this Business Line
            </button>
        </div>
    </div>
);

const WorkTab: React.FC<BusinessLineDetailViewProps> = ({ businessLine, tasks, clients, deals, kanbanApi, onSelectClient, onSelectDeal, onSelectTask }) => (
    <div>
        <h3 className="text-xl font-semibold mb-4 text-brevo-text-primary">Tasks for {businessLine.name}</h3>
        <KanbanBoard 
            tasks={tasks} 
            businessLines={kanbanApi.businessLines}
            clients={clients}
            deals={deals}
            updateTaskStatus={kanbanApi.updateTaskStatusById}
            onSelectBusinessLine={() => {}} 
            onSelectClient={onSelectClient}
            onSelectDeal={onSelectDeal}
            onSelectTask={onSelectTask}
        />
    </div>
);

const ClientsTab: React.FC<BusinessLineDetailViewProps> = ({ clients, onSelectClient, kanbanApi, businessLine }) => {
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);
    return (
        <div className="bg-white p-6 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-brevo-border">
            <button 
                onClick={() => setIsClientModalOpen(true)} 
                className="bg-brevo-cta hover:bg-brevo-cta-hover text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
                View & Add Clients
            </button>
            {isClientModalOpen && (
                <ClientListModal
                    isOpen={isClientModalOpen}
                    onClose={() => setIsClientModalOpen(false)}
                    clients={clients}
                    businessLineId={businessLine.id}
                    onAddClient={(data) => kanbanApi.addClient(data)}
                    onSelectClient={onSelectClient}
                />
            )}
        </div>
    );
};

const PlaybookTab: React.FC<BusinessLineDetailViewProps> = ({ businessLine, playbook, kanbanApi }) => {
    const [isPlaybookEditorOpen, setIsPlaybookEditorOpen] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    
    const handleGenerate = async () => {
        setIsGenerating(true);
        await kanbanApi.regeneratePlaybook(businessLine);
        setIsGenerating(false);
    }

    return (
        <div className="bg-white p-6 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-brevo-border">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <p className="text-brevo-text-secondary">This is your standard journey. The AI uses it to suggest next steps for your deals.</p>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                    <button onClick={handleGenerate} disabled={isGenerating} className="flex items-center justify-center bg-gray-100 text-brevo-cta font-bold py-2 px-3 rounded-lg transition-colors hover:bg-gray-200">
                       {isGenerating ? 'Generating...' : 'Ask AI to generate playbook'}
                    </button>
                    {playbook && (
                        <button onClick={() => setIsPlaybookEditorOpen(true)} className="flex items-center justify-center bg-gray-100 text-brevo-cta font-bold py-2 px-3 rounded-lg transition-colors hover:bg-gray-200">
                            <EditIcon /> Edit Playbook
                        </button>
                    )}
                </div>
            </div>
            {playbook && playbook.steps.length > 0 ? (
                <ol className="space-y-4">
                    {playbook.steps.map((step, index) => (
                        <li key={step.id} className="flex items-start">
                            <span className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-brevo-cta text-white font-bold mr-4">{index + 1}</span>
                            <div>
                                <h4 className="font-semibold text-brevo-text-primary">{step.title}</h4>
                                <p className="text-brevo-text-secondary">{step.description}</p>
                            </div>
                        </li>
                    ))}
                </ol>
            ) : (
                <p className="text-brevo-text-secondary text-center py-4">No playbook has been set up for this business line yet.</p>
            )}
            {isPlaybookEditorOpen && playbook && (
                <PlaybookEditorModal
                    isOpen={isPlaybookEditorOpen}
                    onClose={() => setIsPlaybookEditorOpen(false)}
                    playbook={playbook}
                    onSave={(updatedSteps) => {
                        kanbanApi.updatePlaybook(playbook.id, updatedSteps);
                        setIsPlaybookEditorOpen(false);
                    }}
                />
            )}
        </div>
    );
};

const DocumentsTab: React.FC<BusinessLineDetailViewProps> = ({ documents, businessLine, kanbanApi }) => (
     <DocumentManager 
        documents={documents}
        owner={businessLine}
        ownerType="businessLine"
        kanbanApi={kanbanApi}
        onAddDocument={kanbanApi.addDocument}
        onDeleteDocument={kanbanApi.deleteDocument}
    />
);


export default BusinessLineDetailView;
