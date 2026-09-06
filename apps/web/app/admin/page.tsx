'use client';

import Link from 'next/link';
import { useAdminData } from '@/lib/use-admin-data';
import type { StatsSummary, Project, ProjectOrder, JoinApplication } from '@/lib/types';
import { StatusBadge } from '@/components/ui';

function Tile({ value, label, hint, accent }: { value: string; label: string; hint?: string; accent: 'grass' | 'sky' | 'ink' }) {
  const color = accent === 'sky' ? 'text-sky-600' : accent === 'grass' ? 'text-grass-600' : 'text-ink';
  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-4 sm:p-5">
      <div className={`text-2xl font-bold tracking-tight sm:text-3xl ${color}`}>{value}</div>
      <div className="mt-1 text-sm font-medium text-ink-700">{label}</div>
      {hint ? <div className="mt-0.5 text-xs text-ink-400">{hint}</div> : null}
    </div>
  );
}

export default function AdminOverview() {
  const summary = useAdminData<StatsSummary>('/admin/stats/summary?days=30');
  const projects = useAdminData<Project[]>('/admin/projects?status=ACTIVE');
  const orders = useAdminData<ProjectOrder[]>('/admin/orders');
  const applications = useAdminData<JoinApplication[]>('/admin/applications');

  const s = summary.data;
  const recentOrders = (orders.data ?? []).slice(0, 5);
  const recentApps = (applications.data ?? []).slice(0, 5);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="heading-2">Overview</h1>
        <p className="mt-1 text-sm text-ink-500">Last 30 days.</p>
      </header>

      {summary.error ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {summary.error}
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Tile
          value={s ? s.visits.window.toLocaleString() : '—'}
          label="Visits"
          hint={s ? `${s.visits.total.toLocaleString()} all time` : undefined}
          accent="grass"
        />
        <Tile
          value={s ? s.visits.uniqueVisitors.toLocaleString() : '—'}
          label="Unique visitors"
          hint={s ? `${s.visits.countries} countries` : undefined}
          accent="sky"
        />
        <Tile
          value={s ? `${s.projects.active}` : '—'}
          label="Active projects"
          hint={s ? `${s.projects.total} total` : undefined}
          accent="grass"
        />
        <Tile
          value={s ? `${s.orders.new}` : '—'}
          label="New orders"
          hint={s ? `${s.orders.total} total` : undefined}
          accent="sky"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
        <Tile
          value={s ? `${s.applications.new}` : '—'}
          label="New applications"
          hint={s ? `${s.applications.total} total received` : undefined}
          accent="ink"
        />
        <Tile value={s ? `${s.team.active}` : '—'} label="Active team members" accent="ink" />
        <Tile
          value={s ? s.users.registered.toLocaleString() : '—'}
          label="Registered users"
          hint={s ? `${s.users.onlineNow} online now` : undefined}
          accent="grass"
        />
      </div>

      <section className="rounded-2xl border border-ink-100 bg-white">
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
          <h2 className="text-sm font-semibold">Active projects</h2>
          <Link href="/admin/projects" className="text-sm font-medium text-grass-600 hover:underline">
            Manage
          </Link>
        </div>
        <ul className="divide-y divide-ink-100">
          {projects.loading ? <li className="px-5 py-4 text-sm text-ink-400">Loading…</li> : null}
          {!projects.loading && (projects.data ?? []).length === 0 ? (
            <li className="px-5 py-4 text-sm text-ink-400">No active projects.</li>
          ) : null}
          {(projects.data ?? []).map((p) => (
            <li key={p.id} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{p.name}</p>
                <p className="mt-0.5 truncate text-xs text-ink-400">
                  {p.domain}
                  {p.assignments?.length ? ` · ${p.assignments.length} assigned` : ''}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-1.5 w-24 overflow-hidden rounded-full bg-ink-100">
                  <div className="h-full rounded-full bg-grass-500" style={{ width: `${p.progress ?? 0}%` }} />
                </div>
                <span className="w-9 text-right text-xs font-medium text-ink-500">{p.progress ?? 0}%</span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-ink-100 bg-white">
          <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
            <h2 className="text-sm font-semibold">Latest orders</h2>
            <Link href="/admin/orders" className="text-sm font-medium text-grass-600 hover:underline">
              All
            </Link>
          </div>
          <ul className="divide-y divide-ink-100">
            {recentOrders.length === 0 ? <li className="px-5 py-4 text-sm text-ink-400">Nothing yet.</li> : null}
            {recentOrders.map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{o.companyName || o.contactName}</p>
                  <p className="truncate text-xs text-ink-400">{o.projectType}</p>
                </div>
                <StatusBadge status={o.status} />
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-ink-100 bg-white">
          <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
            <h2 className="text-sm font-semibold">Latest applications</h2>
            <Link href="/admin/applications" className="text-sm font-medium text-grass-600 hover:underline">
              All
            </Link>
          </div>
          <ul className="divide-y divide-ink-100">
            {recentApps.length === 0 ? <li className="px-5 py-4 text-sm text-ink-400">Nothing yet.</li> : null}
            {recentApps.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{a.fullName}</p>
                  <p className="truncate text-xs text-ink-400">
                    {a.position} · {a.yearsExperience} yrs
                  </p>
                </div>
                <StatusBadge status={a.status} />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
