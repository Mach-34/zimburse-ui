import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import LandingView from './views/Landing';
import ReimbursementsView from './views/Reimbursements';
import ReimbursementAdminView from './views/AdminEscrow/ReimbursementAdminView';
import ReimbursementManagementView from './views/ReimbursementManagement';

const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingView />,
  },
  {
    path: '/reimbursements',
    element: <ReimbursementsView />,
  },
  {
    path: '/reimbursement/admin',
    element: <ReimbursementAdminView />,
  },
  {
    path: '/reimbursement/manage/:id',
    element: <ReimbursementManagementView />,
  },
]);

function App() {
  return (
    <>
      <RouterProvider router={router} />
    </>
  );
}

export default App;
