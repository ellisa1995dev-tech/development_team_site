'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useAdminAuth } from '@/lib/admin-auth';
import AdminLogin from './AdminLogin';

const NAV = [
  { href: '/admin', label: 'Overview', exact: true },
  { href: '/admin/visitors', label: 'Visitors & map' },
  { href: '/admin/users', label: 'Registered users' },
  { href: '/admin/projects', label: 'Projects' },
  { href: '/admin/orders', label: 'Orders' },
  { href: '/admin/applications', label: 'Applications' },
  { href: '/admin/team', label: 'Team' },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const { ready, token, user, logout } = useAdminAuth();
  const pathname = usePathname();
  const [navOpen, setNavOpen] = useState(false);

  if (!ready) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <p className="text-sm text-ink-400">Loading console…</p>
      </div>
    );
  }

  if (!token) return <AdminLogin />;

  const isActive = (item: (typeof NAV)[number]) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  return (
    <div className="bg-ink-50">
      <div className="border-b border-ink-100 bg-white">
        <div className="container-page flex h-14 items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setNavOpen((v) => !v)}
              className="grid h-10 w-10 place-items-center rounded-lg border border-ink-200 lg:hidden"
              aria-expanded={navOpen}
              aria-controls="admin-nav"
              aria-label="Toggle console navigation"
            >
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
            <span className="text-sm font-semibold">Admin console</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-ink-400 sm:inline">{user?.email}</span>
            <button type="button" onClick={logout} className="rounded-lg px-3 py-1.5 text-sm font-medium text-ink-600 hover:bg-ink-50">
              Sign out
            </button>
          </div>
        </div>
      </div>

      <div className="container-page flex flex-col gap-6 py-6 lg:flex-row lg:gap-8 lg:py-8">
        <nav
          id="admin-nav"
          className={`${navOpen ? 'block' : 'hidden'} lg:block lg:w-56 lg:shrink-0`}
          aria-label="Console"
        >
          <ul className="flex flex-col gap-1 rounded-2xl border border-ink-100 bg-white p-2 lg:sticky lg:top-6">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setNavOpen(false)}
                  className={`block rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    isActive(item) ? 'bg-grass-50 text-grass-700' : 'text-ink-600 hover:bg-ink-50'
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li className="mt-1 border-t border-ink-100 pt-1">
              <Link href="/" className="block rounded-xl px-3 py-2.5 text-sm font-medium text-ink-400 hover:bg-ink-50">
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
