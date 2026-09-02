import React from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { CaseDetail, CaseHeaders, CaseContent, CaseOrigin } from '../../types/case';
import { EvidenceCard } from '../common/EvidenceCard';
import { ProtocolBadge } from '../common/ProtocolBadge';
import { CopyableText } from '../common/CopyableText';

interface OverviewTabProps {
  caseDetail: CaseDetail;
  headers?: CaseHeaders;
  content?: CaseContent;
  origin?: CaseOrigin;
  onNavigateTab: (tabId: string) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  caseDetail,
  content,
  origin,
  onNavigateTab,
}) => {
  const totalWeight = caseDetail.score_breakdown.reduce((acc, s) => acc + s.weight, 0);
  const totalContribution = caseDetail.score_breakdown.reduce((acc, s) => acc + s.contribution, 0);

  const getModuleBadge = (module?: string) => {
    switch (module) {
      case 'header':
        return { label: 'HEADER PROTOCOL', tab: 'headers', bg: 'bg-blue-950/60 text-blue-300 border-blue-500/30' };
      case 'domain':
        return { label: 'DOMAIN INTEL', tab: 'origin', bg: 'bg-indigo-950/60 text-indigo-300 border-indigo-500/30' };
      case 'nlp':
        return { label: 'NLP / CONTENT', tab: 'content', bg: 'bg-purple-950/60 text-purple-300 border-purple-500/30' };
      case 'origin':
        return { label: 'ORIGIN IP / GEO', tab: 'origin', bg: 'bg-amber-950/60 text-amber-300 border-amber-500/30' };
      default:
        return { label: 'FORENSIC FUSION', tab: 'overview', bg: 'bg-slate-800 text-slate-300 border-slate-700' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Top 4 Quick Telemetry Indicators */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Card 1: Auth Status */}
        <div className="p-3 bg-soc-panel border border-soc-border rounded-md">
          <span className="text-[10px] font-mono text-soc-muted uppercase block mb-1">
            Authentication Triad
          </span>
          <div className="flex flex-wrap items-center gap-1.5 mt-1">
            <ProtocolBadge name="SPF" status={caseDetail.spf} size="sm" />
            <ProtocolBadge name="DKIM" status={caseDetail.dkim} size="sm" />
            <ProtocolBadge name="DMARC" status={caseDetail.dmarc} size="sm" />
          </div>
        </div>

        {/* Card 2: Originating Node */}
        <div className="p-3 bg-soc-panel border border-soc-border rounded-md">
          <span className="text-[10px] font-mono text-soc-muted uppercase block mb-1">
            Originating IP Node
          </span>
          <div className="mt-1">
            <CopyableText
              text={origin?.originating_ip || 'Extracting...'}
              textClassName="text-cyan-300 text-[11px]"
            />
          </div>
        </div>

        {/* Card 3: Domain Age */}
        <div className="p-3 bg-soc-panel border border-soc-border rounded-md">
          <span className="text-[10px] font-mono text-soc-muted uppercase block mb-1">
            Domain Age & Validity
          </span>
          <div className="mt-1 flex items-center gap-1.5 font-mono text-xs">
            <span className={`font-bold ${(origin?.domain_intel.domain_age_days ?? 999) < 7 ? 'text-red-400' : 'text-emerald-400'}`}>
              {origin?.domain_intel.domain_age_days !== undefined
                ? `${origin.domain_intel.domain_age_days} days old`
                : 'Verified Domain'}
            </span>
          </div>
        </div>

        {/* Card 4: NLP Threat Confidence */}
        <div className="p-3 bg-soc-panel border border-soc-border rounded-md">
          <span className="text-[10px] font-mono text-soc-muted uppercase block mb-1">
            NLP Model Confidence
          </span>
          <div className="mt-1 flex items-center gap-1.5 font-mono text-xs">
            <span className="font-bold text-slate-100">
              {content?.classification_confidence !== undefined
                ? `${Math.round(content.classification_confidence * 100)}% Match`
                : 'Evaluating...'}
            </span>
            <span className="text-[10px] text-slate-400 uppercase">
              ({content?.classification})
            </span>
          </div>
        </div>
      </div>

      {/* Main Signal Breakdown Checklist / Ledger */}
      <EvidenceCard
        title="Forensic Signal Fusion Ledger"
        subtitle="Explainable breakdown of weighted technical signals contributing to the composite fraud score"
        badge={
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
            {caseDetail.score_breakdown.length} ACTIVE SIGNALS
          </span>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-soc-subtle border-b border-soc-border text-[11px] font-mono text-soc-text-dim uppercase tracking-wider">
                <th className="py-2.5 px-3 w-10 text-center">#</th>
                <th className="py-2.5 px-3">Contributing Threat Signal & Findings</th>
                <th className="py-2.5 px-3 w-36">Source Module</th>
                <th className="py-2.5 px-3 w-28 text-center">Weight</th>
                <th className="py-2.5 px-3 w-32 text-center">Impact Score</th>
                <th className="py-2.5 px-3 w-28 text-right">Evidence Link</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-soc-border/70 text-xs">
              {caseDetail.score_breakdown.map((signal, idx) => {
                const mod = getModuleBadge(signal.sourceModule);
                const isHighImpact = signal.contribution >= 15;

                return (
                  <tr
                    key={idx}
                    className="hover:bg-soc-hover/60 transition-colors group"
                  >
                    {/* Index */}
                    <td className="py-3 px-3 text-center font-mono text-slate-500">
                      {idx + 1}
                    </td>

                    {/* Signal & Reason */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        {isHighImpact ? (
                          <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                        )}
                        <span className="font-semibold text-slate-100">
                          {signal.signal}
                        </span>
                      </div>
                      {signal.reason && (
                        <p className="text-[11px] text-slate-400 mt-1 pl-6 leading-relaxed font-sans">
                          {signal.reason}
                        </p>
                      )}
                    </td>

                    {/* Module */}
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium border ${mod.bg}`}>
                        {mod.label}
                      </span>
                    </td>

                    {/* Max Weight */}
                    <td className="py-3 px-3 text-center font-mono text-slate-400">
                      {signal.weight} pts
                    </td>

                    {/* Impact Contribution */}
                    <td className="py-3 px-3 text-center">
                      <span className={`font-mono font-bold px-2 py-0.5 rounded ${
                        signal.contribution >= 20
                          ? 'bg-red-950/60 text-red-300 border border-red-500/30'
                          : signal.contribution >= 10
                          ? 'bg-amber-950/50 text-amber-300 border border-amber-500/30'
                          : 'bg-slate-800 text-slate-300'
                      }`}>
                        +{signal.contribution} pts
                      </span>
                    </td>

                    {/* Evidence Link */}
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => onNavigateTab(mod.tab)}
                        className="inline-flex items-center gap-1 text-[11px] font-mono text-cyan-400 hover:text-cyan-300 hover:underline"
                      >
                        <span>Inspect</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Ledger Totals Footer */}
            <tfoot>
              <tr className="bg-soc-subtle/80 border-t-2 border-soc-border text-xs font-mono">
                <td colSpan={3} className="py-3 px-4 font-bold text-slate-300 uppercase tracking-wider">
                  Composite Signal Fusion Total
                </td>
                <td className="py-3 px-3 text-center text-slate-400 font-semibold">
                  Max: {totalWeight}
                </td>
                <td className="py-3 px-3 text-center font-bold text-cyan-300 text-sm">
                  {totalContribution} / 100
                </td>
                <td className="py-3 px-3 text-right text-[10px] text-slate-500">
                  Defensible Score
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </EvidenceCard>
    </div>
  );
};
