import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getRetentionSettings, updateRetentionSettings, getAuditLogs } from '../mocks/api';
import { Sliders, Lock, CheckCircle2, UserCheck } from 'lucide-react';
import { EvidenceCard } from '../components/common/EvidenceCard';
import { formatUtcDateTime } from '../lib/formatters';

export const SettingsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [saveSuccess, setSaveSuccess] = useState(false);

  const { data: settings } = useQuery({
    queryKey: ['settings-retention'],
    queryFn: getRetentionSettings,
  });

  const { data: auditData } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => getAuditLogs(),
  });

  const [retentionDays, setRetentionDays] = useState<number>(settings?.retention_days || 90);
  const [autoPurge, setAutoPurge] = useState<boolean>(settings?.auto_purge ?? true);
  const [autoTrashOnPurge, setAutoTrashOnPurge] = useState<boolean>(settings?.auto_trash_on_purge ?? false);
  const [maskPii, setMaskPii] = useState<boolean>(settings?.mask_pii ?? true);

  // Synchronize when query loads
  React.useEffect(() => {
    if (settings) {
      setRetentionDays(settings.retention_days);
      setAutoPurge(settings.auto_purge);
      setAutoTrashOnPurge(settings.auto_trash_on_purge ?? false);
      setMaskPii(settings.mask_pii);
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: updateRetentionSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings-retention'] });
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    },
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      retention_days: retentionDays,
      auto_purge: autoPurge,
      auto_trash_on_purge: autoTrashOnPurge,
      mask_pii: maskPii,
    });
  };

  const auditLogs = auditData?.logs || [];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 space-y-4">
      {/* Header */}
      <div className="pb-2.5 border-b border-slate-800/60">
        <h1 className="text-lg font-bold font-mono text-slate-100 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <span>PRIVACY, COMPLIANCE & AUDIT TRAIL</span>
        </h1>
        <p className="text-xs text-soc-text-dim mt-0.5">
          Configure evidence preservation limits, automated GDPR PII masking, and review immutable forensic chain-of-custody logs.
        </p>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        {/* Retention & Privacy Safeguards */}
        <EvidenceCard
          title="Retention & Evidence Preservation Controls"
          subtitle="Legal compliance and data sanitization rules for stored cases"
        >
          <form onSubmit={handleSave} className="space-y-3.5 text-xs font-mono">
            {/* Retention Slider */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-slate-300">Derived Data Retention Period:</span>
                <span className="text-cyan-300 font-bold">{retentionDays} Days</span>
              </div>
              <input
                type="range"
                min={30}
                max={365}
                step={15}
                value={retentionDays}
                onChange={(e) => setRetentionDays(Number(e.target.value))}
                className="w-full accent-cyan-400 bg-slate-800 cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-slate-500 mt-0.5">
                <span>30 Days (Fast Triage)</span>
                <span>90 Days (Standard)</span>
                <span>365 Days (Long-term)</span>
              </div>
            </div>

            {/* PII Masking Switch */}
            <div className="flex items-center justify-between p-2.5 rounded bg-soc-inset border border-slate-800/60">
              <div>
                <span className="text-slate-200 font-semibold block">Automatic PII Masking</span>
                <span className="text-[10px] text-slate-400 font-sans block mt-0.5">
                  Mask personal email addresses and names in exported reports & dashboard
                </span>
              </div>
              <input
                type="checkbox"
                checked={maskPii}
                onChange={(e) => setMaskPii(e.target.checked)}
                className="w-4 h-4 accent-cyan-400 cursor-pointer"
              />
            </div>

            {/* Auto Purge Switch */}
            <div className="flex items-center justify-between p-2.5 rounded bg-soc-inset border border-slate-800/60">
              <div>
                <span className="text-slate-200 font-semibold block">Automated Purge Daemon</span>
                <span className="text-[10px] text-slate-400 font-sans block mt-0.5">
                  Purge derived analysis rows past retention period (Raw hashes preserved)
                </span>
              </div>
              <input
                type="checkbox"
                checked={autoPurge}
                onChange={(e) => setAutoPurge(e.target.checked)}
                className="w-4 h-4 accent-cyan-400 cursor-pointer"
              />
            </div>

            {/* Gmail Auto-Trash on Purge Switch & Clear Plain-Language Disclosure */}
            <div className="p-2.5 rounded bg-soc-inset border border-slate-800/60 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-200 font-semibold block">Move Expired Mail to Gmail Trash</span>
                    <span className="px-1.5 py-0.2 text-[9px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 rounded">
                      gmail.modify
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-sans block mt-0.5">
                    Mirrors local raw file deletion by moving expired messages to Gmail Trash
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={autoTrashOnPurge}
                  onChange={(e) => setAutoTrashOnPurge(e.target.checked)}
                  className="w-4 h-4 accent-cyan-400 cursor-pointer"
                />
              </div>

              {autoTrashOnPurge && (
                <div className="p-2 rounded bg-amber-500/10 border border-amber-500/30 text-[11px] font-sans text-amber-200/90 leading-relaxed">
                  <span className="font-semibold text-amber-300 font-mono text-[10px] block mb-0.5 uppercase tracking-wider">
                    Retention Trash Policy Notice:
                  </span>
                  Emails older than {retentionDays} days from connected Gmail accounts will be moved to Gmail Trash. This can be undone from Gmail within its normal trash retention period.
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="px-3.5 py-1.5 rounded bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold transition-colors shadow-soc-subtle"
              >
                {updateMutation.isPending ? 'Saving...' : 'Update Retention Policies'}
              </button>

              {saveSuccess && (
                <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Policies updated & audited</span>
                </div>
              )}
            </div>
          </form>
        </EvidenceCard>

        {/* Chain of Custody Standard Banner */}
        <EvidenceCard
          title="Evidence Integrity & Legal Standard"
          subtitle="FR7 Compliance by Design Architecture"
        >
          <div className="space-y-2.5 text-xs font-sans text-slate-300 leading-relaxed">
            <div className="p-2.5 rounded bg-soc-inset border border-slate-800/60 flex items-start gap-2.5">
              <Lock className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <strong className="font-mono text-slate-200 block text-xs">Immutable Raw File Vault</strong>
                Raw .eml emails are saved write-once in a partitioned object vault with cryptographic SHA-256 validation computed prior to parsing.
              </div>
            </div>

            <div className="p-2.5 rounded bg-soc-inset border border-slate-800/60 flex items-start gap-2.5">
              <UserCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="font-mono text-slate-200 block text-xs">Analyst Accountability</strong>
                All case views, forensic PDF exports, and annotation actions write an immutable row to the PostgreSQL audit ledger.
              </div>
            </div>
          </div>
        </EvidenceCard>
      </div>

      {/* Forensic Audit Log Table */}
      <EvidenceCard
        title="Forensic Audit Trail & Chain of Custody Log"
        subtitle="Chronological ledger of analyst access, export actions, and policy modifications"
        badge={
          <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/25">
            {auditLogs.length} AUDIT EVENTS
          </span>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-mono text-xs">
            <thead>
              <tr className="bg-soc-subtle border-b border-slate-800/60 text-[10px] text-soc-text-dim uppercase tracking-wider">
                <th className="py-2 px-3 w-40">UTC Timestamp</th>
                <th className="py-2 px-3 w-44">Analyst / Actor</th>
                <th className="py-2 px-3 w-28">Action</th>
                <th className="py-2 px-3">Audit Event Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-xs">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-soc-hover/50 transition-colors">
                  <td className="py-2 px-3 text-slate-400 text-[11px]">
                    {formatUtcDateTime(log.timestamp)}
                  </td>
                  <td className="py-2 px-3 text-cyan-300 font-semibold">
                    {log.user}
                  </td>
                  <td className="py-2 px-3">
                    <span className="px-1.5 py-0.2 rounded text-[9px] uppercase font-bold bg-slate-800 text-slate-300 border border-slate-700/60">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-slate-200 font-sans text-[11px]">
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </EvidenceCard>
    </div>
  );
};
