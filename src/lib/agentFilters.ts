import type { Agent, Specialization } from '@/types/domain';

export type AgentSort = 'reputation' | 'price' | 'jobs';

export interface AgentFilters {
  query: string;
  category: Specialization | 'All';
  onlineOnly: boolean;
  sort: AgentSort;
}

export function filterAgents(agents: Agent[], filters: AgentFilters): Agent[] {
  const query = filters.query.trim().toLowerCase();
  const matches = agents.filter((agent) => {
    if (filters.category !== 'All' && agent.category !== filters.category) return false;
    if (filters.onlineOnly && !agent.isOnline) return false;
    if (!query) return true;
    return [agent.name, agent.category, agent.tagline, agent.description].some((field) =>
      field.toLowerCase().includes(query),
    );
  });

  return matches.sort((a, b) => {
    switch (filters.sort) {
      case 'price':
        return a.basePriceUsd - b.basePriceUsd;
      case 'jobs':
        return b.completedJobs - a.completedJobs;
      case 'reputation':
        return b.reputation - a.reputation;
    }
  });
}
