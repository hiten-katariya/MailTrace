import React from 'react';
import { Server, ArrowDown, Clock, Globe } from 'lucide-react';
import { RelayHop } from '../../types/case';
import { ProtocolBadge } from './ProtocolBadge';
import { CopyableText } from './CopyableText';

interface RelayHopNodeProps {
  hop: RelayHop;
  isFirst?: boolean;
  isLast: boolean;
  isEarliestOrigin?: boolean;
}

export const RelayHopNode: React.FC<RelayHopNodeProps> = ({
  hop,
  isLast,
  isEarliestOrigin = false,
}) => {
  return (
    <div className="relative flex flex-col">
      <div
        className={`p-3.5 rounded-md border transition-all ${
          isEarliestOrigin
            ? 'bg-amber-950/20 border-amber-500/40 shadow-soc-subtle'
            : isLast
            ? 'bg-slate-900/90 border-slate-700'
            : 'bg-soc-raised/80 border-soc-border hover:border-slate-700'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          {/* Hop Number & Badge */}
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-mono text-xs font-bold ${
                isEarliestOrigin
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-slate-800 text-slate-300 border border-slate-700'
              }`}
            >
              #{hop.hop}
            </span>

            <div className="flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-cyber-cyan" />
              <span className="font-mono text-xs font-semibold text-slate-200">
                {hop.server || 'Unknown Hostname'}
              </span>
            </div>

            {isEarliestOrigin && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                EARLIEST ORIGIN NODE
              </span>
            )}
            {isLast && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700">
                INTERNAL GATEWAY
              </span>
            )}
          </div>

          {/* Inline Auth Status */}
          {hop.spf_status && (
            <ProtocolBadge name="SPF" status={hop.spf_status} size="sm" />
          )}
        </div>

        {/* Technical Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-2 border-t border-slate-800/80 text-xs">
          {/* IP Address */}
          <div>
            <div className="text-[10px] text-soc-muted uppercase tracking-wider mb-0.5">Relay IP Address</div>
            <CopyableText text={hop.ip} textClassName="text-cyan-300" />
          </div>

          {/* Timestamp */}
          <div>
            <div className="text-[10px] text-soc-muted uppercase tracking-wider mb-0.5">MTA Received Timestamp</div>
            <div className="flex items-center gap-1 text-slate-300 font-mono text-[11px]">
              <Clock className="w-3 h-3 text-slate-500" />
              <span>{hop.timestamp.replace('T', ' ').replace('Z', ' UTC')}</span>
            </div>
          </div>

          {/* Geo / Transit Delay */}
          <div>
            <div className="text-[10px] text-soc-muted uppercase tracking-wider mb-0.5">Location & Transit Delay</div>
            <div className="flex items-center justify-between text-[11px] font-mono">
              <div className="flex items-center gap-1 text-slate-300">
                <Globe className="w-3 h-3 text-slate-500" />
                <span>{hop.country || 'Unknown'}</span>
              </div>
              {hop.delay_ms !== undefined && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded ${hop.delay_ms > 15000 ? 'text-amber-400 bg-amber-950/40' : 'text-slate-400'}`}>
                  {hop.delay_ms === 0 ? '0ms' : `+${(hop.delay_ms / 1000).toFixed(1)}s delay`}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Downward Connector Arrow between hops */}
      {!isLast && (
        <div className="flex items-center justify-center my-1 text-slate-600">
          <div className="flex items-center gap-1 text-[11px] font-mono text-slate-500">
            <ArrowDown className="w-4 h-4 text-cyber-cyan/70 animate-bounce" />
            <span className="text-[10px]">relay transit</span>
          </div>
        </div>
      )}
    </div>
  );
};
