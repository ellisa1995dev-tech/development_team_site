'use client';

import { Fragment, useCallback, useState } from 'react';
import { useAdminData, useAdminMutation } from '@/lib/use-admin-data';
import { useTable } from '@/lib/use-table';
import { useToast } from '@/components/Toast';
import { SearchInput, SortableHeader, PlainHeader, TableCard, EmptyRow } from '@/components/admin/TableShell';
import type { Project, ProjectStatus } from '@/lib/types';

const STATUSES: ProjectStatus[] = ['ACTIVE', 'COMPLETED', 'PAUSED'];
const COLUMNS = 6;

const STATUS_STYLE: Record<ProjectStatus, { dot: string; text: string; bg: string }> = {
  ACTIVE: { dot: 'bg-grass-500', text: 'text-grass-700', bg: 'bg-grass-500/10' },
  COMPLETED: { dot: 'bg-ink-400', text: 'text-muted', bg: 'bg-ink-400/10' },
  PAUSED: { dot: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-500/12' },
};

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
    (p: Project) => [
      p.name,
      p.domain,
      p.summary,
      p.clientName,
      p.status,
      ...(p.stack ?? []),
      ...(p.assignments ?? []).map((a) => a.member.name),
    ],
    [],
  );

  const sortValue = useCallback((p: Project, key: string) => {
    switch (key) {
      case 'name': return p.name;
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

  async function setProgress(project: Project, raw: number) {
    const progress = Math.max(0, Math.min(100, Math.round(raw)));
    if (progress === (project.progress ?? 0)) return;

    try {
      await mutate(`/admin/projects/${project.id}`, 'PATCH', { progress });
      reload();
      toast.success('Progress updated', `${project.name} is at ${progress}%.`);
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
        {/* Fixed layout with explicit widths. Without it the browser hands the
            long text columns everything and squeezes the controls to nothing —
            which is what made the previous version unreadable. */}
        <table className="w-full min-w-[49rem] table-fixed border-collapse text-sm">
          <colgroup>
            <col className="w-[29%]" />
            <col className="w-[13%]" />
            <col className="w-[19%]" />
            <col className="w-[8%]" />
            <col className="w-[10%]" />
            <col className="w-[21%]" />
          </colgroup>

          <thead className="surface-subtle">
            <tr className="border-b border-theme">
              <SortableHeader label="Project" columnKey="name" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} />
              <SortableHeader label="Status" columnKey="status" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} />
              <SortableHeader label="Progress" columnKey="progress" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} />
              <SortableHeader label="Team" columnKey="team" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} align="right" />
              <SortableHeader label="Started" columnKey="started" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} align="right" />
              <PlainHeader label="Stack" />
            </tr>
          </thead>

          <tbody className="divide-theme">
            {loading ? <EmptyRow colSpan={COLUMNS} message="Loading…" /> : null}
            {!loading && table.rows.length === 0 ? (
              <EmptyRow colSpan={COLUMNS} message={table.query ? `No projects match “${table.query}”.` : 'No projects in this view.'} />
            ) : null}

            {table.rows.map((p) => {
              const open = expanded === p.id;
              const progress = p.progress ?? 0;
              const style = STATUS_STYLE[p.status];

              return (
                <Fragment key={p.id}>
                  <tr className="align-middle transition-colors hover:bg-[var(--bg-subtle)]">
                    {/* ------------------------------------------------ project */}
                    <td className="px-4 py-3.5">
                      <button
                        type="button"
                        onClick={() => setExpanded(open ? null : p.id)}
                        aria-expanded={open}
                        className="group/row flex w-full items-start gap-2 text-left"
                      >
                        <span
                          className={`mt-1 shrink-0 text-faint transition-transform duration-300 ${open ? 'rotate-90' : ''}`}
                          aria-hidden="true"
                        >
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path d="M3 1.5L6.5 5 3 8.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                        <span className="min-w-0">
                          <span
                            className="block truncate font-medium text-body group-hover/row:text-grass-700"
                            title={p.name}
                          >
                            {p.name}
                          </span>
                          <span className="mt-0.5 block truncate text-xs text-faint">{p.domain}</span>
                        </span>
                      </button>
                    </td>

                    {/* Status pill with an invisible select layered over it, so
                        the row reads as a badge but stays editable in place. */}
                    <td className="px-4 py-3.5">
                      <div className="relative inline-flex">
                        <span
                          className={`pointer-events-none inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${style.bg} ${style.text}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} aria-hidden="true" />
                          {p.status.toLowerCase()}
                        </span>
                        <select
                          value={p.status}
                          disabled={busy}
                          aria-label={`Status for ${p.name}`}
                          onWheel={(e) => e.currentTarget.blur()}
                          onChange={(e) => setStatus(p, e.target.value as ProjectStatus)}
                          className="absolute inset-0 cursor-pointer opacity-0"
                        >
                          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </td>

                    {/* ----------------------------------------------- progress */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="h-1.5 flex-1 overflow-hidden rounded-full"
                          style={{ background: 'var(--bg-inset)' }}
                          role="progressbar"
                          aria-valuenow={progress}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`${p.name} progress`}
                        >
                          <div
                            className={`h-full rounded-full transition-all duration-700 ease-out-expo ${
                              progress === 100 ? 'bg-ink-400' : 'bg-grass-500'
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step={5}
                          defaultValue={progress}
                          disabled={busy}
                          aria-label={`Set progress for ${p.name}`}
                          onWheel={(e) => e.currentTarget.blur()}
                          onBlur={(e) => setProgress(p, Number(e.target.value))}
                          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                          className="w-11 shrink-0 rounded-md border bg-transparent px-1 py-0.5 text-right text-xs tabular-nums text-muted transition focus:border-grass-500 focus:outline-none"
                          style={{ borderColor: 'var(--border)' }}
                        />
                        <span className="shrink-0 text-xs text-faint">%</span>
                      </div>
                    </td>

                    {/* --------------------------------------------------- team */}
                    <td className="px-4 py-3.5 text-right">
                      <span
                        className="inline-flex min-w-[1.75rem] justify-center rounded-md px-1.5 py-0.5 text-xs font-medium tabular-nums text-muted"
                        style={{ background: 'var(--bg-inset)' }}
                        title={p.assignments?.map((a) => a.member.name).join(', ') || 'Nobody assigned'}
                      >
                        {p.assignments?.length ?? 0}
                      </span>
                    </td>

                    {/* ------------------------------------------------ started */}
                    <td className="px-4 py-3.5 text-right text-xs tabular-nums text-muted">
                      {year(p.startedAt)}
                      {p.completedAt ? <span className="text-faint">–{year(p.completedAt)}</span> : null}
                    </td>

                    {/* -------------------------------------------------- stack */}
                    <td className="px-4 py-3.5">
                      <div className="flex flex-nowrap items-center gap-1 overflow-hidden">
                        {p.stack.slice(0, 2).map((t) => (
                          <span key={t} className="chip shrink-0 whitespace-nowrap">{t}</span>
                        ))}
                        {p.stack.length > 2 ? (
                          <span className="chip shrink-0" title={p.stack.slice(2).join(', ')}>
                            +{p.stack.length - 2}
                          </span>
                        ) : null}
                      </div>
                    </td>
                  </tr>

                  {open ? (
                    <tr>
                      <td colSpan={COLUMNS} className="surface-subtle px-4 pb-5 pt-1">
                        <div className="grid gap-5 pl-6 lg:grid-cols-[2fr_1fr]">
                          <div>
                            <p className="text-sm leading-relaxed text-muted">{p.summary}</p>
                            {p.description ? (
                              <p className="mt-2 text-sm leading-relaxed text-faint">{p.description}</p>
                            ) : null}
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {p.stack.map((t) => <span key={t} className="chip">{t}</span>)}
                            </div>
                          </div>

                          <div>
                            {p.clientName ? (
                              <>
                                <h3 className="text-xs font-semibold uppercase tracking-wide text-faint">Client</h3>
                                <p className="mt-1 text-sm text-muted">{p.clientName}</p>
                              </>
                            ) : null}

                            <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-faint">
                              Assigned engineers
                            </h3>
                            {p.assignments?.length ? (
                              <ul className="mt-2 space-y-1.5">
                                {p.assignments.map((a) => (
                                  <li key={a.id} className="text-sm text-muted">
                                    <span className="font-medium text-body">{a.member.name}</span>
                                    <span className="text-faint"> · {a.roleOnProject}</span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="mt-1 text-sm text-faint">Nobody assigned yet.</p>
                            )}
                          </div>
                        </div>
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
