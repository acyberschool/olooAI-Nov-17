import React, { useState, useEffect } from 'react';
import { Deal, Client, BusinessLine } from '../types';

interface EditDealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Deal) => void;
  deal: Deal;
  clients: Client[];
  businessLines: BusinessLine[];
}

const AddDealModal: React.FC<EditDealModalProps> = ({ isOpen, onClose, onSave, deal, clients, businessLines }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    clientId: '',
    businessLineId: '',
    value: 0,
    currency: 'USD' as Deal['currency'],
    revenueModel: 'Full Pay' as Deal['revenueModel'],
  });

  useEffect(() => {
    if (deal) {
      setFormData({
        name: deal.name,
        description: deal.description,
        clientId: deal.clientId,
        businessLineId: deal.businessLineId,
        value: deal.value,
        currency: deal.currency,
        revenueModel: deal.revenueModel,
      });
    }
  }, [deal, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let newFormData = { ...formData, [name]: value };

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
    const dataToSave = { ...formData, value: Number(formData.value) || 0 };
    onSave({ ...deal, ...dataToSave });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-lg border border-[#E5E7EB]" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-semibold mb-6 text-[#111827]">Edit Deal</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label htmlFor="name" className="block text-sm font-medium text-[#111827] mb-1">Deal name</label>
              <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} placeholder="e.g., Q3 Fumigation Contract" className="w-full bg-white border border-[#E5E7EB] rounded-md px-3 py-2 text-[#111827] focus:ring-2 focus:ring-[#15803D]" required />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-[#111827] mb-1">Description</label>
              <input type="text" id="description" name="description" value={formData.description} onChange={handleChange} placeholder="A short sentence describing the objective." className="w-full bg-white border border-[#E5E7EB] rounded-md px-3 py-2 text-[#111827] focus:ring-2 focus:ring-[#15803D]" required />
            </div>
            <div>
              <label htmlFor="value" className="block text-sm font-medium text-[#111827] mb-1">Deal Value</label>
              <input type="number" id="value" name="value" value={formData.value} onChange={handleChange} placeholder="e.g., 5000" className="w-full bg-white border border-[#E5E7EB] rounded-md px-3 py-2 text-[#111827] focus:ring-2 focus:ring-[#15803D]" required />
            </div>
            <div>
              <label htmlFor="currency" className="block text-sm font-medium text-[#111827] mb-1">Currency</label>
              <select id="currency" name="currency" value={formData.currency} onChange={handleChange} className="w-full bg-white border border-[#E5E7EB] rounded-md px-3 py-2 text-[#111827] focus:ring-2 focus:ring-[#15803D]">
                <option>USD</option><option>KES</option><option>EUR</option><option>GBP</option>
              </select>
            </div>
             <div className="md:col-span-2">
              <label htmlFor="revenueModel" className="block text-sm font-medium text-[#111827] mb-1">Revenue Model</label>
              <select id="revenueModel" name="revenueModel" value={formData.revenueModel} onChange={handleChange} className="w-full bg-white border border-[#E5E7EB] rounded-md px-3 py-2 text-[#111827] focus:ring-2 focus:ring-[#15803D]">
                <option>Full Pay</option><option>Revenue Share</option>
              </select>
            </div>
            <div>
              <label htmlFor="clientId" className="block text-sm font-medium text-[#111827] mb-1">Client</label>
              <select id="clientId" name="clientId" value={formData.clientId} onChange={handleChange} className="w-full bg-white border border-[#E5E7EB] rounded-md px-3 py-2 text-[#111827] focus:ring-2 focus:ring-[#15803D]" required>
                <option value="" disabled>Select client</option>
                {clients.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
              </select>
            </div>
            <div>
              <label htmlFor="businessLineId" className="block text-sm font-medium text-[#111827] mb-1">Business Line</label>
              <select id="businessLineId" name="businessLineId" value={formData.businessLineId} onChange={handleChange} className="w-full bg-gray-100 border border-[#E5E7EB] rounded-md px-3 py-2 text-[#6B7280] disabled:opacity-70" required disabled>
                {businessLines.map(bl => (<option key={bl.id} value={bl.id}>{bl.name}</option>))}
              </select>
            </div>
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

export default AddDealModal;