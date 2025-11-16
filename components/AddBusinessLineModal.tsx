import React, { useState, useEffect } from 'react';
import { BusinessLine } from '../types';

interface AddBusinessLineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<BusinessLine, 'id'> | BusinessLine) => void;
  businessLine: BusinessLine | null;
}

const AddBusinessLineModal: React.FC<AddBusinessLineModalProps> = ({ isOpen, onClose, onSave, businessLine }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    customers: '',
    aiFocus: '',
  });

  useEffect(() => {
    if (businessLine) {
      setFormData({
        name: businessLine.name,
        description: businessLine.description,
        customers: businessLine.customers,
        aiFocus: businessLine.aiFocus,
      });
    } else {
      setFormData({ name: '', description: '', customers: '', aiFocus: '' });
    }
  }, [businessLine, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (businessLine) {
      onSave({ ...businessLine, ...formData });
    } else {
      onSave(formData);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-lg border border-gray-700" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-6 text-white">{businessLine ? 'Edit' : 'Add'} Business Line</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">Business line name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Fumigation"
              className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">What kind of work is this?</label>
            <input
              type="text"
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="e.g., We help apartments get rid of pests."
              className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
           <div>
            <label htmlFor="customers" className="block text-sm font-medium text-gray-300 mb-1">Who are your typical customers?</label>
            <input
              type="text"
              id="customers"
              name="customers"
              value={formData.customers}
              onChange={handleChange}
              placeholder="e.g., Apartments, estates, and small offices."
              className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
           <div>
            <label htmlFor="aiFocus" className="block text-sm font-medium text-gray-300 mb-1">What should AI look for here?</label>
            <input
              type="text"
              id="aiFocus"
              name="aiFocus"
              value={formData.aiFocus}
              onChange={handleChange}
              placeholder="e.g., Find estate-wide contracts and upsell annual plans."
              className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          <div className="flex justify-end space-x-4 pt-4">
            <button type="button" onClick={onClose} className="py-2 px-4 rounded-md text-gray-300 hover:bg-gray-700">Cancel</button>
            <button type="submit" className="py-2 px-4 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddBusinessLineModal;
