
import React, { useState } from 'react';
import { Client } from '../types';

interface EmailClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (subject: string, body: string) => void;
  client: Client;
}

const EmailClientModal: React.FC<EmailClientModalProps> = ({ isOpen, onClose, onSend, client }) => {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSend(subject, body);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-2xl border border-[#E5E7EB]" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-semibold mb-2 text-[#111827]">Compose Email</h2>
        <p className="text-sm text-[#6B7280] mb-6">This email will be logged to {client.name}'s conversation history.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="to" className="block text-sm font-medium text-[#111827] mb-1">To</label>
            <input
              type="email"
              id="to"
              value={client.contactPersonEmail || ''}
              readOnly
              className="w-full bg-gray-100 border border-[#E5E7EB] rounded-md px-3 py-2 text-[#6B7280]"
            />
          </div>
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-[#111827] mb-1">Subject</label>
            <input
              type="text"
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-white border border-[#E5E7EB] rounded-md px-3 py-2 text-[#111827] focus:ring-2 focus:ring-[#15803D]"
              required
            />
          </div>
          <div>
            <label htmlFor="body" className="block text-sm font-medium text-[#111827] mb-1">Body</label>
            <textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={10}
              className="w-full bg-white border border-[#E5E7EB] rounded-md px-3 py-2 text-[#111827] focus:ring-2 focus:ring-[#15803D]"
              required
            />
          </div>
          <div className="flex justify-end space-x-4 pt-4">
            <button type="button" onClick={onClose} className="py-2 px-4 rounded-md text-[#111827] hover:bg-gray-100">Cancel</button>
            <button type="submit" className="py-2 px-4 rounded-md bg-[#15803D] hover:bg-[#166534] text-white font-semibold">Send & Log Email</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmailClientModal;
