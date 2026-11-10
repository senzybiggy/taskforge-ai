import { ExternalLink, Network, ReceiptText } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Panel } from '@/components/ui/Panel';
import { formatDateTime } from '@/lib/format';
import { nearTestnetTransactionUrl } from '@/services/nearWallet';
import type { Transaction } from '@/types/domain';

interface TestnetTransferTableProps {
  transactions: Transaction[];
}

export function TestnetTransferTable({ transactions }: TestnetTransferTableProps) {
  const transfers = transactions
    .filter((tx) => tx.nearTxHash)
    .sort((a, b) => (b.decidedAt ?? b.createdAt).localeCompare(a.decidedAt ?? a.createdAt));

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="font-display text-lg font-semibold text-white">NEAR testnet transfers</h2>
        <p className="text-sm text-slate-400">Successful test transfers recorded from your wallet.</p>
      </div>

      <Panel className="overflow-hidden">
        <div className="hidden grid-cols-[2fr_1.2fr_1.2fr_0.6fr_0.9fr_1fr_0.7fr] gap-4 border-b border-white/[0.07] px-6 py-3 text-xs font-medium uppercase tracking-wide text-slate-500 lg:grid">
          <span>Transaction hash</span>
          <span>From</span>
          <span>To</span>
          <span>Amount</span>
          <span>Network</span>
          <span>Recorded</span>
          <span>Status</span>
        </div>

        <ul className="divide-y divide-white/[0.06]">
          {transfers.map((tx) => (
            <li
              key={tx.id}
              className="grid gap-3 px-6 py-4 transition-colors hover:bg-white/[0.02] lg:grid-cols-[2fr_1.2fr_1.2fr_0.6fr_0.9fr_1fr_0.7fr] lg:items-center lg:gap-4"
            >
              <a
                href={nearTestnetTransactionUrl(tx.nearTxHash ?? '')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-w-0 items-start gap-1.5 font-mono text-xs text-blue-300 transition hover:text-blue-200"
              >
                <span className="break-all">{tx.nearTxHash}</span>
                <ExternalLink className="mt-0.5 h-3 w-3 shrink-0" />
              </a>
              <div className="min-w-0">
                <p className="text-xs text-slate-500 lg:hidden">From</p>
                <p className="break-all font-mono text-xs text-slate-300">{tx.nearSender ?? 'Not recorded'}</p>
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-500 lg:hidden">To</p>
                <p className="break-all font-mono text-xs text-slate-300">{tx.nearRecipient ?? 'Not recorded'}</p>
              </div>
              <p className="text-sm font-semibold text-white">{tx.nearAmountNear} NEAR</p>
              <p className="inline-flex items-center gap-1.5 text-sm text-slate-300">
                <Network className="h-3.5 w-3.5 text-slate-500" />
                {tx.nearNetwork === 'testnet' ? 'NEAR Testnet' : tx.nearNetwork ?? 'Unknown'}
              </p>
              <p className="text-sm text-slate-400">{formatDateTime(tx.decidedAt ?? tx.createdAt)}</p>
              <div>
                <Badge tone="emerald" dot>Success</Badge>
              </div>
            </li>
          ))}
        </ul>

        {transfers.length === 0 && (
          <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
            <ReceiptText className="h-6 w-6 text-slate-500" />
            <p className="text-sm text-slate-400">No NEAR testnet transfers yet. Approved payments appear here with their transaction hash.</p>
          </div>
        )}
      </Panel>
    </section>
  );
}
