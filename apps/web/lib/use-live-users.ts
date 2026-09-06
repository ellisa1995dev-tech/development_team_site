'use client';

import { useEffect, useRef, useState } from 'react';
import { API_URL } from './api';
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

/**
 * Subscribes to the server-sent stream of registered-user counters.
 *
 * EventSource cannot set an Authorization header, so the admin token goes in
 * the query string — the AdminGuard accepts it there for this route only.
 */
export function useLiveUsers() {
  const { token } = useAdminAuth();
  const [data, setData] = useState<LiveUserStats | null>(null);
  const [status, setStatus] = useState<Status>('connecting');
  const sourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!token) return;

    setStatus('connecting');
    const url = `${API_URL}/api/admin/stats/users/live?token=${encodeURIComponent(token)}`;
    const source = new EventSource(url);
    sourceRef.current = source;

    source.onmessage = (event) => {
      try {
        setData(JSON.parse(event.data) as LiveUserStats);
        setStatus('live');
      } catch {
        /* malformed frame — keep the last good snapshot */
      }
    };

    // EventSource reconnects on its own; surface the gap in the meantime.
    source.onerror = () => setStatus('error');

    return () => {
      source.close();
      sourceRef.current = null;
    };
  }, [token]);

  return { data, status };
}
