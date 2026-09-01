import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { api } from '../api/client';
import type { NetworkSummary } from '../api/types';

const STORAGE_KEY = 'naa_selected_network_id';

interface NetworkContextValue {
  networks: NetworkSummary[];
  selectedId: number | null;
  selectNetwork: (id: number) => void;
  createNetwork: (name: string) => Promise<void>;
  refresh: () => Promise<void>;
  loading: boolean;
}

const NetworkContext = createContext<NetworkContextValue | null>(null);

export function NetworkProvider({ children }: { children: ReactNode }) {
  const [networks, setNetworks] = useState<NetworkSummary[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const list = await api.listNetworks();
    setNetworks(list);

    setSelectedId((current) => {
      if (current != null && list.some((n) => n.id === current)) return current;
      const stored = Number(localStorage.getItem(STORAGE_KEY));
      if (stored && list.some((n) => n.id === stored)) return stored;
      return list.length > 0 ? list[0].id : null;
    });
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  function selectNetwork(id: number) {
    setSelectedId(id);
    localStorage.setItem(STORAGE_KEY, String(id));
  }

  async function createNetwork(name: string) {
    const created = await api.createNetwork(name);
    await refresh();
    selectNetwork(created.id);
  }

  return (
    <NetworkContext.Provider value={{ networks, selectedId, selectNetwork, createNetwork, refresh, loading }}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  const ctx = useContext(NetworkContext);
  if (!ctx) throw new Error('useNetwork must be used within a NetworkProvider');
  return ctx;
}
