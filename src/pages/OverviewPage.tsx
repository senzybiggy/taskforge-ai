import { ArrowRight, Bot, Sparkles } from 'lucide-react';
import { StatsGrid } from '@/components/dashboard/StatsGrid';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { AgentPerformance } from '@/components/dashboard/AgentPerformance';
import { BudgetCard } from '@/components/dashboard/BudgetCard';
import { Button } from '@/components/ui/Button';
import { useAppData } from '@/hooks/useAppData';
import { approvedVolume, countActiveTasks, countCompletedTasks } from '@/lib/dashboardStats';
import type { Route } from '@/lib/routes';
import { summarizeBudget } from '@/lib/budget';

interface OverviewPageProps {
  navigate: (route: Route) => void;
  onCreateTask: () => void;
}

export function OverviewPage({ navigate, onCreateTask }: OverviewPageProps) {
  const { agents, tasks, transactions, settings } = useAppData();
  if (!settings) return null;

  const budget = summarizeBudget(settings, tasks, transactions);
  const pendingApprovals = transactions.filter((tx) => tx.status === 'pending_approval').length;

  return (
    <div className="flex flex-col gap-8">
      <section className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-ink-700 via-ink-800 to-ink-900 p-6 sm:p-10">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(96,165,250,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(96,165,250,0.06)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_top_right,black,transparent_70%)]" />
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-500/25 blur-3xl animate-pulse-ring" />
        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-400/25 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-200">
              <Sparkles className="h-3.5 w-3.5" />
              Autonomous coordinator
            </span>
            <h2 className="mt-5 font-display text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl">
              Describe the work. <span className="text-gradient">Agents deliver it</span> within budget.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-400">
              The coordinator analyzes your brief, discovers specialized agents, compares their bids and waits for your approval before any payment.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" onClick={onCreateTask} icon={<ArrowRight className="h-5 w-5" />}>
                Create New Task
              </Button>
              <Button size="lg" variant="secondary" onClick={() => navigate({ name: 'marketplace' })} icon={<Bot className="h-5 w-5" />}>
                Browse agents
              </Button>
            </div>
          </div>
          <div className="grid w-full max-w-sm grid-cols-2 gap-3 self-start lg:self-center">
            <MiniStat label="Available budget" value={budget.availableUsd} />
            <MiniStat label="Open payments" value={pendingApprovals} suffix="to approve" />
          </div>
        </div>
      </section>

      <StatsGrid
        totalAgents={agents.length}
        onlineAgents={agents.filter((agent) => agent.isOnline).length}
        activeTasks={countActiveTasks(tasks)}
        completedTasks={countCompletedTasks(tasks)}
        volumeUsd={approvedVolume(transactions)}
      />

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="flex flex-col gap-6 xl:col-span-2">
          <RecentActivity
            tasks={tasks}
            transactions={transactions}
            agents={agents}
            onOpenTask={(taskId) => navigate({ name: 'task', taskId })}
          />
          <AgentPerformance
            agents={agents}
            tasks={tasks}
            onOpenMarketplace={() => navigate({ name: 'marketplace' })}
          />
        </div>
        <BudgetCard
          budget={budget}
          pendingApprovals={pendingApprovals}
          onManage={() => navigate({ name: 'settings' })}
        />
      </div>
    </div>
  );
}

function MiniStat({ label, value, suffix }: { label: string; value: number; suffix?: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-ink-950/50 p-4 backdrop-blur">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-2 font-display text-2xl font-semibold text-white">
        {suffix ? value : `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
      </p>
      {suffix && <p className="text-xs text-slate-500">{suffix}</p>}
    </div>
  );
}
