import { ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Panel } from '@/components/ui/Panel';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { formatUsd } from '@/lib/format';
import type { BudgetSummary } from '@/lib/budget';

interface BudgetCardProps {
  budget: BudgetSummary;
  pendingApprovals: number;
  onManage: () => void;
}

function Row({ label, value, tone = 'text-white' }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-400">{label}</span>
      <span className={`font-medium ${tone}`}>{value}</span>
    </div>
  );
}

export function BudgetCard({ budget, pendingApprovals, onManage }: BudgetCardProps) {
  const committed = budget.reservedUsd + budget.spentUsd;
  const usedPercent = budget.poolUsd > 0 ? (committed / budget.poolUsd) * 100 : 0;

  return (
    <Panel className="flex flex-col gap-5 p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-400">Approved budget pool</p>
          <p className="mt-1 font-display text-3xl font-semibold tracking-tight text-white">{formatUsd(budget.poolUsd)}</p>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300 ring-1 ring-inset ring-emerald-400/25">
          <ShieldCheck className="h-3.5 w-3.5" />
          Capped
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs text-slate-500">
          <span>Committed</span>
          <span>{Math.round(usedPercent)}% used</span>
        </div>
        <ProgressBar value={usedPercent} label="Budget committed" tone="emerald" />
      </div>

      <div className="space-y-3 border-t border-white/[0.06] pt-5">
        <Row label="Available to spend" value={formatUsd(budget.availableUsd)} tone="text-emerald-300" />
        <Row label="Reserved for active tasks" value={formatUsd(budget.reservedUsd)} />
        <Row label="Approved payments" value={formatUsd(budget.spentUsd)} />
        <Row label="Awaiting your approval" value={`${pendingApprovals} request${pendingApprovals === 1 ? '' : 's'}`} tone={pendingApprovals > 0 ? 'text-amber-300' : 'text-white'} />
      </div>

      <p className="text-xs leading-relaxed text-slate-500">
        Agents can never be paid beyond a task budget, and every payment needs your explicit approval.
      </p>
      <Button variant="secondary" fullWidth onClick={onManage}>
        Manage budget
      </Button>
    </Panel>
  );
}
