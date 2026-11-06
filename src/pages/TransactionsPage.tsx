import { useMemo, useState } from 'react';
import { BadgeCheck, Clock, Wallet, type LucideIcon } from 'lucide-react';
import { TransactionTable, type TransactionRow } from '@/components/transactions/TransactionTable';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Panel } from '@/components/ui/Panel';
import { useAppData } from '@/hooks/useAppData';
import { agentLookup, approvedVolume } from '@/lib/dashboardStats';
import { formatUsd, formatUsdPrecise } from '@/lib/format';
import type { Route } from '@/lib/routes';
import type { Transaction, TransactionStatus } from '@/types/domain';

type TransactionTab = 'all' | TransactionStatus;

const TABS: { key: TransactionTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending_approval', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'declined', label: 'Declined' },
];

interface TransactionsPageProps {
  navigate: (route: Route) => void;
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'The decision could not be saved. Please try again.';
}

export function TransactionsPage({ navigate }: TransactionsPageProps) {
  const { transactions, tasks, agents, budget, decidePayment } = useAppData();
  const [tab, setTab] = useState<TransactionTab>('all');
  const [confirming, setConfirming] = useState<Transaction | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const agentById = useMemo(() => agentLookup(agents), [agents]);
  const taskTitleById = useMemo(() => new Map(tasks.map((task) => [task.id, task.title])), [tasks]);

  const rows: TransactionRow[] = useMemo(
    () =>
      transactions
        .filter((tx) => tab === 'all' || tx.status === tab)
        .map((tx) => ({
          transaction: tx,
          taskTitle: taskTitleById.get(tx.taskId) ?? 'Deleted task',
          agent: agentById.get(tx.agentId),
        })),
    [transactions, tab, taskTitleById, agentById],
  );

  const countFor = (key: TransactionTab) =>
    key === 'all' ? transactions.length : transactions.filter((tx) => tx.status === key).length;

  const decide = async (transaction: Transaction, decision: 'approve' | 'decline') => {
    setBusyId(transaction.id);
    setError(null);
    try {
      await decidePayment(transaction, decision);
      setConfirming(null);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard icon={BadgeCheck} label="Approved spend" value={formatUsd(approvedVolume(transactions))} tone="emerald" />
        <SummaryCard icon={Clock} label="Awaiting approval" value={formatUsd(budget?.pendingUsd ?? 0)} tone="amber" />
        <SummaryCard icon={Wallet} label="Available budget" value={formatUsd(budget?.availableUsd ?? 0)} tone="blue" />
      </div>

      <div className="flex flex-col gap-4">
        <div role="tablist" aria-label="Filter transactions" className="inline-flex w-full flex-wrap rounded-xl border border-white/[0.08] bg-ink-800/70 p-1 sm:w-auto">
          {TABS.map((item) => (
            <button
              key={item.key}
              role="tab"
              aria-selected={tab === item.key}
              type="button"
              onClick={() => setTab(item.key)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 sm:flex-none ${
                tab === item.key ? 'bg-white/[0.09] text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {item.label}
              <span className="rounded-md bg-white/[0.07] px-1.5 text-xs text-slate-400">{countFor(item.key)}</span>
            </button>
          ))}
        </div>

        {error && (
          <p role="alert" className="rounded-xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </p>
        )}

        <TransactionTable
          rows={rows}
          busyId={busyId}
          onApprove={(transaction) => {
            setError(null);
            setConfirming(transaction);
          }}
          onDecline={(transaction) => decide(transaction, 'decline')}
          onOpenTask={(taskId) => navigate({ name: 'task', taskId })}
        />
      </div>

      <Modal
        open={confirming !== null}
        onClose={() => setConfirming(null)}
        title="Approve this payment?"
        description="This releases the agreed amount to the agent. It cannot be undone."
        footer={
          confirming && (
            <>
              <Button variant="ghost" onClick={() => setConfirming(null)} disabled={busyId !== null}>
                Cancel
              </Button>
              <Button variant="success" loading={busyId === confirming.id} onClick={() => decide(confirming, 'approve')}>
                Approve {formatUsdPrecise(confirming.amountUsd)}
              </Button>
            </>
          )
        }
      >
        {confirming && (
          <p className="text-sm text-slate-300">
            This payment is for <span className="font-medium text-white">{taskTitleById.get(confirming.taskId) ?? 'a deleted task'}</span>. Once approved, the task is marked complete.
          </p>
        )}
      </Modal>
    </div>
  );
}

interface SummaryCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  tone: 'emerald' | 'amber' | 'blue';
}

const ICON_TONES = {
  emerald: 'bg-emerald-500/10 text-emerald-300 ring-emerald-400/25',
  amber: 'bg-amber-500/10 text-amber-300 ring-amber-400/25',
  blue: 'bg-blue-500/10 text-blue-300 ring-blue-400/25',
};

function SummaryCard({ icon: Icon, label, value, tone }: SummaryCardProps) {
  return (
    <Panel className="flex items-center gap-4 p-5">
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ${ICON_TONES[tone]}`}>
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="text-sm text-slate-400">{label}</p>
        <p className="font-display text-xl font-semibold text-white">{value}</p>
      </div>
    </Panel>
  );
}
