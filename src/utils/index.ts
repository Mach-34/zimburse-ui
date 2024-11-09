export const formatUSDC = (val: bigint) => {

    const { decimal, integer } = fromUSDCDecimals(val);

     // Convert integer part to string with commas
     const integerStr = integer.toLocaleString('en-US');

     if(decimal) {
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
    if(typeof amount === 'string') {
        const split = amount.split('.');
        if(split[1]) {
            return BigInt(`${split[0]}${split[1].padEnd(6, '0')}`)
        }
        return BigInt(split[0]) * 10n ** 6n
    }
    return amount * 10n ** 6n
};