

import React, { useState } from 'react';
import { Client, ClientPulse, FilterOptions } from '../types';
import { useKanban } from '../hooks/useKanban';
import AiPromptModal from './AiPromptModal';

interface ClientPulseViewProps {
    client: Client;
    kanbanApi: ReturnType<typeof useKanban>;
}

const PlusIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>);


const ClientPulseView: React.FC<ClientPulseViewProps> = ({ client, kanbanApi }) => {
    const [pulse, setPulse] = useState<ClientPulse[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
    const [filters, setFilters] = useState<FilterOptions>({
        location: 'any',
        timeframe: 'last_month',
        scope: 'all',
        customQuery: ''
    });

    const handleFetchPulse = async (customPrompt?: string) => {
        setIsLoading(true);
        const results = await kanbanApi.getClientPulse(client, filters, customPrompt);
        setPulse(results);
        setIsLoading(false);
    };

    const initialPrompt = `Based on external research, find recent public social media posts or news articles mentioning "${client.name}". Apply the following filters: ${JSON.stringify(filters)}. For each result, provide the source, content snippet, a URL, and a date. Return ONLY a valid JSON array of objects with keys: "source", "content", "url", "date".`;

    return (
        <div className="bg-white p-6 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-brevo-border">
            <h3 className="text-lg font-semibold text-brevo-text-primary mb-2">Client Pulse</h3>
            <p className="text-sm text-brevo-text-secondary mb-4">Get the latest public updates about {client.name} from around the web.</p>
            
            <div className="bg-gray-50 p-3 rounded-lg border border-brevo-border mb-6 flex flex-wrap items-center gap-4">
                <span className="text-sm font-medium text-brevo-text-secondary">Filters:</span>
                <div>
                    <label htmlFor="timeframe" className="sr-only">Timeframe</label>
                    <select
                        id="timeframe"
                        value={filters.timeframe}
                        onChange={(e) => setFilters(f => ({...f, timeframe: e.target.value}))}
                        className="bg-white border-brevo-border rounded-md px-2 py-1 text-sm focus:ring-brevo-cta-hover focus:border-brevo-cta-hover"
                    >
                        <option value="last_week">Last Week</option>
                        <option value="last_month">Last Month</option>
                        <option value="last_3_months">Last 3 Months</option>
                    </select>
                </div>
                <div>
                     <label htmlFor="scope" className="sr-only">Scope</label>
                    <select
                        id="scope"
                        value={filters.scope}
                        onChange={(e) => setFilters(f => ({...f, scope: e.target.value}))}
                        className="bg-white border-brevo-border rounded-md px-2 py-1 text-sm focus:ring-brevo-cta-hover focus:border-brevo-cta-hover"
                    >
                        <option value="all">News & Social</option>
                        <option value="news">News Only</option>
                        <option value="social">Social Media Only</option>
                    </select>
                </div>
                 <div className="flex items-center gap-2">
                    <button 
                        onClick={() => handleFetchPulse()} 
                        disabled={isLoading}
                        className="bg-brevo-cta hover:bg-brevo-cta-hover text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:bg-gray-300"
                    >
                        {isLoading ? 'Searching...' : 'Search'}
                    </button>
                    <button
                        onClick={() => setIsPromptModalOpen(true)}
                        className="text-sm text-brevo-text-secondary hover:underline"
                    >
                        Finetune
                    </button>
                 </div>
            </div>


            {pulse.length > 0 && !isLoading && (
                <div className="space-y-4">
                    {pulse.map(item => (
                        <div key={item.id} className="bg-gray-50 border border-brevo-border p-4 rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                                <span className={`text-xs font-bold uppercase tracking-wider ${item.source === 'News' ? 'text-blue-600' : 'text-green-600'}`}>{item.source}</span>
                                <span className="text-xs text-brevo-text-secondary">{new Date(item.date).toLocaleDateString()}</span>
                            </div>
                            <p className="text-brevo-text-secondary mb-2">{item.content}</p>
                            <div className="flex justify-between items-center">
                                <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                                    View source &rarr;
                                </a>
                                <button
                                    onClick={() => kanbanApi.addTask({ title: `Follow up on pulse: "${item.content.substring(0, 40)}..."`, clientId: client.id, businessLineId: client.businessLineId })}
                                    className="flex items-center text-xs bg-gray-200 hover:bg-gray-300 text-brevo-text-primary font-semibold py-1 px-2 rounded-md transition-colors"
                                >
                                    <PlusIcon /> Add task
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {pulse.length === 0 && !isLoading && (
                 <div className="text-center py-10 text-brevo-text-secondary bg-gray-50 rounded-lg border-dashed border-2 border-gray-200">
                    <p>No recent activity found. Click the search button to start.</p>
                </div>
            )}

            <AiPromptModal
                isOpen={isPromptModalOpen}
                onClose={() => setIsPromptModalOpen(false)}
                onGenerate={(prompt) => handleFetchPulse(prompt)}
                title={`Finetune Pulse Search for ${client.name}`}
                description="Edit the prompt below to give Walter more specific instructions for the web search."
                initialPrompt={initialPrompt}
            />
        </div>
    );
};

export default ClientPulseView;