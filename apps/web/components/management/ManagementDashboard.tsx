'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { apiFetch, ApiError } from '@/lib/api';
import { useUserAuth } from '@/lib/user-auth';
import { ROLE_LABEL } from '@/lib/content';

interface Overview {
  projects: { active: number; total: number };
  orders: { new: number; total: number };
  applications: { new: number; total: number };
  team: { active: number };
  users: { registered: number; onlineNow: number; registeredToday: number };
}

interface ActiveProject {
  id: string;
  name: string;
  domain: string;
  summary: string;
  progress: number;
  startedAt: string;
  clientName: string | null;
  stack: string[];
  isPublic: boolean;
  assignments: Array<{ id: string; roleOnProject: string; member: { id: string; name: string; role: string } }>;
}

interface OrderRow {
  id: string;
  companyName: string | null;
  contactName: string;
  email: string;
  projectType: string;
  budgetRange: string;
  status: string;
  createdAt: string;
  _count: { attachments: number };
}

interface ApplicationRow {
  id: string;
  fullName: string;
  email: string;
  position: string;
  yearsExperience: number;
  status: string;
  ideaPitch: string | null;
  createdAt: string;
}

function Tile({ value, label, hint, accent }: { value: string; label: string; hint?: string; accent: 'grass' | 'sky' | 'ink' }) {
  const color = accent === 'sky' ? 'text-sky-600' : accent === 'grass' ? 'text-grass-600' : 'text-body';
  return (
    <div className="surface rounded-2xl p-4 sm:p-5">
      <div className={`text-2xl font-semibold tabular-nums tracking-tight sm:text-3xl ${color}`}>{value}</div>
      <div className="mt-1 text-sm font-medium text-body">{label}</div>
      {hint ? <div className="mt-0.5 text-xs text-faint">{hint}</div> : null}
    </div>
  );
}

