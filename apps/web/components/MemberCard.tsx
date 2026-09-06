import type { TeamMember } from '@/lib/types';
import { ROLE_LABEL } from '@/lib/content';

const ROLE_STYLE: Record<string, string> = {
  CTO: 'from-ink-700 to-ink',
  BACKEND: 'from-grass-400 to-grass-600',
  FRONTEND: 'from-sky-400 to-sky-600',
  DEVOPS: 'from-ink-500 to-ink-700',
};

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export default function MemberCard({ member }: { member: TeamMember }) {
  return (
    <article className="card card-hover card-glow group flex h-full flex-col">
      <div className="flex items-start gap-3.5">
        <div
          className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-sm font-bold text-white shadow-[0_6px_16px_-8px_rgba(10,13,12,0.55)] transition-transform duration-500 ease-spring group-hover:scale-105 ${
            ROLE_STYLE[member.role] ?? 'from-ink-400 to-ink-600'
          }`}
          aria-hidden="true"
        >
          {initials(member.name)}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="heading-3 truncate transition-colors duration-300 group-hover:text-grass-700">
            {member.name}
          </h3>
          <p className="mt-0.5 truncate text-sm text-ink-500">{member.title}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="chip-grass">{ROLE_LABEL[member.role] ?? member.role}</span>
        <span className="chip-sky">{member.yearsExperience} yrs</span>
        {member.location ? <span className="chip">{member.location}</span> : null}
      </div>

      <p className="mt-4 text-sm font-medium text-ink-700">{member.focus}</p>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-500">{member.bio}</p>

      {member.skills?.length ? (
        <ul className="mt-4 flex flex-wrap gap-1.5 border-t border-ink-100 pt-4">
          {member.skills.map((skill) => (
            <li key={skill} className="chip">
              {skill}
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}
