'use client';

import Link from 'next/link';
import { useUserAuth } from '@/lib/user-auth';
import CancelMembership from './CancelMembership';

export default function AccountPanel() {
  const { ready, isRegistered, isManager, user } = useUserAuth();

  if (!ready) {
    return (
      <div className="card">
        <div className="skeleton h-28 w-full" />
      </div>
    );
  }

  if (!isRegistered) {
    return (
      <div className="card text-center">
        <h1 className="heading-3">Sign in to manage your account</h1>
        <p className="mt-2 text-sm text-muted">You need to be signed in to view your details.</p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link href="/login?next=/account" className="btn-primary">
            Sign in
          </Link>
          <Link href="/register?next=/account" className="btn-outline">
            Register
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="card">
        <h2 className="heading-3">Your details</h2>

        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-faint">Name</dt>
            <dd className="mt-1 text-sm text-body">{user?.fullName}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-faint">Email</dt>
            <dd className="mt-1 break-all text-sm text-body">{user?.email}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-faint">Company</dt>
            <dd className="mt-1 text-sm text-body">{user?.company || <span className="text-faint">Not given</span>}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-faint">Membership</dt>
            <dd className="mt-1">
              {isManager ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-grass-500/10 px-2.5 py-1 text-xs font-semibold text-grass-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-grass-500" aria-hidden="true" />
                  Manager
                </span>
              ) : (
                <span className="chip">Member</span>
              )}
            </dd>
          </div>
        </dl>

        {isManager ? (
          <div className="mt-5 flex flex-wrap gap-2 border-t pt-5 border-theme">
            <Link href="/management" className="btn-outline">
              Management overview
            </Link>
            <Link href="/admin" className="btn-outline">
              Admin console
            </Link>
          </div>
        ) : null}
      </section>

      <CancelMembership />
    </div>
  );
}
