import React, { useState } from 'react';
import { Project, Client, BusinessLine, Task, ProjectStage } from '../types';
import { useKanban } from '../hooks/useKanban';
import KanbanBoard from './KanbanBoard';

interface ProjectDetailViewProps {
  project: Project;
  client?: Client;
  businessLine?: BusinessLine;
  tasks: Task[];
  kanbanApi: ReturnType<typeof useKanban>;
  onSelectClient: (id: string) => void;
  onBack: () => void;
  onSelectTask: (task: Task) => void;
}

const statusOptions: ProjectStage[] = ['Lead', 'In design', 'Live', 'Closing', 'Dormant'];

const statusChipColor = (status: Project['stage']) => {
    switch (status) {
      case 'Lead': return 'bg-gray-200 text-gray-800';
      case 'In design': return 'bg-yellow-100 text-yellow-800';
      case 'Live': return 'bg-blue-100 text-blue-800';
      case 'Closing': return 'bg-green-100 text-green-800';
      case 'Dormant': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-200 text-gray-800';
    }
};

const ProjectDetailView: React.FC<ProjectDetailViewProps> = ({ project, client, businessLine, tasks, kanbanApi, onSelectClient, onBack, onSelectTask }) => {
    const [interactionText, setInteractionText] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    const handleUpdateFromInteraction = async () => {
        if (!interactionText.trim()) return;
        setIsUpdating(true);
        await kanbanApi.updateProjectFromInteraction(project.id, interactionText);
        setIsUpdating(false);
        setInteractionText('');
    };

    const handleApprove = () => {
        kanbanApi.approveProjectUpdate(project.id);
    };

    return (
        <div className="space-y-6">
            <div>
                <button onClick={onBack} className="text-sm text-brevo-cta hover:underline font-medium mb-2">
                    &larr; Back to all Projects
                </button>
                <div className="flex justify-between items-start">
                    <h1 className="text-3xl font-semibold text-brevo-text-primary">{project.projectName}</h1>
                    <div className="flex-shrink-0">
                        <label htmlFor="projectStatus" className="text-sm text-[#6B7280]">Project Stage</label>
                        <select
                            id="projectStatus"
                            value={project.stage}
                            onChange={(e) => kanbanApi.updateProject(project.id, { stage: e.target.value as Project['stage'] })}
                            className="bg-white border border-[#E5E7EB] rounded-md px-3 py-2 text-[#111827] focus:ring-2 focus:ring-[#15803D] w-full sm:w-auto"
                        >
                            {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* Main Project Details Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* Interaction Update Section */}
                    <div className="bg-white p-6 rounded-xl shadow-lg border border-[#E5E7EB]">
                        <h3 className="text-lg font-semibold text-brevo-text-primary mb-2">Update Project from Interaction</h3>
                        <p className="text-sm text-brevo-text-secondary mb-4">Paste an email, meeting notes, or a quick summary. Walter will update the project record and propose the next step.</p>
                        <textarea
                            value={interactionText}
                            onChange={(e) => setInteractionText(e.target.value)}
                            rows={5}
                            placeholder="e.g., Call with NMG. They liked the pilot, want to explore a 3-month series..."
                            className="w-full bg-white border border-[#E5E7EB] rounded-md px-3 py-2 text-[#111827] focus:ring-2 focus:ring-[#15803D]"
                        />
                        <button
                            onClick={handleUpdateFromInteraction}
                            disabled={isUpdating || !interactionText.trim()}
                            className="mt-3 bg-brevo-cta hover:bg-brevo-cta-hover text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:bg-gray-300"
                        >
                            {isUpdating ? 'Analyzing...' : 'Update with Walter'}
                        </button>
                    </div>

                    {/* AI Proposed Changes Section */}
                    {project.proposedLastTouchSummary && (
                        <div className="bg-blue-50 p-6 rounded-xl border-2 border-dashed border-blue-300">
                             <h3 className="text-lg font-semibold text-blue-800 mb-4">Walter's Proposed Updates</h3>
                             <div className="space-y-3 text-sm">
                                <p><strong className="text-brevo-text-secondary">New Stage:</strong> <span className={`font-semibold rounded-full px-2 py-1 text-xs ${statusChipColor(project.proposedStage!)}`}>{project.proposedStage}</span></p>
                                <p><strong className="text-brevo-text-secondary">New Last Touch Summary:</strong> {project.proposedLastTouchSummary}</p>
                                <p><strong className="text-brevo-text-secondary">Proposed Next Action:</strong> {project.proposedNextAction} (Due: {new Date(project.proposedNextActionDueDate!).toLocaleDateString()})</p>
                             </div>
                              <div className="flex items-center space-x-3 mt-4">
                                <button onClick={handleApprove} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">Approve</button>
                                <button onClick={() => kanbanApi.clearProposedProjectUpdate(project.id)} className="text-blue-700 hover:underline text-sm">Dismiss</button>
                            </div>
                        </div>
                    )}
                    
                    {/* Tasks Section */}
                    <div>
                        <h3 className="text-xl font-semibold mb-4 text-[#111827]">Tasks for "{project.projectName}"</h3>
                        <KanbanBoard tasks={tasks} businessLines={businessLine ? [businessLine] : []} clients={client ? [client] : []} deals={[]} updateTaskStatus={kanbanApi.updateTaskStatusById} onSelectBusinessLine={() => {}} onSelectClient={onSelectClient} onSelectDeal={() => {}} onSelectTask={onSelectTask} />
                    </div>
                </div>
                
                {/* Right Sidebar with Core Details */}
                <div className="space-y-4">
                    <div className="bg-white p-4 rounded-xl shadow-lg border border-[#E5E7EB]">
                        <h4 className="font-semibold text-brevo-text-secondary mb-2">Goal</h4>
                        <p>{project.goal}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-lg border border-[#E5E7EB]">
                        <h4 className="font-semibold text-brevo-text-secondary mb-2">Partner</h4>
                        <p className="font-semibold text-brevo-cta">{project.partnerName}</p>
                    </div>
                     <div className="bg-white p-4 rounded-xl shadow-lg border border-[#E5E7EB] grid grid-cols-2 gap-4">
                        <div><h4 className="font-semibold text-brevo-text-secondary">Deal Type</h4><p>{project.dealType}</p></div>
                        <div><h4 className="font-semibold text-brevo-text-secondary">Expected Revenue</h4><p>${project.expectedRevenue.toLocaleString()}</p></div>
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
                </div>
            </div>
        </div>
    );
};

export default ProjectDetailView;