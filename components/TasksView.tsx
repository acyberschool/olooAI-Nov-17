
import React, { useState, useMemo } from 'react';
import { Task, KanbanStatus, BusinessLine, Client, Deal, Project, UniversalInputContext } from '../types';
import KanbanBoard from './KanbanBoard';
import CalendarView from './CalendarView';
import Tabs from './Tabs';
import PerformanceSnapshot from './PerformanceSnapshot';
import { useKanban } from '../hooks/useKanban';
import GanttChartView from './GanttChartView';

interface TasksViewProps {
  tasks: Task[];
  businessLines: BusinessLine[];
  clients: Client[];
  deals: Deal[];
  projects: Project[];
  updateTaskStatus: (taskId: string, newStatus: KanbanStatus) => void;
  onSelectBusinessLine: (id: string, tab?: string) => void;
  onSelectClient: (id: string) => void;
  onSelectDeal: (id: string) => void;
  onSelectProject: (id: string) => void;
  onSelectTask: (task: Task) => void;
  onOpenUniversalInput: (context: UniversalInputContext) => void;
  kanbanApi: ReturnType<typeof useKanban>;
}

type HomepageTab = 'Today' | 'All tasks' | 'Deals' | 'Clients' | 'Projects' | 'Social Media';

const TasksView: React.FC<TasksViewProps> = (props) => {
  const [activeTab, setActiveTab] = useState<HomepageTab>('Today');

  const tabContent = () => {
    switch (activeTab) {
        case 'Today': return <TodayTab {...props} />;
        case 'All tasks': return <AllTasksTab {...props} />;
        case 'Deals': return <DealsTab {...props} />;
        case 'Clients': return <ClientsTab {...props} />;
        case 'Projects': return <ProjectsTab {...props} />;
        case 'Social Media': return <SocialMediaTab {...props} />;
        default: return null;
    }
  }

  return (
    <div>
        <h2 className="text-2xl font-semibold text-brevo-text-primary mb-4">Homepage</h2>
        <Tabs
            tabs={['Today', 'All tasks', 'Deals', 'Clients', 'Projects', 'Social Media']}
            activeTab={activeTab}
            setActiveTab={setActiveTab as (tab: string) => void}
        />
        <div className="mt-6">
            {tabContent()}
        </div>
    </div>
  );
};

// --- TAB COMPONENTS ---

const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
);
  

