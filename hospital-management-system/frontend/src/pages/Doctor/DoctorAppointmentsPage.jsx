import React, { useEffect, useCallback } from 'react';
import useDoctorDataStore from '../../store/doctorDataStore';
import DoctorAppointmentList from '../../components/Doctor/DoctorAppointmentList';
import useAuthStore from '../../store/authStore';
// Assuming an API service for updating appointment status exists or will be added
// For now, the onUpdateStatus prop will be a placeholder or handled locally if simple
// import { updateAppointmentStatus } from '../../services/api'; // Or via a store action

const DoctorAppointmentsPage = () => {
  const { 
    appointments, 
    isLoadingAppointments, 
    errorAppointments, 
    fetchDoctorAppointments,
    // Placeholder for a potential store action to update status
    // updateAppointmentStatus: storeUpdateStatus 
  } = useDoctorDataStore();
  
  const { user } = useAuthStore();

  useEffect(() => {
    if (user && user.role === 'doctor') {
      fetchDoctorAppointments();
    }
  }, [fetchDoctorAppointments, user]);

  const handleUpdateAppointmentStatus = useCallback(async (appointmentId, newStatus) => {
    // This is where you would typically call a store action that calls the API
    // For now, let's log it and assume it would be implemented in the store
    console.log(`Attempting to update appointment ${appointmentId} to status ${newStatus}`);
    // Example:
    // try {
    //   await storeUpdateStatus(appointmentId, newStatus); // Assuming store action handles API and state update
    //   fetchDoctorAppointments(); // Re-fetch to see changes, or store updates optimistically
    //   alert(`Appointment ${appointmentId} status updated to ${newStatus}.`);
    // } catch (error) {
    //   alert(`Failed to update status: ${error.message}`);
    // }
    alert(`(Simulated) Appointment ${appointmentId} status updated to ${newStatus}. Implement actual API call.`);
    // To reflect change immediately (if not using optimistic updates in store):
    // fetchDoctorAppointments();
  }, [/* storeUpdateStatus, fetchDoctorAppointments */]);


  if (user && user.role !== 'doctor') {
    return (
      <div className="p-4">
        <h2 className="text-xl font-semibold text-red-600">Access Denied</h2>
        <p className="text-gray-700">This page is only accessible to doctors.</p>
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
      <DoctorAppointmentList 
        appointments={appointments} 
        onUpdateStatus={handleUpdateAppointmentStatus} 
      />
    </div>
  );
};

export default DoctorAppointmentsPage;
