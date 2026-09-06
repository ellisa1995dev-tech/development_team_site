import type { Metadata } from 'next';
import { Suspense } from 'react';
import RegisterForm from '@/components/RegisterForm';

export const metadata: Metadata = {
  title: 'Register',
  description: 'Create an account to order a project or apply to join the team.',
};

const PERKS = [
  'Order a project and track it with us',
  'Apply to join the team, or pitch an idea',
  'One account, no marketing email',
];

export default function RegisterPage() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-ink-50 to-white">
      <div
        className="pointer-events-none absolute -left-32 top-0 h-[30rem] w-[30rem] animate-float rounded-full bg-grass-100/60 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-32 bottom-0 h-[26rem] w-[26rem] animate-float rounded-full bg-sky-100/60 blur-3xl [animation-delay:-3s]"
        aria-hidden="true"
      />

      <div className="container-page relative grid min-h-[78vh] items-center gap-12 py-16 lg:grid-cols-2 lg:gap-20">
        <div className="animate-fade-up">
          <p className="eyebrow">
            <span className="h-1.5 w-1.5 rounded-full bg-grass-500" aria-hidden="true" />
            Create an account
          </p>
          <h1 className="heading-2 mt-4">One account, everything unlocked.</h1>
          <p className="lede mt-5 max-w-md">
            Registration is required before ordering a project or applying to join the team. It takes about thirty
            seconds.
          </p>

          <ul className="mt-8 space-y-3">
            {PERKS.map((perk, i) => (
              <li
                key={perk}
                className="flex animate-fade-up items-center gap-3 text-sm text-ink-600"
                style={{ animationDelay: `${150 + i * 90}ms` }}
              >
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-grass-500 text-white">
                  <svg width="11" height="11" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <path d="M5 10.5l3.5 3.5L15 6.5" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                {perk}
              </li>
            ))}
          </ul>
        </div>

        <div className="w-full animate-fade-up delay-150 lg:max-w-md lg:justify-self-end">
          <Suspense fallback={<div className="card"><div className="skeleton h-64 w-full" /></div>}>
            <RegisterForm />
          </Suspense>
        </div>
      </div>
    </section>
  );
}
