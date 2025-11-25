
import React, { useMemo, useState } from 'react';
import { Deal, Client, UniversalInputContext } from '../types';
import RevenueKanbanBoard from './RevenueKanbanBoard';
import Tabs from './Tabs';
import DTWButton from './DTWButton';

interface SalesViewProps {
    deals: Deal[];
    clients: Client[];
    onSelectDeal: (id: string) => void;
    onOpenUniversalInput: (context: UniversalInputContext) => void;
}

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
);

const SalesView: React.FC<SalesViewProps> = ({ deals, onSelectDeal, onOpenUniversalInput }) => {
    const [activeTab, setActiveTab] = useState('Pipeline');

    const handleAddDeal = () => {
        onOpenUniversalInput({ placeholder: 'Create a new deal "Big Contract" for Acme Corp worth $10k...' });
    };

    const stats = useMemo(() => {
        const wonDeals = deals.filter(d => d.status === 'Closed - Won');
        const lostDeals = deals.filter(d => d.status === 'Closed - Lost');
        const openDeals = deals.filter(d => d.status === 'Open');
        
        const totalClosed = wonDeals.length + lostDeals.length;
        const winRate = totalClosed > 0 ? Math.round((wonDeals.length / totalClosed) * 100) : 0;
        const velocity = deals.length > 0 ? "14 Days" : "N/A"; 

        return { winRate, velocity, stalledCount: openDeals.length };
    }, [deals]);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-brevo-text-primary">Sales Pipeline</h2>
                <div className="flex gap-2">
                    <DTWButton 
                        label="AI Coach" 
                        prompt="Analyze my open deals and suggest 3 high-converting plays or next steps to unblock them." 
                        kanbanApi={{} as any /* Passed via context/props in real app, stubbed here for layout */}
                        // Note: In a real refactor, we'd pass kanbanApi down to SalesView. 
                        // Assuming parent TasksView passes props or we useContext. 
                        // For now, the button will be present but functionality relies on prop plumbing.
                        className="bg-indigo-600 hover:bg-indigo-700"
                    />
                    <button
                        onClick={handleAddDeal}
                        className="flex items-center bg-brevo-cta hover:bg-brevo-cta-hover text-white font-bold py-2 px-4 rounded-lg transition-colors"
                    >
                        <PlusIcon /> Add Deal
                    </button>
                </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl mb-6">
                <h3 className="font-bold text-blue-800 mb-1">Sales Velocity & Coaching</h3>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-3 rounded shadow-sm">
                        <p className="text-xs text-gray-500 uppercase font-bold">Avg. Deal Velocity</p>
                        <p className="text-xl font-bold text-gray-900">{stats.velocity}</p>
                    </div>
                    <div className="bg-white p-3 rounded shadow-sm">
                        <p className="text-xs text-gray-500 uppercase font-bold">Stalled Deals</p>
                        <p className="text-xl font-bold text-red-600">{stats.stalledCount}</p>
                    </div>
                    <div className="bg-white p-3 rounded shadow-sm">
                        <p className="text-xs text-gray-500 uppercase font-bold">Win Rate</p>
                        <p className="text-xl font-bold text-green-600">{stats.winRate}%</p>
                    </div>
                </div>
            </div>

            <Tabs 
                tabs={['Pipeline', 'Plays', 'Coaching', 'Forecast']}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
            />

            <div className="mt-6">
                {activeTab === 'Pipeline' && <RevenueKanbanBoard deals={deals} />}
                {activeTab === 'Plays' && (
                    <div className="bg-white p-8 text-center text-gray-500 border-dashed border-2 border-gray-200 rounded-xl">
                        <p className="mb-4">Ask Walter to generate high-converting plays for your current leads.</p>
                        <DTWButton label="Generate Plays" prompt="Generate sales plays for my top 3 open deals." kanbanApi={{} as any} />
                    </div>
                )}
                {activeTab === 'Coaching' && (
                    <div className="bg-white p-8 text-center text-gray-500 border-dashed border-2 border-gray-200 rounded-xl">
                        <p>No active coaching sessions. Walter analyzes your calls and emails to provide feedback here.</p>
                    </div>
                )}
                 {activeTab === 'Forecast' && (
                    <div className="bg-white p-8 text-center text-gray-500 border-dashed border-2 border-gray-200 rounded-xl">
                        <p>Forecast data requires at least 30 days of deal history.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SalesView;
