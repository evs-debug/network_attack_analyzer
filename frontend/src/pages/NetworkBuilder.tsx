import { useEffect, useState, type FormEvent } from 'react';
import { useNetwork } from '../context/NetworkContext';
import { api, ApiRequestError } from '../api/client';
import type { NetworkResponse } from '../api/types';

const inputClass =
  'w-full rounded-md border border-panel-border bg-canvas px-2 py-1.5 font-mono text-sm text-text-primary focus:border-accent focus:outline-none';

const emptyNodeForm = { name: '', type: '', vulnerability_score: 5, criticality_score: 5, asset_value: 5 };
const emptyEdgeForm = { source_node_id: '', target_node_id: '', connection_type: '', access_level: 1 };

export default function NetworkBuilder() {
  const { selectedId, networks } = useNetwork();
  const [data, setData] = useState<NetworkResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [nodeForm, setNodeForm] = useState(emptyNodeForm);
  const [edgeForm, setEdgeForm] = useState(emptyEdgeForm);

  useEffect(() => {
    if (selectedId == null) return;
    setLoading(true);
    api.networkById(selectedId)
      .then(setData)
      .catch((err) => setError(err instanceof ApiRequestError ? err.message : 'Failed to load network'))
      .finally(() => setLoading(false));
  }, [selectedId]);

  async function handleAddNode(e: FormEvent) {
    e.preventDefault();
    if (selectedId == null || !nodeForm.name.trim() || !nodeForm.type.trim()) return;
    setError(null);
    try {
      const updated = await api.addNode(selectedId, nodeForm);
      setData(updated);
      setNodeForm(emptyNodeForm);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Failed to add node');
    }
  }

  async function handleDeleteNode(nodeId: number) {
    if (selectedId == null) return;
    setError(null);
    try {
      const updated = await api.deleteNode(selectedId, nodeId);
      setData(updated);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Failed to delete node');
    }
  }

  async function handleAddEdge(e: FormEvent) {
    e.preventDefault();
    if (selectedId == null || !edgeForm.source_node_id || !edgeForm.target_node_id || !edgeForm.connection_type.trim()) return;
    setError(null);
    try {
      const updated = await api.addEdge(selectedId, {
        source_node_id: Number(edgeForm.source_node_id),
        target_node_id: Number(edgeForm.target_node_id),
        connection_type: edgeForm.connection_type,
        access_level: edgeForm.access_level,
      });
      setData(updated);
      setEdgeForm(emptyEdgeForm);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Failed to add edge');
    }
  }

  async function handleDeleteEdge(edgeId: number) {
    if (selectedId == null) return;
    setError(null);
    try {
      const updated = await api.deleteEdge(selectedId, edgeId);
      setData(updated);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Failed to delete edge');
    }
  }

  const networkName = networks.find((n) => n.id === selectedId)?.name ?? '';

  if (selectedId == null) return <p className="text-text-muted">No network selected.</p>;
  if (loading) return <p className="text-text-muted">Loading network...</p>;

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-text-primary">Network Builder</h1>
      <p className="mb-6 text-sm text-text-muted">Editing: <span className="font-mono text-text-primary">{networkName}</span></p>

      {error && (
        <p className="mb-4 rounded-md border border-risk-high/30 bg-risk-high/10 px-4 py-3 text-sm text-risk-high">{error}</p>
      )}

      <div className="grid grid-cols-2 gap-6">
        <div>
          <h2 className="mb-3 text-sm font-medium text-text-muted">Add Node</h2>
          <form onSubmit={handleAddNode} className="flex flex-col gap-2 rounded-lg border border-panel-border bg-panel p-4">
            <input placeholder="Name" value={nodeForm.name} onChange={(e) => setNodeForm({ ...nodeForm, name: e.target.value })} className={inputClass} />
            <input placeholder="Type" value={nodeForm.type} onChange={(e) => setNodeForm({ ...nodeForm, type: e.target.value })} className={inputClass} />
            <label className="text-xs text-text-muted">
              Vulnerability (1-10)
              <input type="number" min={1} max={10} value={nodeForm.vulnerability_score}
                onChange={(e) => setNodeForm({ ...nodeForm, vulnerability_score: Number(e.target.value) })} className={inputClass} />
            </label>
            <label className="text-xs text-text-muted">
              Criticality (1-10)
              <input type="number" min={1} max={10} value={nodeForm.criticality_score}
                onChange={(e) => setNodeForm({ ...nodeForm, criticality_score: Number(e.target.value) })} className={inputClass} />
            </label>
            <label className="text-xs text-text-muted">
              Asset Value (1-10)
              <input type="number" min={1} max={10} value={nodeForm.asset_value}
                onChange={(e) => setNodeForm({ ...nodeForm, asset_value: Number(e.target.value) })} className={inputClass} />
            </label>
            <button type="submit" className="mt-1 rounded-md bg-accent px-3 py-2 text-sm font-medium text-canvas hover:opacity-90">
              Add Node
            </button>
          </form>

          <h2 className="mb-3 mt-6 text-sm font-medium text-text-muted">Nodes ({data?.nodes.length ?? 0})</h2>
          <div className="flex flex-col gap-2">
            {data?.nodes.map((node) => (
              <div key={node.id} className="flex items-center justify-between rounded-md border border-panel-border bg-panel/40 px-3 py-2">
                <span className="font-mono text-sm text-text-primary">{node.name} <span className="text-text-muted">({node.type})</span></span>
                <button onClick={() => handleDeleteNode(node.id)} className="text-xs text-risk-high hover:underline">Remove</button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-medium text-text-muted">Add Edge</h2>
          <form onSubmit={handleAddEdge} className="flex flex-col gap-2 rounded-lg border border-panel-border bg-panel p-4">
            <select value={edgeForm.source_node_id} onChange={(e) => setEdgeForm({ ...edgeForm, source_node_id: e.target.value })} className={inputClass}>
              <option value="">Source node...</option>
              {data?.nodes.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
            </select>
            <select value={edgeForm.target_node_id} onChange={(e) => setEdgeForm({ ...edgeForm, target_node_id: e.target.value })} className={inputClass}>
              <option value="">Target node...</option>
              {data?.nodes.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
            </select>
            <input placeholder="Connection type (e.g. HTTPS)" value={edgeForm.connection_type}
              onChange={(e) => setEdgeForm({ ...edgeForm, connection_type: e.target.value })} className={inputClass} />
            <label className="text-xs text-text-muted">
              Access Level (1-5)
              <input type="number" min={1} max={5} value={edgeForm.access_level}
                onChange={(e) => setEdgeForm({ ...edgeForm, access_level: Number(e.target.value) })} className={inputClass} />
            </label>
            <button type="submit" className="mt-1 rounded-md bg-accent px-3 py-2 text-sm font-medium text-canvas hover:opacity-90">
              Add Edge
            </button>
          </form>

          <h2 className="mb-3 mt-6 text-sm font-medium text-text-muted">Edges ({data?.edges.length ?? 0})</h2>
          <div className="flex flex-col gap-2">
            {data?.edges.map((edge) => (
              <div key={edge.id} className="flex items-center justify-between rounded-md border border-panel-border bg-panel/40 px-3 py-2">
                <span className="font-mono text-sm text-text-primary">
                  {edge.source} <span className="text-text-muted">&rarr;</span> {edge.target}
                  <span className="ml-2 text-xs text-text-muted">({edge.connection_type})</span>
                </span>
                <button onClick={() => handleDeleteEdge(edge.id)} className="text-xs text-risk-high hover:underline">Remove</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
