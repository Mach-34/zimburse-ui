import { Link } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout';

export default function LandingView(): JSX.Element {
  return (
    <AppLayout>
      <div className='flex flex-col items-center justify-center px-10'>
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
      </div>
    </AppLayout>
  );
}
