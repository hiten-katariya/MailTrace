import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCases, getCampaigns } from '../mocks/api';
import { SummaryStrip } from '../components/dashboard/SummaryStrip';
import { ThreatCharts } from '../components/dashboard/ThreatCharts';
import { CaseTable } from '../components/dashboard/CaseTable';
import { RefreshCw } from 'lucide-react';

interface DashboardPageProps {
  onSelectCase: (caseId: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onSelectCase }) => {
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-soc-border">
        <div>
          <h1 className="text-xl font-bold font-mono text-slate-100 flex items-center gap-2">
            <span>INCIDENT TRIAGE & THREAT QUEUE</span>
            <span className="text-xs px-2 py-0.5 rounded bg-soc-raised text-cyan-400 border border-slate-700 font-normal">
              REAL-TIME FUSION
            </span>
          </h1>
          <p className="text-xs text-soc-text-dim mt-0.5">
            Active forensic examination queue for incoming email transmissions across enterprise sensors.
          </p>
        </div>

        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-soc-raised hover:bg-soc-hover border border-soc-border text-slate-300 hover:text-cyan-300 text-xs font-mono transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Feed</span>
        </button>
      </div>

      {/* Summary KPI Strip */}
      <SummaryStrip cases={cases} campaignCount={campaignCount} />

      {/* Threat Distribution Charts */}
      <ThreatCharts cases={cases} />

      {/* Case Table Ledger */}
      <CaseTable
        cases={cases}
        onSelectCase={onSelectCase}
        isLoading={isCasesLoading}
      />
    </div>
  );
};
