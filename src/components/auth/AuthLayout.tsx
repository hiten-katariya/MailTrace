import React, { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowLeft, Radio, Network, FileSearch, Lock } from 'lucide-react';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen bg-[#06090F] flex relative overflow-hidden font-sans">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* LEFT PANEL: Enterprise Forensic Visual (Desktop) */}
      <div className="hidden lg:flex lg:w-5/12 bg-[#090E17]/80 border-r border-slate-800/60 p-12 flex-col justify-between relative z-10">
        <div>
          {/* Brand */}
          <Link to="/" className="inline-flex items-center gap-2.5 group">
            <div className="flex items-center justify-center w-8 h-8 rounded bg-cyan-500/10 border border-cyan-500/30 group-hover:border-cyan-400 transition-colors shadow-soc-subtle">
              <Shield className="w-4 h-4 text-cyan-400 group-hover:scale-105 transition-transform" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-bold tracking-wider text-slate-100 font-mono">
                MAIL<span className="text-cyan-400">TRACE</span>
              </span>
              <span className="px-1.5 py-0.5 text-[8px] font-mono uppercase font-bold tracking-widest bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 rounded">
                SOC v2.0
              </span>
            </div>
          </Link>

          {/* Hero text */}
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-slate-100 font-mono leading-tight tracking-tight">
              Trace the origin.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                Expose the fraud.
              </span>
            </h2>
            <p className="mt-3 text-xs text-slate-400 leading-relaxed font-sans max-w-sm">
              Automated multi-signal forensic email analysis. Inspect RFC headers, relay anomalies, deceptive homoglyphs, optical QR vectors, and threat infrastructure in seconds.
            </p>
          </div>

          {/* Forensic Feature Highlights */}
          <div className="mt-10 space-y-4 max-w-sm">
            <div className="flex items-start gap-3 p-3 rounded bg-slate-900/60 border border-slate-800/80">
              <div className="p-2 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mt-0.5">
                <Radio className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-200 font-mono">Real-Time Mailbox Sensor</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Autonomous readonly sync with continuous zero-delay threat streaming.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded bg-slate-900/60 border border-slate-800/80">
              <div className="p-2 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mt-0.5">
                <FileSearch className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-200 font-mono">Explainable Signal Fusion</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Evidence-first scoring with verifiable weights and relay path attribution.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded bg-slate-900/60 border border-slate-800/80">
              <div className="p-2 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mt-0.5">
                <Network className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-200 font-mono">Threat Campaign Clustering</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Interactive network graph correlating shared attacker infrastructure.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Security Badge */}
        <div className="pt-6 border-t border-slate-800/50 flex items-center justify-between text-[10px] font-mono text-slate-500">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-cyan-500" />
            <span>AES-256 ENCRYPTED CREDENTIALS</span>
          </div>
          <span>STRICT SOC-2 / NIST GUIDELINES</span>
        </div>
      </div>

      {/* RIGHT PANEL: Authentication Form */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-12 lg:p-16 relative z-10 overflow-y-auto">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-cyan-400 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Public Briefing</span>
          </Link>

          <div className="lg:hidden flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold font-mono text-slate-200">
              MAIL<span className="text-cyan-400">TRACE</span>
            </span>
          </div>
        </div>

        <div className="max-w-md w-full mx-auto my-8">
          <div className="mb-6 text-center sm:text-left">
            <h1 className="text-xl font-bold font-mono tracking-tight text-slate-100">
              {title}
            </h1>
            <p className="text-xs text-slate-400 mt-1 font-sans">
              {subtitle}
            </p>
          </div>

          <div className="bg-[#090E17]/90 border border-slate-800/80 rounded-lg shadow-2xl p-6 sm:p-7 backdrop-blur-sm">
            {children}
          </div>
        </div>

        <div className="text-center text-[10px] font-mono text-slate-500">
          MAILTRACE FORENSICS PLATFORM • SECURE ACCESS CONTROL
        </div>
      </div>
    </div>
  );
};
