import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { WalletContext, type WalletContextValue, type WalletStatus } from '@/context/walletStore';
import {
  createNearWalletConnection,
  fetchVerifiedAccountId,
  signOutOfNearWallet,
  type NearWalletConnection,
} from '@/services/nearWallet';

const WALLET_EVENTS = ['signedIn', 'signedOut', 'accountsChanged'] as const;

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'The NEAR wallet could not be loaded. Please reload the page.';
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const connectionRef = useRef<Promise<NearWalletConnection> | null>(null);
  const [connection, setConnection] = useState<NearWalletConnection | null>(null);
  const [status, setStatus] = useState<WalletStatus>('initializing');
  const [accountId, setAccountId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    connectionRef.current ??= createNearWalletConnection();
    const refreshAccount = async (next: NearWalletConnection) => {
      const verified = await fetchVerifiedAccountId(next.selector);
      if (active) setAccountId(verified);
    };

    connectionRef.current
      .then((next) => {
        if (!active) return;
        setConnection(next);
        setStatus('ready');
        void refreshAccount(next);
        WALLET_EVENTS.forEach((event) => next.selector.on(event, () => void refreshAccount(next)));
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(errorMessage(err));
        setStatus('error');
      });

    return () => {
      active = false;
    };
  }, []);

  const connect = useCallback(() => {
    if (!connection) return;
    setError(null);
    connection.modal.show();
  }, [connection]);

  const disconnect = useCallback(async () => {
    if (!connection) return;
    setError(null);
    try {
      await signOutOfNearWallet(connection.selector);
      setAccountId(null);
    } catch (err) {
      setError(errorMessage(err));
    }
  }, [connection]);

  const value = useMemo<WalletContextValue>(
    () => ({ status, accountId, error, connect, disconnect }),
    [status, accountId, error, connect, disconnect],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}
