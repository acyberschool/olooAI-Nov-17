
import React, { useState, useRef } from 'react';
import { Document, DocumentCategory, DocumentOwnerType, BusinessLine, Client, Deal } from '../types';
import AiDocGenerator from './AiDocGenerator';
import { useKanban } from '../hooks/useKanban';

interface DocumentManagerProps {
  documents: Document[];
  owner: BusinessLine | Client | Deal;
  ownerType: DocumentOwnerType;
  kanbanApi: ReturnType<typeof useKanban>;
  onAddDocument: (file: any, category: DocumentCategory, ownerId: string, ownerType: DocumentOwnerType, note?: string) => Document;
  onDeleteDocument: (docId: string) => void;
}

const PlusIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>);
const DocumentIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-brevo-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>);
const TrashIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>);
const DownloadIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>);
const GoogleDriveIcon = () => (<svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.7121 21.4398L15.4242 9.01469L22.9999 13.2503L15.2878 21.4398H7.7121Z" fill="#34A853"/><path d="M4.00006 7.06018L11.7122 7.06018L15.4243 1L1 13.2503L4.00006 7.06018Z" fill="#FFC107"/><path d="M15.4243 9.0149L23 13.2505L19.2879 19.4398L11.7122 7.06041L15.4243 9.0149Z" fill="#EA4335"/><path d="M22.9999 13.2503L15.4242 1L8.80304 13.2503L15.2878 21.4398L22.9999 13.2503Z" fill="#4285F4"/></svg>)


const DocumentManager: React.FC<DocumentManagerProps> = ({ documents, owner, ownerType, kanbanApi, onAddDocument, onDeleteDocument }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDriveConnected, setIsDriveConnected] = useState(false);

  const localTabs: DocumentCategory[] = ['SOPs', 'Legal', 'Templates', 'Marketing', 'Business Development'];
  const [activeLocalTab, setActiveLocalTab] = useState<DocumentCategory>('SOPs');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onAddDocument(file, activeLocalTab, owner.id, ownerType);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const filteredDocuments = documents.filter(doc => doc.category === activeLocalTab && !doc.url.startsWith('https://docs.google.com'));
  const googleDocs = documents.filter(doc => doc.url.startsWith('https://docs.google.com'));

  return (
    <div className="bg-white p-6 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-brevo-border">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
        <h3 className="text-lg font-semibold text-brevo-text-primary">Local</h3>
        <div className="flex items-center gap-2 flex-wrap">
            {!isDriveConnected && <button onClick={() => setIsDriveConnected(true)} className="flex items-center bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg text-sm"><GoogleDriveIcon /> Connect Google Drive</button>}
            <button onClick={triggerFileUpload} className="flex items-center bg-brevo-cta hover:bg-brevo-cta-hover text-white font-bold py-2 px-4 rounded-lg text-sm"><PlusIcon /> Upload Local File</button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
        </div>
      </div>
      
      {/* Local Documents Section */}
      <div className="mb-8">
            <div className="border-b border-brevo-border mb-4">
                <nav className="-mb-px flex space-x-4 overflow-x-auto">
                    {localTabs.map(tab => (<button key={tab} onClick={() => setActiveLocalTab(tab)} className={`${activeLocalTab === tab ? 'border-brevo-cta text-brevo-cta' : 'border-transparent text-brevo-text-secondary hover:text-brevo-text-primary'} whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}>{tab}</button>))}
                </nav>
            </div>
            <AiDocGenerator category={activeLocalTab} owner={owner} ownerType={ownerType} kanbanApi={kanbanApi} isDriveConnected={isDriveConnected} />
            <h5 className="text-base font-semibold text-brevo-text-primary mt-8 mb-4">Uploaded "{activeLocalTab}"</h5>
            {filteredDocuments.length > 0 ? (
            <ul className="space-y-3">
                {filteredDocuments.map(doc => (
                <li key={doc.id} className="bg-white p-3 rounded-md flex items-center justify-between border border-brevo-border">
                    <div className="flex items-center"><DocumentIcon /><div className="ml-3"><p className="text-sm font-medium text-brevo-text-primary">{doc.name}</p><p className="text-xs text-brevo-text-secondary">Uploaded on {new Date(doc.createdAt).toLocaleDateString()}</p>{doc.note && <p className="text-xs text-brevo-text-secondary italic mt-1">Note: "{doc.note}"</p>}</div></div>
                    <div className="flex items-center space-x-3"><a href={doc.url} download={doc.name} className="text-brevo-text-secondary hover:text-brevo-text-primary"><DownloadIcon /></a><button onClick={() => onDeleteDocument(doc.id)} className="text-brevo-text-secondary hover:text-red-500"><TrashIcon /></button></div>
                </li>))}
            </ul>) : (<div className="text-center py-10 text-brevo-text-secondary bg-gray-50 rounded-lg border border-dashed border-gray-300"><p>No documents in "{activeLocalTab}" yet.</p></div>)}
        </div>
      
      {/* Google Drive Section */}
      {isDriveConnected && (
       <div className="mt-8 pt-6 border-t border-brevo-border">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
              <h4 className="text-base font-semibold text-brevo-text-primary">Google Drive Documents</h4>
              <button onClick={() => onAddDocument({name: 'New Google Doc', content:''}, 'Templates', owner.id, ownerType)} className="flex items-center bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg text-sm"><PlusIcon /> New Google Doc</button>
            </div>
            {googleDocs.length > 0 ? (
            <ul className="space-y-3">
                {googleDocs.map(doc => (
                <li key={doc.id} className="bg-white p-3 rounded-md flex items-center justify-between border border-brevo-border">
                    <div className="flex items-center"><GoogleDriveIcon /><div className="ml-3"><a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-600 hover:underline">{doc.name}</a><p className="text-xs text-brevo-text-secondary">Created on {new Date(doc.createdAt).toLocaleDateString()}</p>{doc.note && <p className="text-xs text-brevo-text-secondary italic mt-1">Note: "{doc.note}"</p>}</div></div>
                    <div className="flex items-center space-x-3"><button onClick={() => onDeleteDocument(doc.id)} className="text-brevo-text-secondary hover:text-red-500"><TrashIcon /></button></div>
                </li>))}
            </ul>) : (<div className="text-center py-10 text-brevo-text-secondary bg-gray-50 rounded-lg border border-dashed border-gray-300"><p>No Google Docs created yet.</p></div>)}
       </div>
       )}
    </div>
  );
};

export default DocumentManager;