import type { Task, Transaction, WorkspaceSettings } from '@/types/domain';
import { FINAL_STEP } from '@/lib/coordinator/steps';

export interface BudgetSummary {
  poolUsd: number;
  reservedUsd: number;
  spentUsd: number;
  pendingUsd: number;
  availableUsd: number;
}

function sumCents(values: number[]): number {
  return Math.round(values.reduce((total, value) => total + value * 100, 0)) / 100;
}

export function summarizeBudget(
  settings: WorkspaceSettings,
  tasks: Task[],
  transactions: Transaction[],
): BudgetSummary {
  const reservedUsd = sumCents(
    tasks.filter((task) => task.completedSteps < FINAL_STEP).map((task) => task.budgetUsd),
  );
  const spentUsd = sumCents(
    transactions.filter((tx) => tx.status === 'approved').map((tx) => tx.amountUsd),
  );
  const pendingUsd = sumCents(
    transactions.filter((tx) => tx.status === 'pending_approval').map((tx) => tx.amountUsd),
  );
  const availableUsd = Math.max(0, sumCents([settings.budgetPoolUsd, -reservedUsd, -spentUsd]));

  return {
    poolUsd: settings.budgetPoolUsd,
    reservedUsd,
    spentUsd,
    pendingUsd,
    availableUsd,
  };
}

export function canSpend(amountUsd: number, summary: BudgetSummary): boolean {
  return amountUsd > 0 && Math.round(amountUsd * 100) <= Math.round(summary.availableUsd * 100);
}
