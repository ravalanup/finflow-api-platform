import React, { useState } from 'react';
import { UserProfile, AlertNotification } from '../types';
import { 
  Bell, 
  Menu, 
  Sparkles, 
  ChevronDown, 
  Shield, 
  ExternalLink, 
  LogOut, 
  UserCheck, 
  CheckCircle2, 
  AlertTriangle,
  RefreshCw,
  Plus
} from 'lucide-react';

interface HeaderProps {
  user: UserProfile;
  alerts: AlertNotification[];
  isSandbox: boolean;
  onOpenAlerts: () => void;
  onOpenAuthModal: () => void;
  onOpenAiAssistant: () => void;
  onOpenQuickPayment: () => void;
  onToggleMobileNav: () => void;
  isSyncing: boolean;
  onTriggerSync: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  alerts,
  isSandbox,
  onOpenAlerts,
  onOpenAuthModal,
  onOpenAiAssistant,
  onOpenQuickPayment,
  onToggleMobileNav,
  isSyncing,
  onTriggerSync,
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const unreadAlertsCount = alerts.filter(a => !a.resolved).length;

  return (
    <header 
      id="finflow-main-header"
      className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 shrink-0 z-20"
    >
      {/* Left: Mobile Nav toggle & Breadcrumb */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          id="mobile-nav-toggle-btn"
          onClick={onToggleMobileNav}
          className="lg:hidden p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
          aria-label="Open Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-xs sm:text-sm">
          <span className="text-slate-500 hidden sm:inline">{user.organization}</span>
          <span className="text-slate-400 hidden sm:inline">/</span>
          <div className="flex items-center gap-2">
            <span className="text-slate-900 font-semibold">{user.project}</span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-medium ${
              isSandbox 
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' 
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}>
              {isSandbox ? 'Test Mode' : 'Live Mode'}
            </span>
          </div>
        </div>
      </div>

      {/* Right: Actions, Alerts, AI Assistant, User Profile */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Real-time Sync Indicator */}
        <button
          onClick={onTriggerSync}
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-md border border-slate-200 transition-colors"
          title="Click to sync live transactions with ledger"
        >
          <span className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-indigo-500 animate-ping' : 'bg-emerald-500'}`} />
          <span className="text-[11px] font-medium">Real-Time Sync</span>
          <RefreshCw className={`w-3 h-3 text-slate-400 ${isSyncing ? 'animate-spin text-indigo-600' : ''}`} />
        </button>

        {/* Quick New Payment Simulation */}
        <button
          id="quick-payment-btn"
          onClick={onOpenQuickPayment}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white hover:bg-slate-800 text-xs font-semibold rounded-lg shadow-xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Payment</span>
        </button>

        {/* AI Financial Assistant Trigger */}
        <button
          id="ai-assistant-header-btn"
          onClick={onOpenAiAssistant}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-semibold rounded-lg border border-indigo-200 transition-colors"
          title="Open AI Financial Analysis"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span className="hidden sm:inline">FinFlow AI</span>
        </button>

        {/* Notification Bell */}
        <button
          id="alerts-notification-bell"
          onClick={onOpenAlerts}
          className="relative p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="View notifications and alerts"
        >
          <Bell className="w-5 h-5" />
          {unreadAlertsCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 border-2 border-white"></span>
            </span>
          )}
        </button>

        {/* User Account / Persona Switcher */}
        <div className="relative border-l border-slate-200 pl-3 sm:pl-4">
          <button
            id="user-profile-menu-btn"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2.5 p-1 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-slate-800 text-white font-bold text-xs flex items-center justify-center ring-2 ring-slate-100 overflow-hidden">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span>{user.name.split(' ').map(n => n[0]).join('')}</span>
              )}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-sm font-semibold text-slate-900 leading-tight">{user.name}</span>
              <span className="text-[10px] text-slate-500 font-medium leading-none">{user.role}</span>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:inline" />
          </button>

          {/* Profile Dropdown Menu */}
          {showProfileMenu && (
            <div 
              className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2"
              onMouseLeave={() => setShowProfileMenu(false)}
            >
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-xs text-slate-500">Signed in with OAuth</p>
                <p className="text-sm font-bold text-slate-900 truncate">{user.name}</p>
                <p className="text-xs text-slate-500 font-mono truncate">{user.email}</p>
                <div className="mt-2 flex items-center gap-1.5 text-[11px] text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                  <Shield className="w-3 h-3" />
                  <span>OAuth 2.0 ({user.provider.toUpperCase()})</span>
                </div>
              </div>

              <div className="px-4 py-2 text-xs border-b border-slate-100">
                <div className="flex justify-between text-slate-500 mb-1">
                  <span>Operating Balance</span>
                  <span className="font-semibold text-slate-900 font-mono">${user.accountBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Low Balance Limit</span>
                  <span className="text-amber-600 font-mono">${user.lowBalanceThreshold.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    onOpenAuthModal();
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium"
                >
                  <UserCheck className="w-4 h-4 text-slate-500" />
                  <span>Switch Account / OAuth Provider</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
