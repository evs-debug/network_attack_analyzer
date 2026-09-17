import { useEffect, useRef, useState } from 'react';
import {
  forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide,
  type SimulationNodeDatum, type SimulationLinkDatum, type Simulation,
} from 'd3-force';
import { useNetwork } from '../context/NetworkContext';
import { api, ApiRequestError } from '../api/client';
import type { NetworkResponse, NetworkNode } from '../api/types';

const WIDTH = 640;
const HEIGHT = 480;
const PADDING = 40;

interface SimNode extends SimulationNodeDatum {
  id: string; // node name, used as the link id key by forceLink
  node: NetworkNode;
}

interface SimLink extends SimulationLinkDatum<SimNode> {
  connection_type: string;
}

function riskColor(score: number, maxScore: number): string {
  // Violet (low risk) -> pink (high risk), linear interpolation.
  // Endpoints match the --color-risk-low / --color-risk-high theme tokens.
  const t = maxScore > 0 ? Math.min(score / maxScore, 1) : 0;
  const r = Math.round(139 + t * (240 - 139));
  const g = Math.round(92 + t * (168 - 92));
  const b = Math.round(246 + t * (208 - 246));
  return `rgb(${r}, ${g}, ${b})`;
}

// Maps a free-text node "type" (whatever the user typed in Network
// Builder) to one of a small set of recognizable device icons, via
// keyword matching -- with a generic fallback for anything custom.
function DeviceIcon({ type }: { type: string }) {
  const t = type.toLowerCase();
  const iconProps = { stroke: '#08070c', strokeWidth: 2, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

  if (t.includes('database') || t.includes('db')) {
    return (
      <g {...iconProps}>
        <ellipse cx="0" cy="-9" rx="10" ry="4" />
        <path d="M -10 -9 L -10 9 A 10 4 0 0 0 10 9 L 10 -9" />
        <path d="M -10 0 A 10 4 0 0 0 10 0" />
      </g>
    );
  }
  if (t.includes('router') || t.includes('gateway')) {
    return (
      <g {...iconProps}>
        <rect x="-12" y="-4" width="24" height="10" rx="2" />
        <line x1="-6" y1="-4" x2="-9" y2="-12" />
        <line x1="6" y1="-4" x2="9" y2="-12" />
        <circle cx="-6" cy="1" r="1" fill="#08070c" stroke="none" />
        <circle cx="0" cy="1" r="1" fill="#08070c" stroke="none" />
        <circle cx="6" cy="1" r="1" fill="#08070c" stroke="none" />
      </g>
    );
  }
  if (t.includes('firewall')) {
    return (
      <g {...iconProps}>
        <path d="M 0 -12 L 10 -8 L 10 2 C 10 8 5 12 0 14 C -5 12 -10 8 -10 2 L -10 -8 Z" />
      </g>
    );
  }
  if (t.includes('internet') || t.includes('cloud')) {
    return (
      <g {...iconProps}>
        <path d="M -9 4 A 5 5 0 0 1 -9 -6 A 6 6 0 0 1 3 -9 A 5 5 0 0 1 9 -1 A 4 4 0 0 1 9 4 Z" />
      </g>
    );
  }
  if (t.includes('server') || t.includes('controller')) {
    return (
      <g {...iconProps}>
        <rect x="-10" y="-12" width="20" height="24" rx="2" />
        <line x1="-10" y1="-4" x2="10" y2="-4" />
        <line x1="-10" y1="4" x2="10" y2="4" />
        <circle cx="-6" cy="-8" r="1" fill="#08070c" stroke="none" />
        <circle cx="-6" cy="0" r="1" fill="#08070c" stroke="none" />
        <circle cx="-6" cy="8" r="1" fill="#08070c" stroke="none" />
      </g>
    );
  }
  if (t.includes('workstation') || t.includes('computer') || t.includes('client') || t.includes('pc')) {
    return (
      <g {...iconProps}>
        <rect x="-11" y="-9" width="22" height="14" rx="1" />
        <line x1="0" y1="5" x2="0" y2="9" />
        <line x1="-6" y1="9" x2="6" y2="9" />
      </g>
    );
  }
  return (
    <g {...iconProps}>
      <rect x="-9" y="-9" width="18" height="18" rx="3" />
    </g>
  );
}

function EdgesLayer({ links }: { links: SimLink[] }) {
  return (
    <>
      {links.map((link, i) => {
        const src = link.source as SimNode;
        const tgt = link.target as SimNode;
        if (src.x == null || tgt.x == null || src.y == null || tgt.y == null) return null;
        const midX = (src.x + tgt.x) / 2;
        const midY = (src.y + tgt.y) / 2;
        return (
          <g key={i}>
            <line x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y} stroke="#3a2f57" strokeWidth={2} />
            <text x={midX} y={midY} fontSize={10} fill="#948da8" fontFamily="var(--font-mono)" textAnchor="middle">
              {link.connection_type}
            </text>
          </g>
        );
      })}
    </>
  );
}

