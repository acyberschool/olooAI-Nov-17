
import React, { useState, useEffect, useRef } from 'react';
import { UniversalInputContext } from '../types';
import { useDictation } from '../hooks/useDictation';

interface UniversalInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (text: string, file?: { base64: string, mimeType: string }) => void;
  context: UniversalInputContext;
}

const MagicIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-brevo-cta mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
  </svg>
);

const PaperClipIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
  </svg>
);

const MicIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
    </svg>
);

const StopIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10h6v4H9z" />
    </svg>
);

const UniversalInputModal: React.FC<UniversalInputModalProps> = ({ isOpen, onClose, onSave, context }) => {
  const [text, setText] = useState('');
  const [attachedFile, setAttachedFile] = useState<{ base64: string, mimeType: string, name: string } | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isRecording, transcript, startDictation, stopDictation } = useDictation();

  useEffect(() => {
    if (isOpen) {
      setText('');
      setAttachedFile(undefined);
    }
  }, [isOpen]);

  useEffect(() => {
      if (transcript) {
          setText(prev => prev + (prev ? ' ' : '') + transcript);
      }
  }, [transcript]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onSave(text.trim(), attachedFile ? { base64: attachedFile.base64, mimeType: attachedFile.mimeType } : undefined);
      onClose();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const base64 = base64String.split(',')[1];
        setAttachedFile({
          base64,
          mimeType: file.type,
          name: file.name
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleDictation = () => {
      if (isRecording) {
          stopDictation();
      } else {
          startDictation();
      }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-2xl border border-[#E5E7EB]" onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-col items-center text-center mb-6">
            <MagicIcon />
            <h2 className="text-xl font-semibold text-[#111827]">Delegate to Walter</h2>
            <p className="text-sm text-brevo-text-secondary mt-1">Just say the goal (e.g., "Plan the Q4 event"). Walter will build the entire plan, tasks, and schedule automatically.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <textarea
                id="universal-input"
                name="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={isRecording ? "Listening..." : (context.placeholder || "e.g., Create a new deal for Acme Corp worth 50k... or Remind me to call John tomorrow...")}
                rows={6}
                className={`w-full bg-gray-50 border border-[#E5E7EB] rounded-lg px-4 py-3 text-[#111827] focus:ring-2 focus:ring-[#15803D] focus:bg-white transition-colors text-lg ${isRecording ? 'ring-2 ring-red-500 bg-red-50' : ''}`}
                required
                autoFocus
              />
              <div className="absolute bottom-3 left-3 flex items-center gap-2">
                  <button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-gray-500 hover:text-brevo-cta hover:bg-gray-200 rounded-full transition-colors"
                    title="Attach document or image for context"
                  >
                    <PaperClipIcon />
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={handleFileChange} 
                    accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                  />
                  <button
                    type="button"
                    onClick={toggleDictation}
                    className={`p-2 rounded-full transition-colors ${isRecording ? 'text-red-600 bg-red-100 hover:bg-red-200' : 'text-gray-500 hover:text-brevo-cta hover:bg-gray-200'}`}
                    title="Dictate with voice"
                  >
                      {isRecording ? <StopIcon /> : <MicIcon />}
                  </button>

                  {attachedFile && (
                    <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full flex items-center">
                        {attachedFile.name}
                        <button type="button" onClick={() => setAttachedFile(undefined)} className="ml-1 font-bold hover:text-red-600">&times;</button>
                    </span>
                  )}
              </div>
            </div>
          
             <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={onClose} className="py-2 px-5 rounded-lg text-[#111827] hover:bg-gray-100 font-medium">Cancel</button>
                <button type="submit" className="py-2 px-6 rounded-lg bg-[#15803D] hover:bg-[#166534] text-white font-bold shadow-md transform active:scale-95 transition-all" disabled={!text.trim()}>
                    DTW (Delegate to Walter) ⚡
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default UniversalInputModal;
