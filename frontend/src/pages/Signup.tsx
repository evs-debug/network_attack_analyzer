import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiRequestError } from '../api/client';
import AmbientGraphBackground from '../components/AmbientGraphBackground';

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signup(email, password);
      navigate('/');
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Signup failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-canvas px-4">
      <AmbientGraphBackground opacity={0.18} />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[560px] w-[560px] -translate-x-1/2 rounded-full bg-accent/15 blur-3xl" />

      <form onSubmit={handleSubmit} className="relative z-10 w-full max-w-sm rounded-xl border border-panel-border bg-panel/90 p-8 shadow-2xl shadow-black/40 backdrop-blur-sm">
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg border border-accent/40 bg-accent/15">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#cbb8f5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="6" cy="6" r="2.5" /><circle cx="18" cy="6" r="2.5" /><circle cx="12" cy="18" r="2.5" />
            <path d="M8 7l7-1M9 8l3 8M15 8l-3 8" />
          </svg>
        </div>
        <h1 className="mb-1 font-sans text-xl font-bold text-text-primary">Create an account</h1>
        <p className="mb-6 font-mono text-sm text-text-muted">Start modeling your first network</p>

        {error && (
          <p className="mb-4 rounded-md border border-risk-high/30 bg-risk-high/10 px-3 py-2 text-sm text-risk-high">{error}</p>
        )}

        <label className="mb-3 block text-xs text-text-muted">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-md border border-panel-border bg-canvas px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
          />
        </label>
        <label className="mb-6 block text-xs text-text-muted">
          Password
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-md border border-panel-border bg-canvas px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
          />
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-gradient-to-br from-accent to-purple-800 px-4 py-2.5 font-sans text-sm font-semibold text-white shadow-lg shadow-accent/30 transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {submitting ? 'Creating account...' : 'Sign Up'}
        </button>

        <p className="mt-5 text-center text-sm text-text-muted">
          Already have an account? <Link to="/login" className="text-accent hover:underline">Log in</Link>
        </p>
      </form>
    </div>
  );
}
