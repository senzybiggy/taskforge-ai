import { setupWalletSelector, type WalletSelector } from '@near-wallet-selector/core';
import { setupModal, type WalletSelectorModal } from '@near-wallet-selector/modal-ui';
import { setupMyNearWallet } from '@near-wallet-selector/my-near-wallet';
import '@near-wallet-selector/modal-ui/styles.css';

export const NEAR_NETWORK_ID = 'testnet';

const sessionStorageService = {
  getItem: async (key: string) => window.sessionStorage.getItem(key),
  setItem: async (key: string, value: string) => window.sessionStorage.setItem(key, value),
  removeItem: async (key: string) => window.sessionStorage.removeItem(key),
};

export interface NearWalletConnection {
  selector: WalletSelector;
  modal: WalletSelectorModal;
}

export async function createNearWalletConnection(): Promise<NearWalletConnection> {
  const selector = await setupWalletSelector({
    network: NEAR_NETWORK_ID,
    modules: [setupMyNearWallet()],
    storage: sessionStorageService,
  });
  const modal = setupModal(selector, { theme: 'dark' });
  return { selector, modal };
}

export function getActiveAccountId(selector: WalletSelector): string | null {
  const { accounts } = selector.store.getState();
  return accounts.find((account) => account.active)?.accountId ?? accounts[0]?.accountId ?? null;
}

export async function signOutOfNearWallet(selector: WalletSelector): Promise<void> {
  const wallet = await selector.wallet();
  await wallet.signOut();
}
