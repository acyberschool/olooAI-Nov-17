import React from 'react';
import { Task, BusinessLine, Client, Deal } from '../types';
import { useKanban } from '../hooks/useKanban';
import { UniversalInputContext } from '../App';

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task;
  kanbanApi: ReturnType<typeof useKanban>;
  businessLines: BusinessLine[];
  clients: Client[];
  deals: Deal[];
  onOpenUniversalInput: (context: UniversalInputContext) => void;
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ isOpen, onClose, task, kanbanApi, businessLines, clients, deals, onOpenUniversalInput }) => {
  const client = clients.find(c => c.id === task.clientId);
  const deal = deals.find(d => d.id === task.dealId);
  const businessLine = businessLines.find(bl => bl.id === task.businessLineId);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleString();
  };
  
  const handleAddNote = () => {
    if (task.clientId) {
      onOpenUniversalInput({
        clientId: task.clientId,
        dealId: task.dealId,
        task,
        placeholder: `Log a note related to the task: "${task.title}"...`,
      });
      onClose(); // Close task detail modal after opening the universal input
    }
  };

  const isGeneratable = (text: string) => {
    const keywords = ['draft', 'prepare', 'create', 'write', 'generate', 'invoice', 'proposal', 'agenda', 'concept note', 'excel', 'ppt'];
    const lowerText = text.toLowerCase();
    return keywords.some(keyword => lowerText.includes(keyword));
  }

  const handleGenerateDoc = async (subtaskText: string) => {
      await kanbanApi.generateDocumentFromSubtask(task, subtaskText);
      // Maybe add some user feedback here
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-2xl border border-brevo-border" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start">
            <h2 className="text-xl font-semibold mb-4 text-brevo-text-primary">{task.title}</h2>
            <button onClick={onClose} className="text-brevo-text-secondary hover:text-brevo-text-primary text-2xl">&times;</button>
        </div>
        
        <p className="text-brevo-text-secondary mb-6">{task.description || 'No description provided.'}</p>

        {task.subTasks && task.subTasks.length > 0 && (
            <div className="mb-6">
                <h3 className="text-base font-semibold text-green-700 mb-3">Checklist</h3>
                <div className="space-y-2">
                    {task.subTasks.map(sub => (
                        <div key={sub.id} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id={sub.id}
                                    checked={sub.isDone}
                                    onChange={() => kanbanApi.toggleSubTask(task.id, sub.id)}
                                    className="h-4 w-4 rounded border-gray-300 text-brevo-cta focus:ring-brevo-cta-hover"
                                />
                                <label htmlFor={sub.id} className={`ml-3 text-sm ${sub.isDone ? 'text-gray-400 line-through' : 'text-brevo-text-primary'}`}>
                                    {sub.text}
                                </label>
                            </div>
                            {isGeneratable(sub.text) && !sub.isDone && (
                                <button onClick={() => handleGenerateDoc(sub.text)} className="text-xs bg-blue-100 text-blue-800 font-semibold py-1 px-2 rounded-md hover:bg-blue-200">
                                    Generate with Walter
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        )}

        <div className="grid grid-cols-2 gap-4 text-sm mb-6">
            <div className="bg-gray-50 p-3 rounded-md"><h4 className="font-semibold text-brevo-text-secondary">Status</h4><p className="text-brevo-text-primary">{task.status}</p></div>
            <div className="bg-gray-50 p-3 rounded-md"><h4 className="font-semibold text-brevo-text-secondary">Due Date</h4><p className="text-brevo-text-primary">{formatDate(task.dueDate)}</p></div>
            {client && <div className="bg-gray-50 p-3 rounded-md"><h4 className="font-semibold text-brevo-text-secondary">Client</h4><p className="text-brevo-text-primary">{client.name}</p></div>}
            {deal && <div className="bg-gray-50 p-3 rounded-md"><h4 className="font-semibold text-brevo-text-secondary">Deal</h4><p className="text-brevo-text-primary">{deal.name}</p></div>}
            {businessLine && <div className="bg-gray-50 p-3 rounded-md"><h4 className="font-semibold text-brevo-text-secondary">Business Line</h4><p className="text-brevo-text-primary">{businessLine.name}</p></div>}
            {task.priority && <div className="bg-gray-50 p-3 rounded-md"><h4 className="font-semibold text-brevo-text-secondary">Priority</h4><p className="text-brevo-text-primary">{task.priority}</p></div>}
        </div>
        
        <div className="border-t border-brevo-border pt-6">
            <h3 className="text-base font-semibold text-green-700 mb-4">CRM</h3>
            <button
                onClick={handleAddNote}
                disabled={!task.clientId}
                className="bg-brevo-cta hover:bg-brevo-cta-hover text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
                Add Note to CRM
            </button>
            {!task.clientId && <p className="text-xs text-brevo-text-secondary mt-2">A task must be linked to a client to add a CRM note.</p>}
        </div>

      </div>
    </div>
  );
};

export default TaskDetailModal;