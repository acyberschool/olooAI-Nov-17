import React, { useState, useEffect } from 'react';
import { BusinessLine } from '../types';

interface EditBusinessLineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: BusinessLine) => void;
  businessLine: BusinessLine;
}

const AddBusinessLineModal: React.FC<EditBusinessLineModalProps> = ({ isOpen, onClose, onSave, businessLine }) => {
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
    }
  }, [businessLine, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...businessLine, ...formData });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-lg border border-[#E5E7EB]" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-semibold mb-6 text-[#111827]">Edit Business Line</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-[#111827] mb-1">Business line name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Fumigation"
              className="w-full bg-white border border-[#E5E7EB] rounded-md px-3 py-2 text-[#111827] focus:ring-2 focus:ring-[#15803D] focus:border-[#15803D]"
              required
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-[#111827] mb-1">What kind of work is this?</label>
            <input
              type="text"
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="e.g., We help apartments get rid of pests."
              className="w-full bg-white border border-[#E5E7EB] rounded-md px-3 py-2 text-[#111827] focus:ring-2 focus:ring-[#15803D] focus:border-[#15803D]"
              required
            />
          </div>
           <div>
            <label htmlFor="customers" className="block text-sm font-medium text-[#111827] mb-1">Who are your typical customers?</label>
            <input
              type="text"
              id="customers"
              name="customers"
              value={formData.customers}
              onChange={handleChange}
              placeholder="e.g., Apartments, estates, and small offices."
              className="w-full bg-white border border-[#E5E7EB] rounded-md px-3 py-2 text-[#111827] focus:ring-2 focus:ring-[#15803D] focus:border-[#15803D]"
              required
            />
          </div>
           <div>
            <label htmlFor="aiFocus" className="block text-sm font-medium text-[#111827] mb-1">What should AI look for here?</label>
            <input
              type="text"
              id="aiFocus"
              name="aiFocus"
              value={formData.aiFocus}
              onChange={handleChange}
              placeholder="e.g., Find estate-wide contracts and upsell annual plans."
              className="w-full bg-white border border-[#E5E7EB] rounded-md px-3 py-2 text-[#111827] focus:ring-2 focus:ring-[#15803D] focus:border-[#15803D]"
              required
            />
          </div>
          <div className="flex justify-end space-x-4 pt-4">
            <button type="button" onClick={onClose} className="py-2 px-4 rounded-md text-[#111827] hover:bg-gray-100">Cancel</button>
            <button type="submit" className="py-2 px-4 rounded-md bg-[#15803D] hover:bg-[#166534] text-white font-semibold">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddBusinessLineModal;