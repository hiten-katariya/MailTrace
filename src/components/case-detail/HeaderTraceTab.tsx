import React from 'react';
import { AlertTriangle, Server, Network } from 'lucide-react';
import { CaseHeaders } from '../../types/case';
import { EvidenceCard } from '../common/EvidenceCard';
import { RelayHopNode } from '../common/RelayHopNode';
import { ProtocolBadge } from '../common/ProtocolBadge';

interface HeaderTraceTabProps {
  headers: CaseHeaders;
}

export const HeaderTraceTab: React.FC<HeaderTraceTabProps> = ({ headers }) => {
  return (
    <div className="space-y-4">
      {/* 1. Protocol Authentication Posture Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* SPF Details */}
        <EvidenceCard
          title="SPF Validation"
          badge={<ProtocolBadge name="SPF" status={headers.spf.result} size="sm" />}
        >
          <div className="space-y-2 text-xs font-mono">
            <div>
              <span className="text-[9px] text-soc-muted uppercase block">Published SPF TXT Record</span>
              <div className="p-2 rounded bg-soc-inset border border-slate-800/60 text-slate-300 text-[11px] break-all">
                {headers.spf.record}
              </div>
            </div>
            {headers.spf.sender_ip && (
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-soc-muted uppercase">Evaluated IP:</span>
                <span className="text-cyan-300">{headers.spf.sender_ip}</span>
              </div>
            )}
          </div>
        </EvidenceCard>

        {/* DKIM Details */}
        <EvidenceCard
          title="DKIM Signature"
          badge={<ProtocolBadge name="DKIM" status={headers.dkim.result} size="sm" />}
        >
          <div className="space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-soc-muted uppercase">Signing Domain:</span>
              <span className="text-slate-200 font-semibold">{headers.dkim.domain}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-soc-muted uppercase">DKIM Selector:</span>
              <span className="text-cyan-300">{headers.dkim.selector || 'default'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-soc-muted uppercase">Cryptographic Signature:</span>
              <span className={headers.dkim.signature_present ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                {headers.dkim.signature_present ? 'VALID RSA/ED25519' : 'MISSING'}
              </span>
            </div>
          </div>
        </EvidenceCard>

        {/* DMARC Details */}
        <EvidenceCard
          title="DMARC Policy & Alignment"
          badge={<ProtocolBadge name="DMARC" status={headers.dmarc.result} size="sm" />}
        >
          <div className="space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-soc-muted uppercase">Enforced Policy:</span>
              <span className="px-1.5 py-0.2 rounded bg-soc-inset text-amber-300 uppercase font-bold border border-slate-700/60 text-[10px]">
                p={headers.dmarc.policy}
              </span>
            </div>
            {headers.dmarc.disposition && (
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-soc-muted uppercase">MTA Disposition:</span>
                <span className="text-red-400 uppercase font-bold">{headers.dmarc.disposition}</span>
              </div>
            )}
            <div className="text-[10px] text-slate-400 font-sans mt-1">
              Alignment verification against RFC 7489 specification.
            </div>
          </div>
        </EvidenceCard>
      </div>

      {/* 2. Header Anomalies Detection */}
      {headers.anomalies.length > 0 && (
        <EvidenceCard
          title="Protocol & Header Anomalies Detected"
          subtitle="Heuristic checks for domain forgery, mismatched identifiers, and relay delays"
          badge={
            <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/25">
              {headers.anomalies.length} FLAGS DETECTED
            </span>
          }
        >
          <div className="space-y-1.5">
            {headers.anomalies.map((anomaly, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 p-2 rounded bg-amber-500/5 border border-amber-500/20 text-xs"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span className="font-mono text-amber-200 text-[11px]">{anomaly}</span>
              </div>
            ))}
          </div>
        </EvidenceCard>
      )}

      {/* 3. Reconstructed Relay Chain Timeline */}
      <EvidenceCard
        title="SMTP Received Relay Chain Reconstruction"
        subtitle="Chronological sequence of mail transfer agents (MTAs) traversed from origin to destination gateway"
        badge={
          <span className="px-2 py-0.5 rounded text-[9px] font-mono text-cyan-300 bg-cyan-500/10 border border-cyan-500/25">
            {headers.relay_chain.length} HOPS IN SEQUENCE
          </span>
        }
      >
        <div className="space-y-2 p-1">
          {headers.relay_chain.map((hop, idx) => (
            <RelayHopNode
              key={hop.hop}
              hop={hop}
              isLast={idx === headers.relay_chain.length - 1}
              isEarliestOrigin={idx === 0}
            />
          ))}
        </div>
      </EvidenceCard>
    </div>
  );
};
