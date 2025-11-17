import React from 'react';
import { Deal } from '../types';
import DealRevenueCard from './DealRevenueCard';

interface RevenueKanbanBoardProps {
  deals: Deal[];
}

type RevenueStatus = 'Pipeline' | 'Awaiting Payment' | 'Paid' | 'Lost';

const statusConfig: Record<RevenueStatus, { title: string; color: string; }> = {
    'Pipeline': { title: 'Pipeline', color: 'border-blue-500' },
    'Awaiting Payment': { title: 'Awaiting Payment', color: 'border-yellow-500' },
    'Paid': { title: 'Paid', color: 'border-green-500' },
    'Lost': { title: 'Lost', color: 'border-red-500' },
};

const RevenueKanbanBoard: React.FC<RevenueKanbanBoardProps> = ({ deals }) => {

    const getDealsForStatus = (status: RevenueStatus): Deal[] => {
        switch (status) {
            case 'Pipeline':
                return deals.filter(d => d.status === 'Open' && d.amountPaid === 0);
            case 'Awaiting Payment':
                return deals.filter(d => d.status === 'Open' && d.amountPaid > 0 && d.amountPaid < d.value);
            case 'Paid':
                return deals.filter(d => d.status === 'Closed - Won');
            case 'Lost':
                return deals.filter(d => d.status === 'Closed - Lost');
            default:
                return [];
        }
    };
    
    const calculateTotal = (dealList: Deal[]) => {
        return dealList.reduce((sum, deal) => sum + deal.value, 0);
    }

    const columns: RevenueStatus[] = ['Pipeline', 'Awaiting Payment', 'Paid', 'Lost'];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
            {columns.map(status => {
                const columnDeals = getDealsForStatus(status);
                const totalValue = calculateTotal(columnDeals);
                const config = statusConfig[status];

                return (
                    <div key={status} className={`bg-gray-50/50 rounded-lg p-4 border-t-4 ${config.color}`}>
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="font-semibold text-lg text-[#111827]">
                                {config.title}
                            </h2>
                            <span className="text-sm font-medium bg-[#E5E7EB] text-[#374151] rounded-full px-2 py-0.5">
                                {columnDeals.length}
                            </span>
                        </div>
                        <p className="text-sm text-[#6B7280] mb-4">Total Value: ${totalValue.toLocaleString()}</p>
                        <div className="space-y-4 h-[60vh] overflow-y-auto pr-2 -mr-2">
                            {columnDeals.map(deal => (
                                <DealRevenueCard key={deal.id} deal={deal} />
                            ))}
                            {columnDeals.length === 0 && (
                                <div className="text-center text-[#6B7280] pt-8">
                                    <p>Nothing here yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default RevenueKanbanBoard;