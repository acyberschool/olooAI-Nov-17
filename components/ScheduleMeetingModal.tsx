
import React, { useState } from 'react';

interface ScheduleMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSchedule: (title: string) => void;
  initialTitle: string;
}

const ScheduleMeetingModal: React.FC<ScheduleMeetingModalProps> = ({ isOpen, onClose, onSchedule, initialTitle }) => {
  const [title, setTitle] = useState(initialTitle);
  const [attendees, setAttendees] = useState('');
  const [dateTime, setDateTime] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would integrate with a calendar API.
    // For now, we'll create a task with a more descriptive title.
    const fullTitle = `${title} with ${attendees || 'attendees'} on ${new Date(dateTime).toLocaleString()}`;
    onSchedule(fullTitle);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60]" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-lg border border-[#E5E7EB]" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-semibold mb-2 text-[#111827]">Schedule Meeting</h2>
        <p className="text-sm text-[#6B7280] mb-6">Connect your Google Calendar in Settings to schedule automatically.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="meeting-title" className="block text-sm font-medium text-[#111827] mb-1">Title</label>
            <input
              type="text"
              id="meeting-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white border border-[#E5E7EB] rounded-md px-3 py-2 text-[#111827] focus:ring-2 focus:ring-[#15803D]"
              required
            />
          </div>
          <div>
            <label htmlFor="meeting-datetime" className="block text-sm font-medium text-[#111827] mb-1">Date & Time</label>
            <input
              type="datetime-local"
              id="meeting-datetime"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              className="w-full bg-white border border-[#E5E7EB] rounded-md px-3 py-2 text-[#111827] focus:ring-2 focus:ring-[#15803D]"
              required
            />
          </div>
           <div>
            <label htmlFor="meeting-attendees" className="block text-sm font-medium text-[#111827] mb-1">Attendees (Emails)</label>
            <input
              type="text"
              id="meeting-attendees"
              value={attendees}
              onChange={(e) => setAttendees(e.target.value)}
              placeholder="e.g., team@example.com, client@example.com"
              className="w-full bg-white border border-[#E5E7EB] rounded-md px-3 py-2 text-[#111827] focus:ring-2 focus:ring-[#15803D]"
            />
          </div>
          <div className="flex justify-end space-x-4 pt-4">
            <button type="button" onClick={onClose} className="py-2 px-4 rounded-md text-[#111827] hover:bg-gray-100">Cancel</button>
            <button type="submit" className="py-2 px-4 rounded-md bg-[#15803D] hover:bg-[#166534] text-white font-semibold">Schedule & Create Task</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScheduleMeetingModal;
