'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

export type SortDir = 'asc' | 'desc';

/** The two page sizes the console offers. */
export const PAGE_SIZES = [5, 8] as const;
export type PageSize = (typeof PAGE_SIZES)[number];

const PAGE_SIZE_KEY = 'te_page_size';

interface Options<T> {
  /** Pulls the text a row should be searchable by. */
  searchable: (row: T) => Array<string | number | null | undefined>;
  /** Column key to sort on initially. */
  initialSort?: string;
  initialDir?: SortDir;
  /** Value used for sorting a given column. */
  sortValue?: (row: T, key: string) => string | number | null | undefined;
  /** Extra predicates (dropdown filters) applied before the text search. */
  filters?: Array<(row: T) => boolean>;
}

function readStoredSize(): PageSize {
  try {
    const raw = Number(window.localStorage.getItem(PAGE_SIZE_KEY));
    return (PAGE_SIZES as readonly number[]).includes(raw) ? (raw as PageSize) : 5;
  } catch {
    return 5;
  }
}

/**
 * Search, sort and paginate for the console tables.
 *
 * All three happen client-side: these lists are small (a team, a project
 * board, the people who have registered), so a round trip per keystroke would
 * be slower and noisier than working on what we already hold. Swap in server
 * queries if a list ever grows past a few hundred rows.
 */
export function useTable<T>(
  rows: T[],
  { searchable, initialSort = '', initialDir = 'asc', sortValue, filters = [] }: Options<T>,
) {
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState(initialSort);
  const [sortDir, setSortDir] = useState<SortDir>(initialDir);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState<PageSize>(5);

  // The chosen page size follows the operator between pages and sessions.
  useEffect(() => setPageSizeState(readStoredSize()), []);

  const setPageSize = useCallback((size: PageSize) => {
    setPageSizeState(size);
    setPage(1);
    try {
      window.localStorage.setItem(PAGE_SIZE_KEY, String(size));
    } catch {
      /* storage blocked — the choice just won't persist */
    }
  }, []);

  const toggleSort = useCallback(
    (key: string) => {
      if (key === sortKey) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortKey(key);
        setSortDir('asc');
      }
      setPage(1);
    },
    [sortKey],
  );

  const search = useCallback((value: string) => {
    setQuery(value);
    // Narrowing the results while sitting on page 4 would show an empty table.
    setPage(1);
  }, []);

  const processed = useMemo(() => {
    const needle = query.trim().toLowerCase();

    let out = rows.filter((row) => filters.every((f) => f(row)));

    if (needle) {
      out = out.filter((row) =>
        searchable(row)
          .filter((v) => v !== null && v !== undefined)
          .some((v) => String(v).toLowerCase().includes(needle)),
      );
    }

    if (!sortKey || !sortValue) return out;

    return out.slice().sort((a, b) => {
      const av = sortValue(a, sortKey);
      const bv = sortValue(b, sortKey);

      // Empty values sink to the bottom regardless of direction.
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;

      const cmp =
        typeof av === 'number' && typeof bv === 'number'
          ? av - bv
          : String(av).localeCompare(String(bv), undefined, { sensitivity: 'base' });

      return sortDir === 'asc' ? cmp : -cmp;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, query, sortKey, sortDir, searchable, sortValue, ...filters]);

  const pageCount = Math.max(1, Math.ceil(processed.length / pageSize));

  // Deleting the last row on the final page would otherwise strand us there.
  const safePage = Math.min(page, pageCount);
  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage]);

  const start = (safePage - 1) * pageSize;
  const paged = processed.slice(start, start + pageSize);

  return {
    query,
    setQuery: search,
    sortKey,
    sortDir,
    toggleSort,

    /** The rows to render — the current page only. */
    rows: paged,
    /** Everything matching the search and filters, across all pages. */
    matched: processed.length,
    /** The unfiltered input length. */
    total: rows.length,

    page: safePage,
    pageCount,
    pageSize,
    setPage,
    setPageSize,
    firstShown: processed.length === 0 ? 0 : start + 1,
    lastShown: Math.min(start + pageSize, processed.length),
  };
}

export type TableController<T> = ReturnType<typeof useTable<T>>;
