
import React, { useState } from 'react';
import { Client, Deal, Project } from '../types';

interface ContextualWalterProps {
    onUpdate: (text: string) => Promise<void>;
    onApprove: () => void;
    onDismiss: () => void;
    isUpdating: boolean;
    proposedChanges?: {
        summary?: string;
        nextAction?: string;
        nextActionDate?: string;
        status?: string;
        stage?: string;
        aiFocus?: string;
    };
    entityName: string;
    placeholder?: string;
}

const ContextualWalter: React.FC<ContextualWalterProps> = ({ 
    onUpdate, 
    onApprove, 
    onDismiss, 
    isUpdating, 
    proposedChanges, 
    entityName,
    placeholder 
}) => {
    const [interactionText, setInteractionText] = useState('');

    const handleUpdate = async () => {
        if (!interactionText.trim()) return;
        await onUpdate(interactionText);
        setInteractionText('');
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-lg border border-brevo-border">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-brevo-text-primary">Update {entityName} with Walter</h3>
                    <span className="text-xs bg-teal-100 text-teal-800 px-2 py-1 rounded-full font-medium">AI Assistant</span>
                </div>
                <p className="text-sm text-brevo-text-secondary mb-4">Paste an email, meeting notes, or a quick summary. Walter will update the record and propose the next step.</p>
                <textarea
                    value={interactionText}
                    onChange={(e) => setInteractionText(e.target.value)}
                    rows={4}
                    placeholder={placeholder || "e.g., Client loved the proposal but wants to negotiate the timeline..."}
                    className="w-full bg-white border border-brevo-border rounded-md px-3 py-2 text-brevo-text-primary focus:ring-2 focus:ring-brevo-cta resize-none"
                />
                <div className="mt-3 flex justify-end">
                    <button
                        onClick={handleUpdate}
                        disabled={isUpdating || !interactionText.trim()}
                        className="bg-brevo-cta hover:bg-brevo-cta-hover text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:bg-gray-300 flex items-center"
                    >
                        {isUpdating ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Analyzing...
                            </>
                        ) : 'Update'}
                    </button>
                </div>
            </div>

            {proposedChanges && (proposedChanges.summary || proposedChanges.nextAction) && (
                <div className="bg-blue-50 p-6 rounded-xl border-2 border-dashed border-blue-300 animate-fade-in-up">
                    <h3 className="text-lg font-semibold text-blue-800 mb-4">Walter's Proposed Updates</h3>
                    <div className="space-y-3 text-sm">
                        {proposedChanges.status && (
                             <p><strong className="text-brevo-text-secondary">New Status:</strong> <span className="font-semibold text-blue-700 ml-1">{proposedChanges.status}</span></p>
                        )}
                         {proposedChanges.stage && (
                             <p><strong className="text-brevo-text-secondary">New Stage:</strong> <span className="font-semibold text-blue-700 ml-1">{proposedChanges.stage}</span></p>
                        )}
                        {proposedChanges.summary && (
                            <p><strong className="text-brevo-text-secondary">New Last Touch Summary:</strong> <span className="ml-1">{proposedChanges.summary}</span></p>
                        )}
                         {proposedChanges.aiFocus && (
                            <p><strong className="text-brevo-text-secondary">Updated AI Focus:</strong> <span className="ml-1">{proposedChanges.aiFocus}</span></p>
                        )}
                        {proposedChanges.nextAction && (
                            <p><strong className="text-brevo-text-secondary">Proposed Next Action:</strong> <span className="font-semibold ml-1">{proposedChanges.nextAction}</span> (Due: {new Date(proposedChanges.nextActionDate!).toLocaleDateString()})</p>
                        )}
                    </div>
                    <div className="flex items-center space-x-3 mt-6">
                        <button onClick={onApprove} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-sm">Approve Changes</button>
                        <button onClick={onDismiss} className="text-blue-700 hover:text-blue-900 font-medium text-sm hover:underline">Dismiss</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContextualWalter;
