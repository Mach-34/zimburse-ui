import { Link } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout';
import logo from '../assets/logo.png';
import { useAztec } from '../contexts/AztecContext';
import { useMemo } from 'react';

export default function LandingView(): JSX.Element {
  const { account, pxe, registryContract, tokenContract } = useAztec();

  const actionText = useMemo(() => {
    if (!pxe) {
      return 'PXE must be running';
    } else if (!account) {
      return 'Please connect a wallet';
    } else if (!registryContract && !tokenContract) {
      return 'No Z-Imburse contracts found. Please redeploy.';
    } else if (!registryContract) {
      return 'No Registry contract found. Please redeploy.';
    } else if (!tokenContract) {
      return 'No USDC contract found. Please redeploy.';
    } else {
      return '';
    }
  }, [account, pxe, registryContract, tokenContract]);

  return (
    <AppLayout>
      <div className='flex flex-col items-center justify-center px-10'>
        <div className='flex flex-col items-center'>
          <img alt='Logo' className='h-[250px]' src={logo} />
          {!actionText ? (
            <div className='flex items-center gap-[120px] mt-16'>
              <Link
                className='bg-zimburseGray p-4 text-black'
                to='/reimbursements'
              >
                Claim Reimbursements
              </Link>
              <Link
                className='bg-zimburseGray p-4 text-black'
                to='/reimbursement/admin'
              >
                Manage Escrows
              </Link>
            </div>
          ) : (
            <div className='mt-16 text-xl'>{actionText}</div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
