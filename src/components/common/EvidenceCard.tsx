import React from 'react';

interface EvidenceCardProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}

export const EvidenceCard: React.FC<EvidenceCardProps> = ({
  title,
  subtitle,
  badge,
  headerAction,
  children,
  className = '',
  bodyClassName = 'p-4',
}) => {
  return (
    <div className={`bg-soc-panel border border-slate-800/60 rounded overflow-hidden shadow-soc-card ${className}`}>
      {/* Header bar */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-soc-raised/40 border-b border-slate-800/60">
        <div className="flex items-center gap-2">
          <div className="w-1 h-3 bg-cyber-cyan rounded-full" />
          <div>
            <h3 className="text-xs font-mono font-bold text-slate-100 uppercase tracking-wider">{title}</h3>
            {subtitle && <p className="text-[10px] text-soc-text-dim mt-0.2">{subtitle}</p>}
          </div>
          {badge && <div className="ml-2">{badge}</div>}
        </div>
        {headerAction && <div className="flex items-center gap-2">{headerAction}</div>}
      </div>

      {/* Card Content */}
      <div className={bodyClassName}>{children}</div>
    </div>
  );
};
