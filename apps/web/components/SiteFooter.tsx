import Link from 'next/link';
import { TEAM_FACTS } from '@/lib/content';
import Logo from './Logo';
import WhatsAppLink from './WhatsAppLink';

export default function SiteFooter() {
  return (
    <footer className="border-t border-ink-800 bg-ink text-ink-200">
      <div className="container-page py-12 sm:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Logo size={30} tone="light" />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-300">
              {TEAM_FACTS.headcount} senior engineers, {TEAM_FACTS.yearsTogether} years building together, and AI in
              production since {TEAM_FACTS.aiSince}. Rust, Next.js and NestJS.
            </p>

            <div className="mt-6">
              <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-400">Talk to us</h2>
              <div className="mt-3">
                <WhatsAppLink variant="footer" message="Hi StackForge - I found you through the site and would like to talk." />
              </div>
            </div>
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

            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-ink-800 pt-6 text-xs text-ink-400 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} StackForge. All rights reserved.</p>
          <p className="font-mono">Rust · Next.js · NestJS · PostgreSQL</p>
        </div>
      </div>
    </footer>
  );
}
