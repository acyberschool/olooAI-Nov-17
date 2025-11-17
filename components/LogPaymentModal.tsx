import React, { useState } from 'react';
import { Deal } from '../types';

interface LogPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (amount: number, note: string) => void;
  deal: Deal;
}

const LogPaymentModal: React.FC<LogPaymentModalProps> = ({ isOpen, onClose, onSave, deal }) => {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const paymentAmount = parseFloat(amount);
    if (!isNaN(paymentAmount) && paymentAmount > 0) {
      onSave(paymentAmount, note);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md border border-[#E5E7EB]" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-semibold mb-2 text-[#111827]">Log Payment</h2>
        <p className="text-sm text-[#6B7280] mb-6">For deal: "{deal.name}"</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-[#111827] mb-1">Payment Amount ({deal.currency})</label>
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-white border border-[#E5E7EB] rounded-md px-3 py-2 text-[#111827] focus:ring-2 focus:ring-[#15803D]"
              required
              step="0.01"
              min="0"
            />
          </div>
          <div>
            <label htmlFor="note" className="block text-sm font-medium text-[#111827] mb-1">Note (optional)</label>
            <textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g., Received via bank transfer."
              rows={3}
              className="w-full bg-white border border-[#E5E7EB] rounded-md px-3 py-2 text-[#111827] focus:ring-2 focus:ring-[#15803D]"
            />
          </div>
          <div className="flex justify-end space-x-4 pt-4">
            <button type="button" onClick={onClose} className="py-2 px-4 rounded-md text-[#111827] hover:bg-gray-100">Cancel</button>
            <button type="submit" className="py-2 px-4 rounded-md bg-[#15803D] hover:bg-[#166534] text-white font-semibold">Log Payment</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LogPaymentModal;