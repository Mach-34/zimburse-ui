import { useMemo, useRef, useState } from 'react';
import { useAztec } from '../contexts/AztecContext';
import { formatNumber, truncateAddress } from '../utils';
import useOutsideAlerter from '../hooks/useOutsideAlerter';
import Loader from './Loader';
import { toast } from 'react-toastify';
import { toUSDCDecimals } from '@mach-34/zimburse/dist/src/utils';

export default function Header(): JSX.Element {
  const {
    account,
    connectWallet,
    connecting,
    disconnectWallet,
    fetchingTokenBalance,
    registryAdmin,
    setTokenBalance,
    tokenBalance,
    tokenContract,
  } = useAztec();
  const menuRef = useRef(null);
  const [minting, setMinting] = useState<boolean>(false);
  const [showMenu, setShowMenu] = useState<boolean>(false);

  useOutsideAlerter(menuRef, () => setShowMenu(false));

  const MINT_AMOUNT = 10000;

  const mintUsdc = async () => {
    if (!account || !registryAdmin || !tokenContract) return;
    try {
      setMinting(true);
      await tokenContract
        .withWallet(registryAdmin)
        .methods.mint_public(
          account.getAddress(),
          toUSDCDecimals(BigInt(MINT_AMOUNT))
        )
        .send()
        .wait();
      setTokenBalance((prev) => ({
        ...prev,
        public: prev.public + MINT_AMOUNT,
      }));
      toast.success(`Successfully minted ${formatNumber(MINT_AMOUNT, 0)} USDC`);
    } catch (err) {
      console.log('Error: ', err);
      toast.error('Error minting tokens.');
    } finally {
      setMinting(false);
    }
  };

  const walletButtonText = useMemo(() => {
    if (connecting) {
      return 'Connecting to Aztec...';
    } else if (account) {
      return truncateAddress(account.getAddress().toString());
    } else {
      return 'Wallet connect';
    }
  }, [account, connecting]);

  return (
    <div className='flex gap-4 items-center justify-end py-5 px-10'>
      {account &&
        (fetchingTokenBalance ? (
          <div className='flex gap-2 items-center mr-8'>
            <div className='text-sm'>Fethcing token balances...</div>
            <Loader size={16} />
          </div>
        ) : (
          <>
            <button
              className='flex gap-2 items-center rounded-full p-1 px-2'
              onClick={() => mintUsdc()}
            >
              {minting ? 'Minting USDC...' : 'Mint USDC'}
              {minting && <Loader size={18} />}
            </button>
            <div className='flex gap-2 items-center'>
              <div>USDC Balance</div>
              <div>
                <div className='text-xs'>
                  Public: ${formatNumber(tokenBalance.public, 0)}
                </div>
                <div className='text-xs'>
                  Private: ${formatNumber(tokenBalance.private, 0)}
                </div>
              </div>
            </div>
          </>
        ))}
      <div>
        <button
          className='ml-auto relative'
          onClick={() => (account ? setShowMenu(!showMenu) : connectWallet())}
        >
          {walletButtonText}
          {!!account && showMenu && (
            <div
              className='absolute bg-zimburseGray left-0 top-[calc(100%+12px)] w-full'
              ref={menuRef}
            >
              <div
                className='cursor-pointer p-4 hover:bg-[#A8A6A6]'
                onClick={() => disconnectWallet()}
              >
                Logout
              </div>
            </div>
          )}
        </button>
      </div>
    </div>
  );
}
