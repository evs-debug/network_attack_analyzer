import { useEffect, useState } from 'react';
import { api, ApiRequestError } from '../api/client';
import type { NetworkNode, ShortestPathResponse } from '../api/types';

export default function ShortestPath() {
  const [nodes, setNodes] = useState<NetworkNode[]>([]);
  const [start, setStart] = useState('');
  const [target, setTarget] = useState('');
  const [result, setResult] = useState<ShortestPathResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Populate dropdowns from the real network, not hardcoded names --
    // if the sample network ever changes, this doesn't silently break.
    api.network().then((net) => {
      setNodes(net.nodes);
      if (net.nodes.length >= 2) {
        setStart(net.nodes[0].name);
        setTarget(net.nodes[net.nodes.length - 1].name);
      }
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await api.shortestPath(start, target);
      setResult(res);
    } catch (err) {
      // Surfaces the backend's actual 404 message (e.g. "No path found
      // between X and Y") rather than a generic failure string.
      setError(err instanceof ApiRequestError ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1>Shortest Attack Path</h1>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
        <label>
          Start
          <br />
          <select value={start} onChange={(e) => setStart(e.target.value)}>
            {nodes.map((n) => <option key={n.id} value={n.name}>{n.name}</option>)}
          </select>
        </label>
        <label>
          Target
          <br />
          <select value={target} onChange={(e) => setTarget(e.target.value)}>
            {nodes.map((n) => <option key={n.id} value={n.name}>{n.name}</option>)}
          </select>
        </label>
        <button type="submit" disabled={loading || !start || !target}>
          {loading ? 'Finding...' : 'Find Path'}
        </button>
      </form>

      {error && <p style={{ color: 'crimson' }}>{error}</p>}

      {result && (
        <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: '1rem' }}>
          <p><strong>Cost:</strong> {result.cost}</p>
          <p><strong>Path:</strong> {result.path.join(' → ')}</p>
        </div>
      )}
    </div>
  );
}
