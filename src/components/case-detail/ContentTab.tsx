import React from 'react';
import {
  Flame,
  UserX,
  DollarSign,
  Link,
  ShieldAlert,
  Paperclip,
  QrCode,
  Image as ImageIcon,
  ScanText,
  AlertTriangle,
} from 'lucide-react';
import { CaseContent } from '../../types/case';
import { EvidenceCard } from '../common/EvidenceCard';
import { RiskChip } from '../common/RiskChip';

interface ContentTabProps {
  content: CaseContent;
}

export const ContentTab: React.FC<ContentTabProps> = ({ content }) => {
  const urgency = content.sentiment_urgency_score ?? 0;
  const isSevere = urgency >= 70;
  const isElevated = urgency >= 40;
  const urgencyLabel = isSevere
    ? 'High psychological coercion pressure detected'
    : isElevated
    ? 'Elevated urgency & promotional scarcity detected'
    : 'Standard conversational tone';
  const flameColor = isSevere ? 'text-red-400' : isElevated ? 'text-amber-400' : 'text-emerald-400';
  const barColor = isSevere ? 'bg-red-500' : isElevated ? 'bg-amber-500' : 'bg-emerald-500';

  const imageThreatItems =
    content.attachments?.filter(
      (a) =>
        a.has_qr_code ||
        a.ocr_extracted_text ||
        a.image_only_lure_flag ||
        a.declared_content_type?.startsWith('image/') ||
        a.detected_file_type?.startsWith('image/')
    ) ?? [];
  const hasImageThreats =
    imageThreatItems.length > 0 || !!content.image_only_lure || !!content.quishing_detected;

  return (
    <div className="space-y-4">
      {/* 1. NLP Model Classification Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* ML Label */}
        <EvidenceCard title="ML Model Classification">
          <div className="flex items-center gap-2.5">
            <RiskChip category={content.classification} size="md" />
            <div className="font-mono text-xs text-slate-300">
              Confidence:{' '}
              <strong className="text-cyan-300">
                {Math.round(content.classification_confidence * 100)}%
              </strong>
            </div>
          </div>
          <p className="text-[10px] text-soc-text-dim mt-2 font-sans">
            Evaluated via Multi-Layer Perceptron (MLP) Classifier & TF-IDF heuristic matrix.
          </p>
        </EvidenceCard>

        {/* Urgency Pressure Meter */}
        <EvidenceCard title="Urgency & Pressure Index">
          <div className="flex items-center gap-2">
            <Flame className={`w-4 h-4 ${flameColor}`} />
            <span className="text-lg font-bold font-mono text-slate-100">
              {urgency}
            </span>
            <span className="text-xs font-mono text-soc-muted">/100</span>
          </div>
          <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden mt-2">
            <div
              className={`h-full ${barColor} rounded-full transition-all duration-500`}
              style={{ width: `${urgency}%` }}
            />
          </div>
          <p className="text-[10px] text-soc-text-dim mt-1.5 font-sans">
            {urgencyLabel}
          </p>
        </EvidenceCard>

        {/* Impersonated Entity */}
        <EvidenceCard title="Target Brand / Impersonation">
          <div className="flex items-center gap-2">
            <UserX className="w-4 h-4 text-amber-400" />
            <span className="font-semibold text-xs text-slate-200">
              {content.impersonation_target || 'No Known Executive or Brand Impersonation'}
            </span>
          </div>
          <p className="text-[10px] text-soc-text-dim mt-2 font-sans">
            Matched against recognized SaaS, financial, and internal C-suite identities.
          </p>
        </EvidenceCard>
      </div>

      {/* 2. Flagged Urgency & Social Engineering Phrases */}
      <EvidenceCard
        title="Detected Social Engineering & Urgency Phrases"
        subtitle="Natural language processing extracted phrases associated with coercion, urgency, and credential capture"
        badge={
          <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-red-500/10 text-red-300 border border-red-500/25">
            {content.flagged_phrases.length} PHRASES EXTRACTED
          </span>
        }
      >
        {content.flagged_phrases.length === 0 ? (
          <div className="p-3 text-center text-slate-400 font-mono text-xs">
            No coercive or deceptive language patterns detected.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {content.flagged_phrases.map((phrase, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-red-500/10 border border-red-500/30 text-red-200 text-xs font-mono font-medium shadow-soc-subtle"
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
            <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-rose-500/10 text-rose-300 border border-rose-500/25">
              BEC PATTERNS ACTIVE
            </span>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {content.bec_indicators.map((indicator, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 p-2 rounded bg-rose-500/5 border border-rose-500/20 text-xs font-mono text-rose-200"
              >
                <DollarSign className="w-3.5 h-3.5 text-rose-400 shrink-0" />
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
          <span className="px-2 py-0.5 rounded text-[9px] font-mono text-cyan-300 bg-cyan-500/10 border border-cyan-500/25">
            {content.urls.length} HYPERLINKS ANALYZED
          </span>
        }
      >
        {content.urls.length === 0 ? (
          <div className="p-3 text-center text-slate-400 font-mono text-xs">
            No embedded links or URLs found in email body.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-soc-subtle border-b border-slate-800/60 text-[10px] font-mono text-soc-text-dim uppercase tracking-wider">
                  <th className="py-2 px-3">Original Display Link</th>
                  <th className="py-2 px-3">Resolved Destination (Sandbox)</th>
                  <th className="py-2 px-3 w-48">Reputation / Finding</th>
                  <th className="py-2 px-3 w-24 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-xs font-mono">
                {content.urls.map((urlItem, idx) => (
                  <tr key={idx} className="hover:bg-soc-hover/50 transition-colors">
                    {/* Original */}
                    <td className="py-2.5 px-3">
                      <div className="text-slate-300 break-all text-[11px]">{urlItem.original}</div>
                    </td>

                    {/* Resolved */}
                    <td className="py-2.5 px-3">
                      <div className="text-cyan-300 break-all font-semibold text-[11px]">
                        {urlItem.resolved}
                      </div>
                    </td>

                    {/* Reason */}
                    <td className="py-2.5 px-3">
                      <span className="text-slate-300 text-[10px] font-sans">
                        {urlItem.reason}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-2.5 px-3 text-center">
                      {urlItem.flagged ? (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-red-500/15 text-red-300 border border-red-500/30">
                          MALICIOUS
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
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

      {/* 5. Image-Based Threats & Quishing Forensics */}
      {hasImageThreats && (
        <EvidenceCard
          title="Image-Based Threats & Quishing Forensics"
          subtitle="QR code payload resolution, OCR text extraction from visual lures, and filter-evasion detection"
          badge={
            content.quishing_detected ? (
              <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-red-500/15 text-red-300 border border-red-500/30">
                QUISHING DETECTED
              </span>
            ) : content.image_only_lure ? (
              <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                IMAGE-ONLY LURE
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[9px] font-mono text-cyan-300 bg-cyan-500/10 border border-cyan-500/25">
                {imageThreatItems.length} IMAGE{imageThreatItems.length > 1 ? 'S' : ''} SCANNED
              </span>
            )
          }
        >
          {content.image_only_lure && (
            <div className="flex items-center gap-2 p-2.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs font-mono mb-3">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Image-Only Evasion Lure:</strong> Email body text is minimal or absent. The message relies on embedded visual images to evade perimeter NLP analysis.
              </span>
            </div>
          )}

          {imageThreatItems.length === 0 ? (
            <div className="p-3 text-center text-slate-400 font-mono text-xs">
              No QR codes, OCR text anomalies, or suspicious embedded images identified.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-soc-subtle border-b border-slate-800/60 text-[10px] font-mono text-soc-text-dim uppercase tracking-wider">
                    <th className="py-2 px-3">Image / Artifact</th>
                    <th className="py-2 px-3">QR Decoded Target</th>
                    <th className="py-2 px-3">OCR Extracted Text</th>
                    <th className="py-2 px-3 w-44">Forensic Finding</th>
                    <th className="py-2 px-3 w-24 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-xs font-mono">
                  {imageThreatItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-soc-hover/50 transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                          {item.has_qr_code ? (
                            <QrCode className="w-3.5 h-3.5 text-red-400 shrink-0" />
                          ) : (
                            <ImageIcon className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          )}
                          <span className="break-all">{item.filename}</span>
                        </div>
                        {item.file_hash && (
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            SHA256: {item.file_hash.substring(0, 12)}...
                          </div>
                        )}
                      </td>

                      <td className="py-2.5 px-3">
                        {item.qr_decoded_url ? (
                          <div className="text-cyan-300 break-all text-[11px] font-mono flex items-center gap-1">
                            <Link className="w-3 h-3 shrink-0 text-cyan-400" />
                            <span>{item.qr_decoded_url}</span>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-[10px] italic">No QR code found</span>
                        )}
                      </td>

                      <td className="py-2.5 px-3">
                        {item.ocr_extracted_text ? (
                          <div className="text-slate-300 text-[11px] font-sans line-clamp-2 max-w-xs">
                            "{item.ocr_extracted_text}"
                          </div>
                        ) : (
                          <span className="text-slate-500 text-[10px] italic">No visible text extracted</span>
                        )}
                      </td>

                      <td className="py-2.5 px-3">
                        <span className="text-slate-300 text-[10px] font-sans">
                          {item.flag_reason || 'Clean image payload; no threat indicators.'}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-center">
                        {item.is_flagged ? (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-500/15 text-red-300 border border-red-500/30">
                            MALICIOUS
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
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
      )}

      {/* 6. Attachment Analysis & Payload Inspection */}
      {content.attachments && content.attachments.length > 0 && (
        <EvidenceCard
          title="Extracted Email Attachments & Payload Inspection"
          subtitle="Binary signature detection, macro identification, and double-extension camouflage analysis"
          badge={
            <span className="px-2 py-0.5 rounded text-[9px] font-mono text-cyan-300 bg-cyan-500/10 border border-cyan-500/25">
              {content.attachments.length} ATTACHMENT{content.attachments.length > 1 ? 'S' : ''} SCANNED
            </span>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-soc-subtle border-b border-slate-800/60 text-[10px] font-mono text-soc-text-dim uppercase tracking-wider">
                  <th className="py-2 px-3">Filename & Hash</th>
                  <th className="py-2 px-3">Declared Type</th>
                  <th className="py-2 px-3">Detected Signature</th>
                  <th className="py-2 px-3 w-48">Inspection Finding</th>
                  <th className="py-2 px-3 w-24 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-xs font-mono">
                {content.attachments.map((att, idx) => (
                  <tr key={idx} className="hover:bg-soc-hover/50 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                        <Paperclip className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span className="break-all">{att.filename}</span>
                      </div>
                      {att.file_hash && (
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5 break-all">
                          SHA256: {att.file_hash.substring(0, 16)}...
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300 text-[11px]">
                      {att.declared_content_type || 'Unknown'}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-cyan-300 text-[11px] font-mono font-medium">
                        {att.detected_file_type || 'Unknown'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-slate-300 text-[10px] font-sans">
                        {att.flag_reason || 'No malicious indicators or format camouflage identified.'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {att.is_flagged ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-500/15 text-red-300 border border-red-500/30">
                          MALICIOUS
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          CLEAN
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </EvidenceCard>
      )}
    </div>
  );
};
