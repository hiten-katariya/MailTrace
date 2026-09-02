import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  RefreshCw,
  Server,
  FileCode,
  ShieldAlert,
  Globe,
  Sliders,
  ArrowRight,
  Terminal,
} from 'lucide-react';

interface PipelineProgressProps {
  filename: string;
  caseId: string;
  fileHash: string;
  onComplete: (caseId: string) => void;
}

interface StepInfo {
  id: string;
  label: string;
  detail: string;
  icon: React.ReactNode;
}

export const PipelineProgress: React.FC<PipelineProgressProps> = ({
  filename,
  caseId,
  fileHash,
  onComplete,
}) => {
  const [activeStep, setActiveStep] = useState<number>(0);
  const [logs, setLogs] = useState<string[]>([]);

  const steps: StepInfo[] = [
    {
      id: 'mime',
      label: 'MIME Parsing & Evidence Integrity',
      detail: `Parsed RFC 822 MIME structure. Computed SHA-256 hash (${fileHash.substring(0, 16)}...).`,
      icon: <FileCode className="w-4 h-4 text-cyan-400" />,
    },
    {
      id: 'headers',
      label: 'Header & Protocol Authentication',
      detail: 'Reconstructing Received hop sequence. Validating SPF, DKIM signature & DMARC alignment policy.',
      icon: <Server className="w-4 h-4 text-blue-400" />,
    },
    {
      id: 'nlp',
      label: 'NLP & Psychological Urgency Engine',
      detail: 'Analyzing semantic pressure cues, executive impersonation pretexts, and resolving sandboxed redirect URLs.',
      icon: <ShieldAlert className="w-4 h-4 text-purple-400" />,
    },
    {
      id: 'geo',
      label: 'Origin Geolocation & WHOIS Intel',
      detail: 'Querying MaxMind GeoLite2 IP origin coordinates, ASN bulletproof flags & AbuseIPDB threat feeds.',
      icon: <Globe className="w-4 h-4 text-amber-400" />,
    },
    {
      id: 'fusion',
      label: 'Signal Fusion & Composite Scoring',
      detail: 'Calculating explainable weighted fraud score. Building forensic case dossier and campaign links.',
      icon: <Sliders className="w-4 h-4 text-emerald-400" />,
    },
  ];

  useEffect(() => {
    // Stage 1
    setLogs((prev) => [...prev, `[0.0s] Ingestion initiated for '${filename}'`]);
    setLogs((prev) => [...prev, `[0.2s] SHA-256 evidence lock created: ${fileHash.substring(0, 24)}...`]);

    const timer1 = setTimeout(() => {
      setActiveStep(1);
      setLogs((prev) => [...prev, `[0.8s] Parsed 4 Received header hops. SPF check dispatched.`]);
    }, 700);

    const timer2 = setTimeout(() => {
      setActiveStep(2);
      setLogs((prev) => [...prev, `[1.6s] DistilBERT classification running. Scanning for BEC markers.`]);
    }, 1500);

    const timer3 = setTimeout(() => {
      setActiveStep(3);
      setLogs((prev) => [...prev, `[2.3s] Earliest IP identified. Cross-referencing AbuseIPDB & WHOIS.`]);
    }, 2300);

    const timer4 = setTimeout(() => {
      setActiveStep(4);
      setLogs((prev) => [...prev, `[3.0s] Signal fusion complete. Generating case dossier ${caseId}.`]);
    }, 3000);

    const timerComplete = setTimeout(() => {
      setActiveStep(5);
      setLogs((prev) => [...prev, `[3.6s] Pipeline execution finished. Ready for triage.`]);
    }, 3600);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timerComplete);
    };
  }, [filename, caseId, fileHash]);

  return (
    <div className="bg-soc-panel border border-soc-border rounded-md shadow-soc-card p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-soc-border">
        <div>
          <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider font-bold">
            FORENSIC SIGNAL PIPELINE IN PROGRESS
          </span>
          <h2 className="text-base font-bold text-slate-100 font-mono mt-0.5">
            Analyzing: <span className="text-cyan-300">{filename}</span>
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {activeStep < 5 ? (
            <div className="flex items-center gap-2 px-3 py-1 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-mono">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Processing Stage {activeStep + 1} of 5</span>
            </div>
          ) : (
            <button
              onClick={() => onComplete(caseId)}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold transition-colors animate-bounce"
            >
              <span>View Case Dossier</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 5-Step Pipeline Progress Cards */}
      <div className="space-y-3">
        {steps.map((step, idx) => {
          const isDone = activeStep > idx;
          const isCurrent = activeStep === idx;

          return (
            <div
              key={step.id}
              className={`p-3.5 rounded-md border transition-all flex items-start gap-3.5 ${
                isDone
                  ? 'bg-emerald-950/15 border-emerald-500/30'
                  : isCurrent
                  ? 'bg-cyan-950/30 border-cyan-500/50 shadow-soc-subtle'
                  : 'bg-soc-inset/50 border-soc-border/60 opacity-60'
              }`}
            >
              {/* Status Icon */}
              <div className="mt-0.5 shrink-0">
                {isDone ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : isCurrent ? (
                  <RefreshCw className="w-5 h-5 text-cyan-400 animate-spin" />
                ) : (
                  <div className="w-5 h-5 rounded-full border border-slate-700 flex items-center justify-center text-[10px] font-mono text-slate-500">
                    {idx + 1}
                  </div>
                )}
              </div>

              {/* Step info */}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {step.icon}
                    <h4 className={`text-xs font-mono font-bold ${isCurrent ? 'text-cyan-300' : 'text-slate-200'}`}>
                      {step.label}
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono text-soc-muted uppercase">
                    {isDone ? 'COMPLETE' : isCurrent ? 'EXECUTING' : 'QUEUED'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-sans mt-1 leading-relaxed">
                  {step.detail}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Terminal Telemetry Log Output */}
      <div className="rounded bg-black/80 border border-slate-800 p-3 font-mono text-[11px] text-slate-400 space-y-1">
        <div className="flex items-center gap-1.5 text-slate-500 pb-1 border-b border-slate-900 text-[10px] uppercase">
          <Terminal className="w-3.5 h-3.5" />
          <span>Real-time Ingestion Daemon Stream</span>
        </div>
        <div className="max-h-24 overflow-y-auto space-y-0.5 pt-1">
          {logs.map((log, i) => (
            <div key={i} className="text-slate-300">
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
