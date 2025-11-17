import React, { useState } from 'react';
import { useKanban } from '../hooks/useKanban';
import { BusinessLine } from '../types';
import AiPromptModal from './AiPromptModal';

interface SocialMediaIdeasProps {
    businessLine: BusinessLine;
    kanbanApi: ReturnType<typeof useKanban>;
}

const PlusIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>);

const SocialMediaIdeas: React.FC<SocialMediaIdeasProps> = ({ businessLine, kanbanApi }) => {
    const [ideas, setIdeas] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);

    const handleGetIdeas = async (prompt: string) => {
        setIsLoading(true);
        const results = await kanbanApi.generateSocialMediaIdeas(businessLine, prompt);
        setIdeas(results);
        setIsLoading(false);
    };

    const handleAddAsTask = (idea: string) => {
        kanbanApi.addTask({
            title: `Social Media Post: ${idea}`,
            businessLineId: businessLine.id,
        });
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-[#E5E7EB]">
            <h3 className="text-lg font-semibold text-[#111827] mb-4">Social Media Ideas</h3>
            <div className="flex space-x-4">
                <button 
                    onClick={() => setIsPromptModalOpen(true)} 
                    disabled={isLoading}
                    className="bg-[#15803D] hover:bg-[#166534] text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:bg-gray-300"
                >
                    {isLoading ? 'Generating...' : 'Ask Walter for Ideas'}
                </button>
            </div>
            {ideas.length > 0 && (
                <div className="mt-6 bg-gray-50 p-4 rounded-md border border-gray-200">
                    <h4 className="font-semibold text-base text-[#15803D] mb-3">Here are some ideas:</h4>
                    <ul className="space-y-3">
                    {ideas.map((idea, index) => (
                        <li key={index} className="flex items-center justify-between text-[#374151]">
                            <span>- {idea}</span>
                            <button
                                onClick={() => handleAddAsTask(idea)}
                                className="flex items-center text-xs bg-[#DCFCE7] hover:bg-green-200 text-[#14532D] font-semibold py-1 px-2 rounded-md transition-colors"
                            >
                                <PlusIcon />
                                Add task
                            </button>
                        </li>
                    ))}
                    </ul>
                </div>
            )}
             <AiPromptModal
                isOpen={isPromptModalOpen}
                onClose={() => setIsPromptModalOpen(false)}
                onGenerate={handleGetIdeas}
                title="Generate Social Media Ideas"
                description="Edit the prompt below to give Walter more specific instructions."
                initialPrompt={`Based on my business line "${businessLine.name}" (${businessLine.description}) and recent trends, generate 5 timely and engaging social media post ideas.`}
            />
        </div>
    );
};

export default SocialMediaIdeas;