import React, { useState, useEffect } from 'react';
import { UniversalInputContext } from '../App';

interface UniversalInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (text: string) => void;
  context: UniversalInputContext;
}

const UniversalInputModal: React.FC<UniversalInputModalProps> = ({ isOpen, onClose, onSave, context }) => {
  const [text, setText] = useState('');

  useEffect(() => {
    if (isOpen) {
      setText(''); // Reset text when modal opens
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onSave(text.trim());
      onClose();
    }
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-2xl border border-[#E5E7EB]" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-semibold mb-6 text-[#111827]">Tell Walter what to do</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="universal-input" className="block text-sm font-medium text-[#6B7280] mb-1">
              You can create a task, log a conversation, add a new client, and more.
            </label>
            <textarea
              id="universal-input"
              name="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={context.placeholder || "e.g., Remind me to call ABC Limited tomorrow at 10am..."}
              rows={8}
              className="w-full bg-white border border-[#E5E7EB] rounded-md px-3 py-2 text-[#111827] focus:ring-2 focus:ring-[#15803D]"
              required
              autoFocus
            />
          </div>
          <div className="flex justify-end space-x-4 pt-4">
            <button type="button" onClick={onClose} className="py-2 px-4 rounded-md text-[#111827] hover:bg-gray-100">Cancel</button>
            <button type="submit" className="py-2 px-4 rounded-md bg-[#15803D] hover:bg-[#166534] text-white font-semibold">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UniversalInputModal;