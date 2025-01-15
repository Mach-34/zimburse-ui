import {
  createContext,
  Dispatch,
  SetStateAction,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useMemo,
} from 'react';
import {
  AccountManager,
  AccountWalletWithSecretKey,
  AztecAddress,
  BatchCall,
  createPXEClient,
  Fq,
  Fr,
  UniqueNote,
  waitForPXE,
} from '@aztec/aztec.js';
import { AztecAccount, DEFAULT_PXE_URL, EVENT_BLOCK_LIMIT, ZIMBURSE_LS_KEY } from '../utils/constants';
import { getInitialTestAccountsWallets } from '@aztec/accounts/testing';
import { getSchnorrAccount } from '@aztec/accounts/schnorr';
import { TokenContract, ZImburseEscrowContract } from '../artifacts';
import { deriveSigningKey } from "@aztec/circuits.js";
import { toast } from "react-toastify";
import chunk from 'lodash.chunk';

type AztecContextProps = {
  account: AccountWalletWithSecretKey | undefined;
  accounts: Array<AztecAccount>;
  connecting: boolean;
  connectWallet: (secretKey: Fr) => Promise<void>;
  disconnectWallet: () => Promise<void>;
  fetchingTokenBalance: boolean;
  registryAdmin: AccountWalletWithSecretKey | undefined;
  setTokenBalance: Dispatch<SetStateAction<TokenBalance>>;
  tokenBalance: TokenBalance;
  tokenContract: TokenContract | undefined;
  viewOnlyAccount: AccountWalletWithSecretKey | undefined;
};

const {
  VITE_APP_AZTEC_WALLETS: AZTEC_WALLETS,
  VITE_APP_SUPERUSER_FR: SUPERUSER_FR,
  VITE_APP_SUPERUSER_FQ: SUPERUSER_FQ,
  VITE_APP_USDC_CONTRACT: USDC_CONTRACT,
} = import.meta.env;

const DEFAULT_AZTEC_CONTEXT_PROPS = {
  account: undefined,
  accounts: [],
  connecting: false,
  connectWallet: async (_secretKey: Fr) => {},
  disconnectWallet: async () => {},
  fetchingTokenBalance: false,
  registryAdmin: undefined,
  setTokenBalance: (() => {}) as Dispatch<SetStateAction<TokenBalance>>,
  tokenBalance: { private: 0n, public: 0n },
  tokenContract: undefined,
  viewOnlyAccount: undefined,
};

const AztecContext = createContext<AztecContextProps>(
  DEFAULT_AZTEC_CONTEXT_PROPS
);

type TokenBalance = {
  private: bigint;
  public: bigint;
};

const pxe = createPXEClient(DEFAULT_PXE_URL);
const [viewOnlyAccount] = await getInitialTestAccountsWallets(pxe);
const registryAdmin = await getSchnorrAccount(
  pxe,
  Fr.fromHexString(SUPERUSER_FR),
  Fq.fromHexString(SUPERUSER_FQ),
  0
).getWallet();

