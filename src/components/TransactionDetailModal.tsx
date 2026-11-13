import React, { useState } from 'react';
import { Transaction } from '../types';
import { Copy, Check, RotateCcw, X, CheckCircle2, ShieldCheck, Clock, Layers } from 'lucide-react';

interface TransactionDetailModalProps {
  transaction: Transaction | null;
  onClose: () => void;
  onTriggerRefund: (txId: string) => void;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  transaction,
  onClose,
  onTriggerRefund
}) => {
  const [copied, setCopied] = useState(false);

  if (!transaction) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(transaction, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 font-mono">{transaction.id}</h2>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                transaction.status === 'succeeded' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {transaction.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{transaction.description}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 text-lg font-bold">
            ✕
          </button>
        </div>

        {/* Amount & Key Metrics */}
        <div className="py-4 grid grid-cols-3 gap-3 border-b border-slate-100 text-xs">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Amount</span>
            <strong className="text-base font-bold font-mono text-slate-900 block mt-0.5">
              ${transaction.amount.toFixed(2)}
            </strong>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Processing Fee</span>
            <strong className="text-base font-bold font-mono text-slate-600 block mt-0.5">
              ${transaction.fee.toFixed(2)}
            </strong>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Latency</span>
            <strong className="text-base font-bold font-mono text-indigo-600 block mt-0.5">
              {transaction.latencyMs}ms
            </strong>
          </div>
        </div>

        {/* Customer & Timestamp Details */}
        <div className="py-4 space-y-2 text-xs border-b border-slate-100">
          <div className="flex justify-between">
            <span className="text-slate-400">Customer:</span>
            <strong className="text-slate-800">{transaction.customer}</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">API Endpoint:</span>
            <code className="text-indigo-600 font-mono font-medium">{transaction.endpoint}</code>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Timestamp:</span>
            <span className="text-slate-600 font-mono">{transaction.timestamp}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Environment:</span>
            <span className="text-slate-600 font-mono">{transaction.livemode ? 'Live Production' : 'Sandbox Test'}</span>
          </div>
        </div>

        {/* JSON Payload representation */}
        <div className="py-3 flex-1 flex flex-col min-h-[140px]">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Raw JSON Payload</span>
            <button
              onClick={handleCopy}
              className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-semibold"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy JSON'}</span>
            </button>
          </div>
          <pre className="p-3 bg-slate-950 text-emerald-400 font-mono text-xs rounded-lg overflow-auto flex-1 max-h-36">
            <code>{JSON.stringify(transaction, null, 2)}</code>
          </pre>
        </div>

        {/* Footer actions */}
        <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
          {transaction.status === 'succeeded' && transaction.amount > 0 && transaction.type !== 'refund' ? (
            <button
              onClick={() => {
                onTriggerRefund(transaction.id);
                onClose();
              }}
              className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Issue Full Refund</span>
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
