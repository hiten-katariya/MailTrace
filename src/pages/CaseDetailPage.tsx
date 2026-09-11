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
import { useParams, useNavigate } from 'react-router-dom';

interface CaseDetailPageProps {
  caseId?: string;
  onBack?: () => void;
  onSelectCase?: (caseId: string) => void;
  onViewCampaign?: (campaignId: string) => void;
}

export const CaseDetailPage: React.FC<CaseDetailPageProps> = ({
  caseId: propCaseId,
  onBack,
  onSelectCase,
  onViewCampaign,
}) => {
  const { caseId: paramCaseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const caseId = propCaseId || paramCaseId || '';

  const handleBack = () => {
    if (onBack) onBack();
    else navigate('/dashboard');
  };

  const handleSelectCase = (id: string) => {
    if (onSelectCase) onSelectCase(id);
    else navigate(`/case/${id}`);
  };

  const handleViewCampaign = (campaignId: string) => {
    if (onViewCampaign) onViewCampaign(campaignId);
    else navigate(`/campaigns?id=${campaignId}`);
  };

  const [activeTab, setActiveTab] = useState<'overview' | 'headers' | 'content' | 'origin' | 'correlation'>('overview');
  const [isReportOpen, setIsReportOpen] = useState(false);

  const { data: caseDetail, isLoading: isDetailLoading } = useQuery({
    queryKey: ['case-detail', caseId],
    queryFn: () => getCaseById(caseId),
    refetchInterval: (query) => {
      const d = query.state.data;
      if (!d) return false;
      const analyzing =
        d.status === 'pending' ||
        d.status === 'processing' ||
        d.verdict_summary === 'Analysis in progress.' ||
        (d.fraud_score === 0 && d.risk_category === 'legitimate' && (!d.score_breakdown || d.score_breakdown.length === 0));
      return analyzing ? 1000 : false;
    },
  });

  const isAnalyzing =
    !caseDetail ||
    caseDetail.status === 'pending' ||
    caseDetail.status === 'processing' ||
    caseDetail.verdict_summary === 'Analysis in progress.' ||
    (caseDetail.fraud_score === 0 && caseDetail.risk_category === 'legitimate' && (!caseDetail.score_breakdown || caseDetail.score_breakdown.length === 0));

  const { data: headers } = useQuery({
    queryKey: ['case-headers', caseId, caseDetail?.verdict_summary],
    queryFn: () => getCaseHeaders(caseId),
    enabled: !!caseDetail,
    refetchInterval: isAnalyzing ? 1500 : false,
  });

  const { data: content } = useQuery({
    queryKey: ['case-content', caseId, caseDetail?.verdict_summary],
    queryFn: () => getCaseContent(caseId),
    enabled: !!caseDetail,
    refetchInterval: isAnalyzing ? 1500 : false,
  });

  const { data: origin } = useQuery({
    queryKey: ['case-origin', caseId, caseDetail?.verdict_summary],
    queryFn: () => getCaseOrigin(caseId),
    enabled: !!caseDetail,
    refetchInterval: isAnalyzing ? 1500 : false,
  });

  const { data: correlation } = useQuery({
    queryKey: ['case-correlation', caseId, caseDetail?.verdict_summary],
    queryFn: () => getCaseCorrelation(caseId),
    enabled: !!caseDetail,
    refetchInterval: isAnalyzing ? 1500 : false,
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
        onBack={handleBack}
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
            onSelectLinkedCase={handleSelectCase}
            onViewCampaign={handleViewCampaign}
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
