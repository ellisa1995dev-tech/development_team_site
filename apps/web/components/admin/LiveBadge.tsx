'use client';

import { useEffect, useState } from 'react';
import { getInFlight, getLastFetchAt, refreshAll, subscribeToFetches } from '@/lib/admin-live';

function ago(ts: number | null): string {
  if (ts === null) return 'not yet';
  const secs = Math.floor((Date.now() - ts) / 1000);
  if (secs < 5) return 'just now';
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

/**
 * Shows how fresh the console is and lets an operator force a refresh.
 *
 * The console polls on its own, so this exists to answer "am I looking at
 * current data?" — a question an auto-updating screen otherwise leaves
 * ambiguous, because nothing visibly happens when nothing has changed.
 */
export default function LiveBadge() {
  const [, force] = useState(0);
  const rerender = () => force((n) => n + 1);

  useEffect(() => subscribeToFetches(rerender), []);

  // The relative time has to keep counting up between fetches.
  useEffect(() => {
    const timer = window.setInterval(rerender, 5000);
    return () => window.clearInterval(timer);
  }, []);

  const busy = getInFlight() > 0;
  const last = getLastFetchAt();

  return (
    <button
      type="button"
      onClick={refreshAll}
      title="Refresh now"
      className="inline-flex items-center gap-2 rounded-lg px-2 py-1 text-xs text-faint transition hover:text-body"
    >
      <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
        {busy ? (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-grass-500 opacity-75" />
        ) : null}
        <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${busy ? 'bg-grass-500' : 'bg-grass-400'}`} />
      </span>
      <span className="hidden sm:inline">{busy ? 'Updating…' : `Updated ${ago(last)}`}</span>
      <span className="sm:hidden">Live</span>
    </button>
  );
}
