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
    <div className={`bg-soc-panel border border-soc-border rounded-md shadow-soc-subtle overflow-hidden ${className}`}>
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-soc-raised/60 border-b border-soc-border">
        <div className="flex items-center gap-2.5">
          <div className="w-1.5 h-3.5 bg-cyber-cyan/80 rounded-full" />
          <div>
            <h3 className="text-sm font-semibold text-slate-100 tracking-wide">{title}</h3>
            {subtitle && <p className="text-[11px] text-soc-text-dim mt-0.5">{subtitle}</p>}
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
