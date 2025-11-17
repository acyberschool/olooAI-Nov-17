import React from 'react';
import { useKanban } from '../hooks/useKanban';
import { PlatformInsight } from '../types';

interface DataInsightsViewProps {
    kanbanApi: ReturnType<typeof useKanban>;
}

const DataInsightsView: React.FC<DataInsightsViewProps> = ({ kanbanApi }) => {
    const insights = kanbanApi.getPlatformInsights();

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-brevo-text-primary">Data & Insights</h2>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-brevo-border mb-8">
                <h3 className="text-lg font-semibold text-brevo-text-primary mb-2">Walter's Learned Patterns</h3>
                <p className="text-sm text-brevo-text-secondary mb-4">Based on your activity, here are some patterns the AI has identified to help you optimize your workflow.</p>
                
                {insights.length > 0 ? (
                    <div className="space-y-3">
                        {insights.map((insight: PlatformInsight) => (
                            <div key={insight.id} className="bg-gray-50 border border-brevo-border p-4 rounded-lg flex items-start">
                                <span className="text-green-500 mr-3 mt-1">✨</span>
                                <p className="text-brevo-text-secondary">{insight.text}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-brevo-text-secondary py-8">Start using the app to see insights here.</p>
                )}
            </div>

             <div className="bg-white p-6 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-brevo-border">
                <h3 className="text-lg font-semibold text-brevo-text-primary mb-2">Export Your Data</h3>
                <p className="text-sm text-brevo-text-secondary mb-4">You can export all your tasks, clients, deals, and CRM entries as a CSV file at any time.</p>
                <button
                    onClick={() => alert("Data export functionality would be implemented here.")}
                    className="bg-brevo-cta hover:bg-brevo-cta-hover text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                    Export All Data
                </button>
            </div>

        </div>
    );
};

export default DataInsightsView;
