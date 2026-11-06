import { ArrowUpRight, Check, ReceiptText, X } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Panel } from '@/components/ui/Panel';
import { formatDate, formatUsdPrecise } from '@/lib/format';
import { transactionStatus } from '@/lib/labels';
import type { Agent, Task, Transaction } from '@/types/domain';

export interface TransactionRow {
  transaction: Transaction;
  taskTitle: string;
  agent: Agent | undefined;
}

interface TransactionTableProps {
  rows: TransactionRow[];
  busyId: string | null;
  onApprove: (transaction: Transaction) => void;
  onDecline: (transaction: Transaction) => void;
  onOpenTask: (taskId: Task['id']) => void;
}

export function TransactionTable({ rows, busyId, onApprove, onDecline, onOpenTask }: TransactionTableProps) {
  return (
    <Panel className="overflow-hidden">
      <div className="hidden grid-cols-[1.4fr_1fr_0.9fr_0.8fr_0.7fr_auto] gap-4 border-b border-white/[0.07] px-6 py-3 text-xs font-medium uppercase tracking-wide text-slate-500 lg:grid">
        <span>Task</span>
        <span>Agent</span>
        <span>Requested</span>
        <span className="text-right">Amount</span>
        <span>Status</span>
        <span className="w-[200px] text-right">Decision</span>
      </div>

      <ul className="divide-y divide-white/[0.06]">
        {rows.map(({ transaction, taskTitle, agent }) => {
          const status = transactionStatus(transaction.status);
          const pending = transaction.status === 'pending_approval';
          const busy = busyId === transaction.id;
          return (
            <li key={transaction.id} className="grid gap-3 px-6 py-4 transition-colors hover:bg-white/[0.02] lg:grid-cols-[1.4fr_1fr_0.9fr_0.8fr_0.7fr_auto] lg:items-center lg:gap-4">
              <button type="button" onClick={() => onOpenTask(transaction.taskId)} className="group flex min-w-0 items-center gap-2 text-left">
                <span className="truncate font-medium text-white group-hover:text-blue-200">{taskTitle}</span>
                <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-slate-600 transition group-hover:text-blue-300" />
              </button>
              <p className="truncate text-sm text-slate-300">{agent?.name ?? 'Unknown agent'}</p>
              <p className="text-sm text-slate-400">{formatDate(transaction.createdAt)}</p>
              <p className="text-sm font-semibold text-white lg:text-right">{formatUsdPrecise(transaction.amountUsd)}</p>
              <div>
                <Badge tone={status.tone} dot>{status.label}</Badge>
              </div>
              <div className="flex gap-2 lg:w-[200px] lg:justify-end">
                {pending ? (
                  <>
                    <Button size="sm" variant="success" icon={<Check className="h-3.5 w-3.5" />} onClick={() => onApprove(transaction)} disabled={busyId !== null}>
                      Approve
                    </Button>
                    <Button size="sm" variant="danger" icon={<X className="h-3.5 w-3.5" />} loading={busy} onClick={() => onDecline(transaction)} disabled={busyId !== null && !busy}>
                      Decline
                    </Button>
                  </>
                ) : (
                  <span className="text-xs text-slate-500">
                    {transaction.decidedAt ? `Decided ${formatDate(transaction.decidedAt)}` : 'No action needed'}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {rows.length === 0 && (
        <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
          <ReceiptText className="h-6 w-6 text-slate-500" />
          <p className="text-sm text-slate-400">No transactions match this filter.</p>
        </div>
      )}
    </Panel>
  );
}
