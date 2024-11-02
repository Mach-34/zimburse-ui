import { Eip1193Account } from '@shieldswap/wallet-sdk/eip1193';
import { Navigate, Outlet } from 'react-router-dom';

type ProtectedRouteProps = {
  account: Eip1193Account | undefined;
};

const ProtectedRoute = ({ account }: ProtectedRouteProps) => {
  if (!account) {
    // Redirect to the root route if no account
    return <Navigate to='/' replace />;
  }

  // Render child routes if authenticated
  return <Outlet />;
};

export default ProtectedRoute;
