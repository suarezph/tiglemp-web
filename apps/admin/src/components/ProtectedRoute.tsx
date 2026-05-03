import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';
import type { UserRole } from '@/types/api';

type ProtectedRouteProps = {
  requiredRole?: UserRole;
};

export function ProtectedRoute({ requiredRole }: ProtectedRouteProps) {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
