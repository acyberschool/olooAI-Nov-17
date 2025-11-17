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
      color: "border-gray-400",
      title: "To Do",
    },
    [KanbanStatus.Doing]: {
      color: "border-blue-500",
      title: "Doing",
    },
    [KanbanStatus.Done]: {
      color: "border-green-500",
      title: "Done",
    },
    [KanbanStatus.Terminated]: {
      color: "border-red-500",
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
      className={`rounded-lg p-4 bg-transparent ${isDragOver ? 'border-dashed border-2 border-green-600 bg-green-50/50' : `border-t-4 ${config.color}`} transition-all duration-200`}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-lg text-brevo-text-primary">
          {config.title}
        </h2>
        <span className="text-sm font-medium bg-gray-200 text-brevo-text-secondary rounded-full px-2 py-0.5">
          {tasks.length}
        </span>
      </div>
      <div className="space-y-4 h-[70vh] overflow-y-auto pr-2 -mr-2">
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
          <div className="text-center text-brevo-text-secondary pt-8">
            <p>Nothing here yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default KanbanColumn;