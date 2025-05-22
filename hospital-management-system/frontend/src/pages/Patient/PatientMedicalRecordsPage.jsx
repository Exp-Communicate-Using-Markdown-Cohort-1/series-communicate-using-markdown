import React, { useEffect } from 'react';
import usePatientDataStore from '../../store/patientDataStore';
import MedicalRecordList from '../../components/MedicalRecords/MedicalRecordList'; // Adjust path as necessary
import useAuthStore from '../../store/authStore';

const PatientMedicalRecordsPage = () => {
  const { 
    medicalRecords, 
    isLoadingMedicalRecords, 
    errorMedicalRecords, 
    fetchMyMedicalRecords,
    initializePatientProfileId, // Ensure this is called if not done automatically
    patientProfileId // Use this from the store
  } = usePatientDataStore();

  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && user && user.role === 'patient') {
      // Attempt to initialize/ensure patientProfileId is set in patientDataStore
      // This relies on the logic within patientDataStore (e.g., using a hypothetical user.patientProfileId)
      initializePatientProfileId(); 
    }
  }, [isAuthenticated, user, initializePatientProfileId]);

  useEffect(() => {
    // Fetch records only if user is a patient and patientProfileId is available
    if (user && user.role === 'patient' && patientProfileId) {
      fetchMyMedicalRecords();
    } else if (user && user.role === 'patient' && !patientProfileId && !isLoadingMedicalRecords && !errorMedicalRecords) {
        // If patientProfileId is still not available after initialization attempt,
        // and we are not already loading/in error state from fetchMyMedicalRecords itself.
        // This indicates the ID could not be resolved.
        usePatientDataStore.setState({ 
            errorMedicalRecords: "Could not fetch medical records: Patient Profile ID is unavailable.",
            isLoadingMedicalRecords: false 
        });
    }
  }, [fetchMyMedicalRecords, user, patientProfileId, isLoadingMedicalRecords, errorMedicalRecords]);


  if (user && user.role !== 'patient') {
    return (
      <div className="p-4">
        <h2 className="text-xl font-semibold text-red-600">Access Denied</h2>
        <p className="text-gray-700">This page is only accessible to patients.</p>
      </div>
    );
  }

  if (isLoadingMedicalRecords) {
    return <div className="p-4 text-lg text-gray-700">Loading medical records...</div>;
  }

  if (errorMedicalRecords) {
    return <div className="p-4 text-red-600">Error: {errorMedicalRecords}</div>;
  }
  
  // Check again if patientProfileId is missing after attempts, and show specific message
  if (!patientProfileId && user && user.role === 'patient') {
    return <div className="p-4 text-orange-600">Could not determine Patient Profile ID to fetch medical records. Please ensure your profile is correctly set up.</div>;
  }


  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-semibold text-gray-800">My Medical Records</h1>
      <MedicalRecordList medicalRecords={medicalRecords} />
    </div>
  );
};

export default PatientMedicalRecordsPage;
