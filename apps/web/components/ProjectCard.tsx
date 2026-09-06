import type { Project } from '@/lib/types';
import { StatusBadge } from './ui';

function year(iso?: string | null) {
  return iso ? new Date(iso).getFullYear() : null;
}

export default function ProjectCard({ project }: { project: Project }) {
  const from = year(project.startedAt);
  const to = year(project.completedAt);

  return (
    <article className="card card-hover card-glow group flex h-full flex-col">
      <div className="flex items-start justify-between gap-3">
        <h3 className="heading-3 transition-colors duration-300 group-hover:text-grass-700">{project.name}</h3>
        <StatusBadge status={project.status} />
      </div>

      <p className="mt-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-sky-600">{project.domain}</p>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-500">{project.summary}</p>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {project.stack.map((tech) => (
          <span key={tech} className="chip">
            {tech}
          </span>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-ink-100 pt-3">
        <p className="text-xs text-ink-400">
          {from}
          {to && to !== from ? ` — ${to}` : project.status === 'ACTIVE' ? ' — present' : ''}
        </p>

        {project.status === 'ACTIVE' ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-grass-600">
            <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-grass-500 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-grass-500" />
            </span>
            In flight
          </span>
        ) : null}
      </div>
    </article>
  );
}
