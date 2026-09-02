import React from 'react';
import { ShieldAlert, ShieldCheck, AlertTriangle } from 'lucide-react';
import { getRiskLevelFromScore } from '../../lib/riskUtils';

interface ScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showBar?: boolean;
  showIcon?: boolean;
  className?: string;
}

export const ScoreBadge: React.FC<ScoreBadgeProps> = ({
  score,
  size = 'md',
  showBar = false,
  showIcon = true,
  className = '',
}) => {
  const risk = getRiskLevelFromScore(score);

  const getIcon = () => {
    if (score >= 70) return <ShieldAlert className={size === 'lg' ? 'w-6 h-6 text-red-400' : 'w-4 h-4 text-red-400'} />;
    if (score >= 40) return <AlertTriangle className={size === 'lg' ? 'w-6 h-6 text-amber-400' : 'w-4 h-4 text-amber-400'} />;
    return <ShieldCheck className={size === 'lg' ? 'w-6 h-6 text-emerald-400' : 'w-4 h-4 text-emerald-400'} />;
  };

  if (size === 'lg') {
    return (
      <div className={`flex items-center gap-4 p-3.5 bg-soc-raised/90 border ${risk.borderColor} rounded-md shadow-soc-card ${className}`}>
        {/* Large Score Circular Gauge */}
        <div className="relative flex items-center justify-center w-16 h-16 shrink-0">
          <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-slate-800"
              strokeWidth="3.5"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              strokeDasharray={`${score}, 100`}
              stroke={risk.barColor}
              strokeWidth="3.5"
              strokeLinecap="round"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="font-mono text-xl font-bold text-slate-100">{score}</span>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-1.5 mb-1">
            {showIcon && getIcon()}
            <span className={`text-xs font-mono font-semibold uppercase tracking-wider ${risk.textColor}`}>
              {risk.label}
            </span>
          </div>
          <div className="text-[11px] text-soc-text-dim">
            Composite Fraud Index: <span className="font-mono text-slate-200">{score}/100</span>
          </div>
        </div>
      </div>
    );
  }

  if (size === 'sm') {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-xs font-mono ${risk.badgeBg} ${risk.borderColor} ${className}`}>
        {showIcon && getIcon()}
        <span className="font-bold text-slate-100">{score}</span>
        <span className="text-[10px] text-soc-muted">/100</span>
      </div>
    );
  }

  // Default 'md' size
  return (
    <div className={`inline-flex flex-col gap-1 ${className}`}>
      <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded border font-mono text-xs ${risk.badgeBg} ${risk.borderColor}`}>
        {showIcon && getIcon()}
        <span className="font-bold text-slate-100 text-sm">{score}</span>
        <span className="text-[11px] text-soc-muted">/100</span>
        <span className={`text-[11px] font-sans font-medium uppercase tracking-wider pl-1 border-l border-slate-700/60 ${risk.textColor}`}>
          {risk.label.split(' / ')[0]}
        </span>
      </div>
      {showBar && (
        <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
          <div
            className="h-full transition-all duration-300 rounded-full"
            style={{ width: `${Math.max(score, 4)}%`, backgroundColor: risk.barColor }}
          />
        </div>
      )}
    </div>
  );
};
