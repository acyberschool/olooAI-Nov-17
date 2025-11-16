import React, { useState } from 'react';
import { Deal, Client, BusinessLine } from '../types';
import AddDealModal from './AddDealModal';

interface DealsViewProps {
  deals: Deal[];
  clients: Client[];
  businessLines: BusinessLine[];
  onSelectDeal: (id: string) => void;
  onAddDeal: (data: Omit<Deal, 'id' | 'status'>) => string;
  onUpdateDeal: (id: string, data: Partial<Omit<Deal, 'id'>>) => string;
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

const DealsView: React.FC<DealsViewProps> = ({ deals, clients, businessLines, onSelectDeal, onAddDeal, onUpdateDeal }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);

  const getClientName = (id: string) => clients.find(c => c.id === id)?.name || 'N/A';
  const getBusinessLineName = (id: string) => businessLines.find(bl => bl.id === id)?.name || 'N/A';

  const handleOpenModal = (deal: Deal | null = null) => {
    setEditingDeal(deal);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDeal(null);
  };

  const handleSave = (data: Omit<Deal, 'id' | 'status'> | Deal) => {
    if ('id' in data) {
      onUpdateDeal(data.id, data);
    } else {
      onAddDeal(data);
    }
    handleCloseModal();
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-indigo-400">Deals</h2>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
        >
          <PlusIcon /> Add deal
        </button>
      </div>

      {deals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {deals.map((deal) => (
            <div key={deal.id} className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700 flex flex-col justify-between hover:border-indigo-500 transition-all cursor-pointer" onClick={() => onSelectDeal(deal.id)}>
              <div>
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-xl mb-2 text-white">{deal.name}</h3>
                   <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenModal(deal);
                      }}
                      className="text-gray-400 hover:text-white p-1 rounded-full"
                    >
                      <PencilIcon />
                    </button>
                </div>
                 <p className="text-gray-400 text-sm mb-4"><strong className="text-gray-300">About:</strong> {deal.description}</p>
                 <div className="text-sm space-y-2">
                    <p className="bg-gray-700/50 text-purple-300 rounded-full px-3 py-1 w-fit">
                        Client: {getClientName(deal.clientId)}
                    </p>
                    <p className="bg-gray-700/50 text-indigo-300 rounded-full px-3 py-1 w-fit">
                        Business Line: {getBusinessLineName(deal.businessLineId)}
                    </p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-700 flex justify-end">
                 <span className={`text-xs font-semibold rounded-full px-3 py-1 ${deal.status === 'Open' ? 'bg-green-900/50 text-green-300' : 'bg-gray-700 text-gray-400'}`}>{deal.status}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-gray-500">No deals created yet.</p>
          <p className="text-gray-500">Click "+ Add deal" or use your voice to add one!</p>
        </div>
      )}

      {isModalOpen && (
        <AddDealModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSave}
          deal={editingDeal}
          clients={clients}
          businessLines={businessLines}
        />
      )}
    </div>
  );
};

export default DealsView;