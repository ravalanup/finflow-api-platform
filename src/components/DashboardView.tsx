import React, { useState } from 'react';
import { Transaction, Invoice, AlertNotification, AppTab } from '../types';
import { retentionHeatmapCells } from '../data/mockData';
import { 
  TrendingUp, 
  CheckCircle2, 
  Users, 
  Code2, 
  Download, 
  FileText, 
  AlertTriangle, 
  Copy, 
  Check, 
  ExternalLink,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Play
} from 'lucide-react';
import { exportTransactionsToCsv } from '../lib/exportUtils';

interface DashboardViewProps {
  transactions: Transaction[];
  invoices: Invoice[];
  alerts: AlertNotification[];
  setCurrentTab: (tab: AppTab) => void;
  onOpenPrintStatement: () => void;
  onOpenQuickPayment: () => void;
  onOpenAiAssistant: () => void;
  onSelectTransaction: (tx: Transaction) => void;
  isSandbox: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  transactions,
  invoices,
  alerts,
  setCurrentTab,
  onOpenPrintStatement,
  onOpenQuickPayment,
  onOpenAiAssistant,
  onSelectTransaction,
  isSandbox
}) => {
  const [copiedKey, setCopiedKey] = useState(false);
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);

  const activeAlerts = alerts.filter(a => !a.resolved);
  const overdueInvoices = invoices.filter(i => i.status === 'overdue');
  const overdueTotal = overdueInvoices.reduce((sum, i) => sum + i.amount, 0);

  const handleCopyApiKey = () => {
    navigator.clipboard.writeText('ff_live_51M2KhJ891Lka09sD7721Nzp9xAz2');
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const getIntensityClass = (level: number) => {
    switch (level) {
      case 1: return 'bg-indigo-50';
      case 2: return 'bg-indigo-100';
      case 3: return 'bg-indigo-200';
      case 4: return 'bg-indigo-300';
      case 5: return 'bg-indigo-400';
      case 6: return 'bg-indigo-500';
      case 7: return 'bg-indigo-700';
      default: return 'bg-indigo-100';
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      {/* Alert Notices (Overdue Invoices & Low Balance) */}
      {activeAlerts.length > 0 && (
        <div className="px-4 sm:px-8 pt-6">
          <div className="bg-amber-50/90 border border-amber-200/90 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-slate-800 shadow-xs">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                  Action Required: {overdueInvoices.length} Overdue Invoices (${overdueTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })})
                </h4>
                <p className="text-xs text-amber-800 mt-0.5">
                  Automated settlement reminders can be dispatched via the webhook engine or invoices dashboard.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setCurrentTab('invoices')}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
              >
                Review Invoices
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Metric Cards - 4 Columns */}
      <section className="p-4 sm:p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Metric 1 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-indigo-200 transition-colors">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Total Volume (MTD)</span>
            <TrendingUp className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">$842,500.00</div>
          <div className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>12.4% vs last month</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-indigo-200 transition-colors">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>API Success Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">99.98%</div>
          <div className="text-xs text-slate-500 font-medium mt-1">
            Last 24 hours (p99: 48ms)
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-indigo-200 transition-colors">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>User Retention</span>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">76.2%</div>
          <div className="text-xs text-indigo-600 font-medium mt-1 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Target: 80% (Modeled 3x adoption)</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-indigo-200 transition-colors">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Active SDKs</span>
            <Code2 className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">1,242</div>
          <div className="text-xs text-slate-500 font-medium mt-1">
            Node.js, Python, Go, Ruby
          </div>
        </div>
      </section>

      {/* Main Content Grid: 3 Columns (2 cols Left, 1 col Right) */}
      <section className="px-4 sm:px-8 grid grid-cols-1 lg:grid-cols-3 gap-6 pb-8">
        {/* Left 2 Columns: Live Transaction Monitoring */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-wrap gap-2 justify-between items-center bg-white">
            <div>
              <h2 className="font-semibold text-slate-800 text-base">Live Transaction Monitoring</h2>
              <p className="text-xs text-slate-500 mt-0.5">Real-time payment gateway telemetry and settlement ledger</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                id="export-pdf-statement-btn"
                onClick={onOpenPrintStatement}
                className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 rounded-lg border border-slate-200 flex items-center gap-1.5 transition-colors"
                title="Print Official Monthly Statement"
              >
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>Export PDF</span>
              </button>
              <button
                id="export-csv-btn"
                onClick={() => exportTransactionsToCsv(transactions)}
                className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 rounded-lg border border-slate-200 flex items-center gap-1.5 transition-colors"
                title="Download CSV for Accounting"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>CSV</span>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 text-[10px] uppercase text-slate-400 font-bold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3">Endpoint</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Latency</th>
                  <th className="px-6 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-100">
                {transactions.slice(0, 6).map((tx) => {
                  let statusBadge = (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 font-mono">
                      {tx.statusCode} OK
                    </span>
                  );
                  if (tx.status === 'pending') {
                    statusBadge = (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 font-mono">
                        Pending
                      </span>
                    );
                  } else if (tx.status === 'failed' || tx.statusCode >= 400) {
                    statusBadge = (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 font-mono">
                        {tx.statusCode} Error
                      </span>
                    );
                  }

                  return (
                    <tr 
                      key={tx.id} 
                      onClick={() => onSelectTransaction(tx)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <code className="bg-slate-100 px-2 py-0.5 rounded text-indigo-600 text-xs font-mono font-medium">
                            {tx.endpoint}
                          </code>
                          <span className="text-xs text-slate-400 hidden sm:inline truncate max-w-[140px]">
                            {tx.description}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">{statusBadge}</td>
                      <td className="px-6 py-4 text-slate-500 italic text-xs font-mono">{tx.latencyMs}ms</td>
                      <td className="px-6 py-4 text-right font-semibold text-slate-900 font-mono">
                        {tx.amount > 0 ? `$${tx.amount.toFixed(2)}` : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Showing recent API calls in real-time sync</span>
            <button
              onClick={() => setCurrentTab('payments')}
              className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
            >
              <span>View Full Ledger</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right 1 Column: Retention Heatmap & Production API Key */}
        <div className="space-y-6 flex flex-col">
          {/* Retention Heatmap Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-800 text-sm">Retention Heatmap</h2>
              <span className="text-[10px] text-slate-400 font-mono">21-Day Cohort</span>
            </div>

            {/* 7 Columns x 3 Rows Matrix */}
            <div className="grid grid-cols-7 gap-1.5 relative">
              {retentionHeatmapCells.map((cell, idx) => (
                <div
                  key={idx}
                  onMouseEnter={() => setHoveredCell(cell.tooltip)}
                  onMouseLeave={() => setHoveredCell(null)}
                  className={`aspect-square ${getIntensityClass(cell.level)} rounded-sm cursor-pointer hover:ring-2 hover:ring-indigo-500 transition-all`}
                  title={cell.tooltip}
                />
              ))}
            </div>

            {/* Hover Tooltip or Default Text */}
            <div className="min-h-[38px] mt-4">
              {hoveredCell ? (
                <p className="text-xs text-indigo-700 bg-indigo-50 p-2 rounded-md font-mono border border-indigo-100">
                  {hoveredCell}
                </p>
              ) : (
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  DAU increased by <span className="text-indigo-600 font-bold">8%</span> this week following the release of the improved SDK documentation.
                </p>
              )}
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span>Less active</span>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-xs bg-indigo-50"></span>
                <span className="w-2.5 h-2.5 rounded-xs bg-indigo-200"></span>
                <span className="w-2.5 h-2.5 rounded-xs bg-indigo-400"></span>
                <span className="w-2.5 h-2.5 rounded-xs bg-indigo-700"></span>
              </div>
              <span>Highly active</span>
            </div>
          </div>

          {/* Production API Key Card */}
          <div className="bg-slate-900 p-5 rounded-xl text-white shadow-md overflow-hidden relative border border-slate-800">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold">Production API Key</h2>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-mono px-2 py-0.5 rounded border border-emerald-500/30">
                  Active
                </span>
              </div>

              <div className="bg-slate-800 font-mono text-[11px] p-3 rounded-lg border border-slate-700 flex justify-between items-center">
                <span className="text-slate-400 truncate mr-2">ff_live_51M2K...9xAz2</span>
                <button
                  id="copy-api-key-dash-btn"
                  onClick={handleCopyApiKey}
                  className="text-indigo-400 hover:text-indigo-300 cursor-pointer uppercase text-[10px] font-bold shrink-0 flex items-center gap-1"
                >
                  {copiedKey ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              <div className="mt-4">
                <div className="flex justify-between text-[11px] text-slate-400 mb-1.5 font-medium">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Monthly Requests</span>
                  <span className="text-slate-200 font-mono">66,420 / 100,000</span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="w-[66.4%] h-full bg-indigo-500 rounded-full"></div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                <button
                  onClick={() => setCurrentTab('sandbox')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
                >
                  <Play className="w-3 h-3" />
                  <span>Open API Sandbox</span>
                </button>
                <button
                  onClick={() => setCurrentTab('apikeys')}
                  className="text-xs text-slate-400 hover:text-slate-200 font-medium"
                >
                  Manage Keys →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
