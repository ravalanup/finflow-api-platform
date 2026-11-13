import React from 'react';
import { AppTab } from '../types';
import { 
  LayoutDashboard, 
  CreditCard, 
  FileText, 
  Terminal, 
  Key, 
  ScrollText, 
  BarChart3, 
  Sparkles, 
  Settings,
  ShieldCheck,
  Zap,
  Menu,
  X
} from 'lucide-react';

interface SidebarProps {
  currentTab: AppTab;
  setCurrentTab: (tab: AppTab) => void;
  isSandbox: boolean;
  setIsSandbox: (val: boolean) => void;
  isOpenMobile: boolean;
  setIsOpenMobile: (val: boolean) => void;
  overdueCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  isSandbox,
  setIsSandbox,
  isOpenMobile,
  setIsOpenMobile,
  overdueCount
}) => {
  const navItems = [
    { id: 'dashboard' as AppTab, label: 'Dashboard', icon: LayoutDashboard, badge: null },
    { id: 'payments' as AppTab, label: 'Payments', icon: CreditCard, badge: null },
    { id: 'invoices' as AppTab, label: 'Invoices & Billing', icon: FileText, badge: overdueCount > 0 ? `${overdueCount} Overdue` : null, badgeColor: 'bg-amber-500/20 text-amber-300' },
    { id: 'sandbox' as AppTab, label: 'API Sandbox', icon: Terminal, badge: 'Dev' },
    { id: 'apikeys' as AppTab, label: 'API Keys', icon: Key, badge: null },
    { id: 'eventlogs' as AppTab, label: 'Event Logs', icon: ScrollText, badge: 'Live' },
    { id: 'analytics' as AppTab, label: 'Analytics & Retention', icon: BarChart3, badge: null },
    { id: 'settings' as AppTab, label: 'Settings', icon: Settings, badge: null },
  ];

  const handleNavClick = (tab: AppTab) => {
    setCurrentTab(tab);
    setIsOpenMobile(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div 
          className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-xs"
          onClick={() => setIsOpenMobile(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        id="finflow-main-sidebar"
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#1E293B] flex flex-col border-r border-slate-800 transition-transform duration-200 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-6 flex items-center justify-between border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center shadow-xs">
              <span className="text-white font-bold italic text-sm tracking-tighter">FF</span>
            </div>
            <div>
              <h1 className="text-white font-semibold text-lg tracking-tight leading-none flex items-center gap-1.5">
                FinFlow <span className="text-xs bg-indigo-500/20 text-indigo-400 font-mono px-1.5 py-0.5 rounded border border-indigo-500/30">API</span>
              </h1>
              <p className="text-[10px] text-slate-400 mt-1 font-medium">Developer Payments Platform</p>
            </div>
          </div>
          <button 
            onClick={() => setIsOpenMobile(false)}
            className="lg:hidden text-slate-400 hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Platform Core
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-btn-${item.id}`}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'text-indigo-300 bg-slate-800 shadow-xs border border-indigo-500/20 font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-medium shrink-0 ${
                    item.badgeColor || 'bg-slate-700 text-slate-300'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sandbox / Environment Switcher */}
        <div className="p-4 border-t border-slate-800">
          <div className="bg-slate-800/90 p-3 rounded-xl border border-slate-700/60">
            <div className="text-[10px] uppercase text-slate-400 font-bold mb-1.5 flex items-center justify-between">
              <span>Environment Mode</span>
              <span className={`w-2 h-2 rounded-full ${isSandbox ? 'bg-indigo-400 animate-pulse' : 'bg-emerald-400'}`} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-200 font-medium">
                {isSandbox ? 'Sandbox (Test)' : 'Production (Live)'}
              </span>
              <button
                id="toggle-sandbox-btn"
                type="button"
                onClick={() => setIsSandbox(!isSandbox)}
                className={`w-10 h-5 rounded-full transition-colors flex items-center px-0.5 cursor-pointer ${
                  isSandbox ? 'bg-indigo-500' : 'bg-emerald-600'
                }`}
                title="Toggle Sandbox / Live Mode"
              >
                <div 
                  className={`w-4 h-4 bg-white rounded-full transition-transform shadow-xs ${
                    isSandbox ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-2 leading-tight">
              {isSandbox 
                ? 'Mock transactions using ff_test_* keys without real fund transfers.' 
                : 'Live settlement active via Federal Reserve FedNow & Chase ACH.'}
            </p>
          </div>

          <div className="mt-3 px-1 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              v1.4.0 API Gateway
            </span>
            <span className="text-slate-400 font-mono">99.98% SLA</span>
          </div>
        </div>
      </aside>
    </>
  );
};