const TodayTab: React.FC<TasksViewProps> = (props) => {
    const todaysTasks = useMemo(() => {
        const today = new Date();
        today.setHours(0,0,0,0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        return props.tasks.filter(task => {
            if (!task.dueDate) return false;
            const dueDate = new Date(task.dueDate);
            return dueDate >= today && dueDate < tomorrow;
        }).sort((a,b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());
    }, [props.tasks]);

    const handleAddTaskClick = () => {
        props.onOpenUniversalInput({
            placeholder: 'Remind me to call John tomorrow at 10am...'
        });
    }

    return (
        <div className="space-y-8">
            <PerformanceSnapshot 
                deals={props.deals}
                tasks={props.tasks}
            />
            <div className="bg-white p-6 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-brevo-border">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-brevo-text-primary">What's on for today</h3>
                    <button
                        onClick={handleAddTaskClick}
                        className="flex items-center bg-brevo-cta hover:bg-brevo-cta-hover text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm"
                        >
                        <PlusIcon /> Add Task
                    </button>
                </div>
                {todaysTasks.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {todaysTasks.map(task => (
                            <div key={task.id} onClick={() => props.onSelectTask(task)} className="bg-white p-4 rounded-lg border border-brevo-border hover:border-brevo-cta-hover cursor-pointer">
                            <p className="font-semibold text-brevo-text-primary">{task.title}</p>
                            <p className="text-xs text-brevo-text-secondary mt-1">{new Date(task.dueDate!).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                            {props.clients.find(c => c.id === task.clientId) && <p className="text-xs text-blue-700 mt-2">{props.clients.find(c => c.id === task.clientId)?.name}</p>}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-brevo-text-secondary py-8">Nothing scheduled for today. Enjoy your day!</p>
                )}
            </div>
            <div>
                <CalendarView {...props} />
            </div>
        </div>
    );
}

const AllTasksTab: React.FC<TasksViewProps> = (props) => {
    const [viewMode, setViewMode] = useState<'kanban' | 'calendar' | 'gantt'>('kanban');
    
    const handleAddTaskClick = () => {
        props.onOpenUniversalInput({
            placeholder: 'Create a new task...'
        });
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <button
                    onClick={handleAddTaskClick}
                    className="flex items-center bg-brevo-cta hover:bg-brevo-cta-hover text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm"
                >
                    <PlusIcon /> Add Task
                </button>
                <div className="flex items-center bg-gray-100 rounded-lg p-1">
                    <button onClick={() => setViewMode('kanban')} className={`px-4 py-1 text-sm font-medium rounded-md transition-colors ${viewMode === 'kanban' ? 'bg-brevo-cta text-white' : 'text-brevo-text-secondary hover:bg-gray-200'}`}>Kanban</button>
                    <button onClick={() => setViewMode('calendar')} className={`px-4 py-1 text-sm font-medium rounded-md transition-colors ${viewMode === 'calendar' ? 'bg-brevo-cta text-white' : 'text-brevo-text-secondary hover:bg-gray-200'}`}>Calendar</button>
                    <button onClick={() => setViewMode('gantt')} className={`px-4 py-1 text-sm font-medium rounded-md transition-colors ${viewMode === 'gantt' ? 'bg-brevo-cta text-white' : 'text-brevo-text-secondary hover:bg-gray-200'}`}>Gantt</button>
                </div>
            </div>
            {viewMode === 'kanban' && <KanbanBoard {...props} />}
            {viewMode === 'calendar' && <CalendarView {...props} />}
            {viewMode === 'gantt' && <GanttChartView tasks={props.tasks} onSelectTask={props.onSelectTask} />}
        </div>
    );
}

const DealsTab: React.FC<TasksViewProps> = ({ deals, clients, onSelectDeal, onOpenUniversalInput }) => {
    const statusChip = (status: Deal['status']) => {
        switch (status) {
          case 'Open': return 'bg-blue-100 text-blue-800';
          case 'Closed - Won': return 'bg-green-100 text-green-800';
          case 'Closed - Lost': return 'bg-red-100 text-red-800';
          default: return 'bg-gray-200 text-gray-800';
        }
    };

    const handleAddDealClick = () => {
        onOpenUniversalInput({
            placeholder: 'Create a new deal "Q3 Fumigation Contract" for client "ABC Limited" worth 5000...'
        });
    }

    return (
        <div>
            <div className="flex justify-end mb-4">
                 <button
                    onClick={handleAddDealClick}
                    className="flex items-center bg-brevo-cta hover:bg-brevo-cta-hover text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm"
                >
                    <PlusIcon /> Add Deal
                </button>
            </div>
            {deals.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {deals.map((deal) => (
                    <div key={deal.id} className="bg-white p-6 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-brevo-border flex flex-col justify-between hover:border-brevo-cta-hover transition-all cursor-pointer" onClick={() => onSelectDeal(deal.id)}>
                        <div>
                            <h3 className="font-semibold text-lg mb-2 text-brevo-text-primary">{deal.name}</h3>
                            <p className="text-brevo-text-secondary text-sm mb-4">{deal.description}</p>
                            <div className="text-sm space-y-2">
                                <p className="bg-blue-100 text-blue-800 rounded-full px-3 py-1 w-fit">Client: {clients.find(c => c.id === deal.clientId)?.name || 'N/A'}</p>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-brevo-border flex justify-end">
                            <span className={`text-xs font-semibold rounded-full px-3 py-1 ${statusChip(deal.status)}`}>{deal.status}</span>
                        </div>
                    </div>
                    ))}
                </div>
            ) : (
                 <div className="text-center py-12 text-brevo-text-secondary bg-white rounded-xl border border-dashed border-gray-300">No deals yet.</div>
            )}
        </div>
    );
};

const ClientsTab: React.FC<TasksViewProps> = ({ clients, businessLines, onSelectClient, onOpenUniversalInput, kanbanApi }) => {
    const handleAddClientClick = () => {
        onOpenUniversalInput({
            placeholder: 'Create a new client named "XYZ Logistics", they do trucking...'
        });
    }

    return (
    <div>
        <div className="flex justify-end mb-4">
                <button
                onClick={handleAddClientClick}
                className="flex items-center bg-brevo-cta hover:bg-brevo-cta-hover text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm"
            >
                <PlusIcon /> Add Client
            </button>
        </div>
        {clients.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clients.map((client) => (
                <div key={client.id} className="bg-white p-6 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-brevo-border flex flex-col justify-between hover:border-brevo-cta-hover transition-all cursor-pointer" onClick={() => onSelectClient(client.id)}>
                <div>
                    <div className="flex justify-between">
                        <h3 className="font-semibold text-lg mb-2 text-brevo-text-primary">{client.name}</h3>
                        {client.leadScore !== undefined && (
                            <span className={`text-xs font-bold rounded-full px-2 py-1 h-fit ${client.leadScore >= 80 ? 'bg-green-100 text-green-800' : client.leadScore >= 50 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                                {client.leadScore}
                            </span>
                        )}
                    </div>
                    <p className="text-brevo-text-secondary text-sm mb-4">{client.description}</p>
                    <p className="text-sm bg-gray-100 text-gray-800 rounded-full px-3 py-1 w-fit">{businessLines.find(bl => bl.id === client.businessLineId)?.name || 'N/A'}</p>
                </div>
                <div className="mt-4 pt-4 border-t border-brevo-border">
                    <p className="text-xs text-brevo-text-secondary"><strong className="font-semibold text-brevo-text-primary">AI Focus:</strong> {client.aiFocus}</p>
                </div>
                </div>
            ))}
            </div>
        ) : (
             <div className="text-center py-12 text-brevo-text-secondary bg-white rounded-xl border border-dashed border-gray-300">No clients yet.</div>
        )}
    </div>
    );
};

const ProjectsTab: React.FC<TasksViewProps> = ({ projects, clients, onSelectProject, onOpenUniversalInput }) => {
    const handleAddProjectClick = () => {
        onOpenUniversalInput({
            placeholder: 'Create a project with Nation Media Group for an AI workshop series...'
        });
    }

    return (
    <div>
        <div className="flex justify-end mb-4">
             <button
                onClick={handleAddProjectClick}
                className="flex items-center bg-brevo-cta hover:bg-brevo-cta-hover text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm"
            >
                <PlusIcon /> Add Project
            </button>
        </div>
        {projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
                <div key={project.id} className="bg-white p-6 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-brevo-border flex flex-col justify-between hover:border-brevo-cta-hover transition-all cursor-pointer" onClick={() => onSelectProject(project.id)}>
                <div>
                    <h3 className="font-semibold text-lg mb-2 text-brevo-text-primary">{project.projectName}</h3>
                    <p className="text-brevo-text-secondary text-sm mb-4">{project.goal}</p>
                    <p className="text-sm bg-blue-100 text-blue-800 rounded-full px-3 py-1 w-fit">Client: {clients.find(c => c.id === project.clientId)?.name || 'N/A'}</p>
                </div>
                <div className="mt-4 pt-4 border-t border-brevo-border flex justify-end">
                    <span className="text-xs font-semibold rounded-full px-3 py-1 bg-purple-100 text-purple-800">{project.stage}</span>
                </div>
                </div>
            ))}
            </div>
        ) : (
            <div className="text-center py-12 text-brevo-text-secondary bg-white rounded-xl border border-dashed border-gray-300">No projects yet.</div>
        )}
    </div>
    );
};

const SocialMediaTab: React.FC<TasksViewProps> = ({ businessLines, onSelectBusinessLine }) => {
    return (
        <div>
            <h3 className="text-lg font-semibold text-brevo-text-primary mb-4">Select a Business Line</h3>
            {businessLines.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {businessLines.map(bl => (
                        <div key={bl.id} className="bg-white p-6 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-brevo-border hover:border-brevo-cta-hover cursor-pointer transition-all" onClick={() => onSelectBusinessLine(bl.id, 'Social Media')}>
                             <h3 className="font-semibold text-lg mb-2 text-brevo-text-primary">{bl.name}</h3>
                             <p className="text-brevo-text-secondary text-sm mb-4">{bl.description}</p>
                             <span className="text-sm font-medium text-blue-600 flex items-center">
                                View Calendar &rarr;
                             </span>
                        </div>
                    ))}
                 </div>
            ) : (
                 <div className="text-center py-12 text-brevo-text-secondary bg-white rounded-xl border border-dashed border-gray-300">No business lines found.</div>
            )}
        </div>
    );
}

export default TasksView;
