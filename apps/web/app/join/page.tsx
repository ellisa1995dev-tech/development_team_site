import type { Metadata } from 'next';
import JoinForm from '@/components/JoinForm';
import { OPEN_ROLES, TEAM_FACTS } from '@/lib/content';
import { SectionHeading } from '@/components/ui';
import Reveal from '@/components/Reveal';

export const metadata: Metadata = {
  title: 'Join the team',
  description:
    'We are expanding: senior engineers with 7+ years in Rust, Next.js or NestJS — and people with an innovative idea that needs a team behind it.',
};

export default function JoinPage() {
  return (
    <>
      {/* -------------------------------------------------- recruiting hero */}
      <section className="relative overflow-hidden bg-ink text-white">
        <div
          className="pointer-events-none absolute -right-1/4 -top-1/3 h-[46rem] w-[46rem] animate-aurora rounded-full blur-[110px]"
          style={{ background: 'radial-gradient(circle, rgba(0,165,236,0.85), rgba(0,165,236,0.25) 45%, transparent 70%)' }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -left-1/4 top-1/4 h-[40rem] w-[40rem] animate-aurora rounded-full blur-[110px] [animation-delay:-8s]"
          style={{ background: 'radial-gradient(circle, rgba(58,148,72,0.7), transparent 68%)' }}
          aria-hidden="true"
        />
        <div className="container-page relative py-16 sm:py-24">
          <p className="eyebrow animate-fade-up text-sky-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-sky-400" aria-hidden="true" />
            Recruiting now
          </p>
          <h1 className="heading-1 mt-5 max-w-3xl animate-fade-up text-white delay-75">
            We are looking for people with <span className="text-sky-400">innovative ideas</span> — and engineers to
            build them.
          </h1>
          <p className="lede mt-7 max-w-2xl animate-fade-up text-ink-200 delay-150">
            {TEAM_FACTS.headcount} of us today, and we are expanding. Two doors in: apply to an open role if you have
            seven or more years of depth, or pitch an idea you want a senior team to take seriously. Both go to the same
            place, and the CTO reads every one.
          </p>

          <div className="mt-10 flex animate-fade-up flex-col gap-3 delay-225 sm:flex-row">
            <a href="#roles" className="btn-primary w-full sm:w-auto">
              Open roles
            </a>
            <a href="#apply" className="btn-ghost-light w-full sm:w-auto">
              Go to the form
            </a>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------- idea call */}
      <section className="section">
        <div className="container-page">
          <div className="rounded-3xl border border-sky-200 bg-gradient-to-br from-sky-50 to-grass-50 p-6 sm:p-10 lg:p-14">
            <div className="max-w-3xl">
              <p className="eyebrow text-sky-700">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-500" aria-hidden="true" />
                Idea partnerships
              </p>
              <h2 className="heading-2 mt-3">Have an idea but no team? That is the gap we want to close.</h2>
              <p className="lede mt-4">
                Some of the best work we have done started as somebody&apos;s unfunded idea. If you are carrying one —
                a product, a tool, a way of doing something that does not exist yet — pitch it. We prototype the ones
                that convince us, and we do it with you rather than around you.
              </p>

              <ul className="mt-8 grid gap-3 sm:grid-cols-3">
                {[
                  { title: 'You keep the idea', body: 'Terms are agreed up front, in writing, before any code exists.' },
                  { title: 'We bring the engineering', body: 'Rust, Next.js, NestJS and eight people who have shipped together for six years.' },
                  { title: 'Fast, honest read', body: 'A real answer within a week — including the reasons if it is a no.' },
                ].map((item) => (
                  <li key={item.title} className="rounded-2xl border border-white bg-white/70 p-4 backdrop-blur-sm">
                    <h3 className="text-sm font-semibold text-ink">{item.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-ink-500">{item.body}</p>
                  </li>
                ))}
              </ul>

              <a href="#idea" className="btn-sky mt-8 w-full sm:w-auto">
                Pitch your idea
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------- open roles */}
      <section id="roles" className="section surface-subtle pt-0 sm:pt-0">
        <div className="container-page pt-16 sm:pt-20">
          <SectionHeading
            eyebrow="Open roles"
            title="Four seats we are actively filling"
            lede="Every role is senior. Seven years is the floor, not the target — we would rather leave a seat empty than lower it."
          />

          <div className="mt-10 grid gap-4 sm:grid-cols-2 sm:gap-5">
            {OPEN_ROLES.map((role, i) => (
              <Reveal key={role.title} delay={(i % 2) * 90}>
              <article className="card card-hover card-glow flex h-full flex-col">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="heading-3">{role.title}</h3>
                  <span className="chip-grass shrink-0">{role.level}</span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-ink-500">{role.summary}</p>
                <ul className="mt-4 flex-1 space-y-2">
                  {role.musts.map((must) => (
                    <li key={must} className="flex gap-2.5 text-sm text-ink-600">
                      <span className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full bg-grass-500" aria-hidden="true" />
                      {must}
                    </li>
                  ))}
                </ul>
                <a href="#apply" className="btn-outline mt-5 w-full">
                  Apply for this role
                </a>
              </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ form */}
      <section id="apply" className="section">
        <div className="container-page grid gap-8 lg:grid-cols-3 lg:gap-12">
          <div className="lg:col-span-2">
            <SectionHeading eyebrow="Application" title="One form for both routes" />
            <div className="mt-8">
              <JoinForm />
            </div>
          </div>

          <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            <div className="card">
              <h2 className="heading-3">How we hire</h2>
              <ol className="mt-4 space-y-3">
                {[
                  'The CTO reads your application.',
                  'A 45-minute conversation about systems you have built.',
                  'A paid work session on a real problem — no take-home puzzles.',
                  'Meet the whole team, then a decision within a week.',
                ].map((step, i) => (
                  <li key={step} className="flex gap-3 text-sm text-ink-600">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-sky-50 text-xs font-bold text-sky-700">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="card">
              <h2 className="heading-3">What we look for</h2>
              <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-ink-600">
                <li>Depth in one thing, curiosity about the rest.</li>
                <li>Opinions you can defend and change.</li>
                <li>Care about the people who use what you build.</li>
                <li>A habit of writing things down.</li>
              </ul>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
