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
// import { ShieldswapWalletSdk } from '@shieldswap/wallet-sdk';
import { getSchnorrAccount } from '@aztec/accounts/schnorr';
import { createAccounts } from '@aztec/accounts/testing';
import { TokenContract } from '@aztec/noir-contracts.js';

const { VITE_APP_SECRET_KEY: SECRET_KEY, VITE_APP_SIGNING_KEY: SIGNING_KEY } =
  import.meta.env;

type AztecContextProps = {
  connecting: boolean;
  // connectWallet: () => Promise<void>;
  // disconnectWallet: () => Promise<void>;
  wallet: AccountWalletWithSecretKey | null;
};

const DEFAULT_AZTEC_CONTEXT_PROPS = {
  connecting: false,
  // connectWallet: async () => {},
  // disconnectWallet: async () => {},
  wallet: null,
};

const AztecContext = createContext<AztecContextProps>(
  DEFAULT_AZTEC_CONTEXT_PROPS
);

export const AztecProvider = ({ children }: { children: ReactNode }) => {
  const [connecting, setConnecting] = useState<boolean>(true);
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

  const loadWallet = async () => {
    const pxe = createPXEClient('http://localhost:8080');
    await waitForPXE(pxe);

    const secretKey = new Fr(BigInt(SECRET_KEY));
    const signingKey = new Fq(BigInt(SIGNING_KEY));

    // derive account from secret & signing keys. Use salt of 0 to derive same value
    const schnorrAccount = getSchnorrAccount(pxe, secretKey, signingKey, 0);

    // check if account is already registerd on pxe
    const isRegistered = await pxe.getRegisteredAccount(
      schnorrAccount.getAddress()
    );

    // if account not already registered then deploy to pxe
    if (!isRegistered) {
      await schnorrAccount.deploy().wait();
    }
    const account = await schnorrAccount.getWallet();
    setWallet(account);
  };

  useEffect(() => {
    (async () => {
      await loadWallet();
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
        connecting,
        // connectWallet,
        // disconnectWallet,
        wallet,
      }}
    >
      {children}
    </AztecContext.Provider>
  );
};

export const useAztec = () => useContext(AztecContext);
