import { useRef, useState } from 'react';
import { AlertTriangle, BadgeCheck, ExternalLink, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useAppData } from '@/hooks/useAppData';
import { useWallet } from '@/hooks/useWallet';
import { formatUsdPrecise } from '@/lib/format';
import {
  isTestnetAccountId,
  nearTestnetTransactionUrl,
  TEST_TRANSFER_NEAR,
  waitForTestnetTransfer,
} from '@/services/nearWallet';
import type { Transaction } from '@/types/domain';

type Phase = 'idle' | 'sending' | 'verifying' | 'recording' | 'recorded' | 'needs_retry';

interface PendingTransfer {
  txHash: string;
  sender: string;
  recipient: string;
}

const TRANSFER_NOT_SENT =
  'The transfer was not completed in your wallet. No payment was recorded. Check your wallet activity before trying again.';
const TRANSFER_FAILED_ON_CHAIN = 'The transfer failed on NEAR testnet, so no payment was recorded. You can try again.';
const NOT_CONFIRMED_YET =
  'The transfer was sent, but NEAR testnet has not confirmed it yet. Check again. The transfer will not be sent a second time.';
const RECORD_FAILED =
  'The NEAR testnet transfer is confirmed, but saving the payment failed. Retry saving. The transfer will not be sent a second time.';
const RECOVERY_NOTE =
  'A transfer for this payment was already sent from your wallet. Check and save it instead of sending again.';
const INVALID_RECIPIENT = 'Enter a NEAR testnet account, such as name.testnet.';

const pendingKey = (transactionId: string) => `taskforge.testnetTransfer.${transactionId}`;

function readPendingTransfer(transactionId: string): PendingTransfer | null {
  const raw = localStorage.getItem(pendingKey(transactionId));
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<PendingTransfer>;
    if (typeof value.txHash === 'string' && typeof value.sender === 'string' && typeof value.recipient === 'string') {
      return { txHash: value.txHash, sender: value.sender, recipient: value.recipient };
    }
    return null;
  } catch {
    return null;
  }
}

interface TestnetApprovalModalProps {
  transaction: Transaction;
  taskTitle: string;
  onClose: () => void;
}

