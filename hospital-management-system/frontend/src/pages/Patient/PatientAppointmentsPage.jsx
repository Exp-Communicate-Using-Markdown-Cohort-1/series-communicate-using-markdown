import React, { useEffect } from 'react';
import usePatientDataStore from '../../store/patientDataStore';
import AppointmentList from '../../components/Appointments/AppointmentList'; // Adjust path as necessary
import useAuthStore from '../../store/authStore';

const PatientAppointmentsPage = () => {
  const { 
    appointments, 
    isLoadingAppointments, 
    errorAppointments, 
    fetchMyAppointments 
  } = usePatientDataStore();
  
  const { user } = useAuthStore();

  useEffect(() => {
    // Fetch appointments only if the user is a patient
    if (user && user.role === 'patient') {
      fetchMyAppointments();
    }
  }, [fetchMyAppointments, user]);

  if (user && user.role !== 'patient') {
    return (
      <div className="p-4">
        <h2 className="text-xl font-semibold text-red-600">Access Denied</h2>
        <p className="text-gray-700">This page is only accessible to patients.</p>
      </div>
    );
  }
  
  if (isLoadingAppointments) {
    return <div className="p-4 text-lg text-gray-700">Loading appointments...</div>;
  }

  if (errorAppointments) {
    return <div className="p-4 text-red-600">Error: {errorAppointments}</div>;
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-semibold text-gray-800">My Appointments</h1>
      <AppointmentList appointments={appointments} />
    </div>
  );
};

export default PatientAppointmentsPage;
