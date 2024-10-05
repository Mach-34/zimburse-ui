import { ReactNode } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useLocation } from 'react-router-dom';

type AppLayoutProps = {
  children: ReactNode;
};

export default function AppLayout({ children }: AppLayoutProps): JSX.Element {
  const { pathname } = useLocation();
  return (
    <div className='flex flex-col h-screen'>
      <Header />
      <div className='flex flex-col flex-1 px-10 pt-4 pb-10'>{children}</div>
      {pathname === '/' && <Footer />}
    </div>
  );
}
