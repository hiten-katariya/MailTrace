import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCases, getCampaigns, deleteCase, deleteCases } from '../mocks/api';
import { SummaryStrip } from '../components/dashboard/SummaryStrip';
import { ThreatCharts } from '../components/dashboard/ThreatCharts';
import { CaseTable } from '../components/dashboard/CaseTable';
import { LiveActivityStream } from '../components/dashboard/LiveActivityStream';
import { RefreshCw, Radio, CheckCircle, Trash2 } from 'lucide-react';

interface DashboardPageProps {
  onSelectCase: (caseId: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onSelectCase }) => {
  const queryClient = useQueryClient();
  const [lastRefreshed, setLastRefreshed] = useState<string>('just now');
  const [notification, setNotification] = useState<string | null>(null);

  const { data: casesData, isLoading: isCasesLoading, refetch } = useQuery({
    queryKey: ['cases'],
    queryFn: () => getCases({ limit: 100 }),
  });

  const { data: campaignsData } = useQuery({
    queryKey: ['campaigns'],
    queryFn: getCampaigns,
  });

  const cases = casesData?.cases || [];
  const campaignCount = campaignsData?.campaigns.length || 0;

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification((curr) => (curr === msg ? null : curr));
    }, 4000);
  };

  // Single Case Deletion Mutation
  const deleteSingleMutation = useMutation({
    mutationFn: (caseId: string) => deleteCase(caseId),
    onSuccess: (_, caseId) => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      showToast(`Case ${caseId.substring(0, 12)} successfully deleted from triage queue`);
    },
  });

  // Batch Case Deletion Mutation
  const deleteBatchMutation = useMutation({
    mutationFn: (caseIds: string[]) => deleteCases(caseIds),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      showToast(`Successfully deleted ${data.deleted_count} email case(s) from triage queue`);
    },
  });

  const handleManualRefresh = () => {
    refetch();
    setLastRefreshed('just now');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 space-y-5 relative">
      {/* Toast Notification Banner */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded bg-soc-panel border border-cyan-500/40 text-slate-200 text-xs font-mono shadow-2xl animate-in slide-in-from-bottom-2 duration-150">
          <CheckCircle className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* 1. Command Center Header */}
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

      {/* 2. KPI / System Overview Metric Modules */}
      <SummaryStrip cases={cases} campaignCount={campaignCount} />

      {/* 3. Threat Classification & Fraud Score Spectrum */}
      <ThreatCharts cases={cases} />

      {/* 4. Live Activity Stream & Incident Queue */}
      <div className="space-y-5">
        <LiveActivityStream onSelectCase={onSelectCase} />

        <CaseTable
          cases={cases}
          onSelectCase={onSelectCase}
          onDeleteCase={(id) => deleteSingleMutation.mutate(id)}
          onDeleteCases={(ids) => deleteBatchMutation.mutate(ids)}
          isLoading={isCasesLoading || deleteSingleMutation.isPending || deleteBatchMutation.isPending}
        />
      </div>
    </div>
  );
};
