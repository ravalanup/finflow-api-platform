import React, { useState } from 'react';
import { Transaction } from '../types';
import { 
  Search, 
  Filter, 
  Download, 
  FileText, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ArrowUpRight, 
  RotateCcw,
  Plus,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { exportTransactionsToCsv } from '../lib/exportUtils';

interface PaymentsViewProps {
  transactions: Transaction[];
  onSelectTransaction: (tx: Transaction) => void;
  onOpenQuickPayment: () => void;
  onOpenPrintStatement: () => void;
  onTriggerRefund: (txId: string) => void;
  isSyncing: boolean;
  onTriggerSync: () => void;
}

export const PaymentsView: React.FC<PaymentsViewProps> = ({
  transactions,
  onSelectTransaction,
  onOpenQuickPayment,
  onOpenPrintStatement,
  onTriggerRefund,
  isSyncing,
  onTriggerSync
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'succeeded' | 'pending' | 'failed' | 'refunded'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'payment' | 'refund' | 'subscription' | 'invoice_payout'>('all');

  const filtered = transactions.filter((tx) => {
    const matchesSearch = 
      tx.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.endpoint.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tx.description && tx.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || tx.status === statusFilter;
    const matchesType = typeFilter === 'all' || tx.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const totalSucceeded = filtered.filter(t => t.status === 'succeeded').reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="flex-1 flex flex-col overflow-y-auto p-4 sm:p-8">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Payments & Real-Time Ledger</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Synchronized transaction feed across developer API gateways and Chase ACH settlement channels
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={onTriggerSync}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 rounded-lg border border-slate-200 flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isSyncing ? 'animate-spin text-indigo-600' : ''}`} />
            <span>Sync Live</span>
          </button>
          <button
            onClick={onOpenPrintStatement}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 rounded-lg border border-slate-200 flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            <span>Statement PDF</span>
          </button>
          <button
            onClick={() => exportTransactionsToCsv(filtered)}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 rounded-lg border border-slate-200 flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={onOpenQuickPayment}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Charge</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by ID, customer, endpoint, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs text-slate-400 font-medium">Status:</span>
          {(['all', 'succeeded', 'pending', 'failed'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors capitalize ${
                statusFilter === status
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 text-xs">
          <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Filtered Volume</span>
          <p className="text-lg font-bold text-slate-900 font-mono mt-0.5">${totalSucceeded.toFixed(2)}</p>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 text-xs">
          <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Transactions</span>
          <p className="text-lg font-bold text-slate-900 font-mono mt-0.5">{filtered.length} calls</p>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 text-xs">
          <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Avg Latency</span>
          <p className="text-lg font-bold text-indigo-600 font-mono mt-0.5">48ms</p>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 text-xs">
          <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Settlement Speed</span>
          <p className="text-lg font-bold text-emerald-600 font-mono mt-0.5">Real-Time T+0</p>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs flex-1 flex flex-col overflow-hidden">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-[10px] uppercase text-slate-400 font-bold border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">ID & Endpoint</th>
                <th className="px-6 py-3.5">Customer & Description</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Latency</th>
                <th className="px-6 py-3.5">Date</th>
                <th className="px-6 py-3.5 text-right">Amount (USD)</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100 font-normal">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400 text-xs">
                    No transactions matching the selected filters.
                  </td>
                </tr>
              ) : (
                filtered.map((tx) => (
                  <tr 
                    key={tx.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-mono text-xs font-semibold text-slate-900">{tx.id}</span>
                        <code className="text-[11px] text-indigo-600 font-mono mt-0.5">{tx.endpoint}</code>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-800 text-xs">{tx.customer}</span>
                        <span className="text-xs text-slate-400 truncate max-w-xs">{tx.description}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {tx.status === 'succeeded' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                          {tx.statusCode} OK
                        </span>
                      )}
                      {tx.status === 'pending' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 font-mono">
                          Pending
                        </span>
                      )}
                      {tx.status === 'failed' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200 font-mono">
                          {tx.statusCode} Error
                        </span>
                      )}
                      {tx.status === 'refunded' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200 font-mono">
                          Refunded
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-slate-500 italic">
                      {tx.latencyMs}ms
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {tx.timestamp}
                    </td>
                    <td className="px-6 py-4 text-right font-bold font-mono text-slate-900">
                      {tx.amount > 0 ? `$${tx.amount.toFixed(2)}` : '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onSelectTransaction(tx)}
                          className="px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                        >
                          Details
                        </button>
                        {tx.status === 'succeeded' && tx.amount > 0 && tx.type !== 'refund' && (
                          <button
                            onClick={() => onTriggerRefund(tx.id)}
                            className="p-1 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
                            title="Issue Refund"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer pagination bar */}
        <div className="p-4 bg-slate-50/80 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Showing {filtered.length} of {transactions.length} records</span>
          <div className="flex items-center gap-1">
            <button className="p-1 rounded hover:bg-slate-200 disabled:opacity-50" disabled>
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-mono text-slate-700">Page 1 of 1</span>
            <button className="p-1 rounded hover:bg-slate-200 disabled:opacity-50" disabled>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