export const AztecProvider = ({ children }: { children: ReactNode }) => {
  const [account, setAccount] = useState<AccountWalletWithSecretKey | undefined>(undefined);
  const [connecting, setConnecting] = useState<boolean>(false);
  const [fetchingTokenBalance, setFetchingTokenBalance] =
    useState<boolean>(false);
  const [tokenBalance, setTokenBalance] = useState<TokenBalance>({
    private: 0n,
    public: 0n,
  });
  const [tokenContract, setTokenContract] = useState<TokenContract | undefined>(
    undefined
  );

  const accounts: Array<AztecAccount> = useMemo(() => {
    const parsedWallets = JSON.parse(AZTEC_WALLETS);
    return parsedWallets.map((secretKey: `0x${string}`) => {
      const secretFr = Fr.fromHexString(secretKey);
      const signingKey = deriveSigningKey(secretFr);
      const schnorr = getSchnorrAccount(
        pxe,
        secretFr,
        signingKey,
        0
      )
      return {
        address: schnorr.getAddress(),
        secretKey: Fr.fromHexString(secretKey)
      }
    });
  }, [AZTEC_WALLETS]);

  const checkForCounterpartyNullifications = async () => {
    // @ts-ignore
    const nullifyEvents = await account!.getEncryptedEvents(ZImburseEscrowContract.events.EntitlementNullified, 1, EVENT_BLOCK_LIMIT);
    const entropyVals = nullifyEvents.map(({ randomness }: any) => randomness);
    const notes = await account!.getIncomingNotes({scopes: [account!.getAddress()]});
    
    // map notes to nullify to specific escrow contracts
    const escrowNoteObj = notes.reduce((obj: any, note: UniqueNote) => {
      // check that note is correct type
      const entitlementNoteId = ZImburseEscrowContract.notes.EntitlementNote.id.value;
      if(note.noteTypeId.value === entitlementNoteId) {
        // check that note entropy matches entropy emitted in nullify event
        const entropy = note.note.items[7].toBigInt();
        if(entropyVals.includes(entropy)) {
          const escrow = note.contractAddress.toString();
          // if escrow is not key in object then initialize
          if(escrow in obj) {
            obj[escrow].push(entropy);
          } else {
            obj[escrow] = [entropy];
          }
        }
      }
      return obj;
    }, {});

    // nullify notes if there are notes to nullify
    if(Object.keys(escrowNoteObj).length > 0) {
      await nullifyNotes(escrowNoteObj);
    }
  }

  const nullifyNotes = async (escrowNoteObj: any) => {
    const NULLIFY_CHUNK_SIZE = 10;
    // load escrow contract instances
    const escrowContracts = await Promise.all(Object.keys(escrowNoteObj).map(async (address: string) => {
      return await ZImburseEscrowContract.at(AztecAddress.fromString(address), account);
    }));

    // create transaction requests
    const txRequests = escrowContracts.map(contract => {
      const requests = [];
      const entropyVals = escrowNoteObj[contract.address.toString()];
      // nullify entitlements can only nullify 10 notes at a time currently
      for(let i = 0; i < entropyVals.length; i += NULLIFY_CHUNK_SIZE) {
        const slice = entropyVals.slice(i, i + NULLIFY_CHUNK_SIZE);
        // make sure array size is 10
        slice.push(...new Array(10 - slice.length).fill(0));
        requests.push(contract.methods.nullify_entitlements(slice).request())
      }
      return requests;
    });

    // flatten requests and batch call
    await Promise.all(chunk(txRequests.flat(), 4).map(batch => new BatchCall(account!, batch).send()))
  }

  const checkAndRegisterAccount = async (secretKey: Fr): Promise<AccountWalletWithSecretKey> => {
      // load schnorr account
      const schnorr = getSchnorrAccount(
        pxe,
        secretKey,
        deriveSigningKey(secretKey),
        0
      );

    // check if account is already registerd on pxe
    const isRegistered = await pxe.getRegisteredAccount(
        schnorr.getAddress()
    );

    // if account not already registered then deploy to pxe
    if (!isRegistered) {
        await schnorr.deploy().wait();
    }

      return schnorr.getWallet()
  }

  const connectWallet = async (secretKey: Fr) => {
    setConnecting(true);
    try {
      const wallet = await checkAndRegisterAccount(secretKey);
      setAccount(wallet);
      localStorage.setItem(ZIMBURSE_LS_KEY, wallet.getAddress().toString());
    } catch (err) {
      toast.error('Error connecting wallet!');
    } finally {
      setConnecting(false);
    }
  };

  const disconnectWallet = async () => {
    setAccount(undefined);
    localStorage.removeItem(ZIMBURSE_LS_KEY);
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
        private: privateBalance,
        public: publicBalance,
      });
      setTokenContract(contract);
      setFetchingTokenBalance(false);

      // check for events to nullify
      await checkForCounterpartyNullifications();
    })();
  }, [account, viewOnlyAccount]);

  useEffect(() => {
    (async () => {
      const sessionAddress = localStorage.getItem(ZIMBURSE_LS_KEY);
      const acc = sessionAddress ? accounts.find(acc => acc.address.equals(AztecAddress.fromString(sessionAddress))) : undefined;
      if(acc) {
        await connectWallet(acc.secretKey);
      }
    })();
  }, [accounts])

  return (
    <AztecContext.Provider
      value={{
        account,
        accounts,
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
