import { useEffect, useState } from 'react';
import { api, ApiRequestError } from '../api/client';
import type { NetworkResponse } from '../api/types';

const SIZE = 420;
const CENTER = SIZE / 2;
const RADIUS = 160;

function riskColor(score: number, maxScore: number): string {
  // Green (low risk) -> red (high risk), linear interpolation.
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

  useEffect(() => {
    api.network()
      .then(setData)
      .catch((err) => {
        setError(err instanceof ApiRequestError ? err.message : 'Failed to load network');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading network...</p>;
  if (error) return <p style={{ color: 'crimson' }}>Error: {error}</p>;
  if (!data) return null;

  const maxRisk = Math.max(...data.nodes.map((n) => n.risk_score));

  // Circular layout: evenly space nodes around a circle by index. Fine
  // for a small sample network (5 nodes); would need a real layout
  // algorithm (force-directed etc.) for larger graphs.
  const positions = new Map<string, { x: number; y: number }>();
  data.nodes.forEach((node, i) => {
    const angle = (i / data.nodes.length) * 2 * Math.PI - Math.PI / 2;
    positions.set(node.name, {
      x: CENTER + RADIUS * Math.cos(angle),
      y: CENTER + RADIUS * Math.sin(angle),
    });
  });

  return (
    <div>
      <h1>Network Graph</h1>
      <svg width={SIZE} height={SIZE} style={{ border: '1px solid #eee', borderRadius: 8 }}>
        {data.edges.map((edge, i) => {
          const src = positions.get(edge.source);
          const tgt = positions.get(edge.target);
          if (!src || !tgt) return null;
          const midX = (src.x + tgt.x) / 2;
          const midY = (src.y + tgt.y) / 2;
          return (
            <g key={i}>
              <line x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y} stroke="#cbd5e1" strokeWidth={2} />
              <text x={midX} y={midY} fontSize={10} fill="#64748b" textAnchor="middle">
                {edge.connection_type}
              </text>
            </g>
          );
        })}
        {data.nodes.map((node) => {
          const pos = positions.get(node.name);
          if (!pos) return null;
          return (
            <g key={node.id}>
              <circle cx={pos.x} cy={pos.y} r={28} fill={riskColor(node.risk_score, maxRisk)} stroke="white" strokeWidth={2} />
              <text x={pos.x} y={pos.y + 4} fontSize={11} fill="white" textAnchor="middle" fontWeight={700}>
                {node.risk_score}
              </text>
              <text x={pos.x} y={pos.y + 45} fontSize={11} fill="#0f172a" textAnchor="middle">
                {node.name}
              </text>
            </g>
          );
        })}
      </svg>
      <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.5rem' }}>
        Node color/number = risk score. Edge labels = connection type.
      </p>
    </div>
  );
}
