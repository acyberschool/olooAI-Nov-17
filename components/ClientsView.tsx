import React, { useState } from 'react';
import { Client, BusinessLine } from '../types';
import AddClientModal from './AddClientModal';
import { UniversalInputContext } from '../App';

interface ClientsViewProps {
  clients: Client[];
  businessLines: BusinessLine[];
  onSelectClient: (id: string) => void;
  onOpenUniversalInput: (context: UniversalInputContext) => void;
  onUpdateClient: (id: string, data: Partial<Omit<Client, 'id'>>) => string;
}

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
);

const PencilIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" />
  </svg>
);

const ClientsView: React.FC<ClientsViewProps> = ({ clients, businessLines, onSelectClient, onOpenUniversalInput, onUpdateClient }) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const getBusinessLineName = (id: string) => {
    return businessLines.find(bl => bl.id === id)?.name || 'N/A';
  }

  const handleOpenEditModal = (client: Client) => {
    setEditingClient(client);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingClient(null);
  };

  const handleSave = (data: Client) => {
    onUpdateClient(data.id, data);
    handleCloseEditModal();
  };

  const handleAddClick = () => {
    onOpenUniversalInput({ placeholder: 'Create a new client named "ABC Limited", a logistics company, for the Fumigation business...' });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-brevo-text-primary">Clients</h2>
        <button
          onClick={handleAddClick}
          className="flex items-center bg-brevo-cta hover:bg-brevo-cta-hover text-white font-bold py-2 px-4 rounded-lg transition-colors"
        >
          <PlusIcon /> Add client
        </button>
      </div>

      {clients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.map((client) => (
            <div key={client.id} className="bg-white p-6 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-brevo-border flex flex-col justify-between hover:border-brevo-cta-hover transition-all cursor-pointer" onClick={() => onSelectClient(client.id)}>
              <div>
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-lg mb-2 text-brevo-text-primary">{client.name}</h3>
                   <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEditModal(client);
                      }}
                      className="text-brevo-text-secondary hover:text-brevo-text-primary p-1 rounded-full"
                    >
                      <PencilIcon />
                    </button>
                </div>
                <p className="text-brevo-text-secondary text-sm mb-4"><strong className="text-brevo-text-primary">Who they are:</strong> {client.description}</p>
                <p className="text-sm bg-gray-100 text-gray-800 rounded-full px-3 py-1 w-fit">
                    {getBusinessLineName(client.businessLineId)}
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-brevo-border">
                 <p className="text-xs text-brevo-text-secondary"><strong className="font-semibold text-brevo-text-primary">AI Focus:</strong> {client.aiFocus}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-brevo-text-secondary">No clients created yet.</p>
          <p className="text-brevo-text-secondary">Click "+ Add client" or use your voice to add one!</p>
        </div>
      )}

      {isEditModalOpen && editingClient && (
        <AddClientModal
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          onSave={handleSave}
          client={editingClient}
          businessLines={businessLines}
        />
      )}
    </div>
  );
};

export default ClientsView;