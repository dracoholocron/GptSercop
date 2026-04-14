import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import ForceGraph2D, { type ForceGraphMethods, type NodeObject, type LinkObject } from 'react-force-graph-2d';

// ── Public types (match API shape) ──────────────────────────────

export interface VisualNode {
  id: string;
  name: string;
  degree: number;
  riskLevel: string | null;
  pageRank: number;
  totalAmount: number;
  province: string | null;
  communityId: number;
}

export interface VisualLink {
  source: string | VisualNode;
  target: string | VisualNode;
  sharedTenders: number;
}

export interface NetworkGraphProps {
  nodes: VisualNode[];
  links: VisualLink[];
  height?: number;
  width?: number;
  onNodeClick?: (node: VisualNode) => void;
  highlightNodeId?: string | null;
}

// ── Colour helpers ──────────────────────────────────────────────

const COMMUNITY_PALETTE = [
  '#4299E1', '#48BB78', '#ED8936', '#9F7AEA', '#F56565',
  '#38B2AC', '#ECC94B', '#E53E3E', '#667EEA', '#FC8181',
  '#68D391', '#63B3ED', '#D69E2E', '#B794F4', '#F687B3',
];

const RISK_COLORS: Record<string, string> = {
  high: '#E53E3E',
  medium: '#ED8936',
  low: '#48BB78',
};

export function riskColor(level: string | null): string {
  return (level && RISK_COLORS[level]) ?? '#A0AEC0';
}

export function communityColor(communityId: number): string {
  if (communityId < 0) return '#A0AEC0';
  return COMMUNITY_PALETTE[communityId % COMMUNITY_PALETTE.length];
}

export function nodeRadius(degree: number): number {
  return Math.max(4, Math.min(20, 4 + Math.sqrt(degree) * 2));
}

// ── Component ───────────────────────────────────────────────────

type GraphNode = NodeObject & VisualNode;
type GraphLink = LinkObject & { sharedTenders: number };

export function NetworkGraph({
  nodes,
  links,
  height = 500,
  width,
  onNodeClick,
  highlightNodeId,
}: NetworkGraphProps) {
  const graphRef = useRef<ForceGraphMethods<GraphNode, GraphLink> | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverNodeId, setHoverNodeId] = useState<string | null>(null);
  const [containerWidth, setContainerWidth] = useState(width ?? 800);

  // Responsive width
  useEffect(() => {
    if (width) { setContainerWidth(width); return; }
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w && w > 0) setContainerWidth(Math.round(w));
    });
    obs.observe(el);
    setContainerWidth(el.clientWidth || 800);
    return () => obs.disconnect();
  }, [width]);

  // Neighbour set for highlight
  const neighborSet = useMemo(() => {
    const activeId = hoverNodeId ?? highlightNodeId;
    if (!activeId) return null;
    const set = new Set<string>([activeId]);
    for (const l of links) {
      const sid = typeof l.source === 'object' ? (l.source as VisualNode).id : l.source;
      const tid = typeof l.target === 'object' ? (l.target as VisualNode).id : l.target;
      if (sid === activeId) set.add(tid);
      if (tid === activeId) set.add(sid);
    }
    return set;
  }, [hoverNodeId, highlightNodeId, links]);

  // Fit on mount
  useEffect(() => {
    const t = setTimeout(() => graphRef.current?.zoomToFit(400, 40), 500);
    return () => clearTimeout(t);
  }, [nodes]);

  const handleNodeHover = useCallback((node: GraphNode | null) => {
    setHoverNodeId(node?.id ?? null);
    if (containerRef.current) {
      containerRef.current.style.cursor = node ? 'pointer' : 'default';
    }
  }, []);

  const handleNodeClick = useCallback(
    (node: GraphNode) => onNodeClick?.(node),
    [onNodeClick],
  );

  // Custom node paint
  const paintNode = useCallback(
    (node: GraphNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const { x, y } = node;
      if (x == null || y == null) return;

      const r = nodeRadius(node.degree);
      const isHighlighted = neighborSet?.has(node.id);
      const isDimmed = neighborSet != null && !isHighlighted;

      // Node circle
      ctx.beginPath();
      ctx.arc(x, y, r, 0, 2 * Math.PI);
      ctx.fillStyle = isDimmed
        ? 'rgba(160,174,192,0.15)'
        : riskColor(node.riskLevel);
      ctx.fill();

      // Ring for highlighted
      if (isHighlighted && (node.id === hoverNodeId || node.id === highlightNodeId)) {
        ctx.strokeStyle = '#2D3748';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Community border
      if (!isDimmed && !isHighlighted) {
        ctx.strokeStyle = communityColor(node.communityId);
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }

      // Label (only when zoomed in enough or node is important)
      const showLabel = globalScale > 1.2 || node.degree >= 5 || isHighlighted;
      if (showLabel && !isDimmed) {
        const fontSize = Math.max(10, 12 / globalScale);
        ctx.font = `${fontSize}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillStyle = isDimmed ? 'rgba(0,0,0,0.1)' : '#1A202C';
        const label = node.name.length > 22 ? node.name.slice(0, 20) + '…' : node.name;
        ctx.fillText(label, x, y + r + 2);
      }
    },
    [neighborSet, hoverNodeId, highlightNodeId],
  );

  // Pointer area for accurate click/hover
  const paintNodeArea = useCallback(
    (node: GraphNode, color: string, ctx: CanvasRenderingContext2D) => {
      const { x, y } = node;
      if (x == null || y == null) return;
      const r = nodeRadius(node.degree) + 2;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
    },
    [],
  );

  const graphData = useMemo(() => ({ nodes: [...nodes], links: [...links] }), [nodes, links]);

  return (
    <div ref={containerRef} style={{ width: '100%', height }} data-testid="network-graph">
      <ForceGraph2D
        ref={graphRef}
        graphData={graphData}
        width={containerWidth}
        height={height}
        nodeCanvasObject={paintNode}
        nodePointerAreaPaint={paintNodeArea}
        linkWidth={(link: GraphLink) => Math.max(0.5, Math.sqrt(link.sharedTenders ?? 1))}
        linkColor={(link: GraphLink) => {
          if (!neighborSet) return 'rgba(160,174,192,0.25)';
          const sid = typeof link.source === 'object' ? (link.source as VisualNode).id : link.source;
          const tid = typeof link.target === 'object' ? (link.target as VisualNode).id : link.target;
          return neighborSet.has(sid) && neighborSet.has(tid)
            ? 'rgba(45,55,72,0.6)'
            : 'rgba(160,174,192,0.08)';
        }}
        onNodeClick={handleNodeClick}
        onNodeHover={handleNodeHover}
        cooldownTicks={150}
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.3}
        enableZoomInteraction
        enablePanInteraction
      />
    </div>
  );
}

// ── Legend sub-component ─────────────────────────────────────────

export function GraphLegend() {
  const items = [
    { color: RISK_COLORS.high, label: 'Alto riesgo' },
    { color: RISK_COLORS.medium, label: 'Riesgo medio' },
    { color: RISK_COLORS.low, label: 'Bajo riesgo' },
    { color: '#A0AEC0', label: 'Sin evaluación' },
  ];
  return (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', padding: '8px 0' }}>
      {items.map((it) => (
        <div key={it.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: it.color,
              display: 'inline-block',
            }}
          />
          <span style={{ fontSize: 12, color: '#4A5568' }}>{it.label}</span>
        </div>
      ))}
    </div>
  );
}
