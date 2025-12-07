import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './stores/authStore'

// Auth pages
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'

// Customer pages
import CustomerLayout from './layouts/CustomerLayout'
import CustomerProfile from './pages/customer/Profile'
import CustomerCreateJob from './pages/customer/CreateJob'
import CustomerJobs from './pages/customer/Jobs'
import CustomerJobDetail from './pages/customer/JobDetail'
import CustomerPaymentMethod from './pages/customer/PaymentMethod'
import CustomerMore from './pages/customer/More'

// Public pages
import PublicTracking from './pages/PublicTracking'

// Courier pages
import CourierLayout from './layouts/CourierLayout'
import CourierProfile from './pages/courier/Profile'
import CourierAvailableJobs from './pages/courier/AvailableJobs'
import CourierAvailableJobDetail from './pages/courier/AvailableJobDetail'
import CourierCurrentJob from './pages/courier/CurrentJob'
import CourierArchivedJobs from './pages/courier/ArchivedJobs'
import CourierPayoutMethod from './pages/courier/PayoutMethod'
import CourierVehicles from './pages/courier/Vehicles'

// Landing page
import Home from './pages/Home'

// Protected Route Component
function ProtectedRoute({ children, allowedUserType }) {
  const { isAuthenticated, userType } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (allowedUserType && userType !== allowedUserType) {
    return <Navigate to={userType === 'customer' ? '/customer' : '/courier'} replace />
  }

  return children
}

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/track/:trackingCode" element={<PublicTracking />} />

        {/* Customer routes */}
        <Route
          path="/customer"
          element={
            <ProtectedRoute allowedUserType="customer">
              <CustomerLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="profile" replace />} />
          <Route path="profile" element={<CustomerProfile />} />
          <Route path="create-job" element={<CustomerCreateJob />} />
          <Route path="jobs" element={<CustomerJobs />} />
          <Route path="jobs/:jobId" element={<CustomerJobDetail />} />
          <Route path="payment-method" element={<CustomerPaymentMethod />} />
          <Route path="more" element={<CustomerMore />} />
        </Route>

        {/* Courier routes */}
        <Route
          path="/courier"
          element={
            <ProtectedRoute allowedUserType="courier">
              <CourierLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="available-jobs" replace />} />
          <Route path="profile" element={<CourierProfile />} />
          <Route path="vehicles" element={<CourierVehicles />} />
          <Route path="available-jobs" element={<CourierAvailableJobs />} />
          <Route path="available-jobs/:jobId" element={<CourierAvailableJobDetail />} />
          <Route path="current-job" element={<CourierCurrentJob />} />
          <Route path="archived-jobs" element={<CourierArchivedJobs />} />
          <Route path="payout-method" element={<CourierPayoutMethod />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
