import { useEffect, useRef, useState } from 'react';
import {
  forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide,
  type SimulationNodeDatum, type SimulationLinkDatum, type Simulation,
} from 'd3-force';

interface AmbientNode extends SimulationNodeDatum { id: string; }
interface AmbientLink extends SimulationLinkDatum<AmbientNode> {}

const AMBIENT_NODES: AmbientNode[] = [
  { id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }, { id: 'e' },
  { id: 'f' }, { id: 'g' }, { id: 'h' }, { id: 'i' },
];
const AMBIENT_LINKS: AmbientLink[] = [
  { source: 'a', target: 'b' }, { source: 'b', target: 'c' }, { source: 'c', target: 'd' },
  { source: 'b', target: 'e' }, { source: 'd', target: 'f' }, { source: 'c', target: 'g' },
  { source: 'e', target: 'h' }, { source: 'f', target: 'i' }, { source: 'g', target: 'i' },
];
const PULSE_PATH = ['a', 'b', 'c', 'd'];
const PULSE_SEGMENT_MS = 1400;

// Fixed, full-viewport, decorative-only network animation. Used as a
// shared ambient background wherever the app wants some subtle life
// behind the content (landing page, auth screens).
export default function AmbientGraphBackground({ opacity = 0.22 }: { opacity?: number }) {
  const [nodes, setNodes] = useState<AmbientNode[]>([]);
  const [links, setLinks] = useState<AmbientLink[]>([]);
  const [pulse, setPulse] = useState({ x: 0, y: 0 });
  const [dims, setDims] = useState({ w: window.innerWidth, h: window.innerHeight });
  const simRef = useRef<Simulation<AmbientNode, AmbientLink> | null>(null);

  useEffect(() => {
    function onResize() { setDims({ w: window.innerWidth, h: window.innerHeight }); }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const n = AMBIENT_NODES.map((d) => ({ ...d }));
    const l = AMBIENT_LINKS.map((d) => ({ ...d }));
    const simulation = forceSimulation<AmbientNode>(n)
      .force('link', forceLink<AmbientNode, AmbientLink>(l).id((d) => d.id).distance(220).strength(0.4))
      .force('charge', forceManyBody().strength(-280))
      .force('center', forceCenter(dims.w / 2, dims.h / 2))
      .force('collide', forceCollide(40))
      .alphaDecay(0.0006)
      .on('tick', () => { setNodes([...n]); setLinks([...l]); });
    simRef.current = simulation;
    return () => simulation.stop();
  }, [dims.w, dims.h]);

  useEffect(() => {
    let frame: number;
    let segmentIndex = 0;
    let segmentStart = performance.now();
    function tick(now: number) {
      const nodesById = new Map(nodes.map((n) => [n.id, n]));
      const from = nodesById.get(PULSE_PATH[segmentIndex]);
      const to = nodesById.get(PULSE_PATH[(segmentIndex + 1) % PULSE_PATH.length]);
      if (from?.x != null && from.y != null && to?.x != null && to.y != null) {
        const t = Math.min((now - segmentStart) / PULSE_SEGMENT_MS, 1);
        setPulse({ x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t });
        if (t >= 1) { segmentIndex = (segmentIndex + 1) % PULSE_PATH.length; segmentStart = now; }
      }
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [nodes]);

  return (
    <svg width={dims.w} height={dims.h} className="pointer-events-none fixed inset-0 z-0" style={{ opacity }}>
      {links.map((link, i) => {
        const src = link.source as AmbientNode;
        const tgt = link.target as AmbientNode;
        if (src.x == null || tgt.x == null) return null;
        return <line key={i} x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y} stroke="#4a3f6b" strokeWidth={1.5} />;
      })}
      {pulse.x > 0 && <circle cx={pulse.x} cy={pulse.y} r={4} fill="#ffffff" />}
      {nodes.map((n, i) => {
        if (n.x == null || n.y == null) return null;
        const colors = ['#8b5cf6', '#a97ff0', '#cbb8f5', '#f0a8d0', '#9b70e8', '#dba0dc', '#b98cf0', '#8b5cf6', '#cbb8f5'];
        return <circle key={n.id} cx={n.x} cy={n.y} r={10 + (i % 3) * 2} fill={colors[i % colors.length]} />;
      })}
    </svg>
  );
}
