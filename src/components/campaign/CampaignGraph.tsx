import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  forceSimulation,
  forceManyBody,
  forceLink,
  forceCenter,
  forceCollide,
  SimulationNodeDatum,
  SimulationLinkDatum,
} from 'd3-force';
import {
  Server,
  Globe,
  Network,
  Mail,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ExternalLink,
  Info,
} from 'lucide-react';
import { CampaignDetail } from '../../types/campaign';
import { RiskCategory, CaseSummary } from '../../types/case';
import { RiskChip } from '../common/RiskChip';
import { getRiskLevelFromScore } from '../../lib/riskUtils';

export interface GraphNode extends SimulationNodeDatum {
  id: string;
  type: 'hub' | 'case' | 'domain' | 'mailserver' | 'payload_url';
  label: string;
  sublabel?: string;
  radius: number;
  color: string;
  borderColor?: string;
  caseId?: string;
  score?: number;
  riskCategory?: RiskCategory;
  firstSeen?: string;
  sender?: string;
  target?: string;
  subject?: string;
}

export interface GraphLink extends SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
  relationship: string;
  color?: string;
  dashArray?: string;
}

interface CampaignGraphProps {
  campaign: CampaignDetail;
  cases?: CaseSummary[];
  onSelectCase: (caseId: string) => void;
}

const MAX_DEFAULT_CASES = 35;

