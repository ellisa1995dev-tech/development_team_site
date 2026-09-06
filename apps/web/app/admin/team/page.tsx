'use client';

import { useState } from 'react';
import { useAdminData, useAdminMutation } from '@/lib/use-admin-data';
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

export default function AdminTeamPage() {
  const { data, loading, error, reload } = useAdminData<AdminMember[]>('/admin/members');
  const { mutate, busy } = useAdminMutation();
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState(BLANK);
  const [formError, setFormError] = useState<string | null>(null);

  const members = data ?? [];

  async function toggleActive(member: AdminMember) {
    await mutate(`/admin/members/${member.id}`, 'PATCH', { active: !member.active });
    reload();
  }

  async function remove(member: AdminMember) {
    if (!window.confirm(`Remove ${member.name} from the team? This also clears their project assignments.`)) return;
    await mutate(`/admin/members/${member.id}`, 'DELETE');
    reload();
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    try {
      await mutate('/admin/members', 'POST', {
        name: draft.name.trim(),
        title: draft.title.trim(),
        role: draft.role,
        yearsExperience: Number(draft.yearsExperience),
        focus: draft.focus.trim(),
        bio: draft.bio.trim(),
        skills: draft.skills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        location: draft.location.trim() || undefined,
        sortOrder: members.length + 1,
      });
      setDraft(BLANK);
      setShowForm(false);
      reload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not add member.');
    }
  }

  const byRole = (role: MemberRole) => members.filter((m) => m.role === role);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="heading-2">Team</h1>
          <p className="mt-1 text-sm text-ink-500">
            {members.length} members · {ROLES.map((r) => `${byRole(r).length} ${ROLE_LABEL[r]}`).join(' · ')}
          </p>
        </div>
        <button type="button" onClick={() => setShowForm((v) => !v)} className="btn-primary w-full sm:w-auto">
          {showForm ? 'Cancel' : 'Add member'}
        </button>
      </header>

      {showForm ? (
        <form onSubmit={create} className="rounded-2xl border border-ink-100 bg-white p-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="m-name">
                Name
              </label>
              <input id="m-name" className="input" required value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            </div>
            <div>
              <label className="label" htmlFor="m-title">
                Title
              </label>
              <input id="m-title" className="input" required value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            </div>
            <div>
              <label className="label" htmlFor="m-role">
                Role
              </label>
              <select id="m-role" className="input" value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value as MemberRole })}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABEL[r]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="m-years">
                Years of experience
              </label>
              <input
                id="m-years"
                type="number"
                min={0}
                max={60}
                className="input"
                required
                value={draft.yearsExperience}
                onChange={(e) => setDraft({ ...draft, yearsExperience: Number(e.target.value) })}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="m-focus">
                Focus (one line)
              </label>
              <input id="m-focus" className="input" required value={draft.focus} onChange={(e) => setDraft({ ...draft, focus: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="m-bio">
                Bio
              </label>
              <textarea id="m-bio" rows={3} className="input resize-y" required value={draft.bio} onChange={(e) => setDraft({ ...draft, bio: e.target.value })} />
            </div>
            <div>
              <label className="label" htmlFor="m-skills">
                Skills (comma separated)
              </label>
              <input id="m-skills" className="input" value={draft.skills} onChange={(e) => setDraft({ ...draft, skills: e.target.value })} />
            </div>
            <div>
              <label className="label" htmlFor="m-location">
                Location
              </label>
              <input id="m-location" className="input" value={draft.location} onChange={(e) => setDraft({ ...draft, location: e.target.value })} />
            </div>
          </div>

          {formError ? (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
              {formError}
            </p>
          ) : null}

          <button type="submit" className="btn-primary w-full sm:w-auto" disabled={busy}>
            {busy ? 'Saving…' : 'Add to team'}
          </button>
        </form>
      ) : null}

      {error ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      {loading ? <p className="text-sm text-ink-400">Loading…</p> : null}

      <div className="space-y-3">
        {members.map((member) => (
          <article key={member.id} className="rounded-2xl border border-ink-100 bg-white p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-semibold">{member.name}</h2>
                  <span className="chip-grass">{ROLE_LABEL[member.role]}</span>
                  <span className="chip-sky">{member.yearsExperience} yrs</span>
                  {!member.active ? <span className="chip">Inactive</span> : null}
                </div>
                <p className="mt-1 text-sm text-ink-500">{member.title}</p>
                <p className="mt-1 text-xs text-ink-400">{member.focus}</p>
              </div>

              <div className="flex shrink-0 gap-2">
                <button type="button" onClick={() => toggleActive(member)} disabled={busy} className="btn-outline">
                  {member.active ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  type="button"
                  onClick={() => remove(member)}
                  disabled={busy}
                  className="btn border border-red-200 bg-white px-4 text-red-600 hover:bg-red-50"
                >
                  Remove
                </button>
              </div>
            </div>

            {member.assignments?.length ? (
              <div className="mt-4 border-t border-ink-100 pt-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-400">Current projects</h3>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {member.assignments.map((a) => (
                    <li key={a.id} className="chip">
                      {a.project.name} · {a.roleOnProject}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}
