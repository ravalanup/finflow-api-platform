import React, { useState } from 'react';
import { Invoice } from '../types';
import { 
  Plus, 
  Download, 
  Send, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  FileText, 
  Search, 
  Trash2, 
  Mail,
  ExternalLink
} from 'lucide-react';
import { exportInvoicesToCsv } from '../lib/exportUtils';

interface InvoicesViewProps {
  invoices: Invoice[];
  onMarkInvoicePaid: (id: string) => void;
  onSendInvoiceReminder: (id: string) => void;
  onCreateInvoice: (newInv: Omit<Invoice, 'id'>) => void;
  onOpenPrintStatement: () => void;
}

export const InvoicesView: React.FC<InvoicesViewProps> = ({
  invoices,
  onMarkInvoicePaid,
  onSendInvoiceReminder,
  onCreateInvoice,
  onOpenPrintStatement
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'overdue' | 'pending' | 'paid'>('all');

  // New Invoice Form State
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('2026-09-30');
  const [itemDescription, setItemDescription] = useState('FinFlow API Developer Integration Milestone');

  const overdueInvoices = invoices.filter(i => i.status === 'overdue');
  const overdueTotal = overdueInvoices.reduce((sum, i) => sum + i.amount, 0);

  const pendingTotal = invoices.filter(i => i.status === 'pending').reduce((sum, i) => sum + i.amount, 0);
  const paidTotal = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0);

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = 
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.clientEmail.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !amount) return;

    const numAmount = parseFloat(amount) || 1000;
    onCreateInvoice({
      invoiceNumber: `INV-2026-${Math.floor(100 + Math.random() * 900)}`,
      clientName,
      clientEmail: clientEmail || 'client@example.com',
      amount: numAmount,
      currency: 'USD',
      status: 'pending',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate,
      items: [
        {
          description: itemDescription,
          quantity: 1,
          unitPrice: numAmount,
          amount: numAmount
        }
      ],
      notes: 'Net 30 terms payable via FinFlow Direct Transfer / Card'
    });

    setClientName('');
    setClientEmail('');
    setAmount('');
    setShowCreateModal(false);
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto p-4 sm:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Invoices & Accounts Receivable</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated billing engine, overdue notification dispatch, and tax accounting reports
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenPrintStatement}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 rounded-lg border border-slate-200 flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            <span>Reconciliation Statement</span>
          </button>
          <button
            onClick={() => exportInvoicesToCsv(invoices)}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 rounded-lg border border-slate-200 flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Invoices CSV</span>
          </button>
          <button
            id="create-new-invoice-btn"
            onClick={() => setShowCreateModal(true)}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Invoice</span>
          </button>
        </div>
      </div>

      {/* Overdue Warning Banner */}
      {overdueInvoices.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100 rounded-lg text-amber-700">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-900">
                {overdueInvoices.length} Invoices Past Due (${overdueTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })})
              </h3>
              <p className="text-xs text-amber-800 mt-0.5">
                Automated webhook notifications have been scheduled. You can trigger instant email reminders or mark resolved.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => overdueInvoices.forEach(i => onSendInvoiceReminder(i.id))}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Send className="w-3 h-3" />
              <span>Remind All ({overdueInvoices.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Overdue Balance</span>
          <p className="text-2xl font-bold text-amber-600 font-mono mt-1">${overdueTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          <span className="text-xs text-slate-500 mt-1 block">{overdueInvoices.length} invoices awaiting payment</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending (Due Soon)</span>
          <p className="text-2xl font-bold text-slate-900 font-mono mt-1">${pendingTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          <span className="text-xs text-slate-500 mt-1 block">Scheduled for Net 30 release</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Collected (MTD)</span>
          <p className="text-2xl font-bold text-emerald-600 font-mono mt-1">${paidTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          <span className="text-xs text-slate-500 mt-1 block">Settled in operating account</span>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by client name, email, or invoice #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Filter:</span>
          {(['all', 'overdue', 'pending', 'paid'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors capitalize ${
                statusFilter === st
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs flex-1 flex flex-col overflow-hidden">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-[10px] uppercase text-slate-400 font-bold border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">Invoice #</th>
                <th className="px-6 py-3.5">Client</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Issue Date</th>
                <th className="px-6 py-3.5">Due Date</th>
                <th className="px-6 py-3.5 text-right">Amount (USD)</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-mono text-xs font-bold text-slate-900">{inv.invoiceNumber}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-800 text-xs">{inv.clientName}</span>
                      <span className="text-xs text-slate-400">{inv.clientEmail}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {inv.status === 'overdue' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                        <AlertTriangle className="w-3 h-3" />
                        <span>{inv.daysOverdue || 5}d Overdue</span>
                      </span>
                    )}
                    {inv.status === 'pending' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                        <Clock className="w-3 h-3" />
                        <span>Pending</span>
                      </span>
                    )}
                    {inv.status === 'paid' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle className="w-3 h-3" />
                        <span>Paid</span>
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500 font-mono">{inv.issueDate}</td>
                  <td className="px-6 py-4 text-xs font-mono font-medium text-slate-800">{inv.dueDate}</td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-slate-900">
                    ${inv.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {inv.status !== 'paid' && (
                        <>
                          <button
                            onClick={() => onSendInvoiceReminder(inv.id)}
                            className="px-2.5 py-1 text-xs text-indigo-700 hover:bg-indigo-50 border border-indigo-200 rounded font-medium transition-colors flex items-center gap-1"
                            title="Send Payment Reminder Webhook"
                          >
                            <Mail className="w-3 h-3" />
                            <span>Remind</span>
                          </button>
                          <button
                            onClick={() => onMarkInvoicePaid(inv.id)}
                            className="px-2.5 py-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium transition-colors"
                          >
                            Mark Paid
                          </button>
                        </>
                      )}
                      {inv.status === 'paid' && (
                        <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Settled</span>
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create Invoice */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Create New Client Invoice</h2>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Client Name / Organization</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Global Logistics Inc."
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Client Billing Email</label>
                <input
                  type="email"
                  required
                  placeholder="billing@apexlogistics.com"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Invoice Amount (USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="3500.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Due Date</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Item Description</label>
                <input
                  type="text"
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs"
                >
                  Issue Invoice & Schedule Webhooks
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
