import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCampaigns, getCampaignById } from '../mocks/api';
import { CampaignCard } from '../components/campaign/CampaignCard';
import { CampaignClusterTimeline } from '../components/campaign/CampaignClusterTimeline';
import { Layers, RefreshCw, Network } from 'lucide-react';

interface CampaignPageProps {
  initialCampaignId?: string;
  onSelectCase: (caseId: string) => void;
}

export const CampaignPage: React.FC<CampaignPageProps> = ({
  initialCampaignId,
  onSelectCase,
}) => {
  const { data: campaignsData, isLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: getCampaigns,
  });

  const campaigns = campaignsData?.campaigns || [];
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(
    initialCampaignId || 'camp-3391'
  );

  useEffect(() => {
    if (initialCampaignId) {
      setSelectedCampaignId(initialCampaignId);
    } else if (campaigns.length > 0 && !selectedCampaignId) {
      setSelectedCampaignId(campaigns[0].campaign_id);
    }
  }, [initialCampaignId, campaigns]);

  const { data: campaignDetail, isLoading: isDetailLoading } = useQuery({
    queryKey: ['campaign-detail', selectedCampaignId],
    queryFn: () => getCampaignById(selectedCampaignId),
    enabled: !!selectedCampaignId,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="pb-2 border-b border-soc-border">
        <h1 className="text-xl font-bold font-mono text-slate-100 flex items-center gap-2">
          <Layers className="w-5 h-5 text-cyan-400" />
          <span>THREAT CAMPAIGN CLUSTERS & ATTRIBUTION</span>
        </h1>
        <p className="text-xs text-soc-text-dim mt-0.5">
          Correlated threat infrastructure groups sharing origin IPs, DNS subnets, or deceptive phishing kits across historical cases.
        </p>
      </div>

      {/* Main Grid: Left Campaign Cards, Right Detailed Timeline & Infra */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 4 cols: Campaign List */}
        <div className="lg:col-span-4 space-y-3">
          <div className="text-[11px] font-mono text-soc-muted uppercase tracking-wider">
            Active Campaign Clusters ({campaigns.length})
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-slate-400 font-mono text-xs">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-cyan-400" />
              Loading campaign clusters...
            </div>
          ) : (
            <div className="space-y-3">
              {campaigns.map((camp) => (
                <CampaignCard
                  key={camp.campaign_id}
                  campaign={camp}
                  isSelected={camp.campaign_id === selectedCampaignId}
                  onSelect={(id) => setSelectedCampaignId(id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right 8 cols: Campaign Detail Breakdown */}
        <div className="lg:col-span-8">
          {isDetailLoading || !campaignDetail ? (
            <div className="p-12 text-center bg-soc-panel border border-soc-border rounded-md text-slate-400 font-mono text-xs">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-cyan-400" />
              Retrieving cluster infrastructure graph...
            </div>
          ) : (
            <CampaignClusterTimeline
              campaign={campaignDetail}
              onSelectCase={onSelectCase}
            />
          )}
        </div>
      </div>
    </div>
  );
};
