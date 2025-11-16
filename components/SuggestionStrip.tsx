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
        <div className="bg-indigo-900/50 p-4 rounded-lg border border-indigo-700 mt-4 text-sm">
            <h4 className="font-bold text-indigo-300 mb-2">OlooAI suggests {contextText || 'some next steps'}:</h4>
            <ul className="space-y-3 mb-4">
                {suggestions.map(s => (
                    <li key={s.id}>
                        <p className="text-gray-300 mb-2">- {s.text}</p>
                        <div className="flex items-center space-x-2">
                             <button onClick={() => handleAddTask(s)} className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-1 px-2 rounded-md">Add as task</button>
                             <button onClick={() => onEditAndAdd(s)} className="text-xs bg-gray-600 hover:bg-gray-700 text-white font-semibold py-1 px-2 rounded-md">Edit then add</button>
                        </div>
                    </li>
                ))}
            </ul>
             <div className="flex space-x-2 border-t border-indigo-800 pt-3">
                {suggestions.length > 1 &&
                    <button onClick={handleAddAll} className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1 px-3 rounded-md">Add all as tasks</button>
                }
                <button onClick={onDismiss} className="text-xs bg-gray-600 hover:bg-gray-700 text-white font-bold py-1 px-3 rounded-md">Ignore</button>
            </div>
        </div>
    );
};

export default SuggestionStrip;
