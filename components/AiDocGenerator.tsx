import React, { useState } from 'react';
import { useKanban } from '../hooks/useKanban';
import { BusinessLine, Client, Deal, DocumentCategory, DocumentOwnerType } from '../types';

interface AiDocGeneratorProps {
    category: DocumentCategory;
    owner: BusinessLine | Client | Deal;
    ownerType: DocumentOwnerType;
    kanbanApi: ReturnType<typeof useKanban>;
}

const AiDocGenerator: React.FC<AiDocGeneratorProps> = ({ category, owner, ownerType, kanbanApi }) => {
    const [prompt, setPrompt] = useState('');
    const [generatedDraft, setGeneratedDraft] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerate = async (isRetry: boolean = false) => {
        if (!prompt) return;
        setIsLoading(true);
        setGeneratedDraft('');
        const result = await kanbanApi.generateDocumentDraft(prompt, category, owner, ownerType);
        setGeneratedDraft(result);
        setIsLoading(false);
    };

    return (
        <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 mt-4">
            <h4 className="text-lg font-semibold text-gray-300 mb-2">Generate Draft with AI</h4>
            <p className="text-sm text-gray-500 mb-4">Tell the AI what kind of "{category}" document you need. For example: "A simple non-disclosure agreement."</p>
            <div className="space-y-3">
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={`Describe the ${category} document you want to draft for ${owner.name}...`}
                    className="w-full h-24 bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500"
                />
                <div className="flex items-center space-x-3">
                    <button
                        onClick={() => handleGenerate(false)}
                        disabled={isLoading || !prompt}
                        className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Generating...' : 'Generate'}
                    </button>
                    {generatedDraft && !isLoading && (
                         <button
                            onClick={() => handleGenerate(true)}
                            disabled={isLoading}
                            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:bg-gray-500"
                        >
                            Retry
                        </button>
                    )}
                </div>
            </div>

            {generatedDraft && (
                <div className="mt-6 bg-gray-800 p-4 rounded-md border border-gray-700">
                     <h5 className="font-semibold text-teal-300 mb-3">AI Generated Draft:</h5>
                     <pre className="text-gray-300 whitespace-pre-wrap font-sans text-sm">{generatedDraft}</pre>
                </div>
            )}
        </div>
    );
};

export default AiDocGenerator;
