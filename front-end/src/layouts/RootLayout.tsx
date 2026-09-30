import { Outlet } from 'react-router';
import AuthProvider from '../contexts/AuthProvider';
import Header from '../components/Header/Header';

const RootLayout = () => {
  return (
    <AuthProvider>
      <div className="flex min-h-dvh flex-col bg-surface">
        <Header />
        <main className="flex flex-1 flex-col">
          <Outlet />
        </main>
      </div>
    </AuthProvider>
  );
};

export default RootLayout;
