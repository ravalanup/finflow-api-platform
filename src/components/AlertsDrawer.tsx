import React from 'react';
import { AlertNotification, AppTab } from '../types';
import { Bell, AlertTriangle, CheckCircle2, Clock, X, ShieldAlert, ArrowRight, ExternalLink } from 'lucide-react';

interface AlertsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: AlertNotification[];
  onDismissAlert: (id: string) => void;
  onResolveAlert: (alert: AlertNotification) => void;
  setCurrentTab: (tab: AppTab) => void;
}

export const AlertsDrawer: React.FC<AlertsDrawerProps> = ({
  isOpen,
  onClose,
  alerts,
  onDismissAlert,
  onResolveAlert,
  setCurrentTab
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div 
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 pl-10 max-w-full flex">
        <div className="w-screen max-w-md bg-white shadow-2xl border-l border-slate-200 flex flex-col">
          {/* Drawer Header */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Notifications & Alerts</h2>
                <p className="text-xs text-slate-500">Active threshold monitors & billing warnings</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg text-lg font-bold"
            >
              ✕
            </button>
          </div>

          {/* Alerts List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {alerts.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="font-semibold text-slate-700">All alerts resolved!</p>
                <p className="text-slate-400 mt-0.5">Your cash flow and API thresholds are operating within safe bounds.</p>
              </div>
            ) : (
              alerts.map((alert) => (
                <div 
                  key={alert.id}
                  className={`p-4 rounded-xl border transition-all ${
                    alert.resolved
                      ? 'bg-slate-50 border-slate-200 opacity-60'
                      : alert.severity === 'high'
                        ? 'bg-amber-50/70 border-amber-200 shadow-2xs'
                        : 'bg-white border-slate-200 shadow-2xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      {alert.severity === 'high' ? (
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      ) : (
                        <ShieldAlert className="w-4 h-4 text-indigo-600 shrink-0" />
                      )}
                      <h4 className="text-xs font-bold text-slate-900">{alert.title}</h4>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0">{alert.timestamp}</span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed mb-3">
                    {alert.message}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <button
                      onClick={() => onDismissAlert(alert.id)}
                      className="text-[11px] text-slate-400 hover:text-slate-600 font-medium"
                    >
                      Dismiss
                    </button>
                    <button
                      onClick={() => {
                        onResolveAlert(alert);
                        onClose();
                      }}
                      className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold shadow-2xs flex items-center gap-1 transition-colors"
                    >
                      <span>Take Action</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Drawer Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 text-center">
            FinFlow Webhook & Low-Balance Dispatcher v1.4
          </div>
        </div>
      </div>
    </div>
  );
};
