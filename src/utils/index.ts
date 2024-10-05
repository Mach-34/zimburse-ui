export const truncateAddress = (address: string, startLen?: number, endLen?: number) => {
    return `${address.slice(0, startLen ?? 6)}...${address.slice((endLen ?? 4) * -1)}`
}