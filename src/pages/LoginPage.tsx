import React, { useState } from 'react';
import { Shield, User, Key, ArrowRight } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (username: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('analyst1');
  const [password, setPassword] = useState('••••••••••••');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      onLoginSuccess(username || 'analyst1');
    }, 400);
  };

  const handleQuickLogin = (roleUser: string) => {
    setUsername(roleUser);
    setPassword('••••••••••••');
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      onLoginSuccess(roleUser);
    }, 300);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#070B12] bg-grid-pattern relative">
      {/* Background subtle radial glow */}
      <div className="absolute w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-soc-panel border border-slate-800/80 rounded shadow-2xl p-7 relative z-10">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mb-2.5 shadow-soc-subtle">
            <Shield className="w-5 h-5" />
          </div>
          <h1 className="text-lg font-bold font-mono tracking-wider text-slate-100">
            MAIL<span className="text-cyan-400">TRACE</span> CONSOLE
          </h1>
          <p className="text-[11px] text-soc-text-dim mt-0.5 font-sans">
            Threat Detection, Geolocation & Forensic Intelligence
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-[10px] font-mono uppercase text-soc-muted mb-1">
              Analyst Identifier / Badge ID
            </label>
            <div className="relative">
              <User className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full pl-8 pr-3 py-1.5 bg-soc-inset border border-slate-800/80 focus:border-cyan-500 focus:outline-none rounded text-xs font-mono text-slate-200"
                placeholder="analyst1"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-mono uppercase text-soc-muted mb-1">
              Security Token / Passphrase
            </label>
            <div className="relative">
              <Key className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-8 pr-3 py-1.5 bg-soc-inset border border-slate-800/80 focus:border-cyan-500 focus:outline-none rounded text-xs font-mono text-slate-200"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2 px-4 rounded bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shadow-soc-subtle"
          >
            <span>{isSubmitting ? 'Authenticating...' : 'Access Forensic Station'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Quick Demo Analyst Presets */}
        <div className="mt-5 pt-4 border-t border-slate-800/60">
          <span className="text-[9px] font-mono uppercase text-soc-muted block mb-2 text-center">
            Fast Demonstration Credentials (1-Click)
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <button
              type="button"
              onClick={() => handleQuickLogin('analyst1 (Alex Rivera)')}
              className="p-2 rounded bg-soc-inset hover:bg-soc-hover border border-slate-800/60 text-slate-300 text-[10px] transition-colors text-left"
            >
              <span className="block text-cyan-400 font-semibold">Tier-2 Analyst</span>
              <span className="text-[9px] text-slate-500">Alex Rivera</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('lead_investigator (Sarah Chen)')}
              className="p-2 rounded bg-soc-inset hover:bg-soc-hover border border-slate-800/60 text-slate-300 text-[10px] transition-colors text-left"
            >
              <span className="block text-amber-400 font-semibold">Lead Investigator</span>
              <span className="text-[9px] text-slate-500">Sarah Chen</span>
            </button>
          </div>
        </div>

        {/* Security Legal Disclaimer */}
        <div className="mt-5 text-[9px] font-mono text-center text-slate-500 leading-tight">
          SECURE ACCESS CONTROL • AUDIT LOGGING ENABLED FOR ALL INCIDENT ACCESS
        </div>
      </div>
    </div>
  );
};
