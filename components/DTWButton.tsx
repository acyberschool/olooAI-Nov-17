
import React, { useState } from 'react';
import { useKanban } from '../hooks/useKanban';

interface DTWButtonProps {
    label: string;
    prompt: string;
    context?: any;
    onSuccess?: (result?: any) => void;
    kanbanApi: ReturnType<typeof useKanban>;
    className?: string;
}

const MagicWandIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 5a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0v-1H3a1 1 0 010-2h1V8a1 1 0 011-1zm5-5a1 1 0 011 1v1h1a1 1 0 010 2h-1v1a1 1 0 01-2 0V6h-1a1 1 0 010-2h1V3a1 1 0 011-1zm0 5a1 1 0 011 1v1h1a1 1 0 010 2h-1v1a1 1 0 01-2 0v-1h-1a1 1 0 010-2h1V8a1 1 0 011-1zm5-5a1 1 0 011 1v1h1a1 1 0 010 2h-1v1a1 1 0 01-2 0V6h-1a1 1 0 010-2h1V3a1 1 0 011-1z" clipRule="evenodd" />
    </svg>
);

const DTWButton: React.FC<DTWButtonProps> = ({ label, prompt, context, onSuccess, kanbanApi, className }) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleClick = async () => {
        setIsLoading(true);
        // We leverage processTextAndExecute as the generic pipeline, allowing the Router Brain to decide the best action
        // or we can use specific API methods if exposed. For general DTW, we treat it as a direct instruction.
        // However, to ensure high fidelity for specific tasks like "Generate Payroll", we might pass a hint.
        
        // For now, we send the prompt to the "Router Brain" which acts as Walter.
        await kanbanApi.processTextAndExecute(prompt, { placeholder: 'DTW Action', ...context });
        
        setIsLoading(false);
        if (onSuccess) onSuccess();
    };

    return (
        <button 
            onClick={handleClick} 
            disabled={isLoading}
            className={`flex items-center justify-center bg-gray-900 hover:bg-black text-white font-bold py-2 px-4 rounded-lg shadow-md transition-all transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed ${className || ''}`}
            title="Delegate to Walter"
        >
            {isLoading ? (
                <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Working...
                </>
            ) : (
                <>
                    <MagicWandIcon />
                    {label}
                </>
            )}
        </button>
    );
};

export default DTWButton;
