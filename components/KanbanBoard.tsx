import React from 'react';
import { Task, KanbanStatus, BusinessLine, Client, Deal } from '../types';
import KanbanColumn from './KanbanColumn';

interface KanbanBoardProps {
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

const KanbanBoard: React.FC<KanbanBoardProps> = ({ 
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
  const columns: KanbanStatus[] = [
    KanbanStatus.ToDo,
    KanbanStatus.Doing,
    KanbanStatus.Done,
    KanbanStatus.Terminated,
  ];

  const getTasksForColumn = (status: KanbanStatus) => {
    return tasks.filter((task) => task.status === status);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
      {columns.map((status) => (
        <KanbanColumn
          key={status}
          status={status}
          tasks={getTasksForColumn(status)}
          businessLines={businessLines}
          clients={clients}
          deals={deals}
          updateTaskStatus={updateTaskStatus}
          onSelectBusinessLine={onSelectBusinessLine}
          onSelectClient={onSelectClient}
          onSelectDeal={onSelectDeal}
          onSelectTask={onSelectTask}
        />
      ))}
    </div>
  );
};

export default KanbanBoard;
