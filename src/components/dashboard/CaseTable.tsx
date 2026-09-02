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

  // Filter cases locally for instant responsive UI
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

  return (
    <div className="bg-soc-panel border border-soc-border rounded-md shadow-soc-card overflow-hidden">
      {/* Table Control & Filter Bar */}
      <div className="p-4 bg-soc-raised/40 border-b border-soc-border flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search sender, subject, domain, or Case ID..."
            className="w-full pl-9 pr-4 py-1.5 bg-soc-inset border border-soc-border focus:border-cyan-500 focus:outline-none rounded text-xs font-mono text-slate-200 placeholder:text-slate-500 transition-colors"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <div className="flex items-center gap-1.5 bg-soc-inset px-2.5 py-1.5 rounded border border-soc-border">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">Threat:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as any)}
              className="bg-transparent text-cyan-300 focus:outline-none cursor-pointer"
            >
              <option value="all">ALL CATEGORIES</option>
              <option value="phishing">PHISHING</option>
              <option value="bec">BEC / IMPERSONATION</option>
              <option value="suspicious">SUSPICIOUS</option>
              <option value="legitimate">LEGITIMATE</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-soc-inset px-2.5 py-1.5 rounded border border-soc-border">
            <Shield className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">Min Score:</span>
            <select
              value={minScoreFilter}
              onChange={(e) => setMinScoreFilter(Number(e.target.value))}
              className="bg-transparent text-cyan-300 focus:outline-none cursor-pointer"
            >
              <option value={0}>0 (Any)</option>
              <option value={40}>≥ 40 (Suspicious+)</option>
              <option value={70}>≥ 70 (High Risk)</option>
              <option value={85}>≥ 85 (Critical)</option>
            </select>
          </div>

          <span className="text-soc-muted px-1">|</span>
          <span className="text-[11px] text-slate-400">
            Showing <strong className="text-slate-200 font-mono">{sortedCases.length}</strong> of {cases.length}
          </span>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-soc-subtle border-b border-soc-border text-[11px] font-mono text-soc-text-dim uppercase tracking-wider">
              <th
                onClick={() => toggleSort('score')}
                className="py-2.5 px-4 cursor-pointer hover:text-slate-200 transition-colors w-36"
              >
                <div className="flex items-center gap-1">
                  <span>Fraud Score</span>
                  {sortBy === 'score' ? (
                    sortOrder === 'desc' ? <ArrowDown className="w-3 h-3 text-cyan-400" /> : <ArrowUp className="w-3 h-3 text-cyan-400" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 text-slate-600" />
                  )}
                </div>
              </th>

              <th className="py-2.5 px-4">Subject & Email Header Info</th>

              <th
                onClick={() => toggleSort('sender')}
                className="py-2.5 px-4 cursor-pointer hover:text-slate-200 transition-colors w-64"
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

              <th className="py-2.5 px-4 w-44">Authentication</th>

              <th
                onClick={() => toggleSort('date')}
                className="py-2.5 px-4 cursor-pointer hover:text-slate-200 transition-colors w-36"
              >
                <div className="flex items-center gap-1">
                  <span>Ingested</span>
                  {sortBy === 'date' ? (
                    sortOrder === 'desc' ? <ArrowDown className="w-3 h-3 text-cyan-400" /> : <ArrowUp className="w-3 h-3 text-cyan-400" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 text-slate-600" />
                  )}
                </div>
              </th>

              <th className="py-2.5 px-4 text-right w-24">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-soc-border/70 text-xs">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400 font-mono">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-cyan-400" />
                  Loading forensic case ledger...
                </td>
              </tr>
            ) : sortedCases.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400 font-mono">
                  No cases match the specified filter criteria.
                </td>
              </tr>
            ) : (
              sortedCases.map((caseItem) => (
                <tr
                  key={caseItem.case_id}
                  onClick={() => onSelectCase(caseItem.case_id)}
                  className="hover:bg-soc-hover/80 transition-colors cursor-pointer group"
                >
                  {/* Score Column */}
                  <td className="py-3 px-4">
                    <ScoreBadge score={caseItem.fraud_score} size="md" showBar />
                  </td>

                  {/* Subject & Category */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2 mb-1">
                      <RiskChip category={caseItem.risk_category} size="sm" />
                      <span className="font-mono text-[10px] text-slate-500">
                        {caseItem.case_id.substring(0, 13)}...
                      </span>
                    </div>
                    <p className="font-semibold text-slate-100 group-hover:text-cyan-300 transition-colors line-clamp-1">
                      {caseItem.subject}
                    </p>
                  </td>

                  {/* Sender */}
                  <td className="py-3 px-4">
                    <span className="font-mono text-xs text-slate-300 break-all">
                      {caseItem.sender}
                    </span>
                  </td>

                  {/* Auth Badges */}
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <ProtocolBadge name="SPF" status={caseItem.spf} size="sm" />
                      <ProtocolBadge name="DKIM" status={caseItem.dkim} size="sm" />
                      <ProtocolBadge name="DMARC" status={caseItem.dmarc} size="sm" />
                    </div>
                  </td>

                  {/* Date */}
                  <td className="py-3 px-4">
                    <div
                      className="font-mono text-[11px] text-slate-300"
                      title={formatUtcDateTime(caseItem.received_at)}
                    >
                      {formatTimeAgo(caseItem.received_at)}
                    </div>
                    <div className="font-mono text-[10px] text-soc-muted">
                      {caseItem.received_at.substring(11, 19)} UTC
                    </div>
                  </td>

                  {/* Action */}
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectCase(caseItem.case_id);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-soc-raised group-hover:bg-cyan-950/80 group-hover:text-cyan-300 group-hover:border-cyan-500/40 border border-soc-border text-slate-400 text-xs font-mono transition-colors"
                    >
                      <span>Triage</span>
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
