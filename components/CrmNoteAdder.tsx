import React, { useState, useEffect } from 'react';
import { useDictation } from '../hooks/useDictation';

interface CrmNoteAdderProps {
    onSave: (note: string) => void;
    onCancel: () => void;
}

const MicIcon = ({ isRecording }: { isRecording: boolean }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${isRecording ? 'text-red-500 animate-pulse' : 'text-gray-400'}`} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm5 10.5a.5.5 0 01.5.5v.5a.5.5 0 01-1 0V15a.5.5 0 01.5-.5zM5 15a.5.5 0 00-1 0v.5a.5.5 0 001 0V15zm10 0a.5.5 0 00-1 0v.5a.5.5 0 001 0V15zM7 15a.5.5 0 01.5.5v.5a.5.5 0 01-1 0V15a.5.5 0 01.5-.5zm5 0a.5.5 0 00-1 0v.5a.5.5 0 001 0V15z" clipRule="evenodd" />
        <path d="M5 10a5 5 0 0010 0h-1.5a3.5 3.5 0 11-7 0H5z" />
    </svg>
);

const CrmNoteAdder: React.FC<CrmNoteAdderProps> = ({ onSave, onCancel }) => {
    const [note, setNote] = useState('');
    const { transcript, isRecording, startDictation, stopDictation } = useDictation();

    useEffect(() => {
        if (transcript) {
            setNote(prev => prev ? `${prev} ${transcript}` : transcript);
        }
    }, [transcript]);

    const handleMicClick = () => {
        if (isRecording) {
            stopDictation();
        } else {
            startDictation();
        }
    }

    const handleSaveClick = () => {
        if (note.trim()) {
            onSave(note.trim());
        }
    }
    
    return (
        <div className="bg-gray-900/50 p-4 rounded-lg">
            <div className="relative">
                <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Type or dictate your note..."
                    rows={5}
                    className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500 pr-10"
                />
                <button onClick={handleMicClick} className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-700" title="Dictate note">
                    <MicIcon isRecording={isRecording} />
                </button>
            </div>
            <div className="flex justify-end space-x-2 mt-2">
                <button onClick={onCancel} className="py-2 px-4 rounded-md text-gray-300 hover:bg-gray-700 text-sm">Cancel</button>
                <button onClick={handleSaveClick} disabled={!note.trim()} className="py-2 px-4 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm disabled:bg-gray-500">Save Note</button>
            </div>
        </div>
    );
};

export default CrmNoteAdder;
