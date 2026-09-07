'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useUserAuth } from '@/lib/user-auth';

const NAV = [
  { href: '/admin', label: 'Overview', exact: true },
  { href: '/admin/visitors', label: 'Visitors & map' },
  { href: '/admin/users', label: 'Registered users' },
  { href: '/admin/projects', label: 'Projects' },
  { href: '/admin/orders', label: 'Orders' },
  { href: '/admin/applications', label: 'Applications' },
  { href: '/admin/team', label: 'Team' },
];

/** Shown when the visitor is signed out, or signed in without elevation. */
function AccessGate({ isRegistered, email }: { isRegistered: boolean; email?: string }) {
  return (
    <div className="surface-subtle grid min-h-[70vh] place-items-center px-4 py-12">
      <div className="w-full max-w-sm text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-amber-500/12 text-amber-600">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M6 9V6.5a4 4 0 1 1 8 0V9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <rect x="4" y="9" width="12" height="8" rx="2" stroke="currentColor" strokeWidth="1.8" />
          </svg>
        </span>

        <h1 className="heading-3 mt-4">
          {isRegistered ? 'Management access required' : 'Sign in to continue'}
        </h1>

        <p className="mt-2 text-sm leading-relaxed text-muted">
          {isRegistered
            ? `You are signed in as ${email}, which is not a management account. Ask whoever runs the deployment to add your address to ADMIN_EMAILS.`
            : 'The console uses your normal site account. Sign in with an address that has management access.'}
        </p>

        <div className="mt-6 flex flex-col gap-2">
          {isRegistered ? (
            <Link href="/" className="btn-outline">
              Back to the site
            </Link>
          ) : (
            <>
              <Link href="/login?next=/admin" className="btn-primary">
                Sign in
              </Link>
              <Link href="/" className="btn-outline">
                Back to the site
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * The console runs on the ordinary site session — there is no separate admin
 * login any more. Elevation comes from the ADMIN_EMAILS allowlist, and every
 * /api/admin/* route checks that claim independently of what this renders.
 */
export default function AdminShell({ children }: { children: React.ReactNode }) {
  const { ready, isRegistered, isManager, user } = useUserAuth();
  const pathname = usePathname();
  const [navOpen, setNavOpen] = useState(false);

  if (!ready) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <p className="text-sm text-faint">Loading console…</p>
      </div>
    );
  }

  if (!isManager) return <AccessGate isRegistered={isRegistered} email={user?.email} />;

  const isActive = (item: (typeof NAV)[number]) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  return (
    <div className="surface-subtle">
      <div className="border-b border-theme" style={{ background: 'var(--bg-page)' }}>
        <div className="container-page flex h-14 items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setNavOpen((v) => !v)}
              className="grid h-10 w-10 place-items-center rounded-lg border border-theme text-body lg:hidden"
              aria-expanded={navOpen}
              aria-controls="admin-nav"
              aria-label="Toggle console navigation"
            >
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
            <span className="text-sm font-semibold text-body">Admin console</span>
          </div>

          {/* Sign-out lives in the site header now — one session, one control. */}
          <span className="hidden text-xs text-faint sm:inline">{user?.email}</span>
        </div>
      </div>

      <div className="container-page flex flex-col gap-6 py-6 lg:flex-row lg:gap-8 lg:py-8">
        <nav
          id="admin-nav"
          className={`${navOpen ? 'block' : 'hidden'} lg:block lg:w-56 lg:shrink-0`}
          aria-label="Console"
        >
          <ul className="surface flex flex-col gap-1 rounded-2xl p-2 lg:sticky lg:top-6">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setNavOpen(false)}
                  className={`block rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    isActive(item) ? 'bg-grass-50 text-grass-700' : 'text-muted hover:text-body'
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li className="mt-1 border-t border-theme pt-1">
              <Link
                href="/management"
                className="block rounded-xl px-3 py-2.5 text-sm font-medium text-muted hover:text-body"
              >
                Management overview
              </Link>
            </li>
            <li>
              <Link href="/" className="block rounded-xl px-3 py-2.5 text-sm font-medium text-faint hover:text-body">
                ← Back to site
              </Link>
            </li>
          </ul>
        </nav>

        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
