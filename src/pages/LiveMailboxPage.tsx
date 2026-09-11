import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Mail,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Shield,
  ExternalLink,
  Trash2,
  Clock,
  Radio,
  Filter,
  Inbox,
  Lock,
  ArrowRight,
} from 'lucide-react';
import {
  getCases,
  getGmailStatus,
  getGmailAuthUrl,
  disconnectGmail,
  getLiveStreamUrl,
  getRetentionSettings,
  updateRetentionSettings,
} from '../mocks/api';
import { CaseSummary, RiskCategory } from '../types/case';
import { ScoreBadge } from '../components/common/ScoreBadge';
import { RiskChip } from '../components/common/RiskChip';
import { ConfidenceTag } from '../components/common/ConfidenceTag';
import { EvidenceCard } from '../components/common/EvidenceCard';
import { useNavigate } from 'react-router-dom';

interface LiveMailboxPageProps {
  onSelectCase?: (caseId: string) => void;
  onNavigateToSettings?: () => void;
}

export const LiveMailboxPage: React.FC<LiveMailboxPageProps> = ({
  onSelectCase,
  onNavigateToSettings,
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // 1. Single Shared Coarse Clock for all message timestamps (updates every 5s)
  const [sharedNow, setSharedNow] = useState<number>(Date.now());
  useEffect(() => {
    const timer = setInterval(() => {
      setSharedNow(Date.now());
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // UI States
  const [filterType, setFilterType] = useState<'all' | 'high_risk' | 'flagged'>('all');
  const [isConnecting, setIsConnecting] = useState(false);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [highlightedCaseId, setHighlightedCaseId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 4500);
  };

  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  // Queries
  const {
    data: gmailStatus,
    isLoading: isStatusLoading,
    isRefetching: isStatusRefetching,
    refetch: refetchStatus,
  } = useQuery({
    queryKey: ['gmailStatus'],
    queryFn: getGmailStatus,
    refetchInterval: 10000,
  });

  const {
    data: casesData,
    isLoading: isCasesLoading,
    isRefetching: isCasesRefetching,
    refetch: refetchCases,
  } = useQuery({
    queryKey: ['gmailCases'],
    queryFn: () => getCases({ source: 'gmail', limit: 100 }),
  });

  const isRefreshing = isManualRefreshing || isCasesRefetching || isStatusRefetching;

  const handleManualRefresh = async () => {
    setIsManualRefreshing(true);
    try {
      await Promise.all([
        refetchCases(),
        refetchStatus(),
        queryClient.invalidateQueries({ queryKey: ['settings-retention'] }),
      ]);
      setSharedNow(Date.now());
      showToast('Live Gmail feed and status updated');
    } catch (err: any) {
      showToast(`Refresh error: ${err.message || 'Failed'}`);
    } finally {
      setIsManualRefreshing(false);
    }
  };

  const { data: retentionSettings } = useQuery({
    queryKey: ['settings-retention'],
    queryFn: getRetentionSettings,
  });

  const retentionDays = retentionSettings?.retention_days || 90;
  const autoTrashEnabled = retentionSettings?.auto_trash_on_purge ?? false;

  // Mutation: Update Auto-Trash Setting
  const updateRetentionMutation = useMutation({
    mutationFn: updateRetentionSettings,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['settings-retention'] });
      showToast(
        data.auto_trash_on_purge
          ? 'Gmail auto-trash on purge enabled with 30-day Google Trash retention'
          : 'Gmail auto-trash disabled; live inbox messages will not be touched on purge'
      );
    },
    onError: (err: any) => {
      showToast(`Failed to update retention setting: ${err.message || 'Error'}`);
    },
  });

  // Mutation: Disconnect Gmail
  const disconnectMutation = useMutation({
    mutationFn: disconnectGmail,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gmailStatus'] });
      queryClient.invalidateQueries({ queryKey: ['gmailCases'] });
      setShowDisconnectModal(false);
      showToast('Gmail account disconnected and background polling halted.');
    },
    onError: (err: any) => {
      showToast(`Disconnect failed: ${err.message || 'Error'}`);
    },
  });

  // Real-time SSE Live Event Stream
  useEffect(() => {
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource(getLiveStreamUrl());

      eventSource.addEventListener('case_completed', (e: MessageEvent) => {
        try {
          const payload = JSON.parse(e.data);
          if (payload.source === 'gmail' || !payload.source) {
            queryClient.invalidateQueries({ queryKey: ['gmailCases'] });
            queryClient.invalidateQueries({ queryKey: ['gmailStatus'] });
            if (payload.case_id) {
              setHighlightedCaseId(payload.case_id);
              setTimeout(() => setHighlightedCaseId(null), 3000);
            }
            showToast(`New Gmail Scan: "${payload.subject || payload.case_id}" (${payload.risk_category?.toUpperCase() || 'EVALUATED'})`);
          }
        } catch (err) {
          console.error('Failed to parse SSE event in LiveMailbox:', err);
        }
      });
    } catch (e) {
      console.warn('Could not establish SSE connection for LiveMailbox:', e);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [queryClient]);

  // Initiate Connect Gmail Flow
  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      const { auth_url } = await getGmailAuthUrl();
      window.location.href = auth_url;
    } catch (err: any) {
      setIsConnecting(false);
      showToast(`OAuth initialization error: ${err.message || 'Failed to start flow'}`);
    }
  };

  const isConnected = gmailStatus?.connected === true && gmailStatus.status === 'active';
  const needsReauth = gmailStatus?.status === 'needs_reauth';
  const connectedEmail = gmailStatus?.email || 'Connected Account';

  // Format relative timestamp using single sharedNow
  const formatTimeSince = (dateStr: string) => {
    if (!dateStr) return 'just now';
    const timestamp = new Date(dateStr).getTime();
    const diffSeconds = Math.max(0, Math.floor((sharedNow - timestamp) / 1000));

    if (diffSeconds < 15) return 'just now';
    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  // Filtered Gmail Cases
  const allGmailCases = casesData?.cases || [];
  const filteredCases = useMemo(() => {
    return allGmailCases.filter((c) => {
      if (filterType === 'high_risk') {
        return c.fraud_score >= 70 || c.risk_category === 'phishing' || c.risk_category === 'bec';
      }
      if (filterType === 'flagged') {
        return c.risk_category !== 'legitimate';
      }
      return true;
    });
  }, [allGmailCases, filterType]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 space-y-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded bg-slate-900/95 border border-cyan-500/40 text-cyan-200 text-xs font-mono shadow-xl backdrop-blur animate-fade-in">
          <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Disconnect Confirmation Modal */}
      {showDisconnectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-soc-panel border border-rose-500/40 rounded-lg p-5 shadow-2xl space-y-4 text-xs font-mono">
            <div className="flex items-center gap-2.5 text-rose-400 font-bold text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>DISCONNECT GMAIL SCANNER</span>
            </div>
            <p className="text-slate-300 font-sans text-xs leading-relaxed">
              This will immediately stop live background differential polling, revoke OAuth credentials, and unbind the monitored mailbox. You can reconnect at any time.
            </p>
            <div className="p-2.5 rounded bg-soc-inset border border-slate-800 text-[11px] text-slate-400">
              Account to disconnect: <span className="text-cyan-300 font-bold">{connectedEmail}</span>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowDisconnectModal(false)}
                className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={disconnectMutation.isPending}
                onClick={() => disconnectMutation.mutate()}
                className="px-3 py-1.5 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-bold transition-colors"
              >
                {disconnectMutation.isPending ? 'Disconnecting...' : 'Confirm Disconnect'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. HEADER AREA & TELEMETRY STRIP */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold font-mono text-slate-100 flex items-center gap-2">
              <Mail className="w-4 h-4 text-cyan-400" />
              <span>LIVE GMAIL THREAT MONITOR</span>
            </h1>
            <span className="px-1.5 py-0.5 text-[9px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 rounded font-semibold">
              REAL-TIME FEED
            </span>
          </div>
          <p className="text-xs text-soc-text-dim mt-0.5 font-sans">
            Continuous inbox monitoring and automated threat triage powered by MailTrace's multi-signal forensic pipeline.
          </p>
        </div>

        {/* Header Right Controls */}
        <div className="flex items-center gap-2.5">
          {/* Refresh Feed Button */}
          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-soc-panel hover:bg-soc-hover border border-slate-800 text-slate-300 hover:text-cyan-300 text-xs font-mono transition-colors shadow-soc-subtle disabled:opacity-50"
            title="Refresh live Gmail scan feed and mailbox status"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          {isConnected && (
            <>
              {/* Settings Drawer Button */}
              <button
                onClick={() => setShowSettingsDrawer(!showSettingsDrawer)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded border text-xs font-mono transition-colors ${
                  showSettingsDrawer
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400'
                    : 'bg-soc-panel hover:bg-soc-hover border-slate-800 text-slate-300'
                }`}
                title="Gmail Retention & Trash Controls"
              >
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                <span>Trash Policy</span>
                {autoTrashEnabled && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                )}
              </button>

              {/* Disconnect CTA */}
              <button
                onClick={() => setShowDisconnectModal(true)}
                className="px-2.5 py-1.5 rounded bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-mono transition-colors"
              >
                Disconnect
              </button>
            </>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. CONNECTION STATE BANNER */}
      {/* ========================================================================= */}
      {isConnected ? (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-lg bg-soc-panel border border-slate-800/80 text-xs font-mono">
          <div className="flex items-center gap-3">
            {/* Status Pill */}
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping-slow" />
              <span>CONNECTED</span>
            </div>

            {/* Account Email */}
            <div className="flex items-center gap-1 text-slate-300">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-bold text-slate-100">{connectedEmail}</span>
            </div>

            <span className="text-slate-700 hidden sm:inline">|</span>

            {/* Real Polling Active Indicator */}
            <div className="flex items-center gap-1.5 text-cyan-300 text-[11px]">
              <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>Polling every 15s (Differential History)</span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span>
              Last sync:{' '}
              <span className="text-slate-200">
                {gmailStatus?.last_polled_at
                  ? formatTimeSince(gmailStatus.last_polled_at)
                  : 'monitoring active'}
              </span>
            </span>
          </div>
        </div>
      ) : needsReauth ? (
        <div className="flex items-center justify-between p-4 rounded-lg bg-amber-500/10 border border-amber-500/40 text-xs font-mono">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <div className="font-bold text-amber-300">GMAIL AUTHORIZATION EXPIRED OR REVOKED</div>
              <div className="text-[11px] text-amber-200/80 font-sans mt-0.5">
                The OAuth grant for <span className="font-mono text-amber-100 font-bold">{connectedEmail}</span> has expired or was revoked. Reconnect to resume live mailbox scanning.
              </div>
            </div>
          </div>
          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="px-3.5 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-colors shrink-0"
          >
            {isConnecting ? 'Connecting...' : 'Reconnect Gmail'}
          </button>
        </div>
      ) : (
        /* ========================================================================= */
        /* 3. PRE-CONNECT SCREEN (EXPLICIT SCOPE & TRASH DISCLOSURE) */
        /* ========================================================================= */
        <EvidenceCard
          title="Connect Gmail for Continuous Threat Inspection"
          subtitle="Real-time SOC stream for incoming corporate and personal email accounts"
          badge={
            <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/60">
              <Lock className="w-3 h-3 text-cyan-400" />
              <span>OAUTH 2.0 VERIFIED</span>
            </div>
          }
        >
          <div className="space-y-4 py-2 font-sans">
            <p className="text-sm text-slate-200 leading-relaxed font-normal">
              Connect your Google Workspace or Gmail account to continuously scan incoming emails in real-time using MailTrace's multi-signal forensic pipeline.
            </p>

            {/* Verbatim Scope & Trash Disclosure Box */}
            <div className="p-3.5 rounded-lg bg-soc-inset border border-slate-800 text-xs space-y-2">
              <div className="flex items-center gap-2 text-cyan-300 font-mono text-[11px] font-semibold">
                <Shield className="w-4 h-4 text-cyan-400" />
                <span>Scope & Security Disclosure (gmail.readonly)</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Connecting your Gmail account grants MailTrace strictly read-only access (
                <code className="px-1 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono text-[10px]">
                  https://www.googleapis.com/auth/gmail.readonly
                </code>
                ) to inspect incoming messages and run real-time threat forensics. MailTrace operates with zero write or delete permissions and can never modify, send, compose, or delete any messages in your inbox.
              </p>
            </div>

            {/* Three key benefits */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
              <div className="p-3 rounded bg-soc-inset/50 border border-slate-800/60 space-y-1">
                <span className="text-cyan-400 font-bold block">15-Second Polling</span>
                <span className="text-slate-400 text-[11px] font-sans block">
                  Differential sync tracks new arrivals without backfilling old mail.
                </span>
              </div>
              <div className="p-3 rounded bg-soc-inset/50 border border-slate-800/60 space-y-1">
                <span className="text-emerald-400 font-bold block">Live Push Alerts</span>
                <span className="text-slate-400 text-[11px] font-sans block">
                  Evaluated cases appear instantly on this feed via Server-Sent Events.
                </span>
              </div>
              <div className="p-3 rounded bg-soc-inset/50 border border-slate-800/60 space-y-1">
                <span className="text-amber-400 font-bold block">Zero-Secret Browser</span>
                <span className="text-slate-400 text-[11px] font-sans block">
                  Tokens encrypted with Fernet at rest; secrets never touch the browser.
                </span>
              </div>
            </div>

            {/* Connect CTA Button */}
            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={handleConnect}
                disabled={isConnecting}
                className="flex items-center gap-2 px-5 py-2.5 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-bold text-xs transition-all shadow-lg shadow-cyan-500/20 active:scale-95"
              >
                <Mail className="w-4 h-4" />
                <span>{isConnecting ? 'Redirecting to Google...' : 'Connect Gmail Account'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] text-slate-400 font-mono">
                Redirects to official Google consent screen
              </span>
            </div>
          </div>
        </EvidenceCard>
      )}

      {/* ========================================================================= */}
      {/* 4. INLINE GMAIL RETENTION & TRASH SETTINGS DRAWER */}
      {/* ========================================================================= */}
      {isConnected && showSettingsDrawer && (
        <div className="p-4 rounded-lg bg-soc-panel border border-cyan-500/30 text-xs font-mono space-y-3 animate-fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2 text-cyan-300 font-bold">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>GMAIL RETENTION & INBOX TRASH SETTINGS</span>
            </div>
            <div className="text-[11px] text-slate-400 font-sans">
              Configured Retention: <span className="text-cyan-300 font-bold font-mono">{retentionDays} Days</span>
            </div>
          </div>

          <div className="p-3 rounded bg-soc-inset border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-200 font-semibold block">Move Expired Mail to Gmail Trash</span>
                  <span className="px-1.5 py-0.2 text-[9px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/30 rounded">
                    Default: OFF
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-sans block mt-0.5">
                  Mirrors local raw file deletion by moving messages to Gmail Trash during scheduled purge
                </span>
              </div>
              <input
                type="checkbox"
                checked={autoTrashEnabled}
                onChange={(e) =>
                  updateRetentionMutation.mutate({
                    auto_trash_on_purge: e.target.checked,
                  })
                }
                className="w-4 h-4 accent-cyan-400 cursor-pointer"
              />
            </div>

            {/* Mandatory plain language disclosure notice */}
            <div className="p-2.5 rounded bg-amber-500/10 border border-amber-500/30 text-[11px] font-sans text-amber-200/90 leading-relaxed">
              <span className="font-semibold text-amber-300 font-mono text-[10px] block mb-0.5 uppercase tracking-wider">
                Plain Language Retention Notice:
              </span>
              Emails older than {retentionDays} days from connected Gmail accounts will be moved to Gmail Trash. This can be undone from Gmail within its normal trash retention period.
            </div>
          </div>

          <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1 font-sans">
            <span>
              Retention threshold ({retentionDays} days) can be modified in the main Settings & Compliance page.
            </span>
            <button
              onClick={() => onNavigateToSettings ? onNavigateToSettings() : navigate('/settings')}
              className="text-cyan-400 hover:text-cyan-300 font-mono underline cursor-pointer"
            >
              Go to Compliance Settings →
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. LIVE MESSAGE STREAM & FILTER BAR */}
      {/* ========================================================================= */}
      {isConnected && (
        <div className="space-y-3">
          {/* Stream Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-2 rounded bg-soc-panel border border-slate-800/80 text-xs font-mono">
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-400 text-[11px]">TRIAGE FILTER:</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-2.5 py-1 rounded text-xs transition-colors ${
                    filterType === 'all'
                      ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  All ({allGmailCases.length})
                </button>
                <button
                  onClick={() => setFilterType('high_risk')}
                  className={`px-2.5 py-1 rounded text-xs transition-colors ${
                    filterType === 'high_risk'
                      ? 'bg-red-500/20 text-red-300 font-bold border border-red-500/40'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  High Risk Only
                </button>
                <button
                  onClick={() => setFilterType('flagged')}
                  className={`px-2.5 py-1 rounded text-xs transition-colors ${
                    filterType === 'flagged'
                      ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  Flagged (Threats)
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2.5 text-[11px] text-slate-400">
              <span>Showing {filteredCases.length} message(s)</span>
              <button
                type="button"
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 text-[11px] font-mono transition-colors disabled:opacity-50"
                title="Sync Gmail inbox feed now"
              >
                <RefreshCw className={`w-3 h-3 text-cyan-400 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Sync Now</span>
              </button>
            </div>
          </div>

          {/* Feed Container */}
          {filteredCases.length === 0 ? (
            /* Empty / Waiting State */
            <div className="p-8 rounded-lg bg-soc-panel border border-slate-800/80 text-center space-y-3">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Inbox className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1">
                <div className="text-slate-200 font-mono text-sm font-semibold">
                  Watching {connectedEmail} for new mail
                </div>
                <div className="text-slate-400 text-xs font-sans max-w-md mx-auto">
                  Scans typically appear within 15 seconds of arrival. Any incoming email will be ingested, scored across 5 forensic stages, and pushed to this view live.
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleManualRefresh}
                    disabled={isRefreshing}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-cyan-300 text-xs font-mono transition-colors disabled:opacity-50 border border-slate-700/60"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isRefreshing ? 'animate-spin' : ''}`} />
                    <span>{isRefreshing ? 'Checking...' : 'Check For New Mail'}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Live Cards List */
            <div className="space-y-2.5">
              {filteredCases.map((item) => {
                const isHighlighted = highlightedCaseId === item.case_id;
                const relativeScanTime = formatTimeSince(item.received_at);

                return (
                  <div
                    key={item.case_id}
                    onClick={() => (onSelectCase ? onSelectCase(item.case_id) : navigate(`/case/${item.case_id}`))}
                    className={`group relative p-3.5 rounded-lg bg-soc-panel hover:bg-soc-hover border transition-all cursor-pointer shadow-sm hover:shadow-md ${
                      isHighlighted
                        ? 'border-cyan-400 bg-cyan-950/20 ring-1 ring-cyan-400/50 scale-[1.005]'
                        : item.fraud_score >= 70
                        ? 'border-rose-900/40 hover:border-rose-700/60'
                        : 'border-slate-800/70 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {/* Left: Score Badge + Subject/Sender */}
                      <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                        {/* Score Visualization */}
                        <div className="shrink-0">
                          <ScoreBadge score={item.fraud_score} riskCategory={item.risk_category} size="sm" />
                        </div>

                        {/* Subject, Sender & Verdict */}
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-slate-100 text-xs sm:text-sm truncate group-hover:text-cyan-300 transition-colors font-sans">
                              {item.subject || '[No Subject]'}
                            </span>
                            <RiskChip category={item.risk_category} size="sm" />
                            <ConfidenceTag confidence="high" />
                          </div>

                          <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400 flex-wrap">
                            <span className="truncate text-slate-300">
                              From: <span className="text-slate-100">{item.sender}</span>
                            </span>
                            <span className="text-slate-700">|</span>
                            <span className="flex items-center gap-1 text-slate-400">
                              <Clock className="w-3 h-3 text-slate-500" />
                              <span>Scanned {relativeScanTime}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Authentication Status Indicators & View CTA */}
                      <div className="flex items-center gap-3 shrink-0 self-end sm:self-center font-mono text-[10px]">
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-soc-inset border border-slate-800 text-slate-300">
                          <span>SPF:</span>
                          <span
                            className={`font-bold uppercase ${
                              item.spf === 'pass'
                                ? 'text-emerald-400'
                                : item.spf === 'fail'
                                ? 'text-rose-400'
                                : 'text-slate-400'
                            }`}
                          >
                            {item.spf}
                          </span>
                          <span className="text-slate-600">/</span>
                          <span>DKIM:</span>
                          <span
                            className={`font-bold uppercase ${
                              item.dkim === 'pass'
                                ? 'text-emerald-400'
                                : item.dkim === 'fail'
                                ? 'text-rose-400'
                                : 'text-slate-400'
                            }`}
                          >
                            {item.dkim}
                          </span>
                        </div>

                        <span className="text-cyan-400 group-hover:translate-x-0.5 transition-transform text-xs flex items-center gap-1">
                          Inspect <ExternalLink className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
