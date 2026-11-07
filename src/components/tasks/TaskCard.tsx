import { ArrowUpRight, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { AgentAvatar } from '@/components/agents/AgentAvatar';
import { daysUntil, formatDate, formatUsd } from '@/lib/format';
import { COORDINATOR_STEPS, FINAL_STEP } from '@/lib/coordinator/steps';
import { nextStepFor, taskStatus } from '@/lib/labels';
import type { Agent, Task } from '@/types/domain';

interface TaskCardProps {
  task: Task;
  agent: Agent | undefined;
  onOpen: () => void;
}

const VISIBLE_SKILLS = 3;

export function TaskCard({ task, agent, onOpen }: TaskCardProps) {
  const status = taskStatus(task);
  const progress = (task.completedSteps / FINAL_STEP) * 100;
  const remaining = daysUntil(task.deadline);
  const stepLabel = COORDINATOR_STEPS[Math.min(task.completedSteps, FINAL_STEP - 1)]?.label ?? '';
  const finished = task.completedSteps >= FINAL_STEP;
  const hiddenSkills = Math.max(0, task.skills.length - VISIBLE_SKILLS);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex w-full flex-col gap-5 rounded-2xl border border-white/[0.07] bg-gradient-to-b from-ink-700/60 to-ink-800/80 p-6 text-left transition duration-300 hover:-translate-y-0.5 hover:border-blue-400/30 hover:shadow-[0_24px_50px_-24px_rgba(59,130,246,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={status.tone} dot>{status.label}</Badge>
            <Badge tone="neutral">{task.specialization}</Badge>
          </div>
          <h3 className="mt-3 line-clamp-2 font-display text-lg font-semibold leading-snug text-white">{task.title}</h3>
        </div>
        <ArrowUpRight className="h-5 w-5 shrink-0 text-slate-500 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-blue-300" />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>{finished ? 'Delivered and paid' : stepLabel}</span>
          <span>{task.completedSteps}/{FINAL_STEP} steps</span>
        </div>
        <ProgressBar value={progress} tone={finished ? 'emerald' : 'blue'} label={`${task.title} progress`} />
      </div>

      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Next step</p>
        <p className="mt-1 text-sm leading-relaxed text-slate-200">{nextStepFor(task)}</p>
      </div>

      {task.skills.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {task.skills.slice(0, VISIBLE_SKILLS).map((skill) => (
            <Badge key={skill} tone="neutral">{skill}</Badge>
          ))}
          {hiddenSkills > 0 && <span className="text-xs text-slate-500">+{hiddenSkills} more</span>}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.06] pt-4">
        <div className="flex items-center gap-3 min-w-0">
          {agent ? (
            <>
              <AgentAvatar category={agent.category} size="sm" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-200">{agent.name}</p>
                <p className="text-xs text-slate-500">Assigned agent</p>
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-500">No agent assigned yet</p>
          )}
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {finished ? formatDate(task.deadline) : `${remaining}d left`}
          </span>
          <span className="text-sm font-semibold text-white">{formatUsd(task.budgetUsd)}</span>
        </div>
      </div>
    </button>
  );
}
