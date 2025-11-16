import React, { useState } from 'react';
import { Task, BusinessLine, Client, Deal } from '../types';
import { useKanban } from '../hooks/useKanban';
import CrmNoteAdder from './CrmNoteAdder';

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task;
  kanbanApi: ReturnType<typeof useKanban>;
  businessLines: BusinessLine[];
  clients: Client[];
  deals: Deal[];
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ isOpen, onClose, task, kanbanApi, businessLines, clients, deals }) => {
  const [showNoteAdder, setShowNoteAdder] = useState(false);

  const client = clients.find(c => c.id === task.clientId);
  const deal = deals.find(d => d.id === task.dealId);
  const businessLine = businessLines.find(bl => bl.id === task.businessLineId);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleString();
  };
  
  const handleSaveNote = async (note: string) => {
      if (task.clientId) {
        await kanbanApi.addCRMEntry(task.clientId, note, 'note', task.dealId);
      }
      setShowNoteAdder(false);
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-2xl border border-gray-700" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start">
            <h2 className="text-2xl font-bold mb-4 text-white">{task.title}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white">&times;</button>
        </div>
        
        <p className="text-gray-400 mb-6">{task.description || 'No description provided.'}</p>

        <div className="grid grid-cols-2 gap-4 text-sm mb-6">
            <div className="bg-gray-900/50 p-3 rounded-md">
                <h4 className="font-semibold text-gray-500">Status</h4>
                <p className="text-gray-200">{task.status}</p>
            </div>
            <div className="bg-gray-900/50 p-3 rounded-md">
                <h4 className="font-semibold text-gray-500">Due Date</h4>
                <p className="text-gray-200">{formatDate(task.dueDate)}</p>
            </div>
            {client && <div className="bg-gray-900/50 p-3 rounded-md"><h4 className="font-semibold text-gray-500">Client</h4><p className="text-gray-200">{client.name}</p></div>}
            {deal && <div className="bg-gray-900/50 p-3 rounded-md"><h4 className="font-semibold text-gray-500">Deal</h4><p className="text-gray-200">{deal.name}</p></div>}
            {businessLine && <div className="bg-gray-900/50 p-3 rounded-md"><h4 className="font-semibold text-gray-500">Business Line</h4><p className="text-gray-200">{businessLine.name}</p></div>}
            {task.priority && <div className="bg-gray-900/50 p-3 rounded-md"><h4 className="font-semibold text-gray-500">Priority</h4><p className="text-gray-200">{task.priority}</p></div>}
        </div>
        
        <div className="border-t border-gray-700 pt-6">
            <h3 className="text-lg font-semibold text-indigo-400 mb-4">CRM</h3>
            {showNoteAdder ? (
                <CrmNoteAdder onSave={handleSaveNote} onCancel={() => setShowNoteAdder(false)} />
            ) : (
                <button
                    onClick={() => setShowNoteAdder(true)}
                    disabled={!task.clientId}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                    Add Note to CRM
                </button>
            )}
            {!task.clientId && <p className="text-xs text-gray-500 mt-2">A task must be linked to a client to add a CRM note.</p>}
        </div>

      </div>
    </div>
  );
};

export default TaskDetailModal;
