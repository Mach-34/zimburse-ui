import { useEffect, useState } from 'react';
import { ZImburseRegistryContract } from '../artifacts';
import { useAztec } from '../contexts/AztecContext';
import { AztecAddress } from '@aztec/circuits.js';

export default function useRegistryContract(address: string) {
  const { account } = useAztec();
  const [contract, setContract] = useState<ZImburseRegistryContract | null>(
    null
  );

  useEffect(() => {
    (async () => {
      if (!account) return;
      const registry = await ZImburseRegistryContract.at(
        AztecAddress.fromString(address),
        account
      );
      setContract(registry);
    })();
  }, [account]);

  return contract;
}
