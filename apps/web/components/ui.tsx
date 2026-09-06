import type { ReactNode } from 'react';

export function SectionHeading({
  eyebrow,
  title,
  lede,
  align = 'left',
}: {
  eyebrow?: string;
  title: string;
  lede?: string;
  align?: 'left' | 'center';
}) {
  return (
    <div className={align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}>
      {eyebrow ? (
        <p className="eyebrow">
          <span className="h-1.5 w-1.5 rounded-full bg-grass-500" aria-hidden="true" />
          {eyebrow}
        </p>
      ) : null}
      <h2 className="heading-2 mt-3.5">{title}</h2>
      {lede ? <p className="lede mt-5">{lede}</p> : null}
    </div>
  );
}

export function StatTile({
  value,
  label,
  accent = 'grass',
}: {
  value: string;
  label: string;
  accent?: 'grass' | 'sky';
}) {
  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-4 transition-all duration-500 ease-out-expo hover:-translate-y-1 hover:border-grass-200 hover:shadow-card sm:p-5">
      <div
        className={`text-2xl font-semibold tracking-tight sm:text-3xl ${
          accent === 'sky' ? 'text-sky-600' : 'text-grass-600'
        }`}
      >
        {value}
      </div>
      <div className="mt-1 text-xs font-medium leading-snug text-ink-500 sm:text-sm">{label}</div>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    ACTIVE: 'bg-grass-50 text-grass-700 ring-grass-200',
    COMPLETED: 'bg-ink-50 text-ink-600 ring-ink-200',
    PAUSED: 'bg-amber-50 text-amber-700 ring-amber-200',
    NEW: 'bg-sky-50 text-sky-700 ring-sky-200',
    REVIEWING: 'bg-amber-50 text-amber-700 ring-amber-200',
    QUOTED: 'bg-violet-50 text-violet-700 ring-violet-200',
    ACCEPTED: 'bg-grass-50 text-grass-700 ring-grass-200',
    DECLINED: 'bg-red-50 text-red-700 ring-red-200',
    ARCHIVED: 'bg-ink-50 text-ink-500 ring-ink-200',
    SCREENING: 'bg-amber-50 text-amber-700 ring-amber-200',
    INTERVIEW: 'bg-violet-50 text-violet-700 ring-violet-200',
    OFFER: 'bg-sky-50 text-sky-700 ring-sky-200',
    HIRED: 'bg-grass-50 text-grass-700 ring-grass-200',
    REJECTED: 'bg-red-50 text-red-700 ring-red-200',
  };
  const cls = map[status] ?? 'bg-ink-50 text-ink-600 ring-ink-200';
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[0.7rem] font-semibold capitalize tracking-wide ring-1 ring-inset ${cls}`}
    >
      {status.toLowerCase().replace('_', ' ')}
    </span>
  );
}

/** Page-top band used by every interior page, so headers feel consistent. */
export function PageHero({
  eyebrow,
  title,
  lede,
  children,
  tone = 'light',
}: {
  eyebrow: string;
  title: string;
  lede?: string;
  children?: ReactNode;
  tone?: 'light' | 'dark';
}) {
  if (tone === 'dark') {
    return (
      <section className="relative overflow-hidden bg-ink text-white">
        <div
          className="pointer-events-none absolute -right-[12%] -top-[28%] h-[44rem] w-[44rem] animate-aurora rounded-full blur-[110px]"
          style={{ background: 'radial-gradient(circle, rgba(0,165,236,0.8), rgba(0,165,236,0.25) 45%, transparent 70%)' }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -left-[15%] top-[10%] h-[38rem] w-[38rem] animate-aurora rounded-full blur-[110px] [animation-delay:-7s]"
          style={{ background: 'radial-gradient(circle, rgba(58,148,72,0.7), transparent 68%)' }}
          aria-hidden="true"
        />
        <div className="container-page relative py-20 sm:py-28">
          <p className="eyebrow animate-fade-up text-sky-400">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-400" aria-hidden="true" />
            {eyebrow}
          </p>
          <h1 className="heading-1 mt-5 max-w-3xl animate-fade-up text-white delay-75">{title}</h1>
          {lede ? <p className="lede mt-6 max-w-2xl animate-fade-up text-ink-200 delay-150">{lede}</p> : null}
          {children ? <div className="mt-10 animate-fade-up delay-225">{children}</div> : null}
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden border-b border-ink-100 bg-gradient-to-b from-ink-50 to-white">
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 animate-float rounded-full bg-grass-100/50 blur-3xl"
        aria-hidden="true"
      />
      <div className="container-page relative py-16 sm:py-24">
        <p className="eyebrow animate-fade-up">
          <span className="h-1.5 w-1.5 rounded-full bg-grass-500" aria-hidden="true" />
          {eyebrow}
        </p>
        <h1 className="heading-1 mt-5 max-w-3xl animate-fade-up delay-75">{title}</h1>
        {lede ? <p className="lede mt-6 max-w-2xl animate-fade-up delay-150">{lede}</p> : null}
        {children ? <div className="mt-10 animate-fade-up delay-225">{children}</div> : null}
      </div>
    </section>
  );
}

export function Prose({ children }: { children: ReactNode }) {
  return <div className="space-y-4 text-sm leading-relaxed text-ink-600 sm:text-base">{children}</div>;
}
