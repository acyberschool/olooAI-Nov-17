import React, { useMemo } from 'react';
import { Task } from '../types';

interface GanttChartViewProps {
    tasks: Task[];
    onSelectTask: (task: Task) => void;
}

const GanttChartView: React.FC<GanttChartViewProps> = ({ tasks, onSelectTask }) => {

    const { dateRange, tasksWithDates } = useMemo(() => {
        const tasksWithDates = tasks.filter(t => t.createdAt && t.dueDate);
        if (tasksWithDates.length === 0) return { dateRange: [], tasksWithDates: [] };

        const allDates = tasksWithDates.flatMap(t => [new Date(t.createdAt), new Date(t.dueDate!)]);
        let minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
        let maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));
        
        minDate.setDate(minDate.getDate() - 2);
        maxDate.setDate(maxDate.getDate() + 2);

        const range = [];
        let currentDate = new Date(minDate);
        while (currentDate <= maxDate) {
            range.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return { dateRange: range, tasksWithDates };
    }, [tasks]);

    if (tasksWithDates.length === 0) {
        return <div className="text-center py-16 text-brevo-text-secondary">No tasks with both start and end dates to display in Gantt chart.</div>;
    }

    const totalDays = dateRange.length;
    const todayIndex = dateRange.findIndex(d => d.toDateString() === new Date().toDateString());

    const getPositionAndWidth = (task: Task) => {
        const startDate = new Date(task.createdAt);
        const endDate = new Date(task.dueDate!);

        const startIndex = Math.max(0, dateRange.findIndex(d => d.toDateString() === startDate.toDateString()));
        const endIndex = Math.min(totalDays - 1, dateRange.findIndex(d => d.toDateString() === endDate.toDateString()));
        
        const left = (startIndex / totalDays) * 100;
        const width = ((endIndex - startIndex + 1) / totalDays) * 100;

        return { left: `${left}%`, width: `${width}%` };
    };
    
    const taskColors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-yellow-500', 'bg-pink-500', 'bg-indigo-500'];

    return (
        <div className="bg-white p-4 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-brevo-border overflow-x-auto">
            <div className="relative" style={{ minWidth: `${totalDays * 40}px`}}>
                {/* Headers */}
                <div className="flex sticky top-0 bg-white z-10 border-b border-brevo-border">
                    <div className="w-64 flex-shrink-0 border-r border-brevo-border p-2">
                        <h3 className="font-semibold">Tasks</h3>
                    </div>
                    <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${totalDays}, minmax(40px, 1fr))` }}>
                        {dateRange.map((date, i) => (
                            <div key={i} className="text-center text-xs text-brevo-text-secondary py-2 border-r border-gray-100">
                                {date.toLocaleDateString('default', { month: 'short', day: 'numeric' })}
                            </div>
                        ))}
                    </div>
                </div>

                 {/* Timeline Grid */}
                 <div className="absolute top-12 left-64 right-0 bottom-0 grid" style={{ gridTemplateColumns: `repeat(${totalDays}, minmax(40px, 1fr))` }}>
                    {dateRange.map((_, i) => (
                        <div key={i} className={`h-full border-r border-gray-100 ${i === todayIndex ? 'bg-blue-50' : ''}`}></div>
                    ))}
                </div>

                {/* Rows */}
                <div className="relative">
                    {tasksWithDates.map((task, index) => {
                        const { left, width } = getPositionAndWidth(task);
                        const color = taskColors[index % taskColors.length];

                        return (
                             <div key={task.id} className="flex h-12 border-b border-gray-100 items-center">
                                <div className="w-64 flex-shrink-0 border-r border-brevo-border p-2 truncate">
                                    <p className="text-sm font-medium text-brevo-text-primary" title={task.title}>{task.title}</p>
                                </div>
                                <div className="flex-1 relative h-full">
                                    <div 
                                        onClick={() => onSelectTask(task)}
                                        className={`absolute top-1/2 -translate-y-1/2 h-8 rounded-md ${color} flex items-center px-2 cursor-pointer hover:opacity-80 transition-opacity`}
                                        style={{ left, width }}
                                    >
                                        <p className="text-white text-xs font-semibold truncate">{task.title}</p>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    );
};

export default GanttChartView;