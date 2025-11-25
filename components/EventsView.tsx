
import React, { useState } from 'react';
import { Event } from '../types';
import { useKanban } from '../hooks/useKanban';

interface EventsViewProps {
    events: Event[];
    kanbanApi: ReturnType<typeof useKanban>;
}

const EventsView: React.FC<EventsViewProps> = ({ events, kanbanApi }) => {
    const [newEventName, setNewEventName] = useState('');

    const handleAddEvent = (e: React.FormEvent) => {
        e.preventDefault();
        if (newEventName.trim()) {
            kanbanApi.addEvent({ name: newEventName });
            setNewEventName('');
        }
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-brevo-text-primary">Events</h2>
            </div>

            <form onSubmit={handleAddEvent} className="mb-8 flex gap-2">
                <input 
                    type="text" 
                    value={newEventName}
                    onChange={(e) => setNewEventName(e.target.value)}
                    placeholder="New Event Name..." 
                    className="flex-1 p-3 border border-gray-300 rounded-lg shadow-sm"
                />
                <button type="submit" className="bg-brevo-cta text-white px-6 py-3 rounded-lg font-bold">Create Event</button>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map(event => (
                    <div key={event.id} className="bg-white p-6 rounded-xl border border-brevo-border shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="font-bold text-lg text-gray-900">{event.name}</h3>
                            <span className={`px-2 py-1 rounded text-xs font-bold ${event.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{event.status}</span>
                        </div>
                        <p className="text-sm text-gray-500 mb-4">Location: {event.location || 'TBD'}</p>
                        
                        <div className="border-t border-gray-100 pt-4">
                            <p className="text-xs font-bold text-gray-400 uppercase mb-2">Checklist</p>
                            {event.checklist && event.checklist.length > 0 ? (
                                <ul className="space-y-2">
                                    {event.checklist.slice(0, 3).map((item, i) => (
                                        <li key={i} className="flex items-center text-sm text-gray-600">
                                            <span className={`w-2 h-2 rounded-full mr-2 ${item.isDone ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                                            {item.text}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-xs text-gray-400 italic">No checklist items yet.</p>
                            )}
                        </div>
                    </div>
                ))}
                {events.length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-500 border-2 border-dashed border-gray-200 rounded-xl">
                        No events planned.
                    </div>
                )}
            </div>
        </div>
    );
};

export default EventsView;
