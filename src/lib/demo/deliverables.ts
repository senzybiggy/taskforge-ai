import {
  NEAR_AGENT_ECONOMY_COMPARISON,
  NEAR_AGENT_ECONOMY_PROJECTS,
  NEAR_AGENT_ECONOMY_RECOMMENDATIONS,
} from '@/lib/demo/nearAgentEconomyDossier';
import type { Agent, Deliverable, DeliverableSource, Task } from '@/types/domain';

export const SIMULATED_DELIVERABLE_DISCLAIMER =
  'Simulated demo deliverable produced by a demo agent inside TaskForge AI. No live agent work was performed and no NEAR transaction is sent.';

function uniqueSources(sources: DeliverableSource[]): DeliverableSource[] {
  const seen = new Map<string, DeliverableSource>();
  sources.forEach((source) => seen.set(source.url, source));
  return [...seen.values()];
}

function buildResearchDeliverable(task: Task, agent: Agent, generatedAt: string): Deliverable {
  return {
    title: `NEAR Agent Economy dossier: ${task.title}`,
    agentName: agent.name,
    generatedAt,
    reviewedAt: null,
    summary: `This simulated dossier reviews ${NEAR_AGENT_ECONOMY_PROJECTS.length} NEAR Agent Economy projects. It explains what each one does, compares strengths and weaknesses, and closes with recommendations for the brief: ${task.description}`,
    method: [
      'Collected public announcements and documentation from NEAR AI, NEAR Docs and partner pages.',
      'Profiled each project by its stated function, then noted strengths and weaknesses from the sources.',
      'Did not run, test or independently audit any project. Most sources are vendor-published.',
    ],
    projects: NEAR_AGENT_ECONOMY_PROJECTS,
    comparison: NEAR_AGENT_ECONOMY_COMPARISON,
    recommendations: NEAR_AGENT_ECONOMY_RECOMMENDATIONS,
    sources: uniqueSources(NEAR_AGENT_ECONOMY_PROJECTS.map((project) => project.source)),
    disclaimer: SIMULATED_DELIVERABLE_DISCLAIMER,
  };
}

function buildGenericDeliverable(task: Task, agent: Agent, generatedAt: string): Deliverable {
  return {
    title: `${task.specialization} work package: ${task.title}`,
    agentName: agent.name,
    generatedAt,
    reviewedAt: null,
    summary: `This simulated work package outlines how ${agent.name} would address the brief. It covers each planned subjob and lists the required skills.`,
    method: task.subtasks.map((subtask) => `${subtask.title}: ${subtask.description}`),
    projects: [],
    comparison: [],
    recommendations: [
      `Check the outcome against the acceptance criteria in your brief: ${task.description}`,
      'Review the work before approving any payment.',
    ],
    sources: [],
    disclaimer: SIMULATED_DELIVERABLE_DISCLAIMER,
  };
}

export function buildDeliverable(task: Task, agent: Agent): Deliverable {
  const generatedAt = new Date().toISOString();
  return task.specialization === 'Research'
    ? buildResearchDeliverable(task, agent, generatedAt)
    : buildGenericDeliverable(task, agent, generatedAt);
}
