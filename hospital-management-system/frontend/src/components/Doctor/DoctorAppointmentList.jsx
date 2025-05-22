import React from 'react';
// Import a function to update appointment status if needed, e.g., from a store or API service
// import { updateAppointmentStatus } from '../../services/api'; // Or via a store action

const DoctorAppointmentList = ({ appointments, onUpdateStatus }) => {
  if (!appointments || appointments.length === 0) {
    return <p className="text-gray-600">No appointments found.</p>;
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        year: 'numeric', month: 'long', day: 'numeric'
      });
    } catch (e) {
      return 'Invalid Date';
    }
  };

  const handleStatusChange = (appointmentId, newStatus) => {
    if (onUpdateStatus) {
      onUpdateStatus(appointmentId, newStatus);
    } else {
      console.warn("onUpdateStatus function not provided to DoctorAppointmentList");
    }
  };

  return (
    <div className="overflow-x-auto bg-white shadow-md rounded-lg">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Time
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Patient
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Reason
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {appointments.map((appointment) => (
            <tr key={appointment._id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                {formatDate(appointment.appointmentDate)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                {appointment.startTime} - {appointment.endTime}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                {appointment.patient?.user?.firstName || 'N/A'} {appointment.patient?.user?.lastName || ''}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                {appointment.reason || 'N/A'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  appointment.status === 'Scheduled' ? 'bg-green-100 text-green-800' :
                  appointment.status === 'Completed' ? 'bg-blue-100 text-blue-800' :
                  appointment.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                  appointment.status === 'Pending Approval' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {appointment.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                {appointment.status === 'Pending Approval' && (
                  <button
                    onClick={() => handleStatusChange(appointment._id, 'Scheduled')}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    Confirm
                  </button>
                )}
                {appointment.status === 'Scheduled' && (
                  <button
                    onClick={() => handleStatusChange(appointment._id, 'Completed')}
                    className="text-green-600 hover:text-green-900"
                  >
                    Complete
                  </button>
                )}
                {(appointment.status === 'Pending Approval' || appointment.status === 'Scheduled') && (
                  <button
                    onClick={() => handleStatusChange(appointment._id, 'Cancelled')}
                    className="text-red-600 hover:text-red-900"
                  >
                    Cancel
                  </button>
                )}
                {/* Add link to view more details if needed */}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DoctorAppointmentList;
