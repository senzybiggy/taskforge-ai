import { ListChecks } from 'lucide-react';
import { Panel } from '@/components/ui/Panel';
import type { Subtask } from '@/types/domain';

export function SubjobList({ subtasks }: { subtasks: Subtask[] }) {
  return (
    <Panel className="p-6 sm:p-7">
      <div className="flex items-center gap-2">
        <ListChecks className="h-4 w-4 text-blue-300" />
        <h2 className="font-display text-lg font-semibold text-white">Planned subjobs</h2>
      </div>
      <ol className="mt-5 flex flex-col gap-4">
        {subtasks.map((subtask, index) => (
          <li key={subtask.id} className="flex gap-4">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-xs font-semibold text-blue-200 ring-1 ring-inset ring-blue-400/20">
              {index + 1}
            </span>
            <div className="min-w-0">
              <p className="font-medium text-white">{subtask.title}</p>
              <p className="mt-0.5 text-sm leading-relaxed text-slate-400">{subtask.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </Panel>
  );
}
