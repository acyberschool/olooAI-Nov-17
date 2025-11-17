import React, { useState } from 'react';
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
}

type BusinessLineTab = 'Overview' | 'Work' | 'Clients' | 'Revenue' | 'Prospects' | 'Playbook' | 'Documents' | 'Revenue Ideas' | 'Competitors';

const EditIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" /></svg>);

const BusinessLineDetailView: React.FC<BusinessLineDetailViewProps> = (props) => {
  const { businessLine, onBack } = props;
  const [activeTab, setActiveTab] = useState<BusinessLineTab>('Overview');
  
  const tabContent = () => {
    switch (activeTab) {
      case 'Overview': return <OverviewTab {...props} />;
      case 'Work': return <WorkTab {...props} />;
      case 'Clients': return <ClientsTab {...props} />;
      case 'Revenue': return <RevenueView deals={props.deals} />;
      case 'Prospects': return <ProspectsView businessLine={businessLine} kanbanApi={props.kanbanApi} />;
      case 'Playbook': return <PlaybookTab {...props} />;
      case 'Documents': return <DocumentsTab {...props} />;
      case 'Revenue Ideas': return <RevenueIdeasTab {...props} />;
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
                <h1 className="text-2xl font-semibold text-brevo-text-primary">{businessLine.name}</h1>
            </div>
        </div>
      <Tabs
        tabs={['Overview', 'Work', 'Clients', 'Revenue', 'Prospects', 'Playbook', 'Documents', 'Revenue Ideas', 'Competitors']}
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

const OverviewTab: React.FC<BusinessLineDetailViewProps> = ({ businessLine }) => (
    <div className="bg-white p-6 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-brevo-border">
        <h2 className="text-lg font-semibold text-brevo-text-primary mb-4">Summary</h2>
        <p className="text-brevo-text-secondary mb-4">{businessLine.description}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
                <h4 className="font-semibold text-brevo-text-primary">Who it's for</h4>
                <p className="text-brevo-text-secondary">{businessLine.customers}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
                <h4 className="font-semibold text-brevo-text-primary">AI Focus</h4>
                <p className="text-brevo-text-secondary">{businessLine.aiFocus}</p>
            </div>
        </div>
    </div>
);

const WorkTab: React.FC<BusinessLineDetailViewProps> = ({ businessLine, tasks, clients, deals, kanbanApi, onSelectClient, onSelectDeal, onSelectTask }) => (
    <div>
        <h3 className="text-lg font-semibold mb-4 text-brevo-text-primary">Tasks for {businessLine.name}</h3>
        <KanbanBoard 
            tasks={tasks} 
            businessLines={kanbanApi.businessLines}
            clients={clients}
            deals={deals}
            updateTaskStatus={kanbanApi.updateTaskStatusById}
            onSelectBusinessLine={() => {}} // Already here, no-op
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
            <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-brevo-text-secondary">This is your standard journey. The AI uses it to suggest next steps for your deals.</p>
                <div className="flex items-center space-x-2">
                    <button onClick={handleGenerate} disabled={isGenerating} className="flex items-center text-sm bg-gray-100 text-brevo-cta font-bold py-2 px-3 rounded-lg transition-colors hover:bg-gray-200">
                       {isGenerating ? 'Generating...' : 'Ask AI to generate playbook'}
                    </button>
                    {playbook && (
                        <button onClick={() => setIsPlaybookEditorOpen(true)} className="flex items-center text-sm bg-gray-100 text-brevo-cta font-bold py-2 px-3 rounded-lg transition-colors hover:bg-gray-200">
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
                                <p className="text-brevo-text-secondary text-sm">{step.description}</p>
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

const RevenueIdeasTab: React.FC<BusinessLineDetailViewProps> = ({ businessLine, deals, kanbanApi }) => {
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
    const [isLoadingOpportunities, setIsLoadingOpportunities] = useState(false);
    
    const totalRevenue = deals.filter(d => d.status === 'Closed - Won').reduce((sum, deal) => sum + deal.value, 0);

    const handleGetOpportunities = async (expand = false) => {
        setIsLoadingOpportunities(true);
        const result = await kanbanApi.getOpportunities(businessLine, expand);
        setOpportunities(result);
        setIsLoadingOpportunities(false);
    };

    const handleAddOpportunityAsTask = (opportunityText: string) => {
        kanbanApi.addTask({
            title: opportunityText,
            businessLineId: businessLine.id,
        });
    };

    const PlusIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>);

    return (
        <div className="space-y-6">
            <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                <h3 className="text-sm font-semibold text-green-800 uppercase tracking-wider">Total Revenue Earned</h3>
                <p className="text-3xl font-bold text-brevo-text-primary">${totalRevenue.toLocaleString()}</p>
            </div>

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
                    {opportunities.length > 0 && (
                        <button 
                            onClick={() => handleGetOpportunities(true)} 
                            disabled={isLoadingOpportunities}
                            className="bg-gray-200 hover:bg-gray-300 text-brevo-text-primary font-bold py-2 px-4 rounded-lg transition-colors disabled:bg-gray-300"
                        >
                            {isLoadingOpportunities ? 'Expanding...' : 'Get more ideas'}
                        </button>
                    )}
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
                                    <PlusIcon />
                                    Add task
                                </button>
                            </li>
                        ))}
                        </ul>
                    </div>
                )}
            </div>

            <SocialMediaIdeas businessLine={businessLine} kanbanApi={kanbanApi} />

            <div className="bg-white p-6 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-brevo-border">
                <h3 className="text-lg font-semibold text-brevo-text-primary mb-4">Marketing Collateral Prompts</h3>
                 <MarketingCollateralGenerator
                    owner={businessLine}
                    kanbanApi={kanbanApi}
                />
            </div>
        </div>
    );
};

export default BusinessLineDetailView;