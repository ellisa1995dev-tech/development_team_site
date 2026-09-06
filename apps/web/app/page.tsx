import Link from 'next/link';
import { fetchPublic } from '@/lib/api';
import type { TeamMember, Project } from '@/lib/types';
import { TEAM_FACTS, SERVICES, FALLBACK_MEMBERS, FALLBACK_PROJECTS } from '@/lib/content';
import MemberCard from '@/components/MemberCard';
import ProjectCard from '@/components/ProjectCard';
import Reveal from '@/components/Reveal';
import AnimatedCounter from '@/components/AnimatedCounter';
import { SectionHeading } from '@/components/ui';

export const revalidate = 60;

export default async function HomePage() {
  const [members, projects] = await Promise.all([
    fetchPublic<TeamMember[]>('/members'),
    fetchPublic<Project[]>('/projects'),
  ]);

  const team = members?.length ? members : FALLBACK_MEMBERS;
  const allProjects = projects?.length ? projects : FALLBACK_PROJECTS;
  const activeProjects = allProjects.filter((p) => p.status === 'ACTIVE').slice(0, 3);

  return (
    <>
      {/* ---------------------------------------------------------- hero */}
      <section className="relative overflow-hidden bg-ink text-white">
        {/* Two slowly drifting colour fields. */}
        <div
          className="pointer-events-none absolute -left-[18%] -top-[28%] h-[52rem] w-[52rem] animate-aurora rounded-full blur-[110px]"
          style={{ background: 'radial-gradient(circle, rgba(58,148,72,0.95), rgba(58,148,72,0.35) 45%, transparent 70%)' }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -right-[12%] -top-[10%] h-[46rem] w-[46rem] animate-aurora rounded-full blur-[110px] [animation-delay:-9s]"
          style={{ background: 'radial-gradient(circle, rgba(0,165,236,0.8), rgba(0,165,236,0.28) 45%, transparent 70%)' }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-[30%] left-[22%] h-[40rem] w-[40rem] animate-aurora rounded-full blur-[120px] [animation-delay:-14s]"
          style={{ background: 'radial-gradient(circle, rgba(58,148,72,0.55), transparent 68%)' }}
          aria-hidden="true"
        />
        {/* Fine grid, faded out toward the bottom. */}
        <div
          className="pointer-events-none absolute inset-0 mask-fade-b opacity-[0.22]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.14) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.14) 1px, transparent 1px)',
            backgroundSize: '58px 58px',
          }}
          aria-hidden="true"
        />

        <div className="container-page relative py-24 sm:py-32 lg:py-40">
          <p className="eyebrow animate-fade-up text-grass-400">
            <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-grass-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-grass-400" />
            </span>
            {TEAM_FACTS.headcount} engineers · {TEAM_FACTS.yearsTogether} years together
          </p>

          <h1 className="heading-1 mt-6 max-w-4xl animate-fade-up text-white delay-75">
            We build production systems in{' '}
            <span className="relative inline-block text-grass-400">
              Rust
              <span className="absolute -bottom-1 left-0 h-[3px] w-full rounded-full bg-grass-400/30" aria-hidden="true" />
            </span>
            , <span className="text-sky-400">Next.js</span> and <span className="text-grass-400">NestJS</span>.
          </h1>

          <p className="lede mt-7 max-w-2xl animate-fade-up text-ink-200 delay-150">
            A single senior team — not a staffing pool. Six years shipping together, and AI in production since{' '}
            {TEAM_FACTS.aiSince}: retrieval platforms, inference infrastructure and the interfaces people actually use.
          </p>

          <div className="mt-10 flex animate-fade-up flex-col gap-3 delay-225 sm:flex-row">
            <Link href="/order" className="btn-primary w-full sm:w-auto">
              Order a project
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-0.5">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <Link href="/team" className="btn-ghost-light w-full sm:w-auto">
              Meet the team
            </Link>
          </div>

          <dl className="mt-16 grid animate-fade-up grid-cols-2 gap-3 delay-300 sm:gap-4 lg:grid-cols-4">
            {[
              { value: TEAM_FACTS.yearsTogether, suffix: ' yrs', label: 'Building as one team' },
              { value: TEAM_FACTS.headcount, suffix: '', label: 'Senior engineers, all 7+ years' },
              { value: TEAM_FACTS.aiSince, suffix: '', label: 'Shipping AI since', raw: true },
              { value: 3, suffix: '', label: 'Core languages, chosen per layer' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="glass group rounded-2xl p-4 shadow-inset transition-all duration-500 ease-out-expo hover:-translate-y-1 hover:border-white/25 hover:bg-white/[0.09] sm:p-5"
              >
                <dt className="sr-only">{stat.label}</dt>
                <dd>
                  <span className="block text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                    {stat.raw ? (
                      stat.value
                    ) : (
                      <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                    )}
                  </span>
                  <span className="mt-1 block text-xs leading-snug text-ink-300 sm:text-sm">{stat.label}</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ------------------------------------------------------ services */}
      <section id="services" className="section">
        <div className="container-page">
          <Reveal>
            <SectionHeading
              eyebrow="Services"
              title="What we take on"
              lede="Four practices that overlap on every engagement. Most clients start with one and pull in the rest as the system grows."
            />
          </Reveal>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 sm:gap-5">
            {SERVICES.map((service, i) => (
              <Reveal key={service.slug} delay={i * 90}>
                <article className="card card-hover card-glow group flex h-full flex-col">
                  <div className="flex items-baseline gap-3">
                    <span className="font-mono text-xs font-semibold text-ink-300 transition-colors duration-300 group-hover:text-grass-500">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <h3 className="heading-3 transition-colors duration-300 group-hover:text-grass-700">
                      {service.title}
                    </h3>
                  </div>
                  <p className="mt-1.5 text-sm font-medium text-grass-600">{service.tagline}</p>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-500">{service.description}</p>
                  <ul className="mt-4 flex flex-wrap gap-1.5">
                    {service.stack.map((tech) => (
                      <li key={tech} className="chip">
                        {tech}
                      </li>
                    ))}
                  </ul>
                </article>
              </Reveal>
            ))}
          </div>

          <Reveal delay={120} className="mt-10">
            <Link href="/services" className="btn-outline group">
              See how we work
              <span className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true">
                →
              </span>
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ---------------------------------------------------------- work */}
      <section id="work" className="section surface-subtle relative overflow-hidden">
        <div className="hairline absolute inset-x-0 top-0" aria-hidden="true" />
        <div className="container-page">
          <Reveal>
            <SectionHeading
              eyebrow="Active work"
              title="What we are building right now"
              lede="Client names stay confidential; the engineering does not. These are the systems currently in flight."
            />
          </Reveal>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {activeProjects.map((project, i) => (
              <Reveal key={project.id} delay={i * 90}>
                <ProjectCard project={project} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- team */}
      <section id="team" className="section">
        <div className="container-page">
          <Reveal>
            <SectionHeading
              eyebrow="The team"
              title="Eight people, no bench"
              lede={`${TEAM_FACTS.breakdown.backend} backend, ${TEAM_FACTS.breakdown.frontend} frontend, ${TEAM_FACTS.breakdown.devops} DevOps and a CTO who still writes code. Everyone has at least seven years behind them.`}
            />
          </Reveal>

          <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {[
              { n: TEAM_FACTS.breakdown.backend, label: 'Backend engineers', accent: 'text-grass-600' },
              { n: TEAM_FACTS.breakdown.frontend, label: 'Frontend engineers', accent: 'text-sky-600' },
              { n: TEAM_FACTS.breakdown.devops, label: 'DevOps engineer', accent: 'text-grass-600' },
              { n: TEAM_FACTS.breakdown.cto, label: 'CTO', accent: 'text-sky-600' },
            ].map((item, i) => (
              <Reveal key={item.label} delay={i * 70}>
                <div className="rounded-2xl border border-ink-100 bg-white p-4 transition-all duration-500 ease-out-expo hover:-translate-y-1 hover:border-grass-200 hover:shadow-card sm:p-5">
                  <div className={`text-2xl font-semibold tracking-tight sm:text-3xl ${item.accent}`}>
                    <AnimatedCounter value={item.n} />
                  </div>
                  <div className="mt-1 text-xs font-medium leading-snug text-ink-500 sm:text-sm">{item.label}</div>
                </div>
              </Reveal>
            ))}
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {team.slice(0, 3).map((member, i) => (
              <Reveal key={member.id} delay={i * 90}>
                <MemberCard member={member} />
              </Reveal>
            ))}
          </div>

          <Reveal delay={120} className="mt-10">
            <Link href="/team" className="btn-outline group">
              All {team.length} profiles
              <span className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true">
                →
              </span>
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ------------------------------------------------ recruiting CTA */}
      <section id="hiring" className="section relative overflow-hidden bg-ink text-white">
        <div
          className="pointer-events-none absolute -bottom-[25%] -left-[10%] h-[38rem] w-[38rem] animate-aurora rounded-full blur-[120px] [animation-delay:-11s]"
          style={{ background: 'radial-gradient(circle, rgba(58,148,72,0.6), transparent 68%)' }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -right-[8%] -top-[20%] h-[42rem] w-[42rem] animate-aurora rounded-full blur-[110px]"
          style={{ background: 'radial-gradient(circle, rgba(0,165,236,0.75), rgba(0,165,236,0.25) 45%, transparent 70%)' }}
          aria-hidden="true"
        />

        <div className="container-page relative">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
            <Reveal>
              <p className="eyebrow text-sky-400">
                <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-sky-400" />
                </span>
                We are hiring
              </p>
              <h2 className="heading-2 mt-4 text-white">
                Bring us an idea worth building — or come build ours.
              </h2>
              <p className="lede mt-5 text-ink-200">
                We are growing the team and we are looking for two kinds of people: engineers with seven or more years
                of depth in Rust, Next.js or NestJS, and people carrying an innovative idea that deserves a team behind
                it. If you have the idea, we have the eight engineers.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link href="/join" className="btn-primary w-full sm:w-auto">
                  Apply to join
                </Link>
                <Link href="/join#idea" className="btn-sky w-full sm:w-auto">
                  Pitch your idea
                </Link>
              </div>
            </Reveal>

            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {[
                { title: 'Senior only, genuinely', body: 'Seven years minimum. You will own systems, not tickets.' },
                {
                  title: 'Ideas get funded attention',
                  body: 'Pitch something original and we will prototype it with you, not around you.',
                },
                {
                  title: 'One team, one standard',
                  body: 'No bench, no rotation. The people you meet are the people who build it.',
                },
              ].map((item, i) => (
                <Reveal key={item.title} delay={120 + i * 90} as="li">
                  <div className="glass h-full rounded-2xl p-5 shadow-inset transition-all duration-500 ease-out-expo hover:-translate-y-1 hover:border-white/25 hover:bg-white/[0.09]">
                    <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-ink-300">{item.body}</p>
                  </div>
                </Reveal>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------- order strip */}
      <section id="order" className="section">
        <div className="container-page">
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl border border-grass-200/70 bg-gradient-to-br from-grass-50 via-white to-sky-50 p-7 sm:p-12 lg:p-16">
              <div
                className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 animate-float rounded-full bg-grass-200/40 blur-3xl"
                aria-hidden="true"
              />
              <div className="relative max-w-2xl">
                <h2 className="heading-2">Have a project in mind?</h2>
                <p className="lede mt-5">
                  Tell us what you are building, the constraints you are working under and when you need it. You will
                  hear back from an engineer — not a sales team — within two working days.
                </p>
                <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                  <Link href="/order" className="btn-primary w-full sm:w-auto">
                    Order a project
                  </Link>
                  <Link href="/services" className="btn-outline w-full sm:w-auto">
                    Browse services
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
