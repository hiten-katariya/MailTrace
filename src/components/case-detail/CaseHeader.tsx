import React from 'react';
import {
  ArrowLeft,
  FileText,
  Clock,
  User,
  Hash,
  Share2,
  AlertOctagon,
} from 'lucide-react';
import { CaseDetail } from '../../types/case';
import { ScoreBadge } from '../common/ScoreBadge';
import { ConfidenceTag } from '../common/ConfidenceTag';
import { CopyableText } from '../common/CopyableText';
import { RiskChip } from '../common/RiskChip';
import { formatUtcDateTime } from '../../lib/formatters';

interface CaseHeaderProps {
  caseDetail: CaseDetail;
  onBack: () => void;
  onOpenReport: () => void;
}

export const CaseHeader: React.FC<CaseHeaderProps> = ({
  caseDetail,
  onBack,
  onOpenReport,
}) => {
  return (
    <div className="bg-soc-panel border border-soc-border rounded-md shadow-soc-card p-5 mb-6">
      {/* Top action row */}
      <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-soc-border">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-cyan-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Case Triage List</span>
        </button>

        <div className="flex items-center gap-3">
          <RiskChip category={caseDetail.risk_category} />
          <ConfidenceTag confidence={caseDetail.confidence} />
          <button
            onClick={onOpenReport}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 hover:text-cyan-200 text-xs font-mono font-semibold transition-colors shadow-soc-subtle"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Generate Forensic PDF Report</span>
          </button>
        </div>
      </div>

      {/* Main Header Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left 8 cols: Subject, Sender, Hash metadata */}
        <div className="lg:col-span-8 space-y-3">
          <div>
            <div className="text-[11px] font-mono text-soc-muted uppercase tracking-wider mb-1">
              Investigated Case Subject
            </div>
            <h1 className="text-xl font-bold text-slate-100 tracking-tight leading-snug">
              {caseDetail.subject}
            </h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1 text-xs font-mono">
            {/* Sender */}
            <div className="flex items-center gap-2 p-2 rounded bg-soc-inset border border-soc-border">
              <User className="w-4 h-4 text-cyan-400 shrink-0" />
              <div className="truncate">
                <span className="text-slate-500 text-[10px] block uppercase">Header From / Sender</span>
                <span className="text-slate-200 truncate block font-medium">{caseDetail.sender}</span>
              </div>
            </div>

            {/* Ingest Timestamp */}
            <div className="flex items-center gap-2 p-2 rounded bg-soc-inset border border-soc-border">
              <Clock className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <span className="text-slate-500 text-[10px] block uppercase">Received & Timestamped</span>
                <span className="text-slate-200 block">{formatUtcDateTime(caseDetail.received_at)}</span>
              </div>
            </div>
          </div>

          {/* SHA-256 Raw Evidence Hash */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <span className="text-soc-muted font-mono text-[11px] flex items-center gap-1">
              <Hash className="w-3.5 h-3.5 text-slate-500" />
              Raw Message SHA-256:
            </span>
            <CopyableText
              text={caseDetail.file_hash}
              truncate
              startChars={12}
              endChars={12}
              textClassName="text-slate-300"
            />
            <span className="text-[10px] font-mono text-emerald-400/90 bg-emerald-950/40 px-1.5 py-0.2 rounded border border-emerald-500/30">
              IMMUTABLE EVIDENCE LOCK
            </span>
          </div>
        </div>

        {/* Right 4 cols: Large Score Gauge */}
        <div className="lg:col-span-4 flex flex-col justify-center">
          <ScoreBadge score={caseDetail.fraud_score} size="lg" />
        </div>
      </div>

      {/* Plain-English Explainable Verdict Summary Banner */}
      <div className="mt-4 p-3 rounded bg-soc-raised/90 border-l-4 border-l-cyan-400 border-r border-t border-b border-slate-800 flex items-start gap-3">
        <AlertOctagon className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
        <div>
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-cyan-300 block mb-0.5">
            Plain-English Forensic Verdict & Explainability Summary
          </span>
          <p className="text-xs text-slate-200 leading-relaxed font-sans">
            {caseDetail.verdict_summary}
          </p>
        </div>
      </div>
    </div>
  );
};
