import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from 'react';
import { createPXEClient, waitForPXE } from '@aztec/aztec.js';
import { ShieldswapWalletSdk } from '@shieldswap/wallet-sdk';
import { disconnect } from 'process';

const { VITE_APP_WC_PROJECT_ID: WC_PROJECT_ID } = import.meta.env;

type AztecContextProps = {
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  setUser: (user: string) => void;
  user: string;
  wallet: any;
};

const DEFAULT_AZTEC_CONTEXT_PROPS = {
  connectWallet: async () => {},
  disconnectWallet: async () => {},
  setUser: (_user: string) => null,
  user: '',
  wallet: null,
};

const AztecContext = createContext<AztecContextProps>(
  DEFAULT_AZTEC_CONTEXT_PROPS
);

export const AztecProvider = ({ children }: { children: ReactNode }) => {
  const [wallet, setWallet] = useState<any>(null); // TODO: Change from any
  const [wc, setWc] = useState<any>(null); // TODO: Change from any
  const [user, setUser] = useState<string>('Guest');

  const connectWallet = async () => {
    if (!wc) return;
    const account = await wc.connect();
    setWallet(account);
  };

  const disconnectWallet = async () => {
    await wc.disconnect();
    setWallet(null);
  };

  useEffect(() => {
    (async () => {
      const pxe = createPXEClient('http://localhost:8080');
      await waitForPXE(pxe);
      const connector = new ShieldswapWalletSdk(
        {
          projectId: WC_PROJECT_ID,
          metadata: {
            name: 'Zimburse',
          },
        },
        pxe
      );
      setWc(connector);
      // attempt to restore past session
      const restored = await connector.reconnect();
      if (restored) {
        setWallet(restored);
      }
    })();
  }, []);

  return (
    <AztecContext.Provider
      value={{ connectWallet, disconnectWallet, setUser, user, wallet }}
    >
      {children}
    </AztecContext.Provider>
  );
};

export const useAztec = () => useContext(AztecContext);
