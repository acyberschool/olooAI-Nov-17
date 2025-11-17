

import React, { useState } from 'react';
import { BusinessLine, CompetitorInsight, SearchTrend, FilterOptions } from '../types';
import { useKanban } from '../hooks/useKanban';
import AiPromptModal from './AiPromptModal';

interface CompetitorsViewProps {
    businessLine: BusinessLine;
    kanbanApi: ReturnType<typeof useKanban>;
}

const PlusIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>);


const CompetitorsView: React.FC<CompetitorsViewProps> = ({ businessLine, kanbanApi }) => {
    const [insights, setInsights] = useState<CompetitorInsight[]>([]);
    const [trends, setTrends] = useState<SearchTrend[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
    const [filters, setFilters] = useState<FilterOptions>({
        location: 'any',
        timeframe: 'last_3_months',
        scope: 'all',
        customQuery: ''
    });

    const handleFetchInsights = async (customPrompt?: string) => {
        setIsLoading(true);
        const { insights, trends } = await kanbanApi.getCompetitorInsights(businessLine, filters, customPrompt);
        setInsights(insights);
        setTrends(trends);
        setIsLoading(false);
    };

    const initialPrompt = `For a business in "${businessLine.name}", perform a deep search online. Apply these filters: ${JSON.stringify(filters)}.
        1. Identify 2-3 key competitors and provide a recent insight for each.
        2. Identify 2-3 recent customer search trends related to this business.
        Return ONLY a valid JSON object with two keys: "insights" (an array of objects with "competitorName", "insight", "source") and "trends" (an array of objects with "keyword", "insight").`;

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-brevo-border">
                <h3 className="text-lg font-semibold text-brevo-text-primary mb-2">Competitive Landscape</h3>
                <p className="text-sm text-brevo-text-secondary mb-4">Ask Walter to analyze what your competitors are doing and what customers are searching for.</p>
                <div className="bg-gray-50 p-3 rounded-lg border border-brevo-border mb-6 flex flex-wrap items-center gap-4">
                     <span className="text-sm font-medium text-brevo-text-secondary">Filters:</span>
                     <div>
                        <label htmlFor="timeframe-comp" className="sr-only">Timeframe</label>
                        <select
                            id="timeframe-comp"
                            value={filters.timeframe}
                            onChange={(e) => setFilters(f => ({...f, timeframe: e.target.value}))}
                            className="bg-white border-brevo-border rounded-md px-2 py-1 text-sm focus:ring-brevo-cta-hover focus:border-brevo-cta-hover"
                        >
                            <option value="last_month">Last Month</option>
                            <option value="last_3_months">Last 3 Months</option>
                            <option value="last_6_months">Last 6 Months</option>
                        </select>
                    </div>
                     <div>
                        <label htmlFor="location-comp" className="sr-only">Location</label>
                        <input
                            id="location-comp"
                            type="text"
                            placeholder="Location (e.g., Nairobi)"
                            value={filters.location}
                            onChange={(e) => setFilters(f => ({...f, location: e.target.value}))}
                            className="bg-white border-brevo-border rounded-md px-2 py-1 text-sm focus:ring-brevo-cta-hover focus:border-brevo-cta-hover"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                         <button 
                            onClick={() => handleFetchInsights()} 
                            disabled={isLoading}
                            className="bg-brevo-cta hover:bg-brevo-cta-hover text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:bg-gray-300"
                        >
                            {isLoading ? 'Analyzing...' : 'Get Insights'}
                        </button>
                        <button
                            onClick={() => setIsPromptModalOpen(true)}
                            className="text-sm text-brevo-text-secondary hover:underline"
                        >
                            Finetune
                        </button>
                    </div>
                </div>
            </div>
            
            {(insights.length > 0 || trends.length > 0) && !isLoading &&
            <>
                {insights.length > 0 && (
                    <div className="bg-white p-6 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-brevo-border">
                        <h3 className="text-lg font-semibold text-brevo-text-primary mb-4">Competitor Activity</h3>
                        <div className="space-y-4">
                            {insights.map(item => (
                                <div key={item.id} className="bg-gray-50 border border-brevo-border p-4 rounded-lg">
                                    <p className="font-semibold text-brevo-text-primary">{item.competitorName}</p>
                                    <p className="text-brevo-text-secondary my-1">{item.insight}</p>
                                    <div className="flex justify-between items-center mt-2">
                                        <a href={item.source} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                                            Source &rarr;
                                        </a>
                                        <button
                                            onClick={() => kanbanApi.addTask({ title: `Analyze competitor: ${item.competitorName}`, description: item.insight, businessLineId: businessLine.id })}
                                            className="flex items-center text-xs bg-gray-200 hover:bg-gray-300 text-brevo-text-primary font-semibold py-1 px-2 rounded-md transition-colors"
                                        >
                                            <PlusIcon /> Add task
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                
                {trends.length > 0 && (
                    <div className="bg-white p-6 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-brevo-border">
                        <h3 className="text-lg font-semibold text-brevo-text-primary mb-4">Customer Search Trends</h3>
                        <div className="space-y-4">
                            {trends.map(item => (
                                <div key={item.id} className="bg-gray-50 border border-brevo-border p-4 rounded-lg">
                                    <p className="font-semibold text-brevo-text-primary">Keyword: "{item.keyword}"</p>
                                    <p className="text-brevo-text-secondary mt-1">{item.insight}</p>
                                     <div className="flex justify-end mt-2">
                                        <button
                                            onClick={() => kanbanApi.addTask({ title: `Capitalize on trend: "${item.keyword}"`, description: item.insight, businessLineId: businessLine.id })}
                                            className="flex items-center text-xs bg-gray-200 hover:bg-gray-300 text-brevo-text-primary font-semibold py-1 px-2 rounded-md transition-colors"
                                        >
                                            <PlusIcon /> Add task
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </>
            }
             <AiPromptModal
                isOpen={isPromptModalOpen}
                onClose={() => setIsPromptModalOpen(false)}
                onGenerate={(prompt) => handleFetchInsights(prompt)}
                title={`Finetune Competitor Analysis for ${businessLine.name}`}
                description="Edit the prompt below for a more specific analysis."
                initialPrompt={initialPrompt}
            />
        </div>
    );
};

export default CompetitorsView;