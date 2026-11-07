import { useContext } from 'react';
import { WalletContext, type WalletContextValue } from '@/context/walletStore';

export function useWallet(): WalletContextValue {
  const value = useContext(WalletContext);
  if (!value) throw new Error('useWallet must be used inside WalletProvider');
  return value;
}