function date(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function ManagementDashboard() {
  const { ready, isRegistered, isManager, user, token } = useUserAuth();

  const [overview, setOverview] = useState<Overview | null>(null);
  const [projects, setProjects] = useState<ActiveProject[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [o, p, ord, app] = await Promise.all([
        apiFetch<Overview>('/management/overview', { token }),
        apiFetch<ActiveProject[]>('/management/projects', { token }),
        apiFetch<OrderRow[]>('/management/orders', { token }),
        apiFetch<ApplicationRow[]>('/management/applications', { token }),
      ]);
      setOverview(o);
      setProjects(p);
      setOrders(ord);
      setApplications(app);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load management data.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (ready && isManager) void load();
    else if (ready) setLoading(false);
  }, [ready, isManager, load]);

  if (!ready) {
    return (
      <section className="section">
        <div className="container-page">
          <div className="skeleton h-40 w-full" />
        </div>
      </section>
    );
  }

  // Not signed in, or signed in without the role. The server refuses the data
  // either way; this just explains why the page is empty.
  if (!isRegistered || !isManager) {
    return (
      <section className="section">
        <div className="container-page max-w-xl">
          <div className="card text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-amber-500/12 text-amber-600">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M6 9V6.5a4 4 0 1 1 8 0V9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <rect x="4" y="9" width="12" height="8" rx="2" stroke="currentColor" strokeWidth="1.8" />
              </svg>
            </span>
            <h1 className="heading-3 mt-4">Management access required</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {isRegistered
                ? `You are signed in as ${user?.email}, which is not a management account. If that is wrong, ask whoever runs the deployment to add your address to the allowlist.`
                : 'Sign in with a management account to view this section.'}
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
              {isRegistered ? (
                <Link href="/" className="btn-outline">Back to the site</Link>
              ) : (
                <>
                  <Link href="/login?next=/management" className="btn-primary">Sign in</Link>
                  <Link href="/" className="btn-outline">Back to the site</Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="container-page space-y-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">
              <span className="h-1.5 w-1.5 rounded-full bg-grass-500" aria-hidden="true" />
              Management
            </p>
            <h1 className="heading-2 mt-3">Operations overview</h1>
            <p className="mt-2 text-sm text-muted">
              Signed in as <span className="font-medium text-body">{user?.fullName}</span> · read-only
            </p>
          </div>
          <button type="button" onClick={load} disabled={loading} className="btn-outline w-full sm:w-auto">
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </header>

        {error ? (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p>
        ) : null}

        {/* ------------------------------------------------------- counters */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <Tile
            value={overview ? `${overview.projects.active}` : '—'}
            label="Projects in progress"
            hint={overview ? `${overview.projects.total} total` : undefined}
            accent="grass"
          />
          <Tile
            value={overview ? `${overview.orders.new}` : '—'}
            label="New orders"
            hint={overview ? `${overview.orders.total} all time` : undefined}
            accent="sky"
          />
          <Tile
            value={overview ? `${overview.applications.new}` : '—'}
            label="New applications"
            hint={overview ? `${overview.applications.total} all time` : undefined}
            accent="ink"
          />
          <Tile
            value={overview ? overview.users.registered.toLocaleString() : '—'}
            label="Registered users"
            hint={overview ? `${overview.users.onlineNow} online now` : undefined}
            accent="grass"
          />
        </div>

        {/* ----------------------------------------------- active projects */}
        <section className="surface overflow-hidden rounded-2xl">
          <div className="flex items-center justify-between border-b px-5 py-4 border-theme">
            <h2 className="text-sm font-semibold text-body">Projects in progress</h2>
            <span className="text-xs text-faint">{projects.length}</span>
          </div>

          {projects.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-faint">
              {loading ? 'Loading…' : 'Nothing in progress right now.'}
            </p>
          ) : (
            <ul className="divide-theme">
              {projects.map((p) => (
                <li key={p.id} className="px-5 py-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-body">{p.name}</h3>
                        {!p.isPublic ? <span className="chip">Private</span> : null}
                      </div>
                      <p className="mt-0.5 text-xs text-faint">
                        {p.domain} · started {date(p.startedAt)}
                        {p.clientName ? ` · ${p.clientName}` : ''}
                      </p>
                      {p.assignments.length ? (
                        <ul className="mt-2 flex flex-wrap gap-1.5">
                          {p.assignments.map((a) => (
                            <li key={a.id} className="chip-grass">
                              {a.member.name} · {a.roleOnProject}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-2 text-xs text-amber-600">Nobody assigned yet.</p>
                      )}
                    </div>

                    <div className="flex shrink-0 items-center gap-2.5 sm:pt-1">
                      <div className="h-1.5 w-24 overflow-hidden rounded-full" style={{ background: 'var(--bg-inset)' }}>
                        <div className="h-full rounded-full bg-grass-500 transition-all duration-700" style={{ width: `${p.progress}%` }} />
                      </div>
                      <span className="w-9 text-right text-xs tabular-nums text-muted">{p.progress}%</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* --------------------------------------------- orders + applicants */}
        <div className="grid gap-4 lg:grid-cols-2">
          <section className="surface overflow-hidden rounded-2xl">
            <h2 className="border-b px-5 py-4 text-sm font-semibold text-body border-theme">Latest orders</h2>
            {orders.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-faint">{loading ? 'Loading…' : 'Nothing yet.'}</p>
            ) : (
              <ul className="divide-theme">
                {orders.map((o) => (
                  <li key={o.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-body">{o.companyName || o.contactName}</p>
                      <p className="truncate text-xs text-faint">
                        {o.projectType} · {o.budgetRange} · {date(o.createdAt)}
                        {o._count.attachments > 0 ? ` · ${o._count.attachments} doc` : ''}
                      </p>
                    </div>
                    <span className="chip shrink-0 capitalize">{o.status.toLowerCase()}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="surface overflow-hidden rounded-2xl">
            <h2 className="border-b px-5 py-4 text-sm font-semibold text-body border-theme">Latest applications</h2>
            {applications.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-faint">{loading ? 'Loading…' : 'Nothing yet.'}</p>
            ) : (
              <ul className="divide-theme">
                {applications.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-body">
                        {a.fullName}
                        {a.ideaPitch ? <span className="ml-2 chip-sky">Idea</span> : null}
                      </p>
                      <p className="truncate text-xs text-faint">
                        {ROLE_LABEL[a.position] ?? a.position} · {a.yearsExperience} yrs · {date(a.createdAt)}
                      </p>
                    </div>
                    <span className="chip shrink-0 capitalize">{a.status.toLowerCase()}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <p className="text-xs text-faint">
          This section is read-only. Changing statuses, editing the team and viewing visitor analytics stay in the{' '}
          <Link href="/admin" className="font-medium underline underline-offset-2">admin console</Link>, which has its
          own credentials.
        </p>
      </div>
    </section>
  );
}
