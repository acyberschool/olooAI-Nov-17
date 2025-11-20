
import React, { useState, useEffect, useRef } from 'react';
import { Task, BusinessLine, Client, Deal, KanbanStatus, TaskType, UniversalInputContext } from '../types';
import { useKanban } from '../hooks/useKanban';
import ScheduleMeetingModal from './ScheduleMeetingModal';

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

const PencilIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" /></svg>);
const MoreIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>);
const SparkleIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 2a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 2zM5.22 5.22a.75.75 0 011.06 0l1.06 1.06a.75.75 0 01-1.06 1.06l-1.06-1.06a.75.75 0 010-1.06zM2 10a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5A.75.75 0 012 10zm3.22 4.78a.75.75 0 010-1.06l1.06-1.06a.75.75 0 111.06 1.06l-1.06 1.06a.75.75 0 01-1.06 0zm7.56-9.56a.75.75 0 011.06 0l1.06 1.06a.75.75 0 11-1.06 1.06l-1.06-1.06a.75.75 0 01-1.06 0zM17 10a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5A.75.75 0 0117 10zm-3.22 4.78a.75.75 0 010-1.06l1.06-1.06a.75.75 0 111.06 1.06l-1.06 1.06a.75.75 0 01-1.06 0zM10 17a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5A.75.75 0 0110 17z" clipRule="evenodd" /></svg>);

const getPrimaryAction = (text: string) => {
    const lowerText = text.toLowerCase();
    if (['draft', 'prepare', 'create', 'write', 'generate', 'invoice', 'proposal', 'agenda'].some(kw => lowerText.includes(kw))) {
        return { action: 'generate', label: 'Generate with Walter' };
    }
    if (['schedule', 'meeting', 'call', 'organise'].some(kw => lowerText.includes(kw))) {
        return { action: 'meet', label: 'Schedule with Google Meet' };
    }
    if (['research', 'find', 'look up', 'investigate'].some(kw => lowerText.includes(kw))) {
        return { action: 'research', label: 'Research with Walter' };
    }
    return null;
}

