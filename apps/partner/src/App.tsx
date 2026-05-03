import { Navigate, Route, Routes } from 'react-router-dom';
import { Login } from '@/routes/Login';
import { Register } from '@/routes/Register';
import { VerifyPartnerEmail } from '@/routes/VerifyPartnerEmail';
import { Dashboard } from '@/routes/Dashboard';
import { ProtectedRoute } from '@/components/ProtectedRoute';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-partner-email" element={<VerifyPartnerEmail />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
