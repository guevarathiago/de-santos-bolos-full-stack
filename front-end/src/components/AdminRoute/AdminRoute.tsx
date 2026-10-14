import { Navigate, Outlet } from 'react-router';
import { useAuth } from '../../hooks/useAuth';

const AdminRoute = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/entrar" replace />;
  }

  if (user.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default AdminRoute;
