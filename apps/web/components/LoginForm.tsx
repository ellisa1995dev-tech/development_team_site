'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useUserAuth } from '@/lib/user-auth';
import { useToast } from '@/components/Toast';

export default function LoginForm() {
  const { login } = useUserAuth();
  const toast = useToast();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') ?? '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const user = await login(email.trim(), password);
      toast.success('Welcome back', `Signed in as ${user.fullName}.`);
      router.push(next);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign in failed.';
      setError(message);
      // Shown on every failure, so it never reveals whether a given address
      // happens to be a console account.
      toast.error('Sign in failed', message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4">
      <div>
        <label className="label" htmlFor="signin-email">
          Email
        </label>
        <input
          id="signin-email"
          type="email"
          inputMode="email"
          className="input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
      </div>

      <div>
        <label className="label" htmlFor="signin-password">
          Password
        </label>
        <input
          id="signin-password"
          type="password"
          className="input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
      </div>

      {error ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <button type="submit" className="btn-primary w-full" disabled={submitting}>
        {submitting ? 'Signing in…' : 'Sign in'}
      </button>

      <p className="text-center text-sm text-muted">
        No account yet?{' '}
        <Link href={`/register?next=${encodeURIComponent(next)}`} className="font-semibold text-grass-700 underline underline-offset-2">
          Register
        </Link>
      </p>

      <p className="border-t pt-4 text-center text-xs text-faint border-theme">
        One account for everything. Management and the admin console unlock
        automatically for addresses with access.
      </p>
    </form>
  );
}
