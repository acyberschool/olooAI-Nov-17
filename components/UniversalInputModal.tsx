
import React, { useState, useEffect } from 'react';
import { UniversalInputContext } from '../App';

interface UniversalInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (text: string) => void;
  context: UniversalInputContext;
}

const MagicIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-brevo-cta mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
  </svg>
);

const UniversalInputModal: React.FC<UniversalInputModalProps> = ({ isOpen, onClose, onSave, context }) => {
  const [text, setText] = useState('');

  useEffect(() => {
    if (isOpen) {
      setText(''); 
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
        <div className="flex flex-col items-center text-center mb-6">
            <MagicIcon />
            <h2 className="text-xl font-semibold text-[#111827]">Tell Walter what to do</h2>
            <p className="text-sm text-[#6B7280] mt-1">Describe your task, deal, or client update in plain English. Walter will structure it for you.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <textarea
                id="universal-input"
                name="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={context.placeholder || "e.g., Create a new deal for Acme Corp worth 50k... or Remind me to call John tomorrow..."}
                rows={6}
                className="w-full bg-gray-50 border border-[#E5E7EB] rounded-lg px-4 py-3 text-[#111827] focus:ring-2 focus:ring-[#15803D] focus:bg-white transition-colors text-lg"
                required
                autoFocus
              />
            </div>
          
             <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={onClose} className="py-2 px-5 rounded-lg text-[#111827] hover:bg-gray-100 font-medium">Cancel</button>
                <button type="submit" className="py-2 px-6 rounded-lg bg-[#15803D] hover:bg-[#166534] text-white font-bold shadow-md transform active:scale-95 transition-all" disabled={!text.trim()}>
                    Process with AI ✨
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default UniversalInputModal;
