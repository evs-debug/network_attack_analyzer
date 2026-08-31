import { useEffect, useRef, useState } from 'react';
import {
  forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide,
  type SimulationNodeDatum, type SimulationLinkDatum, type Simulation,
} from 'd3-force';
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
  // Green (low risk) -> red (high risk), linear interpolation.
  // Endpoints match the --color-risk-low / --color-risk-high theme tokens.
  const t = maxScore > 0 ? Math.min(score / maxScore, 1) : 0;
  const r = Math.round(16 + t * (239 - 16));
  const g = Math.round(185 - t * (185 - 68));
  const b = Math.round(129 - t * (129 - 68));
  return `rgb(${r}, ${g}, ${b})`;
}

export default function NetworkGraph() {
  const [data, setData] = useState<NetworkResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [simNodes, setSimNodes] = useState<SimNode[]>([]);
  const [simLinks, setSimLinks] = useState<SimLink[]>([]);
  const simRef = useRef<Simulation<SimNode, SimLink> | null>(null);

  useEffect(() => {
    api.network()
      .then(setData)
      .catch((err) => {
        setError(err instanceof ApiRequestError ? err.message : 'Failed to load network');
      })
      .finally(() => setLoading(false));
  }, []);

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
        // Keep nodes within the visible canvas -- without this, less
        // connected nodes can drift off-screen on larger networks.
        for (const n of nodes) {
          n.x = Math.max(PADDING, Math.min(WIDTH - PADDING, n.x ?? WIDTH / 2));
          n.y = Math.max(PADDING, Math.min(HEIGHT - PADDING, n.y ?? HEIGHT / 2));
        }
        setSimNodes([...nodes]);
        setSimLinks([...links]);
      });

    simRef.current = simulation;
    return () => simulation.stop();
  }, [data]);

  if (loading) return <p className="text-text-muted">Loading network...</p>;
  if (error) return <p className="text-risk-high">Error: {error}</p>;
  if (!data) return null;

  const maxRisk = Math.max(...data.nodes.map((n) => n.risk_score));

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-text-primary">Network Graph</h1>
      <div className="inline-block rounded-lg border border-panel-border bg-panel p-4">
        <svg width={WIDTH} height={HEIGHT}>
          {simLinks.map((link, i) => {
            const src = link.source as SimNode;
            const tgt = link.target as SimNode;
            if (src.x == null || tgt.x == null || src.y == null || tgt.y == null) return null;
            const midX = (src.x + tgt.x) / 2;
            const midY = (src.y + tgt.y) / 2;
            return (
              <g key={i}>
                <line x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y} stroke="#3a4358" strokeWidth={2} />
                <text x={midX} y={midY} fontSize={10} fill="#8b93a7" fontFamily="var(--font-mono)" textAnchor="middle">
                  {link.connection_type}
                </text>
              </g>
            );
          })}
          {simNodes.map((sn) => {
            if (sn.x == null || sn.y == null) return null;
            const node = sn.node;
            return (
              <g key={node.id}>
                <circle cx={sn.x} cy={sn.y} r={28} fill={riskColor(node.risk_score, maxRisk)} stroke="#12161f" strokeWidth={2} />
                <text x={sn.x} y={sn.y + 4} fontSize={11} fill="#12161f" fontFamily="var(--font-mono)" textAnchor="middle" fontWeight={700}>
                  {node.risk_score}
                </text>
                <text x={sn.x} y={sn.y + 45} fontSize={11} fill="#e4e8f1" fontFamily="var(--font-mono)" textAnchor="middle">
                  {node.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <p className="mt-3 text-sm text-text-muted">
        Node color/number = risk score. Edge labels = connection type. Force-directed layout settles automatically for any network size.
      </p>
    </div>
  );
}