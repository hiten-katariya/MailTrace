import React from 'react';
import { Layers, Network, Clock, ShieldAlert, ArrowRight, Server, Hash } from 'lucide-react';
import { CampaignSummary } from '../../types/campaign';
import { RiskChip } from '../common/RiskChip';
import { ScoreBadge } from '../common/ScoreBadge';
import { formatTimeAgo, formatUtcDateTime } from '../../lib/formatters';

interface CampaignCardProps {
  campaign: CampaignSummary;
  isSelected?: boolean;
  onSelect: (campaignId: string) => void;
}

export const CampaignCard: React.FC<CampaignCardProps> = ({
  campaign,
  isSelected = false,
  onSelect,
}) => {
  return (
    <div
      onClick={() => onSelect(campaign.campaign_id)}
      className={`p-4 rounded-md border transition-all cursor-pointer ${
        isSelected
          ? 'bg-soc-raised border-cyan-500/50 shadow-soc-card'
          : 'bg-soc-panel border-soc-border hover:border-slate-700 hover:bg-soc-hover/60'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs text-cyan-400 font-bold">
              {campaign.campaign_id.toUpperCase()}
            </span>
            {campaign.primary_risk_category && (
              <RiskChip category={campaign.primary_risk_category} size="sm" />
            )}
          </div>
          <h3 className="text-sm font-bold text-slate-100 tracking-tight">
            {campaign.name || 'Unnamed Threat Cluster'}
          </h3>
        </div>

        <div className="text-right shrink-0">
          <span className="px-2.5 py-1 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 text-xs font-mono font-bold">
            {campaign.case_count} Linked Cases
          </span>
        </div>
      </div>

      {/* Shared IOC Callout */}
      <div className="p-2.5 rounded bg-soc-inset border border-soc-border mb-3 flex items-start gap-2">
        <Network className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs font-mono">
          <span className="text-soc-muted text-[10px] block uppercase">Shared Infrastructure IOC</span>
          <span className="text-slate-200 font-semibold">{campaign.shared_indicator}</span>
        </div>
      </div>

      {/* Footer metadata */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] font-mono text-soc-muted">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3 h-3 text-slate-500" />
          <span>Active {formatTimeAgo(campaign.last_seen)}</span>
        </div>

        <div className="flex items-center gap-1 text-cyan-400 group-hover:text-cyan-300">
          <span>Explore Cluster</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
};
