
import React, { useState } from 'react';
import { BusinessLine, UniversalInputContext } from '../types';
import AddBusinessLineModal from './AddBusinessLineModal';

interface BusinessLinesViewProps {
  businessLines: BusinessLine[];
  onSelectBusinessLine: (id: string) => void;
  onOpenUniversalInput: (context: UniversalInputContext) => void;
  onUpdateBusinessLine: (id: string, data: Partial<Omit<BusinessLine, 'id'>>) => Promise<string> | string | void;
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


const BusinessLinesView: React.FC<BusinessLinesViewProps> = ({ businessLines, onSelectBusinessLine, onOpenUniversalInput, onUpdateBusinessLine }) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingBusinessLine, setEditingBusinessLine] = useState<BusinessLine | null>(null);

  const handleOpenEditModal = (bl: BusinessLine) => {
    setEditingBusinessLine(bl);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingBusinessLine(null);
  };

  const handleSave = (data: BusinessLine) => {
    onUpdateBusinessLine(data.id, data);
    handleCloseEditModal();
  };
  
  const handleAddClick = () => {
      onOpenUniversalInput({ placeholder: 'Create a new business line called "Fumigation" that helps apartments and offices get rid of pests...' });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-brevo-text-primary">Business Lines</h2>
        <button
          onClick={handleAddClick}
          className="flex items-center bg-brevo-cta hover:bg-brevo-cta-hover text-white font-bold py-2 px-4 rounded-lg transition-colors"
        >
          <PlusIcon /> Add business line
        </button>
      </div>

      {businessLines.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {businessLines.map((bl) => (
            <div key={bl.id} className="bg-white p-6 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-brevo-border flex flex-col justify-between hover:border-brevo-cta-hover transition-all cursor-pointer" onClick={() => onSelectBusinessLine(bl.id)}>
              <div>
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-lg mb-2 text-brevo-text-primary">{bl.name}</h3>
                   <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEditModal(bl);
                      }}
                      className="text-brevo-text-secondary hover:text-brevo-text-primary p-1 rounded-full"
                    >
                      <PencilIcon />
                    </button>
                </div>
                <p className="text-brevo-text-secondary text-sm mb-4"><strong className="text-brevo-text-primary">What we do:</strong> {bl.description}</p>
                <p className="text-brevo-text-secondary text-sm mb-4"><strong className="text-brevo-text-primary">Who it's for:</strong> {bl.customers}</p>
              </div>
              <div className="mt-4 pt-4 border-t border-brevo-border">
                 <p className="text-xs text-brevo-text-secondary"><strong className="font-semibold text-brevo-text-primary">AI Focus:</strong> {bl.aiFocus}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-brevo-text-secondary">No business lines created yet.</p>
          <p className="text-brevo-text-secondary">Click "+ Add business line" or use your voice to add one!</p>
        </div>
      )}

      {isEditModalOpen && editingBusinessLine && (
        <AddBusinessLineModal
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          onSave={handleSave}
          businessLine={editingBusinessLine}
        />
      )}
    </div>
  );
};

export default BusinessLinesView;
