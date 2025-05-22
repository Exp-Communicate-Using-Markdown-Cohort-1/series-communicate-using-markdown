import React, { useEffect } from 'react';
import useDoctorDataStore from '../../store/doctorDataStore';
import AvailabilityManager from '../../components/Doctor/AvailabilityManager';
import useAuthStore from '../../store/authStore';

const DoctorAvailabilityPage = () => {
  const { 
    doctorProfile,
    isLoadingDoctorProfile,
    errorDoctorProfile,
    fetchDoctorProfile,
    initializeDoctorProfileId, // To ensure doctorProfileId is set
    doctorProfileId, // Actual Doctor document _id
  } = useDoctorDataStore();
  
  const { user } = useAuthStore();

  useEffect(() => {
    // Ensure doctorProfileId is initialized, then fetch the full profile which includes availability
    if (user && user.role === 'doctor') {
      if (!doctorProfileId) {
        initializeDoctorProfileId(); // Attempts to set doctorProfileId from authUser
      }
    }
  }, [user, initializeDoctorProfileId, doctorProfileId]);

  useEffect(() => {
    // If doctorProfileId is available (either from init or already set) and profile hasn't been loaded yet
    if (doctorProfileId && !doctorProfile && !isLoadingDoctorProfile) {
      fetchDoctorProfile();
    }
  }, [doctorProfileId, doctorProfile, fetchDoctorProfile, isLoadingDoctorProfile]);


  if (user && user.role !== 'doctor') {
    return (
      <div className="p-4">
        <h2 className="text-xl font-semibold text-red-600">Access Denied</h2>
        <p className="text-gray-700">This page is only accessible to doctors.</p>
      </div>
    );
  }
  
  // Handle cases where doctorProfileId might not be resolved
  if (!doctorProfileId && !isLoadingDoctorProfile) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-semibold text-orange-600">Profile ID Missing</h2>
        <p className="text-gray-700">
          Your doctor profile ID could not be resolved. Please ensure your account is correctly set up.
          {errorDoctorProfile && ` Error: ${errorDoctorProfile}`}
        </p>
      </div>
    );
  }

  if (isLoadingDoctorProfile && !doctorProfile) { // Show loading only if profile is not yet available
    return <div className="p-4 text-lg text-gray-700">Loading availability data...</div>;
  }

  // If profile fetch failed specifically, and we have an ID
  if (errorDoctorProfile && doctorProfileId && !doctorProfile) {
    return <div className="p-4 text-red-600">Error loading doctor profile: {errorDoctorProfile}</div>;
  }
  
  // If profile is loaded, AvailabilityManager will use it.
  // If doctorProfile is null but we passed loading/error, it means ID was missing.

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-semibold text-gray-800">Manage My Availability</h1>
      {doctorProfile ? (
        <AvailabilityManager />
      ) : (
        // This case might be hit if doctorProfileId was resolved but fetch failed silently or is in an odd state
        <p className="text-gray-600">Could not load availability manager. Doctor profile data is missing.</p>
      )}
    </div>
  );
};

export default DoctorAvailabilityPage;
