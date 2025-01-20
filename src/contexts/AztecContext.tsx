import {
  createContext,
  Dispatch,
  SetStateAction,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
} from 'react';
import {
  AccountWalletWithSecretKey,
  AztecAddress,
  BatchCall,
  createPXEClient,
  Fq,
  Fr,
  PXE,
  UniqueNote,
  waitForPXE,
} from '@aztec/aztec.js';
import {
  AZTEC_WALLETS,
  DEFAULT_PXE_URL,
  EVENT_BLOCK_LIMIT,
  ZIMBURSE_REGISTRY_ADMIN,
  ZIMBURSE_REGISTRY_LS_KEY,
  ZIMBURSE_USDC_LS_KEY,
  ZIMBURSE_WALLET_LS_KEY,
} from '../utils/constants';
import { getSchnorrAccount } from '@aztec/accounts/schnorr';
import {
  TokenContract,
  ZImburseEscrowContract,
  ZImburseRegistryContract,
} from '../artifacts';
import {
  computeContractClassId,
  deriveSigningKey,
  getContractClassFromArtifact,
} from '@aztec/circuits.js';
import { toast } from 'react-toastify';
import chunk from 'lodash.chunk';
import { USDC_TOKEN } from '@mach-34/zimburse/dist/src/constants';
import { getDkimInputs } from '../utils';
import usePxeHealth from '../hooks/usePXEHealth';

type AztecContextProps = {
  account: AccountWalletWithSecretKey | undefined;
  connectToPXE: () => void;
  connectWallet: (wallet: AccountWalletWithSecretKey) => Promise<void>;
  deployContracts: () => Promise<void>;
  deployingContracts: boolean;
  disconnectWallet: () => Promise<void>;
  fetchingTokenBalance: boolean;
  loadingContracts: boolean;
  pxe: PXE | null;
  registryAdmin: AccountWalletWithSecretKey | undefined;
  registryContract: ZImburseRegistryContract | undefined;
  setTokenBalance: Dispatch<SetStateAction<TokenBalance>>;
  tokenBalance: TokenBalance;
  tokenContract: TokenContract | undefined;
  waitingForPXE: boolean;
  wallets: AccountWalletWithSecretKey[];
};

const DEFAULT_AZTEC_CONTEXT_PROPS = {
  account: undefined,
  connectToPXE: () => null,
  connectWallet: async () => {},
  deployContracts: async () => {},
  deployingContracts: false,
  disconnectWallet: async () => {},
  fetchingTokenBalance: false,
  loadingContracts: false,
  pxe: null,
  registryAdmin: undefined,
  registryContract: undefined,
  setTokenBalance: (() => {}) as Dispatch<SetStateAction<TokenBalance>>,
  tokenBalance: { private: 0n, public: 0n },
  tokenContract: undefined,
  waitingForPXE: false,
  wallets: [],
};

const AztecContext = createContext<AztecContextProps>(
  DEFAULT_AZTEC_CONTEXT_PROPS
);

type TokenBalance = {
  private: bigint;
  public: bigint;
};

type ZimburseContracts = {
  registry: ZImburseRegistryContract;
  usdc: TokenContract;
};

