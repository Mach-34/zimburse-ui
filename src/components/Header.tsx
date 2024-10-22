import { useMemo, useRef, useState } from 'react';
import { useAztec } from '../contexts/AztecContext';
import { truncateAddress } from '../utils';
import useOutsideAlerter from '../hooks/useOutsideAlerter';

export default function Header(): JSX.Element {
  const { account, connectWallet, connecting, disconnectWallet } = useAztec();
  const [showMenu, setShowMenu] = useState<boolean>(false);
  const menuRef = useRef(null);

  useOutsideAlerter(menuRef, () => setShowMenu(false));

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
    <div className='flex justify-end py-5 px-10'>
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
  );
}
