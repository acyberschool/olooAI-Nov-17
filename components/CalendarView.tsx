import React, { useState, useMemo } from 'react';
import { Task, BusinessLine, Client, Deal } from '../types';
import TaskCard from './TaskCard';
import { UniversalInputContext } from '../App';

interface CalendarViewProps {
  tasks: Task[];
  businessLines: BusinessLine[];
  clients: Client[];
  deals: Deal[];
  onSelectBusinessLine: (id: string) => void;
  onSelectClient: (id: string) => void;
  onSelectDeal: (id: string) => void;
  onSelectTask: (task: Task) => void;
  onOpenUniversalInput: (context: UniversalInputContext) => void;
}

const ChevronLeftIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>;
const ChevronRightIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>;

// Helper to get a stable, local timezone based date key (YYYY-MM-DD)
const toLocalDateKey = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

const CalendarView: React.FC<CalendarViewProps> = (props) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const { tasksByDate, unscheduledTasks } = useMemo(() => {
    const map = new Map<string, Task[]>();
    const unscheduled: Task[] = [];
    props.tasks.forEach(task => {
      if (task.dueDate) {
        // FIX: Use a local date key to avoid timezone bugs where tasks appear on the wrong day.
        const dateKey = toLocalDateKey(new Date(task.dueDate));
        if (!map.has(dateKey)) {
          map.set(dateKey, []);
        }
        map.get(dateKey)!.push(task);
      } else {
        unscheduled.push(task);
      }
    });
    return { tasksByDate: map, unscheduledTasks: unscheduled };
  }, [props.tasks]);

  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startDay = startOfMonth.getDay();
  const daysInMonth = endOfMonth.getDate();

  const days = Array.from({ length: startDay }, (_, i) => ({ day: null, key: `empty-start-${i}` }))
    .concat(Array.from({ length: daysInMonth }, (_, i) => ({ day: i + 1, key: `day-${i + 1}` })));

  const changeMonth = (amount: number) => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + amount, 1));
  };

  const handleDateClick = (day: number | null) => {
      if (!day) return;
      const newSelectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      setSelectedDate(newSelectedDate);
  }
  
  const handleCreateTaskForDate = (day: number | null) => {
      if (!day) return;
      const dateForTask = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      props.onOpenUniversalInput({
          date: dateForTask,
          placeholder: `Create a new task for ${dateForTask.toLocaleDateString()}...`
      });
  }

  // FIX: Use the same local date keying logic for selection.
  const selectedDateKey = toLocalDateKey(selectedDate);
  const tasksForSelectedDate = tasksByDate.get(selectedDateKey) || [];

  const today = new Date();
  const todayKey = toLocalDateKey(today);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-brevo-border">
        <div className="flex justify-between items-center mb-4">
          <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-gray-100"><ChevronLeftIcon /></button>
          <h3 className="text-lg font-semibold text-brevo-text-primary">
            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h3>
          <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-gray-100"><ChevronRightIcon /></button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-brevo-text-secondary mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <div key={day}>{day}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map(({ day, key }) => {
            const date = day ? new Date(currentDate.getFullYear(), currentDate.getMonth(), day) : null;
            // FIX: Use the same local date keying logic for display.
            const dateKey = date ? toLocalDateKey(date) : null;
            const hasTasks = dateKey && tasksByDate.has(dateKey);
            const isSelected = dateKey && dateKey === selectedDateKey;
            const isToday = dateKey && dateKey === todayKey;

            return (
              <div
                key={key}
                onClick={() => handleDateClick(day)}
                onDoubleClick={() => handleCreateTaskForDate(day)}
                title={day ? 'Double-click to add a task' : ''}
                className={`h-20 p-2 rounded-lg flex flex-col justify-between transition-colors ${day ? 'cursor-pointer bg-white hover:bg-gray-50' : 'bg-transparent'} ${isSelected ? 'bg-brevo-cta text-white' : ''} ${isToday ? 'border-2 border-brevo-cta' : 'border border-brevo-border'}`}
              >
                <span className={`font-semibold ${isSelected ? 'text-white' : 'text-brevo-text-primary'}`}>{day}</span>
                {hasTasks && <div className={`w-2 h-2 rounded-full self-end ${isSelected ? 'bg-white' : 'bg-brevo-cta'}`}></div>}
              </div>
            );
          })}
        </div>
      </div>

      <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-brevo-border">
          <div className="h-[75vh] overflow-y-auto pr-2 -mr-4 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-brevo-text-primary mb-4">
                  Tasks for {selectedDate.toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric' })}
              </h3>
              <div className="space-y-4">
                {tasksForSelectedDate.length > 0 ? (
                    tasksForSelectedDate.map(task => (
                        <TaskCard key={task.id} task={task} {...props} />
                    ))
                ) : (
                    <div className="text-center text-brevo-text-secondary py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                        <p>No tasks due on this day.</p>
                    </div>
                )}
              </div>
            </div>
            
            <div className="pt-6 border-t border-brevo-border">
              <h3 className="text-lg font-semibold text-brevo-text-primary mb-4">
                  Unscheduled Tasks
              </h3>
              <div className="space-y-4">
                {unscheduledTasks.length > 0 ? (
                    unscheduledTasks.map(task => (
                        <TaskCard key={task.id} task={task} {...props} />
                    ))
                ) : (
                    <div className="text-center text-brevo-text-secondary py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                        <p>No unscheduled tasks.</p>
                    </div>
                )}
              </div>
            </div>
          </div>
      </div>
    </div>
  );
};

export default CalendarView;