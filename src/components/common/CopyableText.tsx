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
      className={`group inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-soc-inset hover:bg-soc-hover border border-slate-800/60 hover:border-slate-700 transition-colors cursor-pointer ${className}`}
      title={truncate ? `Click to copy full value: ${text}` : 'Click to copy to clipboard'}
    >
      {label && <span className="text-[10px] text-soc-muted font-mono uppercase mr-0.5">{label}:</span>}
      <span className={`font-mono text-[11px] text-slate-300 group-hover:text-cyan-300 transition-colors ${textClassName}`}>
        {displayText}
      </span>
      {copied ? (
        <Check className="w-3 h-3 text-emerald-400 shrink-0" />
      ) : (
        <Copy className="w-3 h-3 text-slate-500 group-hover:text-cyan-400 shrink-0 transition-colors opacity-70 group-hover:opacity-100" />
      )}
      {copied && (
        <span className="text-[9px] font-mono text-emerald-400 font-bold ml-0.5">COPIED</span>
      )}
    </div>
  );
};
