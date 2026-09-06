'use client';

import { useState } from 'react';
import { useAdminData, useAdminMutation } from '@/lib/use-admin-data';
import type { ProjectOrder, OrderStatus } from '@/lib/types';
import { StatusBadge } from '@/components/ui';
import AttachmentList from '@/components/admin/AttachmentList';

const STATUSES: OrderStatus[] = ['NEW', 'REVIEWING', 'QUOTED', 'ACCEPTED', 'DECLINED', 'ARCHIVED'];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function AdminOrdersPage() {
  const [filter, setFilter] = useState<OrderStatus | 'ALL'>('ALL');
  const [expanded, setExpanded] = useState<string | null>(null);
  const { data, loading, error, reload } = useAdminData<ProjectOrder[]>(
    filter === 'ALL' ? '/admin/orders' : `/admin/orders?status=${filter}`,
  );
  const { mutate, busy } = useAdminMutation();

  async function setStatus(id: string, status: OrderStatus) {
    await mutate(`/admin/orders/${id}`, 'PATCH', { status });
    reload();
  }

  const orders = data ?? [];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="heading-2">Ordered tasks</h1>
        <p className="mt-1 text-sm text-ink-500">Project briefs submitted through the public order form.</p>
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
                filter === s ? 'bg-grass-500 text-white' : 'text-ink-600 hover:bg-ink-50'
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
      {!loading && orders.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-ink-200 px-5 py-10 text-center text-sm text-ink-400">
          No orders in this view.
        </p>
      ) : null}

      <div className="space-y-3">
        {orders.map((order) => {
          const open = expanded === order.id;
          return (
            <article key={order.id} className="rounded-2xl border border-ink-100 bg-white">
              <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between">
                <button
                  type="button"
                  onClick={() => setExpanded(open ? null : order.id)}
                  aria-expanded={open}
                  className="min-w-0 flex-1 text-left"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold">{order.companyName || order.contactName}</h2>
                    <StatusBadge status={order.status} />
                    {order.attachments?.length ? (
                      <span className="chip-sky">
                        {order.attachments.length} document{order.attachments.length > 1 ? 's' : ''}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-ink-500">
                    {order.projectType} · {order.budgetRange} · {order.timeline}
                  </p>
                  <p className="mt-1 text-xs text-ink-400">
                    {order.contactName} · {order.email} · {formatDate(order.createdAt)}
                  </p>
                </button>

                <label className="shrink-0 text-xs font-medium text-ink-500">
                  <span className="mb-1 block">Status</span>
                  <select
                    className="input py-2 text-sm"
                    value={order.status}
                    disabled={busy}
                    onChange={(e) => setStatus(order.id, e.target.value as OrderStatus)}
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
                <div className="border-t border-ink-100 px-5 py-4">
                  {order.stack.length ? (
                    <ul className="mb-3 flex flex-wrap gap-1.5">
                      {order.stack.map((tech) => (
                        <li key={tech} className="chip">
                          {tech}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted">{order.description}</p>
                  {order.phone ? <p className="mt-3 text-xs text-faint">Phone: {order.phone}</p> : null}

                  <div className="mt-4 border-t pt-4 border-theme">
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-faint">
                      Requirements document
                    </h3>
                    <AttachmentList orderId={order.id} attachments={order.attachments ?? []} />
                  </div>
                  <a href={`mailto:${order.email}`} className="btn-outline mt-4">
                    Reply by email
                  </a>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </div>
  );
}
