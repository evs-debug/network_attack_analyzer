import { useEffect, useState } from 'react';
import { useNetwork } from '../context/NetworkContext';
import { api, ApiRequestError } from '../api/client';
import type { NetworkNode, ShortestPathResponse } from '../api/types';

const selectClass =
  'rounded-md border border-panel-border bg-canvas px-3 py-2 font-mono text-sm text-text-primary focus:border-accent focus:outline-none';

export default function ShortestPath() {
  const { selectedId } = useNetwork();
  const [nodes, setNodes] = useState<NetworkNode[]>([]);
  const [start, setStart] = useState('');
  const [target, setTarget] = useState('');
  const [result, setResult] = useState<ShortestPathResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedId == null) return;
    setResult(null);
    setError(null);
    api.networkById(selectedId).then((net) => {
      setNodes(net.nodes);
      if (net.nodes.length >= 2) {
        setStart(net.nodes[0].name);
        setTarget(net.nodes[net.nodes.length - 1].name);
      } else {
        setStart('');
        setTarget('');
      }
    });
  }, [selectedId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedId == null) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await api.shortestPathFor(selectedId, start, target);
      setResult(res);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  }

  if (selectedId == null) return <p className="text-text-muted">No network selected.</p>;

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-text-primary">Shortest Attack Path</h1>

      {nodes.length < 2 ? (
        <p className="text-text-muted">This network needs at least 2 nodes. Add some in Network Builder.</p>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}
