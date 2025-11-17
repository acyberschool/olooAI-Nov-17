import React, { useState, useMemo } from 'react';
import { Task, BusinessLine, Client, Deal } from '../types';
import TaskCard from './TaskCard';

interface CalendarViewProps {
  tasks: Task[];
  businessLines: BusinessLine[];
  clients: Client[];
  deals: Deal[];
  onSelectBusinessLine: (id: string) => void;
  onSelectClient: (id: string) => void;
  onSelectDeal: (id: string) => void;
  onSelectTask: (task: Task) => void;
}

const ChevronLeftIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>;
const ChevronRightIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>;

const CalendarView: React.FC<CalendarViewProps> = (props) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    props.tasks.forEach(task => {
      if (task.dueDate) {
        const dateKey = new Date(task.dueDate).toISOString().split('T')[0];
        if (!map.has(dateKey)) {
          map.set(dateKey, []);
        }
        map.get(dateKey)!.push(task);
      }
    });
    return map;
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
      setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
  }
  
  const selectedDateKey = selectedDate.toISOString().split('T')[0];
  const tasksForSelectedDate = tasksByDate.get(selectedDateKey) || [];

  const today = new Date();
  const todayKey = today.toISOString().split('T')[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg border border-[#E5E7EB]">
        <div className="flex justify-between items-center mb-4">
          <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-gray-100"><ChevronLeftIcon /></button>
          <h3 className="text-lg font-semibold text-[#111827]">
            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h3>
          <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-gray-100"><ChevronRightIcon /></button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-[#6B7280] mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <div key={day}>{day}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map(({ day, key }) => {
            const date = day ? new Date(currentDate.getFullYear(), currentDate.getMonth(), day) : null;
            const dateKey = date?.toISOString().split('T')[0];
            const hasTasks = dateKey && tasksByDate.has(dateKey);
            const isSelected = dateKey && dateKey === selectedDateKey;
            const isToday = dateKey && dateKey === todayKey;

            return (
              <div
                key={key}
                onClick={() => handleDateClick(day)}
                className={`h-20 p-2 rounded-lg flex flex-col justify-between transition-colors ${day ? 'cursor-pointer bg-white hover:bg-gray-50' : 'bg-transparent'} ${isSelected ? 'bg-[#15803D] !text-white' : ''} ${isToday ? 'border-2 border-green-600' : 'border border-[#E5E7EB]'}`}
              >
                <span className={`font-semibold ${isSelected ? 'text-white' : 'text-[#111827]'}`}>{day}</span>
                {hasTasks && <div className={`w-2 h-2 rounded-full self-end ${isSelected ? 'bg-white' : 'bg-[#15803D]'}`}></div>}
              </div>
            );
          })}
        </div>
      </div>

      <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-lg border border-[#E5E7EB]">
          <h3 className="text-lg font-semibold text-[#111827] mb-4">
              Tasks for {selectedDate.toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric' })}
          </h3>
          <div className="space-y-4 h-[60vh] overflow-y-auto pr-2">
            {tasksForSelectedDate.length > 0 ? (
                tasksForSelectedDate.map(task => (
                    <TaskCard key={task.id} task={task} {...props} />
                ))
            ) : (
                <div className="text-center text-[#6B7280] pt-16">
                    <p>No tasks due on this day.</p>
                </div>
            )}
          </div>
      </div>
    </div>
  );
};

export default CalendarView;