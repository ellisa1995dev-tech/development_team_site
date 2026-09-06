import Link from 'next/link';
import { fetchPublic } from '@/lib/api';
import type { TeamMember, Project } from '@/lib/types';
import { TEAM_FACTS, SERVICES, FALLBACK_MEMBERS, FALLBACK_PROJECTS } from '@/lib/content';
import MemberCard from '@/components/MemberCard';
import ProjectCard from '@/components/ProjectCard';
import { SectionHeading, StatTile } from '@/components/ui';

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
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            background:
              'radial-gradient(60rem 32rem at 15% -10%, rgba(58,148,72,0.42), transparent 60%), radial-gradient(48rem 28rem at 95% 10%, rgba(0,165,236,0.32), transparent 62%)',
          }}
          aria-hidden="true"
        />

        <div className="container-page relative py-20 sm:py-28 lg:py-32">
          <p className="eyebrow text-grass-400">
            <span className="h-1.5 w-1.5 rounded-full bg-grass-400" aria-hidden="true" />
            {TEAM_FACTS.headcount} engineers · {TEAM_FACTS.yearsTogether} years together
          </p>

          <h1 className="heading-1 mt-5 max-w-4xl text-white">
            We build production systems in{' '}
            <span className="text-grass-400">Rust</span>, <span className="text-sky-400">Next.js</span> and{' '}
            <span className="text-grass-400">NestJS</span>.
          </h1>

          <p className="lede mt-6 max-w-2xl text-ink-200">
            A single senior team — not a staffing pool. Six years shipping together, and AI in production since{' '}
            {TEAM_FACTS.aiSince}: retrieval platforms, inference infrastructure and the interfaces people actually use.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link href="/order" className="btn-primary w-full sm:w-auto">
              Order a project
            </Link>
            <Link href="/team" className="btn w-full border border-white/25 bg-white/5 text-white hover:bg-white/10 sm:w-auto">
              Meet the team
            </Link>
          </div>

          <dl className="mt-14 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {[
              { value: `${TEAM_FACTS.yearsTogether} yrs`, label: 'Building as one team' },
              { value: `${TEAM_FACTS.headcount}`, label: 'Senior engineers, all 7+ years' },
              { value: `${TEAM_FACTS.aiSince}`, label: 'Shipping AI since' },
              { value: '3', label: 'Core languages, chosen per layer' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm sm:p-5">
                <dt className="sr-only">{stat.label}</dt>
                <dd>
                  <span className="block text-2xl font-bold tracking-tight text-white sm:text-3xl">{stat.value}</span>
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
          <SectionHeading
            eyebrow="Services"
            title="What we take on"
            lede="Four practices that overlap on every engagement. Most clients start with one and pull in the rest as the system grows."
          />

          <div className="mt-10 grid gap-4 sm:mt-12 sm:grid-cols-2 sm:gap-5">
            {SERVICES.map((service) => (
              <article key={service.slug} className="card card-hover flex h-full flex-col">
                <h3 className="heading-3">{service.title}</h3>
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
            ))}
          </div>

          <div className="mt-8">
            <Link href="/services" className="btn-outline">
              See how we work
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- work */}
      <section id="work" className="section bg-ink-50">
        <div className="container-page">
          <SectionHeading
            eyebrow="Active work"
            title="What we are building right now"
            lede="Client names stay confidential; the engineering does not. These are the systems currently in flight."
          />

          <div className="mt-10 grid gap-4 sm:mt-12 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {activeProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- team */}
      <section id="team" className="section">
        <div className="container-page">
          <SectionHeading
            eyebrow="The team"
            title="Eight people, no bench"
            lede={`${TEAM_FACTS.breakdown.backend} backend, ${TEAM_FACTS.breakdown.frontend} frontend, ${TEAM_FACTS.breakdown.devops} DevOps and a CTO who still writes code. Everyone has at least seven years behind them.`}
          />

          <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <StatTile value={`${TEAM_FACTS.breakdown.backend}`} label="Backend engineers" />
            <StatTile value={`${TEAM_FACTS.breakdown.frontend}`} label="Frontend engineers" accent="sky" />
            <StatTile value={`${TEAM_FACTS.breakdown.devops}`} label="DevOps engineer" />
            <StatTile value={`${TEAM_FACTS.breakdown.cto}`} label="CTO" accent="sky" />
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {team.slice(0, 3).map((member) => (
              <MemberCard key={member.id} member={member} />
            ))}
          </div>

          <div className="mt-8">
            <Link href="/team" className="btn-outline">
              All {team.length} profiles
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ recruiting CTA */}
      <section id="hiring" className="section bg-ink text-white">
        <div className="container-page">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
            <div>
              <p className="eyebrow text-sky-400">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-sky-400" aria-hidden="true" />
                We are hiring
              </p>
              <h2 className="heading-2 mt-3 text-white">
                Bring us an idea worth building — or come build ours.
              </h2>
              <p className="lede mt-4 text-ink-200">
                We are growing the team and we are looking for two kinds of people: engineers with seven or more years
                of depth in Rust, Next.js or NestJS, and people carrying an innovative idea that deserves a team behind
                it. If you have the idea, we have the eight engineers.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/join" className="btn-primary w-full sm:w-auto">
                  Apply to join
                </Link>
                <Link href="/join#idea" className="btn-sky w-full sm:w-auto">
                  Pitch your idea
                </Link>
              </div>
            </div>

            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {[
                {
                  title: 'Senior only, genuinely',
                  body: 'Seven years minimum. You will own systems, not tickets.',
                },
                {
                  title: 'Ideas get funded attention',
                  body: 'Pitch something original and we will prototype it with you, not around you.',
                },
                {
                  title: 'One team, one standard',
                  body: 'No bench, no rotation. The people you meet are the people who build it.',
                },
              ].map((item) => (
                <li key={item.title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                  <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-300">{item.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------- order strip */}
      <section id="order" className="section">
        <div className="container-page">
          <div className="rounded-3xl border border-grass-200 bg-gradient-to-br from-grass-50 to-sky-50 p-6 sm:p-10 lg:p-14">
            <div className="max-w-2xl">
              <h2 className="heading-2">Have a project in mind?</h2>
              <p className="lede mt-4">
                Tell us what you are building, the constraints you are working under and when you need it. You will hear
                back from an engineer — not a sales team — within two working days.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/order" className="btn-primary w-full sm:w-auto">
                  Order a project
                </Link>
                <Link href="/services" className="btn-outline w-full sm:w-auto">
                  Browse services
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
