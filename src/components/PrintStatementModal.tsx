import React from 'react';
import { Transaction, Invoice, UserProfile } from '../types';
import { Printer, Download, X, Building2, CheckCircle2 } from 'lucide-react';
import { triggerPrintStatement } from '../lib/exportUtils';

interface PrintStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  invoices: Invoice[];
  user: UserProfile;
}

export const PrintStatementModal: React.FC<PrintStatementModalProps> = ({
  isOpen,
  onClose,
  transactions,
  invoices,
  user
}) => {
  if (!isOpen) return null;

  const totalCollected = transactions
    .filter(t => t.status === 'succeeded')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalFees = transactions
    .filter(t => t.status === 'succeeded')
    .reduce((sum, t) => sum + (t.fee || 0), 0);

  const netPayout = totalCollected - totalFees;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-8 shadow-2xl border border-slate-200 my-8">
        {/* Controls Bar (no-print) */}
        <div className="no-print flex items-center justify-between pb-6 mb-6 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Document Preview
            </span>
            <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-mono font-bold">
              Ready to Print / Save as PDF
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => triggerPrintStatement()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-xs transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Official Printable Statement Sheet */}
        <div id="printable-statement" className="p-4 sm:p-8 bg-white text-slate-900">
          {/* Statement Header */}
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 bg-indigo-600 rounded text-white flex items-center justify-center font-bold text-xs">
                  FF
                </div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900">FINFLOW API PLATFORM</h1>
              </div>
              <p className="text-xs text-slate-500 font-medium">Merchant Treasury & Banking Settlement Division</p>
              <p className="text-xs text-slate-400 mt-1 font-mono">Routing: 021000021 • Chase NA Custody Bridge</p>
            </div>

            <div className="text-right">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Official Monthly Statement</span>
              <h2 className="text-base font-bold text-slate-900 mt-0.5">August 2026 Reconciliation</h2>
              <p className="text-xs text-slate-500 font-mono mt-1">Generated: {new Date().toLocaleDateString()}</p>
            </div>
          </div>

          {/* Account & Merchant Info */}
          <div className="grid grid-cols-2 gap-6 mb-8 text-xs">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Account Holder</span>
              <strong className="text-slate-900 block text-sm">{user.name}</strong>
              <span className="text-slate-600">{user.organization}</span>
              <span className="text-slate-500 block font-mono mt-1">{user.email}</span>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Settlement Summary</span>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Gross Processed:</span>
                  <strong className="font-mono text-slate-900">${totalCollected.toFixed(2)}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Gateway Processing Fees:</span>
                  <span className="font-mono text-slate-600">-${totalFees.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200">
                  <strong className="text-slate-900">Net Settled to Chase Checking:</strong>
                  <strong className="font-mono text-emerald-700">${netPayout.toFixed(2)}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Itemized Ledger Table */}
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            Itemized Gateway Transactions & Settlement Calls
          </h3>
          <table className="w-full text-left text-xs border-collapse mb-8">
            <thead className="bg-slate-100 font-bold text-slate-600 border-b border-slate-300">
              <tr>
                <th className="py-2.5 px-3">Transaction ID</th>
                <th className="py-2.5 px-3">Endpoint / Description</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Fee</th>
                <th className="py-2.5 px-3 text-right">Amount (USD)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {transactions.slice(0, 10).map((tx) => (
                <tr key={tx.id}>
                  <td className="py-2.5 px-3 font-mono text-slate-800">{tx.id}</td>
                  <td className="py-2.5 px-3 text-slate-700">
                    <span className="font-mono text-[11px] text-indigo-700 block">{tx.endpoint}</span>
                    <span className="text-[10px] text-slate-400">{tx.description}</span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-700">{tx.customer}</td>
                  <td className="py-2.5 px-3">
                    <span className="font-mono text-[10px] font-bold text-emerald-800 uppercase">
                      {tx.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-500">${tx.fee.toFixed(2)}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">${tx.amount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Statement Footer */}
          <div className="pt-6 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-400 font-mono">
            <span>FinFlow Developer Payments Platform • FDIC Insured Custody</span>
            <span>Document ID: STMT_202608_FF_{Math.random().toString(36).substring(2, 8).toUpperCase()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
