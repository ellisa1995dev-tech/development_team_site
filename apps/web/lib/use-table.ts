'use client';

import { useCallback, useMemo, useState } from 'react';

export type SortDir = 'asc' | 'desc';

interface Options<T> {
  /** Pulls the text a row should be searchable by. */
  searchable: (row: T) => Array<string | number | null | undefined>;
  /** Column key to sort on initially. */
  initialSort?: string;
  initialDir?: SortDir;
  /** Value used for sorting a given column. */
  sortValue?: (row: T, key: string) => string | number | null | undefined;
}

/**
 * Search + sort for the admin tables.
 *
 * Filtering happens client-side: these lists are small (a team, a project
 * board), so a round trip per keystroke would be slower and noisier than
 * filtering what we already hold. Swap in a server query if a list ever grows
 * past a few hundred rows.
 */
export function useTable<T>(rows: T[], { searchable, initialSort = '', initialDir = 'asc', sortValue }: Options<T>) {
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState(initialSort);
  const [sortDir, setSortDir] = useState<SortDir>(initialDir);

  const toggleSort = useCallback(
    (key: string) => {
      if (key === sortKey) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortKey(key);
        setSortDir('asc');
      }
    },
    [sortKey],
  );

  const result = useMemo(() => {
    const needle = query.trim().toLowerCase();

    const filtered = needle
      ? rows.filter((row) =>
          searchable(row)
            .filter((v) => v !== null && v !== undefined)
            .some((v) => String(v).toLowerCase().includes(needle)),
        )
      : rows.slice();

    if (!sortKey || !sortValue) return filtered;

    return filtered.sort((a, b) => {
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
  }, [rows, query, sortKey, sortDir, searchable, sortValue]);

  return { query, setQuery, sortKey, sortDir, toggleSort, rows: result, total: rows.length };
}
