import { Navigate, Outlet, useLocation } from 'react-router';
import useAuth from '../hooks/useAuth';
import Loader from './Loader';

/**
 * Guards child routes. Use as a layout route in src/routes/index.jsx:
 *   { element: <ProtectedRoute />, children: [{ path: 'dashboard', element: <Dashboard /> }] }
 * Optionally restrict by role: <ProtectedRoute roles={['admin']} />
 */
export default function ProtectedRoute({ roles, redirectTo = '/' }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <Loader />;
  if (!isAuthenticated) return <Navigate to={redirectTo} replace state={{ from: location }} />;
  if (roles?.length && !roles.includes(user.role)) return <Navigate to="/" replace />;

  return <Outlet />;
}
