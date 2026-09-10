cat > src/components/NetworkSelector.tsx << 'EOF'
import { useEffect, useState, type FormEvent } from 'react';
import { useNetwork } from '../context/NetworkContext';
import { api } from '../api/client';
import type { TemplateSummary } from '../api/types';

type Mode = 'closed' | 'blank' | 'template';

export default function NetworkSelector() {
  const { networks, selectedId, selectNetwork, createNetwork, createFromTemplate, loading } = useNetwork();
  const [mode, setMode] = useState<Mode>('closed');
  const [newName, setNewName] = useState('');
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (mode === 'template' && templates.length === 0) {
      api.listTemplates().then((list) => {
        setTemplates(list);
        if (list.length > 0) setSelectedTemplate(list[0].id);
      });
    }
  }, [mode, templates.length]);

  function closeAndReset() {
    setMode('closed');
    setNewName('');
  }

  async function handleCreateBlank(e: FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setSubmitting(true);
    try {
      await createNetwork(newName.trim());
      closeAndReset();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreateFromTemplate(e: FormEvent) {
    e.preventDefault();
    if (!newName.trim() || !selectedTemplate) return;
    setSubmitting(true);
    try {
      await createFromTemplate(selectedTemplate, newName.trim());
      closeAndReset();
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

      {mode === 'closed' && (
        <div className="mt-2 flex flex-col gap-1">
          <button onClick={() => setMode('blank')} className="text-left text-xs text-accent hover:underline">
            + New blank network
          </button>
          <button onClick={() => setMode('template')} className="text-left text-xs text-accent hover:underline">
            + New from template
          </button>
        </div>
      )}

      {mode === 'blank' && (
        <form onSubmit={handleCreateBlank} className="mt-2 flex gap-1">
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Network name"
            className="w-full rounded-md border border-panel-border bg-canvas px-2 py-1 text-sm text-text-primary focus:border-accent focus:outline-none"
          />
          <button type="submit" disabled={submitting} className="rounded-md bg-accent px-2 py-1 text-xs font-medium text-canvas disabled:opacity-40">
            Add
          </button>
        </form>
      )}

      {mode === 'template' && (
        <form onSubmit={handleCreateFromTemplate} className="mt-2 flex flex-col gap-2 rounded-md border border-panel-border bg-panel p-2">
          <select
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
            className="w-full rounded-md border border-panel-border bg-canvas px-2 py-1 text-xs text-text-primary focus:border-accent focus:outline-none"
          >
            {templates.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          {selectedTemplate && (
            <p className="text-xs text-text-muted">
              {templates.find((t) => t.id === selectedTemplate)?.description}
            </p>
          )}
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Name for this network"
            className="w-full rounded-md border border-panel-border bg-canvas px-2 py-1 text-xs text-text-primary focus:border-accent focus:outline-none"
          />
          <div className="flex gap-1">
            <button type="submit" disabled={submitting} className="flex-1 rounded-md bg-accent px-2 py-1 text-xs font-medium text-canvas disabled:opacity-40">
              Create
            </button>
            <button type="button" onClick={closeAndReset} className="rounded-md border border-panel-border px-2 py-1 text-xs text-text-muted hover:text-text-primary">
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
EOF