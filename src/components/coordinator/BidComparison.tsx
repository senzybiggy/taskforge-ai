import { Check, Star, Trophy } from 'lucide-react';
import { AgentAvatar } from '@/components/agents/AgentAvatar';
import { Badge } from '@/components/ui/Badge';
import { Panel } from '@/components/ui/Panel';
import { formatUsd } from '@/lib/format';
import type { Agent, Bid } from '@/types/domain';

interface BidComparisonProps {
  bids: Bid[];
  agentById: Map<string, Agent>;
  pickedAgentId: string | null;
  chosenAgentId: string | null;
  recommendedAgentId: string | null;
  interactive: boolean;
  onPick: (agentId: string) => void;
}

export function BidComparison({ bids, agentById, pickedAgentId, chosenAgentId, recommendedAgentId, interactive, onPick }: BidComparisonProps) {
  return (
    <Panel className="p-6 sm:p-7">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold text-white">Bid comparison</h2>
          <p className="text-sm text-slate-400">Ranked by reputation (50%), price (30%) and delivery speed (20%).</p>
        </div>
        <span className="text-xs text-slate-500">{bids.length} bid{bids.length === 1 ? '' : 's'}</span>
      </div>

      <ul className="mt-5 flex flex-col gap-3" aria-label="Agent bids">
        {bids.map((bid, index) => {
          const agent = agentById.get(bid.agentId);
          if (!agent) return null;
          const picked = pickedAgentId === bid.agentId;
          const chosen = chosenAgentId === bid.agentId;
          const recommended = recommendedAgentId === bid.agentId;
          const score = bid.score ?? 0;
          const rowClass = `flex w-full flex-col gap-4 rounded-xl border p-4 text-left transition duration-200 sm:flex-row sm:items-center ${
            picked || chosen
              ? 'border-blue-400/50 bg-blue-500/[0.08] shadow-[0_0_0_1px_rgba(96,165,250,0.2)]'
              : 'border-white/[0.07] bg-ink-900/50'
          } ${interactive ? 'cursor-pointer hover:border-blue-400/30 hover:bg-white/[0.04]' : ''}`;

          const content = (
            <>
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-xs font-semibold text-slate-300">
                  {index + 1}
                </span>
                <AgentAvatar category={agent.category} size="sm" />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-medium text-white">{agent.name}</p>
                    {recommended && (
                      <Badge tone="blue">
                        <Trophy className="h-3 w-3" />
                        Recommended
                      </Badge>
                    )}
                    {chosen && <Badge tone="emerald">Selected</Badge>}
                  </div>
                  <p className="truncate text-xs text-slate-500">{agent.category}</p>
                </div>
              </div>

              <dl className="grid grid-cols-3 gap-4 text-sm sm:w-[360px] sm:shrink-0">
                <div>
                  <dt className="text-xs text-slate-500">Price</dt>
                  <dd className="font-medium text-white">{formatUsd(bid.amountUsd)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Delivery</dt>
                  <dd className="font-medium text-white">{bid.etaDays}d</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Score</dt>
                  <dd className="flex items-center gap-1.5 font-medium text-white">
                    <Star className="h-3.5 w-3.5 text-amber-300" />
                    {bid.score ?? '--'}
                  </dd>
                  <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-white/[0.07]" aria-hidden="true">
                    <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-300 transition-[width] duration-700" style={{ width: `${Math.min(100, score)}%` }} />
                  </div>
                </div>
              </dl>

              {interactive && (
                <span
                  className={`hidden h-5 w-5 shrink-0 items-center justify-center rounded-full ring-1 ring-inset sm:flex ${
                    picked ? 'bg-blue-500 text-white ring-blue-300' : 'ring-white/20 text-transparent'
                  }`}
                  aria-hidden="true"
                >
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
              )}
            </>
          );

          return (
            <li key={bid.agentId}>
              {interactive ? (
                <button type="button" aria-pressed={picked} onClick={() => onPick(bid.agentId)} className={rowClass}>
                  {content}
                </button>
              ) : (
                <div className={rowClass}>{content}</div>
              )}
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
