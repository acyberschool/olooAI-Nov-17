
import React, { useState } from 'react';
import { BusinessLine, CompetitorInsight, SearchTrend, FilterOptions } from '../types';
import { useKanban } from '../hooks/useKanban';

interface CompetitorsViewProps {
    businessLine: BusinessLine;
    kanbanApi: ReturnType<typeof useKanban>;
}

const CompetitorsView: React.FC<CompetitorsViewProps> = ({ businessLine, kanbanApi }) => {
    const [insights, setInsights] = useState<CompetitorInsight[]>([]);
    const [trends, setTrends] = useState<SearchTrend[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleFetchInsights = async () => {
        setIsLoading(true);
        // FIX: Provide the required 'filters' argument to getCompetitorInsights.
        const filters: FilterOptions = {
            location: 'any',
            timeframe: 'last_3_months',
            scope: 'all',
            customQuery: ''
        };
        const { insights, trends } = await kanbanApi.getCompetitorInsights(businessLine, filters);
        setInsights(insights);
        setTrends(trends);
        setIsLoading(false);
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-brevo-border">
                <h3 className="text-lg font-semibold text-brevo-text-primary mb-2">Competitive Landscape</h3>
                <p className="text-sm text-brevo-text-secondary mb-4">Ask Walter to analyze what your competitors are doing and what customers are searching for.</p>
                 <button 
                    onClick={handleFetchInsights} 
                    disabled={isLoading}
                    className="bg-brevo-cta hover:bg-brevo-cta-hover text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:bg-gray-300"
                >
                    {isLoading ? 'Analyzing...' : 'Get Competitor Insights'}
                </button>
            </div>
            
            {insights.length > 0 && (
                <div className="bg-white p-6 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-brevo-border">
                     <h3 className="text-lg font-semibold text-brevo-text-primary mb-4">Competitor Activity</h3>
                     <div className="space-y-4">
                        {insights.map(item => (
                            <div key={item.id} className="bg-gray-50 border border-brevo-border p-4 rounded-lg">
                                <p className="font-semibold text-brevo-text-primary">{item.competitorName}</p>
                                <p className="text-brevo-text-secondary my-1">{item.insight}</p>
                                <a href={item.source} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                                    Source
                                </a>
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
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CompetitorsView;