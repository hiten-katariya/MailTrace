import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Terminal, ShieldAlert, CheckCircle2, Globe, FileCode, Radio } from 'lucide-react';
import { EvidenceCard } from '../common/EvidenceCard';
import { getAlerts } from '../../mocks/api';

interface ActivityEventItem {
  id: string;
  time: string;
  type: 'ingest' | 'spf_fail' | 'intel_match' | 'score_update' | 'alert';
  title: string;
  detail: string;
  caseId: string;
}

const FALLBACK_EVENTS: ActivityEventItem[] = [
  {
    id: 'evt-1',
    time: '14:22:14 UTC',
    type: 'alert',
    title: 'CRITICAL THREAT ALERT DISPATCHED',
    detail: 'High fraud index (94/100) triggered for M365 impersonation lure',
    caseId: 'c8f2a1e4',
  },
  {
    id: 'evt-2',
    time: '14:22:13 UTC',
    type: 'score_update',
    title: 'FUSION ENGINE SCORE UPDATED → 94',
    detail: 'Weighted signals computed from DMARC reject + 2-day domain age',
    caseId: 'c8f2a1e4',
  },
  {
    id: 'evt-3',
    time: '14:22:12 UTC',
    type: 'intel_match',
    title: 'THREAT INTEL REPUTATION HIT',
    detail: 'IP 185.220.101.5 matched AbuseIPDB Tor Exit list (88% confidence)',
    caseId: 'c8f2a1e4',
  },
];

interface LiveActivityStreamProps {
  onSelectCase?: (caseId: string) => void;
}

export const LiveActivityStream: React.FC<LiveActivityStreamProps> = ({ onSelectCase }) => {
  const { data: alertsData } = useQuery({
    queryKey: ['alerts'],
    queryFn: getAlerts,
    refetchInterval: 5000,
  });

  const alerts = alertsData?.alerts || [];
  const events: ActivityEventItem[] =
    alerts.length > 0
      ? alerts.map((a) => ({
          id: a.alert_id,
          time: new Date(a.triggered_at).toLocaleTimeString() + ' UTC',
          type: 'alert',
          title: `${a.risk_category.toUpperCase()} ALERT (SCORE: ${a.fraud_score})`,
          detail: `${a.subject} — Sender: ${a.sender}`,
          caseId: a.case_id,
        }))
      : FALLBACK_EVENTS;

  const getEventBadge = (type: string) => {
    switch (type) {
      case 'alert':
        return { icon: <ShieldAlert className="w-3.5 h-3.5 text-red-400" />, textClass: 'text-red-400' };
      case 'score_update':
        return { icon: <Radio className="w-3.5 h-3.5 text-cyan-400" />, textClass: 'text-cyan-300' };
      case 'intel_match':
        return { icon: <Globe className="w-3.5 h-3.5 text-amber-400" />, textClass: 'text-amber-400' };
      case 'spf_fail':
        return { icon: <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />, textClass: 'text-rose-400' };
      case 'ingest':
      default:
        return { icon: <FileCode className="w-3.5 h-3.5 text-slate-400" />, textClass: 'text-slate-300' };
    }
  };

  return (
    <EvidenceCard
      title="Live Sensor Telemetry Stream"
      subtitle="Real-time multi-signal parsing and threat detection events"
      badge={
        <div className="flex items-center gap-1.5 text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/25">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>STREAMING</span>
        </div>
      }
    >
      <div className="space-y-2">
        {events.map((event) => {
          const badge = getEventBadge(event.type);
          return (
            <div
              key={event.id}
              onClick={() => onSelectCase && onSelectCase(event.caseId)}
              className="flex items-start gap-3 p-2 rounded bg-soc-inset hover:bg-soc-hover border border-slate-800/40 hover:border-slate-700/60 transition-colors cursor-pointer text-xs font-mono group"
            >
              <span className="text-[10px] text-slate-500 shrink-0 mt-0.5">{event.time}</span>
              <div className="mt-0.5 shrink-0">{badge.icon}</div>
              <div className="flex-1 truncate">
                <div className={`text-[11px] font-bold ${badge.textClass} tracking-wide group-hover:underline flex items-center gap-2`}>
                  <span>{event.title}</span>
                  <span className="text-[9px] text-slate-500 font-normal">#{event.caseId}</span>
                </div>
                <div className="text-[10px] text-slate-400 font-sans truncate mt-0.5">
                  {event.detail}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </EvidenceCard>
  );
};
