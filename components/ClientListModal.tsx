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
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-2xl border border-gray-700" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Clients</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl leading-none">&times;</button>
        </div>

        <div className="mb-6">
            <form onSubmit={handleAddClient} className="flex items-center space-x-2">
                <input
                type="text"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                placeholder="Add new client name (quick add)..."
                className="flex-grow bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
                />
                <button type="submit" className="py-2 px-4 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">Add Client</button>
            </form>
        </div>

        <div className="max-h-96 overflow-y-auto pr-2">
          {clients.length > 0 ? (
            <ul className="space-y-3">
              {clients.map((client) => (
                <li key={client.id} className="bg-gray-900/50 p-4 rounded-lg flex justify-between items-center border border-gray-700">
                  <span className="font-medium text-gray-200">{client.name}</span>
                  <button onClick={() => handleSelect(client.id)} className="text-xs text-indigo-400 hover:underline">View Details</button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-gray-500 py-8">No clients found for this business line.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientListModal;