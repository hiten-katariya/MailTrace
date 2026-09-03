import React from 'react';
import {
  Layers,
  ExternalLink,
  Network,
  AlertCircle,
  Hash,
  Globe,
  Server,
  FileCode,
  ArrowRight,
} from 'lucide-react';
import { CaseCorrelation } from '../../types/case';
import { EvidenceCard } from '../common/EvidenceCard';
import { CopyableText } from '../common/CopyableText';

interface CorrelationTabProps {
  correlation: CaseCorrelation;
  onSelectLinkedCase: (caseId: string) => void;
  onViewCampaign: (campaignId: string) => void;
}

export const CorrelationTab: React.FC<CorrelationTabProps> = ({
  correlation,
  onSelectLinkedCase,
  onViewCampaign,
}) => {
  return (
    <div className="space-y-4">
      {/* 0. Attribution Vector Assessment Card */}
      <EvidenceCard
        title="Probabilistic Infrastructure Attribution Assessment"
        subtitle="Rule-based origin vector classification derived from header authentication, domain age, and network telemetry"
        badge={
          <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
            correlation.attribution_type === 'anonymized_infrastructure'
              ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
              : correlation.attribution_type === 'spoofed_domain'
              ? 'bg-red-500/15 text-red-300 border border-red-500/30'
              : correlation.attribution_type === 'compromised_account'
              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
              : 'bg-slate-500/15 text-slate-300 border border-slate-500/30'
          }`}>
            {(correlation.attribution_type || 'unattributed').replace('_', ' ')}
          </span>
        }
      >
        <div className="p-3 rounded bg-soc-inset border border-slate-800/60 font-mono text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="text-[10px] text-soc-muted uppercase">Attribution Confidence</div>
            <div className="text-cyan-300 font-bold uppercase text-sm mt-0.5">
              {correlation.attribution_confidence || 'low'} Confidence
            </div>
          </div>
          <div className="text-left sm:text-right text-[11px] text-slate-300 max-w-md">
            Basis: <span className="text-slate-200">{correlation.shared_indicator || 'Isolated Investigation (No Cluster Match)'}</span>
          </div>
        </div>
      </EvidenceCard>

      {/* 1. Node-Link Infrastructure Relationship Hierarchy (Section 21) */}
      <EvidenceCard
        title="Infrastructure Correlation Hierarchy"
        subtitle="Forensic relationship mapping between case indicators, shared infrastructure, and campaign clusters"
      >
        <div className="p-3 rounded bg-soc-inset border border-slate-800/60 font-mono text-xs">
          <div className="flex items-center gap-2 text-cyan-300 font-bold mb-3 pb-2 border-b border-slate-800/60">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>CASE ROOT NODE (FORENSIC PIVOT)</span>
          </div>

          <div className="space-y-2.5 pl-4 border-l-2 border-slate-700/80 ml-2">
            {/* Domain Branch */}
            <div className="flex items-center gap-3 relative before:absolute before:-left-4 before:top-3 before:w-3 before:h-0.5 before:bg-slate-700">
              <div className="p-1 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                <Globe className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-[10px] text-soc-muted uppercase block">DOMAIN ENTITY</span>
                <span className="text-slate-200 font-semibold">microsoft-security-auth.net</span>
              </div>
            </div>

            {/* IP Branch */}
            <div className="flex items-center gap-3 relative before:absolute before:-left-4 before:top-3 before:w-3 before:h-0.5 before:bg-slate-700">
              <div className="p-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                <Server className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-[10px] text-soc-muted uppercase block">ORIGIN IP INFRASTRUCTURE</span>
                <span className="text-slate-200 font-semibold">185.220.101.5 (AS9009 Tor/Bulletproof)</span>
              </div>
            </div>

            {/* Hash Branch */}
            <div className="flex items-center gap-3 relative before:absolute before:-left-4 before:top-3 before:w-3 before:h-0.5 before:bg-slate-700">
              <div className="p-1 rounded bg-purple-500/10 text-purple-400 border border-purple-500/30">
                <Hash className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-[10px] text-soc-muted uppercase block">ATTACHMENT / PAYLOAD HASH</span>
                <span className="text-slate-300 font-mono text-[11px]">a94a8fe5ccb19ba61c4c087...</span>
              </div>
            </div>

            {/* Campaign Cluster Branch */}
            {correlation.campaign_id && (
              <div className="flex items-center justify-between p-2 rounded bg-cyan-500/5 border border-cyan-500/30 relative before:absolute before:-left-4 before:top-4 before:w-3 before:h-0.5 before:bg-cyan-500/60">
                <div className="flex items-center gap-2.5">
                  <div className="p-1 rounded bg-cyan-500/15 text-cyan-400 border border-cyan-500/40">
                    <Layers className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[9px] text-cyan-400 uppercase font-bold block">LINKED THREAT CAMPAIGN</span>
                    <span className="text-slate-100 font-bold">{correlation.campaign_id} ({correlation.shared_indicator})</span>
                  </div>
                </div>

                <button
                  onClick={() => onViewCampaign(correlation.campaign_id!)}
                  className="inline-flex items-center gap-1 text-[11px] font-mono text-cyan-400 hover:text-cyan-300"
                >
                  <span>Open Cluster</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      </EvidenceCard>

      {/* 2. Threat Intel Feed Matches */}
      <EvidenceCard
        title="Threat Intelligence Feed Corroboration"
        subtitle="Cross-referenced against AbuseIPDB, URLhaus, and open threat-intel feeds"
        badge={
          <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/25">
            {correlation.threat_intel_matches.length} HITS
          </span>
        }
      >
        {correlation.threat_intel_matches.length === 0 ? (
          <div className="p-3 text-center text-slate-400 font-mono text-xs">
            No active indicator matches found on external blocklists.
          </div>
        ) : (
          <div className="space-y-2">
            {correlation.threat_intel_matches.map((match, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded bg-soc-inset border border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs font-mono"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-soc-muted text-[11px]">Indicator:</span>
                    <CopyableText text={match.indicator} textClassName="text-cyan-300 font-bold" />
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Feed: <strong className="text-slate-200">{match.source}</strong>
                    {match.last_reported && ` • Last Reported: ${match.last_reported}`}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-soc-muted uppercase">Abuse Score:</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                    match.abuse_score >= 70
                      ? 'bg-red-500/15 text-red-300 border border-red-500/30'
                      : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                  }`}>
                    {match.abuse_score}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </EvidenceCard>

      {/* 3. Linked Cases in this Infrastructure Cluster */}
      {correlation.campaign_id && (
        <EvidenceCard
          title={`Correlated Incidents in Cluster ${correlation.campaign_id}`}
          subtitle="Other investigations sharing identical sending nodes or lookalike domains"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {correlation.linked_cases.map((linkedId) => (
              <div
                key={linkedId}
                onClick={() => onSelectLinkedCase(linkedId)}
                className="flex items-center justify-between p-2 rounded bg-soc-inset hover:bg-soc-hover border border-slate-800/60 hover:border-slate-700 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Hash className="w-3.5 h-3.5 text-slate-500" />
                  <span className="font-mono text-xs text-slate-200">
                    {linkedId.substring(0, 16)}...
                  </span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
              </div>
            ))}
          </div>
        </EvidenceCard>
      )}

      {/* Attribution Disclaimer */}
      <div className="p-2.5 rounded bg-soc-inset border border-slate-800/60 text-xs font-sans text-soc-text-dim flex items-start gap-2.5">
        <AlertCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-mono text-[10px] text-cyan-300 font-semibold uppercase block mb-0.2">
            Investigative Attribution Disclaimer
          </span>
          Attribution estimates reflect shared technical infrastructure, Autonomous Systems, and registrar clusters. MailTrace surfaces campaign linkage to assist investigations — not a confirmed legal identity of individual human actors.
        </div>
      </div>
    </div>
  );
};
