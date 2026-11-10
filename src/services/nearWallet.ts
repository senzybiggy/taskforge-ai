import { actionCreators, setupWalletSelector, type InjectedWallet, type WalletModule, type WalletModuleFactory, type WalletSelector } from '@near-wallet-selector/core';
import { setupModal, type WalletSelectorModal } from '@near-wallet-selector/modal-ui';
import { setupMeteorWallet } from '@near-wallet-selector/meteor-wallet';
import { setupMyNearWallet } from '@near-wallet-selector/my-near-wallet';
import '@near-wallet-selector/modal-ui/styles.css';

export const NEAR_NETWORK_ID = 'testnet';
export const MY_NEAR_WALLET_TESTNET_URL = 'https://testnet.mynearwallet.com';

export function isEmbeddedInCrossOriginFrame(): boolean {
  try {
    void window.top?.outerHeight;
    return false;
  } catch {
    return true;
  }
}

const sessionStorageService = {
  getItem: async (key: string) => window.sessionStorage.getItem(key),
  setItem: async (key: string, value: string) => window.sessionStorage.setItem(key, value),
  removeItem: async (key: string) => window.sessionStorage.removeItem(key),
};

export const METEOR_STANDALONE_MESSAGE =
  'Meteor Wallet opens its secure sign-in popup only in a standalone tab. TaskForge has opened in a new tab; connect Meteor Wallet there.';

export function openAppInStandaloneTab(): void {
  window.open(window.location.href, '_blank', 'noopener,noreferrer');
}

function meteorWalletModule(): WalletModuleFactory<InjectedWallet> {
  const meteor = setupMeteorWallet();
  return async (options) => {
    const module = await meteor(options);
    if (!module || !isEmbeddedInCrossOriginFrame()) return module as WalletModule<InjectedWallet> | null;
    const { init } = module as WalletModule<InjectedWallet>;
    return {
      ...module,
      init: async (initOptions) => {
        const wallet = await init(initOptions);
        return {
          ...wallet,
          signIn: async () => {
            openAppInStandaloneTab();
            throw new Error(METEOR_STANDALONE_MESSAGE);
          },
        };
      },
    } as WalletModule<InjectedWallet>;
  };
}

export interface NearWalletConnection {
  selector: WalletSelector;
  modal: WalletSelectorModal;
}

export async function createNearWalletConnection(): Promise<NearWalletConnection> {
  const selector = await setupWalletSelector({
    network: NEAR_NETWORK_ID,
    modules: [meteorWalletModule(), setupMyNearWallet({ walletUrl: MY_NEAR_WALLET_TESTNET_URL })],
    storage: sessionStorageService,
  });
  const modal = setupModal(selector, { theme: 'dark' });
  return { selector, modal };
}

export async function fetchVerifiedAccountId(selector: WalletSelector): Promise<string | null> {
  if (!selector.store.getState().selectedWalletId) return null;
  try {
    const wallet = await selector.wallet();
    const accounts = (await wallet.getAccounts()).filter((account) => account.accountId);
    return accounts[0]?.accountId ?? null;
  } catch {
    return null;
  }
}

export async function signOutOfNearWallet(selector: WalletSelector): Promise<void> {
  const wallet = await selector.wallet();
  await wallet.signOut();
}

export const TEST_TRANSFER_NEAR = '0.001';
const TESTNET_ACCOUNT_PATTERN = /^[a-z0-9._-]+\.testnet$/;
const YOCTO_PER_MICRO_NEAR = BigInt(10) ** BigInt(18);

export function nearTestnetTransactionUrl(txHash: string): string {
  return `https://testnet.nearblocks.io/txns/${encodeURIComponent(txHash)}`;
}

export function isTestnetAccountId(accountId: string): boolean {
  return TESTNET_ACCOUNT_PATTERN.test(accountId);
}

export async function sendTestnetTransfer(
  selector: WalletSelector,
  receiverId: string,
  amountInNear: string,
): Promise<string> {
  if (selector.options.network.networkId !== 'testnet') {
    throw new Error('This transaction is only allowed on NEAR Testnet.');
  }

  if (!isTestnetAccountId(receiverId)) {
    throw new Error('Enter a NEAR testnet account, such as name.testnet.');
  }

  const amount = Number(amountInNear);

  if (!Number.isFinite(amount) || amount <= 0 || amount > Number(TEST_TRANSFER_NEAR)) {
    throw new Error('Test transfer must be greater than zero and no more than 0.001 NEAR.');
  }

  const microNear = BigInt(Math.round(amount * 1e6));
  const wallet = await selector.wallet();

  const outcome = await wallet.signAndSendTransaction({
    receiverId,
    actions: [actionCreators.transfer(microNear * YOCTO_PER_MICRO_NEAR)],
  });

  if (!outcome) {
    throw new Error('The wallet did not return a result, so the payment was not recorded.');
  }
  const { status, transaction } = outcome;
  if (typeof status !== 'object' || !('SuccessValue' in status)) {
    throw new Error('The testnet transfer did not succeed, so the payment was not recorded.');
  }
  if (!transaction?.hash) {
    throw new Error('The wallet did not return a transaction hash, so the payment was not recorded.');
  }
  return transaction.hash;
}
