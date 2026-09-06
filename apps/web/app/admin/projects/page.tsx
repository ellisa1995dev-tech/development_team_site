'use client';

import { useState } from 'react';
import { useAdminData, useAdminMutation } from '@/lib/use-admin-data';
import type { Project, ProjectStatus } from '@/lib/types';
import { StatusBadge } from '@/components/ui';

const STATUSES: ProjectStatus[] = ['ACTIVE', 'COMPLETED', 'PAUSED'];

export default function AdminProjectsPage() {
  const [filter, setFilter] = useState<ProjectStatus | 'ALL'>('ALL');
  const { data, loading, error, reload } = useAdminData<Project[]>(
    filter === 'ALL' ? '/admin/projects' : `/admin/projects?status=${filter}`,
  );
  const { mutate, busy } = useAdminMutation();

  async function setStatus(id: string, status: ProjectStatus) {
    await mutate(`/admin/projects/${id}`, 'PATCH', { status });
    reload();
  }

  async function setProgress(id: string, progress: number) {
    await mutate(`/admin/projects/${id}`, 'PATCH', { progress });
    reload();
  }

  const projects = data ?? [];

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="heading-2">Projects</h1>
          <p className="mt-1 text-sm text-ink-500">Active work, assigned engineers and delivery progress.</p>
        </div>

        <div className="table-scroll">
          <div className="inline-flex rounded-xl border border-ink-200 bg-white p-1" role="group" aria-label="Filter by status">
            {(['ALL', ...STATUSES] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setFilter(s)}
                aria-pressed={filter === s}
                className={`min-h-[2.25rem] whitespace-nowrap rounded-lg px-3 text-sm font-medium capitalize transition ${
                  filter === s ? 'bg-grass-500 text-white' : 'text-ink-600 hover:bg-ink-50'
                }`}
              >
                {s.toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </header>

      {error ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      {loading ? <p className="text-sm text-ink-400">Loading…</p> : null}
      {!loading && projects.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-ink-200 px-5 py-10 text-center text-sm text-ink-400">
          No projects match this filter.
        </p>
      ) : null}

      <div className="space-y-4">
        {projects.map((project) => (
          <article key={project.id} className="rounded-2xl border border-ink-100 bg-white p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-semibold">{project.name}</h2>
                  <StatusBadge status={project.status} />
                </div>
                <p className="mt-1 text-xs font-medium uppercase tracking-wide text-sky-600">{project.domain}</p>
                {project.clientName ? <p className="mt-1 text-xs text-ink-400">Client: {project.clientName}</p> : null}
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-500">{project.summary}</p>
              </div>

              <label className="shrink-0 text-xs font-medium text-ink-500">
                <span className="mb-1 block">Status</span>
                <select
                  className="input py-2 text-sm"
                  value={project.status}
                  disabled={busy}
                  onChange={(e) => setStatus(project.id, e.target.value as ProjectStatus)}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-4 flex flex-wrap gap-1.5">
              {project.stack.map((tech) => (
                <span key={tech} className="chip">
                  {tech}
                </span>
              ))}
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between text-xs font-medium text-ink-500">
                <span>Progress</span>
                <span>{project.progress ?? 0}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                defaultValue={project.progress ?? 0}
                disabled={busy}
                onMouseUp={(e) => setProgress(project.id, Number((e.target as HTMLInputElement).value))}
                onTouchEnd={(e) => setProgress(project.id, Number((e.target as HTMLInputElement).value))}
                className="mt-2 w-full accent-grass-500"
                aria-label={`Progress for ${project.name}`}
              />
            </div>

            {project.assignments?.length ? (
              <div className="mt-4 border-t border-ink-100 pt-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-400">Assigned</h3>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {project.assignments.map((a) => (
                    <li key={a.id} className="chip-grass">
                      {a.member.name} · {a.roleOnProject}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="mt-4 border-t border-ink-100 pt-4 text-xs text-ink-400">No engineers assigned yet.</p>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
