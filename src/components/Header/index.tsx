import { useMemo, useRef, useState } from 'react';
import { useAztec } from '../../contexts/AztecContext';
import { truncateAddress } from '../../utils';
import useOutsideAlerter from '../../hooks/useOutsideAlerter';
import { toast } from 'react-toastify';
import logo from '../../assets/logo.png';
import { Copy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AztecAddress } from '@aztec/circuits.js';
import { AccountWalletWithSecretKey } from '@aztec/aztec.js';
import PXEBadge from './components/PXEBadge';
import ContractSection from './components/ContractSection';
import TokenBalanceSection from './components/TokenBalanceSection';
import Loader from '../Loader';

export default function Header(): JSX.Element {
  const { account, connectWallet, disconnectWallet, pxe, wallets } = useAztec();
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const [showMenu, setShowMenu] = useState<boolean>(false);

  useOutsideAlerter(menuRef, () => setShowMenu(false));

  const availableWallets = useMemo(() => {
    return wallets.filter(
      (wallet) =>
        !wallet.getAddress().equals(account?.getAddress() ?? AztecAddress.ZERO)
    );
  }, [account, wallets]);

  const copyAddress = async (
    e: React.MouseEvent<SVGSVGElement, MouseEvent>,
    address: AztecAddress
  ) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(address.toString());
      toast.success('Address copied to clipboard!');
    } catch (err) {
      toast.error('Error occurred.');
    }
  };

  const walletButtonText = useMemo(() => {
    if (!wallets.length) {
      return 'Loading Aztec Wallets...';
    } else if (account) {
      return truncateAddress(account.getAddress().toString());
    } else {
      return 'Connect Wallet';
    }
  }, [account, wallets]);

  return (
    <div className='flex items-center justify-between py-5 px-10'>
      <img
        alt='Logo'
        className='cursor-pointer h-10 w-10'
        onClick={() => navigate('/')}
        src={logo}
      />
      <div className='flex gap-4 items-center'>
        <PXEBadge />
        <ContractSection />
        <TokenBalanceSection />
        {pxe && (
          <div>
            <button
              className='flex gap-2 items-center ml-auto relative'
              disabled={!wallets.length}
              onClick={() =>
                account ? setShowMenu(!showMenu) : connectWallet(wallets[0])
              }
            >
              {walletButtonText}
              {!wallets.length && <Loader size={16} />}
              {!!account && showMenu && (
                <div
                  className='absolute bg-zimburseGray left-0 rounded top-[calc(100%+12px)]'
                  ref={menuRef}
                >
                  {availableWallets.map(
                    (wallet: AccountWalletWithSecretKey) => (
                      <div
                        className='cursor-pointer flex gap-2 items-center justify-between p-4 rounded hover:bg-[#A8A6A6]'
                        key={wallet.getAddress().toString()}
                        onClick={() => {
                          connectWallet(wallet);
                          navigate('/');
                        }}
                      >
                        <div>
                          {truncateAddress(wallet.getAddress().toString())}
                        </div>
                        <button className='bg-zimburseBlue p-1 rounded'>
                          <Copy
                            color='white'
                            onClick={(e) => copyAddress(e, wallet.getAddress())}
                            size={14}
                          />
                        </button>
                      </div>
                    )
                  )}
                  <div
                    className='cursor-pointer p-4 rounded hover:bg-[#A8A6A6]'
                    onClick={() => disconnectWallet()}
                  >
                    Logout
                  </div>
                </div>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
