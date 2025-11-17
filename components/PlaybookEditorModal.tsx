import React, { useState, useEffect } from 'react';
import { Playbook, PlaybookStep } from '../types';

interface PlaybookEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (steps: PlaybookStep[]) => void;
  playbook: Playbook;
}

const PlusIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>);
const TrashIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>);
const UpArrowIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>);
const DownArrowIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>);


const PlaybookEditorModal: React.FC<PlaybookEditorModalProps> = ({ isOpen, onClose, onSave, playbook }) => {
  const [steps, setSteps] = useState<PlaybookStep[]>([]);

  useEffect(() => {
    if (playbook) {
      setSteps([...playbook.steps]);
    }
  }, [playbook, isOpen]);

  const handleStepChange = (index: number, field: 'title' | 'description', value: string) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setSteps(newSteps);
  };

  const addStep = () => {
    setSteps([...steps, { id: `new-${Date.now()}`, title: '', description: '' }]);
  };

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };
  
  const moveStep = (index: number, direction: 'up' | 'down') => {
      if (direction === 'up' && index > 0) {
          const newSteps = [...steps];
          [newSteps[index-1], newSteps[index]] = [newSteps[index], newSteps[index-1]];
          setSteps(newSteps);
      }
      if (direction === 'down' && index < steps.length - 1) {
          const newSteps = [...steps];
          [newSteps[index+1], newSteps[index]] = [newSteps[index], newSteps[index+1]];
          setSteps(newSteps);
      }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(steps);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-2xl border border-[#E5E7EB] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-semibold mb-6 text-[#111827]">Edit Playbook for "{playbook.businessLineId}"</h2>
        <form onSubmit={handleSubmit} className="space-y-4 flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto pr-4 space-y-4">
                {steps.map((step, index) => (
                    <div key={step.id || index} className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex space-x-4">
                        <div className="flex flex-col space-y-2">
                            <button type="button" onClick={() => moveStep(index, 'up')} disabled={index === 0} className="text-[#6B7280] hover:text-[#111827] disabled:opacity-30"><UpArrowIcon/></button>
                            <button type="button" onClick={() => moveStep(index, 'down')} disabled={index === steps.length - 1} className="text-[#6B7280] hover:text-[#111827] disabled:opacity-30"><DownArrowIcon/></button>
                        </div>
                        <div className="flex-1 space-y-2">
                            <input
                                type="text"
                                value={step.title}
                                onChange={(e) => handleStepChange(index, 'title', e.target.value)}
                                placeholder="Step Title"
                                className="w-full bg-white border border-[#E5E7EB] rounded-md px-3 py-2 text-[#111827] focus:ring-2 focus:ring-[#15803D]"
                                required
                            />
                            <textarea
                                value={step.description}
                                onChange={(e) => handleStepChange(index, 'description', e.target.value)}
                                placeholder="Step Description"
                                rows={2}
                                className="w-full bg-white border border-[#E5E7EB] rounded-md px-3 py-2 text-[#111827] focus:ring-2 focus:ring-[#15803D]"
                                required
                            />
                        </div>
                        <button type="button" onClick={() => removeStep(index)} className="text-[#6B7280] hover:text-red-500"><TrashIcon /></button>
                    </div>
                ))}
            </div>

            <div className="pt-4">
                 <button type="button" onClick={addStep} className="flex items-center text-sm text-[#15803D] hover:text-[#166534]">
                    <PlusIcon /> Add Step
                </button>
            </div>
          
          <div className="flex justify-end space-x-4 pt-6">
            <button type="button" onClick={onClose} className="py-2 px-4 rounded-md text-[#111827] hover:bg-gray-100">Cancel</button>
            <button type="submit" className="py-2 px-4 rounded-md bg-[#15803D] hover:bg-[#166534] text-white font-semibold">Save Playbook</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PlaybookEditorModal;