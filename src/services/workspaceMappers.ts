import type {
  Agent,
  Bid,
  Deliverable,
  Specialization,
  Subtask,
  Task,
  Transaction,
  TransactionStatus,
  WorkspaceSettings,
} from '@/types/domain';

export interface AgentRow {
  id: string;
  name: string;
  category: Specialization;
  tagline: string;
  description: string;
  reputation: number;
  completed_jobs: number;
  base_price_usd: number | string;
  avg_delivery_days: number;
  is_online: boolean;
  skills: string[] | null;
  is_demo: boolean;
}

export interface TaskRow {
  id: string;
  title: string;
  description: string;
  budget_usd: number | string;
  deadline: string;
  specialization: Specialization;
  skills: string[] | null;
  preferred_agent_id: string | null;
  selected_agent_id: string | null;
  completed_steps: number;
  subtasks: unknown;
  bids: unknown;
  verification_score: number | null;
  deliverable: unknown;
  created_at: string;
  updated_at: string;
}

export interface TransactionRow {
  id: string;
  task_id: string;
  agent_id: string;
  amount_usd: number | string;
  status: TransactionStatus;
  created_at: string;
  decided_at: string | null;
  near_tx_hash: string | null;
  near_sender: string | null;
  near_recipient: string | null;
  near_amount_near: string | null;
  near_network: string | null;
}

export interface SettingsRow {
  workspace_name: string;
  budget_pool_usd: number | string;
}

export function mapAgent(row: AgentRow): Agent {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    tagline: row.tagline,
    description: row.description,
    reputation: row.reputation,
    completedJobs: row.completed_jobs,
    basePriceUsd: Number(row.base_price_usd),
    avgDeliveryDays: row.avg_delivery_days,
    isOnline: row.is_online,
    skills: row.skills ?? [],
    isDemo: row.is_demo,
  };
}

function isDeliverable(value: unknown): value is Deliverable {
  return typeof value === 'object' && value !== null && Array.isArray((value as Deliverable).projects);
}

function mapBid(raw: unknown): Bid {
  const bid = raw as Partial<Bid>;
  return {
    agentId: String(bid.agentId),
    amountUsd: Number(bid.amountUsd),
    etaDays: Number(bid.etaDays),
    score: typeof bid.score === 'number' ? bid.score : null,
    matchedSkills: Array.isArray(bid.matchedSkills) ? bid.matchedSkills : [],
    skillMatch: typeof bid.skillMatch === 'number' ? bid.skillMatch : 0,
  };
}

export function mapTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    budgetUsd: Number(row.budget_usd),
    deadline: row.deadline,
    specialization: row.specialization,
    skills: row.skills ?? [],
    preferredAgentId: row.preferred_agent_id,
    selectedAgentId: row.selected_agent_id,
    completedSteps: row.completed_steps,
    subtasks: Array.isArray(row.subtasks) ? (row.subtasks as Subtask[]) : [],
    bids: Array.isArray(row.bids) ? row.bids.map(mapBid) : [],
    verificationScore: row.verification_score,
    deliverable: isDeliverable(row.deliverable) ? row.deliverable : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    taskId: row.task_id,
    agentId: row.agent_id,
    amountUsd: Number(row.amount_usd),
    status: row.status,
    createdAt: row.created_at,
    decidedAt: row.decided_at,
    nearTxHash: row.near_tx_hash,
    nearSender: row.near_sender,
    nearRecipient: row.near_recipient,
    nearAmountNear: row.near_amount_near,
    nearNetwork: row.near_network,
  };
}

export function mapSettings(row: SettingsRow): WorkspaceSettings {
  return {
    workspaceName: row.workspace_name,
    budgetPoolUsd: Number(row.budget_pool_usd),
  };
}
