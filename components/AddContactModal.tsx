
import React, { useState } from 'react';
import { Contact } from '../types';

interface AddContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; role: string; email: string; phone: string }) => void;
}

const AddContactModal: React.FC<AddContactModalProps> = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    email: '',
    phone: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
    setFormData({ name: '', role: '', email: '', phone: '' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-lg border border-[#E5E7EB]" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-semibold mb-6 text-[#111827]">Add Contact</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#111827] mb-1">Name</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full border rounded-md p-2" required />
          </div>
           <div>
            <label className="block text-sm font-medium text-[#111827] mb-1">Role/Title</label>
            <input type="text" name="role" value={formData.role} onChange={handleChange} className="w-full border rounded-md p-2" />
          </div>
           <div>
            <label className="block text-sm font-medium text-[#111827] mb-1">Email</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full border rounded-md p-2" />
          </div>
           <div>
            <label className="block text-sm font-medium text-[#111827] mb-1">Phone</label>
            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full border rounded-md p-2" />
          </div>
          <div className="flex justify-end space-x-4 pt-4">
            <button type="button" onClick={onClose} className="py-2 px-4 rounded-md hover:bg-gray-100">Cancel</button>
            <button type="submit" className="py-2 px-4 rounded-md bg-[#15803D] text-white">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddContactModal;
