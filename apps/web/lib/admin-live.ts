'use client';

/**
 * A tiny event bus shared by every admin data hook.
 *
 * Two jobs:
 *   - hooks announce a successful fetch, so one badge in the console chrome
 *     can show how fresh the screen is without threading props everywhere;
 *   - a "refresh now" command can be broadcast, so one button refetches every
 *     panel on the page at once.
 *
 * Deliberately not React context: the hooks that publish and the badge that
 * subscribes sit in unrelated parts of the tree.
 */

type Listener = () => void;

const fetchListeners = new Set<Listener>();
const refreshListeners = new Set<Listener>();

let lastFetchAt: number | null = null;
let inFlight = 0;

/** Called by useAdminData whenever a request completes successfully. */
export function announceFetch() {
  lastFetchAt = Date.now();
  fetchListeners.forEach((fn) => fn());
}

export function announceStart() {
  inFlight += 1;
  fetchListeners.forEach((fn) => fn());
}

export function announceEnd() {
  inFlight = Math.max(0, inFlight - 1);
  fetchListeners.forEach((fn) => fn());
}

export function subscribeToFetches(fn: Listener): () => void {
  fetchListeners.add(fn);
  return () => fetchListeners.delete(fn);
}

/** Broadcast: every mounted admin hook refetches. */
export function refreshAll() {
  refreshListeners.forEach((fn) => fn());
}

export function subscribeToRefresh(fn: Listener): () => void {
  refreshListeners.add(fn);
  return () => refreshListeners.delete(fn);
}

export function getLastFetchAt(): number | null {
  return lastFetchAt;
}

export function getInFlight(): number {
  return inFlight;
}
