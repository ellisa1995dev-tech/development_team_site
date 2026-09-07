'use client';

import { useCallback, useMemo, useState } from 'react';
import { useAdminData, useAdminMutation } from '@/lib/use-admin-data';
import { useTable } from '@/lib/use-table';
import { useToast } from '@/components/Toast';
import {
  SearchInput,
  SortableHeader,
  PlainHeader,
  TableCard,
  EmptyRow,
  FilterSelect,
  Pagination,
} from '@/components/admin/TableShell';

type Role = 'USER' | 'MANAGER';

interface RegisteredUser {
  id: string;
  email: string;
  fullName: string;
  company: string | null;
  role: Role;
  country: string | null;
  countryCode: string | null;
  region: string | null;
  city: string | null;
  location: string | null;
  lastSeenAt: string;
  createdAt: string;
  isOnline: boolean;
  _count: { orders: number; applications: number };
}

const COLUMNS = 7;

function date(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

/** "3 days ago" style, kept short enough for a table cell. */
function since(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days < 30 ? `${days}d ago` : date(iso);
}

export default function RegisteredUsersTable() {
  const { data, loading, error, reload } = useAdminData<RegisteredUser[]>('/admin/registered-users');
  const { mutate, busy } = useAdminMutation();
  const toast = useToast();

  const [roleFilter, setRoleFilter] = useState('ALL');
  const [regionFilter, setRegionFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [activityFilter, setActivityFilter] = useState('ALL');

  const all = useMemo(() => data ?? [], [data]);

  /** Regions present in the data, so the dropdown never offers an empty result. */
  const regions = useMemo(() => {
    const counts = new Map<string, number>();
    all.forEach((u) => {
      if (u.country) counts.set(u.country, (counts.get(u.country) ?? 0) + 1);
    });
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [all]);

  const filters = useMemo(
    () => [
      (u: RegisteredUser) => roleFilter === 'ALL' || u.role === roleFilter,
      (u: RegisteredUser) =>
        regionFilter === 'ALL'
          ? true
          : regionFilter === 'NONE'
            ? !u.country
            : u.country === regionFilter,
      (u: RegisteredUser) =>
        statusFilter === 'ALL' || (statusFilter === 'ONLINE' ? u.isOnline : !u.isOnline),
      (u: RegisteredUser) => {
        if (activityFilter === 'ALL') return true;
        const engaged = u._count.orders + u._count.applications > 0;
        return activityFilter === 'ENGAGED' ? engaged : !engaged;
      },
    ],
    [roleFilter, regionFilter, statusFilter, activityFilter],
  );

  const searchable = useCallback(
    (u: RegisteredUser) => [u.fullName, u.email, u.company, u.city, u.region, u.country, u.role],
    [],
  );

  const sortValue = useCallback((u: RegisteredUser, key: string) => {
    switch (key) {
      case 'name': return u.fullName;
      case 'email': return u.email;
      case 'role': return u.role;
      case 'region': return u.country ?? null;
      case 'joined': return new Date(u.createdAt).getTime();
      case 'seen': return new Date(u.lastSeenAt).getTime();
      case 'activity': return u._count.orders + u._count.applications;
      default: return null;
    }
  }, []);

  const table = useTable(all, { searchable, sortValue, filters, initialSort: 'joined', initialDir: 'desc' });

  async function setRole(user: RegisteredUser, role: Role) {
    if (role === user.role) return;
    try {
      await mutate(`/admin/registered-users/${user.id}/role`, 'PATCH', { role });
      reload();
      toast.toast({
        title: role === 'MANAGER' ? 'Granted management access' : 'Management access removed',
        description: `${user.email} is now ${role.toLowerCase()}.`,
        variant: role === 'MANAGER' ? 'success' : 'warning',
        duration: 9000,
        action: {
          label: 'Undo',
          onClick: () => setRole({ ...user, role }, user.role),
        },
      });
    } catch (err) {
      toast.error('Could not change the role', err instanceof Error ? err.message : undefined);
    }
  }

  const anyFilter = roleFilter !== 'ALL' || regionFilter !== 'ALL' || statusFilter !== 'ALL' || activityFilter !== 'ALL';

  const clearFilters = () => {
    setRoleFilter('ALL');
    setRegionFilter('ALL');
    setStatusFilter('ALL');
    setActivityFilter('ALL');
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-1">
        <h2 className="heading-3">Registered users</h2>
        <p className="text-sm text-muted">
          {all.length} account{all.length === 1 ? '' : 's'} ·{' '}
          {all.filter((u) => u.role === 'MANAGER').length} with management access
        </p>
      </div>

      {/* --------------------------------------------------- search + filters */}
      <div className="flex flex-wrap items-end gap-2.5">
        <div className="min-w-[15rem] flex-1">
          <SearchInput
            value={table.query}
            onChange={table.setQuery}
            placeholder="Search name, email, company, city…"
            resultCount={table.matched}
            total={table.total}
          />
        </div>

        <div className="flex flex-wrap items-end gap-2.5">
          <FilterSelect
              label="Membership"
              value={roleFilter}
              onChange={setRoleFilter}
              options={[
                { value: 'ALL', label: 'All members' },
                { value: 'USER', label: 'Member' },
                { value: 'MANAGER', label: 'Manager' },
              ]}
          />
          <FilterSelect
              label="Region"
              value={regionFilter}
              onChange={setRegionFilter}
              options={[
                { value: 'ALL', label: 'All regions' },
                ...regions.map(([country, n]) => ({ value: country, label: `${country} (${n})` })),
                { value: 'NONE', label: 'Unknown' },
              ]}
          />
          <FilterSelect
              label="Status"
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: 'ALL', label: 'Any' },
                { value: 'ONLINE', label: 'Online now' },
                { value: 'OFFLINE', label: 'Offline' },
              ]}
          />
          <FilterSelect
              label="Activity"
              value={activityFilter}
              onChange={setActivityFilter}
              options={[
                { value: 'ALL', label: 'Any' },
                { value: 'ENGAGED', label: 'Has submitted' },
                { value: 'QUIET', label: 'Nothing yet' },
              ]}
            />
          {anyFilter ? (
            <button
                type="button"
              onClick={clearFilters}
              className="mb-0.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium border-theme text-muted transition hover:text-body"
            >
              Clear filters
            </button>
          ) : null}
        </div>
      </div>

      {error ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      {/* ----------------------------------------------------------- table */}
      <TableCard>
        <table className="w-full min-w-[50rem] table-fixed border-collapse text-sm">
          <colgroup>
            <col className="w-[24%]" />
            <col className="w-[13%]" />
            <col className="w-[16%]" />
            <col className="w-[11%]" />
            <col className="w-[10%]" />
            <col className="w-[8%]" />
            <col className="w-[18%]" />
          </colgroup>

          <thead className="surface-subtle">
            <tr className="border-b border-theme">
              <SortableHeader label="User" columnKey="name" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} />
              <SortableHeader label="Membership" columnKey="role" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} />
              <SortableHeader label="Region" columnKey="region" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} />
              <SortableHeader label="Status" columnKey="seen" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} />
              <SortableHeader label="Joined" columnKey="joined" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} align="right" />
              <SortableHeader label="Sent" columnKey="activity" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} align="right" />
              <PlainHeader label="Access" align="right" />
            </tr>
          </thead>

          <tbody className="divide-theme">
            {loading ? <EmptyRow colSpan={COLUMNS} message="Loading…" /> : null}
            {!loading && table.matched === 0 ? (
              <EmptyRow
                colSpan={COLUMNS}
                message={
                  table.query || anyFilter
                    ? 'No users match these criteria.'
                    : 'Nobody has registered yet.'
                }
              />
            ) : null}

            {table.rows.map((u) => (
              <tr key={u.id} className="align-middle transition-colors hover:bg-[var(--bg-subtle)]">
                <td className="px-4 py-3.5">
                  <div className="truncate font-medium text-body" title={u.fullName}>
                    {u.fullName}
                  </div>
                  <div className="truncate text-xs text-faint" title={u.email}>
                    {u.email}
                    {u.company ? ` · ${u.company}` : ''}
                  </div>
                </td>

                <td className="px-4 py-3.5">
                  {u.role === 'MANAGER' ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-grass-500/10 px-2.5 py-1 text-xs font-semibold text-grass-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-grass-500" aria-hidden="true" />
                      Manager
                    </span>
                  ) : (
                    <span className="chip">Member</span>
                  )}
                </td>

                <td className="px-4 py-3.5">
                  <div className="truncate text-muted" title={u.location ?? undefined}>
                    {u.location ?? <span className="text-faint">Unknown</span>}
                  </div>
                </td>

                <td className="px-4 py-3.5">
                  {u.isOnline ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-grass-600">
                      <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-grass-500 opacity-75" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-grass-500" />
                      </span>
                      Online
                    </span>
                  ) : (
                    <span className="text-xs text-faint">{since(u.lastSeenAt)}</span>
                  )}
                </td>

                <td className="px-4 py-3.5 text-right text-xs tabular-nums text-muted">{date(u.createdAt)}</td>

                <td className="px-4 py-3.5 text-right">
                  <span
                    className="inline-flex min-w-[1.75rem] justify-center rounded-md px-1.5 py-0.5 text-xs font-medium tabular-nums text-muted"
                    style={{ background: 'var(--bg-inset)' }}
                    title={`${u._count.orders} order(s), ${u._count.applications} application(s)`}
                  >
                    {u._count.orders + u._count.applications}
                  </span>
                </td>

                <td className="px-4 py-3.5 text-right">
                  <select
                    value={u.role}
                    disabled={busy}
                    aria-label={`Membership for ${u.email}`}
                    onWheel={(e) => e.currentTarget.blur()}
                    onChange={(e) => setRole(u, e.target.value as Role)}
                    className="input w-full py-1 text-xs"
                  >
                    <option value="USER">Member</option>
                    <option value="MANAGER">Manager</option>
                  </select>
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
          noun="user"
        />
      </TableCard>

      <p className="text-xs text-faint">
        Changing membership here is a manual override. The <code className="font-mono">ADMIN_EMAILS</code> allowlist is
        re-applied at each sign-in, so it wins on the user&apos;s next login.
      </p>
    </section>
  );
}
