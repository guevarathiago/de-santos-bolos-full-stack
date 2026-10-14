import { Navigate, Outlet } from 'react-router';
import { useAuth } from '../../hooks/useAuth';

const PrivateRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/entrar" replace />;
  }

  return <Outlet />;
};

export default PrivateRoute;
