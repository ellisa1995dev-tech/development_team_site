'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { apiFetch } from './api';
import { useAdminAuth } from './admin-auth';

export interface LiveUserStats {
  registeredTotal: number;
  registeredToday: number;
  onlineNow: number;
  signingUpNow: number;
  recentSignups: Array<{ id: string; fullName: string; city: string | null; country: string | null; createdAt: string }>;
  at: string;
}

type Status = 'connecting' | 'live' | 'error';

const POLL_MS = 3000;

/**
 * Keeps the registered-user counters current.
 *
 * This polls rather than holding a server-sent stream open: the API runs as
 * serverless functions, where a long-lived connection is billed for its whole
 * duration and killed at the function timeout. A 3s poll costs a trivial
 * query and behaves identically from the operator's point of view.
 *
 * Polling pauses while the tab is hidden so a backgrounded console stops
 * hitting the API entirely.
 */
export function useLiveUsers() {
  const { token } = useAdminAuth();
  const [data, setData] = useState<LiveUserStats | null>(null);
  const [status, setStatus] = useState<Status>('connecting');
  const inFlight = useRef(false);

  const load = useCallback(async () => {
    if (!token || inFlight.current) return;
    inFlight.current = true;
    try {
      const next = await apiFetch<LiveUserStats>('/admin/stats/users', { token });
      setData(next);
      setStatus('live');
    } catch {
      // Keep the last good snapshot on screen; the next tick may recover.
      setStatus('error');
    } finally {
      inFlight.current = false;
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;

    let timer: number | undefined;

    const start = () => {
      if (timer !== undefined) return;
      void load();
      timer = window.setInterval(load, POLL_MS);
    };

    const stop = () => {
      if (timer === undefined) return;
      window.clearInterval(timer);
      timer = undefined;
    };

    const onVisibility = () => (document.hidden ? stop() : start());

    start();
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [token, load]);

  return { data, status };
}
