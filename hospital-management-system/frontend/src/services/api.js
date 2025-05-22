import axios from 'axios';
import useAuthStore from '../store/authStore'; // Import store to potentially get user details

// Get the API base URL from environment variables
const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token to headers
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // Get from localStorage directly

    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- Authentication service functions ---
export const loginUser = async (credentials) => {
  try {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Login failed');
  }
};

export const registerUser = async (userData) => {
  try {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Registration failed');
  }
};

// --- Appointment service functions ---
// Renaming for clarity, but it hits the same '/appointments/mine' endpoint
export const getMyScopedAppointments = async () => {
  try {
    const response = await apiClient.get('/appointments/mine');
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Failed to fetch appointments');
  }
};
// Specific alias for patients - already created in previous step, kept for context
export const getMyAppointments = getMyScopedAppointments;


// --- Medical Record service functions ---
export const getMyMedicalRecords = async (patientProfileId) => {
  if (!patientProfileId) {
    throw new Error('Patient Profile ID is required to fetch medical records.');
  }
  try {
    const response = await apiClient.get(`/medical-records/patient/${patientProfileId}`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Failed to fetch medical records');
  }
};

// --- Patient Profile service functions (Patient document specific) ---
export const getPatientProfile = async (patientProfileId) => {
   if (!patientProfileId) {
    throw new Error('Patient Profile ID is required to fetch patient profile.');
  }
  try {
    const response = await apiClient.get(`/patients/${patientProfileId}`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Failed to fetch patient profile');
  }
};

export const updateMyPatientProfile = async (patientProfileId, patientData) => {
  if (!patientProfileId) {
    throw new Error('Patient Profile ID is required to update patient profile.');
  }
  try {
    const response = await apiClient.put(`/patients/${patientProfileId}`, patientData);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Failed to update patient profile');
  }
};


// --- User Profile service functions (User document specific) ---
export const getMe = async () => {
  try {
    const response = await apiClient.get('/users/me'); 
    return response.data;
  } catch (error) {
    console.error("API Error in getMe:", error.response || error.message);
    throw error.response ? error.response.data : new Error('Failed to fetch user profile (me)');
  }
};

export const updateMyUserProfile = async (userData) => {
  try {
    const response = await apiClient.put('/users/me', userData);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Failed to update user profile (me)');
  }
};


// --- Invoice service functions ---
export const getMyInvoices = async () => {
  try {
    const response = await apiClient.get('/invoices/mine');
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Failed to fetch invoices');
  }
};

// --- Notification service functions ---
export const getMyNotifications = async () => {
  try {
    const response = await apiClient.get('/notifications/mine');
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Failed to fetch notifications');
  }
};

export const markNotificationAsRead = async (notificationId) => {
  if (!notificationId) {
    throw new Error('Notification ID is required.');
  }
  try {
    const response = await apiClient.patch(`/notifications/${notificationId}/read`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Failed to mark notification as read');
  }
};

export const markAllNotificationsAsRead = async () => {
  try {
    const response = await apiClient.patch('/notifications/mark-all-read');
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Failed to mark all notifications as read');
  }
};

// --- Doctor Profile service functions ---
/**
 * Fetches a doctor's detailed profile using the Doctor document's _id.
 * This is conceptual for "getMyDoctorProfile" if we first resolve User._id to Doctor._id.
 * If doctorProfileId is known, this directly fetches it.
 * @param {string} doctorProfileId - The _id of the Doctor document.
 */
export const getDoctorProfile = async (doctorProfileId) => {
  if (!doctorProfileId) {
    throw new Error('Doctor Profile ID is required to fetch doctor profile.');
  }
  try {
    // Uses existing backend endpoint for fetching a doctor by their Doctor document ID
    const response = await apiClient.get(`/doctors/${doctorProfileId}`); 
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Failed to fetch doctor profile');
  }
};

/**
 * Updates a doctor's profile, typically their availability.
 * @param {string} doctorProfileId - The _id of the Doctor document.
 * @param {object} doctorData - The data to update, e.g., { availability: [...] }.
 */
export const updateDoctorProfile = async (doctorProfileId, doctorData) => {
  if (!doctorProfileId) {
    throw new Error('Doctor Profile ID is required to update doctor profile.');
  }
  try {
    // Uses existing backend endpoint for updating a doctor by their Doctor document ID
    const response = await apiClient.put(`/doctors/${doctorProfileId}`, doctorData);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Failed to update doctor profile');
  }
};


// --- Conceptual function (from previous step, kept for context if needed by stores) ---
// This section can be removed or refactored if backend provides IDs directly in user object
export const getPatientProfileIdByUserId = async (userId) => {
  console.warn("getPatientProfileIdByUserId is a conceptual function. Backend needs to provide patientProfileId or an endpoint to resolve it. For now, assuming patientProfileId might be added to User object from auth, or obtained via getPatientProfile after login if user is patient and we have a way to find their patient doc _id.");
  const authUser = useAuthStore.getState().user;
  if (authUser && authUser.userId === userId && authUser.patientProfileId) {
      return authUser.patientProfileId;
  }
  return null; 
};
export const getDoctorProfileIdByUserId = async (userId) => {
  console.warn("getDoctorProfileIdByUserId is a conceptual function. Backend needs to provide doctorProfileId or an endpoint to resolve it.");
  const authUser = useAuthStore.getState().user;
  if (authUser && authUser.userId === userId && authUser.doctorProfileId) { // Assuming doctorProfileId exists on authUser
      return authUser.doctorProfileId;
  }
  return null;
};


export default apiClient;
