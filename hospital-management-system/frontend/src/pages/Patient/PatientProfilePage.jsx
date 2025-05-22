import React, { useEffect, useCallback } from 'react';
import usePatientDataStore from '../../store/patientDataStore';
import useAuthStore from '../../store/authStore';
import UserProfileForm from '../../components/Profile/UserProfileForm';
import PatientProfileForm from '../../components/Profile/PatientProfileForm';

const PatientProfilePage = () => {
  const {
    userProfile,
    patientProfile,
    isLoadingUserProfile,
    isLoadingPatientProfile,
    errorUserProfile,
    errorPatientProfile,
    fetchUserProfile,
    fetchPatientProfile,
    updateUserProfile,
    updatePatientProfile,
    initializePatientProfileId, // To attempt to get patientProfileId
    patientProfileId // The actual Patient document _id
  } = usePatientDataStore();

  const { user: authUser } = useAuthStore(); // Logged-in user from auth store

  // Initial data fetching
  useEffect(() => {
    if (authUser && authUser.role === 'patient') {
      fetchUserProfile(); // Fetches User model data from /api/users/me
      
      // Attempt to initialize patientProfileId if not already set
      // This relies on patientProfileId being available on authUser or fetched via fetchUserProfile
      if (!patientProfileId) {
          initializePatientProfileId(); 
      }
    }
  }, [authUser, fetchUserProfile, initializePatientProfileId, patientProfileId]);
  
  // Fetch Patient document data once patientProfileId is available
  useEffect(() => {
      if (patientProfileId && authUser && authUser.role === 'patient' && !patientProfile) {
          fetchPatientProfile();
      }
  }, [patientProfileId, authUser, fetchPatientProfile, patientProfile]);


  const handleUpdateUser = async (userData) => {
    try {
      await updateUserProfile(userData);
      // Optionally, show a success message
      alert('User details updated successfully!');
    } catch (err) {
      // Error is already set in the store, or display it here
      console.error("Error updating user details:", err);
      alert(`Failed to update user details: ${err.message || 'Unknown error'}`);
    }
  };

  const handleUpdatePatient = async (patientData) => {
    if (!patientProfileId) {
        alert("Cannot update patient specific details: Patient Profile ID is missing.");
        return;
    }
    try {
      await updatePatientProfile(patientData);
      // Optionally, show a success message
      alert('Patient-specific details updated successfully!');
    } catch (err) {
      // Error is already set in the store, or display it here
      console.error("Error updating patient-specific details:", err);
      alert(`Failed to update patient-specific details: ${err.message || 'Unknown error'}`);
    }
  };

  if (authUser && authUser.role !== 'patient') {
    return (
      <div className="p-4">
        <h2 className="text-xl font-semibold text-red-600">Access Denied</h2>
        <p className="text-gray-700">This page is only accessible to patients.</p>
      </div>
    );
  }

  const isOverallLoading = isLoadingUserProfile || (patientProfileId && isLoadingPatientProfile && !patientProfile);
  const overallError = errorUserProfile || errorPatientProfile;

  if (isOverallLoading) {
    return <div className="p-4 text-lg text-gray-700">Loading profile...</div>;
  }

  if (overallError && !userProfile && !patientProfile) { // Show error if nothing loaded
      return <div className="p-4 text-red-600">Error: {overallError}</div>;
  }
  
  // Specific error if patientProfileId is missing and patientProfile couldn't be fetched
  if (!patientProfileId && !patientProfile && authUser && authUser.role === 'patient') {
    return (
        <div className="p-4 text-orange-600">
            Could not load patient-specific profile details. 
            Ensure your patient profile ID is correctly linked to your user account. 
            {errorPatientProfile && `Error: ${errorPatientProfile}`}
        </div>
    );
  }


  return (
    <div className="p-4 space-y-8">
      <h1 className="text-2xl font-semibold text-gray-800">My Profile</h1>
      
      {userProfile ? (
        <UserProfileForm 
          userProfile={userProfile} 
          onUpdate={handleUpdateUser} 
          isLoading={isLoadingUserProfile} 
          error={errorUserProfile} 
        />
      ) : errorUserProfile ? (
         <div className="p-4 text-red-600 bg-red-50 rounded-md">Error loading user details: {errorUserProfile}</div>
      ) : (
        <p>Loading user details...</p>
      )}

      {patientProfileId && patientProfile ? (
        <PatientProfileForm 
          patientProfile={patientProfile} 
          onUpdate={handleUpdatePatient} 
          isLoading={isLoadingPatientProfile} 
          error={errorPatientProfile} 
        />
      ) : patientProfileId && errorPatientProfile ? (
         <div className="p-4 text-red-600 bg-red-50 rounded-md mt-6">Error loading patient-specific details: {errorPatientProfile}</div>
      ) : patientProfileId ? (
        <p className="mt-6">Loading patient-specific details...</p>
      ) : (
        <p className="mt-6 text-gray-600">Patient-specific medical details are not available or applicable for this user.</p>
      )}
    </div>
  );
};

export default PatientProfilePage;