export const AztecProvider = ({ children }: { children: ReactNode }) => {
  const [account, setAccount] = useState<
    AccountWalletWithSecretKey | undefined
  >(undefined);
  const [deployingContracts, setDeployingContracts] = useState<boolean>(false);
  const [fetchingTokenBalance, setFetchingTokenBalance] =
    useState<boolean>(false);
  const [loadingContracts, setLoadingContracts] = useState<boolean>(true);
  const [pxe, setPXE] = useState<PXE | null>(null);
  const [registryAdmin, setRegistryAdmin] = useState<
    AccountWalletWithSecretKey | undefined
  >(undefined);
  const [tokenBalance, setTokenBalance] = useState<TokenBalance>({
    private: 0n,
    public: 0n,
  });
  const [waitingForPXE, setWaitingForPXE] = useState<boolean>(false);
  const [wallets, setWallets] = useState<AccountWalletWithSecretKey[]>([]);
  const [zimburseContracts, setZimburseContracts] = useState<
    ZimburseContracts | undefined
  >(undefined);

  // monitor PXE connection
  usePxeHealth(pxe, () => {
    setAccount(undefined);
    setRegistryAdmin(undefined);
    setWallets([]);
    setPXE(null);
  });

  const nullifyNotes = useCallback(
    async (escrowNoteObj: any) => {
      const NULLIFY_CHUNK_SIZE = 10;
      // load escrow contract instances
      const escrowContracts = await Promise.all(
        Object.keys(escrowNoteObj).map(async (address: string) => {
          return await ZImburseEscrowContract.at(
            // @ts-ignore
            AztecAddress.fromString(address),
            // @ts-ignore
            account
          );
        })
      );

      // create transaction requests
      const txRequests = escrowContracts.map((contract) => {
        const requests = [];
        const entropyVals = escrowNoteObj[contract.address.toString()];
        // nullify entitlements can only nullify 10 notes at a time currently
        for (let i = 0; i < entropyVals.length; i += NULLIFY_CHUNK_SIZE) {
          const slice = entropyVals.slice(i, i + NULLIFY_CHUNK_SIZE);
          // make sure array size is 10
          slice.push(...new Array(10 - slice.length).fill(0));
          requests.push(contract.methods.nullify_entitlements(slice).request());
        }
        return requests;
      });

      // flatten requests and batch call
      await Promise.all(
        chunk(txRequests.flat(), 4).map((batch) =>
          new BatchCall(account!, batch).send()
        )
      );
    },
    [account]
  );

  const checkForCounterpartyNullifications = useCallback(async () => {
    const nullifyEvents = await account!.getEncryptedEvents(
      ZImburseEscrowContract.events.EntitlementNullified,
      1,
      EVENT_BLOCK_LIMIT
    );
    const entropyVals = nullifyEvents.map(({ randomness }: any) => randomness);
    const notes = await account!.getIncomingNotes({
      scopes: [account!.getAddress()],
    });

    // map notes to nullify to specific escrow contracts
    const escrowNoteObj = notes.reduce((obj: any, note: UniqueNote) => {
      // check that note is correct type
      const entitlementNoteId =
        ZImburseEscrowContract.notes.EntitlementNote.id.value;
      if (note.noteTypeId.value === entitlementNoteId) {
        // check that note entropy matches entropy emitted in nullify event
        const entropy = note.note.items[7].toBigInt();
        if (entropyVals.includes(entropy)) {
          const escrow = note.contractAddress.toString();
          // if escrow is not key in object then initialize
          if (escrow in obj) {
            obj[escrow].push(entropy);
          } else {
            obj[escrow] = [entropy];
          }
        }
      }
      return obj;
    }, {});

    // nullify notes if there are notes to nullify
    if (Object.keys(escrowNoteObj).length > 0) {
      await nullifyNotes(escrowNoteObj);
    }
  }, [account, nullifyNotes]);

  const checkAndRegisterAccount = useCallback(
    async (secretKey: Fr): Promise<AccountWalletWithSecretKey> => {
      // load schnorr account
      const schnorr = getSchnorrAccount(
        pxe!,
        secretKey,
        deriveSigningKey(secretKey),
        0
      );

      // check if account is already registerd on pxe
      const isRegistered = await pxe!.getRegisteredAccount(
        schnorr.getAddress()
      );

      // if account not already registered then deploy to pxe
      if (!isRegistered) {
        await schnorr.deploy().wait();
      }

      return schnorr.getWallet();
    },
    [pxe]
  );

  const checkAndGetRegistryAdmin =
    useCallback(async (): Promise<AccountWalletWithSecretKey> => {
      const admin = getSchnorrAccount(
        pxe!,
        Fr.fromHexString(ZIMBURSE_REGISTRY_ADMIN.Fr),
        Fq.fromHexString(ZIMBURSE_REGISTRY_ADMIN.Fq),
        0
      );

      const isRegistered = await pxe!.getRegisteredAccount(admin.getAddress());

      // if account not already registered then deploy to pxe
      if (!isRegistered) {
        await admin.deploy().wait();
      }

      return await admin.getWallet();
    }, [pxe]);

  const connectToPXE = async () => {
    setWaitingForPXE(true);
    const client = createPXEClient(DEFAULT_PXE_URL);
    await waitForPXE(client);
    setPXE(client);
    setWaitingForPXE(false);
  };

  const connectWallet = async (wallet: AccountWalletWithSecretKey) => {
    setAccount(wallet);
    localStorage.setItem(
      ZIMBURSE_WALLET_LS_KEY,
      wallet.getAddress().toString()
    );
  };

  const deployContracts = async () => {
    if (!registryAdmin) return;
    setDeployingContracts(true);
    try {
      const usdc = await TokenContract.deploy(
        registryAdmin,
        registryAdmin.getAddress(),
        USDC_TOKEN.symbol,
        USDC_TOKEN.name,
        USDC_TOKEN.decimals
      )
        .send()
        .deployed();

      // deploy registry contract
      const dkimKeys = getDkimInputs();

      // calculate contract class ID
      const artifact = ZImburseEscrowContract.artifact;
      const contractClass = getContractClassFromArtifact(artifact);
      const escrowClassId = computeContractClassId(contractClass);

      const registry = await ZImburseRegistryContract.deploy(
        registryAdmin,
        usdc.address,
        escrowClassId,
        dkimKeys[0].map((key) => key.id),
        dkimKeys[0].map((key) => key.hash)
      )
        .send()
        .deployed();

      // store contract addresses in local storage
      localStorage.setItem(ZIMBURSE_USDC_LS_KEY, usdc.address.toString());
      localStorage.setItem(
        ZIMBURSE_REGISTRY_LS_KEY,
        registry.address.toString()
      );

      toast.success('Contracts succesfully deployed');
      setZimburseContracts({ registry, usdc });
    } catch {
      toast.error('Error occurred deploying contracts');
    } finally {
      setDeployingContracts(false);
    }
  };

  const disconnectWallet = async () => {
    setAccount(undefined);
    localStorage.removeItem(ZIMBURSE_WALLET_LS_KEY);
  };

  const fetchTokenBalances = useCallback(
    async (usdc: TokenContract) => {
      setFetchingTokenBalance(true);
      const publicBalance = await usdc.methods
        .balance_of_public(account!.getAddress())
        .simulate();

      const privateBalance = await usdc.methods
        .balance_of_private(account!.getAddress())
        .simulate();

      setTokenBalance({
        private: privateBalance,
        public: publicBalance,
      });
      setFetchingTokenBalance(false);
    },
    [account]
  );

  const loadContractInstances = async (admin: AccountWalletWithSecretKey) => {
    const storedRegistryAddress = localStorage.getItem(
      ZIMBURSE_REGISTRY_LS_KEY
    );
    const storedUsdcAddress = localStorage.getItem(ZIMBURSE_USDC_LS_KEY);

    if (storedRegistryAddress && storedUsdcAddress) {
      try {
        const registry = await ZImburseRegistryContract.at(
          AztecAddress.fromString(storedRegistryAddress),
          admin
        );

        const usdc = await TokenContract.at(
          AztecAddress.fromString(storedUsdcAddress),
          admin
        );

        setZimburseContracts({ registry, usdc });
      } catch (err: any) {
        const message: string = err.message;
        const contractInstanceError = message.indexOf(
          `has not been registered in the wallet's PXE`
        );
        if (contractInstanceError !== -1) {
          const contractAddressEndIndex = contractInstanceError - 2;
          const contractAddressStartIndex =
            message.lastIndexOf(' ', contractAddressEndIndex) + 1;
          const contractAddress = message.slice(
            contractAddressStartIndex,
            contractAddressEndIndex + 1
          );

          if (contractAddress === storedRegistryAddress) {
            toast.error(
              `Saved registry contract at ${contractAddress} not found. Please redeploy`
            );
          } else {
            toast.error(
              `Saved USDC contract at ${contractAddress} not found. Please redeploy`
            );
          }
        } else {
          toast.error('Error occurred connecting to contracts');
        }
      }
    }
    setLoadingContracts(false);
  };

  useEffect(() => {
    (async () => {
      if (zimburseContracts) {
        await fetchTokenBalances(zimburseContracts.usdc);
        // check for events to nullify
        await checkForCounterpartyNullifications();
      }
    })();
  }, [
    checkForCounterpartyNullifications,
    fetchTokenBalances,
    zimburseContracts,
  ]);

  useEffect(() => {
    (async () => {
      if (!pxe) return;
      // check if registry admin exists and if not then register to pxe
      const admin = await checkAndGetRegistryAdmin();
      await loadContractInstances(admin);
      setRegistryAdmin(admin);

      // load in wallets
      const resolvedWallets = [];
      for (const secretKey of AZTEC_WALLETS) {
        const wallet = await checkAndRegisterAccount(
          Fr.fromHexString(secretKey)
        );
        resolvedWallets.push(wallet);
      }

      const sessionAddress = localStorage.getItem(ZIMBURSE_WALLET_LS_KEY);
      const acc = sessionAddress
        ? resolvedWallets.find((wallet: AccountWalletWithSecretKey) =>
            wallet.getAddress().equals(AztecAddress.fromString(sessionAddress))
          )
        : undefined;
      setAccount(acc);
      setWallets(resolvedWallets);
    })();
  }, [checkAndGetRegistryAdmin, checkAndRegisterAccount, pxe]);

  useEffect(() => {
    connectToPXE();
  }, []);

  return (
    <AztecContext.Provider
      value={{
        account,
        connectToPXE,
        connectWallet,
        disconnectWallet,
        deployContracts,
        deployingContracts,
        fetchingTokenBalance,
        loadingContracts,
        pxe,
        registryAdmin,
        registryContract: zimburseContracts?.registry,
        setTokenBalance,
        tokenBalance,
        tokenContract: zimburseContracts?.usdc,
        waitingForPXE,
        wallets,
      }}
    >
      {children}
    </AztecContext.Provider>
  );
};

export const useAztec = () => useContext(AztecContext);
