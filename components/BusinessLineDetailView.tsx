import React, { useState } from 'react';
import { BusinessLine, Task, Client, Deal, Opportunity, Document, Playbook } from '../types';
import KanbanBoard from './KanbanBoard';
import { useKanban } from '../hooks/useKanban';
import DocumentManager from './DocumentManager';
import ClientListModal from './ClientListModal';
import MarketingCollateralGenerator from './MarketingCollateralGenerator';
import PlaybookEditorModal from './PlaybookEditorModal';

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

const EditIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" /></svg>
);


const BusinessLineDetailView: React.FC<BusinessLineDetailViewProps> = ({
  businessLine,
  playbook,
  tasks,
  clients,
  deals,
  documents,
  onBack,
  kanbanApi,
  onSelectClient,
  onSelectDeal,
  onSelectTask
}) => {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [isLoadingOpportunities, setIsLoadingOpportunities] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isPlaybookEditorOpen, setIsPlaybookEditorOpen] = useState(false);

  const handleGetOpportunities = async (expand = false) => {
    setIsLoadingOpportunities(true);
    const result = await kanbanApi.getOpportunities(businessLine, expand);
    setOpportunities(result);
    setIsLoadingOpportunities(false);
  }
  
  const handleAddOpportunityAsTask = (opportunityText: string) => {
    kanbanApi.addTask({
        title: opportunityText,
        businessLineId: businessLine.id,
    });
  }

  return (
    <div className="space-y-8">
      <button onClick={onBack} className="flex items-center text-indigo-400 hover:text-indigo-300 font-medium">
        <BackIcon />
        Back to all Business Lines
      </button>

      {/* Summary Section */}
      <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
        <h1 className="text-3xl font-bold text-white mb-2">{businessLine.name}</h1>
        <p className="text-gray-400 mb-4">{businessLine.description}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="bg-gray-800 p-3 rounded-md">
            <h4 className="font-semibold text-gray-300">Who it's for</h4>
            <p className="text-gray-400">{businessLine.customers}</p>
          </div>
          <div className="bg-gray-800 p-3 rounded-md">
            <h4 className="font-semibold text-gray-300">AI Focus</h4>
            <p className="text-gray-400">{businessLine.aiFocus}</p>
          </div>
        </div>
      </div>

      {/* Playbook Section */}
      <div>
        <h2 className="text-2xl font-bold mb-4 text-indigo-400">How this business usually runs</h2>
        <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
            <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-gray-400">This is your standard journey. The AI uses it to suggest next steps for your deals.</p>
                {playbook && (
                    <button onClick={() => setIsPlaybookEditorOpen(true)} className="flex items-center text-sm bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-3 rounded-lg transition-colors">
                        <EditIcon /> Edit Playbook
                    </button>
                )}
            </div>
            {playbook && playbook.steps.length > 0 ? (
                <ol className="space-y-4">
                    {playbook.steps.map((step, index) => (
                        <li key={step.id} className="flex items-start">
                            <span className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-indigo-600 text-white font-bold mr-4">{index + 1}</span>
                            <div>
                                <h4 className="font-semibold text-gray-200">{step.title}</h4>
                                <p className="text-gray-400 text-sm">{step.description}</p>
                            </div>
                        </li>
                    ))}
                </ol>
            ) : (
                <p className="text-gray-500 text-center py-4">No playbook has been set up for this business line yet.</p>
            )}
        </div>
      </div>
      
      {/* Work Section */}
      <div>
        <h2 className="text-2xl font-bold mb-4 text-indigo-400">Work for this business line</h2>
        <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
            <h3 className="text-xl font-semibold mb-4 text-gray-200">Tasks for {businessLine.name}</h3>
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
      </div>

      {/* Clients Section */}
       <div>
            <h2 className="text-2xl font-bold mb-4 text-indigo-400">Clients for this business line</h2>
            <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
                <button 
                    onClick={() => setIsClientModalOpen(true)} 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                    View & Add Clients
                </button>
            </div>
       </div>

      {/* AI Opportunities Section */}
      <div>
        <h2 className="text-2xl font-bold mb-4 text-indigo-400">AI Opportunities</h2>
         <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
            <div className="flex space-x-4">
                 <button 
                    onClick={() => handleGetOpportunities(false)} 
                    disabled={isLoadingOpportunities}
                    className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:bg-gray-500"
                >
                    {isLoadingOpportunities ? 'Analyzing...' : 'Ask AI for opportunities'}
                </button>
                 {opportunities.length > 0 && (
                     <button 
                        onClick={() => handleGetOpportunities(true)} 
                        disabled={isLoadingOpportunities}
                        className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:bg-gray-500"
                    >
                        {isLoadingOpportunities ? 'Expanding...' : 'Expand Search'}
                    </button>
                 )}
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
                owner={businessLine}
                kanbanApi={kanbanApi}
            />
        </div>

       {/* Documents & Notes Section */}
        <div>
            <h2 className="text-2xl font-bold mb-4 text-indigo-400">Documents & Notes</h2>
            <DocumentManager 
                documents={documents}
                owner={businessLine}
                ownerType="businessLine"
                kanbanApi={kanbanApi}
                onAddDocument={kanbanApi.addDocument}
                onDeleteDocument={kanbanApi.deleteDocument}
            />
        </div>
        
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

export default BusinessLineDetailView;
