import { Navigate, Route, Routes } from 'react-router-dom';
import { Login } from '@/routes/Login';
import { Dashboard } from '@/routes/Dashboard';
import { Partners } from '@/routes/Partners';
import { Customers } from '@/routes/Customers';
import { Bookings } from '@/routes/Bookings';
import { AdminUsers } from '@/routes/AdminUsers';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AppShell } from '@/components/AppShell';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute requiredRole="ADMIN" />}>
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/partners" element={<Partners />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/bookings" element={<Bookings />} />
          <Route path="/admin-users" element={<AdminUsers />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
