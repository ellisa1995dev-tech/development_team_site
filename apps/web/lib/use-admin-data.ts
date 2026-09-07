'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { apiFetch } from './api';
import { useUserAuth } from './user-auth';
import { announceEnd, announceFetch, announceStart, subscribeToRefresh } from './admin-live';

interface Result<T> {
  data: T | null;
  error: string | null;
  /** True only for the first load, when there is nothing to show yet. */
  loading: boolean;
  /** True for background refreshes, when stale data is still on screen. */
  refreshing: boolean;
  reload: () => void;
}

interface Options {
  /** Poll interval in ms. Pass 0 to fetch once and stop. */
  refreshMs?: number;
}

/** Admin lists refresh on this cadence unless a caller overrides it. */
const DEFAULT_REFRESH_MS = 10_000;

/**
 * Fetches an authenticated console endpoint and keeps it current.
 *
 * The console is an operations screen — orders arrive, people register, a
 * colleague changes a status — so it polls rather than waiting for a manual
 * reload. Three things make that unobtrusive:
 *
 *   - the previous data stays on screen while a refresh is in flight, so
 *     nothing flashes back to a skeleton every few seconds;
 *   - polling stops while the tab is hidden, and fires once immediately on
 *     return, so a backgrounded console costs nothing;
 *   - refocusing the window revalidates, which is when an operator is most
 *     likely to be looking at stale numbers.
 */
export function useAdminData<T>(path: string | null, { refreshMs = DEFAULT_REFRESH_MS }: Options = {}): Result<T> {
  const { token } = useUserAuth();
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Refs so the polling effect never needs to re-run when these change.
  const hasData = useRef(false);
  const inFlight = useRef(false);

  const fetchNow = useCallback(async () => {
    if (!token || !path || inFlight.current) return;

    inFlight.current = true;
    if (hasData.current) setRefreshing(true);
    announceStart();

    try {
      const next = await apiFetch<T>(path, { token });
      setData(next);
      setError(null);
      hasData.current = true;
      announceFetch();
    } catch (err) {
      // A failed background refresh keeps the last good data on screen; only
      // a failed first load is worth showing as an error state.
      if (!hasData.current) setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      inFlight.current = false;
      setLoading(false);
      setRefreshing(false);
      announceEnd();
    }
  }, [path, token]);

  // Reset when the endpoint changes (e.g. a status filter in the query).
  useEffect(() => {
    hasData.current = false;
    setLoading(true);
  }, [path]);

  useEffect(() => {
    if (!token || !path) return;

    let timer: number | undefined;

    const start = () => {
      if (timer !== undefined || refreshMs <= 0) return;
      timer = window.setInterval(fetchNow, refreshMs);
    };
    const stop = () => {
      if (timer === undefined) return;
      window.clearInterval(timer);
      timer = undefined;
    };

    const onVisibility = () => {
      if (document.hidden) {
        stop();
      } else {
        void fetchNow();
        start();
      }
    };

    void fetchNow();
    start();

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', fetchNow);
    const unsubscribe = subscribeToRefresh(fetchNow);

    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', fetchNow);
      unsubscribe();
    };
  }, [fetchNow, token, path, refreshMs]);

  return { data, error, loading, refreshing, reload: fetchNow };
}

/** Mutations (POST/PATCH/DELETE) from the console tables. */
export function useAdminMutation() {
  const { token } = useUserAuth();
  const [busy, setBusy] = useState(false);

  const mutate = useCallback(
    async <T,>(path: string, method: 'POST' | 'PATCH' | 'DELETE', body?: unknown): Promise<T> => {
      setBusy(true);
      try {
        return await apiFetch<T>(path, {
          method,
          token: token ?? undefined,
          body: body ? JSON.stringify(body) : undefined,
        });
      } finally {
        setBusy(false);
      }
    },
    [token],
  );

  return { mutate, busy };
}
