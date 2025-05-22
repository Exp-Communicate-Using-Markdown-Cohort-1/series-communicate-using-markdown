import { Outlet, Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

const MainLayout = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login'); // Redirect to login after logout
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 text-white p-4 flex flex-col">
        <div>
          <h1 className="text-xl font-bold mb-4">Hospital HMS</h1>
          <nav>
            <ul>
              <li className="mb-2">
                <Link to="/" className="hover:text-gray-300">Dashboard</Link>
              </li>

              {/* Patient Links */}
              {user && user.role === 'patient' && (
                <>
                  <li className="mb-2">
                    <Link to="/my-appointments" className="hover:text-gray-300">My Appointments</Link>
                  </li>
                  <li className="mb-2">
                    <Link to="/my-medical-records" className="hover:text-gray-300">My Medical Records</Link>
                  </li>
                  <li className="mb-2">
                    <Link to="/my-invoices" className="hover:text-gray-300">My Invoices</Link>
                  </li>
                  <li className="mb-2">
                    <Link to="/my-notifications" className="hover:text-gray-300">My Notifications</Link>
                  </li>
                  <li className="mb-2">
                    <Link to="/my-profile" className="hover:text-gray-300">My Profile</Link>
                  </li>
                </>
              )}

              {/* Doctor Links */}
              {user && user.role === 'doctor' && (
                <>
                  <li className="mb-2">
                    <Link to="/doctor/appointments" className="hover:text-gray-300">My Appointments</Link>
                  </li>
                  <li className="mb-2">
                    <Link to="/doctor/availability" className="hover:text-gray-300">Manage Availability</Link>
                  </li>
                  {/* Future doctor links: My Patients, Doctor Profile (if different from general user profile) */}
                </>
              )}
              
              {/* Admin Links (Example) */}
              {/* {user && user.role === 'admin' && (
                <>
                  <li className="mb-2"><Link to="/admin/users" className="hover:text-gray-300">Manage Users</Link></li>
                  <li className="mb-2"><Link to="/admin/doctors" className="hover:text-gray-300">Manage Doctors</Link></li>
                </>
              )} */}
            </ul>
          </nav>
        </div>
        <div className="mt-auto">
          {user && (
            <div className="mb-2">
              <p className="text-sm">Welcome, {user.firstName} {user.lastName}</p>
              <p className="text-xs text-gray-400">Role: {user.role}</p>
            </div>
          )}
          <button 
            onClick={handleLogout} 
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <header className="bg-white shadow p-4">
          <h2 className="text-lg font-semibold">Hospital Management</h2> 
        </header>
        <div className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
export default MainLayout;
