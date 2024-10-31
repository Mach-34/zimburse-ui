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