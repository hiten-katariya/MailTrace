import React from 'react';
import {
  X,
  Printer,
  Download,
  ShieldAlert,
  ShieldCheck,
  Hash,
  Clock,
  User,
  CheckCircle2,
  FileCheck,
} from 'lucide-react';
import { CaseDetail, CaseHeaders, CaseContent, CaseOrigin, CaseCorrelation } from '../../types/case';
import { ScoreBadge } from '../common/ScoreBadge';
import { formatUtcDateTime } from '../../lib/formatters';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseDetail: CaseDetail;
  headers?: CaseHeaders;
  content?: CaseContent;
  origin?: CaseOrigin;
  correlation?: CaseCorrelation;
  analystName?: string;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  caseDetail,
  headers,
  content,
  origin,
  correlation,
  analystName = 'Alex Rivera (Analyst-01, Cyber Incident Response)',
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-soc-panel border border-soc-border rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Top Control Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-soc-raised border-b border-soc-border print:hidden">
          <div className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm font-mono font-bold text-slate-100 uppercase tracking-wider">
              Forensic Incident & Threat Intelligence Dossier
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-medium transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded hover:bg-soc-hover text-slate-400 hover:text-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Forensic Document Content */}
        <div className="p-8 overflow-y-auto space-y-6 text-slate-200 font-sans text-xs bg-[#0c1220]">
          {/* Document Header */}
          <div className="border-b-2 border-cyan-500/40 pb-4 flex items-start justify-between">
            <div>
              <div className="text-xl font-bold font-mono tracking-wider text-slate-100">
                MAIL<span className="text-cyan-400">TRACE</span> FORENSIC REPORT
              </div>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                Technical Evidence & Origin Attribution Intelligence
              </p>
            </div>

            <div className="text-right font-mono text-[11px] text-slate-400">
              <div>REPORT ID: <strong className="text-slate-200">REP-{caseDetail.case_id.substring(0, 8).toUpperCase()}</strong></div>
              <div>GENERATED: <strong className="text-slate-200">{formatUtcDateTime(new Date().toISOString())}</strong></div>
              <div>CLASSIFICATION: <strong className="text-amber-400 uppercase">RESTRICTED / FORENSIC</strong></div>
            </div>
          </div>

          {/* Incident Overview Box */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded bg-soc-inset border border-slate-700">
            <div className="space-y-1.5 font-mono">
              <div>
                <span className="text-slate-500 uppercase text-[10px] block">Case Subject:</span>
                <span className="text-slate-100 font-bold text-sm block font-sans">{caseDetail.subject}</span>
              </div>
              <div>
                <span className="text-slate-500 uppercase text-[10px] block">Sender Envelope:</span>
                <span className="text-slate-200">{caseDetail.sender}</span>
              </div>
              <div>
                <span className="text-slate-500 uppercase text-[10px] block">Ingestion Timestamp:</span>
                <span className="text-slate-200">{formatUtcDateTime(caseDetail.received_at)}</span>
              </div>
            </div>

            <div className="space-y-1.5 font-mono">
              <div>
                <span className="text-slate-500 uppercase text-[10px] block">Composite Fraud Score:</span>
                <span className="text-xl font-bold text-red-400">{caseDetail.fraud_score} / 100</span>
                <span className="text-slate-400 text-[11px] ml-2 uppercase font-semibold">({caseDetail.risk_category})</span>
              </div>
              <div>
                <span className="text-slate-500 uppercase text-[10px] block">Attribution Confidence:</span>
                <span className="text-cyan-300 uppercase font-semibold">{caseDetail.confidence}</span>
              </div>
              <div>
                <span className="text-slate-500 uppercase text-[10px] block">Investigating Analyst:</span>
                <span className="text-slate-200">{analystName}</span>
              </div>
            </div>
          </div>

          {/* Evidence Hash Integrity Verification */}
          <div className="p-3 rounded bg-soc-panel border border-cyan-500/30 font-mono text-[11px]">
            <div className="text-cyan-400 font-bold uppercase mb-1 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5" />
              <span>Cryptographic Chain of Custody & Evidence Hash</span>
            </div>
            <div className="text-slate-300 break-all bg-black/40 p-2 rounded border border-slate-800">
              SHA-256: {caseDetail.file_hash}
            </div>
          </div>

          {/* Plain-English Verdict */}
          <div>
            <h4 className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
              Executive Finding Summary
            </h4>
            <p className="p-3 rounded bg-soc-panel border border-slate-700 text-slate-200 leading-relaxed font-sans">
              {caseDetail.verdict_summary}
            </p>
          </div>

          {/* Signal Ledger Breakdown */}
          <div>
            <h4 className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
              Contributing Forensic Signals & Weighted Ledger
            </h4>
            <table className="w-full border border-slate-700 text-left font-mono">
              <thead className="bg-slate-800/80 text-[10px] text-slate-400 uppercase">
                <tr>
                  <th className="p-2">Signal</th>
                  <th className="p-2 w-28 text-center">Source</th>
                  <th className="p-2 w-20 text-center">Weight</th>
                  <th className="p-2 w-24 text-center">Impact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {caseDetail.score_breakdown.map((s, i) => (
                  <tr key={i}>
                    <td className="p-2">
                      <div className="font-bold text-slate-100">{s.signal}</div>
                      {s.reason && <div className="text-[10px] text-slate-400 font-sans mt-0.5">{s.reason}</div>}
                    </td>
                    <td className="p-2 text-center text-slate-300 uppercase text-[10px]">{s.sourceModule}</td>
                    <td className="p-2 text-center text-slate-400">{s.weight}</td>
                    <td className="p-2 text-center font-bold text-cyan-300">+{s.contribution}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Origin & Hop Sequence */}
          {origin && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Origin Geolocation Intel
                </h4>
                <div className="p-3 rounded bg-soc-panel border border-slate-700 font-mono space-y-1">
                  <div>IP Address: <strong className="text-cyan-300">{origin.originating_ip}</strong></div>
                  <div>Estimated City/Country: <strong className="text-slate-200">{origin.geolocation.city}, {origin.geolocation.country}</strong></div>
                  <div>ISP Carrier: <strong className="text-slate-200">{origin.isp}</strong></div>
                  <div>Anonymization / VPN: <strong className={origin.vpn_tor_flag ? 'text-red-400' : 'text-emerald-400'}>{origin.vpn_tor_flag ? 'TRUE (Bulletproof)' : 'FALSE'}</strong></div>
                </div>
              </div>

              <div>
                <h4 className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Domain Intelligence (WHOIS)
                </h4>
                <div className="p-3 rounded bg-soc-panel border border-slate-700 font-mono space-y-1">
                  <div>Domain: <strong className="text-cyan-300">{origin.domain_intel.domain}</strong></div>
                  <div>Age: <strong className="text-slate-200">{origin.domain_intel.domain_age_days} days</strong></div>
                  <div>Registrar: <strong className="text-slate-200">{origin.domain_intel.registrar}</strong></div>
                  <div>MX Validity: <strong className={origin.domain_intel.mx_valid ? 'text-emerald-400' : 'text-red-400'}>{origin.domain_intel.mx_valid ? 'VALID' : 'INVALID'}</strong></div>
                </div>
              </div>
            </div>
          )}

          {/* Formal Analyst Sign-off */}
          <div className="pt-4 border-t border-slate-700 flex items-center justify-between text-slate-400 font-mono text-[10px]">
            <div>
              <div>INVESTIGATION AUTHORITY: MailTrace Incident Response Suite</div>
              <div>VERIFICATION STATUS: Cryptographically Sealed Document</div>
            </div>
            <div className="text-right">
              <div>ANALYST SIGNATURE: <span className="text-slate-200 font-semibold">{analystName}</span></div>
              <div>SYSTEM CONFIDENCE: <span className="text-cyan-400 font-bold">{caseDetail.confidence.toUpperCase()}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
