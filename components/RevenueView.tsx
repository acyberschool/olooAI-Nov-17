import React from 'react';
import { Deal } from '../types';
import RevenueKanbanBoard from './RevenueKanbanBoard';

interface RevenueViewProps {
  deals: Deal[];
}

const RevenueView: React.FC<RevenueViewProps> = ({ deals }) => {
  // In the future, this component could have a toggle for different views (e.g., charts, tables)
  // For now, it directly renders the Kanban board.
  
  return (
    <div>
      <RevenueKanbanBoard deals={deals} />
    </div>
  );
};

export default RevenueView;