import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import LandingView from './views/Landing';
import ReimbursementsView from './views/Reimbursements';
import ReimbursementAdminView from './views/AdminEscrow/ReimbursementAdminView';
import ReimbursementManagementView from './views/ReimbursementManagement';
import Modal from 'react-modal';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ProtectedRoute from './components/ProtectedRoute';
Modal.setAppElement('#root');

function App() {
  const router = createBrowserRouter([
    {
      path: '/',
      element: <LandingView />,
    },
    {
      element: <ProtectedRoute />,
      children: [
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
      ],
    },
  ]);

  return (
    <>
      <RouterProvider router={router} />
      <ToastContainer position='bottom-right' theme='colored' />
    </>
  );
}

export default App;
