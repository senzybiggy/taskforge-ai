import type { Agent, Bid, Subtask, Task, TaskProgressPatch } from '@/types/domain';
import { daysUntil } from '@/lib/format';
import { FINAL_STEP } from '@/lib/coordinator/steps';

const AUTOMATIC_STEPS = new Set([1, 2, 3, 5]);
const DEADLINE_MISS_MULTIPLIER = 0.7;
const PASS_SCORE = 80;

function unitHash(seed: string): number {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) % 10000) / 10000;
}

export function isAutomaticStep(completedSteps: number): boolean {
  return AUTOMATIC_STEPS.has(completedSteps);
}

export function isFinished(completedSteps: number): boolean {
  return completedSteps >= FINAL_STEP;
}

export function planSubtasks(task: Pick<Task, 'id' | 'specialization'>): Subtask[] {
  const plan = [
    { title: 'Scope and requirements', description: 'Clarify the brief, constraints and success criteria.' },
    { title: `${task.specialization} core work`, description: 'Execute the main deliverable against the brief.' },
    { title: 'Quality review', description: 'Check output against acceptance criteria and fix gaps.' },
    { title: 'Delivery package', description: 'Assemble the final deliverable and summary notes.' },
  ];
  return plan.map((item, index) => ({ id: `${task.id}-${index}`, ...item }));
}

export const SCORE_WEIGHTS = {
  skill: 0.35,
  reputation: 0.25,
  price: 0.25,
  speed: 0.15,
} as const;

export function discoverBids(task: Task, agents: Agent[]): Bid[] {
  return agents
    .filter((agent) => agent.isOnline && agent.category === task.specialization)
    .flatMap((agent) => {
      const matchedSkills = task.skills.filter((skill) => agent.skills.includes(skill));
      if (task.skills.length > 0 && matchedSkills.length === 0) return [];
      const variance = unitHash(`${agent.id}:${task.id}`);
      const rawAmount = agent.basePriceUsd * (0.88 + variance * 0.26);
      const amountUsd = Math.round(rawAmount / 10) * 10;
      const etaDays = Math.max(1, agent.avgDeliveryDays + Math.round(variance * 2));
      const skillMatch = task.skills.length === 0 ? 1 : matchedSkills.length / task.skills.length;
      return [{ agentId: agent.id, amountUsd, etaDays, score: null, matchedSkills, skillMatch }];
    })
    .filter((bid) => bid.amountUsd <= task.budgetUsd)
    .sort((a, b) => a.amountUsd - b.amountUsd);
}

export function scoreBids(task: Task, agents: Agent[], bids: Bid[]): Bid[] {
  const eligible = bids.filter((bid) => bid.amountUsd <= task.budgetUsd);
  if (eligible.length === 0) return [];

  const minAmount = Math.min(...eligible.map((bid) => bid.amountUsd));
  const minEta = Math.min(...eligible.map((bid) => bid.etaDays));
  const daysLeft = daysUntil(task.deadline);

  return eligible
    .flatMap((bid) => {
      const agent = agents.find((candidate) => candidate.id === bid.agentId);
      if (!agent) return [];
      const reputationScore = agent.reputation / 100;
      const priceScore = minAmount / bid.amountUsd;
      const speedScore = minEta / bid.etaDays;
      const raw =
        100 *
        (SCORE_WEIGHTS.skill * bid.skillMatch +
          SCORE_WEIGHTS.reputation * reputationScore +
          SCORE_WEIGHTS.price * priceScore +
          SCORE_WEIGHTS.speed * speedScore);
      const deadlineFactor = bid.etaDays <= daysLeft ? 1 : DEADLINE_MISS_MULTIPLIER;
      return [{ ...bid, score: Math.round(raw * deadlineFactor) }];
    })
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0) || b.skillMatch - a.skillMatch);
}


export function recommendedBid(bids: Bid[]): Bid | undefined {
  return bids.find((bid) => bid.score !== null) ?? bids[0];
}

export function verifyDeliverable(task: Pick<Task, 'id'>): number {
  return 85 + Math.round(unitHash(`${task.id}:verify`) * 13);
}

export function passesVerification(score: number | null): boolean {
  return score !== null && score >= PASS_SCORE;
}

export function nextAutomaticPatch(task: Task, agents: Agent[]): TaskProgressPatch | null {
  switch (task.completedSteps) {
    case 1:
      return { subtasks: planSubtasks(task), completedSteps: 2 };
    case 2: {
      const bids = discoverBids(task, agents);
      return bids.length === 0 ? null : { bids, completedSteps: 3 };
    }
    case 3: {
      const bids = scoreBids(task, agents, task.bids);
      return bids.length === 0 ? null : { bids, completedSteps: 4 };
    }
    case 5:
      return { completedSteps: 6 };
    default:
      return null;
  }
}
