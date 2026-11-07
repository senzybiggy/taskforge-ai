import { ChevronDown } from 'lucide-react';
import type { DeliverableProject } from '@/types/domain';

interface DeliverableProjectsProps {
  projects: DeliverableProject[];
}

export function DeliverableProjects({ projects }: DeliverableProjectsProps) {
  return (
    <div className="flex flex-col gap-3">
      {projects.map((project, index) => (
        <details
          key={project.name}
          className="group rounded-xl border border-white/[0.07] bg-ink-900/50 transition-colors open:border-blue-400/25 open:bg-white/[0.03]"
        >
          <summary className="flex cursor-pointer list-none items-center gap-4 px-4 py-3.5 [&::-webkit-details-marker]:hidden">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-xs font-semibold text-blue-200">
              {String(index + 1).padStart(2, '0')}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-white">{project.name}</span>
              <span className="mt-0.5 block text-xs leading-relaxed text-slate-400">{project.role}</span>
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 text-slate-500 transition-transform duration-200 group-open:rotate-180" />
          </summary>

          <div className="grid gap-5 border-t border-white/[0.06] px-4 py-4 sm:grid-cols-2">
            <ProjectList title="What it does" items={project.functions} tone="text-slate-300" />
            <div className="flex flex-col gap-5">
              <ProjectList title="Strengths" items={project.strengths} tone="text-emerald-200" />
              <ProjectList title="Weaknesses" items={project.weaknesses} tone="text-amber-200" />
            </div>
            <a
              href={project.source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-300 underline-offset-4 hover:text-blue-200 hover:underline sm:col-span-2"
            >
              Source: {project.source.title}
            </a>
          </div>
        </details>
      ))}
    </div>
  );
}

function ProjectList({ title, items, tone }: { title: string; items: string[]; tone: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{title}</p>
      <ul className={`mt-2 flex flex-col gap-1.5 text-sm leading-relaxed ${tone}`}>
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-current opacity-60" aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
