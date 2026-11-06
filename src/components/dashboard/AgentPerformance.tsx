import { Star } from 'lucide-react';
import { Panel } from '@/components/ui/Panel';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { AgentAvatar } from '@/components/agents/AgentAvatar';
import type { Agent, Task } from '@/types/domain';

interface AgentPerformanceProps {
  agents: Agent[];
  tasks: Task[];
  onOpenMarketplace: () => void;
}

export function AgentPerformance({ agents, tasks, onOpenMarketplace }: AgentPerformanceProps) {
  const ranked = [...agents].sort((a, b) => b.reputation - a.reputation).slice(0, 5);

  return (
    <Panel className="flex flex-col">
      <div className="flex items-center justify-between gap-4 border-b border-white/[0.06] px-6 py-4">
        <div>
          <h2 className="font-display text-lg font-semibold text-white">Agent performance</h2>
          <p className="text-sm text-slate-400">Top agents by reputation across the marketplace</p>
        </div>
        <button type="button" onClick={onOpenMarketplace} className="text-sm font-medium text-blue-300 transition hover:text-blue-200">
          View all
        </button>
      </div>
      <ul className="grid gap-px bg-white/[0.04] md:grid-cols-2 xl:grid-cols-1">
        {ranked.map((agent) => {
          const assigned = tasks.filter((task) => task.selectedAgentId === agent.id).length;
          return (
            <li key={agent.id} className="flex items-center gap-4 bg-ink-800/80 px-6 py-4">
              <AgentAvatar category={agent.category} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-sm font-medium text-white">{agent.name}</p>
                  <span className="flex items-center gap-1 text-sm font-semibold text-white">
                    <Star className="h-3.5 w-3.5 fill-amber-300 text-amber-300" />
                    {agent.reputation}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <ProgressBar value={agent.reputation} label={`${agent.name} reputation`} tone="blue" />
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  {agent.completedJobs.toLocaleString('en-US')} jobs completed · {assigned} on your tasks
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
