import React, { useState } from 'react';
import { Client, BusinessLine } from '../types';
import AddClientModal from './AddClientModal';

interface ClientsViewProps {
  clients: Client[];
  businessLines: BusinessLine[];
  onSelectClient: (id: string) => void;
  onAddClient: (data: Omit<Client, 'id'>) => string;
  onUpdateClient: (id: string, data: Partial<Omit<Client, 'id'>>) => string;
}

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
);

const PencilIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" />
  </svg>
);

const ClientsView: React.FC<ClientsViewProps> = ({ clients, businessLines, onSelectClient, onAddClient, onUpdateClient }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const getBusinessLineName = (id: string) => {
    return businessLines.find(bl => bl.id === id)?.name || 'N/A';
  }

  const handleOpenModal = (client: Client | null = null) => {
    setEditingClient(client);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingClient(null);
  };

  const handleSave = (data: Omit<Client, 'id'> | Client) => {
    if ('id' in data) {
      onUpdateClient(data.id, data);
    } else {
      onAddClient(data);
    }
    handleCloseModal();
  };


  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-indigo-400">Clients</h2>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
        >
          <PlusIcon /> Add client
        </button>
      </div>

      {clients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.map((client) => (
            <div key={client.id} className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700 flex flex-col justify-between hover:border-indigo-500 transition-all cursor-pointer" onClick={() => onSelectClient(client.id)}>
              <div>
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-xl mb-2 text-white">{client.name}</h3>
                   <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenModal(client);
                      }}
                      className="text-gray-400 hover:text-white p-1 rounded-full"
                    >
                      <PencilIcon />
                    </button>
                </div>
                <p className="text-gray-400 text-sm mb-4"><strong className="text-gray-300">Who they are:</strong> {client.description}</p>
                <p className="text-sm bg-gray-700/50 text-indigo-300 rounded-full px-3 py-1 w-fit">
                    {getBusinessLineName(client.businessLineId)}
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-700">
                 <p className="text-xs text-indigo-300"><strong className="font-semibold">AI Focus:</strong> {client.aiFocus}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-gray-500">No clients created yet.</p>
          <p className="text-gray-500">Click "+ Add client" or use your voice to add one!</p>
        </div>
      )}

      {isModalOpen && (
        <AddClientModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSave}
          client={editingClient}
          businessLines={businessLines}
        />
      )}
    </div>
  );
};

export default ClientsView;