import React from 'react';
import { Check, X, AlertCircle, HelpCircle } from 'lucide-react';
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

  const renderIcon = () => {
    const iconSize = size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3';
    switch (config.iconType) {
      case 'check':
        return <Check className={`${iconSize} stroke-[3]`} />;
      case 'x':
        return <X className={`${iconSize} stroke-[3]`} />;
      case 'alert':
        return <AlertCircle className={iconSize} />;
      default:
        return <HelpCircle className={iconSize} />;
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1 font-mono rounded border font-semibold ${config.badgeClass} ${
        size === 'sm' ? 'px-1.5 py-0.2 text-[10px]' : 'px-2 py-0.5 text-[11px]'
      } ${className}`}
      title={`${name} Protocol Status: ${status.toUpperCase()}`}
    >
      {showName && <span className="text-slate-400 font-normal">{name}:</span>}
      {renderIcon()}
      <span>{config.label}</span>
    </span>
  );
};
