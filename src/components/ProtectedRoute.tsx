import { AccountWalletWithSecretKey } from '@aztec/aztec.js';
import { Navigate, Outlet } from 'react-router-dom';

type ProtectedRouteProps = {
  account: AccountWalletWithSecretKey | undefined;
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
