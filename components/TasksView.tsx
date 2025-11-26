
import React, { useState, useMemo, useEffect } from 'react';
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
import UploadDelegateModal from './UploadDelegateModal'; // Import new modal
import TeamView from './TeamView';
import SettingsView from './SettingsView';

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
  initialTab?: string;
}

type HomepageTab = 'Today' | 'All tasks' | 'Deals' | 'Clients' | 'Projects' | 'Social Media' | 'Sales' | 'Events' | 'HR' | 'Access' | 'Settings';

const TasksView: React.FC<TasksViewProps> = (props) => {
  const [activeTab, setActiveTab] = useState<HomepageTab>((props.initialTab as HomepageTab) || 'Today');
  const [overdueReminders, setOverdueReminders] = useState<Task[]>([]);
  
  // Walter's Desk Modal State
  const [isWaltersDeskOpen, setIsWaltersDeskOpen] = useState(false);

  useEffect(() => {
    if (props.initialTab) {
        setActiveTab(props.initialTab as HomepageTab);
    }
  }, [props.initialTab]);

  const defaultBusinessLine = props.businessLines[0];

  // 4-Hour Reminder Logic
  useEffect(() => {
      const checkReminders = () => {
          const now = new Date();
          const fourHoursAgo = new Date(now.getTime() - (4 * 60 * 60 * 1000));
          
          const reminders = props.tasks.filter(t => {
              const createdAt = new Date(t.createdAt);
              return t.status === KanbanStatus.ToDo && createdAt < fourHoursAgo && (t.priority === 'High' || t.type === 'Reminder');
          });
          setOverdueReminders(reminders);
      };
      checkReminders();
      const interval = setInterval(checkReminders, 60000);
      return () => clearInterval(interval);
  }, [props.tasks]);

  const tabContent = () => {
    switch (activeTab) {
        case 'Today': return <TodayTab {...props} overdueReminders={overdueReminders} />;
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
        case 'Access': return <TeamView />;
        case 'Settings': return <SettingsView kanbanApi={props.kanbanApi} />;
        default: return null;
    }
  }

  return (
    <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-3xl font-bold text-brevo-text-primary tracking-tight">Good morning</h2>
            
            {/* New Walter's Desk Button */}
            <button 
                onClick={() => setIsWaltersDeskOpen(true)}
                className="flex items-center bg-[#111827] hover:bg-black text-white font-bold py-2.5 px-6 rounded-full shadow-soft hover:shadow-lg transition-all transform hover:-translate-y-0.5 border-2 border-white/20"
            >
                <span className="mr-2 text-xl">⚡</span>
                Walter's Desk
            </button>
        </div>
        
        <Tabs
            tabs={['Today', 'All tasks', 'Deals', 'Clients', 'Projects', 'Social Media', 'Sales', 'Events', 'HR', 'Access', 'Settings']}
            activeTab={activeTab}
            setActiveTab={setActiveTab as (tab: string) => void}
        />
        
        <div className="animate-fade-in-up">
            {tabContent()}
        </div>

        {/* Walter's Desk Modal */}
        <UploadDelegateModal 
            isOpen={isWaltersDeskOpen} 
            onClose={() => setIsWaltersDeskOpen(false)} 
            kanbanApi={props.kanbanApi} 
        />
    </div>
  );
};

const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
);

const TodayTab: React.FC<TasksViewProps & { overdueReminders: Task[] }> = (props) => {
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
            
            {/* 4-Hour Reminder Alert */}
            {props.overdueReminders.length > 0 && (
                <div className="bg-soft-rose border border-soft-rose text-soft-rose-text p-6 rounded-3xl shadow-sm animate-pulse flex items-start gap-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mt-1 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                    <div>
                        <h4 className="font-bold text-lg">Walter's Attention Needed ({props.overdueReminders.length})</h4>
                        <p className="text-sm opacity-80 mt-1 mb-3">These items are pending for more than 4 hours.</p>
                        <div className="flex flex-wrap gap-2">
                            {props.overdueReminders.slice(0,3).map(t => (
                                <div key={t.id} className="text-xs font-bold bg-white px-3 py-1 rounded-full cursor-pointer shadow-sm" onClick={() => props.onSelectTask(t)}>
                                    {t.title}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white p-8 rounded-3xl shadow-soft border border-transparent">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-brevo-text-primary">What's on for today</h3>
                    <button
                        onClick={handleAddTaskClick}
                        className="flex items-center bg-brevo-cta hover:bg-brevo-cta-hover text-white font-bold py-2 px-6 rounded-full transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                        <PlusIcon /> Add Task
                    </button>
                </div>
                {todaysTasks.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {todaysTasks.map(task => (
                            <div key={task.id} onClick={() => props.onSelectTask(task)} className="bg-brevo-sidebar p-5 rounded-2xl border border-transparent hover:border-gray-200 hover:bg-white hover:shadow-lg transition-all cursor-pointer group">
                                <p className="font-semibold text-brevo-text-primary text-lg group-hover:text-black transition-colors">{task.title}</p>
                                <p className="text-sm text-brevo-text-secondary mt-2 font-medium">{new Date(task.dueDate!).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                {props.clients.find(c => c.id === task.clientId) && (
                                    <span className="inline-block mt-3 text-xs font-bold bg-soft-blue text-soft-blue-text px-3 py-1 rounded-full">
                                        {props.clients.find(c => c.id === task.clientId)?.name}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <p className="text-brevo-text-secondary text-lg">Nothing scheduled for today.</p>
                        <p className="text-sm text-gray-400 mt-2">Enjoy your calm day!</p>
                    </div>
                )}
            </div>
            
            <div className="bg-white p-6 rounded-3xl shadow-soft">
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
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <button
                    onClick={handleAddTaskClick}
                    className="flex items-center bg-brevo-cta hover:bg-brevo-cta-hover text-white font-bold py-2 px-6 rounded-full transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                    <PlusIcon /> Add Task
                </button>
                <div className="flex items-center bg-white rounded-full p-1 shadow-sm border border-gray-100">
                    <button onClick={() => setViewMode('kanban')} className={`px-6 py-2 text-sm font-bold rounded-full transition-all ${viewMode === 'kanban' ? 'bg-brevo-cta text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>Kanban</button>
                    <button onClick={() => setViewMode('calendar')} className={`px-6 py-2 text-sm font-bold rounded-full transition-all ${viewMode === 'calendar' ? 'bg-brevo-cta text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>Calendar</button>
                    <button onClick={() => setViewMode('gantt')} className={`px-6 py-2 text-sm font-bold rounded-full transition-all ${viewMode === 'gantt' ? 'bg-brevo-cta text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>Gantt</button>
                </div>
            </div>
            {viewMode === 'kanban' && <KanbanBoard {...props} />}
            {viewMode === 'calendar' && <div className="bg-white p-6 rounded-3xl shadow-soft"><CalendarView {...props} /></div>}
            {viewMode === 'gantt' && <div className="bg-white p-6 rounded-3xl shadow-soft"><GanttChartView tasks={props.tasks} onSelectTask={props.onSelectTask} /></div>}
        </div>
    );
}

export default TasksView;