export function TestnetApprovalModal({ transaction, taskTitle, onClose }: TestnetApprovalModalProps) {
  const { status, accountId, connect, sendTestnetTransfer } = useWallet();
  const { recordTestnetApproval } = useAppData();
  const [pending] = useState(() => readPendingTransfer(transaction.id));
  const [recipient, setRecipient] = useState(pending?.recipient ?? '');
  const [phase, setPhase] = useState<Phase>(pending ? 'needs_retry' : 'idle');
  const [txHash, setTxHash] = useState<string | null>(pending?.txHash ?? null);
  const [signer, setSigner] = useState<string | null>(pending?.sender ?? null);
  const [error, setError] = useState<string | null>(pending ? RECOVERY_NOTE : null);
  const [reviewed, setReviewed] = useState(false);
  const sendInFlight = useRef(false);

  const busy = phase === 'sending' || phase === 'verifying' || phase === 'recording';
  const connected = status === 'ready' && accountId !== null;
  const trimmedRecipient = recipient.trim();
  const recipientValid = isTestnetAccountId(trimmedRecipient);
  const recipientInvalid = trimmedRecipient.length > 0 && !recipientValid;
  const canApprove = connected && recipientValid && reviewed && phase === 'idle';

  const close = () => {
    if (!busy) onClose();
  };

  const record = async (hash: string, sender: string, to: string) => {
    setPhase('recording');
    setError(null);
    try {
      await recordTestnetApproval(transaction, hash, sender, to);
      localStorage.removeItem(pendingKey(transaction.id));
      setPhase('recorded');
    } catch {
      setPhase('needs_retry');
      setError(RECORD_FAILED);
    }
  };

  const settle = async (hash: string, sender: string, to: string) => {
    setTxHash(hash);
    setPhase('verifying');
    setError(null);
    const onChain = await waitForTestnetTransfer(hash, sender);
    if (onChain === 'failed') {
      localStorage.removeItem(pendingKey(transaction.id));
      setTxHash(null);
      setSigner(null);
      setPhase('idle');
      setError(TRANSFER_FAILED_ON_CHAIN);
      return;
    }
    if (onChain === 'pending') {
      setPhase('needs_retry');
      setError(NOT_CONFIRMED_YET);
      return;
    }
    await record(hash, sender, to);
  };

  const approve = async () => {
    if (sendInFlight.current) return;
    if (!connected || !accountId) {
      setError('Connect your NEAR testnet wallet first.');
      return;
    }
    if (!recipientValid) {
      setError(INVALID_RECIPIENT);
      return;
    }
    sendInFlight.current = true;
    setPhase('sending');
    setError(null);
    let hash: string;
    try {
      hash = await sendTestnetTransfer(trimmedRecipient);
    } catch (err) {
      sendInFlight.current = false;
      setPhase('idle');
      setError(err instanceof Error ? `${err.message} ${TRANSFER_NOT_SENT}` : TRANSFER_NOT_SENT);
      return;
    }
    sendInFlight.current = false;
    const pendingTransfer: PendingTransfer = { txHash: hash, sender: accountId, recipient: trimmedRecipient };
    localStorage.setItem(pendingKey(transaction.id), JSON.stringify(pendingTransfer));
    setSigner(accountId);
    await settle(hash, accountId, trimmedRecipient);
  };

  const footer = (
    <>
      {phase === 'recorded' ? (
        <Button variant="success" onClick={onClose}>
          Done
        </Button>
      ) : phase === 'needs_retry' && txHash && signer ? (
        <>
          <Button variant="ghost" onClick={close} disabled={busy}>
            Close
          </Button>
          <Button variant="success" onClick={() => settle(txHash, signer, trimmedRecipient)} loading={busy}>
            Check and save
          </Button>
        </>
      ) : (
        <>
          <Button variant="ghost" onClick={close} disabled={busy}>
            Cancel
          </Button>
          <Button variant="success" onClick={approve} loading={busy} disabled={!canApprove}>
            Send {TEST_TRANSFER_NEAR} NEAR and approve
          </Button>
        </>
      )}
    </>
  );

  const showWallet = phase === 'idle' || phase === 'sending';

  return (
    <Modal
      open
      onClose={close}
      title="Approve testnet payment"
      description={`Sends a ${TEST_TRANSFER_NEAR} NEAR test transfer on NEAR testnet from your wallet, then records the payment.`}
      footer={footer}
    >
      <div className="flex flex-col gap-5">
        <div className="flex items-start gap-3 rounded-xl border border-amber-400/25 bg-amber-500/[0.06] p-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
          <p className="text-sm text-slate-300">
            Testnet only. This sends test tokens with no real value. It never uses mainnet or real funds.
          </p>
        </div>

        <dl className="divide-y divide-white/[0.06] rounded-xl border border-white/[0.07] bg-ink-900/50">
          <SummaryRow label="Task" value={taskTitle} />
          <SummaryRow label="Recorded amount" value={formatUsdPrecise(transaction.amountUsd)} />
          <SummaryRow label="Sender account" value={signer ?? accountId ?? 'Not connected'} />
          <SummaryRow label="Recipient account" value={recipientValid ? trimmedRecipient : 'Enter a valid recipient'} />
          <SummaryRow label="Transfer amount" value={`${TEST_TRANSFER_NEAR} NEAR (testnet)`} />
        </dl>

        {showWallet && (
          <div className="flex flex-col gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <Wallet className="h-4 w-4 text-blue-300" />
              {status === 'initializing' && 'Loading your wallet...'}
              {status !== 'initializing' && connected && (
                <>
                  <BadgeCheck className="h-4 w-4 text-emerald-300" />
                  Connected to NEAR testnet as <span className="font-medium text-white">{accountId}</span>
                </>
              )}
              {status !== 'initializing' && !connected && 'Connect your NEAR testnet wallet to continue.'}
            </div>
            {status !== 'initializing' && !connected && (
              <Button variant="ghost" onClick={connect} fullWidth>
                Connect wallet
              </Button>
            )}

            <label className="flex flex-col gap-2">
              <span className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">Recipient testnet account</span>
              <input
                type="text"
                value={recipient}
                onChange={(event) => {
                  setRecipient(event.target.value);
                  setReviewed(false);
                }}
                disabled={!connected || phase !== 'idle'}
                placeholder="name.testnet"
                autoComplete="off"
                spellCheck={false}
                aria-invalid={recipientInvalid}
                className="rounded-xl border border-white/10 bg-ink-900 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-blue-400/60 focus:outline-none focus:ring-2 focus:ring-blue-400/30 disabled:opacity-50"
              />
              {recipientInvalid && <span className="text-xs text-rose-300">{INVALID_RECIPIENT}</span>}
            </label>
          </div>
        )}

        {phase === 'sending' && (
          <p className="text-sm text-slate-400">Waiting for your approval in the wallet window. Check for a new wallet pop-up.</p>
        )}
        {phase === 'verifying' && (
          <p className="text-sm text-slate-400">Confirming the transfer on NEAR testnet...</p>
        )}
        {phase === 'recording' && <p className="text-sm text-slate-400">Saving the payment...</p>}

        {showWallet && connected && recipientValid && phase === 'idle' && (
          <label className="flex items-start gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={reviewed}
              onChange={(event) => setReviewed(event.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-emerald-500"
            />
            <span>
              I have checked the sender account, the recipient account, and the {TEST_TRANSFER_NEAR} NEAR transfer amount above.
            </span>
          </label>
        )}

        {txHash && <NearTransactionLink txHash={txHash} />}

        {error && (
          <p role="alert" className="rounded-xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}

export function NearTransactionLink({ txHash }: { txHash: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-emerald-400/25 bg-emerald-500/[0.07] p-4">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-emerald-300">NEAR testnet transaction hash</p>
      <p className="break-all font-mono text-xs text-slate-200">{txHash}</p>
      <a
        href={nearTestnetTransactionUrl(txHash)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-blue-300 transition hover:text-blue-200"
      >
        View on NEAR testnet explorer
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
      <dt className="text-slate-400">{label}</dt>
      <dd className="text-right font-medium text-white">{value}</dd>
    </div>
  );
}
