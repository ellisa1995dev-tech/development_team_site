'use client';

import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';
import { useAdminData } from '@/lib/use-admin-data';
import type { GeoPoint } from '@/lib/types';
import type { MarkerMode, MapPoint } from '@/components/admin/VisitorMap';

// Leaflet touches `window` at import time, so it must never run on the server.
const VisitorMap = dynamic(() => import('@/components/admin/VisitorMap'), {
  ssr: false,
  loading: () => (
    <div className="grid h-[22rem] w-full place-items-center rounded-2xl bg-ink-50 text-sm text-ink-400 sm:h-[30rem]">
      Loading map…
    </div>
  ),
});

interface CountryRow {
  country: string | null;
  countryCode: string | null;
  visits: number;
  uniqueVisitors: number;
}
interface SeriesRow {
  day: string;
  visits: number;
  uniqueVisitors: number;
}
interface PageRow {
  path: string;
  visits: number;
}
interface DeviceRow {
  device: string;
  visits: number;
}

const RANGES = [
  { days: 7, label: '7 days' },
  { days: 30, label: '30 days' },
  { days: 90, label: '90 days' },
  { days: 365, label: '1 year' },
];

export default function VisitorsPage() {
  const [days, setDays] = useState(30);
  const [mode, setMode] = useState<MarkerMode>('circle');
  const [metric, setMetric] = useState<'visits' | 'uniqueVisitors'>('visits');

  const geo = useAdminData<GeoPoint[]>(`/admin/stats/geo?days=${days}`);
  const countries = useAdminData<CountryRow[]>(`/admin/stats/countries?days=${days}`);
  const series = useAdminData<SeriesRow[]>(`/admin/stats/timeseries?days=${days}`);
  const pages = useAdminData<PageRow[]>(`/admin/stats/pages?days=${days}`);
  const devices = useAdminData<DeviceRow[]>(`/admin/stats/devices?days=${days}`);

  const points = geo.data ?? [];

  const mapPoints: MapPoint[] = useMemo(
    () =>
      points.map((p) => ({
        latitude: p.latitude,
        longitude: p.longitude,
        label: [p.city, p.region, p.country].filter(Boolean).join(', ') || 'Unknown location',
        value: metric === 'visits' ? p.visits : p.uniqueVisitors,
        detail: [`${p.visits.toLocaleString()} visits`, `${p.uniqueVisitors.toLocaleString()} unique visitors`],
      })),
    [points, metric],
  );
  const totals = useMemo(
    () => ({
      visits: points.reduce((s, p) => s + p.visits, 0),
      unique: points.reduce((s, p) => s + p.uniqueVisitors, 0),
      locations: points.length,
    }),
    [points],
  );

  const seriesMax = Math.max(1, ...(series.data ?? []).map((d) => d.visits));
  const deviceTotal = Math.max(1, (devices.data ?? []).reduce((s, d) => s + d.visits, 0));

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="heading-2">Visitors</h1>
          <p className="mt-1 text-sm text-ink-500">
            Where people are opening the site. IPs are stored only as salted hashes.
          </p>
        </div>

        <div className="table-scroll">
          <div
            className="inline-flex rounded-xl border border-ink-200 bg-white p-1"
            role="group"
            aria-label="Time range"
          >
            {RANGES.map((r) => (
              <button
                key={r.days}
                type="button"
                onClick={() => setDays(r.days)}
                aria-pressed={days === r.days}
                className={`min-h-[2.25rem] whitespace-nowrap rounded-lg px-3 text-sm font-medium transition ${
                  days === r.days ? 'bg-grass-500 text-white' : 'text-ink-600 hover:bg-ink-50'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-ink-100 bg-white p-4">
          <div className="text-2xl font-bold text-grass-600 sm:text-3xl">{totals.visits.toLocaleString()}</div>
          <div className="mt-1 text-xs text-ink-500 sm:text-sm">Located visits</div>
        </div>
        <div className="rounded-2xl border border-ink-100 bg-white p-4">
          <div className="text-2xl font-bold text-sky-600 sm:text-3xl">{totals.unique.toLocaleString()}</div>
          <div className="mt-1 text-xs text-ink-500 sm:text-sm">Unique visitors</div>
        </div>
        <div className="rounded-2xl border border-ink-100 bg-white p-4">
          <div className="text-2xl font-bold sm:text-3xl">{totals.locations.toLocaleString()}</div>
          <div className="mt-1 text-xs text-ink-500 sm:text-sm">Distinct locations</div>
        </div>
      </div>

      {/* ------------------------------------------------------------- map */}
      <section className="rounded-2xl border border-ink-100 bg-white p-4 sm:p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-semibold">Geographic distribution</h2>

          <div className="flex flex-wrap gap-2">
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

            <div className="inline-flex rounded-xl border border-ink-200 bg-white p-1" role="group" aria-label="Metric">
              <button
                type="button"
                onClick={() => setMetric('visits')}
                aria-pressed={metric === 'visits'}
                className={`min-h-[2.25rem] rounded-lg px-3 text-sm font-medium transition ${
                  metric === 'visits' ? 'bg-sky-500 text-white' : 'text-ink-600 hover:bg-ink-50'
                }`}
              >
                Visits
              </button>
              <button
                type="button"
                onClick={() => setMetric('uniqueVisitors')}
                aria-pressed={metric === 'uniqueVisitors'}
                className={`min-h-[2.25rem] rounded-lg px-3 text-sm font-medium transition ${
                  metric === 'uniqueVisitors' ? 'bg-sky-500 text-white' : 'text-ink-600 hover:bg-ink-50'
                }`}
              >
                Unique
              </button>
            </div>
          </div>
        </div>

        {geo.loading ? (
          <div className="grid h-[22rem] place-items-center rounded-2xl bg-ink-50 text-sm text-ink-400 sm:h-[30rem]">
            Loading map…
          </div>
        ) : points.length === 0 ? (
          <div className="grid h-[22rem] place-items-center rounded-2xl bg-ink-50 px-6 text-center text-sm text-ink-400 sm:h-[30rem]">
            No located visits in this window yet. Browse the public site and they will appear here.
          </div>
        ) : (
          <VisitorMap points={mapPoints} mode={mode} />
        )}

        <p className="mt-3 text-xs text-ink-400">
          Marker size scales with {metric === 'visits' ? 'visit count' : 'unique visitors'}; the busiest third is shown
          in sky blue.
        </p>
      </section>

      {/* ------------------------------------------------------ daily trend */}
      <section className="rounded-2xl border border-ink-100 bg-white p-4 sm:p-5">
        <h2 className="text-sm font-semibold">Daily visits</h2>
        <div className="table-scroll mt-4">
          <div className="flex h-32 min-w-[36rem] items-end gap-[3px]">
            {(series.data ?? []).map((d) => (
              <div
                key={d.day}
                className="group relative flex-1 rounded-t bg-grass-400 transition hover:bg-grass-600"
                style={{ height: `${Math.max(2, (d.visits / seriesMax) * 100)}%` }}
                title={`${d.day}: ${d.visits} visits, ${d.uniqueVisitors} unique`}
              >
                <span className="sr-only">
                  {d.day}: {d.visits} visits
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------ breakdowns */}
      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-2xl border border-ink-100 bg-white">
          <h2 className="border-b border-ink-100 px-5 py-4 text-sm font-semibold">Top countries</h2>
          <ul className="divide-y divide-ink-100">
            {(countries.data ?? []).length === 0 ? (
              <li className="px-5 py-4 text-sm text-ink-400">No data yet.</li>
            ) : null}
            {(countries.data ?? []).slice(0, 10).map((c) => (
              <li key={`${c.countryCode}-${c.country}`} className="flex items-center justify-between px-5 py-3 text-sm">
                <span className="truncate text-ink-700">{c.country ?? 'Unknown'}</span>
                <span className="ml-3 shrink-0 font-medium text-ink-500">
                  {c.visits.toLocaleString()}
                  <span className="ml-1.5 text-xs text-ink-300">({c.uniqueVisitors})</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-ink-100 bg-white">
          <h2 className="border-b border-ink-100 px-5 py-4 text-sm font-semibold">Top pages</h2>
          <ul className="divide-y divide-ink-100">
            {(pages.data ?? []).length === 0 ? <li className="px-5 py-4 text-sm text-ink-400">No data yet.</li> : null}
            {(pages.data ?? []).map((p) => (
              <li key={p.path} className="flex items-center justify-between px-5 py-3 text-sm">
                <span className="truncate font-mono text-xs text-ink-700">{p.path}</span>
                <span className="ml-3 shrink-0 font-medium text-ink-500">{p.visits.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-ink-100 bg-white">
          <h2 className="border-b border-ink-100 px-5 py-4 text-sm font-semibold">Devices</h2>
          <ul className="space-y-3 px-5 py-4">
            {(devices.data ?? []).length === 0 ? <li className="text-sm text-ink-400">No data yet.</li> : null}
            {(devices.data ?? []).map((d) => {
              const pct = Math.round((d.visits / deviceTotal) * 100);
              return (
                <li key={d.device}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="capitalize text-ink-700">{d.device}</span>
                    <span className="font-medium text-ink-500">{pct}%</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink-100">
                    <div className="h-full rounded-full bg-sky-500" style={{ width: `${pct}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}
