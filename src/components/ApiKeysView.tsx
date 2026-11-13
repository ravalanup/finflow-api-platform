import React, { useState } from 'react';
import { ApiKey } from '../types';
import { 
  Key, 
  Copy, 
  Check, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Plus, 
  RotateCw, 
  AlertTriangle,
  Lock,
  Globe
} from 'lucide-react';

interface ApiKeysViewProps {
  apiKeys: ApiKey[];
  onRotateKey: (id: string) => void;
  onCreateKey: (name: string, mode: 'live' | 'test') => void;
}

export const ApiKeysView: React.FC<ApiKeysViewProps> = ({
  apiKeys,
  onRotateKey,
  onCreateKey
}) => {
  const [revealedKeys, setRevealedKeys] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyMode, setNewKeyMode] = useState<'live' | 'test'>('test');

  const toggleReveal = (id: string) => {
    setRevealedKeys(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopy = (id: string, textToCopy: string) => {
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName) return;
    onCreateKey(newKeyName, newKeyMode);
    setNewKeyName('');
    setShowCreateModal(false);
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto p-4 sm:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">API Security & Secret Keys</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage Bearer authentication tokens for production payment gateways and developer sandbox testing
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors self-start md:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Generate New Key</span>
        </button>
      </div>

      {/* Security Tip Banner */}
      <div className="bg-slate-900 text-white rounded-xl p-4 mb-6 border border-slate-800 flex items-start gap-3 shadow-md">
        <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div className="text-xs">
          <p className="font-semibold text-slate-200">Keep Your Production Secrets Secure</p>
          <p className="text-slate-400 mt-0.5 leading-relaxed">
            Never commit secret keys to client bundles or public git repositories. FinFlow recommends storing keys in server-side environment variables (`FINFLOW_SECRET_KEY`) with restricted IP allowlists.
          </p>
        </div>
      </div>

      {/* API Keys List */}
      <div className="space-y-4 mb-8">
        {apiKeys.map((key) => {
          const isRevealed = !!revealedKeys[key.id];
          const isCopied = copiedId === key.id;

          return (
            <div 
              key={key.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    key.mode === 'live' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'
                  }`}>
                    <Key className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">{key.name}</h3>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                        key.mode === 'live'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}>
                        {key.mode}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Created on {key.createdAt} • Last used {key.lastUsed}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onRotateKey(key.id)}
                    className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md border border-slate-200 flex items-center gap-1 transition-colors"
                    title="Rotate Key & Revoke Old Secret"
                  >
                    <RotateCw className="w-3 h-3 text-slate-400" />
                    <span>Rotate</span>
                  </button>
                </div>
              </div>

              {/* Key string & Copy bar */}
              <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div className="font-mono text-xs text-slate-800 break-all select-all flex-1">
                  {isRevealed ? key.fullKey : key.maskedKey}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleReveal(key.id)}
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded transition-colors"
                    title={isRevealed ? 'Hide secret key' : 'Reveal full secret key'}
                  >
                    {isRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleCopy(key.id, key.fullKey)}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-md flex items-center gap-1.5 transition-colors shadow-2xs"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Key</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Usage stats */}
              <div className="mt-4 pt-3 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
                <div className="flex items-center gap-4">
                  <span>Usage: <strong className="text-slate-800 font-mono">{key.usageCount.toLocaleString()}</strong> calls this month</span>
                  <span>Limit: <strong className="text-slate-800 font-mono">{key.monthlyLimit.toLocaleString()}</strong></span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-emerald-600 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>TLS 1.3 Encryption Active</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Webhook & IP Whitelist Settings Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-1">Webhook Endpoint Destinations</h3>
        <p className="text-xs text-slate-500 mb-4">
          FinFlow will sign outbound webhook events using your signing secret `whsec_99182aK`
        </p>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
            <div className="flex items-center gap-2 font-mono">
              <Globe className="w-4 h-4 text-slate-400" />
              <span className="text-slate-800">https://api.merchant.com/webhooks/finflow</span>
            </div>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
              Enabled (16 events)
            </span>
          </div>
        </div>
      </div>

      {/* Create Key Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h2 className="text-base font-bold text-slate-900 mb-2">Generate API Key</h2>
            <p className="text-xs text-slate-500 mb-4">
              Create an isolated access credential for your backend microservice or CI/CD test runner.
            </p>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Key Name / Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AWS Lambda Payment Webhook Consumer"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Environment Mode</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setNewKeyMode('test')}
                    className={`p-3 rounded-lg border text-xs font-semibold text-center transition-colors ${
                      newKeyMode === 'test'
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-bold'
                        : 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}
                  >
                    Test (Sandbox)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewKeyMode('live')}
                    className={`p-3 rounded-lg border text-xs font-semibold text-center transition-colors ${
                      newKeyMode === 'live'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-bold'
                        : 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}
                  >
                    Live (Production)
                  </button>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
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
                  Create Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
