'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useUserAuth } from '@/lib/user-auth';
import Logo from './Logo';
import ThemePicker from './ThemePicker';

const NAV = [
  { href: '/services', label: 'Services' },
  { href: '/team', label: 'Team' },
  { href: '/order', label: 'Order a project' },
  { href: '/join', label: 'Join us' },
];

/**
 * Shown only to management accounts. Hiding it is a convenience, not the
 * control — /api/management/* refuses anyone without the role regardless of
 * what the navigation renders.
 */
const MANAGER_LINKS = [
  { href: '/management', label: 'Management' },
  { href: '/admin', label: 'Console' },
];

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const pathname = usePathname();
  const { ready, isRegistered, isManager, user, logout } = useUserAuth();

  // Close the drawer on navigation so a tap never leaves it hanging open.
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 8);

      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(y / max, 1) : 0);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-all duration-500 ease-out-expo ${
        scrolled ? 'shadow-[0_1px_20px_-8px_rgba(10,13,12,0.18)] backdrop-blur-xl' : ''
      }`}
      style={{
        // color-mix keeps the blur visible while still following the theme.
        background: scrolled ? 'color-mix(in srgb, var(--bg-page) 82%, transparent)' : 'var(--bg-page)',
        borderColor: scrolled ? 'var(--border)' : 'transparent',
      }}
    >
      {/* Reading-progress hairline. */}
      <span
        className="absolute inset-x-0 top-0 h-[2px] origin-left bg-gradient-to-r from-grass-500 to-sky-500 transition-transform duration-150 ease-out"
        style={{ transform: `scaleX(${progress})`, opacity: progress > 0.005 ? 1 : 0 }}
        aria-hidden="true"
      />

      <div className="container-page flex h-[4.25rem] items-center justify-between gap-4">
        <Link href="/" className="group flex items-center" aria-label="StackForge home">
          <Logo size={28} />
        </Link>

        <nav className="hidden items-center gap-0.5 md:flex" aria-label="Main">
          {(ready && isManager ? [...NAV, ...MANAGER_LINKS] : NAV).map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`link-underline rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-300 ${
                  active ? 'text-grass-700' : 'text-muted hover:text-body'
                }`}
              >
                {item.label}
                {active ? (
                  <span className="absolute inset-x-3 bottom-1 h-px scale-x-100 bg-grass-500" aria-hidden="true" />
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <ThemePicker />
          {ready && isRegistered ? (
            <>
              <Link
                href="/account"
                className="max-w-[9rem] animate-fade-in truncate rounded-lg surface-subtle px-2.5 py-1.5 text-xs font-medium text-muted transition hover:text-body"
                title={`${user?.email} — manage your account`}
              >
                {user?.fullName}
              </Link>
              <button type="button" onClick={logout} className="btn-outline px-3.5">
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors duration-300 hover:text-body"
              >
                Sign in
              </Link>
              <Link href="/register" className="btn-outline px-4">
                Register
              </Link>
            </>
          )}
          <Link href="/order" className="btn-primary">
            Start a project
          </Link>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemePicker />
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="grid h-11 w-11 place-items-center rounded-xl border text-body transition-all duration-300 hover:border-grass-300 hover:text-grass-700 active:scale-95 md:hidden border-theme"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          {/* Bars morph into a cross. */}
          <span className="relative block h-[14px] w-[18px]" aria-hidden="true">
            <span
              className={`absolute left-0 block h-[1.8px] w-full rounded bg-current transition-all duration-300 ease-spring ${
                open ? 'top-1/2 -translate-y-1/2 rotate-45' : 'top-0'
              }`}
            />
            <span
              className={`absolute left-0 top-1/2 block h-[1.8px] w-full -translate-y-1/2 rounded bg-current transition-all duration-200 ${
                open ? 'scale-x-0 opacity-0' : 'scale-x-100 opacity-100'
              }`}
            />
            <span
              className={`absolute left-0 block h-[1.8px] w-full rounded bg-current transition-all duration-300 ease-spring ${
                open ? 'bottom-1/2 translate-y-1/2 -rotate-45' : 'bottom-0'
              }`}
            />
          </span>
        </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <div
        id="mobile-nav"
        className={`overflow-hidden backdrop-blur-xl transition-all duration-500 ease-out-expo md:hidden border-theme ${
          open ? 'max-h-[32rem] border-t opacity-100' : 'max-h-0 border-t-0 opacity-0'
        }`}
        style={{ background: 'color-mix(in srgb, var(--bg-page) 95%, transparent)' }}
      >
        <nav className="container-page flex flex-col gap-1 py-3" aria-label="Mobile">
          {(ready && isManager ? [...NAV, ...MANAGER_LINKS] : NAV).map((item, i) => (
            <Link
              key={item.href}
              href={item.href}
              style={{ transitionDelay: open ? `${60 + i * 45}ms` : '0ms' }}
              className={`translate-y-0 rounded-xl px-3 py-3 text-base font-medium transition-all duration-500 ease-out-expo ${
                open ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'
              } ${pathname === item.href ? 'bg-grass-50 text-grass-700' : 'text-body hover:opacity-70'}`}
            >
              {item.label}
            </Link>
          ))}

          <div className="mt-2 border-t pt-3 border-theme">
            {ready && isRegistered ? (
              <>
                <Link href="/account" className="block rounded-xl px-3 py-2 text-sm text-muted hover:text-body">
                  Signed in as <span className="font-semibold text-body">{user?.fullName}</span>
                  <span className="mt-0.5 block text-xs text-faint">Manage your account</span>
                </Link>
                <button type="button" onClick={logout} className="btn-outline w-full">
                  Sign out
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2">
                <Link href="/register" className="btn-outline w-full">
                  Register
                </Link>
                <Link
                  href="/login"
                  className="rounded-xl px-3 py-3 text-center text-base font-medium text-body transition hover:opacity-70"
                >
                  Sign in
                </Link>
              </div>
            )}
          </div>

          <Link href="/order" className="btn-primary mt-2 w-full">
            Start a project
          </Link>
        </nav>
      </div>
    </header>
  );
}
