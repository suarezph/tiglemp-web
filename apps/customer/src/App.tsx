import { Route, Routes } from 'react-router-dom';
import { LandingPage } from '@/routes/LandingPage';
import { BePartnerPage } from '@/routes/BePartnerPage';
import { CustomerLoginPage } from '@/routes/CustomerLoginPage';
import { CustomerSignupPage } from '@/routes/CustomerSignupPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/be-a-partner" element={<BePartnerPage />} />
      <Route path="/login" element={<CustomerLoginPage />} />
      <Route path="/signup" element={<CustomerSignupPage />} />
    </Routes>
  );
}

export default App;
