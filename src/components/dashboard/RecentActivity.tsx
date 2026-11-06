import { CheckCircle2, Clock, ListPlus, XCircle, type LucideIcon } from 'lucide-react';
import { Panel } from '@/components/ui/Panel';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatRelative, formatUsd } from '@/lib/format';
import type { Agent, Task, Transaction } from '@/types/domain';

interface ActivityEvent {
  id: string;
  icon: LucideIcon;
  tone: string;
  text: string;
  detail: string;
  timestamp: string;
  taskId: string;
}

interface RecentActivityProps {
  tasks: Task[];
  transactions: Transaction[];
  agents: Agent[];
  onOpenTask: (taskId: string) => void;
}

function buildEvents(tasks: Task[], transactions: Transaction[], agents: Agent[]): ActivityEvent[] {
  const agentName = (id: string) => agents.find((agent) => agent.id === id)?.name ?? 'Unknown agent';
  const taskTitle = (id: string) => tasks.find((task) => task.id === id)?.title ?? 'Deleted task';

  const taskEvents: ActivityEvent[] = tasks.map((task) => ({
    id: `task-${task.id}`,
    icon: ListPlus,
    tone: 'text-blue-300 bg-blue-500/10 ring-blue-400/20',
    text: `New task: ${task.title}`,
    detail: `Budget ${formatUsd(task.budgetUsd)} · ${task.specialization}`,
    timestamp: task.createdAt,
    taskId: task.id,
  }));

  const paymentEvents: ActivityEvent[] = transactions.map((tx) => {
    const base = { taskId: tx.taskId, id: `tx-${tx.id}` };
    if (tx.status === 'approved') {
      return {
        ...base,
        icon: CheckCircle2,
        tone: 'text-emerald-300 bg-emerald-500/10 ring-emerald-400/20',
        text: `Payment approved to ${agentName(tx.agentId)}`,
        detail: `${formatUsd(tx.amountUsd)} · ${taskTitle(tx.taskId)}`,
        timestamp: tx.decidedAt ?? tx.createdAt,
      };
    }
    if (tx.status === 'declined') {
      return {
        ...base,
        icon: XCircle,
        tone: 'text-rose-300 bg-rose-500/10 ring-rose-400/20',
        text: `Payment declined for ${agentName(tx.agentId)}`,
        detail: `${formatUsd(tx.amountUsd)} · ${taskTitle(tx.taskId)}`,
        timestamp: tx.decidedAt ?? tx.createdAt,
      };
    }
    return {
      ...base,
      icon: Clock,
      tone: 'text-amber-300 bg-amber-500/10 ring-amber-400/20',
      text: `Awaiting your approval: ${agentName(tx.agentId)}`,
      detail: `${formatUsd(tx.amountUsd)} · ${taskTitle(tx.taskId)}`,
      timestamp: tx.createdAt,
    };
  });

  return [...taskEvents, ...paymentEvents]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 6);
}

export function RecentActivity({ tasks, transactions, agents, onOpenTask }: RecentActivityProps) {
  const events = buildEvents(tasks, transactions, agents);

  return (
    <Panel className="flex flex-col">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
        <div>
          <h2 className="font-display text-lg font-semibold text-white">Recent activity</h2>
          <p className="text-sm text-slate-400">Latest tasks and payment events</p>
        </div>
      </div>
      {events.length === 0 ? (
        <EmptyState icon={Clock} title="No activity yet" description="Create your first task and the coordinator's progress will show up here." />
      ) : (
        <ul className="divide-y divide-white/[0.05]">
          {events.map((event, index) => {
            const Icon = event.icon;
            return (
              <li key={event.id} className="animate-rise-in" style={{ animationDelay: `${index * 60}ms` }}>
                <button
                  type="button"
                  onClick={() => onOpenTask(event.taskId)}
                  className="flex w-full items-center gap-4 px-6 py-4 text-left transition hover:bg-white/[0.03]"
                >
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ${event.tone}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-slate-100">{event.text}</span>
                    <span className="block truncate text-xs text-slate-500">{event.detail}</span>
                  </span>
                  <span className="shrink-0 text-xs text-slate-500">{formatRelative(event.timestamp)}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
