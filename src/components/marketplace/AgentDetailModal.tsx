import type { ReactNode } from 'react';
import { Clock, Layers, Star, Trophy } from 'lucide-react';
import { AgentAvatar } from '@/components/agents/AgentAvatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { formatUsd } from '@/lib/format';
import type { Agent } from '@/types/domain';

interface AgentDetailModalProps {
  agent: Agent | null;
  selected: boolean;
  onClose: () => void;
  onToggleSelect: (agent: Agent) => void;
  onHire: (agent: Agent) => void;
}

export function AgentDetailModal({ agent, selected, onClose, onToggleSelect, onHire }: AgentDetailModalProps) {
  return (
    <Modal
      open={agent !== null}
      onClose={onClose}
      size="lg"
      title={agent?.name ?? ''}
      description={agent?.tagline}
      footer={
        agent && (
          <>
            <Button variant="secondary" onClick={() => onToggleSelect(agent)} disabled={!agent.isOnline && !selected}>
              {selected ? 'Remove from selection' : 'Select agent'}
            </Button>
            <Button onClick={() => onHire(agent)} disabled={!agent.isOnline}>
              Hire for a new task
            </Button>
          </>
        )
      }
    >
      {agent && (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <AgentAvatar category={agent.category} size="lg" />
            <div className="flex flex-wrap gap-2">
              <Badge tone="blue">{agent.category}</Badge>
              <Badge tone={agent.isOnline ? 'emerald' : 'neutral'} dot>
                {agent.isOnline ? 'Accepting work' : 'Offline'}
              </Badge>
            </div>
          </div>

          <p className="text-sm leading-relaxed text-slate-300">{agent.description}</p>

          <div className="grid gap-4 sm:grid-cols-3">
            <Stat icon={<Star className="h-4 w-4 fill-amber-300 text-amber-300" />} label="Reputation score" value={`${agent.reputation} / 100`} />
            <Stat icon={<Trophy className="h-4 w-4 text-blue-300" />} label="Completed jobs" value={agent.completedJobs.toLocaleString('en-US')} />
            <Stat icon={<Clock className="h-4 w-4 text-blue-300" />} label="Typical delivery" value={`${agent.avgDeliveryDays} day${agent.avgDeliveryDays === 1 ? '' : 's'}`} />
          </div>

          <div className="rounded-2xl border border-white/[0.07] bg-ink-950/40 p-5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Reputation</span>
              <span className="font-medium text-white">{agent.reputation}%</span>
            </div>
            <div className="mt-3">
              <ProgressBar value={agent.reputation} label="Reputation" />
            </div>
            <div className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-5">
              <span className="flex items-center gap-2 text-sm text-slate-400">
                <Layers className="h-4 w-4" />
                Indicative price per job
              </span>
              <span className="font-display text-xl font-semibold text-white">{formatUsd(agent.basePriceUsd)}</span>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Final bids depend on your brief and budget. The coordinator compares real bids before any agent is paid.
            </p>
          </div>
        </div>
      )}
    </Modal>
  );
}

function Stat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
      <p className="flex items-center gap-2 text-xs text-slate-500">
        {icon}
        {label}
      </p>
      <p className="mt-2 font-display text-lg font-semibold text-white">{value}</p>
    </div>
  );
}
