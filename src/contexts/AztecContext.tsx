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
  AccountWalletWithSecretKey,
  AztecAddress,
  BatchCall,
  createPXEClient,
  Fq,
  Fr,
  UniqueNote,
} from '@aztec/aztec.js';
import {
  AZTEC_WALLETS,
  AztecAccount,
  DEFAULT_PXE_URL,
  EVENT_BLOCK_LIMIT,
  ZIMBURSE_REGISTRY_ADMIN,
  ZIMBURSE_REGISTRY_LS_KEY,
  ZIMBURSE_USDC_LS_KEY,
  ZIMBURSE_WALLET_LS_KEY,
} from '../utils/constants';
import { getInitialTestAccountsWallets } from '@aztec/accounts/testing';
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

type AztecContextProps = {
  account: AccountWalletWithSecretKey | undefined;
  accounts: Array<AztecAccount>;
  connecting: boolean;
  connectWallet: (secretKey: Fr) => Promise<void>;
  deployContracts: () => Promise<void>;
  deployingContracts: boolean;
  disconnectWallet: () => Promise<void>;
  fetchingTokenBalance: boolean;
  registryAdmin: AccountWalletWithSecretKey | undefined;
  registryContract: ZImburseRegistryContract | undefined;
  setTokenBalance: Dispatch<SetStateAction<TokenBalance>>;
  tokenBalance: TokenBalance;
  tokenContract: TokenContract | undefined;
  viewOnlyAccount: AccountWalletWithSecretKey | undefined;
};

