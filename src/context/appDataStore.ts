import { createContext } from 'react';
import type { BudgetSummary } from '@/lib/budget';
import type { Agent, NewTaskInput, Task, TaskProgressPatch, Transaction, WorkspaceSettings } from '@/types/domain';

export interface AppDataContextValue {
  agents: Agent[];
  tasks: Task[];
  transactions: Transaction[];
  settings: WorkspaceSettings | null;
  budget: BudgetSummary | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  createTask: (input: NewTaskInput) => Promise<Task>;
  saveTaskProgress: (taskId: string, patch: TaskProgressPatch) => Promise<Task>;
  requestPayment: (task: Task) => Promise<Transaction>;
  recordTestnetApproval: (transaction: Transaction, txHash: string, sender: string, recipient: string) => Promise<void>;
  declinePayment: (transaction: Transaction) => Promise<void>;
  saveSettings: (patch: Partial<WorkspaceSettings>) => Promise<void>;
}

export const AppDataContext = createContext<AppDataContextValue | null>(null);
