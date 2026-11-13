import React, { useState } from 'react';
import { Transaction } from '../types';
import { CreditCard, DollarSign, User, FileText, CheckCircle2, ShieldCheck, X } from 'lucide-react';

interface NewPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitPayment: (tx: Partial<Transaction>) => void;
  isSandbox: boolean;
}

export const NewPaymentModal: React.FC<NewPaymentModalProps> = ({
  isOpen,
  onClose,
  onSubmitPayment,
  isSandbox
}) => {
  const [amount, setAmount] = useState('450.00');
  const [customer, setCustomer] = useState('Apex Global Logistics');
  const [description, setDescription] = useState('API Integration Payment');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    const numAmount = parseFloat(amount) || 100;

    setTimeout(() => {
      onSubmitPayment({
        id: `pi_3M2K${Math.random().toString(36).substring(2, 7)}`,
        endpoint: 'POST /v1/payments',
        method: 'POST',
        status: 'succeeded',
        statusCode: 200,
        latencyMs: Math.floor(25 + Math.random() * 30),
        amount: numAmount,
        currency: 'USD',
        customer,
        description,
        timestamp: 'Just now',
        livemode: !isSandbox,
        type: 'payment',
        fee: 0.30 + (numAmount * 0.029)
      });
      setIsProcessing(false);
      onClose();
    }, 500);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
        <div className="flex justify-between items-center pb-3 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Create Direct Payment Charge</h2>
              <span className="text-[10px] text-slate-400 font-mono">
                Gateway: {isSandbox ? 'Test Sandbox Mode' : 'Live Production'}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 text-lg font-bold">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Amount (USD)</label>
            <div className="relative">
              <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Customer / Organization Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Description</label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Channel</label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`py-2 px-3 rounded-lg border text-center font-medium ${
                  paymentMethod === 'card' ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold' : 'border-slate-200 text-slate-600'
                }`}
              >
                Card (Visa ••4242)
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('ach')}
                className={`py-2 px-3 rounded-lg border text-center font-medium ${
                  paymentMethod === 'ach' ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold' : 'border-slate-200 text-slate-600'
                }`}
              >
                Direct ACH Rail
              </button>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              {isProcessing ? 'Processing...' : 'Charge & Authorize'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
