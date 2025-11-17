
import React, { useState } from 'react';
import { Client, ClientPulse, FilterOptions } from '../types';
import { useKanban } from '../hooks/useKanban';

interface ClientPulseViewProps {
    client: Client;
    kanbanApi: ReturnType<typeof useKanban>;
}

const ClientPulseView: React.FC<ClientPulseViewProps> = ({ client, kanbanApi }) => {
    const [pulse, setPulse] = useState<ClientPulse[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleFetchPulse = async () => {
        setIsLoading(true);
        // FIX: Provide the required 'filters' argument to getClientPulse.
        const filters: FilterOptions = {
            location: 'any',
            timeframe: 'last_month',
            scope: 'all',
            customQuery: ''
        };
        const results = await kanbanApi.getClientPulse(client, filters);
        setPulse(results);
        setIsLoading(false);
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-brevo-border">
            <h3 className="text-lg font-semibold text-brevo-text-primary mb-2">Client Pulse</h3>
            <p className="text-sm text-brevo-text-secondary mb-4">Get the latest public updates about {client.name} from around the web.</p>
            <div className="flex justify-between items-center mb-6">
                 <button 
                    onClick={handleFetchPulse} 
                    disabled={isLoading}
                    className="bg-brevo-cta hover:bg-brevo-cta-hover text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:bg-gray-300"
                >
                    {isLoading ? 'Searching...' : 'Check for recent activity'}
                </button>
            </div>

            {pulse.length > 0 && (
                <div className="space-y-4">
                    {pulse.map(item => (
                        <div key={item.id} className="bg-gray-50 border border-brevo-border p-4 rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                                <span className={`text-xs font-bold uppercase tracking-wider ${item.source === 'News' ? 'text-blue-600' : 'text-green-600'}`}>{item.source}</span>
                                <span className="text-xs text-brevo-text-secondary">{new Date(item.date).toLocaleDateString()}</span>
                            </div>
                            <p className="text-brevo-text-secondary mb-2">{item.content}</p>
                            <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                                View source &rarr;
                            </a>
                        </div>
                    ))}
                </div>
            )}
            {pulse.length === 0 && !isLoading && (
                 <div className="text-center py-10 text-brevo-text-secondary bg-gray-50 rounded-lg border-dashed border-2 border-gray-200">
                    <p>No recent activity found. Click the button to search.</p>
                </div>
            )}
        </div>
    );
};

export default ClientPulseView;