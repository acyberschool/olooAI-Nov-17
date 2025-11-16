import React, { useState, useRef } from 'react';
import { Document, DocumentCategory, DocumentOwnerType, BusinessLine, Client, Deal } from '../types';
import AiDocGenerator from './AiDocGenerator';
import { useKanban } from '../hooks/useKanban';

interface DocumentManagerProps {
  documents: Document[];
  owner: BusinessLine | Client | Deal;
  ownerType: DocumentOwnerType;
  kanbanApi: ReturnType<typeof useKanban>;
  onAddDocument: (file: File, category: DocumentCategory, ownerId: string, ownerType: DocumentOwnerType, note?: string) => void;
  onDeleteDocument: (docId: string) => void;
}

const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
);
const DocumentIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
);
const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
);
const DownloadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
);

const DocumentManager: React.FC<DocumentManagerProps> = ({ documents, owner, ownerType, kanbanApi, onAddDocument, onDeleteDocument }) => {
  const [activeTab, setActiveTab] = useState<DocumentCategory>('SOPs');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const tabs: DocumentCategory[] = ['SOPs', 'Legal', 'Templates', 'Marketing', 'Business Development'];
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onAddDocument(file, activeTab, owner.id, ownerType);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const filteredDocuments = documents.filter(doc => doc.category === activeTab);

  return (
    <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
      <div className="flex justify-between items-center mb-4">
          <div className="border-b border-gray-700">
            <nav className="-mb-px flex space-x-6" aria-label="Tabs">
              {tabs.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`${
                    activeTab === tab
                      ? 'border-indigo-500 text-indigo-400'
                      : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'
                  } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>
        <div>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
            <button onClick={triggerFileUpload} className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                <PlusIcon /> Upload Document
            </button>
        </div>
      </div>

      <div>
        <AiDocGenerator 
            category={activeTab}
            owner={owner}
            ownerType={ownerType}
            kanbanApi={kanbanApi}
        />
        <h4 className="text-lg font-semibold text-gray-300 mt-8 mb-4">Uploaded Documents</h4>
        {filteredDocuments.length > 0 ? (
          <ul className="space-y-3">
            {filteredDocuments.map(doc => (
              <li key={doc.id} className="bg-gray-800 p-3 rounded-md flex items-center justify-between border border-gray-700">
                <div className="flex items-center">
                    <DocumentIcon />
                    <div className="ml-3">
                        <p className="text-sm font-medium text-gray-200">{doc.name}</p>
                        <p className="text-xs text-gray-500">Uploaded on {new Date(doc.createdAt).toLocaleDateString()}</p>
                        {doc.note && <p className="text-xs text-gray-400 italic mt-1">Note: "{doc.note}"</p>}
                    </div>
                </div>
                <div className="flex items-center space-x-3">
                    <a href={doc.url} download={doc.name} className="text-gray-400 hover:text-white transition-colors">
                        <DownloadIcon />
                    </a>
                    <button onClick={() => onDeleteDocument(doc.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                        <TrashIcon />
                    </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-10 text-gray-500">
            <p>No documents in "{activeTab}" yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentManager;