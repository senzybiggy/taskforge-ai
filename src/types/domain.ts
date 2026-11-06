export const SPECIALIZATIONS = [
  'Research',
  'Content Writing',
  'Data Analysis',
  'Development',
  'Design',
  'Smart Contracts',
  'Market Intelligence',
  'Operations',
] as const;

export type Specialization = (typeof SPECIALIZATIONS)[number];

export interface Agent {
  id: string;
  name: string;
  category: Specialization;
  tagline: string;
  description: string;
  reputation: number;
  completedJobs: number;
  basePriceUsd: number;
  avgDeliveryDays: number;
  isOnline: boolean;
}

export interface Subtask {
  id: string;
  title: string;
  description: string;
}

export interface Bid {
  agentId: string;
  amountUsd: number;
  etaDays: number;
  score: number | null;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  budgetUsd: number;
  deadline: string;
  specialization: Specialization;
  preferredAgentId: string | null;
  selectedAgentId: string | null;
  completedSteps: number;
  subtasks: Subtask[];
  bids: Bid[];
  verificationScore: number | null;
  createdAt: string;
  updatedAt: string;
}

export type TaskProgressPatch = Partial<
  Pick<Task, 'completedSteps' | 'selectedAgentId' | 'subtasks' | 'bids' | 'verificationScore'>
>;

export type TransactionStatus = 'pending_approval' | 'approved' | 'declined';

export interface Transaction {
  id: string;
  taskId: string;
  agentId: string;
  amountUsd: number;
  status: TransactionStatus;
  createdAt: string;
  decidedAt: string | null;
}

export interface WorkspaceSettings {
  workspaceName: string;
  budgetPoolUsd: number;
}

export interface NewTaskInput {
  title: string;
  description: string;
  budgetUsd: number;
  deadline: string;
  specialization: Specialization;
  preferredAgentId: string | null;
}
