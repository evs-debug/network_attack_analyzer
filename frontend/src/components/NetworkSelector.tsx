import { useState, type FormEvent } from 'react';
import { useNetwork } from '../context/NetworkContext';

export default function NetworkSelector() {
  const { networks, selectedId, selectNetwork, createNetwork, loading } = useNetwork();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setSubmitting(true);
    try {
      await createNetwork(newName.trim());
      setNewName('');
      setCreating(false);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className="px-3 text-xs text-text-muted">Loading networks...</p>;

  return (
    <div className="mb-6 px-3">
      <p className="mb-1 text-xs uppercase tracking-wide text-text-muted">Network</p>
      <select
        value={selectedId ?? ''}
        onChange={(e) => selectNetwork(Number(e.target.value))}
        className="w-full rounded-md border border-panel-border bg-canvas px-2 py-1.5 font-mono text-sm text-text-primary focus:border-accent focus:outline-none"
      >
        {networks.map((n) => (
          <option key={n.id} value={n.id}>{n.name}</option>
        ))}
      </select>

      {creating ? (
        <form onSubmit={handleCreate} className="mt-2 flex gap-1">
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Network name"
            className="w-full rounded-md border border-panel-border bg-canvas px-2 py-1 text-sm text-text-primary focus:border-accent focus:outline-none"
          />
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-accent px-2 py-1 text-xs font-medium text-canvas disabled:opacity-40"
          >
            Add
          </button>
        </form>
      ) : (
        <button onClick={() => setCreating(true)} className="mt-2 text-xs text-accent hover:underline">
          + New network
        </button>
      )}
    </div>
  );
}
