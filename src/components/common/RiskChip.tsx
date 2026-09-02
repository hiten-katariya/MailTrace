import React from 'react';
import { RiskCategory } from '../../types/case';
import { getRiskCategoryConfig } from '../../lib/riskUtils';

interface RiskChipProps {
  category: RiskCategory;
  className?: string;
  size?: 'sm' | 'md';
}

export const RiskChip: React.FC<RiskChipProps> = ({
  category,
  className = '',
  size = 'md',
}) => {
  const config = getRiskCategoryConfig(category);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border font-mono font-bold tracking-wider ${config.chipClass} ${
        size === 'sm' ? 'px-1.5 py-0.2 text-[9px]' : 'px-2 py-0.5 text-[10px]'
      } ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotColor} animate-pulse-subtle`} />
      <span>{config.label}</span>
    </span>
  );
};
