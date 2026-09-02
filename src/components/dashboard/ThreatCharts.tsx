import React from 'react';
import { CaseSummary } from '../../types/case';
import { EvidenceCard } from '../common/EvidenceCard';

interface ThreatChartsProps {
  cases: CaseSummary[];
}

export const ThreatCharts: React.FC<ThreatChartsProps> = ({ cases }) => {
  const total = cases.length || 1;

  // Category counts
  const phishingCount = cases.filter((c) => c.risk_category === 'phishing').length;
  const becCount = cases.filter((c) => c.risk_category === 'bec').length;
  const suspiciousCount = cases.filter((c) => c.risk_category === 'suspicious').length;
  const legitCount = cases.filter((c) => c.risk_category === 'legitimate').length;

  const categories = [
    {
      name: 'PHISHING',
      count: phishingCount,
      pct: Math.round((phishingCount / total) * 100),
      color: '#EF4444',
      bgBar: 'bg-red-500',
    },
    {
      name: 'BEC / IMPERSONATION',
      count: becCount,
      pct: Math.round((becCount / total) * 100),
      color: '#F43F5E',
      bgBar: 'bg-rose-500',
    },
    {
      name: 'SUSPICIOUS ANOMALY',
      count: suspiciousCount,
      pct: Math.round((suspiciousCount / total) * 100),
      color: '#F59E0B',
      bgBar: 'bg-amber-500',
    },
    {
      name: 'LEGITIMATE VERIFIED',
      count: legitCount,
      pct: Math.round((legitCount / total) * 100),
      color: '#10B981',
      bgBar: 'bg-emerald-500',
    },
  ];

  // Score brackets
  const scoreBrackets = [
    {
      tier: 'LEGITIMATE',
      range: '0–20',
      count: cases.filter((c) => c.fraud_score <= 20).length,
      color: '#10B981',
      borderClass: 'border-emerald-500/30',
      bgClass: 'bg-emerald-500/10',
      textClass: 'text-emerald-400',
    },
    {
      tier: 'LOW RISK',
      range: '21–50',
      count: cases.filter((c) => c.fraud_score > 20 && c.fraud_score <= 50).length,
      color: '#38BDF8',
      borderClass: 'border-sky-500/30',
      bgClass: 'bg-sky-500/10',
      textClass: 'text-sky-400',
    },
    {
      tier: 'SUSPICIOUS',
      range: '51–80',
      count: cases.filter((c) => c.fraud_score > 50 && c.fraud_score <= 80).length,
      color: '#F59E0B',
      borderClass: 'border-amber-500/30',
      bgClass: 'bg-amber-500/10',
      textClass: 'text-amber-400',
    },
    {
      tier: 'CRITICAL HIGH',
      range: '81–100',
      count: cases.filter((c) => c.fraud_score > 80).length,
      color: '#EF4444',
      borderClass: 'border-red-500/30',
      bgClass: 'bg-red-500/10',
      textClass: 'text-red-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
      {/* Chart 1: Refined Horizontal Distribution */}
      <EvidenceCard
        title="Threat Vector Classification"
        subtitle="Distribution of detected threat archetypes across NLP & heuristic models"
      >
        <div className="space-y-3 py-1">
          {categories.map((cat) => (
            <div key={cat.name} className="space-y-1">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-300 font-medium tracking-wider">{cat.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">{cat.count} cases</span>
                  <span className="font-bold text-slate-200 w-10 text-right">{cat.pct}%</span>
                </div>
              </div>
              <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full ${cat.bgBar} transition-all duration-500 rounded-full`}
                  style={{ width: `${Math.max(cat.pct, 3)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </EvidenceCard>

      {/* Chart 2: Modern Fraud Score Spectrum */}
      <EvidenceCard
        title="Fraud Score Spectrum"
        subtitle="Aggregated risk severity continuum across active corpus"
      >
        <div className="py-1 space-y-4">
          {/* Continuous Multi-segment Spectrum Bar */}
          <div>
            <div className="flex justify-between text-[10px] font-mono text-soc-muted mb-1">
              <span>0</span>
              <span>20</span>
              <span>50</span>
              <span>80</span>
              <span>100</span>
            </div>
            <div className="w-full h-2 rounded-full overflow-hidden flex bg-slate-800/80 p-0.5 gap-0.5">
              {scoreBrackets.map((bracket) => {
                const widthPct = Math.max((bracket.count / total) * 100, 8);
                return (
                  <div
                    key={bracket.tier}
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${widthPct}%`,
                      backgroundColor: bracket.color,
                    }}
                    title={`${bracket.tier}: ${bracket.count} cases (${bracket.range})`}
                  />
                );
              })}
            </div>
          </div>

          {/* Spectrum Legend Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-xs">
            {scoreBrackets.map((bracket) => (
              <div
                key={bracket.tier}
                className={`p-2 rounded border ${bracket.borderClass} ${bracket.bgClass} flex flex-col justify-between`}
              >
                <div className="flex items-center justify-between text-[9px] uppercase tracking-wider text-slate-400 mb-1">
                  <span>{bracket.range}</span>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: bracket.color }} />
                </div>
                <div className={`text-base font-bold ${bracket.textClass} leading-none`}>
                  {bracket.count}
                </div>
                <div className="text-[10px] text-slate-300 font-sans mt-1 truncate">
                  {bracket.tier}
                </div>
              </div>
            ))}
          </div>
        </div>
      </EvidenceCard>
    </div>
  );
};
