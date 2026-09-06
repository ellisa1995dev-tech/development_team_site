'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from './api';
import { useAdminAuth } from './admin-auth';

interface Result<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  reload: () => void;
}

/** Small fetch-on-mount hook for authenticated console endpoints. */
export function useAdminData<T>(path: string | null): Result<T> {
  const { token } = useAdminAuth();
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    if (!token || !path) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    apiFetch<T>(path, { token })
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Request failed');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [path, token, nonce]);

  return { data, error, loading, reload };
}

/** Mutations (PATCH/DELETE) from the console tables. */
export function useAdminMutation() {
  const { token } = useAdminAuth();
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
