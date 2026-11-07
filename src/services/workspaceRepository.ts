import type { WorkspaceSnapshot } from '@/data/seedData';
import { canSpend, summarizeBudget } from '@/lib/budget';
import { formatUsd } from '@/lib/format';
import { FINAL_STEP } from '@/lib/coordinator/steps';
import { readStoredWorkspace, writeStoredWorkspace } from '@/services/localWorkspaceStore';
import type {
  NewTaskInput,
  Task,
  TaskProgressPatch,
  Transaction,
  WorkspaceSettings,
} from '@/types/domain';

// Every operation here is the seam for a future backend or NEAR integration.
// Callers only use these async functions, so the local store can be swapped out.

const SIMULATED_LATENCY_MS = 180;
const WORK_VERIFIED_STEP = 7;

let snapshot: WorkspaceSnapshot = readStoredWorkspace();

function wait(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, SIMULATED_LATENCY_MS));
}

function commit(next: WorkspaceSnapshot): void {
  writeStoredWorkspace(next);
  snapshot = next;
}

function createId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function findTask(taskId: string): Task {
  const task = snapshot.tasks.find((item) => item.id === taskId);
  if (!task) throw new Error('This task could not be found.');
  return task;
}

export async function fetchWorkspace(): Promise<WorkspaceSnapshot> {
  await wait();
  return snapshot;
}

export async function createTask(input: NewTaskInput): Promise<Task> {
  await wait();
  const summary = summarizeBudget(snapshot.settings, snapshot.tasks, snapshot.transactions);
  if (!canSpend(input.budgetUsd, summary)) {
    throw new Error(`Only ${formatUsd(summary.availableUsd)} is available in your approved budget.`);
  }
  if (input.preferredAgentId && !snapshot.agents.some((agent) => agent.id === input.preferredAgentId)) {
    throw new Error('The requested agent is no longer available.');
  }

  const now = new Date().toISOString();
  const task: Task = {
    ...input,
    id: createId('tsk'),
    selectedAgentId: null,
    completedSteps: 1,
    subtasks: [],
    bids: [],
    verificationScore: null,
    createdAt: now,
    updatedAt: now,
  };
  commit({ ...snapshot, tasks: [task, ...snapshot.tasks] });
  return task;
}

export async function updateTaskProgress(taskId: string, patch: TaskProgressPatch): Promise<Task> {
  await wait();
  const current = findTask(taskId);
  if (current.completedSteps >= FINAL_STEP) throw new Error('This task is already complete.');
  if (patch.completedSteps !== undefined && patch.completedSteps < current.completedSteps) {
    throw new Error('Task progress cannot move backwards.');
  }

  const updated: Task = { ...current, ...patch, updatedAt: new Date().toISOString() };
  commit({
    ...snapshot,
    tasks: snapshot.tasks.map((task) => (task.id === taskId ? updated : task)),
  });
  return updated;
}

export async function requestPayment(taskId: string): Promise<Transaction> {
  await wait();
  const task = findTask(taskId);
  if (task.completedSteps !== WORK_VERIFIED_STEP) {
    throw new Error('A payment can be requested once the work is verified.');
  }
  const bid = task.bids.find((item) => item.agentId === task.selectedAgentId);
  if (!task.selectedAgentId || !bid) throw new Error('Select an agent before requesting payment.');
  if (bid.amountUsd > task.budgetUsd) throw new Error('The agreed amount is above the task budget.');
  if (snapshot.transactions.some((tx) => tx.taskId === taskId && tx.status !== 'declined')) {
    throw new Error('A payment request is already open for this task.');
  }

  const transaction: Transaction = {
    id: createId('txn'),
    taskId,
    agentId: task.selectedAgentId,
    amountUsd: bid.amountUsd,
    status: 'pending_approval',
    createdAt: new Date().toISOString(),
    decidedAt: null,
  };
  commit({ ...snapshot, transactions: [transaction, ...snapshot.transactions] });
  return transaction;
}

export async function decidePayment(
  transactionId: string,
  decision: 'approve' | 'decline',
): Promise<{ transaction: Transaction; task: Task }> {
  await wait();
  const current = snapshot.transactions.find((item) => item.id === transactionId);
  if (!current) throw new Error('This payment could not be found.');
  if (current.status !== 'pending_approval') throw new Error('This payment has already been decided.');

  const task = findTask(current.taskId);
  const decidedAt = new Date().toISOString();

  if (decision === 'decline') {
    const transaction: Transaction = { ...current, status: 'declined', decidedAt };
    commit({
      ...snapshot,
      transactions: snapshot.transactions.map((tx) => (tx.id === transactionId ? transaction : tx)),
    });
    return { transaction, task };
  }

  if (task.completedSteps !== WORK_VERIFIED_STEP) throw new Error('This task is not waiting for payment approval.');
  if (current.amountUsd > task.budgetUsd) throw new Error('Payment would exceed the approved task budget.');

  const transaction: Transaction = { ...current, status: 'approved', decidedAt };
  const completedTask: Task = { ...task, completedSteps: FINAL_STEP, updatedAt: decidedAt };
  commit({
    ...snapshot,
    transactions: snapshot.transactions.map((tx) => (tx.id === transactionId ? transaction : tx)),
    tasks: snapshot.tasks.map((item) => (item.id === task.id ? completedTask : item)),
  });
  return { transaction, task: completedTask };
}

export async function updateSettings(patch: Partial<WorkspaceSettings>): Promise<WorkspaceSettings> {
  await wait();
  const next: WorkspaceSettings = { ...snapshot.settings, ...patch };
  const workspaceName = next.workspaceName.trim();
  if (workspaceName.length < 2) throw new Error('The workspace name needs at least 2 characters.');
  if (!Number.isFinite(next.budgetPoolUsd) || next.budgetPoolUsd < 0) {
    throw new Error('The budget pool must be zero or more.');
  }

  const summary = summarizeBudget(next, snapshot.tasks, snapshot.transactions);
  const committedUsd = summary.reservedUsd + summary.spentUsd;
  if (next.budgetPoolUsd < committedUsd) {
    throw new Error(`The pool cannot drop below ${formatUsd(committedUsd)} already reserved or spent.`);
  }

  const settings = { ...next, workspaceName };
  commit({ ...snapshot, settings });
  return settings;
}
