import React, { useState, useRef } from 'react';
import { CRMEntryType } from '../types';

interface AddCRMNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (note: string, type: CRMEntryType, file?: File) => void;
}

const AddCRMNoteModal: React.FC<AddCRMNoteModalProps> = ({ isOpen, onClose, onSave }) => {
  const [note, setNote] = useState('');
  const [type, setType] = useState<CRMEntryType>('note');
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (note.trim()) {
      onSave(note.trim(), type, file || undefined);
      onClose();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-lg border border-gray-700" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-6 text-white">Add Conversation Note</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="note" className="block text-sm font-medium text-gray-300 mb-1">What just happened with this client?</label>
            <textarea
              id="note"
              name="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g., Just spoke to James; they want to add the basement parking lot to the fumigation contract."
              rows={6}
              className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-300 mb-1">Type</label>
              <select 
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value as CRMEntryType)}
                className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500"
              >
                <option value="note">Note</option>
                <option value="call">Call</option>
                <option value="email">Email</option>
                <option value="meeting">Meeting</option>
                <option value="message">Message</option>
              </select>
            </div>
            <div>
              <label htmlFor="file" className="block text-sm font-medium text-gray-300 mb-1">Attach File (optional)</label>
              <input 
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="w-full bg-gray-900 border border-gray-700 rounded-md text-white file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-4 pt-4">
            <button type="button" onClick={onClose} className="py-2 px-4 rounded-md text-gray-300 hover:bg-gray-700">Cancel</button>
            <button type="submit" className="py-2 px-4 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">Save Note</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCRMNoteModal;