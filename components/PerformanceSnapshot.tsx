
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
        <div className="bg-white p-6 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-brevo-border">
            <h3 className="text-lg font-semibold text-brevo-text-primary mb-4">Performance Snapshot</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <p className="text-sm text-green-800 font-medium">Total Revenue</p>
                    <p className="text-2xl font-bold text-brevo-text-primary">${metrics.totalRevenue.toLocaleString()}</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-800 font-medium">Pipeline Value</p>
                    <p className="text-2xl font-bold text-brevo-text-primary">${metrics.pipelineValue.toLocaleString()}</p>
                </div>
                 <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <p className="text-sm text-red-800 font-medium">Overdue Tasks</p>
                    <p className="text-2xl font-bold text-brevo-text-primary">{metrics.overdueTasks}</p>
                </div>
            </div>
        </div>
    );
};

export default PerformanceSnapshot;