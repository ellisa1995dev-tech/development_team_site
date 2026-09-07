'use client';

import { useCallback, useState } from 'react';
import { useAdminData, useAdminMutation } from '@/lib/use-admin-data';
import { useTable } from '@/lib/use-table';
import { useToast } from '@/components/Toast';
import { SearchInput, SortableHeader, PlainHeader, TableCard, EmptyRow, Pagination } from '@/components/admin/TableShell';
import type { TeamMember, MemberRole } from '@/lib/types';
import { ROLE_LABEL } from '@/lib/content';

const ROLES: MemberRole[] = ['CTO', 'BACKEND', 'FRONTEND', 'DEVOPS'];

interface AdminMember extends TeamMember {
  assignments?: Array<{ id: string; roleOnProject: string; project: { id: string; name: string; status: string } }>;
}

const BLANK = {
  name: '',
  title: '',
  role: 'BACKEND' as MemberRole,
  yearsExperience: 7,
  focus: '',
  bio: '',
  skills: '',
  location: '',
};

const COLUMNS = 7;

export default function AdminTeamPage() {
  const { data, loading, error, reload } = useAdminData<AdminMember[]>('/admin/members');
  const { mutate, busy } = useAdminMutation();
  const toast = useToast();

  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState(BLANK);
  const [roleFilter, setRoleFilter] = useState<MemberRole | 'ALL'>('ALL');

  const all = data ?? [];
  const scoped = roleFilter === 'ALL' ? all : all.filter((m) => m.role === roleFilter);

  const searchable = useCallback(
    (m: AdminMember) => [m.name, m.title, m.focus, m.location, ROLE_LABEL[m.role], ...(m.skills ?? [])],
    [],
  );

  const sortValue = useCallback((m: AdminMember, key: string) => {
    switch (key) {
      case 'name': return m.name;
      case 'role': return ROLE_LABEL[m.role] ?? m.role;
      case 'title': return m.title;
      case 'years': return m.yearsExperience;
      case 'location': return m.location ?? null;
      case 'projects': return m.assignments?.length ?? 0;
      default: return null;
    }
  }, []);

  const table = useTable(scoped, { searchable, sortValue, initialSort: 'name' });

  async function toggleActive(member: AdminMember) {
    try {
      await mutate(`/admin/members/${member.id}`, 'PATCH', { active: !member.active });
      toast.success(member.active ? 'Member deactivated' : 'Member activated', member.name);
      reload();
    } catch (err) {
      toast.error('Could not update member', err instanceof Error ? err.message : undefined);
    }
  }

  async function remove(member: AdminMember) {
    if (!window.confirm(`Remove ${member.name} from the team? This also clears their project assignments.`)) return;
    try {
      await mutate(`/admin/members/${member.id}`, 'DELETE');
      toast.success('Member removed', member.name);
      reload();
    } catch (err) {
      toast.error('Could not remove member', err instanceof Error ? err.message : undefined);
    }
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    try {
      await mutate('/admin/members', 'POST', {
        name: draft.name.trim(),
        title: draft.title.trim(),
        role: draft.role,
        yearsExperience: Number(draft.yearsExperience),
        focus: draft.focus.trim(),
        bio: draft.bio.trim(),
        skills: draft.skills.split(',').map((s) => s.trim()).filter(Boolean),
        location: draft.location.trim() || undefined,
        sortOrder: all.length + 1,
      });
      toast.success('Member added', draft.name.trim());
      setDraft(BLANK);
      setShowForm(false);
      reload();
    } catch (err) {
      toast.error('Could not add member', err instanceof Error ? err.message : undefined);
    }
  }

  const counts = ROLES.map((r) => `${all.filter((m) => m.role === r).length} ${ROLE_LABEL[r]}`).join(' · ');

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="heading-2">Team</h1>
          <p className="mt-1 text-sm text-muted">
            {all.length} members · {counts}
          </p>
        </div>
        <button type="button" onClick={() => setShowForm((v) => !v)} className="btn-primary w-full sm:w-auto">
          {showForm ? 'Cancel' : 'Add member'}
        </button>
      </header>

      {showForm ? (
        <form onSubmit={create} className="card space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="m-name">Name</label>
              <input id="m-name" className="input" required value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            </div>
            <div>
              <label className="label" htmlFor="m-title">Title</label>
              <input id="m-title" className="input" required value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            </div>
            <div>
              <label className="label" htmlFor="m-role">Role</label>
              <select id="m-role" className="input" value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value as MemberRole })}>
                {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="m-years">Years of experience</label>
              <input id="m-years" type="number" min={0} max={60} className="input" required value={draft.yearsExperience} onChange={(e) => setDraft({ ...draft, yearsExperience: Number(e.target.value) })} />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="m-focus">Focus (one line)</label>
              <input id="m-focus" className="input" required value={draft.focus} onChange={(e) => setDraft({ ...draft, focus: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="m-bio">Bio</label>
              <textarea id="m-bio" rows={3} className="input resize-y" required value={draft.bio} onChange={(e) => setDraft({ ...draft, bio: e.target.value })} />
            </div>
            <div>
              <label className="label" htmlFor="m-skills">Skills (comma separated)</label>
              <input id="m-skills" className="input" value={draft.skills} onChange={(e) => setDraft({ ...draft, skills: e.target.value })} />
            </div>
            <div>
              <label className="label" htmlFor="m-location">Location</label>
              <input id="m-location" className="input" value={draft.location} onChange={(e) => setDraft({ ...draft, location: e.target.value })} />
            </div>
          </div>
          <button type="submit" className="btn-primary w-full sm:w-auto" disabled={busy}>
            {busy ? 'Saving…' : 'Add to team'}
          </button>
        </form>
      ) : null}

      {/* -------------------------------------------------------- controls */}
      <div className="grid gap-3 sm:grid-cols-[minmax(0,20rem)_1fr] sm:items-start">
        <SearchInput
          value={table.query}
          onChange={table.setQuery}
          placeholder="Search name, role, skill, location…"
          resultCount={table.matched}
          total={table.total}
        />

        <div className="table-scroll sm:justify-self-end">
          <div className="inline-flex rounded-xl border p-1 border-theme" role="group" aria-label="Filter by role">
            {(['ALL', ...ROLES] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRoleFilter(r)}
                aria-pressed={roleFilter === r}
                className={`min-h-[2.25rem] whitespace-nowrap rounded-lg px-3 text-sm font-medium transition ${
                  roleFilter === r ? 'bg-grass-500 text-white' : 'text-muted hover:text-body'
                }`}
              >
                {r === 'ALL' ? 'All' : ROLE_LABEL[r]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p> : null}

      {/* ----------------------------------------------------------- table */}
      <TableCard>
        <table className="w-full min-w-[48rem] border-collapse text-sm">
          <thead className="surface-subtle">
            <tr className="border-b border-theme">
              <SortableHeader label="Name" columnKey="name" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} />
              <SortableHeader label="Role" columnKey="role" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} />
              <SortableHeader label="Title" columnKey="title" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} />
              <SortableHeader label="Years" columnKey="years" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} align="right" />
              <SortableHeader label="Location" columnKey="location" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} />
              <SortableHeader label="Projects" columnKey="projects" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} align="right" />
              <PlainHeader label="Actions" align="right" />
            </tr>
          </thead>

          <tbody className="divide-theme">
            {loading ? <EmptyRow colSpan={COLUMNS} message="Loading…" /> : null}
            {!loading && table.matched === 0 ? (
              <EmptyRow colSpan={COLUMNS} message={table.query ? `No members match “${table.query}”.` : 'No members yet.'} />
            ) : null}

            {table.rows.map((m) => (
              <tr key={m.id} className={`transition-colors hover:bg-[var(--bg-subtle)] ${m.active ? '' : 'opacity-55'}`}>
                <td className="px-4 py-3">
                  <div className="font-medium text-body">{m.name}</div>
                  <div className="mt-0.5 text-xs text-faint">{m.focus}</div>
                </td>
                <td className="px-4 py-3"><span className="chip-grass">{ROLE_LABEL[m.role]}</span></td>
                <td className="px-4 py-3 text-muted">{m.title}</td>
                <td className="px-4 py-3 text-right tabular-nums">
                  <span className={m.yearsExperience >= 7 ? 'font-medium text-grass-600' : 'text-amber-600'}>{m.yearsExperience}</span>
                </td>
                <td className="px-4 py-3 text-muted">{m.location ?? '—'}</td>
                <td className="px-4 py-3 text-right tabular-nums text-muted" title={m.assignments?.map((a) => a.project.name).join(', ')}>
                  {m.assignments?.length ?? 0}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1.5">
                    <button type="button" onClick={() => toggleActive(m)} disabled={busy} className="rounded-lg border px-2.5 py-1.5 text-xs font-medium border-theme text-muted transition hover:text-body">
                      {m.active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button type="button" onClick={() => remove(m)} disabled={busy} className="rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50">
                      Remove
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <Pagination
          page={table.page}
          pageCount={table.pageCount}
          pageSize={table.pageSize}
          firstShown={table.firstShown}
          lastShown={table.lastShown}
          matched={table.matched}
          onPage={table.setPage}
          onPageSize={table.setPageSize}
          noun="member"
        />
      </TableCard>
    </div>
  );
}
