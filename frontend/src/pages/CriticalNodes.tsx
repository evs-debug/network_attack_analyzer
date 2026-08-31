import { useEffect, useState } from 'react';
import { api, ApiRequestError } from '../api/client';
import type { CriticalNodesResponse } from '../api/types';

export default function CriticalNodes() {
  const [data, setData] = useState<CriticalNodesResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.criticalNodes()
      .then(setData)
      .catch((err) => {
        setError(err instanceof ApiRequestError ? err.message : 'Failed to load critical nodes');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading critical node report...</p>;
  if (error) return <p style={{ color: 'crimson' }}>Error: {error}</p>;
  if (!data) return null;

  const sorted = [...data.report].sort((a, b) => b.reachable_assets - a.reachable_assets);

  return (
    <div>
      <h1>Critical Node Report</h1>
      <div style={{ background: '#fef3c7', border: '1px solid #fbbf24', borderRadius: 8, padding: '1rem', marginBottom: '1.5rem' }}>
        <strong>Most Critical Node:</strong> {data.most_critical.name} — impact: {data.most_critical.impact} reachable assets
      </div>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', borderBottom: '2px solid #ccc', padding: '0.5rem' }}>Node</th>
            <th style={{ textAlign: 'right', borderBottom: '2px solid #ccc', padding: '0.5rem' }}>Reachable Assets</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((item) => (
            <tr key={item.name}>
              <td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>{item.name}</td>
              <td style={{ padding: '0.5rem', borderBottom: '1px solid #eee', textAlign: 'right' }}>{item.reachable_assets}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
