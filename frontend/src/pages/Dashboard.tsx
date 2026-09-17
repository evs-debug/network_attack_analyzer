import { useEffect, useRef, useState } from 'react';
import { useNetwork } from '../context/NetworkContext';
import { api, ApiRequestError } from '../api/client';
import type { NetworkResponse } from '../api/types';

function riskBadgeClass(score: number, maxScore: number): string {
  const t = maxScore > 0 ? score / maxScore : 0;
  if (t >= 0.66) return 'bg-risk-high/15 text-risk-high';
  if (t >= 0.33) return 'bg-risk-mid/15 text-risk-mid';
  return 'bg-risk-low/15 text-risk-low';
}

// Animates from 0 up to `value` over `duration` ms whenever `value`
// changes (e.g. switching networks), using an eased curve so it
// settles rather than stopping abruptly.
function CountUp({ value, duration = 700 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const start = performance.now();
    const from = 0;

    function tick(now: number) {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      setDisplay(Math.round(from + (value - from) * eased));
      if (t < 1) frameRef.current = requestAnimationFrame(tick);
    }

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current != null) cancelAnimationFrame(frameRef.current);
    };
  }, [value, duration]);

  return <>{display}</>;
}

export default function Dashboard() {
  const { selectedId } = useNetwork();
  const [data, setData] = useState<NetworkResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (selectedId == null) return <p className="text-text-muted">No network selected.</p>;
  if (loading) return <p className="text-text-muted">Loading risk report...</p>;
  if (error) return <p className="text-risk-high">Error: {error}</p>;
  if (!data) return null;

  const sorted = [...data.nodes].sort((a, b) => b.risk_score - a.risk_score);
  const maxScore = Math.max(...data.nodes.map((n) => n.risk_score), 1);
  const avgRisk = data.nodes.length > 0
    ? Math.round(data.nodes.reduce((sum, n) => sum + n.risk_score, 0) / data.nodes.length)
    : 0;
  const mostCritical = sorted[0];

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-text-primary">Risk Report</h1>

      {data.nodes.length > 0 && (
        <div key={selectedId} className="mb-6 grid grid-cols-4 gap-4">
          <div className="rounded-lg border border-panel-border bg-panel p-4">
            <div className="text-xs uppercase tracking-wide text-text-muted">Nodes</div>
            <div className="mt-1 font-mono text-2xl text-text-primary"><CountUp value={data.nodes.length} /></div>
          </div>
          <div className="rounded-lg border border-panel-border bg-panel p-4">
            <div className="text-xs uppercase tracking-wide text-text-muted">Edges</div>
            <div className="mt-1 font-mono text-2xl text-text-primary"><CountUp value={data.edges.length} /></div>
          </div>
          <div className="rounded-lg border border-panel-border bg-panel p-4">
            <div className="text-xs uppercase tracking-wide text-text-muted">Avg Risk</div>
            <div className="mt-1 font-mono text-2xl text-accent"><CountUp value={avgRisk} /></div>
          </div>
          <div className="rounded-lg border border-risk-high/30 bg-risk-high/10 p-4">
            <div className="text-xs uppercase tracking-wide text-risk-high/80">Highest Risk</div>
            <div className="mt-1 truncate font-mono text-lg text-risk-high">{mostCritical.name}</div>
          </div>
        </div>
      )}

      {sorted.length === 0 ? (
        <p className="text-text-muted">This network has no nodes yet. Add some in Network Builder.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-panel-border">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-panel-border bg-panel">
                <th className="px-4 py-3 text-left text-sm font-medium text-text-muted">Asset</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-text-muted">Type</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-text-muted">Risk Score</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((item) => (
                <tr key={item.name} className="border-b border-panel-border bg-panel/40 last:border-b-0">
                  <td className="px-4 py-3 font-mono text-sm text-text-primary">{item.name}</td>
                  <td className="px-4 py-3 text-sm text-text-muted">{item.type}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`rounded px-2 py-0.5 font-mono text-sm ${riskBadgeClass(item.risk_score, maxScore)}`}>
                      {item.risk_score}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
