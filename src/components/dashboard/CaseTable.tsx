import React, { useState, useEffect } from 'react';
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
  Trash2,
  CheckSquare,
  Square,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import { CaseSummary, RiskCategory } from '../../types/case';
import { ScoreBadge } from '../common/ScoreBadge';
import { RiskChip } from '../common/RiskChip';
import { ProtocolBadge } from '../common/ProtocolBadge';
import { formatTimeAgo, formatUtcDateTime } from '../../lib/formatters';

interface CaseTableProps {
  cases: CaseSummary[];
  onSelectCase: (caseId: string) => void;
  onDeleteCase?: (caseId: string) => void;
  onDeleteCases?: (caseIds: string[]) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  isLoading?: boolean;
}

export const CaseTable: React.FC<CaseTableProps> = ({
  cases,
  onSelectCase,
  onDeleteCase,
  onDeleteCases,
  onRefresh,
  isRefreshing = false,
  isLoading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<RiskCategory | 'all'>('all');
  const [minScoreFilter, setMinScoreFilter] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'date' | 'score' | 'sender'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pagination state (default: 10 per page as requested)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  // Selected row IDs for batch actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Confirmation modal state
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<{
    type: 'single' | 'batch' | 'page';
    caseId?: string;
    caseSubject?: string;
    count: number;
    caseIds: string[];
  } | null>(null);

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

  // Calculate pagination
  const totalPages = Math.max(1, Math.ceil(sortedCases.length / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);

  // Reset page to 1 when filters or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, minScoreFilter, sortBy, sortOrder]);

  // Current page records slice
  const startIndex = (validCurrentPage - 1) * pageSize;
  const paginatedCases = sortedCases.slice(startIndex, startIndex + pageSize);

  // Header checkbox status for the current 10 visible items
  const isAllPageSelected =
    paginatedCases.length > 0 &&
    paginatedCases.every((c) => selectedIds.has(c.case_id));

  const isSomePageSelected =
    paginatedCases.some((c) => selectedIds.has(c.case_id)) && !isAllPageSelected;

  const toggleSelectAllPage = () => {
    const next = new Set(selectedIds);
    if (isAllPageSelected) {
      paginatedCases.forEach((c) => next.delete(c.case_id));
    } else {
      paginatedCases.forEach((c) => next.add(c.case_id));
    }
    setSelectedIds(next);
  };

  const toggleSelectCase = (caseId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(selectedIds);
    if (next.has(caseId)) {
      next.delete(caseId);
    } else {
      next.add(caseId);
    }
    setSelectedIds(next);
  };

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

  // Trigger single case deletion dialog
  const handleInitiateDeleteSingle = (c: CaseSummary, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirmTarget({
      type: 'single',
      caseId: c.case_id,
      caseSubject: c.subject,
      count: 1,
      caseIds: [c.case_id],
    });
  };

  // Trigger bulk page deletion dialog (deleting all 10 on page)
  const handleInitiateDeletePage = () => {
    const pageIds = paginatedCases.map((c) => c.case_id);
    if (pageIds.length === 0) return;
    setDeleteConfirmTarget({
      type: 'page',
      count: pageIds.length,
      caseIds: pageIds,
    });
  };

  // Trigger selected cases deletion dialog
  const handleInitiateDeleteSelected = () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setDeleteConfirmTarget({
      type: 'batch',
      count: ids.length,
      caseIds: ids,
    });
  };

  // Execute deletion confirmed by user
  const handleExecuteDelete = () => {
    if (!deleteConfirmTarget) return;

    if (deleteConfirmTarget.type === 'single' && deleteConfirmTarget.caseId) {
      onDeleteCase?.(deleteConfirmTarget.caseId);
      const next = new Set(selectedIds);
      next.delete(deleteConfirmTarget.caseId);
      setSelectedIds(next);
    } else {
      onDeleteCases?.(deleteConfirmTarget.caseIds);
      const next = new Set(selectedIds);
      deleteConfirmTarget.caseIds.forEach((id) => next.delete(id));
      setSelectedIds(next);
    }

    setDeleteConfirmTarget(null);
  };

  return (
    <div className="bg-soc-panel border border-slate-800/60 rounded shadow-soc-card overflow-hidden">
      {/* 1. Command Bar Search, Filters & Bulk Actions */}
      <div className="p-3 bg-soc-raised/40 border-b border-slate-800/60 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
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

        {/* Filter dropdowns & Bulk Deletion controls */}
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

          {/* Bulk Page / Selection Delete Actions */}
          <span className="text-slate-700 px-1 hidden sm:inline">|</span>

          {selectedIds.size > 0 ? (
            <button
              onClick={handleInitiateDeleteSelected}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 text-[11px] font-mono transition-colors shadow-sm"
              title={`Delete ${selectedIds.size} selected case(s)`}
            >
              <Trash2 className="w-3 h-3 text-rose-400" />
              <span>Delete Selected ({selectedIds.size})</span>
            </button>
          ) : (
            paginatedCases.length > 0 && (
              <button
                onClick={handleInitiateDeletePage}
                className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-800/60 hover:bg-rose-500/20 border border-slate-700 hover:border-rose-500/40 text-slate-300 hover:text-rose-300 text-[11px] font-mono transition-colors"
                title="Delete all emails on the current page"
              >
                <Trash2 className="w-3 h-3 text-rose-400" />
                <span>Delete Page ({paginatedCases.length})</span>
              </button>
            )
          )}

          <span className="text-[10px] text-slate-400 ml-1">
            <strong className="text-slate-200 font-mono">{sortedCases.length}</strong> total
          </span>

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing || isLoading}
              className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 text-[11px] font-mono transition-colors disabled:opacity-50 ml-1"
              title="Refresh case table"
            >
              <RefreshCw className={`w-3 h-3 text-cyan-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Main SOC Incident Queue Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-soc-subtle border-b border-slate-800/60 text-[10px] font-mono text-soc-text-dim uppercase tracking-wider">
              {/* Checkbox column */}
              <th className="py-2 px-3 w-10 text-center">
                <button
                  type="button"
                  onClick={toggleSelectAllPage}
                  className="text-slate-400 hover:text-cyan-400 transition-colors focus:outline-none"
                  title={isAllPageSelected ? 'Deselect all on this page' : 'Select all 10 on this page'}
                >
                  {isAllPageSelected ? (
                    <CheckSquare className="w-3.5 h-3.5 text-cyan-400" />
                  ) : isSomePageSelected ? (
                    <div className="w-3.5 h-3.5 border border-cyan-500 rounded flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-cyan-400 rounded-sm" />
                    </div>
                  ) : (
                    <Square className="w-3.5 h-3.5 text-slate-500" />
                  )}
                </button>
              </th>

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

              <th className="py-2 px-3.5 text-right w-28">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800/40 text-xs font-sans">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400 font-mono">
                  <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2 text-cyan-400" />
                  Polling forensic queue...
                </td>
              </tr>
            ) : paginatedCases.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-10 text-center text-slate-400 font-mono text-xs">
                  No cases match the specified investigation filters.
                </td>
              </tr>
            ) : (
              paginatedCases.map((caseItem) => {
                const isSelected = selectedIds.has(caseItem.case_id);
                return (
                  <tr
                    key={caseItem.case_id}
                    onClick={() => onSelectCase(caseItem.case_id)}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') onSelectCase(caseItem.case_id);
                    }}
                    className={`hover:bg-soc-hover/50 transition-colors cursor-pointer group focus:outline-none focus:bg-soc-hover/70 ${
                      isSelected ? 'bg-cyan-950/20' : ''
                    }`}
                  >
                    {/* Row Checkbox */}
                    <td className="py-2.5 px-3 text-center" onClick={(e) => toggleSelectCase(caseItem.case_id, e)}>
                      <button
                        type="button"
                        className="text-slate-500 hover:text-cyan-400 transition-colors focus:outline-none"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-3.5 h-3.5 text-cyan-400" />
                        ) : (
                          <Square className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400" />
                        )}
                      </button>
                    </td>

                    {/* Score & Category Column */}
                    <td className="py-2.5 px-3.5">
                      <ScoreBadge score={caseItem.fraud_score} riskCategory={caseItem.risk_category} size="md" showBar />
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
                        {caseItem.source === 'gmail' ? (
                          <span
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-red-500/10 text-red-400 border border-red-500/20"
                            title={caseItem.gmail_account ? `From Gmail: ${caseItem.gmail_account}` : 'Ingested from Gmail Live Scanning'}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                            GMAIL
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-800/80 text-slate-400 border border-slate-700/60"
                            title="Ingested via manual .eml file upload"
                          >
                            UPLOAD
                          </span>
                        )}
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

                    {/* Action Buttons: Open & Delete */}
                    <td className="py-2.5 px-3.5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectCase(caseItem.case_id);
                          }}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-soc-inset group-hover:bg-cyan-500/15 group-hover:text-cyan-300 border border-slate-800/60 group-hover:border-cyan-500/30 text-slate-400 text-[11px] font-mono transition-colors"
                          title="Open Case Dossier"
                        >
                          <span>Open</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>

                        <button
                          onClick={(e) => handleInitiateDeleteSingle(caseItem, e)}
                          className="p-1 rounded bg-soc-inset hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 border border-slate-800/60 hover:border-rose-500/30 transition-colors"
                          title="Delete this scanned email"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 3. 10-Item Page Viewer Navigation Bar */}
      <div className="p-3 bg-soc-raised/40 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
        <div className="text-slate-400 text-[11px]">
          Showing{' '}
          <span className="text-slate-200 font-bold">
            {sortedCases.length === 0 ? 0 : startIndex + 1}
          </span>
          –
          <span className="text-slate-200 font-bold">
            {Math.min(startIndex + pageSize, sortedCases.length)}
          </span>{' '}
          of <span className="text-slate-200 font-bold">{sortedCases.length}</span> emails (Page{' '}
          <span className="text-cyan-300 font-bold">{validCurrentPage}</span> of{' '}
          <span className="text-slate-200 font-bold">{totalPages}</span>)
        </div>

        <div className="flex items-center gap-1.5">
          {/* Previous Page Button */}
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={validCurrentPage <= 1}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-soc-inset border border-slate-800/60 text-slate-300 hover:text-cyan-300 hover:border-cyan-500/40 disabled:opacity-40 disabled:cursor-not-allowed text-[11px] transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Prev</span>
          </button>

          {/* Page Number Pills */}
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((page) => {
                // Show first, last, and window around current
                return (
                  page === 1 ||
                  page === totalPages ||
                  Math.abs(page - validCurrentPage) <= 1
                );
              })
              .map((page, idx, arr) => {
                const prev = arr[idx - 1];
                const showEllipsis = prev && page - prev > 1;

                return (
                  <React.Fragment key={page}>
                    {showEllipsis && (
                      <span className="px-1 text-slate-600 text-xs select-none">...</span>
                    )}
                    <button
                      onClick={() => setCurrentPage(page)}
                      className={`min-w-[28px] h-7 px-2 rounded text-[11px] font-mono transition-colors ${
                        page === validCurrentPage
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-bold shadow-sm'
                          : 'bg-soc-inset text-slate-400 hover:text-slate-200 border border-slate-800/60 hover:border-slate-700'
                      }`}
                    >
                      {page}
                    </button>
                  </React.Fragment>
                );
              })}
          </div>

          {/* Next Page Button */}
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={validCurrentPage >= totalPages}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-soc-inset border border-slate-800/60 text-slate-300 hover:text-cyan-300 hover:border-cyan-500/40 disabled:opacity-40 disabled:cursor-not-allowed text-[11px] transition-colors"
          >
            <span>Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 4. Delete Confirmation Modal */}
      {deleteConfirmTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div
            className="bg-soc-panel border border-rose-500/50 rounded-lg shadow-2xl max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-mono font-bold text-slate-100">
                  {deleteConfirmTarget.type === 'single'
                    ? 'Delete Scanned Email'
                    : deleteConfirmTarget.type === 'page'
                    ? `Delete All ${deleteConfirmTarget.count} Emails On This Page`
                    : `Delete ${deleteConfirmTarget.count} Selected Emails`}
                </h3>
                <p className="text-xs text-slate-400 mt-1 font-sans">
                  {deleteConfirmTarget.type === 'single' ? (
                    <>
                      Are you sure you want to permanently delete case{' '}
                      <span className="font-mono text-cyan-300">{deleteConfirmTarget.caseId}</span> (
                      <span className="text-slate-200">{deleteConfirmTarget.caseSubject}</span>)?
                    </>
                  ) : (
                    <>
                      Are you sure you want to permanently delete all{' '}
                      <span className="font-mono font-bold text-rose-300">
                        {deleteConfirmTarget.count}
                      </span>{' '}
                      scanned emails from the forensic triage queue?
                    </>
                  )}
                </p>
                <div className="text-[11px] text-rose-400/90 font-mono mt-2 bg-rose-950/30 p-2 rounded border border-rose-500/20">
                  ⚠️ This will permanently remove all associated header telemetry, IP traces, attachment scans, and forensic findings. This action cannot be undone.
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800/60 font-mono text-xs">
              <button
                type="button"
                onClick={() => setDeleteConfirmTarget(null)}
                className="px-3 py-1.5 rounded bg-soc-raised hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold transition-colors shadow-lg shadow-rose-950/50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>
                  {deleteConfirmTarget.count > 1
                    ? `Delete ${deleteConfirmTarget.count} Cases`
                    : 'Delete Case'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
