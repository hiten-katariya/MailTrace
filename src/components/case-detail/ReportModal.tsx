import React from 'react';
import {
  X,
  Printer,
  Hash,
  FileCheck,
  Shield,
  ShieldAlert,
} from 'lucide-react';
import { CaseDetail, CaseOrigin } from '../../types/case';
import { formatUtcDateTime } from '../../lib/formatters';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseDetail: CaseDetail;
  headers?: any;
  content?: any;
  origin?: CaseOrigin;
  correlation?: any;
  analystName?: string;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  caseDetail,
  origin,
  analystName = 'Alex Rivera (Analyst-01, Cyber Incident Response)',
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-soc-panel border border-slate-800/80 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Top Control Header */}
        <div className="flex items-center justify-between px-5 py-3 bg-soc-raised border-b border-slate-800/60 print:hidden">
          <div className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-cyan-400" />
            <h2 className="text-xs font-mono font-bold text-slate-100 uppercase tracking-wider">
              Forensic Incident & Threat Intelligence Dossier
            </h2>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-semibold transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-soc-hover text-slate-400 hover:text-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Forensic Document Content */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-5 text-slate-200 font-sans text-xs bg-[#080D16]">
          {/* Document Header */}
          <div className="border-b border-cyan-500/40 pb-4 flex items-start justify-between">
            <div>
              <div className="text-lg font-bold font-mono tracking-wider text-slate-100 flex items-center gap-2">
                <Shield className="w-5 h-5 text-cyan-400" />
                <span>MAIL<span className="text-cyan-400">TRACE</span> FORENSIC DOSSIER</span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                Technical Evidence & Origin Attribution Intelligence Platform
              </p>
            </div>

            <div className="text-right font-mono text-[10px] text-slate-400 space-y-0.5">
              <div>REPORT ID: <strong className="text-slate-200">REP-{caseDetail.case_id.substring(0, 8).toUpperCase()}</strong></div>
              <div>GENERATED: <strong className="text-slate-200">{formatUtcDateTime(new Date().toISOString())}</strong></div>
              <div>CLASSIFICATION: <strong className="text-amber-400 uppercase">RESTRICTED / FORENSIC</strong></div>
            </div>
          </div>

          {/* Incident Overview Box */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3.5 rounded bg-soc-inset border border-slate-800/60 font-mono">
            <div className="space-y-1">
              <div>
                <span className="text-slate-500 uppercase text-[9px] block">Case Subject:</span>
                <span className="text-slate-100 font-bold text-xs block font-sans">{caseDetail.subject}</span>
              </div>
              <div>
                <span className="text-slate-500 uppercase text-[9px] block">Sender Envelope:</span>
                <span className="text-slate-200 text-[11px]">{caseDetail.sender}</span>
              </div>
              <div>
                <span className="text-slate-500 uppercase text-[9px] block">Ingestion Timestamp:</span>
                <span className="text-slate-200 text-[11px]">{formatUtcDateTime(caseDetail.received_at)}</span>
              </div>
            </div>

            <div className="space-y-1">
              <div>
                <span className="text-slate-500 uppercase text-[9px] block">Composite Fraud Score:</span>
                <span className="text-lg font-bold text-red-400">{caseDetail.fraud_score} / 100</span>
                <span className="text-slate-400 text-[10px] ml-2 uppercase font-semibold">({caseDetail.risk_category})</span>
              </div>
              <div>
                <span className="text-slate-500 uppercase text-[9px] block">Attribution Confidence:</span>
                <span className="text-cyan-300 uppercase font-semibold text-[11px]">{caseDetail.confidence}</span>
              </div>
              <div>
                <span className="text-slate-500 uppercase text-[9px] block">Investigating Analyst:</span>
                <span className="text-slate-200 text-[11px]">{analystName}</span>
              </div>
            </div>
          </div>

          {/* Evidence Hash Integrity Verification */}
          <div className="p-2.5 rounded bg-soc-panel border border-cyan-500/25 font-mono text-[11px]">
            <div className="text-cyan-400 font-bold uppercase mb-1 flex items-center gap-1.5 text-[10px]">
              <Hash className="w-3 h-3" />
              <span>Cryptographic Chain of Custody & Evidence Hash</span>
            </div>
            <div className="text-slate-300 break-all bg-black/50 p-1.5 rounded border border-slate-800/60 text-[10px]">
              SHA-256: {caseDetail.file_hash}
            </div>
          </div>

          {/* Plain-English Verdict */}
          <div>
            <h4 className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-300 mb-1">
              Executive Finding Summary
            </h4>
            <p className="p-3 rounded bg-soc-panel border border-slate-800/60 text-slate-200 leading-relaxed font-sans text-xs">
              {caseDetail.verdict_summary}
            </p>
          </div>

          {/* Signal Ledger Breakdown */}
          <div>
            <h4 className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-300 mb-1">
              Contributing Forensic Signals & Weighted Ledger
            </h4>
            <table className="w-full border border-slate-800/60 text-left font-mono">
              <thead className="bg-slate-800/60 text-[9px] text-slate-400 uppercase">
                <tr>
                  <th className="p-2">Signal</th>
                  <th className="p-2 w-28 text-center">Source</th>
                  <th className="p-2 w-20 text-center">Weight</th>
                  <th className="p-2 w-24 text-center">Impact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-xs">
                {caseDetail.score_breakdown.map((s, i) => (
                  <tr key={i}>
                    <td className="p-2">
                      <div className="font-bold text-slate-100 text-xs">{s.signal}</div>
                      {s.reason && <div className="text-[10px] text-slate-400 font-sans mt-0.5">{s.reason}</div>}
                    </td>
                    <td className="p-2 text-center text-slate-300 uppercase text-[9px]">{s.sourceModule}</td>
                    <td className="p-2 text-center text-slate-400 text-xs">{s.weight}</td>
                    <td className="p-2 text-center font-bold text-cyan-300 text-xs">+{s.contribution}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Origin & Hop Sequence */}
          {origin && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <h4 className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Origin Geolocation Intel
                </h4>
                <div className="p-2.5 rounded bg-soc-panel border border-slate-800/60 font-mono space-y-1 text-xs">
                  <div>IP Address: <strong className="text-cyan-300">{origin.originating_ip}</strong></div>
                  <div>Estimated Origin: <strong className="text-slate-200">{origin.geolocation.city}, {origin.geolocation.country}</strong></div>
                  <div>Carrier: <strong className="text-slate-200">{origin.isp}</strong></div>
                  <div>VPN/Tor Exit: <strong className={origin.vpn_tor_flag ? 'text-red-400' : 'text-emerald-400'}>{origin.vpn_tor_flag ? 'TRUE (Bulletproof)' : 'FALSE'}</strong></div>
                </div>
              </div>

              <div>
                <h4 className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Domain Intelligence (WHOIS)
                </h4>
                <div className="p-2.5 rounded bg-soc-panel border border-slate-800/60 font-mono space-y-1 text-xs">
                  <div>Domain: <strong className="text-cyan-300">{origin.domain_intel.domain}</strong></div>
                  <div>Age: <strong className="text-slate-200">{origin.domain_intel.domain_age_days} days</strong></div>
                  <div>Registrar: <strong className="text-slate-200">{origin.domain_intel.registrar}</strong></div>
                  <div>MX DNS: <strong className={origin.domain_intel.mx_valid ? 'text-emerald-400' : 'text-red-400'}>{origin.domain_intel.mx_valid ? 'VALID' : 'INVALID'}</strong></div>
                </div>
              </div>
            </div>
          )}

          {/* Formal Analyst Sign-off */}
          <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-slate-400 font-mono text-[9px]">
            <div>
              <div>INVESTIGATION AUTHORITY: MailTrace Incident Response Suite</div>
              <div>VERIFICATION: Cryptographically Signed Evidence Lock</div>
            </div>
            <div className="text-right">
              <div>ANALYST: <span className="text-slate-200 font-semibold">{analystName}</span></div>
              <div>CONFIDENCE: <span className="text-cyan-400 font-bold">{caseDetail.confidence.toUpperCase()}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
