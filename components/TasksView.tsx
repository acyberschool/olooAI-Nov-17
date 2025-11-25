
import React, { useState, useMemo } from 'react';
import { Task, KanbanStatus, BusinessLine, Client, Deal, Project, UniversalInputContext } from '../types';
import KanbanBoard from './KanbanBoard';
import CalendarView from './CalendarView';
import Tabs from './Tabs';
import PerformanceSnapshot from './PerformanceSnapshot';
import { useKanban } from '../hooks/useKanban';
import GanttChartView from './GanttChartView';
import AdminDashboard from './AdminDashboard';
import SalesView from './SalesView';
import EventsView from './EventsView';
import HRView from './HRView';
import DealsView from './DealsView';
import ClientsView from './ClientsView';
import ProjectsView from './ProjectsView';
import SocialMediaTab from './SocialMediaTab';

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

type HomepageTab = 'Today' | 'All tasks' | 'Deals' | 'Clients' | 'Projects' | 'Social Media' | 'Sales' | 'Events' | 'HR' | 'Access';

const TasksView: React.FC<TasksViewProps> = (props) => {
  const [activeTab, setActiveTab] = useState<HomepageTab>('Today');

  // Mock a business line for the general social media view if needed, or use the first available one
  // Ideally, SocialMediaTab takes a businessLine. For the homepage, we might show an aggregate or select the primary one.
  // For now, we'll default to the first business line to show functionality, or placeholder.
  const defaultBusinessLine = props.businessLines[0];

  const tabContent = () => {
    switch (activeTab) {
        case 'Today': return <TodayTab {...props} />;
        case 'All tasks': return <AllTasksTab {...props} />;
        case 'Deals': return <DealsView deals={props.deals} clients={props.clients} businessLines={props.businessLines} onSelectDeal={props.onSelectDeal} onOpenUniversalInput={props.onOpenUniversalInput} onUpdateDeal={props.kanbanApi.updateDeal} />;
        case 'Clients': return <ClientsView clients={props.clients} businessLines={props.businessLines} onSelectClient={props.onSelectClient} onOpenUniversalInput={props.onOpenUniversalInput} onUpdateClient={props.kanbanApi.updateClient} kanbanApi={props.kanbanApi} />;
        case 'Projects': return <ProjectsView projects={props.projects} clients={props.clients} onSelectProject={props.onSelectProject} onOpenUniversalInput={props.onOpenUniversalInput} />;
        case 'Social Media': 
            return defaultBusinessLine ? 
                <SocialMediaTab businessLine={defaultBusinessLine} kanbanApi={props.kanbanApi} /> : 
                <div className="text-center py-10 text-gray-500">Create a Business Line to manage Social Media.</div>;
        case 'Sales': return <SalesView deals={props.deals} clients={props.clients} onSelectDeal={props.onSelectDeal} onOpenUniversalInput={props.onOpenUniversalInput} />;
        case 'Events': return <EventsView events={props.kanbanApi.events} kanbanApi={props.kanbanApi} />;
        case 'HR': return <HRView candidates={props.kanbanApi.candidates} employees={props.kanbanApi.employees} kanbanApi={props.kanbanApi} />;
        case 'Access': return <AdminDashboard />;
        default: return null;
    }
  }

  return (
    <div>
        <h2 className="text-2xl font-semibold text-brevo-text-primary mb-4">Homepage</h2>
        <Tabs
            tabs={['Today', 'All tasks', 'Deals', 'Clients', 'Projects', 'Social Media', 'Sales', 'Events', 'HR', 'Access']}
            activeTab={activeTab}
            setActiveTab={setActiveTab as (tab: string) => void}
        />
        <div className="mt-6">
            {tabContent()}
        </div>
    </div>
  );
};

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

export default TasksView;
