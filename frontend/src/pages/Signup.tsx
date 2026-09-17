import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiRequestError } from '../api/client';

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
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-lg border border-panel-border bg-panel p-8">
        <h1 className="mb-1 text-xl font-semibold text-text-primary">Network Attack Analyzer</h1>
        <p className="mb-6 text-sm text-text-muted">Create an account</p>

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
          className="w-full rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {submitting ? 'Creating account...' : 'Sign Up'}
        </button>

        <p className="mt-4 text-center text-sm text-text-muted">
          Already have an account? <Link to="/login" className="text-accent hover:underline">Log in</Link>
        </p>
      </form>
    </div>
  );
}
