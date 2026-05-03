import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';

export function ProtectedRoute() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);

  if (!token || !user) return <Navigate to="/login" replace />;
  if (user.role !== 'PARTNER') return <Navigate to="/login" replace />;
  return <Outlet />;
}
