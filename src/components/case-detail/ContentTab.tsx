import React from 'react';
import {
  MessageSquare,
  AlertTriangle,
  Link,
  ShieldAlert,
  ShieldCheck,
  ExternalLink,
  Flame,
  UserX,
  DollarSign,
} from 'lucide-react';
import { CaseContent } from '../../types/case';
import { EvidenceCard } from '../common/EvidenceCard';
import { RiskChip } from '../common/RiskChip';
import { CopyableText } from '../common/CopyableText';

interface ContentTabProps {
  content: CaseContent;
}

export const ContentTab: React.FC<ContentTabProps> = ({ content }) => {
  const isHighUrgency = (content.sentiment_urgency_score ?? 0) >= 70;

  return (
    <div className="space-y-6">
      {/* 1. NLP Model Classification Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* ML Label */}
        <EvidenceCard title="ML Model Classification">
          <div className="flex items-center gap-3">
            <RiskChip category={content.classification} size="md" />
            <div className="font-mono text-xs text-slate-300">
              Confidence:{' '}
              <strong className="text-cyan-300">
                {Math.round(content.classification_confidence * 100)}%
              </strong>
            </div>
          </div>
          <p className="text-[11px] text-soc-text-dim mt-2 font-sans">
            Evaluated via DistilBERT Phishing Classifier & TF-IDF heuristic matrix.
          </p>
        </EvidenceCard>

        {/* Urgency Pressure Meter */}
        <EvidenceCard title="Urgency & Pressure Index">
          <div className="flex items-center gap-2">
            <Flame className={`w-5 h-5 ${isHighUrgency ? 'text-red-400' : 'text-emerald-400'}`} />
            <span className="text-xl font-bold font-mono text-slate-100">
              {content.sentiment_urgency_score ?? 0}
            </span>
            <span className="text-xs font-mono text-soc-muted">/100</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
            <div
              className={`h-full ${isHighUrgency ? 'bg-red-500' : 'bg-emerald-500'}`}
              style={{ width: `${content.sentiment_urgency_score ?? 0}%` }}
            />
          </div>
          <p className="text-[11px] text-soc-text-dim mt-1.5 font-sans">
            {isHighUrgency ? 'High psychological coercion detected' : 'Standard conversational tone'}
          </p>
        </EvidenceCard>

        {/* Impersonated Entity */}
        <EvidenceCard title="Target Brand / Impersonation">
          <div className="flex items-center gap-2">
            <UserX className="w-5 h-5 text-amber-400" />
            <span className="font-semibold text-xs text-slate-200">
              {content.impersonation_target || 'No Known Executive or Brand Impersonation'}
            </span>
          </div>
          <p className="text-[11px] text-soc-text-dim mt-2 font-sans">
            Matched against recognized SaaS, financial, and internal C-suite identities.
          </p>
        </EvidenceCard>
      </div>

      {/* 2. Flagged Urgency & Social Engineering Phrases */}
      <EvidenceCard
        title="Detected Social Engineering & Urgency Phrases"
        subtitle="Natural language processing extracted phrases associated with coercion, urgency, and credential capture"
        badge={
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-950/60 text-red-300 border border-red-500/30">
            {content.flagged_phrases.length} PHRASES EXTRACTED
          </span>
        }
      >
        {content.flagged_phrases.length === 0 ? (
          <div className="p-4 text-center text-slate-400 font-mono text-xs">
            No coercive or deceptive language patterns detected.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {content.flagged_phrases.map((phrase, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-red-950/30 border border-red-500/40 text-red-200 text-xs font-mono font-medium shadow-soc-subtle"
              >
                <Flame className="w-3 h-3 text-red-400" />
                <span>"{phrase}"</span>
              </span>
            ))}
          </div>
        )}
      </EvidenceCard>

      {/* 3. BEC (Business Email Compromise) Indicators */}
      {content.bec_indicators.length > 0 && (
        <EvidenceCard
          title="Business Email Compromise (BEC) Specific Indicators"
          subtitle="Specific behavioral patterns indicating payment diversion, invoice fraud, or executive pretexting"
          badge={
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-950 text-rose-300 border border-rose-500/40">
              BEC PATTERNS ACTIVE
            </span>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {content.bec_indicators.map((indicator, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 p-2.5 rounded bg-rose-950/20 border border-rose-500/30 text-xs font-mono text-rose-200"
              >
                <DollarSign className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{indicator}</span>
              </div>
            ))}
          </div>
        </EvidenceCard>
      )}

      {/* 4. Extracted & Sandboxed URLs Table */}
      <EvidenceCard
        title="Embedded URLs & Sandboxed Redirect Resolution"
        subtitle="Inspection of embedded hyperlinks, shortened URLs, resolved destinations, and lookalike domain verification"
        badge={
          <span className="px-2 py-0.5 rounded text-[10px] font-mono text-cyan-300 bg-cyan-950 border border-cyan-500/30">
            {content.urls.length} HYPERLINKS ANALYZED
          </span>
        }
      >
        {content.urls.length === 0 ? (
          <div className="p-4 text-center text-slate-400 font-mono text-xs">
            No embedded links or URLs found in email body.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-soc-subtle border-b border-soc-border text-[11px] font-mono text-soc-text-dim uppercase tracking-wider">
                  <th className="py-2.5 px-3">Original Display Link</th>
                  <th className="py-2.5 px-3">Resolved Destination (Sandbox)</th>
                  <th className="py-2.5 px-3 w-48">Reputation / Finding</th>
                  <th className="py-2.5 px-3 w-24 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-soc-border/70 text-xs font-mono">
                {content.urls.map((urlItem, idx) => (
                  <tr key={idx} className="hover:bg-soc-hover/60 transition-colors">
                    {/* Original */}
                    <td className="py-3 px-3">
                      <div className="text-slate-300 break-all">{urlItem.original}</div>
                    </td>

                    {/* Resolved */}
                    <td className="py-3 px-3">
                      <div className="text-cyan-300 break-all font-semibold">
                        {urlItem.resolved}
                      </div>
                    </td>

                    {/* Reason */}
                    <td className="py-3 px-3">
                      <span className="text-slate-300 text-[11px] font-sans">
                        {urlItem.reason}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3 text-center">
                      {urlItem.flagged ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-300 border border-red-500/40">
                          MALICIOUS
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                          CLEAN
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </EvidenceCard>
    </div>
  );
};
