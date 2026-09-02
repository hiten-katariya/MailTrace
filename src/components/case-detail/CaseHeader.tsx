import React from 'react';
import {
  ArrowLeft,
  FileText,
  Clock,
  User,
  Hash,
  AlertOctagon,
  ShieldAlert,
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
  const shortId = caseDetail.case_id.substring(0, 8).toUpperCase();

  return (
    <div className="bg-soc-panel border border-slate-800/60 rounded shadow-soc-card p-4 space-y-4">
      {/* 1. Top Action & Navigation Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/40">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-cyan-300 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>← Incident Queue</span>
        </button>

        <div className="flex items-center gap-2">
          <RiskChip category={caseDetail.risk_category} />
          <ConfidenceTag confidence={caseDetail.confidence} />
          <button
            onClick={onOpenReport}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-semibold transition-colors shadow-soc-subtle"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Forensic PDF Report</span>
          </button>
        </div>
      </div>

      {/* 2. Main Case Identification & Score Module */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
        {/* Left 8 cols: Subject, Sender, Hash metadata */}
        <div className="lg:col-span-8 space-y-2.5">
          <div className="flex items-center gap-2 font-mono text-[11px] text-soc-muted uppercase tracking-wider">
            <span className="text-cyan-400 font-bold">CASE #{shortId}</span>
            <span>•</span>
            <span>INVESTIGATION DOSSIER</span>
          </div>

          <h1 className="text-base sm:text-lg font-bold text-slate-100 tracking-tight leading-snug">
            {caseDetail.subject}
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono">
            {/* Sender */}
            <div className="flex items-center gap-2 p-2 rounded bg-soc-inset border border-slate-800/50">
              <User className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <div className="truncate">
                <span className="text-[9px] text-slate-500 uppercase block">Sender Envelope</span>
                <span className="text-slate-200 truncate block font-medium text-[11px]">{caseDetail.sender}</span>
              </div>
            </div>

            {/* Ingestion Time */}
            <div className="flex items-center gap-2 p-2 rounded bg-soc-inset border border-slate-800/50">
              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <div>
                <span className="text-[9px] text-slate-500 uppercase block">Timestamped</span>
                <span className="text-slate-200 block text-[11px]">{formatUtcDateTime(caseDetail.received_at)}</span>
              </div>
            </div>
          </div>

          {/* SHA-256 Raw Evidence Hash */}
          <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs font-mono">
            <span className="text-[10px] text-soc-muted flex items-center gap-1 uppercase">
              <Hash className="w-3 h-3 text-slate-500" />
              Evidence SHA-256:
            </span>
            <CopyableText
              text={caseDetail.file_hash}
              truncate
              startChars={12}
              endChars={12}
              textClassName="text-slate-300"
            />
            <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/25">
              IMMUTABLE EVIDENCE LOCK
            </span>
          </div>
        </div>

        {/* Right 4 cols: Large Score Gauge */}
        <div className="lg:col-span-4 flex flex-col justify-center">
          <ScoreBadge score={caseDetail.fraud_score} size="lg" />
        </div>
      </div>

      {/* 3. Plain-English Explainable Verdict Summary Banner */}
      <div className="p-3 rounded bg-soc-inset border-l-2 border-l-cyan-400 border border-slate-800/60 flex items-start gap-2.5">
        <AlertOctagon className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-300 block mb-0.5">
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
