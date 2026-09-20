import { useEffect, useRef, useState, type ReactNode } from 'react';
import AmbientGraphBackground from '../components/AmbientGraphBackground';

const SECTION_IDS = ['hero', 'risk', 'path', 'topo', 'about', 'cta'] as const;

function IconBadge({ color, children }: { color: string; children: ReactNode }) {
  return (
    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg" style={{ background: `${color}22`, border: `1px solid ${color}55` }}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {children}
      </svg>
    </div>
  );
}

function RiskIcon() { return <><path d="M4 20V13" /><path d="M11 20V8" /><path d="M18 20V4" /></>; }
function PathIcon() { return <><circle cx="4" cy="18" r="2" /><circle cx="20" cy="6" r="2" /><path d="M6 17l6-6 4 4 3-3" strokeDasharray="3 3" /></>; }
function TopoIcon() { return <><circle cx="6" cy="6" r="2.5" /><circle cx="18" cy="6" r="2.5" /><circle cx="12" cy="18" r="2.5" /><path d="M8 7l7-1M9 8l3 8M15 8l-3 8" /></>; }

// Small in-card diagrams -- a scaled-down, static preview of what
// that capability actually looks like in the real app.
function RiskDiagram({ color }: { color: string }) {
  const bars = [0.9, 0.65, 0.4, 0.25];
  return (
    <svg width="220" height="160" viewBox="0 0 220 160">
      {bars.map((h, i) => (
        <rect key={i} x={20 + i * 50} y={140 - h * 110} width="30" height={h * 110} rx="4" fill={i === 0 ? color : `${color}55`} />
      ))}
    </svg>
  );
}
function PathDiagram({ color }: { color: string }) {
  return (
    <svg width="220" height="160" viewBox="0 0 220 160">
      <path d="M20 130 L80 60 L140 90 L200 30" stroke="#4a3f6b" strokeWidth="2" fill="none" strokeDasharray="4 4" />
      <path d="M20 130 L80 60" stroke={color} strokeWidth="3" fill="none" />
      <circle cx="20" cy="130" r="8" fill={color} />
      <circle cx="80" cy="60" r="6" fill="#3a2f57" stroke={color} strokeWidth="2" />
      <circle cx="140" cy="90" r="6" fill="#3a2f57" stroke="#4a3f6b" strokeWidth="2" />
      <circle cx="200" cy="30" r="8" fill="#f0a8d0" />
    </svg>
  );
}
function TopoDiagram({ color }: { color: string }) {
  return (
    <svg width="220" height="160" viewBox="0 0 220 160">
      <line x1="50" y1="40" x2="170" y2="40" stroke="#4a3f6b" strokeWidth="1.5" />
      <line x1="50" y1="40" x2="60" y2="120" stroke="#4a3f6b" strokeWidth="1.5" />
      <line x1="170" y1="40" x2="160" y2="120" stroke="#4a3f6b" strokeWidth="1.5" />
      <line x1="60" y1="120" x2="160" y2="120" stroke="#4a3f6b" strokeWidth="1.5" />
      <circle cx="50" cy="40" r="10" fill={color} />
      <circle cx="170" cy="40" r="10" fill={`${color}99`} />
      <circle cx="60" cy="120" r="10" fill={`${color}66`} />
      <circle cx="160" cy="120" r="10" fill={`${color}44`} />
    </svg>
  );
}

function useActiveSection(refs: React.RefObject<HTMLElement | null>[]) {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = refs.findIndex((r) => r.current === entry.target);
            if (idx !== -1) setActive(idx);
          }
        }
      },
      { threshold: 0.55 }
    );
    refs.forEach((r) => { if (r.current) observer.observe(r.current); });
    return () => observer.disconnect();
  }, [refs]);
  return active;
}

interface SlideProps {
  children: ReactNode;
  active: boolean;
  direction?: 'left' | 'right' | 'center';
  innerRef: React.RefObject<HTMLElement | null>;
  className?: string;
}

function SnapSection({ children, active, direction = 'center', innerRef, className = '' }: SlideProps) {
  const hiddenTransform = direction === 'left' ? '-translate-x-16' : direction === 'right' ? 'translate-x-16' : 'scale-95';
  return (
    <section
      ref={innerRef as React.RefObject<HTMLDivElement>}
      style={{ scrollSnapStop: "always" }}
      className={`relative z-10 flex h-screen w-full shrink-0 snap-start flex-col items-center justify-center px-6 transition-all duration-700 ease-out ${
        active ? 'translate-x-0 scale-100 opacity-100' : `${hiddenTransform} opacity-0`
      } ${className}`}
    >
      {children}
    </section>
  );
}

function FeatureCard({ index, color, icon, title, diagram, children }: { index: string; color: string; icon: ReactNode; title: string; diagram: ReactNode; children: ReactNode }) {
  return (
    <div className="relative flex w-full max-w-3xl items-center gap-10 rounded-xl border border-panel-border bg-panel p-10">
      <span className="absolute right-6 top-6 font-mono text-xs text-text-muted">{index}</span>
      <div className="flex-1 text-left">
        <IconBadge color={color}>{icon}</IconBadge>
        <h2 className="mb-3 font-sans text-2xl font-bold text-text-primary">{title}</h2>
        <p className="font-mono text-sm leading-relaxed text-text-muted">{children}</p>
      </div>
      <div className="hidden shrink-0 items-center justify-center rounded-lg border border-panel-border bg-canvas/60 p-4 sm:flex">
        {diagram}
      </div>
    </div>
  );
}

