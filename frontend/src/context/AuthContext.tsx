import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, getStoredToken, setStoredToken, clearStoredToken } from '../api/client';
import type { UserSummary } from '../api/types';

interface AuthContextValue {
  user: UserSummary | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getStoredToken()) {
      setLoading(false);
      return;
    }
    api.me()
      .then(setUser)
      .catch(() => clearStoredToken())
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const res = await api.login(email, password);
    setStoredToken(res.access_token);
    setUser(await api.me());
  }

  async function signup(email: string, password: string) {
    const res = await api.signup(email, password);
    setStoredToken(res.access_token);
    setUser(await api.me());
  }

  function logout() {
    clearStoredToken();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
