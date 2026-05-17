import { Navigate, Route, Routes } from 'react-router-dom';
import { Login } from '@/routes/Login';
import { VerifyPartnerEmail } from '@/routes/VerifyPartnerEmail';
import { Dashboard } from '@/routes/Dashboard';
import { Bookings } from '@/routes/Bookings';
import { Packages } from '@/routes/Packages';
import { Reviews } from '@/routes/Reviews';
import { Team } from '@/routes/Team';
import { Application } from '@/routes/Application';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AppShell } from '@/components/AppShell';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/verify-partner-email" element={<VerifyPartnerEmail />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/application" element={<Application />} />
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/team" element={<Team />} />
          <Route path="/bookings" element={<Bookings />} />
          <Route path="/packages" element={<Packages />} />
          <Route path="/reviews" element={<Reviews />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
