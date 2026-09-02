import React, { useState } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Shield,
  RefreshCw,
  X,
} from 'lucide-react';
import { CaseSummary, RiskCategory } from '../../types/case';
import { ScoreBadge } from '../common/ScoreBadge';
import { RiskChip } from '../common/RiskChip';
import { ProtocolBadge } from '../common/ProtocolBadge';
import { formatTimeAgo, formatUtcDateTime } from '../../lib/formatters';

interface CaseTableProps {
  cases: CaseSummary[];
  onSelectCase: (caseId: string) => void;
  isLoading?: boolean;
}

export const CaseTable: React.FC<CaseTableProps> = ({
  cases,
  onSelectCase,
  isLoading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<RiskCategory | 'all'>('all');
  const [minScoreFilter, setMinScoreFilter] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'date' | 'score' | 'sender'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filter cases
  const filteredCases = cases.filter((c) => {
    const matchesSearch =
      searchTerm.trim() === '' ||
      c.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.sender.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.case_id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      categoryFilter === 'all' || c.risk_category === categoryFilter;

    const matchesScore = c.fraud_score >= minScoreFilter;

    return matchesSearch && matchesCategory && matchesScore;
  });

  // Sort cases
  const sortedCases = [...filteredCases].sort((a, b) => {
    let comp = 0;
    if (sortBy === 'score') {
      comp = a.fraud_score - b.fraud_score;
    } else if (sortBy === 'sender') {
      comp = a.sender.localeCompare(b.sender);
    } else {
      comp = new Date(a.received_at).getTime() - new Date(b.received_at).getTime();
    }
    return sortOrder === 'asc' ? comp : -comp;
  });

  const toggleSort = (column: 'date' | 'score' | 'sender') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const hasActiveFilters = searchTerm !== '' || categoryFilter !== 'all' || minScoreFilter > 0;

  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('all');
    setMinScoreFilter(0);
  };

  return (
    <div className="bg-soc-panel border border-slate-800/60 rounded shadow-soc-card overflow-hidden">
      {/* 1. Command Bar Search & Filters */}
      <div className="p-3 bg-soc-raised/40 border-b border-slate-800/60 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1 max-w-lg">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search sender, domain, IP, subject, or Case ID..."
            className="w-full pl-8 pr-4 py-1.5 bg-soc-inset border border-slate-800/60 focus:border-cyan-500/80 focus:outline-none rounded text-xs font-mono text-slate-200 placeholder:text-slate-500 transition-colors"
          />
        </div>

        {/* Filter dropdowns & Active Chips */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <div className="flex items-center gap-1.5 bg-soc-inset px-2 py-1 rounded border border-slate-800/60">
            <Filter className="w-3 h-3 text-slate-400" />
            <span className="text-slate-400 text-[11px]">Threat:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as any)}
              className="bg-transparent text-cyan-300 focus:outline-none cursor-pointer text-xs uppercase"
            >
              <option value="all">ALL</option>
              <option value="phishing">PHISHING</option>
              <option value="bec">BEC</option>
              <option value="suspicious">SUSPICIOUS</option>
              <option value="legitimate">LEGITIMATE</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-soc-inset px-2 py-1 rounded border border-slate-800/60">
            <Shield className="w-3 h-3 text-slate-400" />
            <span className="text-slate-400 text-[11px]">Score:</span>
            <select
              value={minScoreFilter}
              onChange={(e) => setMinScoreFilter(Number(e.target.value))}
              className="bg-transparent text-cyan-300 focus:outline-none cursor-pointer text-xs"
            >
              <option value={0}>≥ 0 (All)</option>
              <option value={40}>≥ 40 (Suspicious)</option>
              <option value={70}>≥ 70 (High Risk)</option>
              <option value={85}>≥ 85 (Critical)</option>
            </select>
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-[11px] transition-colors"
            >
              <X className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}

          <span className="text-slate-700 px-1 hidden sm:inline">|</span>
          <span className="text-[10px] text-slate-400">
            <strong className="text-slate-200 font-mono">{sortedCases.length}</strong> cases matching
          </span>
        </div>
      </div>

      {/* 2. Main SOC Incident Queue Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-soc-subtle border-b border-slate-800/60 text-[10px] font-mono text-soc-text-dim uppercase tracking-wider">
              <th
                onClick={() => toggleSort('score')}
                className="py-2 px-3.5 cursor-pointer hover:text-slate-200 transition-colors w-32"
              >
                <div className="flex items-center gap-1">
                  <span>Score / Risk</span>
                  {sortBy === 'score' ? (
                    sortOrder === 'desc' ? <ArrowDown className="w-3 h-3 text-cyan-400" /> : <ArrowUp className="w-3 h-3 text-cyan-400" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 text-slate-600" />
                  )}
                </div>
              </th>

              <th className="py-2 px-3.5 w-32">Case ID</th>
              <th className="py-2 px-3.5">Subject Line</th>
              
              <th
                onClick={() => toggleSort('sender')}
                className="py-2 px-3.5 cursor-pointer hover:text-slate-200 transition-colors w-52"
              >
                <div className="flex items-center gap-1">
                  <span>Sender Envelope</span>
                  {sortBy === 'sender' ? (
                    sortOrder === 'desc' ? <ArrowDown className="w-3 h-3 text-cyan-400" /> : <ArrowUp className="w-3 h-3 text-cyan-400" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 text-slate-600" />
                  )}
                </div>
              </th>

              <th className="py-2 px-3.5 w-44">Authentication (SPF/DKIM/DMARC)</th>

              <th
                onClick={() => toggleSort('date')}
                className="py-2 px-3.5 cursor-pointer hover:text-slate-200 transition-colors w-28"
              >
                <div className="flex items-center gap-1">
                  <span>Timestamp</span>
                  {sortBy === 'date' ? (
                    sortOrder === 'desc' ? <ArrowDown className="w-3 h-3 text-cyan-400" /> : <ArrowUp className="w-3 h-3 text-cyan-400" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 text-slate-600" />
                  )}
                </div>
              </th>

              <th className="py-2 px-3.5 text-right w-20">Triage</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800/40 text-xs font-sans">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400 font-mono">
                  <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2 text-cyan-400" />
                  Polling forensic queue...
                </td>
              </tr>
            ) : sortedCases.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-slate-400 font-mono text-xs">
                  No cases match the specified investigation filters.
                </td>
              </tr>
            ) : (
              sortedCases.map((caseItem) => (
                <tr
                  key={caseItem.case_id}
                  onClick={() => onSelectCase(caseItem.case_id)}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') onSelectCase(caseItem.case_id);
                  }}
                  className="hover:bg-soc-hover/50 transition-colors cursor-pointer group focus:outline-none focus:bg-soc-hover/70"
                >
                  {/* Score & Category Column */}
                  <td className="py-2.5 px-3.5">
                    <ScoreBadge score={caseItem.fraud_score} size="md" showBar />
                  </td>

                  {/* Case ID */}
                  <td className="py-2.5 px-3.5">
                    <span className="font-mono text-[11px] text-slate-400 group-hover:text-cyan-300 transition-colors">
                      {caseItem.case_id.substring(0, 11)}..
                    </span>
                  </td>

                  {/* Subject */}
                  <td className="py-2.5 px-3.5">
                    <div className="flex items-center gap-2 mb-0.5">
                      <RiskChip category={caseItem.risk_category} size="sm" />
                    </div>
                    <p className="font-medium text-slate-100 group-hover:text-cyan-200 transition-colors line-clamp-1 text-xs">
                      {caseItem.subject}
                    </p>
                  </td>

                  {/* Sender */}
                  <td className="py-2.5 px-3.5">
                    <span className="font-mono text-[11px] text-slate-300 break-all">
                      {caseItem.sender}
                    </span>
                  </td>

                  {/* Auth Badges */}
                  <td className="py-2.5 px-3.5">
                    <div className="flex flex-wrap items-center gap-1">
                      <ProtocolBadge name="SPF" status={caseItem.spf} size="sm" />
                      <ProtocolBadge name="DKIM" status={caseItem.dkim} size="sm" />
                      <ProtocolBadge name="DMARC" status={caseItem.dmarc} size="sm" />
                    </div>
                  </td>

                  {/* Date */}
                  <td className="py-2.5 px-3.5 font-mono text-[11px]">
                    <div className="text-slate-300" title={formatUtcDateTime(caseItem.received_at)}>
                      {formatTimeAgo(caseItem.received_at)}
                    </div>
                    <div className="text-[9px] text-soc-muted">
                      {caseItem.received_at.substring(11, 16)} UTC
                    </div>
                  </td>

                  {/* Action */}
                  <td className="py-2.5 px-3.5 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectCase(caseItem.case_id);
                      }}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded bg-soc-inset group-hover:bg-cyan-500/15 group-hover:text-cyan-300 border border-slate-800/60 group-hover:border-cyan-500/30 text-slate-400 text-[11px] font-mono transition-colors"
                    >
                      <span>Open</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
