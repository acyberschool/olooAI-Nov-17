
import React, { useState, useEffect } from 'react';
import { Project, Client, BusinessLine, Task, ProjectStage, CRMEntry, Document } from '../types';
import { useKanban } from '../hooks/useKanban';
import KanbanBoard from './KanbanBoard';
import Tabs from './Tabs';
import ContextualWalter from './ContextualWalter';
import DocumentManager from './DocumentManager';
import ClientPulseView from './ClientPulseView';
import PlaybookEditorModal from './PlaybookEditorModal';

interface ProjectDetailViewProps {
  project: Project;
  client: Client;
  businessLine?: BusinessLine;
  tasks: Task[];
  kanbanApi: ReturnType<typeof useKanban>;
  onSelectClient: (id: string) => void;
  onBack: () => void;
  onSelectTask: (task: Task) => void;
}

type ProjectTab = 'Work' | 'Conversations' | 'Documents' | 'Research' | 'Playbook';

const statusOptions: ProjectStage[] = ['Lead', 'In design', 'Live', 'Closing', 'Dormant'];

// Reusable Editable Title Component
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


const ProjectDetailView: React.FC<ProjectDetailViewProps> = ({ project, client, businessLine, tasks, kanbanApi, onSelectClient, onBack, onSelectTask }) => {
    const [activeTab, setActiveTab] = useState<ProjectTab>('Work');
    const [isUpdating, setIsUpdating] = useState(false);

    const handleUpdate = async (text: string) => {
        setIsUpdating(true);
        await kanbanApi.updateProjectFromInteraction(project.id, text);
        setIsUpdating(false);
    };

    const getBusinessLineName = () => businessLine?.name || 'N/A';

    const tabContent = () => {
        switch (activeTab) {
            case 'Work':
                return (
                    <div>
                         <h3 className="text-xl font-semibold mb-4 text-brevo-text-primary">Tasks for "{project.projectName}"</h3>
                        <KanbanBoard 
                            tasks={tasks} 
                            businessLines={businessLine ? [businessLine] : []} 
                            clients={client ? [client] : []} 
                            deals={[]} 
                            updateTaskStatus={kanbanApi.updateTaskStatusById} 
                            onSelectBusinessLine={() => {}} 
                            onSelectClient={onSelectClient} 
                            onSelectDeal={() => {}} 
                            onSelectTask={onSelectTask} 
                        />
                    </div>
                );
             case 'Conversations':
                // Filter CRM entries for this project or client if explicit project ID linking isn't fully robust in mock data yet
                const projectEntries = kanbanApi.crmEntries.filter(e => e.projectId === project.id || (e.clientId === project.clientId && e.summary.includes(project.projectName)));
                return (
                    <div className="bg-white p-6 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-brevo-border">
                         {projectEntries.length > 0 ? (
                             <ul className="space-y-4">
                                 {projectEntries.map(entry => (
                                     <li key={entry.id} className="bg-gray-50 p-4 rounded-lg border border-brevo-border">
                                         <div className="flex justify-between mb-1">
                                             <span className="text-xs font-bold uppercase text-brevo-text-secondary">{entry.type}</span>
                                             <span className="text-xs text-brevo-text-secondary">{new Date(entry.createdAt).toLocaleString()}</span>
                                         </div>
                                         <p className="text-brevo-text-primary">{entry.summary}</p>
                                     </li>
                                 ))}
                             </ul>
                         ) : <p className="text-brevo-text-secondary text-center py-8">No conversations logged specifically for this project yet.</p>}
                    </div>
                );
            case 'Documents':
                // Filter documents
                 const projectDocs = kanbanApi.documents.filter(d => d.ownerId === project.id);
                 return (
                    <DocumentManager
                        documents={projectDocs}
                        owner={project}
                        ownerType="project"
                        kanbanApi={kanbanApi}
                        onAddDocument={kanbanApi.addDocument}
                        onDeleteDocument={kanbanApi.deleteDocument}
                    />
                 );
            case 'Research':
                 return <ClientPulseView client={client} kanbanApi={kanbanApi} />;
            case 'Playbook':
                 return (
                     <div className="bg-white p-6 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-brevo-border text-center text-brevo-text-secondary">
                         <p>Playbooks are typically managed at the Business Line level. <br/>View the <strong>{getBusinessLineName()}</strong> Business Line to see the standard playbook.</p>
                     </div>
                 );
            default: return null;
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <button onClick={onBack} className="text-sm text-brevo-cta hover:underline font-medium mb-2">
                    &larr; Back to all Projects
                </button>
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                    <div>
                         <EditableTitle 
                            value={project.projectName} 
                            onSave={(val) => kanbanApi.updateProject(project.id, { projectName: val })}
                         />
                         <div className="flex items-center space-x-2 mt-2">
                            <span onClick={() => onSelectClient(client.id)} className="bg-blue-100 text-blue-800 rounded-full px-3 py-1 w-fit cursor-pointer hover:bg-blue-200 text-sm font-medium">
                                Client: {client.name}
                            </span>
                            {businessLine && (
                                <span className="bg-gray-100 text-gray-600 rounded-full px-3 py-1 w-fit text-sm font-medium">
                                    Line: {businessLine.name}
                                </span>
                            )}
                         </div>
                    </div>
                    <div className="flex-shrink-0">
                        <label htmlFor="projectStatus" className="text-sm text-[#6B7280] mr-2">Project Stage</label>
                        <select
                            id="projectStatus"
                            value={project.stage}
                            onChange={(e) => kanbanApi.updateProject(project.id, { stage: e.target.value as Project['stage'] })}
                            className="bg-white border border-[#E5E7EB] rounded-md px-3 py-2 text-[#111827] focus:ring-2 focus:ring-[#15803D]"
                        >
                            {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* Contextual Walter for Updates */}
                    <ContextualWalter 
                        onUpdate={handleUpdate}
                        onApprove={() => kanbanApi.approveProjectUpdate(project.id)}
                        onDismiss={() => kanbanApi.clearProposedProjectUpdate(project.id)}
                        isUpdating={isUpdating}
                        entityName="Project"
                        proposedChanges={{
                            stage: project.proposedStage,
                            summary: project.proposedLastTouchSummary,
                            nextAction: project.proposedNextAction,
                            nextActionDate: project.proposedNextActionDueDate,
                        }}
                        placeholder="e.g., Call with NMG. They liked the pilot, want to explore a 3-month series..."
                    />

                    <Tabs 
                        tabs={['Work', 'Conversations', 'Documents', 'Research', 'Playbook']}
                        activeTab={activeTab}
                        setActiveTab={setActiveTab as (tab: string) => void}
                    />
                    
                    <div className="mt-4">
                        {tabContent()}
                    </div>
                </div>
                
                {/* Right Sidebar with Core Details */}
                <div className="space-y-4">
                    <div className="bg-white p-4 rounded-xl shadow-lg border border-[#E5E7EB]">
                        <h4 className="font-semibold text-brevo-text-secondary mb-2">Goal</h4>
                        <p>{project.goal}</p>
                    </div>
                     <div className="bg-white p-4 rounded-xl shadow-lg border border-[#E5E7EB] grid grid-cols-2 gap-4">
                        <div><h4 className="font-semibold text-brevo-text-secondary">Deal Type</h4><p>{project.dealType}</p></div>
                        <div><h4 className="font-semibold text-brevo-text-secondary">Revenue</h4><p>${project.expectedRevenue.toLocaleString()}</p></div>
                        <div className="col-span-2"><h4 className="font-semibold text-brevo-text-secondary">Impact Metric</h4><p>{project.impactMetric}</p></div>
                    </div>
                     <div className="bg-white p-4 rounded-xl shadow-lg border border-[#E5E7EB]">
                        <h4 className="font-semibold text-brevo-text-secondary mb-2">Last Touch</h4>
                        <p className="italic">"{project.lastTouchSummary}"</p>
                        <p className="text-xs text-right mt-2 text-brevo-text-secondary">{new Date(project.lastTouchDate).toLocaleDateString()}</p>
                    </div>
                     <div className="bg-white p-4 rounded-xl shadow-lg border border-brevo-cta">
                        <h4 className="font-semibold text-brevo-text-secondary mb-2">Next Action</h4>
                        <p className="font-semibold">{project.nextAction}</p>
                        <p className="text-xs text-right mt-2 text-brevo-text-secondary">Owner: {project.nextActionOwner} &bull; Due: {new Date(project.nextActionDueDate).toLocaleDateString()}</p>
                    </div>

                    <div className="mt-8 pt-6 border-t border-red-200 bg-white p-4 rounded-xl">
                        <h3 className="text-sm font-semibold text-red-700 mb-2">Danger Zone</h3>
                        <button
                            onClick={() => {
                                if (window.confirm(`Are you sure you want to delete "${project.projectName}"?`)) {
                                    kanbanApi.deleteProject(project.id);
                                    onBack();
                                }
                            }}
                            className="w-full bg-red-50 hover:bg-red-100 text-red-700 font-bold py-2 px-4 rounded-lg transition-colors text-sm border border-red-200"
                        >
                            Delete Project
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectDetailView;
