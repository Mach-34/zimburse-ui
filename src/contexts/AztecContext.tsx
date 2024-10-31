import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from 'react';
import {
  AccountWalletWithSecretKey,
  createPXEClient,
  Fq,
  Fr,
  waitForPXE,
} from '@aztec/aztec.js';
import { DEFAULT_PXE_URL } from '../utils/constants';
import { ShieldswapWalletSdk } from '@shieldswap/wallet-sdk';
import { useAccount } from '@shieldswap/wallet-sdk/react';
import { Eip1193Account } from '@shieldswap/wallet-sdk/eip1193';
import { getInitialTestAccountsWallets } from '@aztec/accounts/testing';
import { getSchnorrAccount } from '@aztec/accounts/schnorr';

type AztecContextProps = {
  account: Eip1193Account | undefined;
  connecting: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  registryAdmin: AccountWalletWithSecretKey | undefined;
  viewOnlyAccount: AccountWalletWithSecretKey | undefined;
};

const {
  VITE_APP_SUPERUSER_FR: SUPERUSER_FR,
  VITE_APP_SUPERUSER_FQ: SUPERUSER_FQ,
} = import.meta.env;

const DEFAULT_AZTEC_CONTEXT_PROPS = {
  account: undefined,
  connecting: false,
  connectWallet: async () => {},
  disconnectWallet: async () => {},
  registryAdmin: undefined,
  viewOnlyAccount: undefined,
};

const AztecContext = createContext<AztecContextProps>(
  DEFAULT_AZTEC_CONTEXT_PROPS
);

const pxe = createPXEClient(DEFAULT_PXE_URL);
const wallet = new ShieldswapWalletSdk(async () => {
  await waitForPXE(pxe);
  return pxe;
});

const [viewOnlyAccount] = await getInitialTestAccountsWallets(pxe);
const registryAdmin = await getSchnorrAccount(
  pxe,
  Fr.fromString(SUPERUSER_FR),
  Fq.fromString(SUPERUSER_FQ),
  0
).getWallet();

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
        registryAdmin,
        viewOnlyAccount,
      }}
    >
      {children}
    </AztecContext.Provider>
  );
};

export const useAztec = () => useContext(AztecContext);
