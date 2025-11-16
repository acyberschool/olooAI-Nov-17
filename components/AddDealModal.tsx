import React, { useState, useEffect } from 'react';
import { Deal, Client, BusinessLine } from '../types';

interface AddDealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Deal, 'id' | 'status'> | Deal) => void;
  deal: Deal | null;
  clients: Client[];
  businessLines: BusinessLine[];
}

const AddDealModal: React.FC<AddDealModalProps> = ({ isOpen, onClose, onSave, deal, clients, businessLines }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    clientId: '',
    businessLineId: '',
  });

  useEffect(() => {
    if (deal) {
      setFormData({
        name: deal.name,
        description: deal.description,
        clientId: deal.clientId,
        businessLineId: deal.businessLineId,
      });
    } else {
      const defaultClient = clients[0];
      setFormData({ 
          name: '', 
          description: '', 
          clientId: defaultClient?.id || '', 
          businessLineId: defaultClient ? (businessLines.find(bl => bl.id === defaultClient.businessLineId)?.id || '') : ''
      });
    }
  }, [deal, isOpen, clients, businessLines]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let newFormData = { ...formData, [name]: value };

    // When client changes, auto-update the business line
    if (name === 'clientId') {
        const selectedClient = clients.find(c => c.id === value);
        if (selectedClient) {
            newFormData.businessLineId = selectedClient.businessLineId;
        }
    }

    setFormData(newFormData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (deal) {
      onSave({ ...deal, ...formData });
    } else {
      onSave(formData as Omit<Deal, 'id' | 'status'>);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-lg border border-gray-700" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-6 text-white">{deal ? 'Edit' : 'Add'} Deal</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">Deal name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Quarterly fumigation for Block A"
              className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">What is this deal about?</label>
            <input
              type="text"
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="e.g., A short sentence describing the deal's objective."
              className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <div>
            <label htmlFor="clientId" className="block text-sm font-medium text-gray-300 mb-1">Client</label>
            <select
              id="clientId"
              name="clientId"
              value={formData.clientId}
              onChange={handleChange}
              className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500"
              required
            >
              <option value="" disabled>Select a client</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="businessLineId" className="block text-sm font-medium text-gray-300 mb-1">Part of your business</label>
            <select
              id="businessLineId"
              name="businessLineId"
              value={formData.businessLineId}
              onChange={handleChange}
              className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              required
              disabled
            >
              {businessLines.map(bl => (
                <option key={bl.id} value={bl.id}>{bl.name}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Business line is set automatically based on the selected client.</p>
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

export default AddDealModal;
