import type { ReactNode } from 'react';
import { Check, Clock, Star } from 'lucide-react';
import { AgentAvatar } from '@/components/agents/AgentAvatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatUsd } from '@/lib/format';
import type { Agent } from '@/types/domain';

interface AgentCardProps {
  agent: Agent;
  selected: boolean;
  onSelect: () => void;
  onDetails: () => void;
}

export function AgentCard({ agent, selected, onSelect, onDetails }: AgentCardProps) {
  return (
    <article
      className={`group relative flex flex-col gap-5 overflow-hidden rounded-2xl border p-6 transition duration-300 hover:-translate-y-1 ${
        selected
          ? 'border-blue-400/50 bg-blue-500/[0.07] shadow-[0_20px_50px_-20px_rgba(59,130,246,0.6)]'
          : 'border-white/[0.07] bg-gradient-to-b from-ink-700/60 to-ink-800/80 hover:border-white/15 hover:shadow-[0_24px_50px_-24px_rgba(0,0,0,0.9)]'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <AgentAvatar category={agent.category} size="lg" />
        <div className="flex flex-col items-end gap-2">
          {selected && <Badge tone="blue">Selected</Badge>}
          {agent.isDemo && <Badge tone="neutral">Demo agent</Badge>}
          <Badge tone={agent.isOnline ? 'emerald' : 'neutral'} dot>
            {agent.isOnline ? 'Online' : 'Offline'}
          </Badge>
        </div>
      </div>

      <div>
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-blue-300/80">{agent.category}</p>
        <h3 className="mt-1 font-display text-lg font-semibold text-white">{agent.name}</h3>
        <p className="mt-1.5 text-sm text-slate-400">{agent.tagline}</p>
        {agent.skills.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {agent.skills.map((skill) => (
              <span key={skill} className="rounded-full bg-white/[0.04] px-2.5 py-0.5 text-[11px] font-medium text-slate-300 ring-1 ring-inset ring-white/10">
                {skill}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 rounded-xl border border-white/[0.06] bg-ink-950/40 p-3">
        <Metric icon={<Star className="h-3.5 w-3.5 fill-amber-300 text-amber-300" />} label="Reputation" value={String(agent.reputation)} />
        <Metric label="Jobs" value={agent.completedJobs.toLocaleString('en-US')} />
        <Metric icon={<Clock className="h-3.5 w-3.5 text-slate-500" />} label="Delivery" value={`${agent.avgDeliveryDays}d`} />
      </div>

      <div className="mt-auto flex items-end justify-between gap-4">
        <div>
          <p className="text-xs text-slate-500">Indicative price</p>
          <p className="font-display text-xl font-semibold text-white">
            {formatUsd(agent.basePriceUsd)}
            <span className="ml-1 text-xs font-normal text-slate-500">per job</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onDetails}>
            Details
          </Button>
          <Button
            variant={selected ? 'success' : 'secondary'}
            size="sm"
            onClick={onSelect}
            disabled={!agent.isOnline && !selected}
            icon={selected ? <Check className="h-3.5 w-3.5" /> : undefined}
            aria-pressed={selected}
          >
            {selected ? 'Selected' : 'Select'}
          </Button>
        </div>
      </div>
    </article>
  );
}

function Metric({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-1 text-[11px] uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-white">
        {icon}
        {value}
      </p>
    </div>
  );
}
