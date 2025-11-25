
import React from 'react';
import { Deal, SalesStage } from '../types';
import DealRevenueCard from './DealRevenueCard';

interface RevenueKanbanBoardProps {
  deals: Deal[];
}

// Extended stages beyond simple revenue
const columns: string[] = ['Qualified', 'Contact Made', 'Demo Scheduled', 'Proposal Made', 'Negotiated', 'Onboarded', 'Botched'];

const RevenueKanbanBoard: React.FC<RevenueKanbanBoardProps> = ({ deals }) => {

    const getDealsForStatus = (stage: string): Deal[] => {
        // If deal has salesStage, use it. Fallback to mapping status for legacy data.
        return deals.filter(d => {
            if (d.salesStage) return d.salesStage === stage;
            // Legacy mapping
            if (stage === 'Qualified' && d.status === 'Open' && !d.salesStage) return true;
            if (stage === 'Onboarded' && d.status === 'Closed - Won') return true;
            if (stage === 'Botched' && d.status === 'Closed - Lost') return true;
            return false;
        });
    };
    
    const calculateTotal = (dealList: Deal[]) => {
        return dealList.reduce((sum, deal) => sum + deal.value, 0);
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-7 gap-4 overflow-x-auto pb-4" style={{ minWidth: '1200px' }}>
            {columns.map(stage => {
                const columnDeals = getDealsForStatus(stage);
                const totalValue = calculateTotal(columnDeals);
                const isNegative = stage === 'Botched';
                const isPositive = stage === 'Onboarded';

                return (
                    <div key={stage} className={`bg-gray-50/50 rounded-lg p-3 border-t-4 ${isNegative ? 'border-red-500' : isPositive ? 'border-green-500' : 'border-blue-400'}`}>
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="font-semibold text-sm text-[#111827] truncate" title={stage}>
                                {stage}
                            </h2>
                            <span className="text-xs font-medium bg-[#E5E7EB] text-[#374151] rounded-full px-1.5 py-0.5">
                                {columnDeals.length}
                            </span>
                        </div>
                        <p className="text-xs text-[#6B7280] mb-3 font-mono">${totalValue.toLocaleString()}</p>
                        <div className="space-y-3 h-[60vh] overflow-y-auto pr-1">
                            {columnDeals.map(deal => (
                                <DealRevenueCard key={deal.id} deal={deal} />
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default RevenueKanbanBoard;
