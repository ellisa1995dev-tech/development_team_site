'use client';

import { useState } from 'react';
import { useAdminAuth } from '@/lib/admin-auth';
import { useToast } from '@/components/Toast';
import Logo from '../Logo';

export default function AdminLogin() {
  const { login } = useAdminAuth();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const pending = toast.loading('Signing in…', 'Checking your credentials.');
    try {
      await login(email.trim(), password);
      toast.update(pending, {
        title: 'Signed in',
        description: 'Welcome back to the admin console.',
        variant: 'success',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign in failed.';
      setError(message);
      toast.update(pending, { title: 'Sign in failed', description: message, variant: 'error' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-[70vh] place-items-center bg-ink-50 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <Logo size={34} withWordmark={false} className="justify-center" />
          <h1 className="heading-3 mt-4">Admin console</h1>
          <p className="mt-1 text-sm text-ink-500">Team, projects, orders and visitor analytics.</p>
        </div>

        <form onSubmit={onSubmit} className="card space-y-4">
          <div>
            <label className="label" htmlFor="admin-email">
              Email
            </label>
            <input
              id="admin-email"
              type="email"
              inputMode="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
            />
          </div>

          <div>
            <label className="label" htmlFor="admin-password">
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          {error ? (
            <p className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700" role="alert">
              {error}
            </p>
          ) : null}

          <button type="submit" className="btn-primary w-full" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
