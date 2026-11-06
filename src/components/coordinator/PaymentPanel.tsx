import { useState } from 'react';
import { BadgeCheck, CreditCard, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Panel } from '@/components/ui/Panel';
import { useAppData } from '@/hooks/useAppData';
import { formatDate, formatUsd, formatUsdPrecise } from '@/lib/format';
import { transactionStatus } from '@/lib/labels';
import { FINAL_STEP } from '@/lib/coordinator/steps';
import type { Task, Transaction } from '@/types/domain';

interface PaymentPanelProps {
  task: Task;
  transactions: Transaction[];
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'The payment could not be updated. Please try again.';
}

export function PaymentPanel({ task, transactions }: PaymentPanelProps) {
  const { requestPayment, decidePayment, budget } = useAppData();
  const [busy, setBusy] = useState<'request' | 'approve' | 'decline' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const agreedUsd = task.bids.find((bid) => bid.agentId === task.selectedAgentId)?.amountUsd ?? null;
  const pending = transactions.find((tx) => tx.status === 'pending_approval') ?? null;
  const approved = transactions.find((tx) => tx.status === 'approved') ?? null;
  const declined = transactions.filter((tx) => tx.status === 'declined');
  const verified = task.completedSteps >= 7;
  const complete = task.completedSteps >= FINAL_STEP;

  const handleRequest = async () => {
    setBusy('request');
    setError(null);
    try {
      await requestPayment(task);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const handleDecision = async (transaction: Transaction, decision: 'approve' | 'decline') => {
    setBusy(decision);
    setError(null);
    try {
      await decidePayment(transaction, decision);
      setConfirmOpen(false);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  return (
    <Panel className="p-6 sm:p-7">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-blue-300">
        <CreditCard className="h-3.5 w-3.5" />
        Payment approval
      </div>
      <p className="mt-2 text-sm leading-relaxed text-slate-400">Nothing is paid until you approve it. Spend can never exceed the task budget.</p>

      <dl className="mt-5 divide-y divide-white/[0.06] rounded-xl border border-white/[0.07] bg-ink-900/50">
        <SummaryRow label="Task budget" value={formatUsd(task.budgetUsd)} />
        <SummaryRow label="Agreed amount" value={agreedUsd !== null ? formatUsdPrecise(agreedUsd) : 'Not agreed yet'} />
        <SummaryRow label="Available in pool" value={budget ? formatUsd(budget.availableUsd) : '--'} />
      </dl>

      <div className="mt-5">
        {complete && approved ? (
          <div className="flex items-start gap-3 rounded-xl border border-emerald-400/25 bg-emerald-500/[0.07] p-4">
            <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
            <div>
              <p className="font-medium text-white">Payment approved</p>
              <p className="mt-1 text-sm text-slate-400">
                {formatUsdPrecise(approved.amountUsd)} released on {formatDate(approved.decidedAt ?? approved.createdAt)}.
              </p>
            </div>
          </div>
        ) : pending ? (
          <div className="flex flex-col gap-4 rounded-xl border border-amber-400/25 bg-amber-500/[0.06] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-slate-300">Awaiting your approval</p>
                <p className="font-display text-2xl font-semibold text-white">{formatUsdPrecise(pending.amountUsd)}</p>
              </div>
              <Badge tone="amber" dot>Pending</Badge>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button className="flex-1" variant="success" onClick={() => setConfirmOpen(true)} disabled={busy !== null}>
                Approve payment
              </Button>
              <Button
                className="flex-1"
                variant="danger"
                loading={busy === 'decline'}
                onClick={() => handleDecision(pending, 'decline')}
              >
                Decline
              </Button>
            </div>
          </div>
        ) : verified ? (
          <div className="flex flex-col gap-3">
            {declined.length > 0 && (
              <p className="text-sm text-slate-400">The last payment request was declined. You can request it again.</p>
            )}
            <Button onClick={handleRequest} loading={busy === 'request'} disabled={agreedUsd === null} fullWidth icon={<CreditCard className="h-4 w-4" />}>
              Request payment
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 text-sm text-slate-400">
            <Lock className="h-4 w-4 shrink-0 text-slate-500" />
            Payment unlocks after the work is verified.
          </div>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </p>
      )}

      {pending && (
        <Modal
          open={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          title="Approve this payment?"
          description="This releases the agreed amount to the agent. It cannot be undone."
          footer={
            <>
              <Button variant="ghost" onClick={() => setConfirmOpen(false)} disabled={busy !== null}>
                Cancel
              </Button>
              <Button variant="success" loading={busy === 'approve'} onClick={() => handleDecision(pending, 'approve')}>
                Approve {formatUsdPrecise(pending.amountUsd)}
              </Button>
            </>
          }
        >
          <p className="text-sm text-slate-300">
            Status after approval: <span className="font-medium text-emerald-300">{transactionStatus('approved').label}</span>. The task will be marked complete.
          </p>
        </Modal>
      )}
    </Panel>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
      <dt className="text-slate-400">{label}</dt>
      <dd className="font-medium text-white">{value}</dd>
    </div>
  );
}
