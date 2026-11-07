import type { Specialization, Task, TransactionStatus } from '@/types/domain';
import { FINAL_STEP } from '@/lib/coordinator/steps';

export interface StatusDescriptor {
  label: string;
  tone: 'neutral' | 'blue' | 'violet' | 'emerald' | 'amber' | 'rose';
}

export function taskStatus(task: Task): StatusDescriptor {
  if (task.completedSteps >= FINAL_STEP) return { label: 'Completed', tone: 'emerald' };
  if (task.completedSteps === 7) return { label: 'Awaiting payment approval', tone: 'amber' };
  if (task.completedSteps === 4) return { label: 'Choose an agent', tone: 'violet' };
  if (task.completedSteps === 3 && task.bids.length === 0) return { label: 'No agent fits budget', tone: 'rose' };
  if (task.completedSteps >= 5) return { label: 'Work in progress', tone: 'blue' };
  return { label: 'Coordinating', tone: 'blue' };
}

export function isActiveTask(task: Task): boolean {
  return task.completedSteps < FINAL_STEP;
}

export function nextStepFor(task: Task): string {
  if (task.completedSteps >= FINAL_STEP) return 'Delivered and paid. Nothing else to do.';
  if (task.completedSteps === 7) return 'Review the verified work and approve the payment.';
  if (task.completedSteps === 4) return 'Choose an agent from the bids on the task page.';
  if (task.completedSteps === 3 && task.bids.length === 0) {
    return 'No agent fits the budget. Raise the budget or adjust the required skills.';
  }
  if (task.completedSteps === 5) return 'The agent is hired and moving into work in progress.';
  if (task.completedSteps === 6) {
    if (!task.deliverable) return 'Start the work to generate the agent’s simulated deliverable.';
    if (!task.deliverable.reviewedAt) return 'Review the simulated deliverable, then mark it reviewed.';
    return 'Verify the work to unlock the simulated payment.';
  }
  return 'The coordinator is analyzing your brief and gathering bids.';
}

export function transactionStatus(status: TransactionStatus): StatusDescriptor {
  switch (status) {
    case 'approved':
      return { label: 'Approved', tone: 'emerald' };
    case 'declined':
      return { label: 'Declined', tone: 'rose' };
    case 'pending_approval':
      return { label: 'Pending approval', tone: 'amber' };
  }
}

export const SPECIALIZATION_STYLES: Record<Specialization, string> = {
  Research: 'from-blue-500 to-cyan-400',
  'Content Writing': 'from-sky-500 to-indigo-400',
  'Data Analysis': 'from-cyan-500 to-teal-400',
  Development: 'from-blue-600 to-sky-400',
  Design: 'from-violet-500 to-fuchsia-400',
  'Smart Contracts': 'from-violet-600 to-blue-500',
  'Market Intelligence': 'from-teal-500 to-emerald-400',
  Operations: 'from-slate-500 to-slate-300',
};
