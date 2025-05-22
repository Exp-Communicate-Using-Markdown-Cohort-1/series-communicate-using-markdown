import {create} from 'zustand';
import { 
    getMyAppointments, 
    getMyMedicalRecords, 
    getPatientProfile,
    getMyInvoices,
    getMyNotifications,
    markNotificationAsRead as apiMarkNotificationAsRead,
    markAllNotificationsAsRead as apiMarkAllNotificationsAsRead,
    getMe, // For User model data
    updateMyUserProfile, // For User model data
    updateMyPatientProfile // For Patient model data
} from '../services/api';
import useAuthStore from './authStore';

const usePatientDataStore = create((set, get) => ({
  // Appointments State
  appointments: [],
  isLoadingAppointments: false,
  errorAppointments: null,

  // Medical Records State
  medicalRecords: [],
  isLoadingMedicalRecords: false,
  errorMedicalRecords: null,

  // Patient Profile State (Patient document data)
  patientProfile: null, 
  isLoadingPatientProfile: false,
  errorPatientProfile: null,
  patientProfileId: null, // Stores the _id of the Patient document

  // User Profile State (User document data, e.g., from /api/users/me)
  userProfile: null, // Stores data from User model (firstName, lastName, email, phoneNumber)
  isLoadingUserProfile: false,
  errorUserProfile: null,

  // Invoices State
  invoices: [],
  isLoadingInvoices: false,
  errorInvoices: null,

  // Notifications State
  notifications: [],
  isLoadingNotifications: false,
  errorNotifications: null,

  // Action to try and resolve/set patientProfileId from authStore's user object
  initializePatientProfileId: () => {
    const authUser = useAuthStore.getState().user;
    if (authUser && authUser.role === 'patient') {
      // CRITICAL ASSUMPTION: authUser.patientProfileId is available.
      // This field should be populated by the backend upon login/registration for patient roles.
      if (authUser.patientProfileId) {
        set({ patientProfileId: authUser.patientProfileId });
        console.log("patientProfileId initialized from authStore:", authUser.patientProfileId);
      } else {
        // Fallback: if patientProfileId is not directly on user, but user object itself IS the patient profile's user sub-document
        // This is less ideal. The best is a direct patientProfileId.
        // Or, we need to fetch the Patient document using authUser.userId to get the Patient._id
        console.warn("Patient role detected, but 'patientProfileId' is missing in user object from authStore. This is needed for some patient-specific data fetching.");
        // set({ errorPatientProfile: "Cannot fetch some patient data: Patient's Profile ID is missing from authentication details."});
      }
    }
  },
  
  // Fetches Patient document data
  fetchPatientProfile: async () => {
    const idToUse = get().patientProfileId;
    if (!idToUse) {
      // If patientProfileId is not set, try to initialize it.
      // This might happen if a user navigates directly to a page needing it.
      get().initializePatientProfileId();
      const newIdToUse = get().patientProfileId;
      if (!newIdToUse) {
        const errorMsg = "Patient Profile ID is not available to fetch patient specific profile.";
        set({ errorPatientProfile: errorMsg, isLoadingPatientProfile: false });
        // throw new Error(errorMsg); // Optionally throw
        return;
      }
       // If initializePatientProfileId sets it, proceed with the newIdToUse
       // This part is tricky; ideally, patientProfileId is reliably set upon login.
       // For now, we'll assume initializePatientProfileId has run or user.patientProfileId exists.
    }

    set({ isLoadingPatientProfile: true, errorPatientProfile: null });
    try {
      const response = await getPatientProfile(get().patientProfileId); // Use the ID from store
      set({ patientProfile: response.data, isLoadingPatientProfile: false });
      return response.data;
    } catch (error) {
      const errorMessage = error.message || 'Failed to fetch patient document.';
      set({ errorPatientProfile: errorMessage, isLoadingPatientProfile: false });
      throw new Error(errorMessage);
    }
  },

  // Fetches User document data from /api/users/me
  fetchUserProfile: async () => {
    set({ isLoadingUserProfile: true, errorUserProfile: null });
    try {
      const response = await getMe(); // API call to /api/users/me
      set({ userProfile: response.data, isLoadingUserProfile: false }); // Assuming response.data is the user object
      
      // If the logged-in user is a patient and patientProfileId is not yet set,
      // and if the backend now includes patientProfileId in the /users/me response for patients.
      if (response.data && response.data.role === 'patient' && response.data.patientProfileId && !get().patientProfileId) {
          set({ patientProfileId: response.data.patientProfileId });
          console.log("patientProfileId initialized from fetchUserProfile:", response.data.patientProfileId);
      }
      return response.data;
    } catch (error) {
      const errorMessage = error.message || 'Failed to fetch user profile data.';
      set({ errorUserProfile: errorMessage, isLoadingUserProfile: false });
      throw new Error(errorMessage);
    }
  },

  updateUserProfile: async (userData) => {
    set({ isLoadingUserProfile: true, errorUserProfile: null });
    try {
      const response = await updateMyUserProfile(userData); // API call to PUT /api/users/me
      set({ userProfile: response.data, isLoadingUserProfile: false });
      // Also update the main authStore's user object if relevant fields (like name, phone) changed
      const authUser = useAuthStore.getState().user;
      if (authUser) {
        useAuthStore.setState({ 
            user: { ...authUser, ...response.data } // Merge updated fields
        });
         localStorage.setItem('user', JSON.stringify({ ...authUser, ...response.data }));
      }
      return response.data;
    } catch (error) {
      const errorMessage = error.message || 'Failed to update user profile.';
      set({ errorUserProfile: errorMessage, isLoadingUserProfile: false });
      throw new Error(errorMessage);
    }
  },

  updatePatientProfile: async (patientData) => {
    const patientProfileId = get().patientProfileId;
    if (!patientProfileId) {
      const errorMsg = "Patient Profile ID is not available to update patient-specific profile.";
      set({ errorPatientProfile: errorMsg, isLoadingPatientProfile: false });
      throw new Error(errorMsg);
    }
    set({ isLoadingPatientProfile: true, errorPatientProfile: null });
    try {
      const response = await updateMyPatientProfile(patientProfileId, patientData);
      set({ patientProfile: response.data, isLoadingPatientProfile: false });
      return response.data;
    } catch (error) {
      const errorMessage = error.message || 'Failed to update patient-specific profile.';
      set({ errorPatientProfile: errorMessage, isLoadingPatientProfile: false });
      throw new Error(errorMessage);
    }
  },


  fetchMyAppointments: async () => {
    set({ isLoadingAppointments: true, errorAppointments: null });
    try {
      const response = await getMyAppointments();
      set({ appointments: response.data || [], isLoadingAppointments: false });
      return response.data;
    } catch (error) {
      const errorMessage = error.message || 'Failed to fetch appointments.';
      set({ errorAppointments: errorMessage, isLoadingAppointments: false });
      throw new Error(errorMessage);
    }
  },

  fetchMyMedicalRecords: async () => {
    const patientProfileId = get().patientProfileId;
    if (!patientProfileId) {
      const noIdError = 'Medical records cannot be fetched: Patient Profile ID is unknown.';
      set({ errorMedicalRecords: noIdError, isLoadingMedicalRecords: false, medicalRecords: [] });
      console.error(noIdError);
      return;
    }
    set({ isLoadingMedicalRecords: true, errorMedicalRecords: null });
    try {
      const response = await getMyMedicalRecords(patientProfileId);
      set({ medicalRecords: response.data || [], isLoadingMedicalRecords: false });
      return response.data;
    } catch (error) {
      const errorMessage = error.message || 'Failed to fetch medical records.';
      set({ errorMedicalRecords: errorMessage, isLoadingMedicalRecords: false });
      throw new Error(errorMessage);
    }
  },

  fetchMyInvoices: async () => {
    set({ isLoadingInvoices: true, errorInvoices: null });
    try {
      const response = await getMyInvoices();
      set({ invoices: response.data || [], isLoadingInvoices: false });
      return response.data;
    } catch (error) {
      const errorMessage = error.message || 'Failed to fetch invoices.';
      set({ errorInvoices: errorMessage, isLoadingInvoices: false });
      throw new Error(errorMessage);
    }
  },

  fetchMyNotifications: async () => {
    set({ isLoadingNotifications: true, errorNotifications: null });
    try {
      const response = await getMyNotifications();
      set({ notifications: response.data || [], isLoadingNotifications: false });
      return response.data;
    } catch (error) {
      const errorMessage = error.message || 'Failed to fetch notifications.';
      set({ errorNotifications: errorMessage, isLoadingNotifications: false });
      throw new Error(errorMessage);
    }
  },

  markNotificationRead: async (notificationId) => {
    // No loading state for this quick action, or can be added if preferred
    try {
      await apiMarkNotificationAsRead(notificationId);
      // Update local state: find notification and set status to 'Read'
      set(state => ({
        notifications: state.notifications.map(notif => 
          notif._id === notificationId ? { ...notif, status: 'Read' } : notif
        )
      }));
    } catch (error) {
      console.error("Error marking notification as read in store:", error);
      // Optionally set an error state for notifications
      set({errorNotifications: error.message || "Failed to mark notification as read."});
    }
  },

  markAllNotificationsRead: async () => {
    try {
      await apiMarkAllNotificationsAsRead();
      // Update local state: set all notifications' status to 'Read'
      set(state => ({
        notifications: state.notifications.map(notif => ({ ...notif, status: 'Read' }))
      }));
    } catch (error) {
      console.error("Error marking all notifications as read in store:", error);
      set({errorNotifications: error.message || "Failed to mark all as read."});
    }
  },
  
  clearPatientData: () => {
    set({
        appointments: [], errorAppointments: null, isLoadingAppointments: false,
        medicalRecords: [], errorMedicalRecords: null, isLoadingMedicalRecords: false,
        patientProfile: null, errorPatientProfile: null, isLoadingPatientProfile: false,
        userProfile: null, errorUserProfile: null, isLoadingUserProfile: false,
        invoices: [], errorInvoices: null, isLoadingInvoices: false,
        notifications: [], errorNotifications: null, isLoadingNotifications: false,
        patientProfileId: null
    });
  }
}));

