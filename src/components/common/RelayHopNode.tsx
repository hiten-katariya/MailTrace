import React from 'react';
import { Server, ArrowDown, Clock, Globe, ShieldAlert, Radio } from 'lucide-react';
import { RelayHop } from '../../types/case';
import { ProtocolBadge } from './ProtocolBadge';
import { CopyableText } from './CopyableText';

interface RelayHopNodeProps {
  hop: RelayHop;
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
        className={`p-3 rounded border transition-all ${
          isEarliestOrigin
            ? 'bg-amber-500/5 border-amber-500/30 shadow-soc-subtle'
            : isLast
            ? 'bg-soc-panel border-slate-700/60'
            : 'bg-soc-panel border-slate-800/60 hover:border-slate-700/80'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          {/* Hop Number & Badge */}
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center justify-center w-5 h-5 rounded font-mono text-[10px] font-bold ${
                isEarliestOrigin
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-slate-800 text-slate-300 border border-slate-700'
              }`}
            >
              #{hop.hop}
            </span>

            <div className="flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-mono text-xs font-semibold text-slate-100">
                {hop.server || 'Unknown Hostname'}
              </span>
            </div>

            {isEarliestOrigin && (
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30">
                EARLIEST ORIGIN
              </span>
            )}
            {isLast && (
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-medium uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700">
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-2 border-t border-slate-800/40 text-xs">
          {/* IP Address */}
          <div>
            <div className="text-[9px] text-soc-muted font-mono uppercase tracking-wider mb-0.5">Relay IP Node</div>
            <CopyableText text={hop.ip} textClassName="text-cyan-300 font-semibold" />
          </div>

          {/* Timestamp */}
          <div>
            <div className="text-[9px] text-soc-muted font-mono uppercase tracking-wider mb-0.5">MTA Received Time</div>
            <div className="flex items-center gap-1 text-slate-300 font-mono text-[11px]">
              <Clock className="w-3 h-3 text-slate-500" />
              <span>{hop.timestamp.replace('T', ' ').replace('Z', ' UTC')}</span>
            </div>
          </div>

          {/* Location & Delay */}
          <div>
            <div className="text-[9px] text-soc-muted font-mono uppercase tracking-wider mb-0.5">Geo Transit & Latency</div>
            <div className="flex items-center justify-between text-[11px] font-mono">
              <div className="flex items-center gap-1 text-slate-300">
                <Globe className="w-3 h-3 text-slate-500" />
                <span>{hop.country || 'Unknown'}</span>
              </div>
              {hop.delay_ms !== undefined && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${hop.delay_ms > 15000 ? 'text-amber-400 bg-amber-500/10' : 'text-slate-400'}`}>
                  {hop.delay_ms === 0 ? '0ms' : `+${(hop.delay_ms / 1000).toFixed(1)}s latency`}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Timeline connector arrow */}
      {!isLast && (
        <div className="flex items-center justify-center my-1 text-slate-600">
          <div className="flex items-center gap-1 text-[10px] font-mono text-slate-500">
            <ArrowDown className="w-3.5 h-3.5 text-cyan-400/70" />
            <span>relay transit</span>
          </div>
        </div>
      )}
    </div>
  );
};
