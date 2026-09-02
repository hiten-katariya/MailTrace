import React from 'react';
import {
  Layers,
  ShieldAlert,
  Link,
  ExternalLink,
  Network,
  Share2,
  AlertCircle,
  Hash,
} from 'lucide-react';
import { CaseCorrelation } from '../../types/case';
import { EvidenceCard } from '../common/EvidenceCard';
import { ConfidenceTag } from '../common/ConfidenceTag';
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
    <div className="space-y-6">
      {/* 1. Threat Intel Feed Matches */}
      <EvidenceCard
        title="Threat Intelligence Feed Corroboration"
        subtitle="Cross-referenced against AbuseIPDB, URLhaus, and open-source blocklists"
        badge={
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/30">
            {correlation.threat_intel_matches.length} FEED HITS
          </span>
        }
      >
        {correlation.threat_intel_matches.length === 0 ? (
          <div className="p-4 text-center text-slate-400 font-mono text-xs">
            No active indicator hits on public threat-intel blocklists.
          </div>
        ) : (
          <div className="space-y-2.5">
            {correlation.threat_intel_matches.map((match, idx) => (
              <div
                key={idx}
                className="p-3 rounded bg-soc-inset border border-soc-border flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs font-mono"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-soc-muted">Indicator:</span>
                    <CopyableText text={match.indicator} textClassName="text-cyan-300 font-bold" />
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Feed Source: <strong className="text-slate-200">{match.source}</strong>
                    {match.last_reported && ` • Last Reported: ${match.last_reported}`}
                  </div>
                  {match.categories && (
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {match.categories.map((cat, i) => (
                        <span key={i} className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                          {cat}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-soc-muted uppercase">Abuse Confidence:</span>
                  <span className={`px-2.5 py-1 rounded font-bold ${
                    match.abuse_score >= 70
                      ? 'bg-red-950 text-red-300 border border-red-500/40'
                      : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                  }`}>
                    {match.abuse_score}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </EvidenceCard>

      {/* 2. Campaign Cluster & Infrastructure Graph Linkage */}
      {correlation.campaign_id ? (
        <EvidenceCard
          title="Campaign Cluster & Infrastructure Linkage"
          subtitle="Graph adjacency correlation matching infrastructure across past incidents"
          headerAction={
            <button
              onClick={() => onViewCampaign(correlation.campaign_id!)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-medium transition-colors"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Open Campaign View</span>
            </button>
          }
        >
          <div className="space-y-4">
            {/* Shared Indicator Callout */}
            <div className="p-3 rounded bg-amber-950/20 border border-amber-500/30 flex items-start gap-3">
              <Network className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-[11px] font-mono text-amber-300 uppercase font-bold">
                  Shared Infrastructure Pivot Indicator
                </div>
                <div className="text-xs font-mono text-slate-200 mt-1 font-semibold">
                  {correlation.shared_indicator}
                </div>
                <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                  This case shares underlying hosting nodes, domain registrar patterns, or phishing kits with multiple cases in cluster <strong className="text-cyan-300 font-mono">{correlation.campaign_id}</strong>.
                </p>
              </div>
            </div>

            {/* Linked Cases List */}
            <div>
              <div className="text-[11px] font-mono text-soc-muted uppercase tracking-wider mb-2">
                Correlated Cases in this Infrastructure Cluster ({correlation.linked_cases.length})
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {correlation.linked_cases.map((linkedId) => (
                  <div
                    key={linkedId}
                    onClick={() => onSelectLinkedCase(linkedId)}
                    className="flex items-center justify-between p-2.5 rounded bg-soc-inset hover:bg-soc-hover border border-soc-border hover:border-slate-700 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Hash className="w-4 h-4 text-slate-500" />
                      <span className="font-mono text-xs text-slate-200">
                        {linkedId.substring(0, 18)}...
                      </span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                ))}
              </div>
            </div>

            {/* Attribution Honesty Note */}
            <div className="p-3 rounded bg-soc-inset border border-soc-border text-xs font-sans text-soc-text-dim flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-mono text-[11px] text-cyan-300 font-semibold uppercase block mb-0.5">
                  Investigative Attribution Disclaimer
                </span>
                Attribution estimates reflect shared technical infrastructure, Autonomous Systems, and registrar clusters. MailTrace surfaces campaign linkage to assist investigations — not a confirmed legal identity of individual human actors.
              </div>
            </div>
          </div>
        </EvidenceCard>
      ) : (
        <div className="p-8 text-center bg-soc-panel border border-soc-border rounded-md text-slate-400 font-mono text-xs">
          No campaign clusters identified for this standalone email.
        </div>
      )}
    </div>
  );
};
