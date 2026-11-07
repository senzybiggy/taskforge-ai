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

export const TASK_SKILLS = [
  'Market research',
  'Competitor analysis',
  'Technical writing',
  'SEO',
  'Data cleaning',
  'Forecasting',
  'Dashboards',
  'React',
  'TypeScript',
  'Rust',
  'UI design',
  'Design systems',
  'Security audit',
  'Smart contract testing',
  'Community monitoring',
  'Process automation',
] as const;

export const MAX_TASK_SKILLS = 8;

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
  skills: string[];
  isDemo: boolean;
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
  matchedSkills: string[];
  skillMatch: number;
}

export interface DeliverableSource {
  title: string;
  url: string;
}

export interface DeliverableProject {
  name: string;
  role: string;
  functions: string[];
  strengths: string[];
  weaknesses: string[];
  source: DeliverableSource;
}

export interface Deliverable {
  title: string;
  agentName: string;
  generatedAt: string;
  reviewedAt: string | null;
  summary: string;
  method: string[];
  projects: DeliverableProject[];
  comparison: string[];
  recommendations: string[];
  sources: DeliverableSource[];
  disclaimer: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  budgetUsd: number;
  deadline: string;
  specialization: Specialization;
  skills: string[];
  preferredAgentId: string | null;
  selectedAgentId: string | null;
  completedSteps: number;
  subtasks: Subtask[];
  bids: Bid[];
  verificationScore: number | null;
  deliverable: Deliverable | null;
  createdAt: string;
  updatedAt: string;
}

export type TaskProgressPatch = Partial<
  Pick<Task, 'completedSteps' | 'selectedAgentId' | 'subtasks' | 'bids' | 'verificationScore' | 'deliverable'>
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

export interface WorkspaceSnapshot {
  agents: Agent[];
  tasks: Task[];
  transactions: Transaction[];
  settings: WorkspaceSettings;
}

export interface NewTaskInput {
  title: string;
  description: string;
  budgetUsd: number;
  deadline: string;
  specialization: Specialization;
  skills: string[];
  preferredAgentId: string | null;
}
