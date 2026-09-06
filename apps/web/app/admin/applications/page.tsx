'use client';

import { useState } from 'react';
import { useAdminData, useAdminMutation } from '@/lib/use-admin-data';
import type { JoinApplication, ApplicationStatus } from '@/lib/types';
import { StatusBadge } from '@/components/ui';
import { ROLE_LABEL } from '@/lib/content';

const STATUSES: ApplicationStatus[] = ['NEW', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED'];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function AdminApplicationsPage() {
  const [filter, setFilter] = useState<ApplicationStatus | 'ALL'>('ALL');
  const [expanded, setExpanded] = useState<string | null>(null);
  const { data, loading, error, reload } = useAdminData<JoinApplication[]>(
    filter === 'ALL' ? '/admin/applications' : `/admin/applications?status=${filter}`,
  );
  const { mutate, busy } = useAdminMutation();

  async function setStatus(id: string, status: ApplicationStatus) {
    await mutate(`/admin/applications/${id}`, 'PATCH', { status });
    reload();
  }

  const applications = data ?? [];
  const withIdeas = applications.filter((a) => a.ideaPitch && a.ideaPitch.trim().length > 0).length;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="heading-2">Applications</h1>
        <p className="mt-1 text-sm text-ink-500">
          Developers applying to join the team. {withIdeas > 0 ? `${withIdeas} include an idea pitch.` : ''}
        </p>
      </header>

      <div className="table-scroll">
        <div className="inline-flex rounded-xl border border-ink-200 bg-white p-1" role="group" aria-label="Filter by status">
          {(['ALL', ...STATUSES] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilter(s)}
              aria-pressed={filter === s}
              className={`min-h-[2.25rem] whitespace-nowrap rounded-lg px-3 text-sm font-medium capitalize transition ${
                filter === s ? 'bg-sky-500 text-white' : 'text-ink-600 hover:bg-ink-50'
              }`}
            >
              {s.toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      {loading ? <p className="text-sm text-ink-400">Loading…</p> : null}
      {!loading && applications.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-ink-200 px-5 py-10 text-center text-sm text-ink-400">
          No applications in this view.
        </p>
      ) : null}

      <div className="space-y-3">
        {applications.map((app) => {
          const open = expanded === app.id;
          const meetsBar = app.yearsExperience >= 7;
          return (
            <article key={app.id} className="rounded-2xl border border-ink-100 bg-white">
              <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between">
                <button
                  type="button"
                  onClick={() => setExpanded(open ? null : app.id)}
                  aria-expanded={open}
                  className="min-w-0 flex-1 text-left"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold">{app.fullName}</h2>
                    <StatusBadge status={app.status} />
                    {app.ideaPitch ? <span className="chip-sky">Idea pitch</span> : null}
                  </div>
                  <p className="mt-1 text-sm text-ink-500">
                    {ROLE_LABEL[app.position] ?? app.position} ·{' '}
                    <span className={meetsBar ? 'font-medium text-grass-600' : 'text-amber-600'}>
                      {app.yearsExperience} yrs
                    </span>
                    {app.location ? ` · ${app.location}` : ''}
                  </p>
                  <p className="mt-1 text-xs text-ink-400">
                    {app.email} · {formatDate(app.createdAt)}
                  </p>
                </button>

                <label className="shrink-0 text-xs font-medium text-ink-500">
                  <span className="mb-1 block">Status</span>
                  <select
                    className="input py-2 text-sm"
                    value={app.status}
                    disabled={busy}
                    onChange={(e) => setStatus(app.id, e.target.value as ApplicationStatus)}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {open ? (
                <div className="space-y-4 border-t border-ink-100 px-5 py-4">
                  {app.primaryStack.length ? (
                    <ul className="flex flex-wrap gap-1.5">
                      {app.primaryStack.map((tech) => (
                        <li key={tech} className="chip">
                          {tech}
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-400">Motivation</h3>
                    <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-ink-600">{app.motivation}</p>
                  </div>

                  {app.ideaPitch ? (
                    <div className="rounded-xl border border-sky-200 bg-sky-50 p-4">
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-sky-700">Idea pitch</h3>
                      <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-ink-700">{app.ideaPitch}</p>
                    </div>
                  ) : null}

                  <div className="flex flex-wrap gap-2">
                    {app.githubUrl ? (
                      <a href={app.githubUrl} target="_blank" rel="noreferrer noopener" className="btn-outline">
                        GitHub
                      </a>
                    ) : null}
                    {app.portfolioUrl ? (
                      <a href={app.portfolioUrl} target="_blank" rel="noreferrer noopener" className="btn-outline">
                        Portfolio
                      </a>
                    ) : null}
                    <a href={`mailto:${app.email}`} className="btn-outline">
                      Email
                    </a>
                  </div>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </div>
  );
}
