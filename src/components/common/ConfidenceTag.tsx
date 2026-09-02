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
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-[10px] font-mono tracking-wider font-semibold ${config.tagClass} ${className}`}
      title={`Confidence Assessment: ${confidence.toUpperCase()}`}
    >
      <span className="text-[8px] tracking-tight">{config.dots}</span>
      <span>{prefix ? `${prefix}: ${confidence.toUpperCase()}` : config.label}</span>
    </span>
  );
};
