
import React, { useMemo } from 'react';
import { Deal, Task, KanbanStatus } from '../types';

interface PerformanceSnapshotProps {
  deals: Deal[];
  tasks: Task[];
}

const PerformanceSnapshot: React.FC<PerformanceSnapshotProps> = ({ deals, tasks }) => {

    const metrics = useMemo(() => {
        const totalRevenue = deals
            .filter(d => d.status === 'Closed - Won')
            .reduce((sum, deal) => sum + deal.value, 0);

        const pipelineValue = deals
            .filter(d => d.status === 'Open')
            .reduce((sum, deal) => sum + deal.value, 0);
        
        const overdueTasks = tasks.filter(t => 
            t.dueDate && new Date(t.dueDate) < new Date() && t.status !== KanbanStatus.Done && t.status !== KanbanStatus.Terminated
        ).length;

        return { totalRevenue, pipelineValue, overdueTasks };
    }, [deals, tasks]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-soft-green p-6 rounded-3xl border border-transparent hover:border-green-100 transition-all shadow-sm hover:shadow-md">
                <p className="text-sm text-soft-green-text font-bold uppercase tracking-wide mb-1">Total Revenue</p>
                <p className="text-3xl font-bold text-brevo-text-primary">${metrics.totalRevenue.toLocaleString()}</p>
            </div>
            <div className="bg-soft-blue p-6 rounded-3xl border border-transparent hover:border-blue-100 transition-all shadow-sm hover:shadow-md">
                <p className="text-sm text-soft-blue-text font-bold uppercase tracking-wide mb-1">Pipeline Value</p>
                <p className="text-3xl font-bold text-brevo-text-primary">${metrics.pipelineValue.toLocaleString()}</p>
            </div>
             <div className="bg-soft-rose p-6 rounded-3xl border border-transparent hover:border-rose-100 transition-all shadow-sm hover:shadow-md">
                <p className="text-sm text-soft-rose-text font-bold uppercase tracking-wide mb-1">Overdue Tasks</p>
                <p className="text-3xl font-bold text-brevo-text-primary">{metrics.overdueTasks}</p>
            </div>
        </div>
    );
};

export default PerformanceSnapshot;
