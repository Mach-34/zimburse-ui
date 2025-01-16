import dkimKeys from '@mach-34/zimburse/dist/src/dkim/keyHashes.json';

type KeyInput = {
    id: bigint,
    hash: bigint
}

export const formatUSDC = (val: bigint) => {

    const { decimal, integer } = fromUSDCDecimals(val);

    // Convert integer part to string with commas
    const integerStr = integer.toLocaleString('en-US');

    if (decimal) {
        return `${integerStr}.${decimal}`;
    }
    return integerStr;
}

export const fromUSDCDecimals = (amount: bigint): { integer: bigint; decimal: bigint } => {
    const integer = amount / 10n ** 6n;
    const decimal = amount % 10n ** 6n;
    return { integer, decimal };
}

export const fromU128 = (u128: { lo: bigint; hi: bigint }): bigint => {
    return u128.lo + u128.hi * 2n ** 64n;
}

export const getDkimInputs = (): KeyInput[][] => {
    const batches: KeyInput[][] = [];
    for (let i = 0; i < dkimKeys.length; i += 4) {
        const batch: KeyInput[] = [];
        for (let j = i; j < i + 4; j++) {
            if (j >= dkimKeys.length) {
                batch.push({
                    id: BigInt(0),
                    hash: BigInt(0)
                })
            } else {
                batch.push({
                    id: BigInt(dkimKeys[j].id),
                    hash: BigInt(dkimKeys[j].hash)
                });
            }
        }
        batches.push(batch);
    }
    return batches
}

/** parses a string  */
export const parseStringBytes = (bytes: bigint[]): string => {
    const index0 = bytes.findIndex(byte => byte === 0n);
    const length = index0 === -1 ? bytes.length : index0;
    const buffer = new Uint8Array(bytes.map(byte => Number(byte)));
    return String.fromCharCode(...buffer.slice(0, length));
}

export const truncateAddress = (address: string, startLen?: number, endLen?: number) => {
    return `${address.slice(0, startLen ?? 6)}...${address.slice((endLen ?? 4) * -1)}`
}

export const toUSDCDecimals = (amount: string | bigint): bigint => {
    if (typeof amount === 'string') {
        const split = amount.split('.');
        if (split[1]) {
            return BigInt(`${split[0]}${split[1].padEnd(6, '0')}`)
        }
        return BigInt(split[0]) * 10n ** 6n
    }
    return amount * 10n ** 6n
};