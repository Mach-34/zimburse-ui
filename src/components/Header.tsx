import { useMemo, useRef, useState } from 'react';
import { useAztec } from '../contexts/AztecContext';
import { truncateAddress } from '../utils';
import useOutsideAlerter from '../hooks/useOutsideAlerter';
import { ACCOUNTS } from '../utils/constants';

export default function Header(): JSX.Element {
  const { addresses, connecting, switchWallet, wallet } = useAztec();
  const [showMenu, setShowMenu] = useState<boolean>(false);
  const menuRef = useRef(null);

  useOutsideAlerter(menuRef, () => setShowMenu(false));

  const walletButtonText = useMemo(() => {
    if (connecting) {
      return 'Connecting to Aztec...';
    } else if (wallet) {
      return truncateAddress(wallet.getAddress().toString());
    } else {
      return 'Wallet connect';
    }
  }, [connecting, wallet]);

  return (
    <div className='flex justify-end py-5 px-10'>
      <button
        className='ml-auto relative'
        disabled={!wallet}
        onClick={() => setShowMenu(!showMenu)}
      >
        {walletButtonText}
        {!!wallet && showMenu && (
          <div
            className='absolute bg-zimburseGray left-0 top-[calc(100%+12px)] w-full'
            ref={menuRef}
          >
            {addresses
              .filter((address) => address !== wallet.getAddress().toString())
              .map((address) => (
                <div
                  className='cursor-pointer p-4 hover:bg-[#A8A6A6]'
                  key={address}
                  onClick={() => switchWallet(address)}
                >
                  {truncateAddress(address)}
                </div>
              ))}
          </div>
        )}
      </button>
    </div>
  );
}
