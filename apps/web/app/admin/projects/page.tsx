'use client';

import { Fragment, useCallback, useState } from 'react';
import { useAdminData, useAdminMutation } from '@/lib/use-admin-data';
import { useTable } from '@/lib/use-table';
import { useToast } from '@/components/Toast';
import { SearchInput, SortableHeader, PlainHeader, TableCard, EmptyRow } from '@/components/admin/TableShell';
import type { Project, ProjectStatus } from '@/lib/types';

const STATUSES: ProjectStatus[] = ['ACTIVE', 'COMPLETED', 'PAUSED'];
const COLUMNS = 8;

function year(iso?: string | null) {
  return iso ? new Date(iso).getFullYear() : null;
}

export default function AdminProjectsPage() {
  const [filter, setFilter] = useState<ProjectStatus | 'ALL'>('ALL');
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data, loading, error, reload } = useAdminData<Project[]>(
    filter === 'ALL' ? '/admin/projects' : `/admin/projects?status=${filter}`,
  );
  const { mutate, busy } = useAdminMutation();
  const toast = useToast();

  const all = data ?? [];

  const searchable = useCallback(
    (p: Project) => [p.name, p.domain, p.summary, p.clientName, p.status, ...(p.stack ?? []),
      ...(p.assignments ?? []).map((a) => a.member.name)],
    [],
  );

  const sortValue = useCallback((p: Project, key: string) => {
    switch (key) {
      case 'name': return p.name;
      case 'domain': return p.domain;
      case 'status': return p.status;
      case 'progress': return p.progress ?? 0;
      case 'team': return p.assignments?.length ?? 0;
      case 'started': return new Date(p.startedAt).getTime();
      default: return null;
    }
  }, []);

  const table = useTable(all, { searchable, sortValue, initialSort: 'started', initialDir: 'desc' });

  async function setStatus(project: Project, status: ProjectStatus, isUndo = false) {
    const previous = project.status;
    if (status === previous) return;

    try {
      await mutate(`/admin/projects/${project.id}`, 'PATCH', { status });
      reload();

      if (isUndo) {
        toast.info('Reverted', `${project.name} is ${status.toLowerCase()} again.`);
        return;
      }

      toast.toast({
        title: 'Status updated',
        description: `${project.name} → ${status.toLowerCase()}`,
        variant: 'success',
        duration: 8000,
        action: {
          label: `Undo (back to ${previous.toLowerCase()})`,
          onClick: () => setStatus({ ...project, status }, previous, true),
        },
      });
    } catch (err) {
      toast.error('Could not update project', err instanceof Error ? err.message : undefined);
    }
  }

  async function setProgress(project: Project, progress: number) {
    if (progress === (project.progress ?? 0)) return;
    try {
      await mutate(`/admin/projects/${project.id}`, 'PATCH', { progress });
      reload();
    } catch (err) {
      toast.error('Could not update progress', err instanceof Error ? err.message : undefined);
    }
  }

  const activeCount = all.filter((p) => p.status === 'ACTIVE').length;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="heading-2">Projects</h1>
        <p className="mt-1 text-sm text-muted">
          {all.length} total · {activeCount} active
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-[minmax(0,20rem)_1fr] sm:items-start">
        <SearchInput
          value={table.query}
          onChange={table.setQuery}
          placeholder="Search name, domain, stack, engineer…"
          resultCount={table.rows.length}
          total={table.total}
        />

        <div className="table-scroll sm:justify-self-end">
          <div className="inline-flex rounded-xl border p-1 border-theme" role="group" aria-label="Filter by status">
            {(['ALL', ...STATUSES] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setFilter(s)}
                aria-pressed={filter === s}
                className={`min-h-[2.25rem] whitespace-nowrap rounded-lg px-3 text-sm font-medium capitalize transition ${
                  filter === s ? 'bg-grass-500 text-white' : 'text-muted hover:text-body'
                }`}
              >
                {s.toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p> : null}

      <TableCard>
        <table className="w-full min-w-[52rem] border-collapse text-sm">
          <thead className="surface-subtle">
            <tr className="border-b border-theme">
              <SortableHeader label="Project" columnKey="name" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} />
              <SortableHeader label="Domain" columnKey="domain" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} />
              <SortableHeader label="Status" columnKey="status" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} />
              <SortableHeader label="Progress" columnKey="progress" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} />
              <SortableHeader label="Team" columnKey="team" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} align="right" />
              <SortableHeader label="Started" columnKey="started" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} align="right" />
              <PlainHeader label="Stack" />
              <PlainHeader label="" align="right" />
            </tr>
          </thead>

          <tbody className="divide-theme">
            {loading ? <EmptyRow colSpan={COLUMNS} message="Loading…" /> : null}
            {!loading && table.rows.length === 0 ? (
              <EmptyRow colSpan={COLUMNS} message={table.query ? `No projects match “${table.query}”.` : 'No projects in this view.'} />
            ) : null}

            {table.rows.map((p) => {
              const open = expanded === p.id;
              return (
                <Fragment key={p.id}>
                  <tr className="transition-colors hover:bg-[var(--bg-subtle)]">
                    <td className="px-4 py-3">
                      <div className="font-medium text-body">{p.name}</div>
                      {p.clientName ? <div className="mt-0.5 text-xs text-faint">{p.clientName}</div> : null}
                    </td>
                    <td className="px-4 py-3 text-muted">{p.domain}</td>
                    <td className="px-4 py-3">
                      <select
                        className="input py-1.5 text-xs"
                        value={p.status}
                        disabled={busy}
                        aria-label={`Status for ${p.name}`}
                        // Stops the wheel from cycling options while scrolling the table.
                        onWheel={(e) => e.currentTarget.blur()}
                        onChange={(e) => setStatus(p, e.target.value as ProjectStatus)}
                      >
                        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 overflow-hidden rounded-full" style={{ background: 'var(--bg-inset)' }}>
                          <div className="h-full rounded-full bg-grass-500 transition-all duration-500" style={{ width: `${p.progress ?? 0}%` }} />
                        </div>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step={5}
                          defaultValue={p.progress ?? 0}
                          disabled={busy}
                          aria-label={`Progress for ${p.name}`}
                          onWheel={(e) => e.currentTarget.blur()}
                          onBlur={(e) => setProgress(p, Number(e.target.value))}
                          className="input w-16 py-1 text-xs tabular-nums"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted">{p.assignments?.length ?? 0}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted">
                      {year(p.startedAt)}
                      {p.completedAt ? `–${year(p.completedAt)}` : ''}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex max-w-[14rem] flex-wrap gap-1">
                        {p.stack.slice(0, 3).map((t) => <span key={t} className="chip">{t}</span>)}
                        {p.stack.length > 3 ? <span className="chip">+{p.stack.length - 3}</span> : null}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setExpanded(open ? null : p.id)}
                        aria-expanded={open}
                        className="rounded-lg border px-2.5 py-1.5 text-xs font-medium border-theme text-muted transition hover:text-body"
                      >
                        {open ? 'Hide' : 'Details'}
                      </button>
                    </td>
                  </tr>

                  {open ? (
                    <tr>
                      <td colSpan={COLUMNS} className="px-4 py-4 surface-subtle">
                        <p className="max-w-3xl text-sm leading-relaxed text-muted">{p.summary}</p>
                        {p.description ? (
                          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-faint">{p.description}</p>
                        ) : null}

                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {p.stack.map((t) => <span key={t} className="chip">{t}</span>)}
                        </div>

                        <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-faint">Assigned engineers</h3>
                        {p.assignments?.length ? (
                          <ul className="mt-2 flex flex-wrap gap-2">
                            {p.assignments.map((a) => (
                              <li key={a.id} className="chip-grass">{a.member.name} · {a.roleOnProject}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mt-1 text-sm text-faint">Nobody assigned yet.</p>
                        )}
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </TableCard>
    </div>
  );
}
