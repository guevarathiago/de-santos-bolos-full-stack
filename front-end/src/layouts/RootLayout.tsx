import { Outlet } from 'react-router';
import { Toaster } from 'sonner';
import AuthProvider from '../contexts/AuthProvider';
import Header from '../components/Header/Header';
import WhatsAppButton from '../components/WhatsAppButton/WhatsAppButton';
import ChatWidget from '../components/ChatWidget/ChatWidget';

const RootLayout = () => {
  return (
    <AuthProvider>
      <div className="flex min-h-dvh flex-col bg-surface">
        <Header />
        <main className="flex flex-1 flex-col">
          <Outlet />
        </main>
        <WhatsAppButton />
        <ChatWidget />
      </div>
      <Toaster theme="dark" position="top-right" offset={{ top: 80 }} mobileOffset={{ top: 80 }} richColors closeButton />
    </AuthProvider>
  );
};

export default RootLayout;
