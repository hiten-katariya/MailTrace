import React from 'react';
import {
  Layers,
  Server,
  Globe,
  Network,
  Link,
  Hash,
  ArrowRight,
} from 'lucide-react';
import { CampaignDetail } from '../../types/campaign';
import { EvidenceCard } from '../common/EvidenceCard';
import { RiskChip } from '../common/RiskChip';
import { CopyableText } from '../common/CopyableText';
import { formatUtcDateTime } from '../../lib/formatters';

interface CampaignClusterTimelineProps {
  campaign: CampaignDetail;
  onSelectCase: (caseId: string) => void;
}

export const CampaignClusterTimeline: React.FC<CampaignClusterTimelineProps> = ({
  campaign,
  onSelectCase,
}) => {
  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'ip':
        return <Server className="w-4 h-4 text-cyan-400" />;
      case 'domain':
        return <Globe className="w-4 h-4 text-indigo-400" />;
      case 'mailserver':
        return <Network className="w-4 h-4 text-amber-400" />;
      case 'payload_url':
        return <Link className="w-4 h-4 text-red-400" />;
      default:
        return <Hash className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Campaign Summary Banner */}
      <div className="bg-soc-panel border border-soc-border rounded-md p-5 shadow-soc-card">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold font-mono text-slate-100">
              {campaign.name}
            </h2>
          </div>
          {campaign.primary_risk_category && (
            <RiskChip category={campaign.primary_risk_category} />
          )}
        </div>

        <p className="text-xs text-slate-300 leading-relaxed font-sans mb-4">
          {campaign.description}
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
          <div className="p-2.5 rounded bg-soc-inset border border-soc-border">
            <span className="text-[10px] text-soc-muted uppercase block">Campaign ID</span>
            <span className="text-cyan-300 font-bold">{campaign.campaign_id}</span>
          </div>
          <div className="p-2.5 rounded bg-soc-inset border border-soc-border">
            <span className="text-[10px] text-soc-muted uppercase block">Linked Incidents</span>
            <span className="text-slate-100 font-bold">{campaign.linked_case_ids.length} Cases</span>
          </div>
          <div className="p-2.5 rounded bg-soc-inset border border-soc-border">
            <span className="text-[10px] text-soc-muted uppercase block">Earliest Sighting</span>
            <span className="text-slate-200">{campaign.first_seen.substring(0, 10)}</span>
          </div>
          <div className="p-2.5 rounded bg-soc-inset border border-soc-border">
            <span className="text-[10px] text-soc-muted uppercase block">Most Recent</span>
            <span className="text-slate-200">{campaign.last_seen.substring(0, 10)}</span>
          </div>
        </div>
      </div>

      {/* Infrastructure Node Adjacency Matrix */}
      <EvidenceCard
        title="Correlated Infrastructure & IOC Nodes"
        subtitle="Shared network assets, lookalike domains, and delivery relays linking cases together"
        badge={
          <span className="px-2 py-0.5 rounded text-[10px] font-mono text-cyan-300 bg-cyan-950 border border-cyan-500/30">
            {campaign.infrastructure_nodes.length} ASSETS IDENTIFIED
          </span>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {campaign.infrastructure_nodes.map((node, idx) => (
            <div
              key={idx}
              className="p-3 rounded bg-soc-inset border border-soc-border flex items-start gap-2.5 text-xs font-mono"
            >
              <div className="p-1.5 rounded bg-slate-800/80 shrink-0">
                {getNodeIcon(node.type)}
              </div>
              <div className="truncate flex-1">
                <div className="flex items-center justify-between text-[10px] text-soc-muted uppercase mb-0.5">
                  <span>{node.type}</span>
                  <span>{node.first_observed}</span>
                </div>
                <CopyableText
                  text={node.value}
                  truncate={node.value.length > 28}
                  textClassName="text-slate-200"
                />
              </div>
            </div>
          ))}
        </div>
      </EvidenceCard>

      {/* Attack Activity Timeline */}
      <EvidenceCard
        title="Targeting Progression Timeline"
        subtitle="Chronological sequence of detected email deliveries belonging to this campaign"
      >
        <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
          {campaign.timeline_events.map((event, idx) => (
            <div key={idx} className="relative group">
              {/* Timeline Dot */}
              <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-cyan-400 border-2 border-slate-900 group-hover:scale-125 transition-transform" />

              <div className="p-3 rounded bg-soc-inset hover:bg-soc-hover/80 border border-soc-border transition-colors">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                  <span className="text-[11px] font-mono text-cyan-300">
                    {formatUtcDateTime(event.timestamp)}
                  </span>
                  <button
                    onClick={() => onSelectCase(event.case_id)}
                    className="inline-flex items-center gap-1 text-xs font-mono text-slate-400 hover:text-cyan-300"
                  >
                    <span>Inspect Case ({event.case_id.substring(0, 8)})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="font-semibold text-xs text-slate-100 mb-1">
                  {event.subject}
                </div>

                <div className="text-[11px] font-mono text-soc-muted">
                  Target Ingestion Address:{' '}
                  <span className="text-slate-300">{event.target_recipient}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </EvidenceCard>
    </div>
  );
};
