import React from 'react';
import {
  Server,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Terminal,
  Activity,
  ArrowDown,
} from 'lucide-react';
import { CaseHeaders } from '../../types/case';
import { EvidenceCard } from '../common/EvidenceCard';
import { RelayHopNode } from '../common/RelayHopNode';
import { ProtocolBadge } from '../common/ProtocolBadge';
import { CopyableText } from '../common/CopyableText';

interface HeaderTraceTabProps {
  headers: CaseHeaders;
}

export const HeaderTraceTab: React.FC<HeaderTraceTabProps> = ({ headers }) => {
  return (
    <div className="space-y-6">
      {/* 1. Protocol Authentication Posture Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* SPF Details */}
        <EvidenceCard
          title="SPF (Sender Policy Framework)"
          badge={<ProtocolBadge name="SPF" status={headers.spf.result} size="sm" />}
        >
          <div className="space-y-2 text-xs font-mono">
            <div>
              <span className="text-[10px] text-soc-muted uppercase block">DNS TXT SPF Record</span>
              <div className="p-2 rounded bg-soc-inset border border-soc-border text-slate-300 text-[11px] break-all">
                {headers.spf.record}
              </div>
            </div>
            {headers.spf.sender_ip && (
              <div>
                <span className="text-[10px] text-soc-muted uppercase block">Evaluated IP</span>
                <span className="text-cyan-300">{headers.spf.sender_ip}</span>
              </div>
            )}
          </div>
        </EvidenceCard>

        {/* DKIM Details */}
        <EvidenceCard
          title="DKIM (DomainKeys Identified Mail)"
          badge={<ProtocolBadge name="DKIM" status={headers.dkim.result} size="sm" />}
        >
          <div className="space-y-2 text-xs font-mono">
            <div>
              <span className="text-[10px] text-soc-muted uppercase block">Signing Domain</span>
              <span className="text-slate-200 font-semibold">{headers.dkim.domain}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-soc-muted uppercase">DKIM Selector:</span>
              <span className="text-cyan-300">{headers.dkim.selector || 'default'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-soc-muted uppercase">Signature Present:</span>
              <span className={headers.dkim.signature_present ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                {headers.dkim.signature_present ? 'VALID RSA/ED25519' : 'MISSING / CORRUPT'}
              </span>
            </div>
          </div>
        </EvidenceCard>

        {/* DMARC Details */}
        <EvidenceCard
          title="DMARC (Domain Alignment & Policy)"
          badge={<ProtocolBadge name="DMARC" status={headers.dmarc.result} size="sm" />}
        >
          <div className="space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-soc-muted uppercase">Published Policy:</span>
              <span className="px-2 py-0.5 rounded bg-soc-inset text-amber-300 uppercase font-bold border border-slate-700">
                p={headers.dmarc.policy}
              </span>
            </div>
            {headers.dmarc.disposition && (
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-soc-muted uppercase">MTA Disposition:</span>
                <span className="text-red-400 uppercase font-bold">{headers.dmarc.disposition}</span>
              </div>
            )}
            <div className="text-[11px] text-slate-400 font-sans mt-1">
              Alignment required between Header From and SPF/DKIM authenticated domain.
            </div>
          </div>
        </EvidenceCard>
      </div>

      {/* 2. Header Anomalies Detection Checklist */}
      {headers.anomalies.length > 0 && (
        <EvidenceCard
          title="Protocol & Header Anomalies Detected"
          subtitle="Rule-based heuristic checks for domain forgery, mismatched identifiers, and relay delays"
          badge={
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950/60 text-amber-300 border border-amber-500/30">
              {headers.anomalies.length} FLAGS DETECTED
            </span>
          }
        >
          <div className="space-y-2">
            {headers.anomalies.map((anomaly, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 p-2.5 rounded bg-amber-950/20 border border-amber-500/30 text-xs"
              >
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span className="font-mono text-amber-200">{anomaly}</span>
              </div>
            ))}
          </div>
        </EvidenceCard>
      )}

      {/* 3. Visual Relay Chain Reconstruction */}
      <EvidenceCard
        title="SMTP Received Relay Chain Reconstruction"
        subtitle="Chronological sequence of mail transfer agents (MTAs) traversed from origin to destination gateway"
        badge={
          <span className="px-2 py-0.5 rounded text-[10px] font-mono text-cyan-300 bg-cyan-950 border border-cyan-500/30">
            {headers.relay_chain.length} HOPS IN SEQUENCE
          </span>
        }
      >
        <div className="space-y-2 p-1">
          {headers.relay_chain.map((hop, idx) => (
            <RelayHopNode
              key={hop.hop}
              hop={hop}
              isFirst={idx === 0}
              isLast={idx === headers.relay_chain.length - 1}
              isEarliestOrigin={idx === 0}
            />
          ))}
        </div>
      </EvidenceCard>
    </div>
  );
};
