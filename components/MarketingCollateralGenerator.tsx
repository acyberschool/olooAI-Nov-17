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
    const [generatedContent, setGeneratedContent] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isEnhancing, setIsEnhancing] = useState(false);

    const tabs: CollateralType[] = ['Social Media Poster', 'Social Media Video', 'Social Media Campaign', 'Blog', 'Case Studies'];
    const isVisual = activeTab === 'Social Media Poster' || activeTab === 'Social Media Video';

    const handleGenerate = async () => {
        if (!prompt) return;
        setIsLoading(true);
        setGeneratedContent('');
        const result = await kanbanApi.generateMarketingCollateralContent(prompt, activeTab, owner);
        setGeneratedContent(result);
        setIsLoading(false);
    };

    const handleEnhancePrompt = async () => {
        if (!prompt) return;
        setIsEnhancing(true);
        const enhanced = await kanbanApi.enhanceUserPrompt(prompt);
        setPrompt(enhanced);
        setIsEnhancing(false);
    };

    const handleDownload = () => {
        const blob = new Blob([generatedContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${activeTab.replace(' ', '_')}_content.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleCanva = () => {
        alert("Connecting to Canva to generate your visual...\n(This is a placeholder for a real integration)");
    }

    return (
        <div className="bg-white p-6 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-brevo-border">
            <h3 className="text-lg font-semibold text-brevo-text-primary mb-4">Generate Marketing Materials</h3>
             <div className="border-b border-[#E5E7EB] mb-4">
                <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
                {tabs.map(tab => (
                    <button
                    key={tab}
                    onClick={() => {
                        setActiveTab(tab);
                        setPrompt('');
                        setGeneratedContent('');
                    }}
                    className={`${
                        activeTab === tab
                        ? 'border-brevo-cta text-brevo-cta'
                        : 'border-transparent text-brevo-text-secondary hover:text-brevo-text-primary hover:border-gray-300'
                    } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors`}
                    >
                    {tab}
                    </button>
                ))}
                </nav>
            </div>
            
            <div className="space-y-3">
                 <p className="text-sm text-brevo-text-secondary">Describe the goal for your "{activeTab}". The AI will generate the content for you.</p>
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={`e.g., Announce a 20% spring discount for new clients...`}
                    className="w-full h-24 bg-white border border-[#E5E7EB] rounded-md px-3 py-2 text-[#111827] focus:ring-2 focus:ring-brevo-cta"
                />
                <div className="flex items-center space-x-3">
                    <button
                        onClick={handleGenerate}
                        disabled={isLoading || !prompt}
                        className="bg-brevo-cta hover:bg-brevo-cta-hover text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Generating...' : 'Generate Content'}
                    </button>
                    <button
                        onClick={handleEnhancePrompt}
                        disabled={isEnhancing || !prompt}
                        className="text-sm text-brevo-cta hover:underline disabled:text-gray-400"
                    >
                         {isEnhancing ? 'Enhancing...' : 'Enhance prompt'}
                    </button>
                </div>
            </div>

            {generatedContent && (
                <div className="mt-6 bg-gray-50 p-4 rounded-md border border-brevo-border">
                    <div className="flex justify-between items-center mb-3">
                        <h5 className="font-semibold text-green-700">AI Generated Content:</h5>
                         <div className="flex space-x-2">
                           {isVisual ? (
                               <button onClick={handleCanva} className="text-sm bg-blue-500 hover:bg-blue-600 text-white font-semibold py-1 px-3 rounded-md">Generate on Canva</button>
                           ) : (
                               <button onClick={handleDownload} className="text-sm bg-gray-200 hover:bg-gray-300 text-brevo-text-primary font-semibold py-1 px-3 rounded-md">Download .txt</button>
                           )}
                        </div>
                    </div>
                     <pre className="text-brevo-text-secondary whitespace-pre-wrap font-sans text-sm">{generatedContent}</pre>
                </div>
            )}
        </div>
    );
};

export default MarketingCollateralGenerator;