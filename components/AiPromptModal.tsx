import React, { useState, useEffect } from 'react';

interface AiPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (prompt: string) => void;
  title: string;
  description: string;
  initialPrompt: string;
}

const AiPromptModal: React.FC<AiPromptModalProps> = ({ isOpen, onClose, onGenerate, title, description, initialPrompt }) => {
  const [prompt, setPrompt] = useState(initialPrompt);

  useEffect(() => {
    if (isOpen) {
      setPrompt(initialPrompt);
    }
  }, [isOpen, initialPrompt]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      onGenerate(prompt.trim());
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-2xl border border-[#E5E7EB]" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-semibold mb-4 text-[#111827]">{title}</h2>
        <p className="text-[#6B7280] mb-6">{description}</p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={5}
              className="w-full bg-white border border-[#E5E7EB] rounded-md px-3 py-2 text-[#111827] focus:ring-2 focus:ring-[#15803D]"
              required
              autoFocus
            />
          </div>
          <div className="flex justify-end space-x-4 pt-4">
            <button type="button" onClick={onClose} className="py-2 px-4 rounded-md text-[#111827] hover:bg-gray-100">Cancel</button>
            <button type="submit" className="py-2 px-4 rounded-md bg-[#15803D] hover:bg-[#166534] text-white font-semibold">Generate</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AiPromptModal;