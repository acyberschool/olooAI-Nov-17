
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
            <div className="bg-white p-1 rounded-2xl shadow-lg border border-gray-100 ring-1 ring-gray-100">
                <div className="p-5 rounded-xl bg-gradient-to-b from-white to-gray-50">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center">
                            <span className="text-2xl mr-2">⚡</span> Update {entityName} with Walter
                        </h3>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">Paste an email, notes, or just type what happened.</p>
                    <textarea
                        value={interactionText}
                        onChange={(e) => setInteractionText(e.target.value)}
                        rows={3}
                        placeholder={placeholder || "e.g., Client loved the proposal..."}
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:ring-2 focus:ring-black focus:border-black resize-none shadow-sm"
                    />
                    <div className="mt-3 flex justify-end">
                        <button
                            onClick={handleUpdate}
                            disabled={isUpdating || !interactionText.trim()}
                            className="bg-black hover:bg-gray-800 text-white font-bold py-2 px-6 rounded-full transition-all shadow-md disabled:bg-gray-300 flex items-center"
                        >
                            {isUpdating ? 'Analyzing...' : 'Process Update'}
                        </button>
                    </div>
                </div>
            </div>

            {proposedChanges && (proposedChanges.summary || proposedChanges.nextAction) && (
                <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100 shadow-inner animate-fade-in-up">
                    <h3 className="text-lg font-bold text-indigo-900 mb-4 flex items-center"><span className="mr-2">🤖</span> Walter Proposes:</h3>
                    <div className="space-y-3 text-sm bg-white/60 p-4 rounded-lg border border-indigo-100">
                        {proposedChanges.status && (
                             <p><strong className="text-indigo-800">New Status:</strong> <span className="font-semibold text-gray-900 ml-1">{proposedChanges.status}</span></p>
                        )}
                         {proposedChanges.stage && (
                             <p><strong className="text-indigo-800">New Stage:</strong> <span className="font-semibold text-gray-900 ml-1">{proposedChanges.stage}</span></p>
                        )}
                        {proposedChanges.summary && (
                            <p><strong className="text-indigo-800">Last Touch:</strong> <span className="ml-1 text-gray-700">{proposedChanges.summary}</span></p>
                        )}
                        {proposedChanges.nextAction && (
                            <p><strong className="text-indigo-800">Next Step:</strong> <span className="font-semibold ml-1 text-gray-900">{proposedChanges.nextAction}</span> <span className="text-gray-500 text-xs">(Due: {new Date(proposedChanges.nextActionDate!).toLocaleDateString()})</span></p>
                        )}
                    </div>
                    <div className="flex items-center space-x-3 mt-6">
                        <button onClick={onApprove} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg shadow-sm transition-colors">Approve</button>
                        <button onClick={onDismiss} className="text-gray-500 hover:text-gray-700 font-medium text-sm hover:underline px-3">Dismiss</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContextualWalter;
