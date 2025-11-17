import React from 'react';
import { Suggestion } from '../types';

interface SuggestionStripProps {
    suggestions: Suggestion[];
    onAdd: (taskData: any) => void;
    onEditAndAdd: (suggestion: Suggestion) => void;
    onDismiss: () => void;
    contextText?: string;
}

const SuggestionStrip: React.FC<SuggestionStripProps> = ({ suggestions, onAdd, onEditAndAdd, onDismiss, contextText }) => {
    if (!suggestions || suggestions.length === 0) return null;

    const handleAddAll = () => {
        suggestions.forEach(s => onAdd(s.taskData));
        onDismiss();
    }

    const handleAddTask = (suggestion: Suggestion) => {
        onAdd(suggestion.taskData);
        onDismiss();
    }

    return (
        <div className="bg-[#DCFCE7] p-4 rounded-lg border border-green-200 mt-4 text-sm">
            <h4 className="font-bold text-[#14532D] mb-2">Walter suggests {contextText || 'some next steps'}:</h4>
            <ul className="space-y-3 mb-4">
                {suggestions.map(s => (
                    <li key={s.id}>
                        <p className="text-[#111827] mb-2">- {s.text}</p>
                        <div className="flex items-center space-x-2">
                             <button onClick={() => handleAddTask(s)} className="text-xs bg-[#15803D] hover:bg-[#166534] text-white font-semibold py-1 px-2 rounded-md">Add as task</button>
                             <button onClick={() => onEditAndAdd(s)} className="text-xs bg-gray-200 hover:bg-gray-300 text-[#374151] font-semibold py-1 px-2 rounded-md">Edit then add</button>
                        </div>
                    </li>
                ))}
            </ul>
             <div className="flex space-x-2 border-t border-green-200 pt-3">
                {suggestions.length > 1 &&
                    <button onClick={handleAddAll} className="text-xs bg-[#15803D] hover:bg-[#166534] text-white font-bold py-1 px-3 rounded-md">Add all as tasks</button>
                }
                <button onClick={onDismiss} className="text-xs bg-gray-200 hover:bg-gray-300 text-[#374151] font-bold py-1 px-3 rounded-md">Ignore</button>
            </div>
        </div>
    );
};

export default SuggestionStrip;