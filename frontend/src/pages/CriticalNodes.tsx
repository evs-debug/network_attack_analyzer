import { useEffect, useState } from 'react';
import { useNetwork } from '../context/NetworkContext';
import { api, ApiRequestError } from '../api/client';
import type { CriticalNodesResponse } from '../api/types';

export default function CriticalNodes() {
  const { selectedId } = useNetwork();
  const [data, setData] = useState<CriticalNodesResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (selectedId == null) return;
    setLoading(true);
    api.criticalNodesFor(selectedId)
      .then(setData)
      .catch((err) => {
        setError(err instanceof ApiRequestError ? err.message : 'Failed to load critical nodes');
      })
      .finally(() => setLoading(false));
  }, [selectedId]);

  if (selectedId == null) return <p className="text-text-muted">No network selected.</p>;
  if (loading) return <p className="text-text-muted">Loading critical node report...</p>;
  if (error) return <p className="text-risk-high">Error: {error}</p>;
  if (!data) return null;

  const sorted = [...data.report].sort((a, b) => b.reachable_assets - a.reachable_assets);

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-text-primary">Critical Node Report</h1>

      {sorted.length === 0 ? (
        <p className="text-text-muted">This network has no nodes yet. Add some in Network Builder.</p>
      ) : (
        <>
          <div className="mb-6 rounded-lg border border-risk-mid/30 bg-risk-mid/10 px-4 py-3">
            <p className="text-sm text-text-muted">Most critical node</p>
            <p className="mt-1">
              <span className="font-mono text-base text-text-primary">{data.most_critical.name}</span>
              <span className="ml-2 text-sm text-text-muted">
                — impact: <span className="text-risk-mid">{data.most_critical.impact}</span> reachable assets
              </span>
            </p>
          </div>

          <div className="overflow-hidden rounded-lg border border-panel-border">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-panel-border bg-panel">
                  <th className="px-4 py-3 text-left text-sm font-medium text-text-muted">Node</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-text-muted">Reachable Assets</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((item) => (
                  <tr key={item.name} className="border-b border-panel-border bg-panel/40 last:border-b-0">
                    <td className="px-4 py-3 font-mono text-sm text-text-primary">{item.name}</td>
                    <td className="px-4 py-3 text-right font-mono text-sm text-text-muted">{item.reachable_assets}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
