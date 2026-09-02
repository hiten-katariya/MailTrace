import React from 'react';
import { ShieldAlert, Mail, Layers, Activity, TrendingUp } from 'lucide-react';
import { CaseSummary } from '../../types/case';

interface SummaryStripProps {
  cases: CaseSummary[];
  campaignCount: number;
}

export const SummaryStrip: React.FC<SummaryStripProps> = ({ cases, campaignCount }) => {
  const total = cases.length;
  const highRisk = cases.filter((c) => c.fraud_score >= 70).length;
  const suspicious = cases.filter((c) => c.fraud_score >= 40 && c.fraud_score < 70).length;
  const cleanCount = cases.filter((c) => c.fraud_score < 40).length;
  const authFailures = cases.filter((c) => c.spf === 'fail' || c.dmarc === 'fail').length;

  const avgScore = total > 0 ? Math.round(cases.reduce((acc, c) => acc + c.fraud_score, 0) / total) : 0;
  const highRiskPct = total > 0 ? Math.round((highRisk / total) * 100) : 0;
  const authFailPct = total > 0 ? Math.round((authFailures / total) * 100) : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {/* Module 1: Ingested Cases */}
      <div className="p-3.5 bg-soc-panel border border-slate-800/60 rounded relative overflow-hidden shadow-soc-card">
        <div className="flex items-center justify-between text-[10px] font-mono uppercase text-soc-muted tracking-wider">
          <span>Ingested Transmissions</span>
          <Mail className="w-3.5 h-3.5 text-cyan-400 opacity-80" />
        </div>

        <div className="mt-2 flex items-baseline justify-between">
          <div className="text-2xl font-bold font-mono text-slate-100 tracking-tight leading-none">
            {total < 10 ? `0${total}` : total}
          </div>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/25">
            100% PARSED
          </span>
        </div>

        {/* Micro Sparkline Segment Bar */}
        <div className="mt-2.5 flex items-center gap-1">
          <div className="h-1 bg-cyan-400 rounded-full flex-1" style={{ width: '100%' }} />
          <div className="h-1 bg-slate-700/60 rounded-full w-4" />
        </div>

        <div className="mt-1.5 flex items-center justify-between text-[10px] font-mono text-soc-text-dim">
          <span>Full Forensic Telemetry</span>
          <span className="text-slate-400">0 queued</span>
        </div>
      </div>

      {/* Module 2: High-Risk Threats */}
      <div className="p-3.5 bg-soc-panel border border-slate-800/60 rounded relative overflow-hidden shadow-soc-card">
        <div className="flex items-center justify-between text-[10px] font-mono uppercase text-red-400 tracking-wider font-semibold">
          <span>High-Risk Threats</span>
          <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
        </div>

        <div className="mt-2 flex items-baseline justify-between">
          <div className="text-2xl font-bold font-mono text-red-400 tracking-tight leading-none">
            {highRisk < 10 ? `0${highRisk}` : highRisk}
          </div>
          <span className="text-[10px] font-mono text-red-400 bg-red-500/10 px-1.5 py-0.2 rounded border border-red-500/25">
            {highRiskPct}% CORPUS
          </span>
        </div>

        {/* Micro Segment Bar */}
        <div className="mt-2.5 flex items-center gap-1">
          <div className="h-1 bg-red-500 rounded-full" style={{ width: `${Math.max(highRiskPct, 8)}%` }} />
          <div className="h-1 bg-amber-500 rounded-full" style={{ width: `${(suspicious / total) * 100}%` }} />
          <div className="h-1 bg-slate-800 rounded-full flex-1" />
        </div>

        <div className="mt-1.5 flex items-center justify-between text-[10px] font-mono text-soc-text-dim">
          <span className="text-amber-400">+{suspicious} suspicious</span>
          <span className="text-red-400 font-semibold">Critical queue</span>
        </div>
      </div>

      {/* Module 3: Active Campaigns */}
      <div className="p-3.5 bg-soc-panel border border-slate-800/60 rounded relative overflow-hidden shadow-soc-card">
        <div className="flex items-center justify-between text-[10px] font-mono uppercase text-soc-muted tracking-wider">
          <span>Correlated Clusters</span>
          <Layers className="w-3.5 h-3.5 text-cyber-cyan opacity-80" />
        </div>

        <div className="mt-2 flex items-baseline justify-between">
          <div className="text-2xl font-bold font-mono text-cyan-300 tracking-tight leading-none">
            {campaignCount < 10 ? `0${campaignCount}` : campaignCount}
          </div>
          <span className="text-[10px] font-mono text-cyan-300 bg-cyan-500/10 px-1.5 py-0.2 rounded border border-cyan-500/25">
            GRAPH LINKED
          </span>
        </div>

        {/* Micro Segment Bar */}
        <div className="mt-2.5 flex items-center gap-1">
          <div className="h-1 bg-cyan-400 rounded-full" style={{ width: '40%' }} />
          <div className="h-1 bg-indigo-400 rounded-full" style={{ width: '30%' }} />
          <div className="h-1 bg-slate-800 rounded-full flex-1" />
        </div>

        <div className="mt-1.5 flex items-center justify-between text-[10px] font-mono text-soc-text-dim">
          <span>Shared Infra Pivot</span>
          <span className="text-slate-400">3 ASNs</span>
        </div>
      </div>

      {/* Module 4: Authentication Posture */}
      <div className="p-3.5 bg-soc-panel border border-slate-800/60 rounded relative overflow-hidden shadow-soc-card">
        <div className="flex items-center justify-between text-[10px] font-mono uppercase text-soc-muted tracking-wider">
          <span>Authentication Posture</span>
          <Activity className="w-3.5 h-3.5 text-amber-400 opacity-80" />
        </div>

        <div className="mt-2 flex items-baseline justify-between">
          <div className="text-2xl font-bold font-mono text-amber-400 tracking-tight leading-none">
            {authFailures < 10 ? `0${authFailures}` : authFailures}
          </div>
          <span className="text-[10px] font-mono text-amber-300 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/25">
            {authFailPct}% DMARC FAIL
          </span>
        </div>

        {/* Micro Segment Bar */}
        <div className="mt-2.5 flex items-center gap-1">
          <div className="h-1 bg-emerald-500 rounded-full" style={{ width: `${(cleanCount / total) * 100}%` }} />
          <div className="h-1 bg-amber-500 rounded-full" style={{ width: `${(authFailures / total) * 100}%` }} />
          <div className="h-1 bg-slate-800 rounded-full flex-1" />
        </div>

        <div className="mt-1.5 flex items-center justify-between text-[10px] font-mono text-soc-text-dim">
          <span>Avg Threat Score</span>
          <span className="font-semibold text-slate-200">{avgScore}/100</span>
        </div>
      </div>
    </div>
  );
};
