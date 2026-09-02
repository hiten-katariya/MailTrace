import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { copyToClipboard, truncateHash } from '../../lib/formatters';

interface CopyableTextProps {
  text: string;
  truncate?: boolean;
  startChars?: number;
  endChars?: number;
  label?: string;
  className?: string;
  textClassName?: string;
}

export const CopyableText: React.FC<CopyableTextProps> = ({
  text,
  truncate = false,
  startChars = 8,
  endChars = 8,
  label,
  className = '',
  textClassName = '',
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  const displayText = truncate ? truncateHash(text, startChars, endChars) : text;

  return (
    <div
      onClick={handleCopy}
      className={`group inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-soc-inset hover:bg-soc-hover border border-soc-border hover:border-slate-600 transition-colors cursor-pointer ${className}`}
      title={truncate ? `Click to copy full value: ${text}` : 'Click to copy to clipboard'}
    >
      {label && <span className="text-[11px] text-soc-muted font-sans mr-0.5">{label}:</span>}
      <span className={`font-mono text-xs text-slate-300 group-hover:text-cyan-300 transition-colors ${textClassName}`}>
        {displayText}
      </span>
      {copied ? (
        <Check className="w-3 h-3 text-emerald-400 shrink-0" />
      ) : (
        <Copy className="w-3 h-3 text-slate-500 group-hover:text-cyan-400 shrink-0 transition-colors" />
      )}
      {copied && (
        <span className="text-[10px] font-mono text-emerald-400 font-semibold ml-0.5">COPIED</span>
      )}
    </div>
  );
};
