import { useMemo, useRef, useState } from 'react';
import { useAztec } from '../contexts/AztecContext';
import { truncateAddress } from '../utils';
import useOutsideAlerter from '../hooks/useOutsideAlerter';

export default function Header(): JSX.Element {
  const { connecting, connectWallet, disconnectWallet, wallet } = useAztec();
  const [showMenu, setShowMenu] = useState<boolean>(false);
  const menuRef = useRef(null);

  useOutsideAlerter(menuRef, () => setShowMenu(false));

  const walletButtonText = useMemo(() => {
    if (connecting) {
      return 'Connecting to Aztec...';
    } else if (wallet) {
      return truncateAddress(wallet.scopes[0].toString());
    } else {
      return 'Wallet connect';
    }
  }, [connecting, wallet]);

  return (
    <div className='flex justify-end py-5 px-10'>
      <button
        className='ml-auto relative'
        onClick={() => (wallet ? setShowMenu(!showMenu) : connectWallet())}
      >
        {walletButtonText}
        {showMenu && (
          <div
            className='absolute bg-zimburseGray left-0 py-2 top-[calc(100%+12px)] w-full hover:bg-[#A8A6A6]'
            onClick={() => disconnectWallet()}
            ref={menuRef}
          >
            Logout
          </div>
        )}
      </button>
    </div>
  );
}
