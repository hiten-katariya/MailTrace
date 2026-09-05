import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getCases,
  getCampaigns,
  deleteCase,
  deleteCases,
  getGmailAuthUrl,
  getGmailStatus,
  sendGmailCallback,
  disconnectGmail,
  getLiveStreamUrl,
} from '../mocks/api';
import { SummaryStrip } from '../components/dashboard/SummaryStrip';
import { ThreatCharts } from '../components/dashboard/ThreatCharts';
import { CaseTable } from '../components/dashboard/CaseTable';
import { LiveActivityStream } from '../components/dashboard/LiveActivityStream';
import { RefreshCw, Radio, CheckCircle, Mail, AlertTriangle } from 'lucide-react';

interface DashboardPageProps {
  onSelectCase: (caseId: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onSelectCase }) => {
  const queryClient = useQueryClient();
  const [lastRefreshed, setLastRefreshed] = useState<string>('just now');
  const [notification, setNotification] = useState<string | null>(null);
  const [isConnectingGmail, setIsConnectingGmail] = useState(false);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  const { data: casesData, isLoading: isCasesLoading, isRefetching: isCasesRefetching, refetch: refetchCases } = useQuery({
    queryKey: ['cases'],
    queryFn: () => getCases({ limit: 100 }),
  });

  const { data: campaignsData, refetch: refetchCampaigns } = useQuery({
    queryKey: ['campaigns'],
    queryFn: getCampaigns,
  });

  const { data: gmailStatus, refetch: refetchGmailStatus } = useQuery({
    queryKey: ['gmailStatus'],
    queryFn: getGmailStatus,
    refetchInterval: 10000,
  });

  const isRefreshing = isManualRefreshing || isCasesRefetching;

  const cases = casesData?.cases || [];
  const campaignCount = campaignsData?.campaigns.length || 0;

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification((curr) => (curr === msg ? null : curr));
    }, 4000);
  };

  // 1. Handle OAuth Redirect Callback (?code=...&state=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    if (code && state) {
      window.history.replaceState({}, document.title, window.location.pathname);
      showToast('Processing Google OAuth code exchange...');
      sendGmailCallback(code, state)
        .then((res) => {
          queryClient.invalidateQueries({ queryKey: ['gmailStatus'] });
          queryClient.invalidateQueries({ queryKey: ['cases'] });
          showToast(`Successfully linked Gmail account: ${res.email}`);
        })
        .catch((err) => {
          showToast(`Gmail connection failed: ${err.message || 'Authorization failed'}`);
        });
    }
  }, [queryClient]);

  // 2. Server-Sent Events (SSE) Live Feed Subscription
  useEffect(() => {
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource(getLiveStreamUrl());

      eventSource.addEventListener('case_completed', (e: MessageEvent) => {
        try {
          const payload = JSON.parse(e.data);
          queryClient.invalidateQueries({ queryKey: ['cases'] });
          queryClient.invalidateQueries({ queryKey: ['campaigns'] });
          queryClient.invalidateQueries({ queryKey: ['stats'] });
          queryClient.invalidateQueries({ queryKey: ['alerts'] });
          showToast(`Live Scan: "${payload.subject || payload.case_id}" (${payload.risk_category?.toUpperCase() || 'EVALUATED'})`);
          setLastRefreshed('just now');
        } catch (err) {
          console.error('Failed to parse SSE payload:', err);
        }
      });
    } catch (e) {
      console.warn('Could not establish SSE stream connection:', e);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [queryClient]);

  // Gmail Connect Action
  const handleConnectGmail = async () => {
    try {
      setIsConnectingGmail(true);
      const { auth_url } = await getGmailAuthUrl();
      window.location.href = auth_url;
    } catch (err: any) {
      setIsConnectingGmail(false);
      showToast(`OAuth start error: ${err.message || 'Failed'}`);
    }
  };

  // Gmail Disconnect Action
  const disconnectMutation = useMutation({
    mutationFn: disconnectGmail,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gmailStatus'] });
      showToast('Gmail account disconnected and credentials revoked.');
    },
    onError: (err: any) => {
      showToast(`Disconnect error: ${err.message || 'Failed'}`);
    },
  });

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

  const handleManualRefresh = async () => {
    setIsManualRefreshing(true);
    try {
      await Promise.all([
        refetchCases(),
        refetchCampaigns(),
        refetchGmailStatus(),
        queryClient.invalidateQueries({ queryKey: ['stats'] }),
        queryClient.invalidateQueries({ queryKey: ['alerts'] }),
      ]);
      const now = new Date();
      setLastRefreshed(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      showToast('Incident triage queue & threat metrics refreshed');
    } catch (err: any) {
      showToast(`Refresh error: ${err.message || 'Failed to refresh'}`);
    } finally {
      setIsManualRefreshing(false);
    }
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

        <div className="flex flex-wrap items-center gap-3">
          {/* Gmail Connection Controls */}
          {gmailStatus?.connected ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-soc-panel border border-emerald-500/30 text-xs font-mono shadow-soc-subtle">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-emerald-400 font-semibold">GMAIL</span>
                <span className="text-slate-300 font-sans text-[11px] truncate max-w-[150px]" title={gmailStatus.email || ''}>
                  {gmailStatus.email}
                </span>
                <span className="text-[10px] text-slate-500 hidden md:inline">
                  (15s poll)
                </span>
              </div>
              <button
                onClick={() => disconnectMutation.mutate()}
                disabled={disconnectMutation.isPending}
                title="Disconnect account and revoke OAuth tokens at Google"
                className="ml-2 text-[10px] text-rose-400 hover:text-rose-300 underline font-mono disabled:opacity-50"
              >
                {disconnectMutation.isPending ? '...' : 'Disconnect'}
              </button>
            </div>
          ) : gmailStatus?.status === 'needs_reauth' ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-amber-950/40 border border-amber-500/30 text-xs font-mono">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-amber-300 font-semibold">RE-AUTH REQUIRED</span>
              <button
                onClick={handleConnectGmail}
                disabled={isConnectingGmail}
                className="ml-1 px-2 py-0.5 rounded bg-amber-500/20 text-amber-200 hover:bg-amber-500/30 font-mono text-[10px]"
              >
                Reconnect
              </button>
            </div>
          ) : (
            <button
              onClick={handleConnectGmail}
              disabled={isConnectingGmail}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-gradient-to-r from-red-500/15 to-orange-500/10 hover:from-red-500/25 hover:to-orange-500/20 border border-red-500/35 text-red-300 hover:text-red-200 text-xs font-mono transition-all shadow-soc-subtle group"
              title="Connect Gmail account (read-only) for real-time 15-second background scanning"
            >
              <Mail className="w-3.5 h-3.5 text-red-400 group-hover:scale-110 transition-transform" />
              <span>{isConnectingGmail ? 'Opening Google...' : 'Connect Gmail'}</span>
            </button>
          )}

          <div className="text-[10px] font-mono text-soc-muted text-right hidden sm:block">
            <div>INVESTIGATIONS: <span className="text-slate-200 font-bold">{cases.length} ACTIVE</span></div>
            <div>LAST REFRESH: <span className="text-slate-400">{lastRefreshed}</span></div>
          </div>

          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-soc-panel hover:bg-soc-hover border border-slate-800/60 text-slate-300 hover:text-cyan-300 text-xs font-mono transition-colors shadow-soc-subtle disabled:opacity-50"
            title="Refresh incident queue, threat metrics, and telemetry"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
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
          onRefresh={handleManualRefresh}
          isRefreshing={isRefreshing}
          isLoading={isCasesLoading || deleteSingleMutation.isPending || deleteBatchMutation.isPending}
        />
      </div>
    </div>
  );
};
