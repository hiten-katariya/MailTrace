import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import { CaseSummary } from '../../types/case';
import { EvidenceCard } from '../common/EvidenceCard';

interface ThreatChartsProps {
  cases: CaseSummary[];
}

export const ThreatCharts: React.FC<ThreatChartsProps> = ({ cases }) => {
  // Classification breakdown
  const counts = {
    phishing: cases.filter((c) => c.risk_category === 'phishing').length,
    bec: cases.filter((c) => c.risk_category === 'bec').length,
    suspicious: cases.filter((c) => c.risk_category === 'suspicious').length,
    legitimate: cases.filter((c) => c.risk_category === 'legitimate').length,
  };

  const categoryData = [
    { name: 'Phishing', count: counts.phishing, color: '#EF4444' },
    { name: 'BEC / Impersonation', count: counts.bec, color: '#F43F5E' },
    { name: 'Suspicious', count: counts.suspicious, color: '#F59E0B' },
    { name: 'Legitimate', count: counts.legitimate, color: '#10B981' },
  ];

  // Score distribution brackets
  const scoreBrackets = [
    { range: '0-20', count: cases.filter((c) => c.fraud_score <= 20).length, color: '#10B981' },
    { range: '21-50', count: cases.filter((c) => c.fraud_score > 20 && c.fraud_score <= 50).length, color: '#38BDF8' },
    { range: '51-80', count: cases.filter((c) => c.fraud_score > 50 && c.fraud_score <= 80).length, color: '#F59E0B' },
    { range: '81-100', count: cases.filter((c) => c.fraud_score > 80).length, color: '#EF4444' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
      {/* Chart 1: Category Distribution */}
      <EvidenceCard
        title="Threat Vector Classification"
        subtitle="Distribution of detected threats across NLP and heuristic models"
      >
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={categoryData}
              layout="vertical"
              margin={{ top: 10, right: 20, left: 40, bottom: 5 }}
            >
              <XAxis type="number" stroke="#64748B" fontSize={11} tickLine={false} />
              <YAxis
                type="category"
                dataKey="name"
                stroke="#94A3B8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0F172A',
                  borderColor: '#334155',
                  color: '#F8FAFC',
                  fontSize: '12px',
                  borderRadius: '4px',
                }}
                cursor={{ fill: 'rgba(51, 65, 85, 0.2)' }}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={16}>
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </EvidenceCard>

      {/* Chart 2: Fraud Score Severity Distribution */}
      <EvidenceCard
        title="Fraud Score Spectrum"
        subtitle="Aggregated risk severity across ingested email corpus"
      >
        <div className="h-48 w-full flex items-center">
          <div className="w-1/2 h-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={scoreBrackets}
                  dataKey="count"
                  nameKey="range"
                  cx="50%"
                  cy="50%"
                  innerRadius={36}
                  outerRadius={58}
                  stroke="#0F172A"
                  strokeWidth={2}
                >
                  {scoreBrackets.map((entry, index) => (
                    <Cell key={`pie-cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    color: '#F8FAFC',
                    fontSize: '12px',
                    borderRadius: '4px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="w-1/2 pl-2 space-y-2 text-xs font-mono">
            {scoreBrackets.map((item) => (
              <div key={item.range} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-300">Score {item.range}</span>
                </div>
                <span className="font-bold text-slate-100">{item.count} cases</span>
              </div>
            ))}
          </div>
        </div>
      </EvidenceCard>
    </div>
  );
};