export default function Landing({ onStart }: { onStart: () => void }) {
  const refs = SECTION_IDS.map(() => useRef<HTMLElement | null>(null));
  const active = useActiveSection(refs);

  function scrollTo(i: number) {
    refs[i].current?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <div className="relative h-screen snap-y snap-mandatory overflow-y-scroll bg-canvas text-text-primary">
      <AmbientGraphBackground />

      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.05]"
        style={{ backgroundImage: 'radial-gradient(#f1eef8 1px, transparent 1px)', backgroundSize: '28px 28px' }}
      />

      <div className="fixed right-6 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-3">
        {SECTION_IDS.map((id, i) => (
          <button
            key={id}
            onClick={() => scrollTo(i)}
            aria-label={`Go to section ${i + 1}`}
            className={`h-2.5 w-2.5 rounded-full transition-all ${active === i ? 'scale-125 bg-accent' : 'bg-panel-border hover:bg-text-muted'}`}
          />
        ))}
      </div>

      <SnapSection innerRef={refs[0]} active={active === 0}>
        <div className="absolute right-16 top-8 z-10 flex gap-5">
          <a href="https://github.com/evs-debug" className="font-mono text-sm text-text-muted hover:text-text-primary">GitHub</a>
          <a href="https://www.linkedin.com/in/eva-sharma700k/" className="font-mono text-sm text-text-muted hover:text-text-primary">LinkedIn</a>
        </div>
        <div className="relative z-10 flex max-w-2xl flex-col items-center text-center">
          <p className="mb-5 font-mono text-xs uppercase tracking-[0.18em] text-text-muted">Network Attack Analyzer</p>
          <h1 className="mb-5 font-sans text-5xl font-extrabold leading-tight text-text-primary">Every network has a weakest link.</h1>
          <p className="mb-9 font-mono text-base leading-relaxed text-text-muted">
            Model any network as an attack graph, score its risk, and trace the shortest path an attacker could take — before someone else finds it.
          </p>
          <button onClick={onStart} className="rounded-lg bg-gradient-to-br from-accent to-purple-800 px-8 py-3 font-sans text-sm font-semibold text-white shadow-lg shadow-accent/30 transition-opacity hover:opacity-90">
            Get Started
          </button>
          <p className="mt-6 font-mono text-xs text-text-muted">Scroll to explore ↓</p>
        </div>
      </SnapSection>

      <SnapSection innerRef={refs[1]} active={active === 1} direction="left">
        <FeatureCard index="01" color="#8b5cf6" icon={<RiskIcon />} diagram={<RiskDiagram color="#8b5cf6" />} title="Risk Scoring">
          Every asset ranked by vulnerability, criticality, and value — so you know exactly which parts of your network deserve attention first.
        </FeatureCard>
      </SnapSection>

      <SnapSection innerRef={refs[2]} active={active === 2} direction="right">
        <FeatureCard index="02" color="#cbb8f5" icon={<PathIcon />} diagram={<PathDiagram color="#cbb8f5" />} title="Shortest Attack Path">
          Trace the fastest route an attacker could take from any entry point to any target, computed with real shortest-path graph algorithms.
        </FeatureCard>
      </SnapSection>

      <SnapSection innerRef={refs[3]} active={active === 3} direction="left">
        <FeatureCard index="03" color="#f0a8d0" icon={<TopoIcon />} diagram={<TopoDiagram color="#f0a8d0" />} title="Custom Topologies">
          Build your own network node by node, or start from a preset template — office, cloud, or home — and analyze it instantly.
        </FeatureCard>
      </SnapSection>

      <SnapSection innerRef={refs[4]} active={active === 4}>
        <div className="max-w-2xl rounded-xl border border-panel-border bg-panel p-10 text-center">
          <h2 className="mb-4 font-sans text-2xl font-bold text-text-primary">About this project</h2>
          <p className="font-mono text-sm leading-relaxed text-text-muted">
            Network Attack Analyzer models any network as a graph of assets and connections, then runs real graph
            algorithms — shortest-path search, reachability analysis, weighted risk scoring — to answer the question
            every security team asks: if an attacker got in, how would they move, and what's the fastest route to
            something that matters. The graph itself is force-directed and fully interactive — drag any node and
            watch the layout react live.
          </p>
        </div>
      </SnapSection>

      <SnapSection innerRef={refs[5]} active={active === 5}>
        <div className="text-center">
          <h2 className="mb-8 font-sans text-3xl font-bold text-text-primary">Ready to find your weakest link?</h2>
          <button onClick={onStart} className="rounded-lg bg-gradient-to-br from-accent to-purple-800 px-8 py-3 font-sans text-sm font-semibold text-white shadow-lg shadow-accent/30 transition-opacity hover:opacity-90">
            Start Now
          </button>
        </div>
      </SnapSection>
    </div>
  );
}
