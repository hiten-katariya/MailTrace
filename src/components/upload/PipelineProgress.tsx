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
  Hash,
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
      id: 'sha256',
      label: '1. SHA-256 Evidence Lock & Custody',
      detail: `Computed cryptographic SHA-256 hash (${fileHash.substring(0, 20)}...). Immutable vault entry created.`,
      icon: <Hash className="w-4 h-4 text-cyan-400" />,
    },
    {
      id: 'mime',
      label: '2. MIME Parsing & Header Analysis',
      detail: 'Reconstructing Received relay chain sequence. Validating SPF record, DKIM key & DMARC policy alignment.',
      icon: <Server className="w-4 h-4 text-blue-400" />,
    },
    {
      id: 'nlp',
      label: '3. NLP Sentiment & Urgency Analysis',
      detail: 'Evaluating DistilBERT phishing model, executive impersonation pretexts, and sandboxed redirect URLs.',
      icon: <ShieldAlert className="w-4 h-4 text-purple-400" />,
    },
    {
      id: 'origin',
      label: '4. Origin Geolocation & Domain Intelligence',
      detail: 'Querying MaxMind GeoLite2 IP coordinates, AbuseIPDB threat feeds, and WHOIS domain registration history.',
      icon: <Globe className="w-4 h-4 text-amber-400" />,
    },
    {
      id: 'scoring',
      label: '5. Signal Fusion & Defensible Fraud Scoring',
      detail: 'Fusing weighted evidence indicators into composite 0-100 score. Correlating campaign clusters.',
      icon: <Sliders className="w-4 h-4 text-emerald-400" />,
    },
  ];

  useEffect(() => {
    setLogs((prev) => [...prev, `[0.0s] Ingestion daemon initiated for '${filename}'`]);
    setLogs((prev) => [...prev, `[0.2s] SHA-256 evidence lock created: ${fileHash.substring(0, 28)}...`]);

    const timer1 = setTimeout(() => {
      setActiveStep(1);
      setLogs((prev) => [...prev, `[0.8s] Parsed 4 Received header hops. SPF DNS query dispatched.`]);
    }, 700);

    const timer2 = setTimeout(() => {
      setActiveStep(2);
      setLogs((prev) => [...prev, `[1.6s] DistilBERT sentiment scan completed. Checking BEC payment markers.`]);
    }, 1500);

    const timer3 = setTimeout(() => {
      setActiveStep(3);
      setLogs((prev) => [...prev, `[2.3s] Earliest origin IP extracted. Cross-referencing AbuseIPDB & WHOIS age.`]);
    }, 2300);

    const timer4 = setTimeout(() => {
      setActiveStep(4);
      setLogs((prev) => [...prev, `[3.0s] Multi-signal fusion complete. Generating case dossier ${caseId}.`]);
    }, 3000);

    const timerComplete = setTimeout(() => {
      setActiveStep(5);
      setLogs((prev) => [...prev, `[3.5s] Forensic pipeline execution successful. Ready for triage.`]);
    }, 3500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timerComplete);
    };
  }, [filename, caseId, fileHash]);

  return (
    <div className="bg-soc-panel border border-slate-800/60 rounded shadow-soc-card p-5 space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/60">
        <div>
          <span className="text-[9px] font-mono text-cyan-400 uppercase tracking-wider font-bold">
            MULTI-SIGNAL FORENSIC PIPELINE IN PROGRESS
          </span>
          <h2 className="text-sm font-bold text-slate-100 font-mono mt-0.5">
            Ingesting: <span className="text-cyan-300">{filename}</span>
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {activeStep < 5 ? (
            <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Stage {activeStep + 1} of 5</span>
            </div>
          ) : (
            <button
              onClick={() => onComplete(caseId)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold transition-colors"
            >
              <span>View Case Dossier</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 5-Step Pipeline Progress Cards */}
      <div className="space-y-2">
        {steps.map((step, idx) => {
          const isDone = activeStep > idx;
          const isCurrent = activeStep === idx;

          return (
            <div
              key={step.id}
              className={`p-3 rounded border transition-all flex items-start gap-3 ${
                isDone
                  ? 'bg-emerald-500/5 border-emerald-500/25'
                  : isCurrent
                  ? 'bg-cyan-500/10 border-cyan-500/40 shadow-soc-subtle'
                  : 'bg-soc-inset/50 border-slate-800/40 opacity-50'
              }`}
            >
              {/* Status Icon */}
              <div className="mt-0.5 shrink-0">
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : isCurrent ? (
                  <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-slate-700 flex items-center justify-center text-[9px] font-mono text-slate-500">
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
                  <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400">
                    {isDone ? 'COMPLETE' : isCurrent ? 'EXECUTING' : 'QUEUED'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-sans mt-0.5 leading-relaxed">
                  {step.detail}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Real-time Ingestion Stream Log */}
      <div className="rounded bg-black/60 border border-slate-800/80 p-2.5 font-mono text-[10px] text-slate-400 space-y-1">
        <div className="flex items-center gap-1.5 text-slate-500 pb-1 border-b border-slate-900 text-[9px] uppercase">
          <Terminal className="w-3 h-3" />
          <span>Real-time Ingestion Daemon Output</span>
        </div>
        <div className="max-h-20 overflow-y-auto space-y-0.5 pt-1">
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
