import { Check, Loader2 } from 'lucide-react';
import { COORDINATOR_STEPS, FINAL_STEP } from '@/lib/coordinator/steps';
import { formatUsd } from '@/lib/format';
import type { Agent, Task } from '@/types/domain';

interface WorkflowStepperProps {
  task: Task;
  agents: Agent[];
  running: boolean;
}

function stepDetail(step: number, task: Task, agents: Agent[]): string | null {
  const selected = agents.find((agent) => agent.id === task.selectedAgentId);
  switch (step) {
    case 2:
      return task.subtasks.length > 0 ? `${task.subtasks.length} subjobs planned` : null;
    case 3:
      return task.bids.length > 0 ? `${task.bids.length} bid${task.bids.length === 1 ? '' : 's'} received` : null;
    case 4:
      return task.bids.some((bid) => bid.score !== null) ? 'Ranked by score' : null;
    case 5:
      return selected ? `${selected.name} confirmed` : null;
    case 7:
      return task.verificationScore !== null ? `Verification score ${task.verificationScore}/100` : null;
    case 8:
      return task.completedSteps >= FINAL_STEP ? `${formatUsd(task.bids.find((bid) => bid.agentId === task.selectedAgentId)?.amountUsd ?? 0)} released` : null;
    default:
      return null;
  }
}

export function WorkflowStepper({ task, agents, running }: WorkflowStepperProps) {
  const currentStep = task.completedSteps >= FINAL_STEP ? FINAL_STEP + 1 : task.completedSteps + 1;

  return (
    <ol className="relative flex flex-col" aria-label="Coordinator workflow">
      {COORDINATOR_STEPS.map((step, index) => {
        const done = step.id <= task.completedSteps;
        const current = step.id === currentStep;
        const isLast = index === COORDINATOR_STEPS.length - 1;
        const detail = done ? stepDetail(step.id, task, agents) : null;
        return (
          <li key={step.id} className="relative flex gap-4 pb-6 last:pb-0">
            {!isLast && (
              <span
                aria-hidden="true"
                className={`absolute left-[15px] top-8 h-[calc(100%-2rem)] w-px ${done && step.id < task.completedSteps ? 'bg-gradient-to-b from-blue-400 to-blue-500/40' : 'bg-white/10'}`}
              />
            )}
            <span
              className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-all duration-500 ${
                done
                  ? 'bg-blue-500 text-white shadow-[0_0_18px_rgba(59,130,246,0.6)]'
                  : current
                    ? 'animate-pulse-ring bg-ink-700 text-blue-300 ring-1 ring-blue-400/60'
                    : 'bg-ink-700 text-slate-500 ring-1 ring-white/10'
              }`}
            >
              {done && step.id < FINAL_STEP + 1 ? <Check className="h-4 w-4" strokeWidth={3} /> : step.id}
            </span>
            <div className="min-w-0 pt-0.5">
              <p className={`flex items-center gap-2 text-sm font-semibold ${done || current ? 'text-white' : 'text-slate-500'}`}>
                {step.label}
                {current && running && <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-300" />}
              </p>
              <p className={`mt-0.5 text-xs leading-relaxed ${done || current ? 'text-slate-400' : 'text-slate-600'}`}>{step.description}</p>
              {detail && <p className="mt-1.5 inline-flex rounded-md bg-blue-500/10 px-2 py-0.5 text-xs text-blue-200">{detail}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
