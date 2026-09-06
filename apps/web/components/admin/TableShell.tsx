'use client';

import type { ReactNode } from 'react';
import type { SortDir } from '@/lib/use-table';

export function SearchInput({
  value,
  onChange,
  placeholder,
  resultCount,
  total,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  resultCount: number;
  total: number;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" aria-hidden="true">
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
            <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.6" />
            <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </span>
        <input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="input pl-9"
        />
      </div>
      {value ? (
        <p className="text-xs text-faint" role="status">
          {resultCount} of {total} match “{value}”
        </p>
      ) : null}
    </div>
  );
}

export function SortableHeader({
  label,
  columnKey,
  sortKey,
  sortDir,
  onSort,
  align = 'left',
  className = '',
}: {
  label: string;
  columnKey: string;
  sortKey: string;
  sortDir: SortDir;
  onSort: (key: string) => void;
  align?: 'left' | 'right' | 'center';
  className?: string;
}) {
  const active = sortKey === columnKey;
  const alignCls = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';

  return (
    <th scope="col" className={`px-4 py-3 ${alignCls} ${className}`} aria-sort={active ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button
        type="button"
        onClick={() => onSort(columnKey)}
        className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted transition hover:text-body"
      >
        {label}
        <span className={`transition-opacity ${active ? 'opacity-100' : 'opacity-25'}`} aria-hidden="true">
          {active && sortDir === 'desc' ? '↓' : '↑'}
        </span>
      </button>
    </th>
  );
}

export function PlainHeader({ label, align = 'left' }: { label: string; align?: 'left' | 'right' | 'center' }) {
  const alignCls = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';
  return (
    <th scope="col" className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted ${alignCls}`}>
      {label}
    </th>
  );
}

/** Card wrapper with a horizontally scrollable table inside. */
export function TableCard({ children }: { children: ReactNode }) {
  return (
    <div className="surface overflow-hidden rounded-2xl">
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

export function EmptyRow({ colSpan, message }: { colSpan: number; message: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-10 text-center text-sm text-faint">
        {message}
      </td>
    </tr>
  );
}
