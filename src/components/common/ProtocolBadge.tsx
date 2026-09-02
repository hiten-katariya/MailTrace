import React from 'react';
import { ProtocolStatus } from '../../types/case';
import { getProtocolStatusConfig } from '../../lib/riskUtils';

interface ProtocolBadgeProps {
  name: 'SPF' | 'DKIM' | 'DMARC';
  status: ProtocolStatus;
  showName?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export const ProtocolBadge: React.FC<ProtocolBadgeProps> = ({
  name,
  status,
  showName = true,
  size = 'md',
  className = '',
}) => {
  const config = getProtocolStatusConfig(status);

  return (
    <span
      className={`inline-flex items-center gap-1 font-mono rounded border font-semibold transition-colors ${config.badgeClass} ${
        size === 'sm' ? 'px-1.5 py-0.2 text-[10px]' : 'px-2 py-0.5 text-[11px]'
      } ${className}`}
      title={`${name} Protocol Status: ${status.toUpperCase()}`}
    >
      {showName && <span className="text-slate-400 font-normal">{name}:</span>}
      <span className="font-bold">{config.symbol}</span>
      <span>{config.label}</span>
    </span>
  );
};
