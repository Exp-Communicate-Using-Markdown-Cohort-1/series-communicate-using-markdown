import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore'; // Adjust path as necessary

const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();

  // If still loading authentication state, maybe show a loader or nothing
  // For now, this simple version doesn't explicitly handle isLoading, but real apps might.
  // Zustand's initial state hydration from localStorage should be synchronous,
  // so isLoading primarily refers to async login/register calls.

  if (!isAuthenticated) {
    // Redirect them to the /login page, but save the current location they were
    // trying to go to so we can send them there after they login.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />; // Render the child route components
};

export default ProtectedRoute;
