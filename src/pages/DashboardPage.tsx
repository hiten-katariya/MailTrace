import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCases, getCampaigns } from '../mocks/api';
import { SummaryStrip } from '../components/dashboard/SummaryStrip';
import { ThreatCharts } from '../components/dashboard/ThreatCharts';
import { CaseTable } from '../components/dashboard/CaseTable';
import { LiveActivityStream } from '../components/dashboard/LiveActivityStream';
import { RefreshCw, Radio, ShieldAlert } from 'lucide-react';

interface DashboardPageProps {
  onSelectCase: (caseId: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onSelectCase }) => {
  const [lastRefreshed, setLastRefreshed] = useState<string>('just now');

  const { data: casesData, isLoading: isCasesLoading, refetch } = useQuery({
    queryKey: ['cases'],
    queryFn: () => getCases({ limit: 50 }),
  });

  const { data: campaignsData } = useQuery({
    queryKey: ['campaigns'],
    queryFn: getCampaigns,
  });

  const cases = casesData?.cases || [];
  const campaignCount = campaignsData?.campaigns.length || 0;
  const criticalThreats = cases.filter((c) => c.fraud_score >= 70).length;

  const handleManualRefresh = () => {
    refetch();
    setLastRefreshed('just now');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 space-y-5">
      {/* 1. Command Center Header (Section 6) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold font-mono text-slate-100 uppercase tracking-wide">
              INCIDENT TRIAGE QUEUE
            </h1>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/25">
              <Radio className="w-2.5 h-2.5 text-cyan-400 animate-pulse" />
              <span>LIVE FUSION</span>
            </span>
          </div>
          <p className="text-xs text-soc-text-dim mt-0.5 font-sans">
            Threat detection, domain reputation analysis & forensic examination queue
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-[10px] font-mono text-soc-muted text-right hidden sm:block">
            <div>INVESTIGATIONS: <span className="text-slate-200 font-bold">{cases.length} ACTIVE</span></div>
            <div>LAST REFRESH: <span className="text-slate-400">{lastRefreshed}</span></div>
          </div>

          <button
            onClick={handleManualRefresh}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-soc-panel hover:bg-soc-hover border border-slate-800/60 text-slate-300 hover:text-cyan-300 text-xs font-mono transition-colors shadow-soc-subtle"
          >
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 2. KPI / System Overview Metric Modules (Section 7) */}
      <SummaryStrip cases={cases} campaignCount={campaignCount} />

      {/* 3. Threat Classification & Fraud Score Spectrum (Sections 8 & 9) */}
      <ThreatCharts cases={cases} />

      {/* 4. Live Activity Stream & Incident Queue (Sections 10, 11, 12) */}
      <div className="space-y-5">
        <LiveActivityStream onSelectCase={onSelectCase} />

        <CaseTable
          cases={cases}
          onSelectCase={onSelectCase}
          isLoading={isCasesLoading}
        />
      </div>
    </div>
  );
};
