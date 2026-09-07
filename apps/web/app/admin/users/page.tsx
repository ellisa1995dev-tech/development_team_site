'use client';

import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';
import { useAdminData } from '@/lib/use-admin-data';
import { useLiveUsers } from '@/lib/use-live-users';
import type { MarkerMode, MapPoint } from '@/components/admin/VisitorMap';
import RegisteredUsersTable from '@/components/admin/RegisteredUsersTable';

const VisitorMap = dynamic(() => import('@/components/admin/VisitorMap'), {
  ssr: false,
  loading: () => (
    <div className="grid h-[22rem] w-full place-items-center rounded-2xl bg-ink-50 text-sm text-ink-400 sm:h-[30rem]">
      Loading map…
    </div>
  ),
});

interface UserGeoPoint {
  city: string | null;
  region: string | null;
  country: string | null;
  countryCode: string | null;
  latitude: number;
  longitude: number;
  users: number;
}

function LiveDot({ status }: { status: 'connecting' | 'live' | 'error' }) {
  const map = {
    live: { color: 'bg-grass-500', label: 'Live' },
    connecting: { color: 'bg-amber-500', label: 'Connecting…' },
    error: { color: 'bg-red-500', label: 'Reconnecting…' },
  }[status];

  return (
    <span className="inline-flex items-center gap-2 text-xs font-medium text-ink-500">
      <span className="relative flex h-2 w-2">
        {status === 'live' ? (
          <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${map.color} opacity-70`} />
        ) : null}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${map.color}`} />
      </span>
      {map.label}
    </span>
  );
}

function Counter({
  value,
  label,
  hint,
  accent,
}: {
  value: number | null;
  label: string;
  hint?: string;
  accent: 'grass' | 'sky' | 'amber' | 'ink';
}) {
  const color = {
    grass: 'text-grass-600',
    sky: 'text-sky-600',
    amber: 'text-amber-600',
    ink: 'text-ink',
  }[accent];

  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-4 sm:p-5">
      <div className={`text-2xl font-bold tabular-nums tracking-tight sm:text-3xl ${color}`}>
        {value === null ? '—' : value.toLocaleString()}
      </div>
      <div className="mt-1 text-sm font-medium text-ink-700">{label}</div>
      {hint ? <div className="mt-0.5 text-xs text-ink-400">{hint}</div> : null}
    </div>
  );
}

export default function AdminUsersPage() {
  const { data: live, status } = useLiveUsers();
  const geo = useAdminData<UserGeoPoint[]>('/admin/stats/users/geo');
  const [mode, setMode] = useState<MarkerMode>('circle');

  const points = geo.data ?? [];

  const mapPoints: MapPoint[] = useMemo(
    () =>
      points.map((p) => ({
        latitude: p.latitude,
        longitude: p.longitude,
        label: [p.city, p.region, p.country].filter(Boolean).join(', ') || 'Unknown location',
        value: p.users,
        detail: [`${p.users.toLocaleString()} registered ${p.users === 1 ? 'user' : 'users'}`],
      })),
    [points],
  );

  const mappedTotal = points.reduce((sum, p) => sum + p.users, 0);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="heading-2">Registered users</h1>
          <p className="mt-1 text-sm text-ink-500">
            Counters stream from the server every 3 seconds — no refresh needed.
          </p>
        </div>
        <LiveDot status={status} />
      </header>

      {/* ------------------------------------------------- live counters */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Counter value={live?.registeredTotal ?? null} label="Registered users" hint="All accounts" accent="grass" />
        <Counter
          value={live?.signingUpNow ?? null}
          label="Signing up now"
          hint="On the form right now"
          accent="amber"
        />
        <Counter value={live?.onlineNow ?? null} label="Online now" hint="Active in last 5 min" accent="sky" />
        <Counter value={live?.registeredToday ?? null} label="Registered today" accent="ink" />
      </div>

      {/* ------------------------------------------------------------ map */}
      <section className="rounded-2xl border border-ink-100 bg-white p-4 sm:p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold">Where registered users are</h2>
            <p className="mt-0.5 text-xs text-ink-400">
              {mappedTotal.toLocaleString()} located across {points.length.toLocaleString()}{' '}
              {points.length === 1 ? 'location' : 'locations'}
            </p>
          </div>

          <div className="inline-flex rounded-xl border border-ink-200 bg-white p-1" role="group" aria-label="Marker style">
            {(['circle', 'bar'] as MarkerMode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                aria-pressed={mode === m}
                className={`min-h-[2.25rem] rounded-lg px-3 text-sm font-medium capitalize transition ${
                  mode === m ? 'bg-ink text-white' : 'text-ink-600 hover:bg-ink-50'
                }`}
              >
                {m} markers
              </button>
            ))}
          </div>
        </div>

        {geo.loading ? (
          <div className="grid h-[22rem] place-items-center rounded-2xl bg-ink-50 text-sm text-ink-400 sm:h-[30rem]">
            Loading map…
          </div>
        ) : points.length === 0 ? (
          <div className="grid h-[22rem] place-items-center rounded-2xl bg-ink-50 px-6 text-center text-sm text-ink-400 sm:h-[30rem]">
            No registered users with a resolved location yet. Register an account on the public site and it will appear
            here.
          </div>
        ) : (
          <VisitorMap points={mapPoints} mode={mode} />
        )}

        <p className="mt-3 text-xs text-ink-400">
          Marker size scales with the number of registered users at that location; the busiest third is shown in sky
          blue. Locations come from the IP the account was created on.
        </p>
      </section>

      {/* --------------------------------------------------- manage users */}
      <RegisteredUsersTable />

      {/* -------------------------------------------------- recent + table */}
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-ink-100 bg-white">
          <h2 className="border-b border-ink-100 px-5 py-4 text-sm font-semibold">Newest registrations</h2>
          <ul className="divide-y divide-ink-100">
            {!live ? <li className="px-5 py-4 text-sm text-ink-400">Waiting for the stream…</li> : null}
            {live && live.recentSignups.length === 0 ? (
              <li className="px-5 py-4 text-sm text-ink-400">No registrations yet.</li>
            ) : null}
            {live?.recentSignups.map((u) => (
              <li key={u.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{u.fullName}</p>
                  <p className="truncate text-xs text-ink-400">
                    {[u.city, u.country].filter(Boolean).join(', ') || 'Location unknown'}
                  </p>
                </div>
                <time className="shrink-0 text-xs text-ink-400" dateTime={u.createdAt}>
                  {new Date(u.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </time>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-ink-100 bg-white">
          <h2 className="border-b border-ink-100 px-5 py-4 text-sm font-semibold">Users by location</h2>
          <ul className="divide-y divide-ink-100">
            {points.length === 0 ? <li className="px-5 py-4 text-sm text-ink-400">No data yet.</li> : null}
            {points.slice(0, 12).map((p) => (
              <li key={`${p.latitude},${p.longitude},${p.city}`} className="flex items-center justify-between px-5 py-3 text-sm">
                <span className="truncate text-ink-700">
                  {[p.city, p.country].filter(Boolean).join(', ') || 'Unknown'}
                </span>
                <span className="ml-3 shrink-0 font-medium text-ink-500">{p.users.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
