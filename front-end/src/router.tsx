import { createBrowserRouter } from 'react-router';
import RootLayout from './layouts/RootLayout';
import GuestRoute from './components/GuestRoute/GuestRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import ForgotPassword from './pages/ForgotPassword';
import NotFound from './pages/NotFound';
import ErrorPage from './pages/ErrorPage';

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: '/',
        element: <Home />,
      },
      {
        element: <GuestRoute />,
        children: [
          {
            path: '/entrar',
            element: <Login />,
          },
          {
            path: '/cadastrar',
            element: <SignUp />,
          },
          {
            path: '/esqueci-senha',
            element: <ForgotPassword />,
          },
        ],
      },
      {
        path: '*',
        element: <NotFound />,
      },
    ],
  },
]);