const SubtaskItem: React.FC<{
    sub: Task['subTasks'][0],
    task: Task,
    kanbanApi: ReturnType<typeof useKanban>,
    onShowResearch: (title: string, content: string) => void,
    clients: Client[],
}> = ({ sub, task, kanbanApi, onShowResearch, clients }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const primaryAction = getPrimaryAction(sub.text);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handlePrimaryAction = async () => {
        if (!primaryAction) return;
        
        switch (primaryAction.action) {
            case 'generate':
                setIsLoading(true);
                await kanbanApi.generateDocumentFromSubtask(task, sub.text);
                setIsLoading(false);
                break;
            case 'meet':
                window.open('https://meet.google.com/new', '_blank');
                break;
            case 'research':
                setIsLoading(true);
                const context = `For task "${task.title}" related to client "${clients.find(c => c.id === task.clientId)?.name || 'N/A'}"`;
                const result = await kanbanApi.researchSubtask(sub.text, context);
                onShowResearch(`Research: ${sub.text}`, result);
                setIsLoading(false);
                break;
        }
    }
    
    const handleSetReminder = () => {
        kanbanApi.addTask({ title: `Reminder: ${sub.text}`, itemType: TaskType.Reminder, clientId: task.clientId, dealId: task.dealId, businessLineId: task.businessLineId });
        setIsMenuOpen(false);
    }
    
    const handlePromoteToTask = () => {
        kanbanApi.promoteSubtaskToTask(task.id, sub.id);
        setIsMenuOpen(false);
    }

    const handleTranscribe = () => {
        setIsRecording(true);
        setTimeout(async () => {
            await kanbanApi.generateMeetingTranscript(task.id);
            setIsRecording(false);
        }, 3000);
        setIsMenuOpen(false);
    }

    return (
         <div className="flex items-center justify-between bg-gray-50 p-2 rounded-md hover:bg-gray-100 transition-colors group">
            <div className="flex items-center">
                <input
                    type="checkbox"
                    id={sub.id}
                    checked={sub.isDone}
                    onChange={() => kanbanApi.toggleSubTask(task.id, sub.id)}
                    className="h-4 w-4 rounded border-gray-300 text-brevo-cta focus:ring-brevo-cta-hover"
                />
                <label htmlFor={sub.id} className={`ml-3 text-base ${sub.isDone ? 'text-gray-400 line-through' : 'text-brevo-text-primary'}`}>
                    {sub.text}
                </label>
                {isRecording && <span className="ml-2 text-xs text-red-500 font-semibold animate-pulse">Recording Agent Active...</span>}
            </div>
            {!sub.isDone && (
                <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {primaryAction && (
                        <button onClick={handlePrimaryAction} disabled={isLoading} className="text-sm bg-blue-100 text-blue-800 font-semibold py-1 px-2 rounded-md hover:bg-blue-200 disabled:bg-gray-200">
                            {isLoading ? 'Working...' : primaryAction.label}
                        </button>
                    )}
                    <div className="relative" ref={menuRef}>
                        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-1 rounded-full hover:bg-gray-200">
                            <MoreIcon />
                        </button>
                        {isMenuOpen && (
                            <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg z-10 border border-brevo-border">
                                <ul className="py-1">
                                    <li onClick={handleTranscribe} className="px-4 py-2 text-sm text-brevo-text-primary hover:bg-gray-100 cursor-pointer flex items-center"><SparkleIcon /> Start Transcription</li>
                                    <li onClick={handleSetReminder} className="px-4 py-2 text-sm text-brevo-text-primary hover:bg-gray-100 cursor-pointer">Set Reminder</li>
                                    <li onClick={handlePromoteToTask} className="px-4 py-2 text-sm text-brevo-text-primary hover:bg-gray-100 cursor-pointer">Create Main Task</li>
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ isOpen, onClose, task, kanbanApi, businessLines, clients, deals, onOpenUniversalInput }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState<Partial<Task>>(task);
  const [researchData, setResearchData] = useState<{ title: string, content: string } | null>(null);
  const [isRefineModalOpen, setIsRefineModalOpen] = useState(false);
  const [refineCommand, setRefineCommand] = useState('');


  useEffect(() => {
    if (isOpen) {
        setIsEditing(false);
        setEditedTask({
            ...task,
            dueDate: task.dueDate ? new Date(new Date(task.dueDate).getTime() - new Date().getTimezoneOffset()*60000).toISOString().slice(0,16) : undefined
        });
    }
  }, [isOpen, task]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditedTask(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    const taskToSave = {
        ...editedTask,
        dueDate: editedTask.dueDate ? new Date(editedTask.dueDate).toISOString() : undefined,
    };
    kanbanApi.updateTask(task.id, taskToSave);
    setIsEditing(false);
    onClose(); 
  }

  const handleAddNote = () => {
    if (task.clientId) {
      onOpenUniversalInput({
        clientId: task.clientId,
        dealId: task.dealId,
        task,
        placeholder: `Log a note related to the task: "${task.title}"...`,
      });
      onClose();
    }
  };
  
  const handleRefineChecklist = async () => {
    if (!refineCommand.trim()) return;
    await kanbanApi.refineTaskChecklist(task.id, refineCommand);
    setIsRefineModalOpen(false);
    setRefineCommand('');
  }

  if (!isOpen) return null;

  const currentClient = clients.find(c => c.id === task.clientId);
  const currentDeal = deals.find(d => d.id === task.dealId);
  const currentProject = kanbanApi.projects.find(p => p.id === task.projectId);
  const currentBusinessLine = businessLines.find(bl => bl.id === task.businessLineId);
  const currentAssignee = kanbanApi.teamMembers.find(tm => tm.id === task.assigneeId);

  return (
    <>
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-2xl border border-brevo-border max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-4">
            {isEditing ? (
                 <input type="text" name="title" value={editedTask.title || ''} onChange={handleInputChange} className="text-xl font-semibold text-brevo-text-primary w-full border-b-2 border-brevo-cta focus:outline-none" />
            ) : (
                <h2 className="text-xl font-semibold text-brevo-text-primary">{task.title}</h2>
            )}
            <div className="flex items-center space-x-2">
                {!isEditing && <button onClick={() => setIsEditing(true)} className="p-2 text-brevo-text-secondary hover:text-brevo-text-primary rounded-full hover:bg-gray-100"><PencilIcon /></button>}
                <button onClick={onClose} className="text-brevo-text-secondary hover:text-brevo-text-primary text-2xl">&times;</button>
            </div>
        </div>
        
        {isEditing ? (
             <textarea name="description" value={editedTask.description || ''} onChange={handleInputChange} rows={3} className="w-full text-brevo-text-secondary mb-6 border border-brevo-border rounded-md p-2 focus:ring-brevo-cta focus:border-brevo-cta" />
        ) : (
            <p className="text-brevo-text-secondary mb-6">{task.description || 'No description provided.'}</p>
        )}

        {task.subTasks && task.subTasks.length > 0 && (
            <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-base font-semibold text-green-700">Checklist & Agents</h3>
                     <button onClick={() => setIsRefineModalOpen(true)} className="flex items-center text-xs bg-gray-100 text-brevo-cta font-semibold py-1 px-2 rounded-md hover:bg-gray-200">
                         <SparkleIcon /> Refine with Walter
                     </button>
                </div>
                <div className="space-y-2">
                    {task.subTasks.map(sub => (
                        <SubtaskItem 
                            key={sub.id} 
                            sub={sub} 
                            task={task} 
                            kanbanApi={kanbanApi} 
                            onShowResearch={(title, content) => setResearchData({title, content})}
                            clients={clients}
                        />
                    ))}
                </div>
            </div>
        )}

        <div className="grid grid-cols-2 gap-4 text-base mb-6">
            {isEditing ? (
                <>
                    <div className="bg-gray-50 p-3 rounded-md"><h4 className="font-semibold text-brevo-text-secondary mb-1">Status</h4><select name="status" value={editedTask.status} onChange={handleInputChange} className="w-full bg-white border border-brevo-border rounded-md p-1">{Object.values(KanbanStatus).map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                    <div className="bg-gray-50 p-3 rounded-md"><h4 className="font-semibold text-brevo-text-secondary mb-1">Due Date</h4><input type="datetime-local" name="dueDate" value={editedTask.dueDate || ''} onChange={handleInputChange} className="w-full bg-white border border-brevo-border rounded-md p-1"/></div>
                    <div className="bg-gray-50 p-3 rounded-md"><h4 className="font-semibold text-brevo-text-secondary mb-1">Client</h4><select name="clientId" value={editedTask.clientId || ''} onChange={handleInputChange} className="w-full bg-white border border-brevo-border rounded-md p-1"><option value="">None</option>{clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                    <div className="bg-gray-50 p-3 rounded-md"><h4 className="font-semibold text-brevo-text-secondary mb-1">Deal</h4><select name="dealId" value={editedTask.dealId || ''} onChange={handleInputChange} className="w-full bg-white border border-brevo-border rounded-md p-1"><option value="">None</option>{deals.filter(d => d.clientId === editedTask.clientId).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
                    <div className="bg-gray-50 p-3 rounded-md"><h4 className="font-semibold text-brevo-text-secondary mb-1">Project</h4><select name="projectId" value={editedTask.projectId || ''} onChange={handleInputChange} className="w-full bg-white border border-brevo-border rounded-md p-1"><option value="">None</option>{kanbanApi.projects.filter(p => !editedTask.clientId || p.clientId === editedTask.clientId).map(p => <option key={p.id} value={p.id}>{p.projectName}</option>)}</select></div>
                    <div className="bg-gray-50 p-3 rounded-md"><h4 className="font-semibold text-brevo-text-secondary mb-1">Business Line</h4><select name="businessLineId" value={editedTask.businessLineId || ''} onChange={handleInputChange} className="w-full bg-white border border-brevo-border rounded-md p-1"><option value="">None</option>{businessLines.map(bl => <option key={bl.id} value={bl.id}>{bl.name}</option>)}</select></div>
                    <div className="bg-gray-50 p-3 rounded-md"><h4 className="font-semibold text-brevo-text-secondary mb-1">Priority</h4><select name="priority" value={editedTask.priority || 'Medium'} onChange={handleInputChange} className="w-full bg-white border border-brevo-border rounded-md p-1"><option>Low</option><option>Medium</option><option>High</option></select></div>
                    <div className="bg-gray-50 p-3 rounded-md"><h4 className="font-semibold text-brevo-text-secondary mb-1">Assignee</h4><select name="assigneeId" value={editedTask.assigneeId || ''} onChange={handleInputChange} className="w-full bg-white border border-brevo-border rounded-md p-1"><option value="">Unassigned</option>{kanbanApi.teamMembers.map(tm => <option key={tm.id} value={tm.id}>{tm.name}</option>)}</select></div>
                </>
            ) : (
                <>
                    <div className="bg-gray-50 p-3 rounded-md"><h4 className="font-semibold text-brevo-text-secondary">Status</h4><p className="text-brevo-text-primary">{task.status}</p></div>
                    <div className="bg-gray-50 p-3 rounded-md"><h4 className="font-semibold text-brevo-text-secondary">Due Date</h4><p className="text-brevo-text-primary">{task.dueDate ? new Date(task.dueDate).toLocaleString() : 'Not set'}</p></div>
                    {currentClient && <div className="bg-gray-50 p-3 rounded-md"><h4 className="font-semibold text-brevo-text-secondary">Client</h4><p className="text-brevo-text-primary">{currentClient.name}</p></div>}
                    {currentDeal && <div className="bg-gray-50 p-3 rounded-md"><h4 className="font-semibold text-brevo-text-secondary">Deal</h4><p className="text-brevo-text-primary">{currentDeal.name}</p></div>}
                    {currentProject && <div className="bg-gray-50 p-3 rounded-md"><h4 className="font-semibold text-brevo-text-secondary">Project</h4><p className="text-brevo-text-primary">{currentProject.projectName}</p></div>}
                    {currentBusinessLine && <div className="bg-gray-50 p-3 rounded-md"><h4 className="font-semibold text-brevo-text-secondary">Business Line</h4><p className="text-brevo-text-primary">{currentBusinessLine.name}</p></div>}
                    {task.priority && <div className="bg-gray-50 p-3 rounded-md"><h4 className="font-semibold text-brevo-text-secondary">Priority</h4><p className="text-brevo-text-primary">{task.priority}</p></div>}
                    <div className="bg-gray-50 p-3 rounded-md"><h4 className="font-semibold text-brevo-text-secondary">Assignee</h4><p className="text-brevo-text-primary">{currentAssignee ? currentAssignee.name : 'Unassigned'}</p></div>
                </>
            )}
        </div>
        
        {isEditing ? (
             <div className="flex justify-end space-x-2">
                <button onClick={(e) => { e.stopPropagation(); setIsEditing(false); }} className="py-2 px-4 rounded-lg text-brevo-text-primary hover:bg-gray-100">Cancel</button>
                <button onClick={handleSave} className="py-2 px-4 rounded-lg bg-brevo-cta hover:bg-brevo-cta-hover text-white font-semibold">Save Changes</button>
            </div>
        ) : (
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
        )}

      </div>
    </div>
    {researchData && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60]" onClick={() => setResearchData(null)}>
            <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-2xl border border-brevo-border max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-semibold text-brevo-text-primary mb-4">{researchData.title}</h3>
                <div className="flex-1 overflow-y-auto text-brevo-text-secondary">
                    <pre className="whitespace-pre-wrap font-sans text-base">{researchData.content}</pre>
                </div>
                <div className="mt-6 flex justify-end">
                    <button onClick={() => setResearchData(null)} className="py-2 px-4 rounded-lg bg-brevo-cta hover:bg-brevo-cta-hover text-white font-semibold">Close</button>
                </div>
            </div>
        </div>
    )}
    {isRefineModalOpen && (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60]" onClick={() => setIsRefineModalOpen(false)}>
        <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-brevo-text-primary mb-2">Refine Checklist</h3>
            <p className="text-sm text-brevo-text-secondary mb-4">Tell Walter what to change. For example: "Add a step to get approval from legal."</p>
            <textarea
                value={refineCommand}
                onChange={(e) => setRefineCommand(e.target.value)}
                rows={3}
                className="w-full bg-white border border-brevo-border rounded-md px-3 py-2 text-brevo-text-primary focus:ring-2 focus:ring-brevo-cta"
                placeholder="Your command..."
            />
            <div className="flex justify-end space-x-2 mt-4">
                <button onClick={() => setIsRefineModalOpen(false)} className="py-2 px-4 rounded-lg text-brevo-text-primary hover:bg-gray-100">Cancel</button>
                <button onClick={handleRefineChecklist} className="py-2 px-4 rounded-lg bg-brevo-cta hover:bg-brevo-cta-hover text-white font-semibold">Refine</button>
            </div>
        </div>
    </div>
  )}
    </>
  );
};

export default TaskDetailModal;