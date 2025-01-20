import { useAztec } from '../../../contexts/AztecContext';
import { useState } from 'react';
import Loader from '../../Loader';
import usdc from '../../../assets/usdc.png';
import { formatUSDC, toUSDCDecimals } from '../../../utils';
import { toast } from 'react-toastify';
import { Lock, LockOpen, Plus } from 'lucide-react';

export default function TokenBalanceSection() {
  const {
    account,
    fetchingTokenBalance,
    pxe,
    registryAdmin,
    setTokenBalance,
    tokenBalance,
    tokenContract,
  } = useAztec();
  const [minting, setMinting] = useState<boolean>(false);

  const MINT_AMOUNT = toUSDCDecimals(10000n);

  const mintUsdc = async () => {
    if (!account || !registryAdmin || !tokenContract) return;
    try {
      setMinting(true);
      await tokenContract
        .withWallet(registryAdmin)
        .methods.mint_to_public(account.getAddress(), MINT_AMOUNT)
        .send()
        .wait();
      setTokenBalance((prev) => ({
        ...prev,
        public: prev.public + MINT_AMOUNT,
      }));
      toast.success(`Successfully minted ${formatUSDC(MINT_AMOUNT)} USDC`);
    } catch (err) {
      console.log('Error: ', err);
      toast.error('Error minting tokens.');
    } finally {
      setMinting(false);
    }
  };

  if (!pxe) {
    return <></>;
  } else {
    return (
      <>
        {account &&
          (fetchingTokenBalance ? (
            <div className='flex gap-2 items-center mr-8'>
              <div className='text-sm'>Fetching token balances...</div>
              <Loader size={16} />
            </div>
          ) : (
            <>
              <div className='border border-black border-solid p-1 rounded'>
                <div className='flex items-center gap-4'>
                  <div>
                    <div className='flex gap-1 items-center'>
                      <div>Balance</div>
                      <img alt='USDC' className='h-4 w-4' src={usdc} />
                    </div>
                    <button
                      className='bg-green-600 flex gap-1 items-center rounded-full px-1 py-0.5 text-white text-[10px]'
                      onClick={() => mintUsdc()}
                    >
                      {minting ? 'Minting...' : 'Mint'}
                      {!minting && <Plus size={10} />}
                      {minting && <Loader size={10} />}
                    </button>
                  </div>
                  <div>
                    <div className='flex items-center text-xs'>
                      Public <LockOpen className='mx-1' size={12} />: $
                      {formatUSDC(tokenBalance.public)}
                    </div>
                    <div className='flex items-center text-xs'>
                      Private <Lock className='mx-1' size={12} />: $
                      {formatUSDC(tokenBalance.private)}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ))}
      </>
    );
  }
}
