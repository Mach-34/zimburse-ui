import {
  createContext,
  Dispatch,
  SetStateAction,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from 'react';
import {
  AccountWalletWithSecretKey,
  AztecAddress,
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
import { TokenContract } from '../artifacts';
import { fromUSDCDecimals } from '@mach-34/zimburse/dist/src/utils';

type AztecContextProps = {
  account: Eip1193Account | undefined;
  connecting: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  fetchingTokenBalance: boolean;
  registryAdmin: AccountWalletWithSecretKey | undefined;
  setTokenBalance: Dispatch<SetStateAction<TokenBalance>>;
  tokenBalance: TokenBalance;
  tokenContract: TokenContract | undefined;
  viewOnlyAccount: AccountWalletWithSecretKey | undefined;
};

const {
  VITE_APP_SUPERUSER_FR: SUPERUSER_FR,
  VITE_APP_SUPERUSER_FQ: SUPERUSER_FQ,
  VITE_APP_USDC_CONTRACT: USDC_CONTRACT,
} = import.meta.env;

const DEFAULT_AZTEC_CONTEXT_PROPS = {
  account: undefined,
  connecting: false,
  connectWallet: async () => {},
  disconnectWallet: async () => {},
  fetchingTokenBalance: false,
  registryAdmin: undefined,
  setTokenBalance: (() => {}) as Dispatch<SetStateAction<TokenBalance>>,
  tokenBalance: { private: 0, public: 0 },
  tokenContract: undefined,
  viewOnlyAccount: undefined,
};

const AztecContext = createContext<AztecContextProps>(
  DEFAULT_AZTEC_CONTEXT_PROPS
);

type TokenBalance = {
  private: number;
  public: number;
};

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
  const [fetchingTokenBalance, setFetchingTokenBalance] =
    useState<boolean>(false);
  const [tokenBalance, setTokenBalance] = useState<TokenBalance>({
    private: 0,
    public: 0,
  });
  const [tokenContract, setTokenContract] = useState<TokenContract | undefined>(
    undefined
  );

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

  useEffect(() => {
    (async () => {
      if (!account || !viewOnlyAccount) return;
      const contract = await TokenContract.at(
        AztecAddress.fromString(USDC_CONTRACT),
        account
      );
      setFetchingTokenBalance(true);
      const publicBalance = await contract
        .withWallet(viewOnlyAccount)
        .methods.balance_of_public(account.getAddress())
        .simulate();

      const privateBalance = await contract
        .withWallet(viewOnlyAccount)
        .methods.balance_of_private(account.getAddress())
        .simulate();

      setTokenBalance({
        private: Number(fromUSDCDecimals(privateBalance)),
        public: Number(fromUSDCDecimals(publicBalance)),
      });
      setTokenContract(contract);
      setFetchingTokenBalance(false);
    })();
  }, [account, viewOnlyAccount]);

  return (
    <AztecContext.Provider
      value={{
        account,
        connecting,
        connectWallet,
        disconnectWallet,
        fetchingTokenBalance,
        registryAdmin,
        setTokenBalance,
        tokenBalance,
        tokenContract,
        viewOnlyAccount,
      }}
    >
      {children}
    </AztecContext.Provider>
  );
};

export const useAztec = () => useContext(AztecContext);
