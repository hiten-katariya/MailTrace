import React from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  Lock,
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
        return { label: 'HEADER PROTOCOL', tab: 'headers', bg: 'bg-blue-500/10 text-blue-300 border-blue-500/25' };
      case 'domain':
        return { label: 'DOMAIN INTEL', tab: 'origin', bg: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/25' };
      case 'nlp':
        return { label: 'NLP CONTENT', tab: 'content', bg: 'bg-purple-500/10 text-purple-300 border-purple-500/25' };
      case 'origin':
        return { label: 'ORIGIN IP/GEO', tab: 'origin', bg: 'bg-amber-500/10 text-amber-300 border-amber-500/25' };
      default:
        return { label: 'FUSION ENG', tab: 'overview', bg: 'bg-slate-800 text-slate-300 border-slate-700' };
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Quick Telemetry Module Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        {/* Module 1: Auth Status */}
        <div className="p-3 bg-soc-panel border border-slate-800/60 rounded">
          <span className="text-[9px] font-mono text-soc-muted uppercase tracking-wider block mb-1">
            Authentication Triad
          </span>
          <div className="flex flex-wrap items-center gap-1 mt-1">
            <ProtocolBadge name="SPF" status={caseDetail.spf} size="sm" />
            <ProtocolBadge name="DKIM" status={caseDetail.dkim} size="sm" />
            <ProtocolBadge name="DMARC" status={caseDetail.dmarc} size="sm" />
          </div>
        </div>

        {/* Module 2: Originating Node */}
        <div className="p-3 bg-soc-panel border border-slate-800/60 rounded">
          <span className="text-[9px] font-mono text-soc-muted uppercase tracking-wider block mb-1">
            Originating Node IP
          </span>
          <div className="mt-1">
            <CopyableText
              text={origin?.originating_ip || 'Extracting...'}
              textClassName="text-cyan-300 text-[11px]"
            />
          </div>
        </div>

        {/* Module 3: Domain Age */}
        <div className="p-3 bg-soc-panel border border-slate-800/60 rounded">
          <span className="text-[9px] font-mono text-soc-muted uppercase tracking-wider block mb-1">
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

        {/* Module 4: NLP Threat Match */}
        <div className="p-3 bg-soc-panel border border-slate-800/60 rounded">
          <span className="text-[9px] font-mono text-soc-muted uppercase tracking-wider block mb-1">
            NLP Model Match
          </span>
          <div className="mt-1 flex items-center gap-1.5 font-mono text-xs">
            <span className="font-bold text-slate-100">
              {content?.classification_confidence !== undefined
                ? `${Math.round(content.classification_confidence * 100)}% Match`
                : 'Evaluating...'}
            </span>
            <span className="text-[9px] text-slate-400 uppercase">
              ({content?.classification})
            </span>
          </div>
        </div>
      </div>

      {/* 2. Main Signal Breakdown Evidence Ledger (Section 18) */}
      <EvidenceCard
        title="Forensic Signal Fusion Ledger"
        subtitle="Every conclusion is explainable and traceable to underlying technical signals"
        badge={
          <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
            {caseDetail.score_breakdown.length} ACTIVE SIGNALS
          </span>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-soc-subtle border-b border-slate-800/60 text-[10px] font-mono text-soc-text-dim uppercase tracking-wider">
                <th className="py-2 px-3 w-8 text-center">#</th>
                <th className="py-2 px-3">Contributing Threat Signal & Findings</th>
                <th className="py-2 px-3 w-32">Module Source</th>
                <th className="py-2 px-3 w-20 text-center">Weight</th>
                <th className="py-2 px-3 w-28 text-center">Impact Score</th>
                <th className="py-2 px-3 w-24 text-right">Evidence</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/40 text-xs">
              {caseDetail.score_breakdown.map((signal, idx) => {
                const mod = getModuleBadge(signal.sourceModule);
                const isHighImpact = signal.contribution >= 15;

                return (
                  <tr
                    key={idx}
                    className="hover:bg-soc-hover/50 transition-colors group"
                  >
                    {/* Index */}
                    <td className="py-2.5 px-3 text-center font-mono text-slate-500 text-[11px]">
                      {idx + 1}
                    </td>

                    {/* Signal & Reason */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        {isHighImpact ? (
                          <ShieldAlert className="w-3.5 h-3.5 text-red-400 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        )}
                        <span className="font-semibold text-slate-100 text-xs">
                          {signal.signal}
                        </span>
                      </div>
                      {signal.reason && (
                        <p className="text-[11px] text-slate-400 mt-0.5 pl-5 leading-relaxed font-sans">
                          {signal.reason}
                        </p>
                      )}
                    </td>

                    {/* Module */}
                    <td className="py-2.5 px-3">
                      <span className={`inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-mono font-bold border ${mod.bg}`}>
                        {mod.label}
                      </span>
                    </td>

                    {/* Weight */}
                    <td className="py-2.5 px-3 text-center font-mono text-slate-400 text-xs">
                      {signal.weight} pts
                    </td>

                    {/* Impact Contribution */}
                    <td className="py-2.5 px-3 text-center">
                      <span className={`font-mono font-bold text-xs px-2 py-0.5 rounded ${
                        signal.contribution >= 20
                          ? 'bg-red-500/15 text-red-300 border border-red-500/30'
                          : signal.contribution >= 10
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          : 'bg-slate-800 text-slate-300'
                      }`}>
                        +{signal.contribution}
                      </span>
                    </td>

                    {/* Evidence Link */}
                    <td className="py-2.5 px-3 text-right">
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
              <tr className="bg-soc-subtle/80 border-t border-slate-800/80 text-xs font-mono">
                <td colSpan={3} className="py-2.5 px-3 font-bold text-slate-300 uppercase tracking-wider text-[11px]">
                  COMPOSITE SIGNAL FUSION TOTAL
                </td>
                <td className="py-2.5 px-3 text-center text-slate-400 text-xs">
                  Max: {totalWeight}
                </td>
                <td className="py-2.5 px-3 text-center font-bold text-cyan-300 text-xs">
                  {totalContribution} / 100
                </td>
                <td className="py-2.5 px-3 text-right text-[9px] text-slate-500 uppercase">
                  DEFENSIBLE
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </EvidenceCard>
    </div>
  );
};
