import { summarizeBudget } from '@/lib/budget';
import { formatUsd } from '@/lib/format';
import { FINAL_STEP } from '@/lib/coordinator/steps';
import { supabase } from '@/services/supabaseClient';
import {
  mapAgent,
  mapSettings,
  mapTask,
  mapTransaction,
  type AgentRow,
  type SettingsRow,
  type TaskRow,
  type TransactionRow,
} from '@/services/workspaceMappers';
import type {
  NewTaskInput,
  Task,
  TaskProgressPatch,
  Transaction,
  WorkspaceSettings,
  WorkspaceSnapshot,
} from '@/types/domain';

const WORK_VERIFIED_STEP = 7;
const LOAD_ERROR = 'Your workspace could not be loaded. Please try again.';

interface SupabaseErrorLike {
  code?: string;
  message: string;
}

function userFacingError(error: SupabaseErrorLike, fallback: string): Error {
  // Database budget and payment rules raise readable messages with this code.
  return new Error(error.code === 'P0001' ? error.message : fallback);
}

function toTaskColumns(patch: TaskProgressPatch): Record<string, unknown> {
  const columns: Record<string, unknown> = {};
  if (patch.completedSteps !== undefined) columns.completed_steps = patch.completedSteps;
  if (patch.selectedAgentId !== undefined) columns.selected_agent_id = patch.selectedAgentId;
  if (patch.subtasks !== undefined) columns.subtasks = patch.subtasks;
  if (patch.bids !== undefined) columns.bids = patch.bids;
  if (patch.verificationScore !== undefined) columns.verification_score = patch.verificationScore;
  if (patch.deliverable !== undefined) columns.deliverable = patch.deliverable;
  return columns;
}

async function readTask(taskId: string): Promise<Task> {
  const { data, error } = await supabase.from('tasks').select('*').eq('id', taskId).maybeSingle();
  if (error) throw new Error('This task could not be loaded. Please try again.');
  if (!data) throw new Error('This task could not be found.');
  return mapTask(data as TaskRow);
}

export async function fetchWorkspace(): Promise<WorkspaceSnapshot> {
  const [agents, tasks, transactions, settings] = await Promise.all([
    supabase.from('agents').select('*').order('created_at', { ascending: true }),
    supabase.from('tasks').select('*').order('created_at', { ascending: false }),
    supabase.from('transactions').select('*').order('created_at', { ascending: false }),
    supabase.from('workspace_settings').select('workspace_name, budget_pool_usd').eq('id', 1).maybeSingle(),
  ]);

  if (agents.error || tasks.error || transactions.error || settings.error || !settings.data) {
    throw new Error(LOAD_ERROR);
  }

  return {
    agents: (agents.data as AgentRow[]).map(mapAgent),
    tasks: (tasks.data as TaskRow[]).map(mapTask),
    transactions: (transactions.data as TransactionRow[]).map(mapTransaction),
    settings: mapSettings(settings.data as SettingsRow),
  };
}

export async function createTask(input: NewTaskInput): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      title: input.title,
      description: input.description,
      budget_usd: input.budgetUsd,
      deadline: input.deadline,
      specialization: input.specialization,
      skills: input.skills,
      preferred_agent_id: input.preferredAgentId,
      completed_steps: 1,
    })
    .select()
    .single();

  if (error) throw userFacingError(error, 'The task could not be saved. Please try again.');
  return mapTask(data as TaskRow);
}

export async function updateTaskProgress(taskId: string, patch: TaskProgressPatch): Promise<Task> {
  const current = await readTask(taskId);
  if (current.completedSteps >= FINAL_STEP) throw new Error('This task is already complete.');
  if (patch.completedSteps !== undefined && patch.completedSteps < current.completedSteps) {
    throw new Error('Task progress cannot move backwards.');
  }

  const { data, error } = await supabase
    .from('tasks')
    .update({ ...toTaskColumns(patch), updated_at: new Date().toISOString() })
    .eq('id', taskId)
    .select()
    .single();

  if (error) throw userFacingError(error, 'The task could not be updated. Please try again.');
  return mapTask(data as TaskRow);
}

export async function requestPayment(taskId: string): Promise<Transaction> {
  const task = await readTask(taskId);
  if (task.completedSteps !== WORK_VERIFIED_STEP) {
    throw new Error('A payment can be requested once the work is verified.');
  }
  const bid = task.bids.find((item) => item.agentId === task.selectedAgentId);
  if (!task.selectedAgentId || !bid) throw new Error('Select an agent before requesting payment.');
  if (bid.amountUsd > task.budgetUsd) throw new Error('The agreed amount is above the task budget.');

  const { data: openRows, error: openError } = await supabase
    .from('transactions')
    .select('id')
    .eq('task_id', taskId)
    .neq('status', 'declined');
  if (openError) throw new Error('The payment request could not be created. Please try again.');
  if ((openRows ?? []).length > 0) throw new Error('A payment request is already open for this task.');

  const { data, error } = await supabase
    .from('transactions')
    .insert({ task_id: taskId, agent_id: task.selectedAgentId, amount_usd: bid.amountUsd })
    .select()
    .single();

  if (error) throw userFacingError(error, 'The payment request could not be created. Please try again.');
  return mapTransaction(data as TransactionRow);
}

export async function decidePayment(
  transactionId: string,
  decision: 'approve' | 'decline',
): Promise<{ transaction: Transaction; task: Task }> {
  const { error: decisionError } = await supabase.rpc(
    decision === 'approve' ? 'approve_payment' : 'decline_payment',
    { p_transaction_id: transactionId },
  );
  if (decisionError) {
    throw userFacingError(decisionError, 'The payment could not be updated. Please try again.');
  }

  const { data: txRow, error: txError } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', transactionId)
    .maybeSingle();
  if (txError || !txRow) throw new Error('The payment was updated, but it could not be reloaded. Please refresh.');

  const transaction = mapTransaction(txRow as TransactionRow);
  const task = await readTask(transaction.taskId);
  return { transaction, task };
}

export async function updateSettings(patch: Partial<WorkspaceSettings>): Promise<WorkspaceSettings> {
  const current = await fetchWorkspace();
  const next: WorkspaceSettings = { ...current.settings, ...patch };
  const workspaceName = next.workspaceName.trim();
  if (workspaceName.length < 2) throw new Error('The workspace name needs at least 2 characters.');
  if (!Number.isFinite(next.budgetPoolUsd) || next.budgetPoolUsd < 0) {
    throw new Error('The budget pool must be zero or more.');
  }

  const summary = summarizeBudget(next, current.tasks, current.transactions);
  const committedUsd = summary.reservedUsd + summary.spentUsd;
  if (next.budgetPoolUsd < committedUsd) {
    throw new Error(`The pool cannot drop below ${formatUsd(committedUsd)} already reserved or spent.`);
  }

  const { data, error } = await supabase
    .from('workspace_settings')
    .update({
      workspace_name: workspaceName,
      budget_pool_usd: next.budgetPoolUsd,
      updated_at: new Date().toISOString(),
    })
    .eq('id', 1)
    .select('workspace_name, budget_pool_usd')
    .single();

  if (error) throw userFacingError(error, 'Your settings could not be saved. Please try again.');
  return mapSettings(data as SettingsRow);
}
