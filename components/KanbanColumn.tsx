import React, { useState } from 'react';
import { Task, KanbanStatus, BusinessLine, Client, Deal } from '../types';
import TaskCard from './TaskCard';

interface KanbanColumnProps {
  status: KanbanStatus;
  tasks: Task[];
  businessLines: BusinessLine[];
  clients: Client[];
  deals: Deal[];
  updateTaskStatus: (taskId: string, newStatus: KanbanStatus) => void;
  onSelectBusinessLine: (id: string) => void;
  onSelectClient: (id: string) => void;
  onSelectDeal: (id: string) => void;
  onSelectTask: (task: Task) => void;
}

const statusConfig = {
    [KanbanStatus.ToDo]: {
      color: "bg-blue-900/50 border-blue-500",
      title: "Work to do",
    },
    [KanbanStatus.Doing]: {
      color: "bg-purple-900/50 border-purple-500",
      title: "Things you are doing",
    },
    [KanbanStatus.Done]: {
      color: "bg-green-900/50 border-green-500",
      title: "Things you've done",
    },
    [KanbanStatus.Terminated]: {
      color: "bg-gray-800/50 border-gray-600",
      title: "Terminated",
    },
};

const KanbanColumn: React.FC<KanbanColumnProps> = ({ 
  status, 
  tasks,
  businessLines,
  clients,
  deals,
  updateTaskStatus,
  onSelectBusinessLine,
  onSelectClient,
  onSelectDeal,
  onSelectTask
}) => {
  const config = statusConfig[status];
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const taskId = e.dataTransfer.getData("taskId");
    if (taskId) {
      updateTaskStatus(taskId, status);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      className={`rounded-lg p-4 ${config.color} ${isDragOver ? 'border-dashed border-2 bg-indigo-900/40' : 'border-t-4'} transition-all duration-200`}
    >
      <h2 className="font-bold text-lg mb-4 flex items-center justify-between">
        {config.title}
        <span className="text-sm font-normal bg-gray-700 text-gray-300 rounded-full px-2 py-1">
          {tasks.length}
        </span>
      </h2>
      <div className="space-y-4 h-[70vh] overflow-y-auto pr-2">
        {tasks.map((task) => (
          <TaskCard 
            key={task.id} 
            task={task}
            businessLine={businessLines.find(bl => bl.id === task.businessLineId)}
            client={clients.find(c => c.id === task.clientId)}
            deal={deals.find(d => d.id === task.dealId)}
            onSelectBusinessLine={onSelectBusinessLine}
            onSelectClient={onSelectClient}
            onSelectDeal={onSelectDeal}
            onSelectTask={onSelectTask}
          />
        ))}
        {tasks.length === 0 && (
          <div className="text-center text-gray-500 pt-8">
            <p>Nothing here yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default KanbanColumn;