export default function NetworkGraph() {
  const [data, setData] = useState<NetworkResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [simNodes, setSimNodes] = useState<SimNode[]>([]);
  const [simLinks, setSimLinks] = useState<SimLink[]>([]);
  const simRef = useRef<Simulation<SimNode, SimLink> | null>(null);

  const { selectedId } = useNetwork();

  useEffect(() => {
    if (selectedId == null) return;
    setLoading(true);
    api.networkById(selectedId)
      .then(setData)
      .catch((err) => {
        setError(err instanceof ApiRequestError ? err.message : 'Failed to load network');
      })
      .finally(() => setLoading(false));
  }, [selectedId]);

  useEffect(() => {
    if (!data) return;

    const nodes: SimNode[] = data.nodes.map((node) => ({ id: node.name, node }));
    const links: SimLink[] = data.edges.map((edge) => ({
      source: edge.source,
      target: edge.target,
      connection_type: edge.connection_type,
    }));

    const simulation = forceSimulation<SimNode>(nodes)
      .force('link', forceLink<SimNode, SimLink>(links).id((d) => d.id).distance(190).strength(0.6))
      .force('charge', forceManyBody().strength(-650))
      .force('center', forceCenter(WIDTH / 2, HEIGHT / 2))
      .force('collide', forceCollide(42))
      .on('tick', () => {
        for (const n of nodes) {
          // A node actively being dragged (fx/fy set) skips the canvas
          // clamp so it can follow the pointer right to the edge.
          if (n.fx == null) n.x = Math.max(PADDING, Math.min(WIDTH - PADDING, n.x ?? WIDTH / 2));
          if (n.fy == null) n.y = Math.max(PADDING, Math.min(HEIGHT - PADDING, n.y ?? HEIGHT / 2));
        }
        setSimNodes([...nodes]);
        setSimLinks([...links]);
      });

    simRef.current = simulation;
    return () => simulation.stop();
  }, [data]);

  // Drag handling: pins the node under the pointer (fx/fy) so d3-force
  // treats it as fixed while dragging, reheats the simulation so every
  // other node visibly reacts in real time, then releases it on pointer
  // up so it rejoins the physics and settles back in with everything
  // else. Both the force graph and the topology view render the same
  // SimNode objects, so dragging in either view moves it in both.
  function handlePointerDown(e: React.PointerEvent<SVGGElement>, sn: SimNode) {
    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);
    const svg = target.ownerSVGElement;
    if (!svg) return;

    sn.fx = sn.x;
    sn.fy = sn.y;
    simRef.current?.alphaTarget(0.3).restart();

    function handleMove(moveEvent: PointerEvent) {
      const rect = svg!.getBoundingClientRect();
      sn.fx = Math.max(PADDING, Math.min(WIDTH - PADDING, moveEvent.clientX - rect.left));
      sn.fy = Math.max(PADDING, Math.min(HEIGHT - PADDING, moveEvent.clientY - rect.top));
    }
    function handleUp() {
      sn.fx = null;
      sn.fy = null;
      simRef.current?.alphaTarget(0);
      target.removeEventListener('pointermove', handleMove);
      target.removeEventListener('pointerup', handleUp);
    }

    target.addEventListener('pointermove', handleMove);
    target.addEventListener('pointerup', handleUp);
  }

  if (loading) return <p className="text-text-muted">Loading network...</p>;
  if (error) return <p className="text-risk-high">Error: {error}</p>;
  if (!data) return null;

  const maxRisk = Math.max(...data.nodes.map((n) => n.risk_score), 1);

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-text-primary">Network Graph</h1>

      <div className="inline-block rounded-lg border border-panel-border bg-panel p-4">
        <svg width={WIDTH} height={HEIGHT}>
          <EdgesLayer links={simLinks} />
          {simNodes.map((sn) => {
            if (sn.x == null || sn.y == null) return null;
            const node = sn.node;
            return (
              <g key={node.id} onPointerDown={(e) => handlePointerDown(e, sn)} style={{ cursor: 'grab' }}>
                <circle cx={sn.x} cy={sn.y} r={28} fill={riskColor(node.risk_score, maxRisk)} stroke="#08070c" strokeWidth={2} />
                <text x={sn.x} y={sn.y + 4} fontSize={11} fill="#08070c" fontFamily="var(--font-mono)" textAnchor="middle" fontWeight={700} style={{ pointerEvents: 'none' }}>
                  {node.risk_score}
                </text>
                <text x={sn.x} y={sn.y + 45} fontSize={11} fill="#f1eef8" fontFamily="var(--font-mono)" textAnchor="middle" style={{ pointerEvents: 'none' }}>
                  {node.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <p className="mt-3 text-sm text-text-muted">
        Node color/number = risk score. Edge labels = connection type. Drag any node to see the layout react live.
      </p>

      <h2 className="mb-3 mt-8 text-lg font-semibold text-text-primary">Topology View</h2>
      <div className="inline-block rounded-lg border border-panel-border bg-panel p-4">
        <svg width={WIDTH} height={HEIGHT}>
          <EdgesLayer links={simLinks} />
          {simNodes.map((sn) => {
            if (sn.x == null || sn.y == null) return null;
            const node = sn.node;
            return (
              <g
                key={node.id}
                transform={`translate(${sn.x}, ${sn.y})`}
                onPointerDown={(e) => handlePointerDown(e, sn)}
                style={{ cursor: 'grab' }}
              >
                <rect x={-28} y={-28} width={56} height={56} rx={12} fill={riskColor(node.risk_score, maxRisk)} stroke="#08070c" strokeWidth={2} />
                <DeviceIcon type={node.type} />
                <text x={0} y={44} fontSize={11} fill="#f1eef8" fontFamily="var(--font-mono)" textAnchor="middle" style={{ pointerEvents: 'none' }}>
                  {node.name}
                </text>
                <text x={0} y={58} fontSize={10} fill="#948da8" fontFamily="var(--font-mono)" textAnchor="middle" style={{ pointerEvents: 'none' }}>
                  risk {node.risk_score}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <p className="mt-3 text-sm text-text-muted">
        Same layout, shown as device icons based on each node's type (server, database, router, firewall, workstation, or a generic icon for custom types). Drag works here too.
      </p>
    </div>
  );
}
