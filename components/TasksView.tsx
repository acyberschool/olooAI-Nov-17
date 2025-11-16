import React, { useState } from 'react';
import { Task, KanbanStatus, BusinessLine, Client, Deal } from '../types';
import KanbanBoard from './KanbanBoard';
import CalendarView from './CalendarView';

interface TasksViewProps {
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

type ViewMode = 'kanban' | 'calendar';

const TasksView: React.FC<TasksViewProps> = (props) => {
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-indigo-400">Tasks</h2>
        <div className="flex items-center bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setViewMode('kanban')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'kanban' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-700'
            }`}
          >
            Kanban
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'calendar' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-700'
            }`}
          >
            Calendar
          </button>
        </div>
      </div>

      {viewMode === 'kanban' ? (
        <KanbanBoard {...props} />
      ) : (
        <CalendarView {...props} />
      )}
    </div>
  );
};

export default TasksView;