useAuthStore.subscribe(
  (state, prevState) => {
    const patientDataStore = usePatientDataStore.getState();
    if (state.user && state.user.role === 'patient') {
        // If user.patientProfileId is available directly from auth, use it.
        // This is the preferred, most direct way.
        if (state.user.patientProfileId && state.user.patientProfileId !== patientDataStore.patientProfileId) {
            patientDataStore.initializePatientProfileId(); // It will use user.patientProfileId
            patientDataStore.fetchPatientProfile(); // Fetch Patient document data
        }
        // Always fetch User document data (from /users/me) upon login for any user
        // And specifically if patientProfileId was not on authStore.user, this might provide it.
        patientDataStore.fetchUserProfile();

    } else if (!state.user && prevState.user) { // On logout
        patientDataStore.clearPatientData();
    }
  }
);

// Initial fetch if user is already authenticated (e.g. from localStorage)
if (useAuthStore.getState().isAuthenticated) {
    const user = useAuthStore.getState().user;
    const patientDataStore = usePatientDataStore.getState();
    if (user && user.role === 'patient') {
        if (user.patientProfileId) {
            patientDataStore.initializePatientProfileId();
            patientDataStore.fetchPatientProfile();
        }
    }
    patientDataStore.fetchUserProfile(); // Fetch User model data for any authenticated user
}

export default usePatientDataStore;
