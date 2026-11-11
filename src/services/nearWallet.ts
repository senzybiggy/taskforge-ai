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
const TEST_TRANSFER_YOCTO = BigInt(10) ** BigInt(21);
const MAX_ACCOUNT_ID_LENGTH = 64;
const TESTNET_ACCOUNT_PATTERN = /^[a-z0-9]+([-_.][a-z0-9]+)*\.testnet$/;
const NEAR_TESTNET_RPC_URL = 'https://rpc.testnet.near.org';
const CONFIRMATION_POLL_MS = 2_000;
const CONFIRMATION_TIMEOUT_MS = 60_000;

export type TestnetTransferStatus = 'success' | 'failed' | 'pending';

export function nearTestnetTransactionUrl(txHash: string): string {
  return `https://testnet.nearblocks.io/txns/${encodeURIComponent(txHash)}`;
}

export function isTestnetAccountId(accountId: string): boolean {
  return accountId.length <= MAX_ACCOUNT_ID_LENGTH && TESTNET_ACCOUNT_PATTERN.test(accountId);
}

export async function sendTestnetTransfer(
  selector: WalletSelector,
  signerId: string,
  receiverId: string,
): Promise<string> {
  if (selector.options.network.networkId !== NEAR_NETWORK_ID) {
    throw new Error('This transaction is only allowed on NEAR Testnet.');
  }
  if (!isTestnetAccountId(signerId)) {
    throw new Error('The connected wallet account is not a NEAR testnet account.');
  }
  if (!isTestnetAccountId(receiverId)) {
    throw new Error('Enter a NEAR testnet account, such as name.testnet.');
  }

  const wallet = await selector.wallet();
  const accounts = await wallet.getAccounts();
  if (!accounts.some((account) => account.accountId === signerId)) {
    throw new Error('The connected wallet account changed. Reconnect your NEAR testnet wallet and try again.');
  }

  const outcome = await wallet.signAndSendTransaction({
    signerId,
    receiverId,
    actions: [actionCreators.transfer(TEST_TRANSFER_YOCTO)],
  });

  const hash = outcome?.transaction?.hash;
  if (!hash) {
    throw new Error('The wallet did not return a transaction hash. Check your wallet activity before trying again.');
  }
  return hash;
}

async function readTestnetTransferStatus(txHash: string, signerId: string): Promise<TestnetTransferStatus> {
  const response = await fetch(NEAR_TESTNET_RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 'taskforge', method: 'tx', params: [txHash, signerId] }),
  });
  if (!response.ok) return 'pending';
  const body = (await response.json()) as { result?: { status?: unknown }; error?: unknown };
  if (body.error || !body.result) return 'pending';
  const status = body.result.status;
  if (typeof status !== 'object' || status === null) return 'pending';
  if ('Failure' in status) return 'failed';
  if ('SuccessValue' in status) return 'success';
  return 'pending';
}

export async function waitForTestnetTransfer(txHash: string, signerId: string): Promise<TestnetTransferStatus> {
  const deadline = Date.now() + CONFIRMATION_TIMEOUT_MS;
  for (;;) {
    const status = await readTestnetTransferStatus(txHash, signerId).catch((): TestnetTransferStatus => 'pending');
    if (status !== 'pending' || Date.now() >= deadline) return status;
    await new Promise((resolve) => setTimeout(resolve, CONFIRMATION_POLL_MS));
  }
}

