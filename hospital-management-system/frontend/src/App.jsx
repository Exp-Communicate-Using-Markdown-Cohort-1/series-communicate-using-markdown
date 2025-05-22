import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/Auth/LoginPage';
import MainLayout from './components/Layout/MainLayout';
import ProtectedRoute from './router/ProtectedRoute';
import HomePage from './pages/HomePage';
import useAuthStore from './store/authStore';

// Patient specific pages
import PatientAppointmentsPage from './pages/Patient/PatientAppointmentsPage';
import PatientMedicalRecordsPage from './pages/Patient/PatientMedicalRecordsPage';
import PatientInvoicesPage from './pages/Patient/PatientInvoicesPage';
import PatientNotificationsPage from './pages/Patient/PatientNotificationsPage';
import PatientProfilePage from './pages/Patient/PatientProfilePage';

// Doctor specific pages
import DoctorAppointmentsPage from './pages/Doctor/DoctorAppointmentsPage';
import DoctorAvailabilityPage from './pages/Doctor/DoctorAvailabilityPage';


function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <Routes>
      {/* Public Route: Login Page */}
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} 
      />

      {/* Protected Routes: Require authentication */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}> {/* Layout for authenticated areas */}
          <Route path="/" element={<HomePage />} />
          
          {/* Patient-specific routes */}
          <Route path="/my-appointments" element={<PatientAppointmentsPage />} />
          <Route path="/my-medical-records" element={<PatientMedicalRecordsPage />} />
          <Route path="/my-invoices" element={<PatientInvoicesPage />} />
          <Route path="/my-notifications" element={<PatientNotificationsPage />} />
          <Route path="/my-profile" element={<PatientProfilePage />} />

          {/* Doctor-specific routes */}
          <Route path="/doctor/appointments" element={<DoctorAppointmentsPage />} />
          <Route path="/doctor/availability" element={<DoctorAvailabilityPage />} />
          
          {/* Other protected routes for other roles will go here, e.g.: */}
          {/* <Route path="/admin/dashboard" element={<AdminDashboardPage />} /> */}
        </Route>
      </Route>

      {/* Fallback for any other route */}
      <Route 
        path="*" 
        element={<Navigate to={isAuthenticated ? "/" : "/login"} replace />} 
      />
    </Routes>
  );
}

export default App;
