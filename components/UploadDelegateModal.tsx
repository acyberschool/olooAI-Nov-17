
import React, { useState, useRef } from 'react';
import { DelegationPlan } from '../types';
import { planDelegation } from '../services/waltersDeskService';
import { useKanban } from '../hooks/useKanban';

interface UploadDelegateModalProps {
  isOpen: boolean;
  onClose: () => void;
  kanbanApi: ReturnType<typeof useKanban>;
}

const UploadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
);

const FileIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;

const UploadDelegateModal: React.FC<UploadDelegateModalProps> = ({ isOpen, onClose, kanbanApi }) => {
    const [step, setStep] = useState<'upload' | 'planning' | 'review' | 'executing' | 'done'>('upload');
    const [instruction, setInstruction] = useState('');
    const [files, setFiles] = useState<{ base64: string, mimeType: string, name: string }[]>([]);
    const [plan, setPlan] = useState<DelegationPlan | null>(null);
    const [executionLog, setExecutionLog] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            Array.from(e.target.files).forEach(file => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64String = reader.result as string;
                    const base64 = base64String.split(',')[1];
                    setFiles(prev => [...prev, { base64, mimeType: file.type, name: file.name }]);
                };
                reader.readAsDataURL(file);
            });
        }
    };

    const handlePlan = async () => {
        if (!instruction && files.length === 0) return;
        setStep('planning');
        
        const generatedPlan = await planDelegation(
            files, 
            instruction, 
            { 
                businessLines: kanbanApi.businessLines.map(b => b.name), 
                clients: kanbanApi.clients.map(c => c.name) 
            }
        );

        if (generatedPlan) {
            setPlan(generatedPlan);
            setStep('review');
        } else {
            alert("Walter couldn't understand the input. Please try again.");
            setStep('upload');
        }
    };

    const handleExecute = async () => {
        if (!plan) return;
        setStep('executing');
        setExecutionLog(["Starting execution..."]);

        await kanbanApi.executeDelegationPlan(plan, (log) => {
            setExecutionLog(prev => [...prev, log]);
        });

        setStep('done');
    };

    const handleClose = () => {
        setStep('upload');
        setInstruction('');
        setFiles([]);
        setPlan(null);
        setExecutionLog([]);
        onClose();
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[70] p-4" onClick={handleClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl border border-white/20 overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                <div className="p-6 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-brevo-text-primary">Walter's Desk</h2>
                        <p className="text-sm text-brevo-text-secondary">Upload & Delegate. Walter handles the rest.</p>
                    </div>
                    <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
                </div>

                {/* Body */}
                <div className="p-8 flex-1 overflow-y-auto">
                    
                    {step === 'upload' && (
                        <div className="space-y-6">
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-gray-300 rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
                            >
                                <UploadIcon />
                                <p className="text-gray-600 font-medium">Drop files here or click to upload</p>
                                <p className="text-xs text-gray-400 mt-1">PDF, Docs, Excel, Images, Audio</p>
                                <input type="file" multiple ref={fileInputRef} className="hidden" onChange={handleFileSelect} />
                            </div>

                            {files.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {files.map((f, i) => (
                                        <span key={i} className="inline-flex items-center bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm border border-blue-100">
                                            <FileIcon /> <span className="ml-2 truncate max-w-[150px]">{f.name}</span>
                                        </span>
                                    ))}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Instructions</label>
                                <textarea 
                                    value={instruction}
                                    onChange={e => setInstruction(e.target.value)}
                                    placeholder="e.g., 'These are the field notes from this week. Create clients for every company mentioned, set up deals for the qualified leads, and draft a follow-up email for each.'"
                                    className="w-full border border-gray-300 rounded-xl p-4 h-32 focus:ring-2 focus:ring-brevo-cta outline-none resize-none"
                                />
                            </div>
                        </div>
                    )}

                    {step === 'planning' && (
                        <div className="flex flex-col items-center justify-center py-20 space-y-4">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brevo-cta"></div>
                            <p className="text-lg font-medium text-gray-600">Walter is reading your files and building a plan...</p>
                        </div>
                    )}

                    {step === 'review' && plan && (
                        <div className="space-y-6">
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-blue-900">
                                <p className="font-medium">Walter's Plan:</p>
                                <p className="text-sm mt-1">{plan.summary_text}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <h4 className="font-bold text-gray-700 mb-2">To Create:</h4>
                                    <ul className="space-y-2 text-sm text-gray-600">
                                        {plan.businessLinesToCreate.length > 0 && <li>🏭 {plan.businessLinesToCreate.length} Business Lines</li>}
                                        {plan.clientsToCreateOrUpdate.length > 0 && <li>🏢 {plan.clientsToCreateOrUpdate.length} Clients</li>}
                                        {plan.projectsToCreate.length > 0 && <li>🚀 {plan.projectsToCreate.length} Projects</li>}
                                        {plan.dealsToCreate.length > 0 && <li>💰 {plan.dealsToCreate.length} Deals</li>}
                                        {plan.eventsToCreate.length > 0 && <li>📅 {plan.eventsToCreate.length} Events</li>}
                                    </ul>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <h4 className="font-bold text-gray-700 mb-2">Actions:</h4>
                                    <ul className="space-y-2 text-sm text-gray-600">
                                        {plan.tasksToCreate.length > 0 && <li>✅ {plan.tasksToCreate.length} Tasks</li>}
                                        {plan.wikiPagesToCreate.length > 0 && <li>📚 {plan.wikiPagesToCreate.length} Wiki Pages</li>}
                                        {plan.crmEntriesToCreate.length > 0 && <li>📝 {plan.crmEntriesToCreate.length} CRM Entries</li>}
                                    </ul>
                                </div>
                            </div>
                            
                            <div className="text-xs text-gray-400 text-center">
                                Click "Approve & Run" to execute all these actions in the background.
                            </div>
                        </div>
                    )}

                    {(step === 'executing' || step === 'done') && (
                        <div className="space-y-4">
                            <h3 className="font-bold text-lg text-gray-800">Execution Log</h3>
                            <div className="bg-black text-green-400 font-mono text-sm p-4 rounded-xl h-64 overflow-y-auto shadow-inner">
                                {executionLog.map((log, i) => (
                                    <div key={i} className="mb-1">> {log}</div>
                                ))}
                                {step === 'executing' && <div className="animate-pulse">> Processing...</div>}
                                {step === 'done' && <div className="text-white mt-2">> ALL DONE.</div>}
                            </div>
                        </div>
                    )}

                </div>

                {/* Footer */}
                <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                    {step === 'upload' && (
                        <button onClick={handlePlan} disabled={!instruction && files.length === 0} className="w-full bg-brevo-cta hover:bg-brevo-cta-hover text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
                            Let Walter Plan
                        </button>
                    )}
                    {step === 'review' && (
                        <>
                            <button onClick={() => setStep('upload')} className="text-gray-600 font-medium hover:text-gray-900 px-4">Retry</button>
                            <button onClick={handleExecute} className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg flex items-center">
                                Approve & Run 🚀
                            </button>
                        </>
                    )}
                    {step === 'done' && (
                        <button onClick={handleClose} className="w-full bg-gray-900 text-white font-bold py-3 rounded-xl">
                            Close & View Work
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UploadDelegateModal;
