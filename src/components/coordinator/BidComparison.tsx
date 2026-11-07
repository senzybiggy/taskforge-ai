import { Check, Star, Trophy } from 'lucide-react';
import { AgentAvatar } from '@/components/agents/AgentAvatar';
import { Badge } from '@/components/ui/Badge';
import { Panel } from '@/components/ui/Panel';
import { formatUsd } from '@/lib/format';
import { SCORE_WEIGHTS } from '@/lib/coordinator/engine';
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

const SUMMARY = `Ranked by skill match (${Math.round(SCORE_WEIGHTS.skill * 100)}%), reputation (${Math.round(SCORE_WEIGHTS.reputation * 100)}%), price (${Math.round(SCORE_WEIGHTS.price * 100)}%) and delivery time (${Math.round(SCORE_WEIGHTS.speed * 100)}%).`;

export function BidComparison({ bids, agentById, pickedAgentId, chosenAgentId, recommendedAgentId, interactive, onPick }: BidComparisonProps) {
  return (
    <Panel className="p-6 sm:p-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-lg font-semibold text-white">Bid comparison</h2>
            <Badge tone="amber">Simulated bids</Badge>
          </div>
          <p className="mt-1 text-sm text-slate-400">{SUMMARY}</p>
          <p className="mt-1 text-xs text-slate-500">Bids come from demo agents. No real agent work or payment is involved.</p>
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
          const rowClass = `flex w-full flex-col gap-4 rounded-xl border p-4 text-left transition duration-200 lg:flex-row lg:items-center ${
            picked || chosen
              ? 'border-blue-400/50 bg-blue-500/[0.08] shadow-[0_0_0_1px_rgba(96,165,250,0.2)]'
              : 'border-white/[0.07] bg-ink-900/50'
          } ${interactive ? 'cursor-pointer hover:border-blue-400/30 hover:bg-white/[0.04]' : ''}`;

          const content = (
            <>
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-xs font-semibold text-slate-300">
                  {index + 1}
                </span>
                <AgentAvatar category={agent.category} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-medium text-white">{agent.name}</p>
                    {agent.isDemo && <Badge tone="neutral">Demo agent</Badge>}
                    {recommended && (
                      <Badge tone="blue">
                        <Trophy className="h-3 w-3" />
                        Recommended
                      </Badge>
                    )}
                    {chosen && <Badge tone="emerald">Selected</Badge>}
                  </div>
                  <p className="truncate text-xs text-slate-500">{agent.category}</p>
                  {bid.matchedSkills.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {bid.matchedSkills.map((skill) => (
                        <span key={skill} className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-200 ring-1 ring-inset ring-emerald-400/25">
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4 lg:w-[460px] lg:shrink-0">
                <div>
                  <dt className="text-xs text-slate-500">Price</dt>
                  <dd className="font-medium text-white">{formatUsd(bid.amountUsd)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Delivery</dt>
                  <dd className="font-medium text-white">{bid.etaDays}d</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Reputation</dt>
                  <dd className="flex items-center gap-1.5 font-medium text-white">
                    <Star className="h-3.5 w-3.5 text-amber-300" />
                    {agent.reputation}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Match score</dt>
                  <dd className="font-medium text-white">{bid.score ?? '--'}</dd>
                  <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-white/[0.07]" aria-hidden="true">
                    <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-300 transition-[width] duration-700" style={{ width: `${Math.min(100, score)}%` }} />
                  </div>
                </div>
              </dl>

              {interactive && (
                <span
                  className={`hidden h-5 w-5 shrink-0 items-center justify-center rounded-full ring-1 ring-inset lg:flex ${
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