const DEFAULT_AZTEC_CONTEXT_PROPS = {
  account: undefined,
  accounts: [],
  connecting: false,
  connectWallet: async (_secretKey: Fr) => {},
  deployContracts: async () => {},
  deployingContracts: false,
  disconnectWallet: async () => {},
  fetchingTokenBalance: false,
  registryAdmin: undefined,
  registryContract: undefined,
  setTokenBalance: (() => {}) as Dispatch<SetStateAction<TokenBalance>>,
  tokenBalance: { private: 0n, public: 0n },
  tokenContract: undefined,
  viewOnlyAccount: undefined,
  zimburseContracts: undefined,
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

const pxe = createPXEClient(DEFAULT_PXE_URL);
const [viewOnlyAccount] = await getInitialTestAccountsWallets(pxe);

export const AztecProvider = ({ children }: { children: ReactNode }) => {
  const [account, setAccount] = useState<
    AccountWalletWithSecretKey | undefined
  >(undefined);
  const [connecting, setConnecting] = useState<boolean>(false);
  const [deployingContracts, setDeployingContracts] = useState<boolean>(false);
  const [fetchingTokenBalance, setFetchingTokenBalance] =
    useState<boolean>(false);
  const [registryAdmin, setRegistryAdmin] = useState<
    AccountWalletWithSecretKey | undefined
  >(undefined);
  const [tokenBalance, setTokenBalance] = useState<TokenBalance>({
    private: 0n,
    public: 0n,
  });
  const [zimburseContracts, setZimburseContracts] = useState<
    ZimburseContracts | undefined
  >(undefined);

  const accounts: Array<AztecAccount> = useMemo(() => {
    return AZTEC_WALLETS.map((secretKey: string) => {
      const secretFr = Fr.fromHexString(secretKey);
      const signingKey = deriveSigningKey(secretFr);
      const schnorr = getSchnorrAccount(pxe, secretFr, signingKey, 0);
      return {
        address: schnorr.getAddress(),
        secretKey: Fr.fromHexString(secretKey),
      };
    });
  }, [AZTEC_WALLETS]);

  const checkForCounterpartyNullifications = async () => {
    // @ts-ignore
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
  };

  const nullifyNotes = async (escrowNoteObj: any) => {
    const NULLIFY_CHUNK_SIZE = 10;
    // load escrow contract instances
    const escrowContracts = await Promise.all(
      Object.keys(escrowNoteObj).map(async (address: string) => {
        return await ZImburseEscrowContract.at(
          AztecAddress.fromString(address),
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
  };

  const checkAndRegisterAccount = async (
    secretKey: Fr
  ): Promise<AccountWalletWithSecretKey> => {
    // load schnorr account
    const schnorr = getSchnorrAccount(
      pxe,
      secretKey,
      deriveSigningKey(secretKey),
      0
    );

    // check if account is already registerd on pxe
    const isRegistered = await pxe.getRegisteredAccount(schnorr.getAddress());

    // if account not already registered then deploy to pxe
    if (!isRegistered) {
      await schnorr.deploy().wait();
    }

    return schnorr.getWallet();
  };

  const checkRegistryAdmin = async () => {
    const admin = getSchnorrAccount(
      pxe,
      Fr.fromHexString(ZIMBURSE_REGISTRY_ADMIN.Fr),
      Fq.fromHexString(ZIMBURSE_REGISTRY_ADMIN.Fq),
      0
    );

    const isRegistered = await pxe.getRegisteredAccount(admin.getAddress());

    // if account not already registered then deploy to pxe
    if (!isRegistered) {
      await admin.deploy().wait();
    }

    setRegistryAdmin(await admin.getWallet());
  };

  const connectWallet = async (secretKey: Fr) => {
    setConnecting(true);
    try {
      const wallet = await checkAndRegisterAccount(secretKey);
      setAccount(wallet);
      localStorage.setItem(
        ZIMBURSE_WALLET_LS_KEY,
        wallet.getAddress().toString()
      );
    } catch (err) {
      toast.error('Error connecting wallet!');
    } finally {
      setConnecting(false);
    }
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
      // @ts-ignore
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
    } catch (err) {
      toast.error('Error occurred deploying contracts');
    } finally {
      setDeployingContracts(false);
    }
  };

  const disconnectWallet = async () => {
    setAccount(undefined);
    localStorage.removeItem(ZIMBURSE_WALLET_LS_KEY);
  };

  const fetchTokenBalances = async (usdc: TokenContract) => {
    setFetchingTokenBalance(true);
    const publicBalance = await usdc
      .withWallet(viewOnlyAccount)
      .methods.balance_of_public(account!.getAddress())
      .simulate();

    const privateBalance = await usdc
      .withWallet(viewOnlyAccount)
      .methods.balance_of_private(account!.getAddress())
      .simulate();

    setTokenBalance({
      private: privateBalance,
      public: publicBalance,
    });
    setFetchingTokenBalance(false);
  };

  const loadContractInstances = async () => {
    const storedRegistryAddress = localStorage.getItem(
      ZIMBURSE_REGISTRY_LS_KEY
    );
    const storedUsdcAddress = localStorage.getItem(ZIMBURSE_USDC_LS_KEY);

    if (storedRegistryAddress && storedUsdcAddress) {
      try {
        const registry = await ZImburseRegistryContract.at(
          AztecAddress.fromString(storedRegistryAddress),
          account!
        );

        const usdc = await TokenContract.at(
          AztecAddress.fromString(storedUsdcAddress),
          account!
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
  };

  useEffect(() => {
    (async () => {
      if (zimburseContracts) {
        await fetchTokenBalances(zimburseContracts.usdc);
        // check for events to nullify
        await checkForCounterpartyNullifications();
      }
    })();
  }, [zimburseContracts]);

  useEffect(() => {
    (async () => {
      if (!account) return;
      await loadContractInstances();
    })();
  }, [account]);

  useEffect(() => {
    (async () => {
      const sessionAddress = localStorage.getItem(ZIMBURSE_WALLET_LS_KEY);
      const acc = sessionAddress
        ? accounts.find((acc) =>
            acc.address.equals(AztecAddress.fromString(sessionAddress))
          )
        : undefined;
      if (acc) {
        await connectWallet(acc.secretKey);
      }
    })();
  }, [accounts]);

  useEffect(() => {
    // check if registry admin exists and if not then register to pxe
    checkRegistryAdmin();
  }, []);

  return (
    <AztecContext.Provider
      value={{
        account,
        accounts,
        connecting,
        connectWallet,
        disconnectWallet,
        deployContracts,
        deployingContracts,
        fetchingTokenBalance,
        registryAdmin,
        registryContract: zimburseContracts?.registry,
        setTokenBalance,
        tokenBalance,
        tokenContract: zimburseContracts?.usdc,
        viewOnlyAccount,
      }}
    >
      {children}
    </AztecContext.Provider>
  );
};

export const useAztec = () => useContext(AztecContext);
