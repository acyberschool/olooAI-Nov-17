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
        if (!isRetry) {
            setGeneratedPrompt('');
        }
        const result = await kanbanApi.generateMarketingCollateralPrompt(prompt, activeTab, owner);
        setGeneratedPrompt(result);
        setIsLoading(false);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(generatedPrompt);
    }

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-[#E5E7EB]">
             <div className="border-b border-[#E5E7EB] mb-4">
                <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
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
                        ? 'border-[#15803D] text-[#15803D]'
                        : 'border-transparent text-[#6B7280] hover:text-[#111827] hover:border-gray-300'
                    } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors`}
                    >
                    {tab}
                    </button>
                ))}
                </nav>
            </div>
            
            <div className="space-y-3">
                 <p className="text-sm text-[#6B7280]">Describe the goal for your "{activeTab}". The AI will generate a creative prompt you can use in tools like Canva or Midjourney.</p>
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={`e.g., Announce a 20% spring discount for new clients...`}
                    className="w-full h-24 bg-white border border-[#E5E7EB] rounded-md px-3 py-2 text-[#111827] focus:ring-2 focus:ring-[#15803D]"
                />
                <div className="flex items-center space-x-3">
                    <button
                        onClick={() => handleGenerate(false)}
                        disabled={isLoading || !prompt}
                        className="bg-[#15803D] hover:bg-[#166534] text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Generating...' : 'Generate Creative Prompt'}
                    </button>
                </div>
            </div>

            {generatedPrompt && (
                <div className="mt-6 bg-gray-50 p-4 rounded-md border border-[#E5E7EB]">
                    <div className="flex justify-between items-center mb-3">
                        <h5 className="font-semibold text-[#15803D]">AI Generated Creative Prompt:</h5>
                        <div className="flex space-x-2">
                            <button onClick={handleCopy} className="text-xs bg-[#E5E7EB] hover:bg-gray-200 text-[#374151] font-semibold py-1 px-2 rounded-md">Copy</button>
                            <button onClick={() => handleGenerate(true)} disabled={isLoading} className="text-xs bg-[#E5E7EB] hover:bg-gray-200 text-[#374151] font-semibold py-1 px-2 rounded-md">Retry</button>
                        </div>
                    </div>
                     <pre className="text-[#374151] whitespace-pre-wrap font-sans text-sm">{generatedPrompt}</pre>
                </div>
            )}
        </div>
    );
};

export default MarketingCollateralGenerator;