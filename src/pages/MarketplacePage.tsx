import { useMemo, useState } from 'react';
import { Search, SlidersHorizontal, UserCheck, X } from 'lucide-react';
import { AgentCard } from '@/components/marketplace/AgentCard';
import { AgentDetailModal } from '@/components/marketplace/AgentDetailModal';
import { AgentAvatar } from '@/components/agents/AgentAvatar';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { SelectInput, TextInput } from '@/components/ui/Field';
import { useAppData } from '@/hooks/useAppData';
import { filterAgents, type AgentFilters, type AgentSort } from '@/lib/agentFilters';
import { SPECIALIZATIONS, type Agent, type Specialization } from '@/types/domain';
import type { TaskDraft } from '@/components/tasks/CreateTaskModal';

interface MarketplacePageProps {
  onHire: (draft: TaskDraft) => void;
}

const DEFAULT_FILTERS: AgentFilters = { query: '', category: 'All', onlineOnly: false, sort: 'reputation' };

export function MarketplacePage({ onHire }: MarketplacePageProps) {
  const { agents } = useAppData();
  const [filters, setFilters] = useState<AgentFilters>(DEFAULT_FILTERS);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [detailAgent, setDetailAgent] = useState<Agent | null>(null);

  const visible = useMemo(() => filterAgents(agents, filters), [agents, filters]);
  const selectedAgents = agents.filter((agent) => selectedIds.includes(agent.id));
  const hasActiveFilters = filters.query !== '' || filters.category !== 'All' || filters.onlineOnly;

  const toggleSelect = (agent: Agent) => {
    setSelectedIds((current) =>
      current.includes(agent.id) ? current.filter((id) => id !== agent.id) : [...current, agent.id],
    );
  };

  const updateFilter = <K extends keyof AgentFilters>(key: K, value: AgentFilters[K]) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const hireAgent = (agent: Agent) => {
    setDetailAgent(null);
    onHire({ specialization: agent.category, preferredAgentId: agent.id });
  };

  return (
    <div className="flex flex-col gap-6 pb-24">
      <section className="flex flex-col gap-4 rounded-2xl border border-white/[0.07] bg-ink-800/60 p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <TextInput
              type="search"
              aria-label="Search agents"
              placeholder="Search by name, specialty or capability"
              value={filters.query}
              onChange={(event) => updateFilter('query', event.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-3">
            <SlidersHorizontal className="h-4 w-4 shrink-0 text-slate-500" />
            <SelectInput
              aria-label="Sort agents"
              value={filters.sort}
              onChange={(event) => updateFilter('sort', event.target.value as AgentSort)}
              className="w-full lg:w-52"
            >
              <option value="reputation" className="bg-ink-900">Highest reputation</option>
              <option value="jobs" className="bg-ink-900">Most completed jobs</option>
              <option value="price" className="bg-ink-900">Lowest price</option>
            </SelectInput>
            <label className="flex shrink-0 cursor-pointer items-center gap-2 rounded-xl border border-white/10 px-3.5 py-2.5 text-sm text-slate-300 transition hover:border-white/20">
              <input
                type="checkbox"
                checked={filters.onlineOnly}
                onChange={(event) => updateFilter('onlineOnly', event.target.checked)}
                className="h-4 w-4 accent-blue-500"
              />
              Online only
            </label>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by specialization">
          {(['All', ...SPECIALIZATIONS] as const).map((category) => {
            const active = filters.category === category;
            return (
              <button
                key={category}
                type="button"
                aria-pressed={active}
                onClick={() => updateFilter('category', category as Specialization | 'All')}
                className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-200 ${
                  active
                    ? 'bg-blue-500 text-white shadow-[0_6px_18px_-6px_rgba(59,130,246,0.9)]'
                    : 'bg-white/[0.04] text-slate-400 ring-1 ring-inset ring-white/10 hover:bg-white/[0.08] hover:text-slate-100'
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>
      </section>

      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>
          Showing <span className="text-slate-200">{visible.length}</span> of {agents.length} agents
        </span>
        {hasActiveFilters && (
          <button type="button" onClick={() => setFilters(DEFAULT_FILTERS)} className="flex items-center gap-1 text-blue-300 hover:text-blue-200">
            <X className="h-3.5 w-3.5" />
            Clear filters
          </button>
        )}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No agents match these filters"
          description="Try a different specialization, clear the search or include offline agents."
          action={<Button variant="secondary" onClick={() => setFilters(DEFAULT_FILTERS)}>Reset filters</Button>}
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((agent, index) => (
            <div key={agent.id} className="animate-rise-in" style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}>
              <AgentCard
                agent={agent}
                selected={selectedIds.includes(agent.id)}
                onSelect={() => toggleSelect(agent)}
                onDetails={() => setDetailAgent(agent)}
              />
            </div>
          ))}
        </div>
      )}

      {selectedAgents.length > 0 && (
        <div className="fixed inset-x-4 bottom-4 z-30 mx-auto flex max-w-3xl animate-scale-in flex-col gap-3 rounded-2xl border border-blue-400/25 bg-ink-800/95 p-4 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex -space-x-2">
              {selectedAgents.slice(0, 3).map((agent) => (
                <span key={agent.id} className="rounded-xl ring-2 ring-ink-800">
                  <AgentAvatar category={agent.category} size="sm" />
                </span>
              ))}
            </div>
            <p className="truncate text-sm text-slate-300">
              <span className="font-semibold text-white">{selectedAgents.length}</span> agent{selectedAgents.length === 1 ? '' : 's'} selected
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSelectedIds([])}>
              Clear
            </Button>
            <Button
              size="sm"
              icon={<UserCheck className="h-4 w-4" />}
              onClick={() => {
                const first = selectedAgents[0];
                onHire({ specialization: first.category, preferredAgentId: first.id });
              }}
            >
              Hire {selectedAgents[0].name}
            </Button>
          </div>
        </div>
      )}

      <AgentDetailModal
        agent={detailAgent}
        selected={detailAgent ? selectedIds.includes(detailAgent.id) : false}
        onClose={() => setDetailAgent(null)}
        onToggleSelect={toggleSelect}
        onHire={hireAgent}
      />
    </div>
  );
}
