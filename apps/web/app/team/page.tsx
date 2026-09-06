import type { Metadata } from 'next';
import Link from 'next/link';
import { fetchPublic } from '@/lib/api';
import type { TeamMember, Project } from '@/lib/types';
import { TEAM_FACTS, FALLBACK_MEMBERS, FALLBACK_PROJECTS } from '@/lib/content';
import MemberCard from '@/components/MemberCard';
import ProjectCard from '@/components/ProjectCard';
import Reveal from '@/components/Reveal';
import { SectionHeading, StatTile, PageHero } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Team',
  description:
    'Eight senior engineers — four backend, two frontend, one DevOps and a CTO. Six years together, AI in production since 2021.',
};

export const revalidate = 60;

const ROLE_ORDER: Record<string, number> = { CTO: 0, BACKEND: 1, FRONTEND: 2, DEVOPS: 3 };

const TIMELINE = [
  {
    year: '2019',
    title: 'The team forms',
    body: 'Four of us leave the same platform group and start taking on backend work together.',
  },
  {
    year: '2021',
    title: 'First AI engagements',
    body: 'A document-extraction pipeline turns into a practice. We have shipped AI systems every year since.',
  },
  {
    year: '2023',
    title: 'Rust becomes the default for hot paths',
    body: 'Inference gateways and streaming pipelines move to Rust; p99 latency stops being a recurring agenda item.',
  },
  {
    year: '2025',
    title: 'Eight engineers, one standard',
    body: 'DevOps and a second frontend engineer join. Every member now carries seven years or more.',
  },
];

export default async function TeamPage() {
  const [membersData, projectsData] = await Promise.all([
    fetchPublic<TeamMember[]>('/members'),
    fetchPublic<Project[]>('/projects'),
  ]);

  const members = (membersData?.length ? membersData : FALLBACK_MEMBERS)
    .slice()
    .sort((a, b) => (ROLE_ORDER[a.role] ?? 9) - (ROLE_ORDER[b.role] ?? 9) || b.yearsExperience - a.yearsExperience);

  const projects = projectsData?.length ? projectsData : FALLBACK_PROJECTS;

  const totalYears = members.reduce((sum, m) => sum + m.yearsExperience, 0);
  const minYears = members.length ? Math.min(...members.map((m) => m.yearsExperience)) : 7;

  return (
    <>
      <PageHero
        eyebrow="Team introduction"
        title={`Eight senior engineers who have shipped together for ${TEAM_FACTS.yearsTogether} years.`}
        lede="No juniors on the bench, no rotating cast. The people below are the people who build your system — four backend engineers, two frontend engineers, one DevOps engineer and a CTO who still reviews pull requests."
      >
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatTile value={`${members.length}`} label="Engineers on the team" />
          <StatTile value={`${totalYears}+`} label="Combined years of experience" accent="sky" />
          <StatTile value={`${minYears}`} label="Fewest years held by any member" />
          <StatTile value={`${TEAM_FACTS.aiSince}`} label="Shipping AI since" accent="sky" />
        </div>
      </PageHero>

      <section className="section pt-12 sm:pt-16 lg:pt-20">
        <div className="container-page">
          <Reveal>
            <SectionHeading
              eyebrow="Profiles"
              title="Who you will be working with"
              lede="Grouped by discipline. Every profile lists real years of experience — the number is a floor, not a rounding."
            />
          </Reveal>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {members.map((member, i) => (
              <Reveal key={member.id} delay={(i % 3) * 90}>
                <MemberCard member={member} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section relative overflow-hidden bg-ink-50">
        <div className="hairline absolute inset-x-0 top-0" aria-hidden="true" />
        <div className="container-page">
          <Reveal>
            <SectionHeading eyebrow="History" title="How we got here" />
          </Reveal>

          {/* Vertical rail with a node per milestone. */}
          <ol className="relative mt-12 space-y-4 before:absolute before:left-[1.35rem] before:top-4 before:hidden before:h-[calc(100%-2rem)] before:w-px before:bg-gradient-to-b before:from-grass-300 before:via-sky-300 before:to-transparent sm:before:block">
            {TIMELINE.map((entry, i) => (
              <Reveal key={entry.year} delay={i * 90} as="li">
                <div className="group relative flex flex-col gap-2 rounded-2xl border border-ink-100 bg-white p-5 transition-all duration-500 ease-out-expo hover:-translate-y-1 hover:border-grass-200 hover:shadow-card sm:flex-row sm:gap-6 sm:p-6 sm:pl-14">
                  <span
                    className="absolute left-[0.95rem] top-7 hidden h-3 w-3 rounded-full border-2 border-white bg-grass-500 shadow-[0_0_0_3px_rgba(58,148,72,0.16)] transition-transform duration-500 ease-spring group-hover:scale-125 sm:block"
                    aria-hidden="true"
                  />
                  <span className="font-mono text-sm font-bold text-grass-600 sm:hidden">{entry.year}</span>
                  <span className="hidden font-mono text-sm font-bold text-grass-600 sm:block sm:w-14 sm:shrink-0">
                    {entry.year}
                  </span>
                  <div>
                    <h3 className="text-base font-semibold">{entry.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-ink-500">{entry.body}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section className="section">
        <div className="container-page">
          <Reveal>
            <SectionHeading eyebrow="Selected work" title="Projects the team has delivered" />
          </Reveal>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {projects.map((project, i) => (
              <Reveal key={project.id} delay={(i % 3) * 90}>
                <ProjectCard project={project} />
              </Reveal>
            ))}
          </div>

          <Reveal delay={120}>
            <div className="relative mt-14 overflow-hidden rounded-3xl bg-ink p-7 text-white sm:p-12">
              <div
                className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 animate-aurora rounded-full opacity-50 blur-3xl"
                style={{ background: 'radial-gradient(circle, rgba(0,165,236,0.55), transparent 62%)' }}
                aria-hidden="true"
              />
              <div className="relative">
                <h2 className="heading-2 text-white">We are making room for more of us.</h2>
                <p className="lede mt-4 max-w-xl text-ink-200">
                  Senior engineers with seven years or more, and people with an innovative idea that needs a team. Both
                  routes start on the same page.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link href="/join" className="btn-primary w-full sm:w-auto">
                    See open roles
                  </Link>
                  <Link href="/join#idea" className="btn-sky w-full sm:w-auto">
                    Pitch an idea
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
