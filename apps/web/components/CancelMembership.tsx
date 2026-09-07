'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useUserAuth } from '@/lib/user-auth';
import { useToast } from '@/components/Toast';

interface CancelResult {
  cancelled: boolean;
  ordersKept: number;
  applicationsKept: number;
}

/**
 * Closing an account is irreversible, so it is deliberately a three-step
 * action: open the panel, type the confirmation word, and re-enter the
 * password. The server checks the password again regardless.
 */
export default function CancelMembership() {
  const { user, token, logout } = useUserAuth();
  const toast = useToast();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [password, setPassword] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const CONFIRM_WORD = 'CANCEL';
  const canSubmit = confirmText.trim().toUpperCase() === CONFIRM_WORD && password.length > 0 && !busy;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || !token) return;

    setBusy(true);
    setError(null);
    const pending = toast.loading('Cancelling your membership…');

    try {
      const result = await apiFetch<CancelResult>('/users/me', {
        method: 'DELETE',
        token,
        body: JSON.stringify({ password, reason: reason.trim() || undefined }),
      });

      const kept = result.ordersKept + result.applicationsKept;
      toast.update(pending, {
        title: 'Membership cancelled',
        description:
          kept > 0
            ? `Your account is closed. The ${kept} submission${kept === 1 ? '' : 's'} you sent us are retained as business records.`
            : 'Your account is closed. Sorry to see you go.',
        variant: 'info',
        duration: 9000,
      });

      // Clear the local session and return to a page they can still use.
      logout();
      router.push('/');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not cancel your membership.';
      setError(message);
      toast.update(pending, { title: 'Could not cancel', description: message, variant: 'error' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-red-200 p-5 sm:p-6" style={{ background: 'var(--bg-surface)' }}>
      <h2 className="heading-3 text-red-700">Cancel membership</h2>
      <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted">
        Closing your account removes your profile and sign-in permanently. Any project orders or applications you have
        already sent us are kept as business records, but are no longer linked to you.
      </p>

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="btn mt-4 border border-red-300 bg-transparent text-red-700 hover:bg-red-50"
        >
          Cancel my membership
        </button>
      ) : (
        <form onSubmit={submit} className="mt-5 space-y-4 border-t border-red-200 pt-5">
          <div>
            <label className="label" htmlFor="cancel-reason">
              Why are you leaving? <span className="text-faint">(optional)</span>
            </label>
            <textarea
              id="cancel-reason"
              rows={2}
              className="input resize-y"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Anything we could have done better?"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="cancel-confirm">
                Type <span className="font-mono font-semibold text-red-700">{CONFIRM_WORD}</span> to confirm
              </label>
              <input
                id="cancel-confirm"
                className="input"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                autoComplete="off"
                spellCheck={false}
              />
            </div>

            <div>
              <label className="label" htmlFor="cancel-password">
                Your password
              </label>
              <input
                id="cancel-password"
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
          </div>

          {error ? (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700" role="alert">
              {error}
            </p>
          ) : null}

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="submit"
              disabled={!canSubmit}
              className="btn bg-red-600 text-white hover:bg-red-700 disabled:opacity-45"
            >
              {busy ? 'Cancelling…' : `Permanently close ${user?.email ?? 'this account'}`}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setConfirmText('');
                setPassword('');
                setError(null);
              }}
              className="btn-outline"
            >
              Keep my account
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
