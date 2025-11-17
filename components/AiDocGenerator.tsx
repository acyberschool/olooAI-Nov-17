import React, { useState } from 'react';
import { useKanban } from '../hooks/useKanban';
import { BusinessLine, Client, Deal, DocumentCategory, DocumentOwnerType } from '../types';

interface AiDocGeneratorProps {
    category: DocumentCategory;
    owner: BusinessLine | Client | Deal;
    ownerType: DocumentOwnerType;
    kanbanApi: ReturnType<typeof useKanban>;
    isDriveConnected?: boolean; // Mock prop
}

const AiDocGenerator: React.FC<AiDocGeneratorProps> = ({ category, owner, ownerType, kanbanApi, isDriveConnected }) => {
    const [prompt, setPrompt] = useState('');
    const [generatedDraft, setGeneratedDraft] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerate = async (isRetry: boolean = false) => {
        if (!prompt) return;
        setIsLoading(true);
        if (!isRetry) {
            setGeneratedDraft('');
        }
        const result = await kanbanApi.generateDocumentDraft(prompt, category, owner, ownerType);
        setGeneratedDraft(result);
        setIsLoading(false);
    };
    
    const handleCopy = () => {
        navigator.clipboard.writeText(generatedDraft);
    }
    
    const handleSaveToDrive = () => {
        kanbanApi.addDocument({ name: `${prompt}.gdoc`, content: generatedDraft }, category, owner.id, ownerType);
        setGeneratedDraft('');
        setPrompt('');
        alert('Document saved to Google Drive (mock)');
    }


    return (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-4">
            <h4 className="text-base font-semibold text-brevo-text-primary mb-2">Generate Draft with AI</h4>
            <p className="text-sm text-brevo-text-secondary mb-4">Tell the AI what kind of "{category}" document you need. For example: "A simple non-disclosure agreement."</p>
            <div className="space-y-3">
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={`Describe the ${category} document you want to draft for ${owner.name}...`}
                    className="w-full h-24 bg-white border border-brevo-border rounded-md px-3 py-2 text-brevo-text-primary focus:ring-2 focus:ring-brevo-cta"
                />
                <div className="flex items-center space-x-3">
                    <button
                        onClick={() => handleGenerate(false)}
                        disabled={isLoading || !prompt}
                        className="bg-brevo-cta hover:bg-brevo-cta-hover text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Generating...' : 'Generate'}
                    </button>
                </div>
            </div>

            {generatedDraft && (
                <div className="mt-6 bg-white p-4 rounded-md border border-brevo-border">
                     <div className="flex justify-between items-center mb-3">
                        <h5 className="font-semibold text-green-700">AI Generated Draft:</h5>
                        <div className="flex space-x-2">
                             {isDriveConnected && <button onClick={handleSaveToDrive} className="text-xs bg-blue-500 hover:bg-blue-600 text-white font-semibold py-1 px-2 rounded-md">Save to Google Drive</button>}
                             <button onClick={handleCopy} className="text-xs bg-gray-200 hover:bg-gray-300 text-brevo-text-primary font-semibold py-1 px-2 rounded-md">Copy</button>
                             <button onClick={() => handleGenerate(true)} disabled={isLoading} className="text-xs bg-gray-200 hover:bg-gray-300 text-brevo-text-primary font-semibold py-1 px-2 rounded-md">Retry</button>
                        </div>
                     </div>
                     <pre className="text-brevo-text-secondary whitespace-pre-wrap font-sans text-sm">{generatedDraft}</pre>
                </div>
            )}
        </div>
    );
};

export default AiDocGenerator;