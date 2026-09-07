import React, { useState } from 'react';
import {
  Layers,
  Server,
  Globe,
  Network,
  Link,
  Hash,
  ArrowRight,
  ListTree,
  Share2,
} from 'lucide-react';
import clsx from 'clsx';
import { CampaignDetail } from '../../types/campaign';
import { CaseSummary } from '../../types/case';
import { EvidenceCard } from '../common/EvidenceCard';
import { RiskChip } from '../common/RiskChip';
import { CopyableText } from '../common/CopyableText';
import { formatUtcDateTime } from '../../lib/formatters';
import { CampaignGraph } from './CampaignGraph';

interface CampaignClusterTimelineProps {
  campaign: CampaignDetail;
  cases?: CaseSummary[];
  onSelectCase: (caseId: string) => void;
}

export const CampaignClusterTimeline: React.FC<CampaignClusterTimelineProps> = ({
  campaign,
  cases = [],
  onSelectCase,
}) => {
  // Priority: Keep Evidence List & Timeline as DEFAULT for scannability and accessibility
  const [viewMode, setViewMode] = useState<'list' | 'graph'>('list');
  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'ip':
        return <Server className="w-3.5 h-3.5 text-cyan-400" />;
      case 'domain':
        return <Globe className="w-3.5 h-3.5 text-indigo-400" />;
      case 'mailserver':
        return <Network className="w-3.5 h-3.5 text-amber-400" />;
      case 'payload_url':
        return <Link className="w-3.5 h-3.5 text-red-400" />;
      default:
        return <Hash className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Campaign Summary Banner */}
      <div className="bg-soc-panel border border-slate-800/60 rounded p-4 shadow-soc-card">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <h2 className="text-base font-bold font-mono text-slate-100">
              {campaign.name}
            </h2>
          </div>
          {campaign.primary_risk_category && (
            <RiskChip category={campaign.primary_risk_category} size="sm" />
          )}
        </div>

        <p className="text-xs text-slate-300 leading-relaxed font-sans mb-3">
          {campaign.description}
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs font-mono">
          <div className="p-2 rounded bg-soc-inset border border-slate-800/50">
            <span className="text-[9px] text-soc-muted uppercase block">Cluster ID</span>
            <span className="text-cyan-300 font-bold">{campaign.campaign_id}</span>
          </div>
          <div className="p-2 rounded bg-soc-inset border border-slate-800/50">
            <span className="text-[9px] text-soc-muted uppercase block">Linked Incidents</span>
            <span className="text-slate-100 font-bold">{campaign.linked_case_ids.length} Cases</span>
          </div>
          <div className="p-2 rounded bg-soc-inset border border-slate-800/50">
            <span className="text-[9px] text-soc-muted uppercase block">First Sighted</span>
            <span className="text-slate-200">{campaign.first_seen.substring(0, 10)}</span>
          </div>
          <div className="p-2 rounded bg-soc-inset border border-slate-800/50">
            <span className="text-[9px] text-soc-muted uppercase block">Last Sighted</span>
            <span className="text-slate-200">{campaign.last_seen.substring(0, 10)}</span>
          </div>
        </div>
      </div>

      {/* View Mode Switcher */}
      <div className="flex items-center justify-between gap-2 bg-soc-panel border border-slate-800/80 p-1.5 rounded">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono text-soc-muted uppercase px-2">Visualization Mode:</span>
          <button
            onClick={() => setViewMode('list')}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1 text-xs font-mono rounded transition-colors',
              viewMode === 'list'
                ? 'bg-slate-800 text-cyan-300 font-bold border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            <ListTree className="w-3.5 h-3.5" />
            <span>Evidence List & Timeline</span>
          </button>
          <button
            onClick={() => setViewMode('graph')}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1 text-xs font-mono rounded transition-colors',
              viewMode === 'graph'
                ? 'bg-slate-800 text-cyan-300 font-bold border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            <Share2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Network Graph</span>
            <span className="px-1.5 py-0.2 rounded text-[9px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              INTERACTIVE
            </span>
          </button>
        </div>
        <div className="text-[10px] font-mono text-soc-muted hidden md:block pr-2">
          {viewMode === 'graph'
            ? 'Interactive infrastructure & incident force graph'
            : 'Structured forensic IOC list and chronological events'}
        </div>
      </div>

      {viewMode === 'graph' ? (
        <CampaignGraph
          campaign={campaign}
          cases={cases}
          onSelectCase={onSelectCase}
        />
      ) : (
        <>
          {/* Infrastructure Node Adjacency Matrix */}
          <EvidenceCard
            title="Correlated Infrastructure & IOC Nodes"
            subtitle="Shared network assets, lookalike domains, and delivery relays linking cases together"
            badge={
              <span className="px-2 py-0.5 rounded text-[9px] font-mono text-cyan-300 bg-cyan-500/10 border border-cyan-500/25">
                {campaign.infrastructure_nodes.length} ASSETS IDENTIFIED
              </span>
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {campaign.infrastructure_nodes.map((node, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded bg-soc-inset border border-slate-800/50 flex items-start gap-2 text-xs font-mono"
                >
                  <div className="p-1 rounded bg-slate-800/60 shrink-0 mt-0.5">
                    {getNodeIcon(node.type)}
                  </div>
                  <div className="truncate flex-1">
                    <div className="flex items-center justify-between text-[9px] text-soc-muted uppercase mb-0.5">
                      <span>{node.type}</span>
                      <span>{node.first_observed}</span>
                    </div>
                    <CopyableText
                      text={node.value}
                      truncate={node.value.length > 26}
                      textClassName="text-slate-200 text-[11px]"
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
            <div className="relative pl-5 space-y-4 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-800/80">
              {campaign.timeline_events.map((event, idx) => (
                <div key={idx} className="relative group">
                  {/* Timeline Dot */}
                  <div className="absolute -left-5 top-1.5 w-2 h-2 rounded-full bg-cyan-400 border-2 border-slate-900 group-hover:scale-125 transition-transform" />

                  <div className="p-2.5 rounded bg-soc-inset hover:bg-soc-hover/60 border border-slate-800/50 transition-colors">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                      <span className="text-[10px] font-mono text-cyan-300 font-semibold">
                        {formatUtcDateTime(event.timestamp)}
                      </span>
                      <button
                        onClick={() => onSelectCase(event.case_id)}
                        className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-400 hover:text-cyan-300"
                      >
                        <span>Inspect Case ({event.case_id.substring(0, 8)})</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="font-semibold text-xs text-slate-100 mb-0.5">
                      {event.subject}
                    </div>

                    <div className="text-[10px] font-mono text-soc-muted">
                      Target: <span className="text-slate-300">{event.target_recipient}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </EvidenceCard>
        </>
      )}
    </div>
  );
};
