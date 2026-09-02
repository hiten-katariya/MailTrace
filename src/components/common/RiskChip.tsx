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
      className={`inline-flex items-center gap-1.5 rounded-sm border font-mono font-medium uppercase tracking-wider ${config.chipClass} ${
        size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-xs'
      } ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotColor} animate-pulse-subtle`} />
      <span>{config.label}</span>
    </span>
  );
};
