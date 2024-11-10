import { Link } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout';
import logo from '../assets/logo.png'

export default function LandingView(): JSX.Element {
  return (
    <AppLayout>
      <div className='flex flex-col items-center justify-center px-10'>
        <div className='flex flex-col items-center'>
          <img alt="Logo" className="h-[250px]" src={logo} />
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
        </div>
      </div>
    </AppLayout>
  );
}
