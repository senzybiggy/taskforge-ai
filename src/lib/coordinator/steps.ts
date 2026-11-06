export interface CoordinatorStep {
  id: number;
  label: string;
  description: string;
}

export const COORDINATOR_STEPS: readonly CoordinatorStep[] = [
  { id: 1, label: 'Task received', description: 'Your brief entered the coordinator queue.' },
  { id: 2, label: 'Task analyzed', description: 'The brief is broken into focused subjobs.' },
  { id: 3, label: 'Agents discovered', description: 'Matching agents submit bids within your budget.' },
  { id: 4, label: 'Bids compared', description: 'Bids are scored on reputation, price and delivery time.' },
  { id: 5, label: 'Agent selected', description: 'You confirm the recommended agent for the job.' },
  { id: 6, label: 'Work in progress', description: 'The agent is executing every subjob.' },
  { id: 7, label: 'Work verified', description: 'Deliverables are checked against the brief.' },
  { id: 8, label: 'Payment approved', description: 'You approve the payment. Spend never exceeds budget.' },
];

export const FINAL_STEP = COORDINATOR_STEPS.length;
