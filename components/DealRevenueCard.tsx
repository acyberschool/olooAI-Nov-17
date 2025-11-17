import React from 'react';
import { Deal } from '../types';

interface DealRevenueCardProps {
    deal: Deal;
}

const DealRevenueCard: React.FC<DealRevenueCardProps> = ({ deal }) => {
    const progress = deal.value > 0 ? (deal.amountPaid / deal.value) * 100 : 0;

    return (
        <div className="bg-white rounded-xl p-4 shadow-lg border border-[#E5E7EB] hover:border-[#15803D] transition-all duration-200">
            <h3 className="font-semibold text-[#111827] truncate">{deal.name}</h3>
            <p className="text-xs text-[#6B7280] mb-3">{deal.description}</p>
            
            <div className="text-sm">
                <div className="flex justify-between items-baseline mb-1">
                    <span className="font-semibold text-[#166534]">{deal.currency} {deal.amountPaid.toLocaleString()}</span>
                    <span className="text-xs text-[#6B7280]">of {deal.currency} {deal.value.toLocaleString()}</span>
                </div>
                <div className="w-full bg-[#E5E7EB] rounded-full h-2.5">
                    <div className="bg-[#15803D] h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                </div>
            </div>
        </div>
    );
};

export default DealRevenueCard;