import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useMemo,
} from 'react';
import {
  AccountManager,
  AccountWalletWithSecretKey,
  createPXEClient,
  Fq,
  Fr,
  waitForPXE,
} from '@aztec/aztec.js';
// import { ShieldswapWalletSdk } from '@shieldswap/wallet-sdk';
import { getSchnorrAccount } from '@aztec/accounts/schnorr';
import { ACCOUNTS } from '../utils/constants';
import { toast } from 'react-toastify';

type AztecContextProps = {
  addresses: Array<string>;
  connecting: boolean;
  // connectWallet: () => Promise<void>;
  // disconnectWallet: () => Promise<void>;
  switchWallet: (address: string) => Promise<void>;
  wallet: AccountWalletWithSecretKey | null;
};

const DEFAULT_AZTEC_CONTEXT_PROPS = {
  addresses: [],
  connecting: false,
  // connectWallet: async () => {},
  // disconnectWallet: async () => {},
  switchWallet: async () => {},
  wallet: null,
};

const AztecContext = createContext<AztecContextProps>(
  DEFAULT_AZTEC_CONTEXT_PROPS
);

export const AztecProvider = ({ children }: { children: ReactNode }) => {
  const [accounts, setAccounts] = useState<Array<AccountManager>>([]);
  const [connecting, setConnecting] = useState<boolean>(false);
  const [wallet, setWallet] = useState<AccountWalletWithSecretKey | null>(null); // TODO: Change from any
  // const [wc, setWc] = useState<any>(null); // TODO: Change from any

  // const connectWallet = async () => {
  //   if (!wc) return;
  //   const account = await wc.connect();
  //   setWallet(account);
  // };

  // const disconnectWallet = async () => {
  //   await wc.disconnect();
  //   setWallet(null);
  // };

  const addresses = useMemo(() => {
    return accounts.map((account) => account.getAddress().toString());
  }, [accounts]);

  const loadWallets = async () => {
    const pxe = createPXEClient('http://localhost:8080');
    await waitForPXE(pxe);

    const schnorrAccounts: AccountManager[] = [];

    for (const { secretKey, signingKey } of ACCOUNTS) {
      // derive account from secret & signing keys. Use salt of 0 to derive same value
      const schnorrAccount = getSchnorrAccount(
        pxe,
        Fr.fromString(secretKey),
        Fq.fromString(signingKey),
        0
      );

      // check if account is already registerd on pxe
      const isRegistered = await pxe.getRegisteredAccount(
        schnorrAccount.getAddress()
      );

      // if account not already registered then deploy to pxe
      if (!isRegistered) {
        await schnorrAccount.deploy().wait();
      }

      schnorrAccounts.push(schnorrAccount);
    }

    const account = await schnorrAccounts[0].getWallet();
    setAccounts(schnorrAccounts);
    setWallet(account);
  };

  const switchWallet = async (address: string) => {
    const account = accounts.find(
      (account) => account.getAddress().toString() === address
    );
    setWallet(await account!.getWallet());
    toast.success(
      `Switched to account with addres: ${account!.getAddress().toString()}`
    );
  };

  useEffect(() => {
    (async () => {
      await loadWallets();
      setConnecting(false);

      // const pxe = createPXEClient('http://localhost:8080');
      // await waitForPXE(pxe);
      //   const connector = new ShieldswapWalletSdk(
      //     {
      //       projectId: WC_PROJECT_ID,
      //       metadata: {
      //         name: 'Zimburse',
      //       },
      //     },
      //     pxe
      //   );
      //   setWc(connector);
      //   // attempt to restore past session
      //   const restored = await connector.reconnect();
      //   if (restored) {
      //     setWallet(restored);
      //   }
      //   setConnecting(false);
    })();
  }, []);

  return (
    <AztecContext.Provider
      value={{
        addresses,
        connecting,
        // connectWallet,
        // disconnectWallet,
        switchWallet,
        wallet,
      }}
    >
      {children}
    </AztecContext.Provider>
  );
};

export const useAztec = () => useContext(AztecContext);
