import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Shield, CheckCircle2, ArrowRight, Eye, Lock, Zap } from 'lucide-react';
import { getGmailAuthUrl } from '../../mocks/api';

export const GmailOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnectGmail = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { auth_url } = await getGmailAuthUrl();
      window.location.href = auth_url;
    } catch (err: any) {
      console.error('Failed to initiate Gmail OAuth:', err);
      setError(err.message || 'Unable to connect to Google OAuth service');
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#06090F] flex items-center justify-center p-4 relative font-sans">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-lg w-full bg-[#090E17]/95 border border-slate-800/90 rounded-xl shadow-2xl p-6 sm:p-8 relative z-10">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mb-3 shadow-soc-subtle">
            <Mail className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold font-mono text-slate-100">
            Activate Live Mailbox Defense
          </h2>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
            Link your Gmail inbox for automated continuous threat inspection, instant phishing quarantine alerts, and zero-delay SSE streaming.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono">
            {error}
          </div>
        )}

        {/* Security & Permissions Disclosure */}
        <div className="space-y-3 mb-6">
          <div className="flex items-start gap-3 p-3 rounded bg-slate-900/70 border border-slate-800/80">
            <div className="p-1.5 rounded bg-emerald-500/10 text-emerald-400 mt-0.5">
              <Eye className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-xs font-mono font-semibold text-slate-200">Strictly Read-Only Access</div>
              <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                Scope: <span className="text-cyan-300">gmail.readonly</span>. MailTrace cannot send, compose, delete, or alter any emails in your account.
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded bg-slate-900/70 border border-slate-800/80">
            <div className="p-1.5 rounded bg-cyan-500/10 text-cyan-400 mt-0.5">
              <Zap className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-xs font-mono font-semibold text-slate-200">Autonomous Sensor Pipeline</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                New messages are analyzed in real time through the 5-stage explainable scoring engine.
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded bg-slate-900/70 border border-slate-800/80">
            <div className="p-1.5 rounded bg-blue-500/10 text-blue-400 mt-0.5">
              <Lock className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-xs font-mono font-semibold text-slate-200">Revoke Anytime</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Disconnect with one click from the Live Mailbox panel to permanently purge stored tokens.
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleConnectGmail}
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-soc-subtle cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <span>Connecting to Google...</span>
            ) : (
              <>
                <span>Connect Gmail Account</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>

          <button
            onClick={handleSkip}
            type="button"
            className="w-full py-2 px-4 rounded text-xs font-mono text-slate-400 hover:text-slate-200 hover:bg-slate-800/30 transition-colors cursor-pointer"
          >
            Skip for now, proceed to Forensic Station →
          </button>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-800/60 text-center text-[10px] font-mono text-slate-500">
          You can always connect or disconnect mailboxes later from the Live Mailbox console.
        </div>
      </div>
    </div>
  );
};
