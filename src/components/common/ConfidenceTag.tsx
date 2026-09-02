import React from 'react';
import { ConfidenceLevel } from '../../types/case';
import { getConfidenceConfig } from '../../lib/riskUtils';

interface ConfidenceTagProps {
  confidence: ConfidenceLevel;
  prefix?: string;
  className?: string;
}

export const ConfidenceTag: React.FC<ConfidenceTagProps> = ({
  confidence,
  prefix,
  className = '',
}) => {
  const config = getConfidenceConfig(confidence);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-[11px] font-mono tracking-tight font-medium ${config.tagClass} ${className}`}
      title={`Confidence Assessment: ${confidence.toUpperCase()}`}
    >
      <span className="text-[9px] tracking-tighter opacity-80">{config.dots}</span>
      <span>{prefix ? `${prefix}: ${confidence.toUpperCase()}` : `Confidence: ${confidence.toUpperCase()}`}</span>
    </span>
  );
};
