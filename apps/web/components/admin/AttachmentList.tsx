'use client';

import { useState } from 'react';
import { API_URL } from '@/lib/api';
import { useAdminAuth } from '@/lib/admin-auth';
import { useToast } from '@/components/Toast';
import type { OrderAttachment } from '@/lib/types';

/** Formats a browser can render in a tab rather than downloading. */
const INLINE_VIEWABLE = new Set(['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'text/plain']);

function prettySize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function iconFor(mime: string): string {
  if (mime === 'application/pdf') return 'PDF';
  if (mime.startsWith('image/')) return 'IMG';
  if (mime.includes('word') || mime.includes('opendocument.text')) return 'DOC';
  if (mime.includes('sheet') || mime.includes('excel') || mime === 'text/csv') return 'XLS';
  return 'TXT';
}

/**
 * Attachments are behind the admin bearer token, so a plain <a href> cannot
 * fetch them — the browser would send no Authorization header. Instead we
 * fetch with the token, wrap the bytes in a blob URL, and either open it in a
 * tab or trigger a download. The URL is revoked once the browser has taken it.
 */
export default function AttachmentList({ orderId, attachments }: { orderId: string; attachments: OrderAttachment[] }) {
  const { token } = useAdminAuth();
  const toast = useToast();
  const [busyId, setBusyId] = useState<string | null>(null);

  if (!attachments.length) {
    return <p className="text-xs text-faint">No document attached.</p>;
  }

  async function open(file: OrderAttachment, mode: 'view' | 'download') {
    if (!token) return;
    setBusyId(file.id);
    try {
      const res = await fetch(
        `${API_URL}/api/admin/orders/${orderId}/attachments/${file.id}?disposition=${mode === 'view' ? 'inline' : 'attachment'}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!res.ok) throw new Error(`Server returned ${res.status}`);

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      if (mode === 'view') {
        const win = window.open(url, '_blank', 'noopener,noreferrer');
        if (!win) toast.warning('Pop-up blocked', 'Allow pop-ups for this site, or use Download instead.');
      } else {
        const a = window.document.createElement('a');
        a.href = url;
        a.download = file.filename;
        window.document.body.appendChild(a);
        a.click();
        a.remove();
      }

      // Give the browser a moment to consume the URL before releasing it.
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      toast.error('Could not open the document', err instanceof Error ? err.message : undefined);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <ul className="space-y-2">
      {attachments.map((file) => {
        const viewable = INLINE_VIEWABLE.has(file.mimeType);
        const busy = busyId === file.id;

        return (
          <li
            key={file.id}
            className="flex flex-wrap items-center gap-3 rounded-xl border p-3 border-theme"
            style={{ background: 'var(--bg-subtle)' }}
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-grass-500 text-[0.6rem] font-bold text-white">
              {iconFor(file.mimeType)}
            </span>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-body">{file.filename}</p>
              <p className="text-xs text-faint">
                {prettySize(file.sizeBytes)} · uploaded{' '}
                {new Date(file.uploadedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>

            <div className="flex shrink-0 gap-1.5">
              {viewable ? (
                <button
                  type="button"
                  onClick={() => open(file, 'view')}
                  disabled={busy}
                  className="rounded-lg border px-2.5 py-1.5 text-xs font-medium border-theme text-muted transition hover:text-body disabled:opacity-50"
                >
                  {busy ? '…' : 'View'}
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => open(file, 'download')}
                disabled={busy}
                className="rounded-lg bg-grass-500 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-grass-600 disabled:opacity-50"
              >
                {busy ? '…' : 'Download'}
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
