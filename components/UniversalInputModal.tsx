

import React, { useState, useEffect } from 'react';
import { UniversalInputContext } from '../App';
import { useDictation } from '../hooks/useDictation';

interface UniversalInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (text: string) => void;
  context: UniversalInputContext;
}

const MicIcon = ({ isRecording }: { isRecording: boolean }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-12 w-12 transition-colors ${isRecording ? 'text-red-500' : 'text-white'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
    </svg>
);


const UniversalInputModal: React.FC<UniversalInputModalProps> = ({ isOpen, onClose, onSave, context }) => {
  const [text, setText] = useState('');
  const [mode, setMode] = useState<'voice' | 'text'>('voice');
  const dictation = useDictation();

  useEffect(() => {
    if (isOpen) {
      setText(''); // Reset text when modal opens
      setMode('voice'); // Default to voice mode
    } else {
      if (dictation.isRecording) {
        dictation.stopDictation();
      }
    }
  }, [isOpen]);

  useEffect(() => {
    // This is the new immediate-action flow.
    // When a final transcript is received from dictation, we save and close.
    if (dictation.transcript) {
        onSave(dictation.transcript);
        onClose();
    }
  }, [dictation.transcript, onSave, onClose])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onSave(text.trim());
      onClose();
    }
  };
  
  const handleMicClick = () => {
      if(dictation.isRecording) {
          dictation.stopDictation();
      } else {
          dictation.startDictation();
      }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-2xl border border-[#E5E7EB]" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-semibold mb-6 text-[#111827]">Tell Walter what to do</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          {mode === 'voice' ? (
              <div className="text-center py-8">
                  <button type="button" onClick={handleMicClick} className={`relative w-28 h-28 rounded-full flex items-center justify-center mx-auto transition-colors ${dictation.isRecording ? 'bg-red-100' : 'bg-brevo-cta hover:bg-brevo-cta-hover'}`}>
                      <MicIcon isRecording={dictation.isRecording} />
                      {dictation.isRecording && <div className="absolute inset-0 rounded-full border-4 border-red-500 animate-pulse"></div>}
                  </button>
                  <p className="mt-4 text-brevo-text-secondary">{dictation.isRecording ? 'Listening... Click to stop.' : 'Click the mic and start talking.'}</p>
                  <button type="button" onClick={() => setMode('text')} className="mt-8 text-sm text-brevo-cta hover:underline">Type instead</button>
              </div>
          ) : (
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
          )}
          
          {mode === 'text' && (
             <div className="flex justify-end space-x-4 pt-4">
                <button type="button" onClick={onClose} className="py-2 px-4 rounded-md text-[#111827] hover:bg-gray-100">Cancel</button>
                <button type="submit" className="py-2 px-4 rounded-md bg-[#15803D] hover:bg-[#166534] text-white font-semibold" disabled={!text.trim()}>Save</button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default UniversalInputModal;