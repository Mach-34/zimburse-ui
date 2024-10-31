import { useEffect, useState } from 'react';
import { ZImburseEscrowContract } from '../artifacts';
import { useAztec } from '../contexts/AztecContext';
import { AztecAddress } from '@aztec/circuits.js';

export default function useEscrowContract(address: string) {
  const { account } = useAztec();
  const [contract, setContract] = useState<ZImburseEscrowContract | null>(null);

  useEffect(() => {
    (async () => {
      if (!account) return;
      const escrow = await ZImburseEscrowContract.at(
        AztecAddress.fromString(address),
        account
      );
      setContract(escrow);
    })();
  }, [account]);

  return contract;
}
