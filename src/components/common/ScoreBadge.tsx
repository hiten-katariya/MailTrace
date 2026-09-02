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
    if (score >= 70) return <ShieldAlert className={size === 'lg' ? 'w-5 h-5 text-red-400' : 'w-3.5 h-3.5 text-red-400'} />;
    if (score >= 40) return <AlertTriangle className={size === 'lg' ? 'w-5 h-5 text-amber-400' : 'w-3.5 h-3.5 text-amber-400'} />;
    return <ShieldCheck className={size === 'lg' ? 'w-5 h-5 text-emerald-400' : 'w-3.5 h-3.5 text-emerald-400'} />;
  };

  if (size === 'lg') {
    return (
      <div className={`flex items-center gap-4 p-3 bg-soc-panel border border-slate-800/60 rounded relative overflow-hidden shadow-soc-card ${className}`}>
        {/* Subtle accent line on top */}
        <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ backgroundColor: risk.barColor }} />

        {/* Circular Gauge */}
        <div className="relative flex items-center justify-center w-14 h-14 shrink-0">
          <svg className="w-14 h-14 -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-slate-800/80"
              strokeWidth="3"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              strokeDasharray={`${score}, 100`}
              stroke={risk.barColor}
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="font-mono text-lg font-bold text-slate-100 leading-none">{score}</span>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            {showIcon && getIcon()}
            <span className={`text-[11px] font-mono font-bold uppercase tracking-wider ${risk.textColor}`}>
              {risk.label}
            </span>
          </div>
          <div className="text-[10px] font-mono text-soc-muted">
            INDEX: <span className="text-slate-300 font-semibold">{score}/100</span> • EXPLAINABLE
          </div>
        </div>
      </div>
    );
  }

  if (size === 'sm') {
    return (
      <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[11px] font-mono ${risk.badgeBg} ${risk.borderColor} ${className}`}>
        {showIcon && getIcon()}
        <span className="font-bold text-slate-100">{score}</span>
        <span className="text-[9px] text-soc-muted">/100</span>
      </div>
    );
  }

  // Default 'md' size
  return (
    <div className={`inline-flex flex-col gap-1 ${className}`}>
      <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border font-mono text-xs ${risk.badgeBg} ${risk.borderColor}`}>
        {showIcon && getIcon()}
        <span className="font-bold text-slate-100">{score}</span>
        <span className="text-[10px] text-soc-muted">/100</span>
        <span className={`text-[10px] font-sans font-semibold uppercase tracking-wider pl-1.5 border-l border-slate-700/60 ${risk.textColor}`}>
          {risk.label}
        </span>
      </div>
      {showBar && (
        <div className="w-full bg-slate-800/80 h-1 rounded-full overflow-hidden">
          <div
            className="h-full transition-all duration-300 rounded-full"
            style={{ width: `${Math.max(score, 4)}%`, backgroundColor: risk.barColor }}
          />
        </div>
      )}
    </div>
  );
};
