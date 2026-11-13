import React from 'react';
import { dauHistoryData, retentionHeatmapCells } from '../data/mockData';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Clock, 
  Activity, 
  Zap, 
  Code2, 
  CheckCircle2, 
  Layers,
  ArrowUpRight,
  ShieldCheck
} from 'lucide-react';

interface AnalyticsViewProps {
  visitCount: number;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ visitCount }) => {
  const maxDau = Math.max(...dauHistoryData.map(d => d.dau));

  return (
    <div className="flex-1 flex flex-col overflow-y-auto p-4 sm:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Platform Analytics & Retention Metrics</h1>
            <span className="text-[10px] bg-indigo-50 text-indigo-700 font-mono px-2 py-0.5 rounded-full border border-indigo-200 font-bold">
              Case Study Metrics
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Developer adoption KPIs, Daily Active Usage (DAU), cohort retention, and platform impact modeled by Anup Raval
          </p>
        </div>
      </div>

      {/* Case Study Impact Highlights (3 Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase mb-2">
            <span>Integration Time</span>
            <Clock className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600">↓ 60%</div>
          <p className="text-xs text-slate-500 mt-1">
            Time-to-first-API-call dropped from 4 hours to under 12 minutes via developer-first SDKs.
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase mb-2">
            <span>Developer Adoption</span>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-indigo-600">↑ 3x</div>
          <p className="text-xs text-slate-500 mt-1">
            Tripled organic developer signups via interactive sandbox & transparent pricing pillars.
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase mb-2">
            <span>Revenue Potential</span>
            <TrendingUp className="w-4 h-4 text-slate-900" />
          </div>
          <div className="text-2xl font-bold text-slate-900">$20M ARR</div>
          <p className="text-xs text-slate-500 mt-1">
            Modeled ARR at scale with mid-market fintechs, SaaS platforms, and embedded finance.
          </p>
        </div>
      </div>

      {/* Charts Section: DAU Bar Chart & Retention Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Daily Active Usage (DAU) Chart */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Daily Active Usage (DAU) & API Volume</h3>
              <p className="text-xs text-slate-400 mt-0.5">Last 7 days active developer sessions</p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
              +14.2% DoD
            </span>
          </div>

          {/* Bar Chart Visualizer */}
          <div className="flex-1 flex items-end justify-between gap-3 min-h-[180px] pt-4 px-2 border-b border-slate-100">
            {dauHistoryData.map((d) => {
              const heightPercent = Math.round((d.dau / maxDau) * 100);
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-2 group">
                  <span className="text-[10px] font-mono text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    {d.dau}
                  </span>
                  <div className="w-full bg-slate-100 rounded-t-md h-36 flex items-end overflow-hidden">
                    <div 
                      className="w-full bg-indigo-500 group-hover:bg-indigo-600 rounded-t-md transition-all duration-300"
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-mono font-medium text-slate-600">
                    {d.date}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
            <span>Peak Day: <strong>2,890 Active Developers</strong></span>
            <span>Total API Invocations: <strong>410.8K</strong></span>
          </div>
        </div>

        {/* 21-Day Cohort Retention Matrix */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">21-Day Developer Retention Matrix</h3>
              <p className="text-xs text-slate-400 mt-0.5">Cohort retention benchmarked post-onboarding</p>
            </div>
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded border border-indigo-200">
              76.2% Avg
            </span>
          </div>

          <div className="grid grid-cols-7 gap-2 my-auto p-4 bg-slate-50 rounded-xl border border-slate-100">
            {retentionHeatmapCells.map((cell, i) => {
              const colors = [
                'bg-indigo-50',
                'bg-indigo-100',
                'bg-indigo-200',
                'bg-indigo-300',
                'bg-indigo-400',
                'bg-indigo-500',
                'bg-indigo-700'
              ];
              return (
                <div
                  key={i}
                  className={`aspect-square ${colors[cell.level - 1]} rounded-md flex items-center justify-center text-[10px] font-mono font-bold ${
                    cell.level > 4 ? 'text-white' : 'text-slate-700'
                  } shadow-2xs hover:scale-105 transition-transform`}
                  title={cell.tooltip}
                >
                  {cell.level * 14}%
                </div>
              );
            })}
          </div>

          <p className="text-[11px] text-slate-500 mt-4 leading-relaxed">
            Developer retention stabilizes at <strong>76.2%</strong> by Week 3, driven by comprehensive SDK typings and immediate webhook playback diagnostics.
          </p>
        </div>
      </div>

      {/* Feature Telemetry & Invisible Debug Tracker */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-4">Platform Feature Telemetry & Debug Inspector</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Payments Gateway</span>
            <p className="text-lg font-bold text-slate-900 font-mono mt-1">64.2%</p>
            <span className="text-slate-500 text-[11px]">Primary volume driver</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Invoices & Billing</span>
            <p className="text-lg font-bold text-slate-900 font-mono mt-1">21.8%</p>
            <span className="text-slate-500 text-[11px]">Accounts receivable</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Recurring Subscriptions</span>
            <p className="text-lg font-bold text-slate-900 font-mono mt-1">10.4%</p>
            <span className="text-slate-500 text-[11px]">SaaS recurring plans</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Webhooks & Events</span>
            <p className="text-lg font-bold text-indigo-600 font-mono mt-1">3.6%</p>
            <span className="text-slate-500 text-[11px]">Event streaming</span>
          </div>
        </div>

        {/* Debug stats info */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-slate-700 font-semibold">Chrome Debug Tag:</span>
            <code className="bg-slate-100 px-2 py-0.5 rounded text-indigo-600 font-mono">
              &lt;div id="debug-stats" data-visits="{visitCount}" ... /&gt;
            </code>
          </div>
          <div className="font-mono text-[11px] text-slate-400">
            Access via console: <strong className="text-slate-700">window.__FINFLOW_DEBUG__.getPlatformState()</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
