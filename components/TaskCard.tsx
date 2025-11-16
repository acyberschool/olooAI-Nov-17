import React from 'react';
import { Task, TaskType, BusinessLine, Client, Deal } from '../types';

const ClockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const TaskIconType = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
);

const ReminderIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
);

const MeetingIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

const typeConfig = {
    [TaskType.Task]: { icon: <TaskIconType />, color: "text-blue-400" },
    [TaskType.Reminder]: { icon: <ReminderIcon />, color: "text-yellow-400" },
    [TaskType.Meeting]: { icon: <MeetingIcon />, color: "text-green-400" },
};

interface TaskCardProps {
    task: Task;
    businessLine?: BusinessLine;
    client?: Client;
    deal?: Deal;
    onSelectBusinessLine: (id: string) => void;
    onSelectClient: (id: string) => void;
    onSelectDeal: (id: string) => void;
    onSelectTask: (task: Task) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, businessLine, client, deal, onSelectBusinessLine, onSelectClient, onSelectDeal, onSelectTask }) => {
    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
    const config = typeConfig[task.type] || typeConfig[TaskType.Task];
    
    const formatDate = (dateString?: string) => {
        if (!dateString) return null;
        return new Date(dateString).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        });
    };

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
        e.dataTransfer.setData("taskId", task.id);
        e.dataTransfer.effectAllowed = "move";
        e.stopPropagation(); // prevent card click when starting drag
    };

    const handleLinkClick = (e: React.MouseEvent, action: () => void) => {
        e.stopPropagation();
        action();
    }
    
    return (
        <div 
            draggable
            onDragStart={handleDragStart}
            onClick={() => onSelectTask(task)}
            className="bg-gray-800 rounded-lg p-4 shadow-lg border border-gray-700 hover:border-indigo-500 transition-all duration-200 cursor-pointer active:cursor-grabbing"
        >
            <div className="flex items-start">
                <span className={`mt-0.5 ${config.color}`}>{config.icon}</span>
                <div className="flex-1">
                    <h3 className="font-bold text-gray-100">{task.title}</h3>
                    {task.description && (
                        <p className="text-sm text-gray-400 mt-1">{task.description}</p>
                    )}
                </div>
            </div>
            
            <div className="mt-4 pl-7 text-xs text-gray-400 flex flex-wrap gap-2">
                {businessLine && (
                    <span onClick={(e) => handleLinkClick(e, () => onSelectBusinessLine(businessLine.id))} className="bg-gray-700/60 text-indigo-300 rounded-full px-2 py-1 cursor-pointer hover:bg-gray-700">
                        BL: {businessLine.name}
                    </span>
                )}
                {client && (
                    <span onClick={(e) => handleLinkClick(e, () => onSelectClient(client.id))} className="bg-gray-700/60 text-purple-300 rounded-full px-2 py-1 cursor-pointer hover:bg-gray-700">
                        Client: {client.name}
                    </span>
                )}
                 {deal && (
                    <span onClick={(e) => handleLinkClick(e, () => onSelectDeal(deal.id))} className="bg-gray-700/60 text-teal-300 rounded-full px-2 py-1 cursor-pointer hover:bg-gray-700">
                        Deal: {deal.name}
                    </span>
                )}
                {task.dueDate && (
                     <div className={`flex items-center rounded-full px-2 py-1 ${isOverdue ? 'bg-red-900/70 text-red-300' : 'bg-gray-700/60'}`}>
                        <ClockIcon /> {formatDate(task.dueDate)}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TaskCard;
