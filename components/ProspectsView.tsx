import React, { useState } from 'react';
import { BusinessLine, Prospect } from '../types';
import { useKanban } from '../hooks/useKanban';
import AiPromptModal from './AiPromptModal';

interface ProspectsViewProps {
    businessLine: BusinessLine;
    kanbanApi: ReturnType<typeof useKanban>;
}

const PlusIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>);
const DownloadIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>);

const ProspectsView: React.FC<ProspectsViewProps> = ({ businessLine, kanbanApi }) => {
    const [prospects, setProspects] = useState<Prospect[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);

    const handleFindProspects = async (prompt: string) => {
        setIsLoading(true);
        const results = await kanbanApi.findProspects(businessLine, prompt);
        setProspects(results);
        setIsLoading(false);
    };

    const handleAddAsTask = (prospect: Prospect) => {
        kanbanApi.addTask({
            title: `Follow up with prospect: ${prospect.name}`,
            description: `Potential need: ${prospect.likelyNeed}`,
            businessLineId: businessLine.id,
        });
        setProspects(prev => prev.filter(p => p.id !== prospect.id));
    };
    
    const handleDownload = () => {
        const csvContent = "data:text/csv;charset=utf-8," 
            + "Name,Likely Need\n"
            + prospects.map(p => `"${p.name}","${p.likelyNeed}"`).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${businessLine.name}_prospects.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-[#E5E7EB]">
            <h3 className="text-lg font-semibold text-[#111827] mb-2">Find New Clients</h3>
            <p className="text-sm text-[#6B7280] mb-4">Ask Walter to search for potential clients who might be interested in your services.</p>
            <div className="flex justify-between items-center mb-6">
                 <button 
                    onClick={() => setIsPromptModalOpen(true)} 
                    disabled={isLoading}
                    className="bg-[#15803D] hover:bg-[#166534] text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:bg-gray-300"
                >
                    {isLoading ? 'Searching...' : 'Find Prospects'}
                </button>
                {prospects.length > 0 && (
                     <button onClick={handleDownload} className="flex items-center text-sm bg-gray-200 hover:bg-gray-300 text-[#111827] font-bold py-2 px-3 rounded-lg">
                        <DownloadIcon /> Download List
                     </button>
                )}
            </div>

            {prospects.length > 0 && (
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="border-b border-gray-200 text-sm text-[#6B7280] bg-gray-50">
                            <tr>
                                <th className="p-3">Company / Person Name</th>
                                <th className="p-3">Likely Need</th>
                                <th className="p-3"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {prospects.map(prospect => (
                                <tr key={prospect.id} className="border-b border-gray-200 last:border-b-0">
                                    <td className="p-3 font-medium text-[#111827]">{prospect.name}</td>
                                    <td className="p-3 text-[#374151]">{prospect.likelyNeed}</td>
                                    <td className="p-3 text-right">
                                        <button onClick={() => handleAddAsTask(prospect)} className="flex items-center text-xs bg-[#DCFCE7] hover:bg-green-200 text-[#14532D] font-semibold py-1 px-2 rounded-md">
                                            <PlusIcon /> Add as task
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                 </div>
            )}
            {prospects.length === 0 && !isLoading && (
                 <div className="text-center py-10 text-[#6B7280] bg-gray-50 rounded-lg border-dashed border-2 border-gray-200">
                    <p>No prospects found yet. Click "Find Prospects" to start.</p>
                </div>
            )}

            <AiPromptModal
                isOpen={isPromptModalOpen}
                onClose={() => setIsPromptModalOpen(false)}
                onGenerate={handleFindProspects}
                title="Find New Prospects"
                description="Edit the prompt below to give Walter more specific instructions for your search."
                initialPrompt={`Based on my business line "${businessLine.name}" (${businessLine.description}), find 5 potential new clients that would be a good fit. For each, provide a name and a likely need.`}
            />
        </div>
    );
};

export default ProspectsView;