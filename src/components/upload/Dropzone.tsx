import React, { useState } from 'react';
import { Upload, FileCode, CheckCircle2, ShieldAlert, Zap, FileText } from 'lucide-react';

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
    <div className="space-y-6">
      {/* Drag and drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`p-10 border-2 border-dashed rounded-lg text-center transition-all bg-soc-panel relative overflow-hidden ${
          isDragOver
            ? 'border-cyan-400 bg-cyan-950/20'
            : 'border-slate-700 hover:border-slate-500 bg-soc-panel'
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

        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-soc-raised flex items-center justify-center border border-slate-700 text-cyan-400">
            <Upload className="w-6 h-6" />
          </div>

          <div>
            <h3 className="text-base font-bold text-slate-100 tracking-wide font-mono">
              DROP RAW .EML EMAIL FILE HERE
            </h3>
            <p className="text-xs text-soc-text-dim mt-1">
              Supports standard MIME `.eml` and RFC 822 format. Cryptographic SHA-256 computed on ingestion.
            </p>
          </div>

          <label
            htmlFor="eml-upload-input"
            className="px-4 py-2 rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-semibold cursor-pointer transition-colors shadow-soc-subtle inline-block"
          >
            Browse Local File
          </label>
        </div>
      </div>

      {/* Preset Curated Test Email Fixtures (for fast evaluation) */}
      <div className="p-4 bg-soc-panel border border-soc-border rounded-md">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-amber-400" />
          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
            Fast Evaluation Fixtures (Curated Threat Samples)
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
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
            className="p-3 text-left rounded bg-soc-inset hover:bg-soc-hover border border-slate-800 hover:border-red-500/40 transition-colors group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-red-950/60 text-red-300 border border-red-500/30">
                CREDENTIAL PHISH
              </span>
              <FileCode className="w-3.5 h-3.5 text-slate-500 group-hover:text-red-400" />
            </div>
            <div className="text-xs font-semibold text-slate-200 group-hover:text-slate-100 line-clamp-1">
              M365 Account Suspension
            </div>
            <div className="text-[10px] font-mono text-slate-500 mt-1">
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
            className="p-3 text-left rounded bg-soc-inset hover:bg-soc-hover border border-slate-800 hover:border-rose-500/40 transition-colors group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-rose-950/60 text-rose-300 border border-rose-500/30">
                BEC FRAUD
              </span>
              <FileCode className="w-3.5 h-3.5 text-slate-500 group-hover:text-rose-400" />
            </div>
            <div className="text-xs font-semibold text-slate-200 group-hover:text-slate-100 line-clamp-1">
              CEO Wire Acquisition Pretext
            </div>
            <div className="text-[10px] font-mono text-slate-500 mt-1">
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
            className="p-3 text-left rounded bg-soc-inset hover:bg-soc-hover border border-slate-800 hover:border-amber-500/40 transition-colors group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-950/60 text-amber-300 border border-amber-500/30">
                TYPOSQUAT
              </span>
              <FileCode className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400" />
            </div>
            <div className="text-xs font-semibold text-slate-200 group-hover:text-slate-100 line-clamp-1">
              Payroll Direct Deposit Update
            </div>
            <div className="text-[10px] font-mono text-slate-500 mt-1">
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
            className="p-3 text-left rounded bg-soc-inset hover:bg-soc-hover border border-slate-800 hover:border-emerald-500/40 transition-colors group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
                LEGITIMATE
              </span>
              <FileCode className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400" />
            </div>
            <div className="text-xs font-semibold text-slate-200 group-hover:text-slate-100 line-clamp-1">
              Internal Architecture All-Hands
            </div>
            <div className="text-[10px] font-mono text-slate-500 mt-1">
              SPF/DKIM/DMARC valid
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
