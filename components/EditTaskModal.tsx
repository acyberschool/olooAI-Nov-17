import React, { useState, useEffect } from 'react';

interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newTitle: string) => void;
  initialTitle: string;
}

const EditTaskModal: React.FC<EditTaskModalProps> = ({ isOpen, onClose, onSave, initialTitle }) => {
  const [title, setTitle] = useState(initialTitle);

  useEffect(() => {
    setTitle(initialTitle);
  }, [initialTitle, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onSave(title.trim());
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-lg border border-gray-700" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-6 text-white">Edit Suggested Task</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1">Task Title</label>
            <input
              type="text"
              id="title"
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <div className="flex justify-end space-x-4 pt-4">
            <button type="button" onClick={onClose} className="py-2 px-4 rounded-md text-gray-300 hover:bg-gray-700">Cancel</button>
            <button type="submit" className="py-2 px-4 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">Save Task</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTaskModal;
