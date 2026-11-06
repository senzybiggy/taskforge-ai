import { planSubtasks } from '@/lib/coordinator/engine';
import type { Agent, Task, Transaction, WorkspaceSettings } from '@/types/domain';

export interface WorkspaceSnapshot {
  agents: Agent[];
  tasks: Task[];
  transactions: Transaction[];
  settings: WorkspaceSettings;
}

const DAY_MS = 86400000;

function daysAgo(days: number, hours = 0): string {
  return new Date(Date.now() - days * DAY_MS - hours * 3600000).toISOString();
}

export function createSeedWorkspace(): WorkspaceSnapshot {
  const agents: Agent[] = [
    {
      id: 'agt-atlas', name: 'Atlas Research', category: 'Research',
      tagline: 'Source-verified briefs in hours',
      description: 'Deep web and on-chain research that cites every claim. Strong on competitive landscapes, protocol analysis and due diligence memos.',
      reputation: 96, completedJobs: 1842, basePriceUsd: 420, avgDeliveryDays: 2, isOnline: true,
    },
    {
      id: 'agt-quill', name: 'Quill Scribe', category: 'Content Writing',
      tagline: 'Long-form writing with a sharp voice',
      description: 'Articles, documentation and newsletters tailored to developer audiences. Includes SEO outline and editorial review.',
      reputation: 91, completedJobs: 1260, basePriceUsd: 260, avgDeliveryDays: 2, isOnline: true,
    },
    {
      id: 'agt-lattice', name: 'Lattice Analyst', category: 'Data Analysis',
      tagline: 'Dashboards that answer the question',
      description: 'Cleans, models and visualizes on-chain and market data. Delivers reproducible notebooks and a plain-language summary.',
      reputation: 94, completedJobs: 977, basePriceUsd: 610, avgDeliveryDays: 3, isOnline: true,
    },
    {
      id: 'agt-forge', name: 'Forge Engineer', category: 'Development',
      tagline: 'Production-ready front ends and APIs',
      description: 'Full-stack implementation with tests, typed interfaces and deployment notes. Specializes in React, TypeScript and Rust tooling.',
      reputation: 89, completedJobs: 705, basePriceUsd: 1150, avgDeliveryDays: 5, isOnline: true,
    },
    {
      id: 'agt-pixel', name: 'Pixel Muse', category: 'Design',
      tagline: 'Interfaces that feel premium',
      description: 'Product design, brand systems and high-fidelity UI kits. Delivers component specs ready for engineering handoff.',
      reputation: 87, completedJobs: 530, basePriceUsd: 480, avgDeliveryDays: 4, isOnline: true,
    },
    {
      id: 'agt-vault', name: 'Vault Auditor', category: 'Smart Contracts',
      tagline: 'Security reviews before mainnet',
      description: 'Manual and tool-assisted audits of contracts with severity-ranked findings, proofs of concept and remediation checks.',
      reputation: 97, completedJobs: 412, basePriceUsd: 1900, avgDeliveryDays: 6, isOnline: true,
    },
    {
      id: 'agt-signal', name: 'Signal Scout', category: 'Market Intelligence',
      tagline: 'Weekly ecosystem signal reports',
      description: 'Tracks launches, funding and community momentum across Web3 ecosystems and turns them into concise, sourced briefings.',
      reputation: 84, completedJobs: 689, basePriceUsd: 330, avgDeliveryDays: 2, isOnline: true,
    },
    {
      id: 'agt-ledger', name: 'Ledger Ops', category: 'Operations',
      tagline: 'Reconciliation and reporting, automated',
      description: 'Automates recurring operational workflows: reconciliations, invoice checks and monthly reporting with audit trails.',
      reputation: 79, completedJobs: 298, basePriceUsd: 240, avgDeliveryDays: 1, isOnline: false,
    },
  ];

  const tasks: Task[] = [
    {
      id: 'tsk-lending', title: 'Competitive landscape report for NEAR DeFi lending',
      description: 'Map the top lending protocols on NEAR, compare collateral models, rates and risk controls, and summarize the gaps we could fill with a new product. Include sources for every claim.',
      budgetUsd: 1200, deadline: '2026-10-20', specialization: 'Research', preferredAgentId: null,
      selectedAgentId: 'agt-atlas', completedSteps: 8,
      subtasks: planSubtasks({ id: 'tsk-lending', specialization: 'Research' }),
      bids: [
        { agentId: 'agt-atlas', amountUsd: 980, etaDays: 2, score: 92 },
        { agentId: 'agt-signal', amountUsd: 1050, etaDays: 3, score: 71 },
      ],
      verificationScore: 94, createdAt: daysAgo(12), updatedAt: daysAgo(9),
    },
    {
      id: 'tsk-staking', title: 'Security review for the staking contract before mainnet',
      description: 'Audit the staking module for reentrancy, reward math and access control issues. Deliver a severity-ranked findings report with reproduction steps.',
      budgetUsd: 1600, deadline: '2026-12-01', specialization: 'Smart Contracts', preferredAgentId: null,
      selectedAgentId: null, completedSteps: 4,
      subtasks: planSubtasks({ id: 'tsk-staking', specialization: 'Smart Contracts' }),
      bids: [{ agentId: 'agt-vault', amountUsd: 1480, etaDays: 6, score: 84 }],
      verificationScore: null, createdAt: daysAgo(3), updatedAt: daysAgo(1),
    },
    {
      id: 'tsk-blog', title: 'Launch blog series on account abstraction',
      description: 'Write a three-part series explaining account abstraction on NEAR for developers new to the topic, with code examples reviewed by an engineer.',
      budgetUsd: 600, deadline: '2026-11-20', specialization: 'Content Writing', preferredAgentId: null,
      selectedAgentId: 'agt-quill', completedSteps: 7,
      subtasks: planSubtasks({ id: 'tsk-blog', specialization: 'Content Writing' }),
      bids: [
        { agentId: 'agt-quill', amountUsd: 540, etaDays: 2, score: 90 },
        { agentId: 'agt-signal', amountUsd: 510, etaDays: 2, score: 63 },
      ],
      verificationScore: 91, createdAt: daysAgo(2), updatedAt: daysAgo(0, 2),
    },
  ];

  const transactions: Transaction[] = [
    { id: 'txn-0001', taskId: 'tsk-lending', agentId: 'agt-atlas', amountUsd: 980, status: 'approved', createdAt: daysAgo(9), decidedAt: daysAgo(8) },
    { id: 'txn-0002', taskId: 'tsk-blog', agentId: 'agt-quill', amountUsd: 540, status: 'pending_approval', createdAt: daysAgo(0, 2), decidedAt: null },
  ];

  return {
    agents,
    tasks,
    transactions,
    settings: { workspaceName: 'TaskForge Workspace', budgetPoolUsd: 5000 },
  };
}
