import { createContext } from 'react';

export type WalletStatus = 'initializing' | 'ready' | 'error';

export interface WalletContextValue {
  status: WalletStatus;
  accountId: string | null;
  error: string | null;
  connect: () => void;
  disconnect: () => Promise<void>;
  sendTestnetTransfer: (receiverId: string, amountNear: string) => Promise<string>;
}

export const WalletContext = createContext<WalletContextValue | null>(null);
