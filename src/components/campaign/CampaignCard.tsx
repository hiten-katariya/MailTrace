import React from 'react';
import { Network, Clock, ArrowRight } from 'lucide-react';
import { CampaignSummary } from '../../types/campaign';
import { RiskChip } from '../common/RiskChip';
import { formatTimeAgo } from '../../lib/formatters';

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
      className={`p-3.5 rounded border transition-all cursor-pointer ${
        isSelected
          ? 'bg-soc-raised border-cyan-500/50 shadow-soc-card ring-1 ring-cyan-500/20'
          : 'bg-soc-panel border-slate-800/60 hover:border-slate-700 hover:bg-soc-hover/50'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[10px] text-cyan-400 font-bold">
              {campaign.campaign_id.toUpperCase()}
            </span>
            {campaign.primary_risk_category && (
              <RiskChip category={campaign.primary_risk_category} size="sm" />
            )}
          </div>
          <h3 className="text-xs font-bold text-slate-100 tracking-tight leading-snug">
            {campaign.name || 'Unnamed Threat Cluster'}
          </h3>
        </div>

        <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/25 text-[10px] font-mono font-bold shrink-0">
          {campaign.case_count} Cases
        </span>
      </div>

      {/* Shared IOC Callout */}
      <div className="p-2 rounded bg-soc-inset border border-slate-800/60 mb-2 flex items-start gap-2">
        <Network className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs font-mono truncate">
          <span className="text-soc-muted text-[9px] block uppercase">Shared Infrastructure</span>
          <span className="text-slate-200 font-semibold text-[11px] truncate block">{campaign.shared_indicator}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/40 text-[10px] font-mono text-soc-muted">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-slate-500" />
          <span>Active {formatTimeAgo(campaign.last_seen)}</span>
        </div>

        <div className="flex items-center gap-1 text-cyan-400 group-hover:text-cyan-300">
          <span>Inspect</span>
          <ArrowRight className="w-3 h-3" />
        </div>
      </div>
    </div>
  );
};
