import type { Metadata } from 'next';
import Link from 'next/link';
import { SERVICES, ENGAGEMENT_MODELS, TEAM_FACTS } from '@/lib/content';
import { SectionHeading } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Services',
  description:
    'AI product engineering, high-performance Rust and NestJS backends, Next.js product interfaces, and Kubernetes platform work.',
};

const PROCESS = [
  {
    step: '01',
    title: 'Scoping call',
    body: 'One hour with the CTO and the lead who would run the work. We push on constraints and failure modes rather than features.',
  },
  {
    step: '02',
    title: 'Written proposal',
    body: 'Architecture sketch, milestones, team composition and a fixed price per phase. Usually within five working days.',
  },
  {
    step: '03',
    title: 'Build in two-week increments',
    body: 'Working software at the end of every increment, deployed to an environment you can open in a browser.',
  },
  {
    step: '04',
    title: 'Handover or operate',
    body: 'We either hand over a documented system your team can run, or keep operating it under an SLA. Your call.',
  },
];

export default function ServicesPage() {
  return (
    <>
      <section className="border-b border-ink-100 bg-ink-50">
        <div className="container-page py-14 sm:py-20">
          <p className="eyebrow">
            <span className="h-1.5 w-1.5 rounded-full bg-grass-500" aria-hidden="true" />
            Services
          </p>
          <h1 className="heading-1 mt-4 max-w-3xl">Engineering, priced and scoped like engineering.</h1>
          <p className="lede mt-5 max-w-2xl">
            Four practices, one team of {TEAM_FACTS.headcount}. We choose the language per layer — Rust for the hot
            paths, NestJS for the domain, Next.js for the surface — and we tell you when a piece of work is not worth
            doing.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container-page space-y-5 sm:space-y-6">
          {SERVICES.map((service, index) => (
            <article
              key={service.slug}
              id={service.slug}
              className="grid gap-6 rounded-2xl border border-ink-100 bg-white p-5 shadow-card sm:p-7 lg:grid-cols-3 lg:gap-10"
            >
              <div className="lg:col-span-1">
                <span className="font-mono text-xs font-semibold text-ink-300">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h2 className="heading-3 mt-2">{service.title}</h2>
                <p className="mt-1.5 text-sm font-medium text-grass-600">{service.tagline}</p>
                <ul className="mt-4 flex flex-wrap gap-1.5">
                  {service.stack.map((tech) => (
                    <li key={tech} className="chip">
                      {tech}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="lg:col-span-2">
                <p className="text-sm leading-relaxed text-ink-600 sm:text-base">{service.description}</p>
                <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
                  {service.deliverables.map((item) => (
                    <li key={item} className="flex gap-2.5 text-sm text-ink-600">
                      <span className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section bg-ink-50">
        <div className="container-page">
          <SectionHeading eyebrow="Engagement" title="Three ways to work with us" />
          <div className="mt-10 grid gap-4 sm:grid-cols-3 sm:gap-5">
            {ENGAGEMENT_MODELS.map((model) => (
              <article key={model.title} className="card flex h-full flex-col">
                <h3 className="heading-3">{model.title}</h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-500">{model.description}</p>
                <p className="mt-4 border-t border-ink-100 pt-4 text-xs text-ink-400">
                  <span className="font-semibold text-ink-600">Good fit: </span>
                  {model.fit}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container-page">
          <SectionHeading eyebrow="Process" title="How an engagement actually runs" />
          <ol className="mt-10 grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
            {PROCESS.map((phase) => (
              <li key={phase.step} className="card">
                <span className="font-mono text-xs font-bold text-grass-500">{phase.step}</span>
                <h3 className="mt-2 text-base font-semibold">{phase.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-500">{phase.body}</p>
              </li>
            ))}
          </ol>

          <div className="mt-12 rounded-3xl border border-grass-200 bg-gradient-to-br from-grass-50 to-sky-50 p-6 sm:p-10">
            <h2 className="heading-2">Ready to scope something?</h2>
            <p className="lede mt-3 max-w-xl">Send the brief. An engineer reads it and replies within two working days.</p>
            <Link href="/order" className="btn-primary mt-7 w-full sm:w-auto">
              Order a project
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