export const CampaignGraph: React.FC<CampaignGraphProps> = ({
  campaign,
  cases = [],
  onSelectCase,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 750, height: 480 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [showAllCases, setShowAllCases] = useState(false);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [draggedNode, setDraggedNode] = useState<GraphNode | null>(null);

  // Nodes & Links state animated by d3-force
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [links, setLinks] = useState<GraphLink[]>([]);
  const simulationRef = useRef<any>(null);

  // Measure container size dynamically
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: Math.max(rect.width, 500),
          height: Math.max(Math.min(rect.width * 0.65, 540), 420),
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Quick lookup map of existing cases for risk/score enrichment
  const casesMap = useMemo(() => {
    const map = new Map<string, CaseSummary>();
    cases.forEach((c) => map.set(c.case_id, c));
    return map;
  }, [cases]);

  // Determine total cases and performance safeguard cap
  const totalLinkedCases = campaign.linked_case_ids.length;
  const isCapped = totalLinkedCases > MAX_DEFAULT_CASES && !showAllCases;
  const activeCaseIds = useMemo(() => {
    if (!isCapped) return campaign.linked_case_ids;
    return campaign.linked_case_ids.slice(0, MAX_DEFAULT_CASES);
  }, [campaign.linked_case_ids, isCapped]);

  // Build raw nodes and links data
  useEffect(() => {
    const rawNodes: GraphNode[] = [];
    const rawLinks: GraphLink[] = [];
    const seenNodeIds = new Set<string>();

    // 1. Central Hub Node (Shared Indicator)
    const hubId = `hub:${campaign.shared_indicator}`;
    rawNodes.push({
      id: hubId,
      type: 'hub',
      label: campaign.shared_indicator,
      sublabel: `${campaign.indicator_type?.toUpperCase().replace('_', ' ') || 'SHARED PIVOT'} (CORRELATION ANCHOR)`,
      radius: 26,
      color: '#06B6D4',
      borderColor: '#22D3EE',
      firstSeen: campaign.first_seen,
    });
    seenNodeIds.add(hubId);

    // 2. Secondary Infrastructure Assets
    (campaign.infrastructure_nodes || []).forEach((infra) => {
      const infraId = `infra:${infra.value}`;
      if (infra.value !== campaign.shared_indicator && !seenNodeIds.has(infraId)) {
        seenNodeIds.add(infraId);
        let color = '#818CF8'; // domain: indigo
        let radius = 18;
        if (infra.type === 'mailserver') {
          color = '#F59E0B'; // amber
        } else if (infra.type === 'ip') {
          color = '#38BDF8'; // sky
        } else if (infra.type === 'payload_url') {
          color = '#EF4444'; // red
        }

        rawNodes.push({
          id: infraId,
          type: infra.type as any,
          label: infra.value,
          sublabel: infra.type.toUpperCase(),
          radius,
          color,
          firstSeen: infra.first_observed,
        });

        // Connect infrastructure to central hub
        rawLinks.push({
          source: infraId,
          target: hubId,
          relationship: 'Cluster Infrastructure',
          color: '#334155',
          dashArray: '3,3',
        });
      }
    });

    // 3. Clustered Case Nodes
    activeCaseIds.forEach((caseId) => {
      const cSummary = casesMap.get(caseId);
      const timelineMatch = (campaign.timeline_events || []).find((e) => e.case_id === caseId);

      const category: RiskCategory =
        cSummary?.risk_category || campaign.primary_risk_category || 'suspicious';
      const score: number = cSummary?.fraud_score ?? Math.round(campaign.average_fraud_score || 50);
      const riskConfig = getRiskLevelFromScore(score, category);

      const caseNodeId = `case:${caseId}`;
      seenNodeIds.add(caseNodeId);

      rawNodes.push({
        id: caseNodeId,
        type: 'case',
        label: `Case ${caseId.substring(0, 8)}`,
        caseId,
        subject: timelineMatch?.subject || cSummary?.subject || `Incident ${caseId.substring(0, 8)}`,
        target: timelineMatch?.target_recipient || cSummary?.sender || 'Enterprise Recipient',
        score,
        riskCategory: category,
        color: riskConfig.barColor,
        radius: 17,
        firstSeen: timelineMatch?.timestamp || cSummary?.received_at,
      });

      // Primary Edge: Case -> Shared Hub Anchor
      rawLinks.push({
        source: caseNodeId,
        target: hubId,
        relationship: 'Clustered via shared indicator',
        color: '#06B6D4',
        dashArray: '4,4',
      });

      // Secondary Edge: Case -> Domain/Sender Asset (if observed in infrastructure)
      if (cSummary?.sender) {
        const domain = cSummary.sender.split('@')[1];
        const matchingDomainId = `infra:${domain}`;
        if (seenNodeIds.has(matchingDomainId)) {
          rawLinks.push({
            source: caseNodeId,
            target: matchingDomainId,
            relationship: 'Observed sender domain',
            color: '#475569',
            dashArray: '2,2',
          });
        }
      }
    });

    // Initialize D3 force simulation with performance-tuned physics
    if (simulationRef.current) {
      simulationRef.current.stop();
    }

    const sim = forceSimulation<GraphNode>(rawNodes)
      .force(
        'link',
        forceLink<GraphNode, GraphLink>(rawLinks)
          .id((d) => d.id)
          .distance((link: any) => {
            const isHub = link.target?.id?.startsWith('hub:') || link.source?.id?.startsWith('hub:');
            return isHub ? 115 : 75;
          })
          .strength(0.65)
      )
      .force('charge', forceManyBody().strength(-280))
      .force('center', forceCenter(dimensions.width / 2, dimensions.height / 2))
      .force('collide', forceCollide<GraphNode>().radius((d) => d.radius + 20).iterations(2))
      .alphaDecay(0.04) // Fast convergence to save CPU
      .velocityDecay(0.35);

    sim.on('tick', () => {
      setNodes([...sim.nodes()]);
      setLinks([...rawLinks]);
    });

    simulationRef.current = sim;

    return () => {
      sim.stop();
    };
  }, [campaign, activeCaseIds, casesMap, dimensions.width, dimensions.height]);

  // Drag handlers
  const handlePointerDown = (node: GraphNode, e: React.PointerEvent) => {
    e.stopPropagation();
    setDraggedNode(node);
    node.fx = node.x;
    node.fy = node.y;
    if (simulationRef.current) {
      simulationRef.current.alphaTarget(0.2).restart();
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (draggedNode && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const currentX = (e.clientX - rect.left - pan.x) / zoom;
      const currentY = (e.clientY - rect.top - pan.y) / zoom;
      draggedNode.fx = currentX;
      draggedNode.fy = currentY;
    } else if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  };

  const handlePointerUp = () => {
    if (draggedNode) {
      draggedNode.fx = null;
      draggedNode.fy = null;
      setDraggedNode(null);
      if (simulationRef.current) {
        simulationRef.current.alphaTarget(0);
      }
    }
    if (isPanning) {
      setIsPanning(false);
    }
  };

  // Background canvas pan handlers
  const handleCanvasPointerDown = (e: React.PointerEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).tagName === 'svg') {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    if (simulationRef.current) {
      simulationRef.current.alpha(0.3).restart();
    }
  };

  // Calculate connected node IDs when a node is hovered for focus highlighting
  const activeAdjacentNodeIds = useMemo(() => {
    if (!hoveredNode) return null;
    const set = new Set<string>();
    set.add(hoveredNode.id);
    links.forEach((l) => {
      const sId = typeof l.source === 'string' ? l.source : l.source.id;
      const tId = typeof l.target === 'string' ? l.target : l.target.id;
      if (sId === hoveredNode.id) set.add(tId);
      if (tId === hoveredNode.id) set.add(sId);
    });
    return set;
  }, [hoveredNode, links]);

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-soc-panel border border-slate-800/80 rounded select-none overflow-hidden font-mono shadow-soc-card"
      style={{ height: dimensions.height }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onPointerDown={handleCanvasPointerDown}
    >
      {/* Top Controls Toolbar */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 bg-soc-inset/90 border border-slate-800/80 p-1 rounded backdrop-blur-sm shadow-sm">
        <button
          onClick={() => setZoom((z) => Math.min(z + 0.2, 2.4))}
          className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-cyan-300 transition-colors"
          title="Zoom In (+)"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(z - 0.2, 0.5))}
          className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-cyan-300 transition-colors"
          title="Zoom Out (-)"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <div className="w-[1px] h-3.5 bg-slate-800" />
        <button
          onClick={resetView}
          className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-cyan-300 transition-colors flex items-center gap-1 text-[10px]"
          title="Reset View"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>

      {/* Cluster Stats HUD */}
      <div className="absolute top-3 right-3 z-20 hidden sm:flex items-center gap-2 bg-soc-inset/90 border border-slate-800/80 px-2.5 py-1 rounded backdrop-blur-sm text-[10px] text-slate-300">
        <span className="text-cyan-400 font-bold">{nodes.length}</span> nodes ·{' '}
        <span className="text-slate-200 font-bold">{links.length}</span> edges
      </div>

      {/* Large Campaign Safeguard Banner (if capped) */}
      {totalLinkedCases > MAX_DEFAULT_CASES && (
        <div className="absolute top-12 left-3 z-20 max-w-sm flex items-start gap-2 p-2 rounded bg-slate-900/90 border border-amber-500/40 text-[10px] text-slate-300 backdrop-blur-sm shadow-lg">
          <Info className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span>
              {isCapped
                ? `Performance Safeguard: Displaying top ${MAX_DEFAULT_CASES} of ${totalLinkedCases} incidents.`
                : `Rendering all ${totalLinkedCases} incidents.`}
            </span>
            <button
              onClick={() => setShowAllCases((prev) => !prev)}
              className="block mt-1 text-cyan-300 hover:underline font-semibold"
            >
              {isCapped ? `Expand to show all (${totalLinkedCases})` : `Collapse to top ${MAX_DEFAULT_CASES}`}
            </button>
          </div>
        </div>
      )}

      {/* Main Interactive SVG Canvas */}
      <svg
        className="w-full h-full cursor-grab active:cursor-grabbing"
        style={{ touchAction: 'none' }}
      >
        <defs>
          {/* Subtle glow filter for the central shared hub anchor */}
          <filter id="hub-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* Edges / Links */}
          {links.map((link, idx) => {
            const source = link.source as GraphNode;
            const target = link.target as GraphNode;
            if (!source.x || !source.y || !target.x || !target.y) return null;

            const isHighlighted =
              activeAdjacentNodeIds &&
              activeAdjacentNodeIds.has(source.id) &&
              activeAdjacentNodeIds.has(target.id);
            const isDimmed = activeAdjacentNodeIds && !isHighlighted;

            return (
              <g key={`link-${idx}`}>
                <line
                  x1={source.x}
                  y1={source.y}
                  x2={target.x}
                  y2={target.y}
                  stroke={isHighlighted ? '#06B6D4' : link.color || '#334155'}
                  strokeWidth={isHighlighted ? 2.5 : 1.5}
                  strokeDasharray={link.dashArray}
                  strokeOpacity={isDimmed ? 0.2 : 0.85}
                  className="transition-opacity duration-200"
                />
              </g>
            );
          })}

          {/* Nodes */}
          {nodes.map((node) => {
            if (node.x === undefined || node.y === undefined) return null;

            const isHovered = hoveredNode?.id === node.id;
            const isHighlighted = activeAdjacentNodeIds && activeAdjacentNodeIds.has(node.id);
            const isDimmed = activeAdjacentNodeIds && !isHighlighted;
            const isHub = node.type === 'hub';
            const isCase = node.type === 'case';

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                className={`transition-opacity duration-200 ${
                  isCase ? 'cursor-pointer' : 'cursor-grab'
                }`}
                style={{ opacity: isDimmed ? 0.25 : 1 }}
                onPointerDown={(e) => handlePointerDown(node, e)}
                onMouseEnter={() => setHoveredNode(node)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={() => {
                  if (isCase && node.caseId) {
                    onSelectCase(node.caseId);
                  }
                }}
              >
                {/* Hub Pulsing / Halo Ring */}
                {isHub && (
                  <circle
                    r={node.radius + 7}
                    fill="none"
                    stroke="#06B6D4"
                    strokeWidth="1.5"
                    strokeDasharray="4,3"
                    strokeOpacity="0.6"
                    className="animate-spin-slow"
                  />
                )}

                {/* Selection / Hover Glow Ring */}
                {(isHovered || isHighlighted) && (
                  <circle
                    r={node.radius + 4}
                    fill="none"
                    stroke={isHub ? '#22D3EE' : node.color}
                    strokeWidth="2"
                    strokeOpacity="0.9"
                  />
                )}

                {/* Main Node Circle */}
                <circle
                  r={node.radius}
                  fill="#0B132B"
                  stroke={node.color}
                  strokeWidth={isHub ? 2.5 : 2}
                  filter={isHub ? 'url(#hub-glow)' : undefined}
                />

                {/* Center Icon Indicator */}
                {isHub && (
                  <circle r={node.radius * 0.45} fill="#06B6D4" fillOpacity="0.8" />
                )}
                {isCase && (
                  <circle r={node.radius * 0.35} fill={node.color} fillOpacity="0.9" />
                )}
                {!isHub && !isCase && (
                  <circle r={node.radius * 0.35} fill={node.color} fillOpacity="0.85" />
                )}

                {/* Primary Node Label */}
                <text
                  y={node.radius + 12}
                  textAnchor="middle"
                  fill={isHovered ? '#FFFFFF' : isHub ? '#22D3EE' : '#CBD5E1'}
                  fontSize={isHub ? 10 : 9}
                  fontWeight={isHub ? 'bold' : 'normal'}
                  className="pointer-events-none drop-shadow"
                >
                  {node.label.length > 22 ? `${node.label.substring(0, 20)}…` : node.label}
                </text>

                {/* Subtitle / Risk category for Case nodes */}
                {isCase && node.score !== undefined && (
                  <text
                    y={node.radius + 22}
                    textAnchor="middle"
                    fill={node.color}
                    fontSize={8}
                    fontWeight="bold"
                    className="pointer-events-none"
                  >
                    SCORE {node.score}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* Interactive Node Inspector Popover / Tooltip */}
      {hoveredNode && (
        <div className="absolute bottom-12 right-3 z-30 w-72 p-3 rounded bg-soc-panel/95 border border-slate-750 backdrop-blur-md shadow-2xl text-xs font-mono space-y-2 pointer-events-none">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <span className="text-[10px] uppercase font-bold text-cyan-300 flex items-center gap-1.5">
              {hoveredNode.type === 'hub' ? (
                <>
                  <Server className="w-3 h-3 text-cyan-400" />
                  <span>SHARED CLUSTER PIVOT</span>
                </>
              ) : hoveredNode.type === 'case' ? (
                <>
                  <Mail className="w-3 h-3 text-amber-400" />
                  <span>INCIDENT CASE NODE</span>
                </>
              ) : hoveredNode.type === 'domain' ? (
                <>
                  <Globe className="w-3 h-3 text-indigo-400" />
                  <span>DOMAIN INFRASTRUCTURE</span>
                </>
              ) : (
                <>
                  <Network className="w-3 h-3 text-sky-400" />
                  <span>RELAY / MAILSERVER</span>
                </>
              )}
            </span>
            {hoveredNode.riskCategory && (
              <RiskChip category={hoveredNode.riskCategory} size="sm" />
            )}
          </div>

          <div className="font-bold text-slate-100 break-all text-[11px]">
            {hoveredNode.type === 'case' ? hoveredNode.subject : hoveredNode.label}
          </div>

          {hoveredNode.type === 'case' ? (
            <div className="space-y-1 text-[10px] text-slate-300">
              <div className="flex items-center justify-between">
                <span className="text-soc-muted">Fraud Score:</span>
                <span className="font-bold" style={{ color: hoveredNode.color }}>
                  {hoveredNode.score} / 100
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-soc-muted">Target / Sender:</span>
                <span className="text-slate-200 truncate max-w-[150px]">
                  {hoveredNode.target}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-soc-muted">First Observed:</span>
                <span className="text-slate-400">{hoveredNode.firstSeen?.substring(0, 10)}</span>
              </div>
              <div className="pt-1.5 border-t border-slate-800/80 text-cyan-300 flex items-center gap-1 text-[10px] font-semibold">
                <span>Click node to open Case Detail</span>
                <ExternalLink className="w-3 h-3" />
              </div>
            </div>
          ) : (
            <div className="space-y-1 text-[10px] text-slate-300">
              <div className="flex items-center justify-between">
                <span className="text-soc-muted">Classification:</span>
                <span className="text-slate-200">{hoveredNode.sublabel}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-soc-muted">First Sighted:</span>
                <span className="text-slate-400">{hoveredNode.firstSeen?.substring(0, 10)}</span>
              </div>
              <div className="text-[9px] text-slate-400 pt-1 border-t border-slate-800">
                Connected to {activeAdjacentNodeIds ? activeAdjacentNodeIds.size - 1 : 0} cluster nodes
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bottom Legend Bar */}
      <div className="absolute bottom-2 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 rounded bg-soc-inset/90 border border-slate-800/80 backdrop-blur-sm text-[10px] text-slate-400">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-soc-muted uppercase text-[9px] font-semibold">Legend:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 ring-2 ring-cyan-500/30" />
            <span className="text-slate-200">Shared Hub Anchor</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span className="text-slate-200">Phishing Case</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-slate-200">Suspicious Case</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-slate-200">Clean Case</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
            <span className="text-slate-200">Domain Asset</span>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-1 text-[9px] text-cyan-400 font-semibold">
          <span>Click any case node to inspect full forensic analysis</span>
        </div>
      </div>
    </div>
  );
};
