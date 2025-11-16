import React, { useState } from 'react';
import { useKanban } from '../hooks/useKanban';
import { BusinessLine, Client, Deal } from '../types';

interface MarketingCollateralGeneratorProps {
    owner: BusinessLine | Client | Deal;
    kanbanApi: ReturnType<typeof useKanban>;
}

type CollateralType = 'Social Media Poster' | 'Social Media Video' | 'Social Media Campaign' | 'Blog' | 'Case Studies';

const MarketingCollateralGenerator: React.FC<MarketingCollateralGeneratorProps> = ({ owner, kanbanApi }) => {
    const [activeTab, setActiveTab] = useState<CollateralType>('Social Media Poster');
    const [prompt, setPrompt] = useState('');
    const [generatedPrompt, setGeneratedPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const tabs: CollateralType[] = ['Social Media Poster', 'Social Media Video', 'Social Media Campaign', 'Blog', 'Case Studies'];

    const handleGenerate = async (isRetry: boolean = false) => {
        if (!prompt) return;
        setIsLoading(true);
        setGeneratedPrompt('');
        const result = await kanbanApi.generateMarketingCollateralPrompt(prompt, activeTab, owner);
        setGeneratedPrompt(result);
        setIsLoading(false);
    };

    return (
        <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
             <div className="border-b border-gray-700 mb-4">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                {tabs.map(tab => (
                    <button
                    key={tab}
                    onClick={() => {
                        setActiveTab(tab);
                        setPrompt('');
                        setGeneratedPrompt('');
                    }}
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
            
            <div className="space-y-3">
                 <p className="text-sm text-gray-500">Describe the goal for your "{activeTab}". The AI will generate a creative prompt you can use in tools like Canva or Midjourney.</p>
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={`e.g., Announce a 20% spring discount for new clients...`}
                    className="w-full h-24 bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500"
                />
                <div className="flex items-center space-x-3">
                    <button
                        onClick={() => handleGenerate(false)}
                        disabled={isLoading || !prompt}
                        className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Generating...' : 'Generate Creative Prompt'}
                    </button>
                    {generatedPrompt && !isLoading && (
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

            {generatedPrompt && (
                <div className="mt-6 bg-gray-800 p-4 rounded-md border border-gray-700">
                     <h5 className="font-semibold text-teal-300 mb-3">AI Generated Creative Prompt:</h5>
                     <pre className="text-gray-300 whitespace-pre-wrap font-sans text-sm">{generatedPrompt}</pre>
                </div>
            )}
        </div>
    );
};

export default MarketingCollateralGenerator;
