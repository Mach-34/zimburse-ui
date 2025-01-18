import { Navigate, Outlet } from 'react-router-dom';
import { useAztec } from '../contexts/AztecContext';

const ProtectedRoute = () => {
  const { account } = useAztec();
  if (!account) {
    // Redirect to the root route if no account
    return <Navigate to='/' replace />;
  }

  // Render child routes if authenticated
  return <Outlet />;
};

export default ProtectedRoute;
