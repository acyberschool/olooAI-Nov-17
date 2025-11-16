import React, { useState } from 'react';
import { BusinessLine } from '../types';
import AddBusinessLineModal from './AddBusinessLineModal';

interface BusinessLinesViewProps {
  businessLines: BusinessLine[];
  onSelectBusinessLine: (id: string) => void;
  // FIX: Allow onAddBusinessLine to be async.
  onAddBusinessLine: (data: Omit<BusinessLine, 'id'>) => Promise<string>;
  onUpdateBusinessLine: (id: string, data: Partial<Omit<BusinessLine, 'id'>>) => string;
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


const BusinessLinesView: React.FC<BusinessLinesViewProps> = ({ businessLines, onSelectBusinessLine, onAddBusinessLine, onUpdateBusinessLine }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBusinessLine, setEditingBusinessLine] = useState<BusinessLine | null>(null);

  const handleOpenModal = (bl: BusinessLine | null = null) => {
    setEditingBusinessLine(bl);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBusinessLine(null);
  };

  // FIX: Make handleSave async and await the onAddBusinessLine call.
  const handleSave = async (data: Omit<BusinessLine, 'id'> | BusinessLine) => {
    if ('id' in data) {
      onUpdateBusinessLine(data.id, data);
    } else {
      await onAddBusinessLine(data);
    }
    handleCloseModal();
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-indigo-400">Business Lines</h2>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
        >
          <PlusIcon /> Add business line
        </button>
      </div>

      {businessLines.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {businessLines.map((bl) => (
            <div key={bl.id} className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700 flex flex-col justify-between hover:border-indigo-500 transition-all cursor-pointer" onClick={() => onSelectBusinessLine(bl.id)}>
              <div>
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-xl mb-2 text-white">{bl.name}</h3>
                   <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenModal(bl);
                      }}
                      className="text-gray-400 hover:text-white p-1 rounded-full"
                    >
                      <PencilIcon />
                    </button>
                </div>
                <p className="text-gray-400 text-sm mb-4"><strong className="text-gray-300">What we do:</strong> {bl.description}</p>
                <p className="text-gray-400 text-sm mb-4"><strong className="text-gray-300">Who it's for:</strong> {bl.customers}</p>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-700">
                 <p className="text-xs text-indigo-300"><strong className="font-semibold">AI Focus:</strong> {bl.aiFocus}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-gray-500">No business lines created yet.</p>
          <p className="text-gray-500">Click "+ Add business line" or use your voice to add one!</p>
        </div>
      )}

      {isModalOpen && (
        <AddBusinessLineModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSave}
          businessLine={editingBusinessLine}
        />
      )}
    </div>
  );
};

export default BusinessLinesView;