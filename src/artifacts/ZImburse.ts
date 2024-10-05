
/* Autogenerated file, do not edit! */

/* eslint-disable */
import {
  type AbiType,
  AztecAddress,
  type AztecAddressLike,
  CompleteAddress,
  Contract,
  type ContractArtifact,
  ContractBase,
  ContractFunctionInteraction,
  type ContractInstanceWithAddress,
  type ContractMethod,
  type ContractStorageLayout,
  type ContractNotes,
  decodeFromAbi,
  DeployMethod,
  EthAddress,
  type EthAddressLike,
  EventSelector,
  type FieldLike,
  Fr,
  type FunctionSelectorLike,
  L1EventPayload,
  loadContractArtifact,
  type NoirCompiledContract,
  NoteSelector,
  Point,
  type PublicKey,
  type UnencryptedL2Log,
  type Wallet,
  type WrappedFieldLike,
} from '@aztec/aztec.js';
import ZImburseContractArtifactJson from './ZImburse.json' assert { type: 'json' };
// @ts-ignore
export const ZImburseContractArtifact = loadContractArtifact(ZImburseContractArtifactJson as NoirCompiledContract);



/**
 * Type-safe interface for contract ZImburse;
 */
export class ZImburseContract extends ContractBase {

  private constructor(
    instance: ContractInstanceWithAddress,
    wallet: Wallet,
  ) {
    super(instance, ZImburseContractArtifact, wallet);
  }



  /**
   * Creates a contract instance.
   * @param address - The deployed contract's address.
   * @param wallet - The wallet to use when interacting with the contract.
   * @returns A promise that resolves to a new Contract instance.
   */
  public static async at(
    address: AztecAddress,
    wallet: Wallet,
  ) {
    return Contract.at(address, ZImburseContract.artifact, wallet) as Promise<ZImburseContract>;
  }


  /**
   * Creates a tx to deploy a new instance of this contract.
   */
  public static deploy(wallet: Wallet, usdc_token: AztecAddressLike, title: string) {
    return new DeployMethod<ZImburseContract>(Fr.ZERO, wallet, ZImburseContractArtifact, ZImburseContract.at, Array.from(arguments).slice(1));
  }

  /**
   * Creates a tx to deploy a new instance of this contract using the specified public keys hash to derive the address.
   */
  public static deployWithPublicKeysHash(publicKeysHash: Fr, wallet: Wallet, usdc_token: AztecAddressLike, title: string) {
    return new DeployMethod<ZImburseContract>(publicKeysHash, wallet, ZImburseContractArtifact, ZImburseContract.at, Array.from(arguments).slice(2));
  }

  /**
   * Creates a tx to deploy a new instance of this contract using the specified constructor method.
   */
  public static deployWithOpts<M extends keyof ZImburseContract['methods']>(
    opts: { publicKeysHash?: Fr; method?: M; wallet: Wallet },
    ...args: Parameters<ZImburseContract['methods'][M]>
  ) {
    return new DeployMethod<ZImburseContract>(
      opts.publicKeysHash ?? Fr.ZERO,
      opts.wallet,
      ZImburseContractArtifact,
      ZImburseContract.at,
      Array.from(arguments).slice(1),
      opts.method ?? 'constructor',
    );
  }



  /**
   * Returns this contract's artifact.
   */
  public static get artifact(): ContractArtifact {
    return ZImburseContractArtifact;
  }


  public static get storage(): ContractStorageLayout<'admin' | 'minters' | 'balances' | 'total_supply' | 'pending_shields' | 'public_balances' | 'symbol' | 'name' | 'decimals'> {
    return {
      admin: {
        slot: new Fr(1n),
      },
      minters: {
        slot: new Fr(2n),
      },
      balances: {
        slot: new Fr(3n),
      },
      total_supply: {
        slot: new Fr(4n),
      },
      pending_shields: {
        slot: new Fr(5n),
      },
      public_balances: {
        slot: new Fr(6n),
      },
      symbol: {
        slot: new Fr(7n),
      },
      name: {
        slot: new Fr(8n),
      },
      decimals: {
        slot: new Fr(9n),
      }
    } as ContractStorageLayout<'admin' | 'minters' | 'balances' | 'total_supply' | 'pending_shields' | 'public_balances' | 'symbol' | 'name' | 'decimals'>;
  }


  public static get notes(): ContractNotes<'AddressNote' | 'TransparentNote' | 'TokenNote' | 'RecurringEntitlementNote' | 'UintNote'> {
    return {
      AddressNote: {
        id: new NoteSelector(2232136525),
      },
      TransparentNote: {
        id: new NoteSelector(3193649735),
      },
      TokenNote: {
        id: new NoteSelector(2350566847),
      },
      RecurringEntitlementNote: {
        id: new NoteSelector(3639716131),
      },
      UintNote: {
        id: new NoteSelector(202136239),
      }
    } as ContractNotes<'AddressNote' | 'TransparentNote' | 'TokenNote' | 'RecurringEntitlementNote' | 'UintNote'>;
  }


  /** Type-safe wrappers for the public methods exposed by the contract. */
  public declare methods: {

    /** compute_note_hash_and_optionally_a_nullifier(contract_address: struct, nonce: field, storage_slot: field, note_type_id: field, compute_nullifier: boolean, serialized_note: array) */
    compute_note_hash_and_optionally_a_nullifier: ((contract_address: AztecAddressLike, nonce: FieldLike, storage_slot: FieldLike, note_type_id: FieldLike, compute_nullifier: boolean, serialized_note: FieldLike[]) => ContractFunctionInteraction) & Pick<ContractMethod, 'selector'>;

    /** constructor(usdc_token: struct, title: string) */
    constructor: ((usdc_token: AztecAddressLike, title: string) => ContractFunctionInteraction) & Pick<ContractMethod, 'selector'>;

    /** get_title() */
    get_title: (() => ContractFunctionInteraction) & Pick<ContractMethod, 'selector'>;

    /** give_entitlement(to: struct, amount: field) */
    give_entitlement: ((to: AztecAddressLike, amount: FieldLike) => ContractFunctionInteraction) & Pick<ContractMethod, 'selector'>;

    /** redeem_linode_entitlement(body: array, body_hash_index: integer, body_length: integer, header: array, header_length: integer, pubkey: array, pubkey_redc: array, signature: array, from_index: integer, subject_index: integer, amount_index: integer, amount_length: integer, receipt_id_length: integer, claim_secret_hash: field) */
    redeem_linode_entitlement: ((body: (bigint | number)[], body_hash_index: (bigint | number), body_length: (bigint | number), header: (bigint | number)[], header_length: (bigint | number), pubkey: FieldLike[], pubkey_redc: FieldLike[], signature: FieldLike[], from_index: (bigint | number), subject_index: (bigint | number), amount_index: (bigint | number), amount_length: (bigint | number), receipt_id_length: (bigint | number), claim_secret_hash: FieldLike) => ContractFunctionInteraction) & Pick<ContractMethod, 'selector'>;
  };


}