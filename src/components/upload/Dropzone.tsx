import React, { useState } from 'react';
import { Upload, FileCode, Zap, Shield, Hash, ArrowUpRight } from 'lucide-react';

interface DropzoneProps {
  onFileSelected: (file: { name: string; size?: number; sampleType?: 'phishing' | 'bec' | 'spoof' | 'clean' }) => void;
  isProcessing: boolean;
}

export const Dropzone: React.FC<DropzoneProps> = ({ onFileSelected, isProcessing }) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      onFileSelected({
        name: file.name,
        size: file.size,
      });
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      onFileSelected({
        name: file.name,
        size: file.size,
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Large Forensic Evidence Dropzone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`p-8 sm:p-10 border border-dashed rounded text-center transition-all relative overflow-hidden ${
          isDragOver
            ? 'border-cyan-400 bg-cyan-500/10'
            : 'border-slate-800/80 hover:border-slate-700 bg-soc-panel'
        }`}
      >
        <input
          type="file"
          accept=".eml,.msg,text/plain"
          disabled={isProcessing}
          onChange={handleFileInput}
          id="eml-upload-input"
          className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />

        <div className="flex flex-col items-center justify-center space-y-2.5">
          <div className="w-12 h-12 rounded-lg bg-soc-inset flex items-center justify-center border border-slate-800 text-cyan-400 shadow-soc-subtle">
            <Upload className="w-5 h-5" />
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-100 font-mono tracking-wider">
              DROP .EML RAW EVIDENCE FILE HERE
            </h3>
            <p className="text-xs text-soc-text-dim mt-1 font-sans">
              Accepts MIME RFC 822 `.eml` raw payloads. SHA-256 cryptographic evidence lock is computed immediately.
            </p>
          </div>

          <label
            htmlFor="eml-upload-input"
            className="px-3.5 py-1.5 rounded bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-semibold cursor-pointer transition-colors shadow-soc-subtle inline-block"
          >
            Select Local .EML File
          </label>
        </div>
      </div>

      {/* 2. Fast Evaluation Threat Samples */}
      <div className="p-3.5 bg-soc-panel border border-slate-800/60 rounded">
        <div className="flex items-center gap-1.5 mb-2.5">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <h4 className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-200">
            Curated Threat Evaluation Samples (1-Click Pipeline Ingest)
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {/* Sample 1: Phishing */}
          <button
            type="button"
            disabled={isProcessing}
            onClick={() =>
              onFileSelected({
                name: 'suspicious_m365_suspension_alert.eml',
                sampleType: 'phishing',
              })
            }
            className="p-2.5 text-left rounded bg-soc-inset hover:bg-soc-hover border border-slate-800/60 hover:border-red-500/30 transition-colors group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-red-500/15 text-red-300 border border-red-500/25">
                CREDENTIAL PHISH
              </span>
              <ArrowUpRight className="w-3 h-3 text-slate-500 group-hover:text-red-400" />
            </div>
            <div className="text-xs font-semibold text-slate-200 group-hover:text-slate-100 truncate font-mono">
              M365 Account Suspension
            </div>
            <div className="text-[10px] font-mono text-slate-500 mt-0.5">
              Spoofed domain + DMARC fail
            </div>
          </button>

          {/* Sample 2: BEC */}
          <button
            type="button"
            disabled={isProcessing}
            onClick={() =>
              onFileSelected({
                name: 'confidential_ceo_wire_settlement.eml',
                sampleType: 'bec',
              })
            }
            className="p-2.5 text-left rounded bg-soc-inset hover:bg-soc-hover border border-slate-800/60 hover:border-rose-500/30 transition-colors group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-rose-500/15 text-rose-300 border border-rose-500/25">
                BEC WIRE FRAUD
              </span>
              <ArrowUpRight className="w-3 h-3 text-slate-500 group-hover:text-rose-400" />
            </div>
            <div className="text-xs font-semibold text-slate-200 group-hover:text-slate-100 truncate font-mono">
              CEO Wire Acquisition Pretext
            </div>
            <div className="text-[10px] font-mono text-slate-500 mt-0.5">
              Display name spoof + Reply-To
            </div>
          </button>

          {/* Sample 3: Lookalike Typosquat */}
          <button
            type="button"
            disabled={isProcessing}
            onClick={() =>
              onFileSelected({
                name: 'workday_payroll_direct_deposit.eml',
                sampleType: 'spoof',
              })
            }
            className="p-2.5 text-left rounded bg-soc-inset hover:bg-soc-hover border border-slate-800/60 hover:border-amber-500/30 transition-colors group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 border border-amber-500/25">
                TYPOSQUAT
              </span>
              <ArrowUpRight className="w-3 h-3 text-slate-500 group-hover:text-amber-400" />
            </div>
            <div className="text-xs font-semibold text-slate-200 group-hover:text-slate-100 truncate font-mono">
              Payroll Direct Deposit Update
            </div>
            <div className="text-[10px] font-mono text-slate-500 mt-0.5">
              Lookalike domain + softfail
            </div>
          </button>

          {/* Sample 4: Clean Corporate */}
          <button
            type="button"
            disabled={isProcessing}
            onClick={() =>
              onFileSelected({
                name: 'engineering_roadmap_q3_update.eml',
                sampleType: 'clean',
              })
            }
            className="p-2.5 text-left rounded bg-soc-inset hover:bg-soc-hover border border-slate-800/60 hover:border-emerald-500/30 transition-colors group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
                LEGITIMATE
              </span>
              <ArrowUpRight className="w-3 h-3 text-slate-500 group-hover:text-emerald-400" />
            </div>
            <div className="text-xs font-semibold text-slate-200 group-hover:text-slate-100 truncate font-mono">
              Internal Architecture All-Hands
            </div>
            <div className="text-[10px] font-mono text-slate-500 mt-0.5">
              SPF/DKIM/DMARC valid
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
