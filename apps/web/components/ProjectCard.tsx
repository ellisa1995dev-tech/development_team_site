import type { Project } from '@/lib/types';
import { StatusBadge } from './ui';

function year(iso?: string | null) {
  return iso ? new Date(iso).getFullYear() : null;
}

export default function ProjectCard({ project }: { project: Project }) {
  const from = year(project.startedAt);
  const to = year(project.completedAt);

  return (
    <article className="card card-hover flex h-full flex-col">
      <div className="flex items-start justify-between gap-3">
        <h3 className="heading-3">{project.name}</h3>
        <StatusBadge status={project.status} />
      </div>

      <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-sky-600">{project.domain}</p>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-500">{project.summary}</p>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {project.stack.map((tech) => (
          <span key={tech} className="chip">
            {tech}
          </span>
        ))}
      </div>

      <p className="mt-4 border-t border-ink-100 pt-3 text-xs text-ink-400">
        {from}
        {to && to !== from ? ` — ${to}` : project.status === 'ACTIVE' ? ' — present' : ''}
      </p>
    </article>
  );
}
