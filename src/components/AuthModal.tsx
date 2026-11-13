import React, { useState } from 'react';
import { UserProfile } from '../types';
import { alternateProfiles } from '../data/mockData';
import { Shield, Check, Lock, Globe, UserCheck, Sparkles, Key } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onSelectUser: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSelectUser
}) => {
  const [authProvider, setAuthProvider] = useState<'google' | 'github' | 'finflow'>('google');
  const [isAuthorizing, setIsAuthorizing] = useState(false);

  if (!isOpen) return null;

  const handleSimulateOAuth = (profile: UserProfile, provider: 'google' | 'github') => {
    setIsAuthorizing(true);
    setTimeout(() => {
      onSelectUser({
        ...profile,
        provider,
      });
      setIsAuthorizing(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
              FF
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">OAuth 2.0 Authentication</h2>
              <p className="text-xs text-slate-500">Secure SSO sign-on & developer persona switcher</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 text-lg font-bold"
          >
            ✕
          </button>
        </div>

        {/* Persona options */}
        <div className="py-4 space-y-3">
          <p className="text-xs font-semibold text-slate-600">Select Demo Merchant / Developer Profile:</p>

          {alternateProfiles.map((profile) => {
            const isSelected = currentUser.id === profile.id;
            return (
              <div 
                key={profile.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  isSelected 
                    ? 'border-indigo-600 bg-indigo-50/50 shadow-xs ring-1 ring-indigo-500' 
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img 
                      src={profile.avatar} 
                      alt={profile.name} 
                      className="w-10 h-10 rounded-full object-cover border border-slate-200"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900">{profile.name}</span>
                        {isSelected && (
                          <span className="text-[10px] bg-indigo-600 text-white px-1.5 py-0.2 rounded font-semibold">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">{profile.role}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{profile.organization}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-[11px] text-slate-500 font-mono">
                    Balance: <strong className="text-slate-800">${profile.accountBalance.toLocaleString()}</strong>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSimulateOAuth(profile, 'google')}
                      disabled={isAuthorizing}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded border border-slate-200 flex items-center gap-1 transition-colors"
                    >
                      <span>Google SSO</span>
                    </button>
                    <button
                      onClick={() => handleSimulateOAuth(profile, 'github')}
                      disabled={isAuthorizing}
                      className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded flex items-center gap-1 transition-colors"
                    >
                      <span>GitHub OAuth</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Security Badges */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span className="flex items-center gap-1 text-emerald-600 font-semibold">
            <Shield className="w-3.5 h-3.5" />
            <span>PKCE & State Token Verified</span>
          </span>
          <span>Scope: read:ledger write:api</span>
        </div>
      </div>
    </div>
  );
};
