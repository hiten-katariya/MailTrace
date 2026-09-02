import React, { useState } from 'react';
import { ShieldAlert, Lock, User, Key, ArrowRight, ShieldCheck, Terminal } from 'lucide-react';

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
    <div className="min-h-screen flex items-center justify-center p-4 bg-soc-bg bg-grid-pattern relative">
      {/* Background radial glow */}
      <div className="absolute w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-soc-panel border border-soc-border rounded-lg shadow-2xl p-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 mb-3 shadow-soc-subtle">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold font-mono tracking-wider text-slate-100">
            MAIL<span className="text-cyan-400">TRACE</span> CONSOLE
          </h1>
          <p className="text-xs text-soc-text-dim mt-1">
            Threat Detection, Geolocation & Forensic Intelligence
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-mono uppercase text-soc-muted mb-1.5">
              Analyst Identifier / Badge ID
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full pl-9 pr-4 py-2 bg-soc-inset border border-soc-border focus:border-cyan-500 focus:outline-none rounded text-xs font-mono text-slate-200"
                placeholder="analyst1"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase text-soc-muted mb-1.5">
              Security Token / Passphrase
            </label>
            <div className="relative">
              <Key className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-9 pr-4 py-2 bg-soc-inset border border-soc-border focus:border-cyan-500 focus:outline-none rounded text-xs font-mono text-slate-200"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shadow-soc-subtle"
          >
            <span>{isSubmitting ? 'Authenticating...' : 'Access Forensic Station'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Demo Analyst Presets */}
        <div className="mt-6 pt-5 border-t border-soc-border">
          <span className="text-[10px] font-mono uppercase text-soc-muted block mb-2 text-center">
            Fast Demonstration Presets (1-Click)
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <button
              type="button"
              onClick={() => handleQuickLogin('analyst1 (Alex Rivera)')}
              className="p-2 rounded bg-soc-inset hover:bg-soc-hover border border-soc-border text-slate-300 text-[11px] transition-colors"
            >
              <span className="block text-cyan-400 font-semibold">Tier-2 Analyst</span>
              <span className="text-[10px] text-soc-muted">Alex Rivera</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('lead_investigator (Sarah Chen)')}
              className="p-2 rounded bg-soc-inset hover:bg-soc-hover border border-soc-border text-slate-300 text-[11px] transition-colors"
            >
              <span className="block text-amber-400 font-semibold">Lead Investigator</span>
              <span className="text-[10px] text-soc-muted">Sarah Chen</span>
            </button>
          </div>
        </div>

        {/* Security Legal Disclaimer */}
        <div className="mt-6 text-[10px] font-mono text-center text-slate-500 leading-tight">
          SECURE ACCESS CONTROL • AUDIT LOGGING ENABLED FOR ALL INCIDENT ACCESS
        </div>
      </div>
    </div>
  );
};
