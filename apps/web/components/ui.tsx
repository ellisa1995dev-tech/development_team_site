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
      <h2 className="heading-2 mt-3">{title}</h2>
      {lede ? <p className="lede mt-4">{lede}</p> : null}
    </div>
  );
}

export function StatTile({ value, label, accent = 'grass' }: { value: string; label: string; accent?: 'grass' | 'sky' }) {
  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-4 sm:p-5">
      <div className={`text-2xl font-bold tracking-tight sm:text-3xl ${accent === 'sky' ? 'text-sky-600' : 'text-grass-600'}`}>
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
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${cls}`}>
      {status.toLowerCase().replace('_', ' ')}
    </span>
  );
}

export function Prose({ children }: { children: ReactNode }) {
  return <div className="space-y-4 text-sm leading-relaxed text-ink-600 sm:text-base">{children}</div>;
}
