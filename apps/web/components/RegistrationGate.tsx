'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUserAuth } from '@/lib/user-auth';

/**
 * Shown above a gated form. The submit handler still calls
 * `requireRegistration`, which raises the "Please register." alert — this
 * banner just makes the requirement visible before the visitor gets there.
 */
export default function RegistrationGate({ action }: { action: string }) {
  const { ready, isRegistered, user } = useUserAuth();
  const pathname = usePathname();
  const next = encodeURIComponent(pathname);

  if (!ready) return null;

  if (isRegistered) {
    return (
      <div className="flex items-center gap-2.5 rounded-xl border border-grass-200 bg-grass-50 px-4 py-3">
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-grass-500 text-white" aria-hidden="true">
          <svg width="13" height="13" viewBox="0 0 22 22" fill="none">
            <path d="M5 11.5l4 4 8-9" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <p className="text-sm text-ink-700">
          Signed in as <span className="font-semibold">{user?.fullName}</span>.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4" role="status">
      <h3 className="text-sm font-semibold text-amber-900">Registration required</h3>
      <p className="mt-1 text-sm leading-relaxed text-amber-800">
        You need a registered account before {action}. Create one — it takes a moment.
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <Link href={`/register?next=${next}`} className="btn-primary w-full sm:w-auto">
          Register
        </Link>
        <Link href={`/login?next=${next}`} className="btn-outline w-full sm:w-auto">
          Sign in
        </Link>
      </div>
    </div>
  );
}
