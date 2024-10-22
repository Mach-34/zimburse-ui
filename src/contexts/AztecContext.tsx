import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from 'react';
import { createPXEClient, waitForPXE } from '@aztec/aztec.js';
import { DEFAULT_PXE_URL } from '../utils/constants';
import { ShieldswapWalletSdk } from '@shieldswap/wallet-sdk';
import { useAccount } from '@shieldswap/wallet-sdk/react';
import { Eip1193Account } from '@shieldswap/wallet-sdk/eip1193';

type AztecContextProps = {
  account: Eip1193Account | undefined;
  connecting: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
};

const DEFAULT_AZTEC_CONTEXT_PROPS = {
  account: undefined,
  connecting: false,
  connectWallet: async () => {},
  disconnectWallet: async () => {},
};

const AztecContext = createContext<AztecContextProps>(
  DEFAULT_AZTEC_CONTEXT_PROPS
);

const pxe = createPXEClient(DEFAULT_PXE_URL);
const wallet = new ShieldswapWalletSdk(async () => {
  await waitForPXE(pxe);
  return pxe;
});

export const AztecProvider = ({ children }: { children: ReactNode }) => {
  const account = useAccount(wallet);
  const [connecting, setConnecting] = useState<boolean>(false);

  const connectWallet = async () => {
    setConnecting(true);
    try {
      await wallet.connect();
    } catch (err) {
    } finally {
      setConnecting(false);
    }
  };

  const disconnectWallet = async () => {
    await wallet.disconnect();
  };

  return (
    <AztecContext.Provider
      value={{
        account,
        connecting,
        connectWallet,
        disconnectWallet,
      }}
    >
      {children}
    </AztecContext.Provider>
  );
};

export const useAztec = () => useContext(AztecContext);
