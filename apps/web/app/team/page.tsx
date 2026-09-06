import type { Metadata } from 'next';
import Link from 'next/link';
import { fetchPublic } from '@/lib/api';
import type { TeamMember, Project } from '@/lib/types';
import { TEAM_FACTS, FALLBACK_MEMBERS, FALLBACK_PROJECTS } from '@/lib/content';
import MemberCard from '@/components/MemberCard';
import ProjectCard from '@/components/ProjectCard';
import { SectionHeading, StatTile } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Team',
  description:
    'Eight senior engineers — four backend, two frontend, one DevOps and a CTO. Six years together, AI in production since 2021.',
};

export const revalidate = 60;

const ROLE_ORDER: Record<string, number> = { CTO: 0, BACKEND: 1, FRONTEND: 2, DEVOPS: 3 };

const TIMELINE = [
  { year: '2019', title: 'The team forms', body: 'Four of us leave the same platform group and start taking on backend work together.' },
  { year: '2021', title: 'First AI engagements', body: 'A document-extraction pipeline turns into a practice. We have shipped AI systems every year since.' },
  { year: '2023', title: 'Rust becomes the default for hot paths', body: 'Inference gateways and streaming pipelines move to Rust; p99 latency stops being a recurring agenda item.' },
  { year: '2025', title: 'Eight engineers, one standard', body: 'DevOps and a second frontend engineer join. Every member now carries seven years or more.' },
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
      <section className="border-b border-ink-100 bg-ink-50">
        <div className="container-page py-14 sm:py-20">
          <p className="eyebrow">
            <span className="h-1.5 w-1.5 rounded-full bg-grass-500" aria-hidden="true" />
            Team introduction
          </p>
          <h1 className="heading-1 mt-4 max-w-3xl">
            Eight senior engineers who have shipped together for {TEAM_FACTS.yearsTogether} years.
          </h1>
          <p className="lede mt-5 max-w-2xl">
            No juniors on the bench, no rotating cast. The people below are the people who build your system — four
            backend engineers, two frontend engineers, one DevOps engineer and a CTO who still reviews pull requests.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <StatTile value={`${members.length}`} label="Engineers on the team" />
            <StatTile value={`${totalYears}+`} label="Combined years of experience" accent="sky" />
            <StatTile value={`${minYears}`} label="Fewest years held by any member" />
            <StatTile value={`${TEAM_FACTS.aiSince}`} label="Shipping AI since" accent="sky" />
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container-page">
          <SectionHeading
            eyebrow="Profiles"
            title="Who you will be working with"
            lede="Grouped by discipline. Every profile lists real years of experience — the number is a floor, not a rounding."
          />

          <div className="mt-10 grid gap-4 sm:mt-12 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {members.map((member) => (
              <MemberCard key={member.id} member={member} />
            ))}
          </div>
        </div>
      </section>

      <section className="section bg-ink-50">
        <div className="container-page">
          <SectionHeading eyebrow="History" title="How we got here" />
          <ol className="mt-10 space-y-4">
            {TIMELINE.map((entry) => (
              <li key={entry.year} className="flex flex-col gap-2 rounded-2xl border border-ink-100 bg-white p-5 sm:flex-row sm:gap-6 sm:p-6">
                <span className="font-mono text-sm font-bold text-grass-600 sm:w-16 sm:shrink-0">{entry.year}</span>
                <div>
                  <h3 className="text-base font-semibold">{entry.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-500">{entry.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section">
        <div className="container-page">
          <SectionHeading eyebrow="Selected work" title="Projects the team has delivered" />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>

          <div className="mt-12 rounded-3xl bg-ink p-6 text-white sm:p-10">
            <h2 className="heading-2 text-white">We are making room for more of us.</h2>
            <p className="lede mt-3 max-w-xl text-ink-200">
              Senior engineers with seven years or more, and people with an innovative idea that needs a team. Both
              routes start on the same page.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link href="/join" className="btn-primary w-full sm:w-auto">
                See open roles
              </Link>
              <Link href="/join#idea" className="btn-sky w-full sm:w-auto">
                Pitch an idea
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
