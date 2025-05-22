import {create} from 'zustand';
import {
    getMyScopedAppointments, // Renamed to avoid conflict if a doctor is also a patient
    getDoctorProfile,
    updateDoctorProfile, // Used for updating availability and other doctor-specific fields
    // getMe, // User profile data, potentially containing doctorProfileId
} from '../services/api';
import useAuthStore from './authStore'; // To get user details and doctorProfileId

const useDoctorDataStore = create((set, get) => ({
  // Doctor Profile State (Doctor document data)
  doctorProfile: null,
  isLoadingDoctorProfile: false,
  errorDoctorProfile: null,
  doctorProfileId: null, // Stores the _id of the Doctor document

  // Appointments State (Doctor's appointments)
  appointments: [],
  isLoadingAppointments: false,
  errorAppointments: null,

  // Availability State (Extracted from doctorProfile for convenience)
  // availability: [], // This will be part of doctorProfile.availability
  isLoadingAvailability: false, // For specific availability update operations
  errorAvailability: null,

  // Action to initialize doctorProfileId from authStore's user object
  initializeDoctorProfileId: () => {
    const authUser = useAuthStore.getState().user;
    if (authUser && authUser.role === 'doctor') {
      // CRITICAL ASSUMPTION: authUser.doctorProfileId is available.
      // This should be populated by the backend upon login/registration for doctor roles.
      if (authUser.doctorProfileId) {
        set({ doctorProfileId: authUser.doctorProfileId });
        console.log("doctorProfileId initialized from authStore:", authUser.doctorProfileId);
      } else {
        console.warn("Doctor role detected, but 'doctorProfileId' is missing in user object from authStore. This is needed for doctor-specific data fetching.");
        // set({ errorDoctorProfile: "Cannot fetch doctor data: Doctor's Profile ID is missing from authentication details."});
      }
    }
  },

  // Fetches Doctor document data using the doctorProfileId from the store
  fetchDoctorProfile: async () => {
    const idToUse = get().doctorProfileId;
    if (!idToUse) {
       // Attempt to initialize if not set (e.g., direct navigation or race condition)
      get().initializeDoctorProfileId();
      const newIdToUse = get().doctorProfileId;
      if(!newIdToUse){
        const errorMsg = "Doctor Profile ID is not available to fetch doctor profile.";
        set({ errorDoctorProfile: errorMsg, isLoadingDoctorProfile: false });
        // throw new Error(errorMsg); // Optionally throw
        return;
      }
    }
    
    set({ isLoadingDoctorProfile: true, errorDoctorProfile: null });
    try {
      const response = await getDoctorProfile(get().doctorProfileId); // Use ID from store
      set({ 
        doctorProfile: response.data, 
        // availability: response.data?.availability || [], // Also set availability from profile
        isLoadingDoctorProfile: false 
      });
      return response.data;
    } catch (error) {
      const errorMessage = error.message || 'Failed to fetch doctor profile document.';
      set({ errorDoctorProfile: errorMessage, isLoadingDoctorProfile: false });
      throw new Error(errorMessage);
    }
  },

  fetchDoctorAppointments: async () => {
    set({ isLoadingAppointments: true, errorAppointments: null });
    try {
      // Uses getMyScopedAppointments which calls '/appointments/mine'
      // Backend should correctly scope this to the logged-in doctor
      const response = await getMyScopedAppointments(); 
      set({ appointments: response.data || [], isLoadingAppointments: false });
      return response.data;
    } catch (error) {
      const errorMessage = error.message || 'Failed to fetch doctor appointments.';
      set({ errorAppointments: errorMessage, isLoadingAppointments: false });
      throw new Error(errorMessage);
    }
  },

  saveDoctorAvailability: async (newAvailability) => {
    const doctorProfileId = get().doctorProfileId;
    if (!doctorProfileId) {
      const errorMsg = "Doctor Profile ID is not available to update availability.";
      set({ errorAvailability: errorMsg, isLoadingAvailability: false });
      throw new Error(errorMsg);
    }
    set({ isLoadingAvailability: true, errorAvailability: null });
    try {
      // We update the entire doctor profile with new availability.
      // The backend's PUT /api/doctors/:id should handle merging other fields if necessary.
      // Or, if only availability is sent, it should only update that.
      // For this, we send { availability: newAvailability }
      const response = await updateDoctorProfile(doctorProfileId, { availability: newAvailability });
      set(state => ({
        doctorProfile: response.data, // Update the whole profile as it's returned
        // availability: response.data?.availability || [],
        isLoadingAvailability: false,
      }));
      return response.data;
    } catch (error) {
      const errorMessage = error.message || 'Failed to save doctor availability.';
      set({ errorAvailability: errorMessage, isLoadingAvailability: false });
      throw new Error(errorMessage);
    }
  },
  
  clearDoctorData: () => {
    set({
        doctorProfile: null, isLoadingDoctorProfile: false, errorDoctorProfile: null,
        appointments: [], isLoadingAppointments: false, errorAppointments: null,
        // availability: [], 
        isLoadingAvailability: false, errorAvailability: null,
        doctorProfileId: null
    });
  }
}));

