import type { Agent, Task, Transaction } from '@/types/domain';
import { FINAL_STEP } from '@/lib/coordinator/steps';

export function agentLookup(agents: Agent[]): Map<string, Agent> {
  return new Map(agents.map((agent) => [agent.id, agent]));
}

export function approvedVolume(transactions: Transaction[]): number {
  return Math.round(
    transactions
      .filter((tx) => tx.status === 'approved')
      .reduce((total, tx) => total + tx.amountUsd * 100, 0),
  ) / 100;
}

export function countActiveTasks(tasks: Task[]): number {
  return tasks.filter((task) => task.completedSteps < FINAL_STEP).length;
}

export function countCompletedTasks(tasks: Task[]): number {
  return tasks.filter((task) => task.completedSteps >= FINAL_STEP).length;
}
