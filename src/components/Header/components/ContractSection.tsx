import { useAztec } from '../../../contexts/AztecContext';
import { ReceiptText, RotateCcw } from 'lucide-react';
import Loader from '../../Loader';
import { useMemo } from 'react';
import { truncateAddress } from '../../../utils';

export default function ContractSection() {
  const {
    deployContracts,
    deployingContracts,
    loadingContracts,
    pxe,
    registryContract,
    tokenContract,
  } = useAztec();

  const deployButtonText = useMemo(() => {
    if (registryContract || tokenContract) {
      return deployingContracts ? 'Redeploying...' : 'Redeploy';
    }
    return deployingContracts ? 'Deploying...' : 'Deploy';
  }, [deployingContracts, registryContract, tokenContract]);

  if (!pxe) {
    return <></>;
  } else if (loadingContracts) {
    return (
      <div className='flex gap-2 items-center mr-8'>
        <div className='text-sm'>Loading contracts...</div>
        <Loader size={16} />
      </div>
    );
  } else {
    return (
      <div className='border border-black flex gap-4 items-center rounded px-2 py-1'>
        <div>
          <div>
            <div className='flex gap-1 items-center'>
              <div className='text-xs'>Contracts</div>
              <ReceiptText size={12} />
            </div>
            <button
              className='bg-yellow-400 flex gap-1 items-center mt-2 px-1 py-0.5 rounded-full text-[10px]'
              onClick={() => deployContracts()}
            >
              {deployButtonText}
              {deployingContracts ? (
                <Loader size={10} />
              ) : (
                <RotateCcw size={10} />
              )}
            </button>
          </div>
        </div>
        <div className='mt-2'>
          <div className='flex gap-4 justify-between text-xs'>
            <div>Usdc:</div>
            <div>
              {tokenContract
                ? truncateAddress(tokenContract.address.toString())
                : 'None found'}
            </div>
          </div>
          <div className='flex gap-4 justify-between text-xs'>
            <div>Escrow Registry:</div>
            <div>
              {registryContract
                ? truncateAddress(registryContract.address.toString())
                : 'None found'}
            </div>
          </div>
        </div>
      </div>
    );
  }
}
