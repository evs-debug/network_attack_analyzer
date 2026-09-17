import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <p className="p-8 text-text-muted">Loading...</p>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
