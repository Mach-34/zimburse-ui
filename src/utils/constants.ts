import { AztecAddress, Fr } from "@aztec/circuits.js";

export type AztecAccount = {
    address: AztecAddress;
    secretKey: Fr;
}

export const DEFAULT_PXE_URL = 'http://localhost:8080'

export const EVENT_BLOCK_LIMIT = 100000;

export const ENTITLEMENT_TITLES: { [key: number]: string } = {
    2: 'Linode Billing',
    5: 'United Flight'
};

export const NUMBER_INPUT_REGEX = /^\d*\.?\d{0,6}$/;

export const ZIMBURSE_REGISTRY_LS_KEY = 'zimburse_registry_contract';
export const ZIMBURSE_USDC_LS_KEY = 'zimburse_usdc_contract';
export const ZIMBURSE_WALLET_LS_KEY = 'zimburse_wallet';