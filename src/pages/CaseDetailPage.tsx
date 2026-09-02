import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  getCaseById,
  getCaseHeaders,
  getCaseContent,
  getCaseOrigin,
  getCaseCorrelation,
} from '../mocks/api';
import { CaseHeader } from '../components/case-detail/CaseHeader';
import { OverviewTab } from '../components/case-detail/OverviewTab';
import { HeaderTraceTab } from '../components/case-detail/HeaderTraceTab';
import { ContentTab } from '../components/case-detail/ContentTab';
import { OriginTab } from '../components/case-detail/OriginTab';
import { CorrelationTab } from '../components/case-detail/CorrelationTab';
import { ReportModal } from '../components/case-detail/ReportModal';
import {
  LayoutList,
  Server,
  FileSearch,
  Globe,
  Network,
  RefreshCw,
} from 'lucide-react';

interface CaseDetailPageProps {
  caseId: string;
  onBack: () => void;
  onSelectCase: (caseId: string) => void;
  onViewCampaign: (campaignId: string) => void;
}

export const CaseDetailPage: React.FC<CaseDetailPageProps> = ({
  caseId,
  onBack,
  onSelectCase,
  onViewCampaign,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'headers' | 'content' | 'origin' | 'correlation'>('overview');
  const [isReportOpen, setIsReportOpen] = useState(false);

  const { data: caseDetail, isLoading: isDetailLoading } = useQuery({
    queryKey: ['case-detail', caseId],
    queryFn: () => getCaseById(caseId),
  });

  const { data: headers } = useQuery({
    queryKey: ['case-headers', caseId],
    queryFn: () => getCaseHeaders(caseId),
    enabled: !!caseDetail,
  });

  const { data: content } = useQuery({
    queryKey: ['case-content', caseId],
    queryFn: () => getCaseContent(caseId),
    enabled: !!caseDetail,
  });

  const { data: origin } = useQuery({
    queryKey: ['case-origin', caseId],
    queryFn: () => getCaseOrigin(caseId),
    enabled: !!caseDetail,
  });

  const { data: correlation } = useQuery({
    queryKey: ['case-correlation', caseId],
    queryFn: () => getCaseCorrelation(caseId),
    enabled: !!caseDetail,
  });

  if (isDetailLoading || !caseDetail) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-slate-400 font-mono">
        <RefreshCw className="w-6 h-6 animate-spin text-cyan-400 mb-2" />
        <span className="text-xs tracking-wider">RETRIEVING FORENSIC DOSSIER #{caseId.substring(0, 8).toUpperCase()}...</span>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: '1. OVERVIEW & LEDGER', icon: <LayoutList className="w-3.5 h-3.5" /> },
    { id: 'headers', label: '2. HEADER & RELAY TRACE', icon: <Server className="w-3.5 h-3.5" /> },
    { id: 'content', label: '3. NLP CONTENT ANALYSIS', icon: <FileSearch className="w-3.5 h-3.5" /> },
    { id: 'origin', label: '4. ORIGIN GEO & DOMAIN', icon: <Globe className="w-3.5 h-3.5" /> },
    { id: 'correlation', label: '5. THREAT INTEL & CLUSTERS', icon: <Network className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 space-y-4">
      {/* Case Header */}
      <CaseHeader
        caseDetail={caseDetail}
        onBack={onBack}
        onOpenReport={() => setIsReportOpen(true)}
      />

      {/* Forensic Tabs Bar */}
      <div className="flex border-b border-slate-800/60 overflow-x-auto gap-1 bg-[#0A0F18] p-1 rounded-t">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-1.5 px-3.5 py-2 font-mono text-[11px] font-semibold whitespace-nowrap rounded transition-colors ${
              activeTab === tab.id
                ? 'bg-cyan-500/10 text-cyan-300 border-b-2 border-cyan-400'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === 'overview' && (
          <OverviewTab
            caseDetail={caseDetail}
            headers={headers}
            content={content}
            origin={origin}
            onNavigateTab={(tab) => setActiveTab(tab as any)}
          />
        )}

        {activeTab === 'headers' && headers && (
          <HeaderTraceTab headers={headers} />
        )}

        {activeTab === 'content' && content && (
          <ContentTab content={content} />
        )}

        {activeTab === 'origin' && origin && (
          <OriginTab origin={origin} />
        )}

        {activeTab === 'correlation' && correlation && (
          <CorrelationTab
            correlation={correlation}
            onSelectLinkedCase={onSelectCase}
            onViewCampaign={onViewCampaign}
          />
        )}
      </div>

      {/* Report Modal */}
      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        caseDetail={caseDetail}
        headers={headers}
        content={content}
        origin={origin}
        correlation={correlation}
      />
    </div>
  );
};
