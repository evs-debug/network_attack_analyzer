import { useEffect, useState } from 'react';
import { api, ApiRequestError } from '../api/client';
import type { NetworkNode, ShortestPathResponse } from '../api/types';

const selectClass =
  'rounded-md border border-panel-border bg-canvas px-3 py-2 font-mono text-sm text-text-primary focus:border-accent focus:outline-none';

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
      <h1 className="mb-6 text-xl font-semibold text-text-primary">Shortest Attack Path</h1>

      <form onSubmit={handleSubmit} className="mb-6 flex items-end gap-4 rounded-lg border border-panel-border bg-panel p-4">
        <label className="flex flex-col gap-1 text-sm text-text-muted">
          Start
          <select value={start} onChange={(e) => setStart(e.target.value)} className={selectClass}>
            {nodes.map((n) => <option key={n.id} value={n.name}>{n.name}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-text-muted">
          Target
          <select value={target} onChange={(e) => setTarget(e.target.value)} className={selectClass}>
            {nodes.map((n) => <option key={n.id} value={n.name}>{n.name}</option>)}
          </select>
        </label>
        <button
          type="submit"
          disabled={loading || !start || !target}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-canvas transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {loading ? 'Finding...' : 'Find path'}
        </button>
      </form>

      {error && (
        <p className="rounded-md border border-risk-high/30 bg-risk-high/10 px-4 py-3 text-sm text-risk-high">
          {error}
        </p>
      )}

      {result && (
        <div className="rounded-lg border border-risk-low/30 bg-risk-low/10 px-4 py-3">
          <p className="text-sm text-text-muted">
            Cost <span className="font-mono text-risk-low">{result.cost}</span>
          </p>
          <p className="mt-1 font-mono text-text-primary">{result.path.join(' → ')}</p>
        </div>
      )}
    </div>
  );
}