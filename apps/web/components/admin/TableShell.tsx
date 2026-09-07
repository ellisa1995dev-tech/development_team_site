'use client';

import type { ReactNode } from 'react';
import { PAGE_SIZES, type SortDir, type PageSize } from '@/lib/use-table';

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

/** A labelled dropdown used for the column filters above a table. */
export function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[0.68rem] font-semibold uppercase tracking-wide text-faint">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onWheel={(e) => e.currentTarget.blur()}
        className="input min-w-[8.5rem] py-1.5 text-sm"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

interface PaginationProps {
  page: number;
  pageCount: number;
  pageSize: PageSize;
  firstShown: number;
  lastShown: number;
  matched: number;
  onPage: (page: number) => void;
  onPageSize: (size: PageSize) => void;
  /** Noun for the count line, e.g. "member". */
  noun?: string;
}

/**
 * Footer for a paginated table.
 *
 * Page numbers are windowed so a long list never produces a row of buttons
 * wider than the table itself.
 */
export function Pagination({
  page,
  pageCount,
  pageSize,
  firstShown,
  lastShown,
  matched,
  onPage,
  onPageSize,
  noun = 'row',
}: PaginationProps) {
  // How many page numbers to show either side of the current one.
  const RADIUS = 2;
  const pages: number[] = [];
  for (let i = Math.max(1, page - RADIUS); i <= Math.min(pageCount, page + RADIUS); i++) {
    pages.push(i);
  }

  return (
    <div className="flex flex-col gap-3 border-t px-4 py-3 border-theme sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-faint" role="status">
        {matched === 0
          ? `No ${noun}s`
          : `${firstShown}–${lastShown} of ${matched} ${noun}${matched === 1 ? '' : 's'}`}
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-faint">Rows</span>
          <div className="inline-flex rounded-lg border p-0.5 border-theme" role="group" aria-label="Rows per page">
            {PAGE_SIZES.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => onPageSize(size)}
                aria-pressed={pageSize === size}
                className={`min-w-[1.75rem] rounded-md px-2 py-1 text-xs font-medium transition ${
                  pageSize === size ? 'bg-grass-500 text-white' : 'text-muted hover:text-body'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        <nav className="flex items-center gap-1" aria-label="Pagination">
          <button
            type="button"
            onClick={() => onPage(page - 1)}
            disabled={page <= 1}
            aria-label="Previous page"
            className="grid h-7 w-7 place-items-center rounded-md border text-muted transition border-theme hover:text-body disabled:opacity-35"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M7.5 2L4 6l3.5 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {pages[0] > 1 ? <span className="px-1 text-xs text-faint">…</span> : null}

          {pages.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onPage(p)}
              aria-current={p === page ? 'page' : undefined}
              className={`h-7 min-w-[1.75rem] rounded-md px-1.5 text-xs font-medium transition ${
                p === page ? 'bg-grass-500 text-white' : 'text-muted hover:text-body'
              }`}
            >
              {p}
            </button>
          ))}

          {pages[pages.length - 1] < pageCount ? <span className="px-1 text-xs text-faint">…</span> : null}

          <button
            type="button"
            onClick={() => onPage(page + 1)}
            disabled={page >= pageCount}
            aria-label="Next page"
            className="grid h-7 w-7 place-items-center rounded-md border text-muted transition border-theme hover:text-body disabled:opacity-35"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M4.5 2L8 6l-3.5 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </nav>
      </div>
    </div>
  );
}
