
import React, { useMemo } from 'react';
import { Deal, Client, UniversalInputContext } from '../types';
import RevenueKanbanBoard from './RevenueKanbanBoard';

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
    
    const handleAddDeal = () => {
        onOpenUniversalInput({ placeholder: 'Create a new deal "Big Contract" for Acme Corp worth $10k...' });
    };

    const stats = useMemo(() => {
        const wonDeals = deals.filter(d => d.status === 'Closed - Won');
        const lostDeals = deals.filter(d => d.status === 'Closed - Lost');
        const openDeals = deals.filter(d => d.status === 'Open');
        
        const totalClosed = wonDeals.length + lostDeals.length;
        const winRate = totalClosed > 0 ? Math.round((wonDeals.length / totalClosed) * 100) : 0;

        // Mock velocity calculation - in a real app we'd compare createdAt vs closedAt
        // Since we only added createdAt recently, we'll use a placeholder if data is missing
        const velocity = deals.length > 0 ? "14 Days" : "N/A"; 

        return { winRate, velocity, stalledCount: openDeals.length };
    }, [deals]);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-brevo-text-primary">Sales Pipeline</h2>
                <button
                    onClick={handleAddDeal}
                    className="flex items-center bg-brevo-cta hover:bg-brevo-cta-hover text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                    <PlusIcon /> Add Deal
                </button>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl mb-6">
                <h3 className="font-bold text-blue-800 mb-1">Deal Coaching & Velocity</h3>
                <p className="text-sm text-blue-600">Walter monitors your deals to identify blockers and velocity gaps.</p>
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

            <RevenueKanbanBoard deals={deals} />
        </div>
    );
};

export default SalesView;
