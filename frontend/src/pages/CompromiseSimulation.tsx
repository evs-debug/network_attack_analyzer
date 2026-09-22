import { useEffect, useRef, useState } from 'react';
import {
  forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide,
  type SimulationNodeDatum, type SimulationLinkDatum, type Simulation,
} from 'd3-force';
import { useNetwork } from '../context/NetworkContext';
import { api, ApiRequestError } from '../api/client';
import type { NetworkResponse, CompromiseStep } from '../api/types';

const WIDTH = 640;
const HEIGHT = 480;
const PADDING = 40;
const STEP_DELAY_MS = 900;

interface SimNode extends SimulationNodeDatum { id: string; name: string; }
interface SimLink extends SimulationLinkDatum<SimNode> {}

export default function CompromiseSimulation() {
  const { selectedId } = useNetwork();
  const [data, setData] = useState<NetworkResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [startName, setStartName] = useState('');

  const [simNodes, setSimNodes] = useState<SimNode[]>([]);
  const [simLinks, setSimLinks] = useState<SimLink[]>([]);
  const simRef = useRef<Simulation<SimNode, SimLink> | null>(null);

  const [steps, setSteps] = useState<CompromiseStep[] | null>(null);
  const [revealedCount, setRevealedCount] = useState(0);
  const [running, setRunning] = useState(false);
  const [simError, setSimError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedId == null) return;
    setLoading(true);
    setSteps(null);
    setRevealedCount(0);
    api.networkById(selectedId)
      .then((net) => {
        setData(net);
        if (net.nodes.length > 0) setStartName(net.nodes[0].name);
      })
      .catch((err) => setError(err instanceof ApiRequestError ? err.message : 'Failed to load network'))
      .finally(() => setLoading(false));
  }, [selectedId]);

  // Static layout for the whole network -- computed once per network
  // load, independent of the compromise animation (which just recolors
  // these same positioned nodes over time).
  useEffect(() => {
    if (!data) return;

    const nodes: SimNode[] = data.nodes.map((n) => ({ id: n.name, name: n.name }));
    const links: SimLink[] = data.edges.map((e) => ({ source: e.source, target: e.target }));

    const simulation = forceSimulation<SimNode>(nodes)
      .force('link', forceLink<SimNode, SimLink>(links).id((d) => d.id).distance(170).strength(0.6))
      .force('charge', forceManyBody().strength(-500))
      .force('center', forceCenter(WIDTH / 2, HEIGHT / 2))
      .force('collide', forceCollide(38))
      .on('tick', () => {
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

  // Drives the reveal animation: once `steps` is set, increments
  // revealedCount on a timer until every step has been shown.
  useEffect(() => {
    if (!steps || revealedCount >= steps.length) {
      if (steps && revealedCount >= steps.length) setRunning(false);
      return;
    }
    const timer = setTimeout(() => setRevealedCount((c) => c + 1), STEP_DELAY_MS);
    return () => clearTimeout(timer);
  }, [steps, revealedCount]);

  async function handleRun() {
    if (selectedId == null || !startName) return;
    setSimError(null);
    setSteps(null);
    setRevealedCount(0);
    setRunning(true);
    try {
      const result = await api.compromiseSimulationFor(selectedId, startName);
      setSteps(result);
      setRevealedCount(1); // reveal the start node immediately
    } catch (err) {
      setSimError(err instanceof ApiRequestError ? err.message : 'Simulation failed');
      setRunning(false);
    }
  }

  if (loading) return <p className="text-text-muted">Loading network...</p>;
  if (error) return <p className="text-risk-high">Error: {error}</p>;
  if (!data) return null;

  const revealed = steps ? steps.slice(0, revealedCount) : [];
  const compromisedNames = new Set(revealed.map((s) => s.name));
  const latestStep = revealed[revealed.length - 1];

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-text-primary">Compromise Simulation</h1>
      <p className="mb-6 text-sm text-text-muted">
        Pick an entry point and watch how far an attacker could spread through this network, node by node.
      </p>

      <div className="mb-6 flex items-end gap-4 rounded-lg border border-panel-border bg-panel p-4">
        <label className="flex flex-col gap-1 text-sm text-text-muted">
          Start node
          <select
            value={startName}
            onChange={(e) => setStartName(e.target.value)}
            disabled={running}
            className="rounded-md border border-panel-border bg-canvas px-3 py-2 font-mono text-sm text-text-primary focus:border-accent focus:outline-none disabled:opacity-50"
          >
            {data.nodes.map((n) => <option key={n.id} value={n.name}>{n.name}</option>)}
          </select>
        </label>
        <button
          onClick={handleRun}
          disabled={running || !startName}
          className="rounded-md bg-gradient-to-br from-accent to-purple-800 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {running ? 'Simulating...' : 'Run Simulation'}
        </button>
        {steps && (
          <span className="pb-2 font-mono text-sm text-text-muted">
            {revealedCount} of {steps.length} compromised
          </span>
        )}
      </div>

      {simError && (
        <p className="mb-4 rounded-md border border-risk-high/30 bg-risk-high/10 px-4 py-3 text-sm text-risk-high">{simError}</p>
      )}

      <div className="inline-block rounded-lg border border-panel-border bg-panel p-4">
        <svg width={WIDTH} height={HEIGHT}>
          {simLinks.map((link, i) => {
            const src = link.source as SimNode;
            const tgt = link.target as SimNode;
            if (src.x == null || tgt.x == null) return null;
            const isActiveEdge = latestStep?.via_edge && (
              (latestStep.via_edge.source === src.name && latestStep.name === tgt.name) ||
              (latestStep.via_edge.source === tgt.name && latestStep.name === src.name)
            );
            const bothCompromised = compromisedNames.has(src.name) && compromisedNames.has(tgt.name);
            return (
              <line
                key={i}
                x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y}
                stroke={isActiveEdge ? '#f0a8d0' : bothCompromised ? '#8b5cf6' : '#2a2340'}
                strokeWidth={isActiveEdge ? 3 : 2}
              />
            );
          })}
          {simNodes.map((sn) => {
            if (sn.x == null || sn.y == null) return null;
            const isCompromised = compromisedNames.has(sn.name);
            const isLatest = latestStep?.name === sn.name;
            return (
              <g key={sn.id}>
                {isLatest && (
                  <circle cx={sn.x} cy={sn.y} r={30} fill="none" stroke="#f0a8d0" strokeWidth={2} opacity={0.6}>
                    <animate attributeName="r" values="24;34;24" dur="1.2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.6;0;0.6" dur="1.2s" repeatCount="indefinite" />
                  </circle>
                )}
                <circle
                  cx={sn.x} cy={sn.y} r={24}
                  fill={isCompromised ? '#8b5cf6' : '#1e1a2b'}
                  stroke={isCompromised ? '#08070c' : '#3a2f57'}
                  strokeWidth={2}
                />
                <text x={sn.x} y={sn.y + 40} fontSize={11} fill="#f1eef8" fontFamily="var(--font-mono)" textAnchor="middle">
                  {sn.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {revealed.length > 0 && (
        <div className="mt-6 max-w-md">
          <h2 className="mb-3 text-sm font-medium text-text-muted">Sequence</h2>
          <div className="flex flex-col gap-1.5">
            {revealed.map((s) => (
              <div key={s.name} className="flex items-center gap-3 rounded-md border border-panel-border bg-panel/40 px-3 py-1.5 font-mono text-sm">
                <span className="text-text-muted">{String(s.step).padStart(2, '0')}</span>
                <span className="text-text-primary">{s.name}</span>
                {s.via_edge && (
                  <span className="text-text-muted">via {s.via_edge.source} ({s.via_edge.connection_type})</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
