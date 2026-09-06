'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { API_URL } from '@/lib/api';

const SESSION_KEY = 'te_session_id';

/**
 * Fires one tracking beacon per page view.
 *
 * The session id lives in sessionStorage, so "unique visitors" means
 * "browser tabs/sessions" rather than identified people — no cookie, no
 * cross-site identifier, and the API stores only a salted hash of the IP.
 */
export default function VisitTracker() {
  const pathname = usePathname();
  const lastTracked = useRef<string | null>(null);

  useEffect(() => {
    // React 18 strict mode mounts twice in dev; do not double-count.
    if (lastTracked.current === pathname) return;
    lastTracked.current = pathname;

    let sessionId: string | undefined;
    try {
      sessionId = window.sessionStorage.getItem(SESSION_KEY) ?? undefined;
    } catch {
      /* storage blocked — the API will mint a session id instead */
    }

    const controller = new AbortController();

    fetch(`${API_URL}/api/visits/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: pathname,
        referrer: document.referrer || undefined,
        sessionId,
      }),
      signal: controller.signal,
      keepalive: true,
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { sessionId?: string } | null) => {
        if (!data?.sessionId) return;
        try {
          window.sessionStorage.setItem(SESSION_KEY, data.sessionId);
        } catch {
          /* ignore */
        }
      })
      .catch(() => {
        /* analytics must never surface an error to a visitor */
      });

    return () => controller.abort();
  }, [pathname]);

  return null;
}
