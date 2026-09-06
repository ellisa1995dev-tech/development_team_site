'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useUserAuth } from '@/lib/user-auth';
import { API_URL } from '@/lib/api';

const SIGNUP_SESSION_KEY = 'te_signup_session';

interface FormState {
  fullName: string;
  email: string;
  company: string;
  password: string;
  confirm: string;
}

const EMPTY: FormState = { fullName: '', email: '', company: '', password: '', confirm: '' };

function newSignupSessionId(): string {
  try {
    const existing = window.sessionStorage.getItem(SIGNUP_SESSION_KEY);
    if (existing) return existing;
    const id = crypto.randomUUID();
    window.sessionStorage.setItem(SIGNUP_SESSION_KEY, id);
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

export default function RegisterForm() {
  const { register } = useUserAuth();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') ?? '/';

  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const sessionIdRef = useRef<string | null>(null);
  const completedRef = useRef(false);

  /**
   * Tells the backend someone is mid-sign-up, so the admin console's
   * "signing up now" counter reflects reality. Pings every 30s, and clears
   * the record if the visitor leaves without finishing.
   */
  useEffect(() => {
    const sessionId = newSignupSessionId();
    sessionIdRef.current = sessionId;

    const ping = () =>
      fetch(`${API_URL}/api/users/signup-activity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      }).catch(() => undefined);

    ping();
    const timer = window.setInterval(ping, 30_000);

    const abandon = () => {
      if (completedRef.current) return;
      // keepalive lets the request survive the page unload.
      fetch(`${API_URL}/api/users/signup-abandon`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
        keepalive: true,
      }).catch(() => undefined);
    };

    window.addEventListener('pagehide', abandon);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('pagehide', abandon);
      abandon();
    };
  }, []);

  const set =
    (key: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((f) => ({ ...f, [key]: e.target.value }));
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    };

  function validate(): boolean {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (form.fullName.trim().length < 2) next.fullName = 'Please enter your full name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'A valid email address is required.';
    if (form.password.length < 8) next.password = 'Use at least 8 characters.';
    if (form.confirm !== form.password) next.confirm = 'Passwords do not match.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      const user = await register({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password,
        company: form.company.trim() || undefined,
        signupSessionId: sessionIdRef.current ?? undefined,
      });

      completedRef.current = true;
      try {
        window.sessionStorage.removeItem(SIGNUP_SESSION_KEY);
      } catch {
        /* ignore */
      }

      window.alert(`Registration complete. Welcome, ${user.fullName}.\n\nYou can now order a project or apply to join the team.`);
      router.push(next);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      setServerError(message);
      window.alert(`Registration failed.\n\n${message}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="card space-y-4">
      <div>
        <label className="label" htmlFor="reg-name">
          Full name <span className="text-grass-600">*</span>
        </label>
        <input
          id="reg-name"
          className="input"
          value={form.fullName}
          onChange={set('fullName')}
          autoComplete="name"
          aria-invalid={!!errors.fullName}
          aria-describedby={errors.fullName ? 'reg-name-error' : undefined}
        />
        {errors.fullName ? (
          <p id="reg-name-error" className="field-error">
            {errors.fullName}
          </p>
        ) : null}
      </div>

      <div>
        <label className="label" htmlFor="reg-email">
          Email <span className="text-grass-600">*</span>
        </label>
        <input
          id="reg-email"
          type="email"
          inputMode="email"
          className="input"
          value={form.email}
          onChange={set('email')}
          autoComplete="email"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'reg-email-error' : undefined}
        />
        {errors.email ? (
          <p id="reg-email-error" className="field-error">
            {errors.email}
          </p>
        ) : null}
      </div>

      <div>
        <label className="label" htmlFor="reg-company">
          Company <span className="text-ink-400">(optional)</span>
        </label>
        <input id="reg-company" className="input" value={form.company} onChange={set('company')} autoComplete="organization" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="reg-password">
            Password <span className="text-grass-600">*</span>
          </label>
          <input
            id="reg-password"
            type="password"
            className="input"
            value={form.password}
            onChange={set('password')}
            autoComplete="new-password"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? 'reg-password-error' : 'reg-password-hint'}
          />
          {errors.password ? (
            <p id="reg-password-error" className="field-error">
              {errors.password}
            </p>
          ) : (
            <p id="reg-password-hint" className="mt-1.5 text-xs text-ink-400">
              At least 8 characters.
            </p>
          )}
        </div>

        <div>
          <label className="label" htmlFor="reg-confirm">
            Confirm password <span className="text-grass-600">*</span>
          </label>
          <input
            id="reg-confirm"
            type="password"
            className="input"
            value={form.confirm}
            onChange={set('confirm')}
            autoComplete="new-password"
            aria-invalid={!!errors.confirm}
            aria-describedby={errors.confirm ? 'reg-confirm-error' : undefined}
          />
          {errors.confirm ? (
            <p id="reg-confirm-error" className="field-error">
              {errors.confirm}
            </p>
          ) : null}
        </div>
      </div>

      {serverError ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700" role="alert">
          {serverError}
        </p>
      ) : null}

      <button type="submit" className="btn-primary w-full" disabled={submitting}>
        {submitting ? 'Creating account…' : 'Create account'}
      </button>

      <p className="text-center text-sm text-ink-500">
        Already registered?{' '}
        <Link href={`/login?next=${encodeURIComponent(next)}`} className="font-semibold text-grass-700 underline underline-offset-2">
          Sign in
        </Link>
      </p>
    </form>
  );
}
