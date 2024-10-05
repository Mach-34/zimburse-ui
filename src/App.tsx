import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import LandingView from './views/Landing';
import ReimbursementsView from './views/Reimbursements';
import ReimbursementAdminView from './views/AdminEscrow/ReimbursementAdminView';
import ReimbursementManagementView from './views/ReimbursementManagement';
import { AztecProvider } from './contexts/AztecContext';
import Modal from 'react-modal';

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

Modal.setAppElement('#root');

function App() {
  return (
    <>
      <AztecProvider>
        <RouterProvider router={router} />
      </AztecProvider>
    </>
  );
}

export default App;