// Subscribe to authStore to initialize or clear data based on auth state
useAuthStore.subscribe(
  (state, prevState) => {
    const doctorDataStore = useDoctorDataStore.getState();
    if (state.user && state.user.role === 'doctor') {
      // If doctorProfileId is available directly from auth (ideal)
      if (state.user.doctorProfileId && state.user.doctorProfileId !== doctorDataStore.doctorProfileId) {
        doctorDataStore.initializeDoctorProfileId(); // It will use user.doctorProfileId
        doctorDataStore.fetchDoctorProfile(); // Fetch Doctor document data
      } else if (!state.user.doctorProfileId && !doctorDataStore.doctorProfileId) {
        // If doctorProfileId is NOT on user object, we might need a fetchUserProfile from patientDataStore
        // or a dedicated call to get it. For now, initializeDoctorProfileId logs a warning.
        // This part highlights the dependency on how doctorProfileId is obtained.
        // A common pattern is that /api/users/me (called by patientDataStore.fetchUserProfile)
        // would return doctorProfileId if role is doctor.
         usePatientDataStore.getState().fetchUserProfile().then(userProfileData => {
            if(userProfileData && userProfileData.doctorProfileId) {
                useDoctorDataStore.setState({ doctorProfileId: userProfileData.doctorProfileId });
                doctorDataStore.fetchDoctorProfile();
            } else {
                 console.warn("Doctor role, but doctorProfileId not found on authUser or from fetchUserProfile. Doctor-specific data might be unavailable.");
            }
        }).catch(e => console.error("Error fetching user profile for doctorProfileId resolution", e));
      }
    } else if (!state.user && prevState.user) { // On logout
      doctorDataStore.clearDoctorData();
    }
  }
);

// Initial fetch if user is already authenticated (e.g. from localStorage)
if (useAuthStore.getState().isAuthenticated) {
    const user = useAuthStore.getState().user;
    const doctorDataStore = useDoctorDataStore.getState();
    if (user && user.role === 'doctor') {
        if (user.doctorProfileId) { // Ideal case
            doctorDataStore.initializeDoctorProfileId();
            doctorDataStore.fetchDoctorProfile();
        } else {
            // Attempt to get it via fetchUserProfile from patientDataStore (which calls /api/users/me)
            usePatientDataStore.getState().fetchUserProfile().then(userProfileData => {
                if(userProfileData && userProfileData.doctorProfileId) {
                    useDoctorDataStore.setState({ doctorProfileId: userProfileData.doctorProfileId });
                    doctorDataStore.fetchDoctorProfile();
                } else {
                    console.warn("Initial Check: Doctor role, but doctorProfileId not found on authUser or from fetchUserProfile.");
                }
            }).catch(e => console.error("Initial Check: Error fetching user profile for doctorProfileId resolution", e));
        }
    }
}

export default useDoctorDataStore;
