import { Navigate, Route, Routes } from 'react-router-dom';
import { LandingPage } from '@/routes/LandingPage';
import { BePartnerPage } from '@/routes/BePartnerPage';
import { CustomerLoginPage } from '@/routes/CustomerLoginPage';
import { CustomerSignupPage } from '@/routes/CustomerSignupPage';
import { VerifyCustomerEmailPage } from '@/routes/VerifyCustomerEmailPage';
import { SearchResultsPage } from '@/routes/SearchResultsPage';
import { BookingLayout } from '@/routes/booking/BookingLayout';
import { PackagesPage } from '@/routes/booking/PackagesPage';
import { AuthGatePage } from '@/routes/booking/AuthGatePage';
import { AddressPage } from '@/routes/booking/AddressPage';
import { ReviewPage } from '@/routes/booking/ReviewPage';
import { ConfirmedPage } from '@/routes/booking/ConfirmedPage';
import { CustomerDashboardPage } from '@/routes/customer/CustomerDashboardPage';
import { CustomerBookingDetailPage } from '@/routes/customer/CustomerBookingDetailPage';
import { CustomerReviewPage } from '@/routes/customer/CustomerReviewPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/be-a-partner" element={<BePartnerPage />} />
      <Route path="/login" element={<CustomerLoginPage />} />
      <Route path="/signup" element={<CustomerSignupPage />} />
      <Route path="/verify-customer-email" element={<VerifyCustomerEmailPage />} />
      <Route path="/search" element={<SearchResultsPage />} />
      <Route path="/book/:partnerId" element={<BookingLayout />}>
        <Route index element={<Navigate to="packages" replace />} />
        <Route path="packages" element={<PackagesPage />} />
        <Route path="auth" element={<AuthGatePage />} />
        <Route path="address" element={<AddressPage />} />
        <Route path="review" element={<ReviewPage />} />
      </Route>
      <Route path="/bookings/:bookingCode/confirmed" element={<ConfirmedPage />} />
      <Route path="/customer/dashboard" element={<CustomerDashboardPage />} />
      <Route
        path="/customer/bookings/:bookingId"
        element={<CustomerBookingDetailPage />}
      />
      <Route
        path="/customer/bookings/:bookingId/review"
        element={<CustomerReviewPage />}
      />
    </Routes>
  );
}

export default App;
