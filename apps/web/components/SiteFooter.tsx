import Link from 'next/link';
import { TEAM_FACTS } from '@/lib/content';

export default function SiteFooter() {
  return (
    <footer className="border-t border-ink-800 bg-ink text-ink-200">
      <div className="container-page py-12 sm:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-grass-500 to-sky-500 text-sm font-bold text-white">
                8
              </span>
              <span className="text-base font-bold tracking-tight text-white">
                Eight<span className="text-grass-400">Engineers</span>
              </span>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-300">
              {TEAM_FACTS.headcount} senior engineers, {TEAM_FACTS.yearsTogether} years building together, and AI in
              production since {TEAM_FACTS.aiSince}. Rust, Next.js and NestJS.
            </p>
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-400">Work with us</h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link href="/services" className="text-ink-200 transition hover:text-grass-400">
                  Services
                </Link>
              </li>
              <li>
                <Link href="/order" className="text-ink-200 transition hover:text-grass-400">
                  Order a project
                </Link>
              </li>
              <li>
                <Link href="/#work" className="text-ink-200 transition hover:text-grass-400">
                  Active projects
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-400">The team</h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link href="/team" className="text-ink-200 transition hover:text-grass-400">
                  Who we are
                </Link>
              </li>
              <li>
                <Link href="/join" className="text-ink-200 transition hover:text-grass-400">
                  Open roles
                </Link>
              </li>
              <li>
                <Link href="/join#idea" className="text-ink-200 transition hover:text-grass-400">
                  Pitch an idea
                </Link>
              </li>
              <li>
                <Link href="/admin" className="text-ink-400 transition hover:text-sky-400">
                  Admin console
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-ink-800 pt-6 text-xs text-ink-400 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} EightEngineers. All rights reserved.</p>
          <p className="font-mono">Rust · Next.js · NestJS · PostgreSQL</p>
        </div>
      </div>
    </footer>
  );
}
