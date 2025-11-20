
import React, { useState } from 'react';
import { Deal, Client, BusinessLine, UniversalInputContext } from '../types';
import AddDealModal from './AddDealModal';

interface DealsViewProps {
  deals: Deal[];
  clients: Client[];
  businessLines: BusinessLine[];
  onSelectDeal: (id: string) => void;
  onOpenUniversalInput: (context: UniversalInputContext) => void;
  onUpdateDeal: (id: string, data: Partial<Omit<Deal, 'id'>>) => string;
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

const DealsView: React.FC<DealsViewProps> = ({ deals, clients, businessLines, onSelectDeal, onOpenUniversalInput, onUpdateDeal }) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);

  const getClientName = (id: string) => clients.find(c => c.id === id)?.name || 'N/A';
  const getBusinessLineName = (id: string) => businessLines.find(bl => bl.id === id)?.name || 'N/A';

  const handleOpenEditModal = (deal: Deal) => {
    setEditingDeal(deal);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingDeal(null);
  };

  const handleSave = (data: Deal) => {
    onUpdateDeal(data.id, data);
    handleCloseEditModal();
  };
  
  const handleAddClick = () => {
    onOpenUniversalInput({ placeholder: 'Create a new deal "Q3 Fumigation" for client ABC Limited worth 5000 USD...' });
  };

  const statusChip = (status: Deal['status']) => {
    switch (status) {
      case 'Open':
        return 'bg-blue-100 text-blue-800';
      case 'Closed - Won':
        return 'bg-green-100 text-green-800';
      case 'Closed - Lost':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-200 text-gray-800';
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-brevo-text-primary">Deals</h2>
        <button
          onClick={handleAddClick}
          className="flex items-center bg-brevo-cta hover:bg-brevo-cta-hover text-white font-bold py-2 px-4 rounded-lg transition-colors"
        >
          <PlusIcon /> Add deal
        </button>
      </div>

      {deals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {deals.map((deal) => (
            <div key={deal.id} className="bg-white p-6 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-brevo-border flex flex-col justify-between hover:border-brevo-cta-hover transition-all cursor-pointer" onClick={() => onSelectDeal(deal.id)}>
              <div>
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-lg mb-2 text-brevo-text-primary">{deal.name}</h3>
                   <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEditModal(deal);
                      }}
                      className="text-brevo-text-secondary hover:text-brevo-text-primary p-1 rounded-full"
                    >
                      <PencilIcon />
                    </button>
                </div>
                 <p className="text-brevo-text-secondary text-sm mb-4"><strong className="text-brevo-text-primary">About:</strong> {deal.description}</p>
                 <div className="text-sm space-y-2">
                    <p className="bg-blue-100 text-blue-800 rounded-full px-3 py-1 w-fit">
                        Client: {getClientName(deal.clientId)}
                    </p>
                    <p className="bg-gray-100 text-gray-800 rounded-full px-3 py-1 w-fit">
                        Business Line: {getBusinessLineName(deal.businessLineId)}
                    </p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-brevo-border flex justify-end">
                 <span className={`text-xs font-semibold rounded-full px-3 py-1 ${statusChip(deal.status)}`}>{deal.status}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
          <p className="text-lg font-medium text-brevo-text-primary mb-2">No deals tracked</p>
          <p className="text-brevo-text-secondary mb-4">Manage your sales pipeline here.</p>
          <button onClick={handleAddClick} className="text-brevo-cta hover:underline">Create your first deal</button>
        </div>
      )}

      {isEditModalOpen && editingDeal && (
        <AddDealModal
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
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