import React from 'react';
import { ShieldAlert, Mail, Layers, Activity } from 'lucide-react';
import { CaseSummary } from '../../types/case';

interface SummaryStripProps {
  cases: CaseSummary[];
  campaignCount: number;
}

export const SummaryStrip: React.FC<SummaryStripProps> = ({ cases, campaignCount }) => {
  const total = cases.length;
  const highRisk = cases.filter((c) => c.fraud_score >= 70).length;
  const suspicious = cases.filter((c) => c.fraud_score >= 40 && c.fraud_score < 70).length;
  const authFailures = cases.filter((c) => c.spf === 'fail' || c.dmarc === 'fail').length;

  const avgScore = total > 0 ? Math.round(cases.reduce((acc, c) => acc + c.fraud_score, 0) / total) : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
      {/* Metric 1: Total Ingested */}
      <div className="p-3.5 bg-soc-panel border border-soc-border rounded-md shadow-soc-subtle relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono text-soc-muted uppercase tracking-wider">
            Ingested Emails
          </span>
          <Mail className="w-4 h-4 text-cyan-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono text-slate-100">{total}</span>
          <span className="text-[11px] font-mono text-emerald-400">100% parsed</span>
        </div>
        <div className="mt-1 text-[11px] text-soc-text-dim">
          Full forensic telemetry extracted
        </div>
      </div>

      {/* Metric 2: High Risk / Threats */}
      <div className="p-3.5 bg-soc-panel border border-red-900/30 rounded-md shadow-soc-subtle relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono text-red-400/90 uppercase tracking-wider font-semibold">
            High Risk / Phishing
          </span>
          <ShieldAlert className="w-4 h-4 text-red-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono text-red-400">{highRisk}</span>
          <span className="text-[11px] font-mono text-amber-400">+{suspicious} suspicious</span>
        </div>
        <div className="mt-1 text-[11px] text-soc-text-dim">
          Requires urgent analyst intervention
        </div>
      </div>

      {/* Metric 3: Active Campaigns */}
      <div className="p-3.5 bg-soc-panel border border-soc-border rounded-md shadow-soc-subtle relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono text-soc-muted uppercase tracking-wider">
            Active Campaign Clusters
          </span>
          <Layers className="w-4 h-4 text-cyan-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono text-cyan-300">{campaignCount}</span>
          <span className="text-[11px] font-mono text-slate-400">infra linked</span>
        </div>
        <div className="mt-1 text-[11px] text-soc-text-dim">
          Correlated threat infrastructure
        </div>
      </div>

      {/* Metric 4: Protocol Health */}
      <div className="p-3.5 bg-soc-panel border border-soc-border rounded-md shadow-soc-subtle relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono text-soc-muted uppercase tracking-wider">
            Authentication Posture
          </span>
          <Activity className="w-4 h-4 text-amber-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono text-amber-400">{authFailures}</span>
          <span className="text-[11px] font-mono text-slate-400">SPF/DMARC fails</span>
        </div>
        <div className="mt-1 text-[11px] text-soc-text-dim">
          Avg Threat Score: <span className="font-mono text-slate-200">{avgScore}/100</span>
        </div>
      </div>
    </div>
  );
};
