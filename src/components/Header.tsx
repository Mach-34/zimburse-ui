import { useMemo, useRef, useState } from 'react';
import { useAztec } from '../contexts/AztecContext';
import { formatUSDC, truncateAddress } from '../utils';
import useOutsideAlerter from '../hooks/useOutsideAlerter';
import Loader from './Loader';
import { toast } from 'react-toastify';
import { toUSDCDecimals } from '../utils';
import logo from '../assets/logo.png';
import usdc from '../assets/usdc.png';
import {
  Copy,
  Lock,
  LockOpen,
  Plus,
  ReceiptText,
  RotateCcw,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AztecAddress, Fr } from '@aztec/circuits.js';
import { AztecAccount } from '../utils/constants';

const AZTEC_WALLETS = JSON.parse(import.meta.env.VITE_APP_AZTEC_WALLETS);

export default function Header(): JSX.Element {
  const {
    account,
    accounts,
    connectWallet,
    connecting,
    deployContracts,
    deployingContracts,
    disconnectWallet,
    fetchingTokenBalance,
    registryAdmin,
    registryContract,
    setTokenBalance,
    tokenBalance,
    tokenContract,
  } = useAztec();
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const [minting, setMinting] = useState<boolean>(false);
  const [showMenu, setShowMenu] = useState<boolean>(false);

  useOutsideAlerter(menuRef, () => setShowMenu(false));

  const MINT_AMOUNT = toUSDCDecimals(10000n);

  const availableWallets = useMemo(() => {
    return accounts.filter(
      (acc) => !acc.address.equals(account?.getAddress() ?? AztecAddress.ZERO)
    );
  }, [account, accounts]);

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

  const deployButtonText = useMemo(() => {
    if (registryContract || tokenContract) {
      return deployingContracts ? 'Redeploying...' : 'Redeploy';
    }
    return deployingContracts ? 'Deploying...' : 'Deploy';
  }, [deployingContracts, registryContract, tokenContract]);

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
    <div className='flex items-center justify-between py-5 px-10'>
      <img
        alt='Logo'
        className='cursor-pointer h-10 w-10'
        onClick={() => navigate('/')}
        src={logo}
      />
      <div className='flex gap-4 items-center'>
        {account && (
          <div className='border border-black rounded px-2 py-1'>
            <div className='flex gap-2 items-center justify-between'>
              <div className='flex gap-1 items-center'>
                <div className='text-xs'>Contracts</div>
                <ReceiptText size={12} />
              </div>
              <button
                className='bg-yellow-400 flex gap-1 items-center p-1 text-xs'
                onClick={() => deployContracts()}
              >
                {deployButtonText}
                {deployingContracts ? (
                  <Loader size={12} />
                ) : (
                  <RotateCcw size={12} />
                )}
              </button>
            </div>
            <div className='mt-2'>
              <div className='text-xs'>
                Usdc:{' '}
                {tokenContract
                  ? truncateAddress(tokenContract.address.toString())
                  : 'None found'}
              </div>
              <div className='text-xs'>
                Escrow Registry:{' '}
                {registryContract
                  ? truncateAddress(registryContract.address.toString())
                  : 'None found'}
              </div>
            </div>
          </div>
        )}
        {tokenContract &&
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
                      className='bg-green-600 flex gap-2 items-center rounded-full px-2 py-1 text-white text-xs/[10px]'
                      onClick={() => mintUsdc()}
                    >
                      {minting ? 'Minting...' : 'Mint'}
                      {!minting && <Plus size={12} />}
                      {minting && <Loader size={12} />}
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
        <div>
          <button
            className='ml-auto relative'
            onClick={() =>
              account
                ? setShowMenu(!showMenu)
                : connectWallet(Fr.fromHexString(AZTEC_WALLETS[0]))
            }
          >
            {walletButtonText}
            {!!account && showMenu && (
              <div
                className='absolute bg-zimburseGray left-0 rounded top-[calc(100%+12px)]'
                ref={menuRef}
              >
                {availableWallets.map((wallet: AztecAccount) => (
                  <div
                    className='cursor-pointer flex gap-2 items-center justify-between p-4 rounded hover:bg-[#A8A6A6]'
                    key={wallet.address.toString()}
                    onClick={() => connectWallet(wallet.secretKey)}
                  >
                    <div>{truncateAddress(wallet.address.toString())}</div>
                    <Copy
                      className='hover:stroke-[#F2F2F2]'
                      color='black'
                      onClick={(e) => copyAddress(e, wallet.address)}
                      size={18}
                    />
                  </div>
                ))}
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
      </div>
    </div>
  );
}
