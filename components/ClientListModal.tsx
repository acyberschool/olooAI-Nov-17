import React, { useState } from 'react';
import { Client } from '../types';

interface ClientListModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  businessLineId: string;
  onAddClient: (data: any) => void;
  onSelectClient: (id: string) => void;
}

const ClientListModal: React.FC<ClientListModalProps> = ({ isOpen, onClose, clients, businessLineId, onAddClient, onSelectClient }) => {
  const [newClientName, setNewClientName] = useState('');

  const handleAddClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (newClientName.trim()) {
      // For simplicity, we only add name here. The full modal would be better.
      // This is a simplified "quick add"
      onAddClient({ name: newClientName.trim(), businessLineId, description: 'New client', aiFocus: 'Develop relationship' });
      setNewClientName('');
    }
  };

  const handleSelect = (id: string) => {
    onSelectClient(id);
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-2xl border border-[#E5E7EB]" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-[#111827]">Clients</h2>
            <button onClick={onClose} className="text-[#6B7280] hover:text-[#111827] text-3xl leading-none">&times;</button>
        </div>

        <div className="mb-6">
            <form onSubmit={handleAddClient} className="flex items-center space-x-2">
                <input
                type="text"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                placeholder="Add new client name (quick add)..."
                className="flex-grow bg-white border border-[#E5E7EB] rounded-md px-3 py-2 text-[#111827] focus:ring-2 focus:ring-[#15803D] focus:border-[#15803D]"
                required
                />
                <button type="submit" className="py-2 px-4 rounded-md bg-[#15803D] hover:bg-[#166534] text-white font-semibold">Add Client</button>
            </form>
        </div>

        <div className="max-h-96 overflow-y-auto pr-2">
          {clients.length > 0 ? (
            <ul className="space-y-3">
              {clients.map((client) => (
                <li key={client.id} className="bg-gray-50 p-4 rounded-lg flex justify-between items-center border border-[#E5E7EB]">
                  <span className="font-medium text-[#111827]">{client.name}</span>
                  <button onClick={() => handleSelect(client.id)} className="text-sm text-[#15803D] hover:underline">View Details</button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-[#6B7280] py-8">No clients found for this business line.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientListModal;