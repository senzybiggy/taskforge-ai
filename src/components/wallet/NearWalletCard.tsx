import { useState } from 'react';
import { ExternalLink, Link2, Loader2, LogOut, Wallet } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Panel } from '@/components/ui/Panel';
import { useWallet } from '@/hooks/useWallet';
import { NEAR_NETWORK_ID, isEmbeddedInCrossOriginFrame, openAppInStandaloneTab } from '@/services/nearWallet';

export function NearWalletCard() {
  const { status, accountId, error, connect, disconnect } = useWallet();
  const [disconnecting, setDisconnecting] = useState(false);
  const embedded = isEmbeddedInCrossOriginFrame();

  const handleDisconnect = async () => {
    setDisconnecting(true);
    await disconnect();
    setDisconnecting(false);
  };

  const connected = accountId !== null;

  return (
    <Panel className="flex flex-col gap-4 p-6 sm:p-8">
      <div className="flex items-start gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] text-slate-400 ring-1 ring-inset ring-white/10">
          <Wallet className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-base font-semibold text-white">NEAR wallet</h2>
            <Badge tone={connected ? 'emerald' : 'neutral'} dot>
              {connected ? `Connected to ${NEAR_NETWORK_ID}` : 'Not connected'}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            {connected
              ? 'Sign-in is verified by your NEAR testnet wallet. Payments remain simulated, and no real funds move.'
              : 'Connect a NEAR testnet wallet to test sign-in. Payments remain simulated, and no real funds move.'}
          </p>
          {connected && (
            <p className="mt-3 truncate rounded-lg bg-white/[0.04] px-3 py-2 font-mono text-sm text-slate-100 ring-1 ring-inset ring-white/10">
              {accountId}
            </p>
          )}
          {embedded && !connected && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sky-400/25 bg-sky-500/10 px-4 py-3 text-sm text-sky-100">
              <span>Meteor Wallet sign-in needs its own browser tab. Open TaskForge there to connect it.</span>
              <Button variant="secondary" size="sm" icon={<ExternalLink className="h-4 w-4" />} onClick={openAppInStandaloneTab}>
                Open Meteor Wallet
              </Button>
            </div>
          )}
          {error && (
            <p role="alert" className="mt-3 rounded-xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        {status === 'initializing' && (
          <Button variant="secondary" disabled icon={<Loader2 className="h-4 w-4 animate-spin" />}>
            Loading wallet
          </Button>
        )}
        {status === 'error' && (
          <Button variant="secondary" disabled>
            Wallet unavailable
          </Button>
        )}
        {status === 'ready' && !connected && (
          <Button variant="secondary" onClick={connect} icon={<Link2 className="h-4 w-4" />}>
            Connect wallet
          </Button>
        )}
        {status === 'ready' && connected && (
          <Button variant="secondary" onClick={handleDisconnect} loading={disconnecting} icon={<LogOut className="h-4 w-4" />}>
            Disconnect
          </Button>
        )}
      </div>
    </Panel>
  );
}
