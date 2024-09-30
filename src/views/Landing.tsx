import { Link } from 'react-router-dom';
import { useAztec } from '../contexts/AztecContext';

export default function LandingView(): JSX.Element {
  const { connectWallet, disconnectWallet, wallet } = useAztec();

  console.log('Wallet: ', wallet);

  return (
    <div className='flex flex-col justify-between h-screen'>
      <div className='flex flex-col items-center justify-center px-10 py-5'>
        <button className='ml-auto'>Wallet Connect</button>
        <div className='flex flex-col items-center'>
          <div className='bg-zimburseGray flex h-[250px] items-center justify-center mt-8 w-[328px]'>
            Z IMBURSE LOGO
          </div>
          <div className='flex items-center gap-[120px] mt-16'>
            <Link
              className='bg-zimburseGray p-4 text-black'
              to='/reimbursements'
            >
              Get Reimbursed
            </Link>
            <Link
              className='bg-zimburseGray p-4 text-black'
              to='/reimbursement/admin'
            >
              Setup Reimbursement
            </Link>
          </div>
        </div>
        <div className='flex flex-col gap-4 mt-10'>
          <button onClick={() => connectWallet()}>Connect Wallet</button>
          {wallet && (
            <>
              <button onClick={() => disconnectWallet()}>
                Disconnect Wallet
              </button>
              <div>{wallet.scopes[0].toString(16)}</div>
            </>
          )}
        </div>
      </div>
      <div className='bg-zimburseGray flex h-[42px] items-center justify-between px-4'>
        <div className='w-[100px]' />
        <div>By: Mach 34</div>
        <div>Mach 34 Logo</div>
      </div>
    </div>
  );
}
