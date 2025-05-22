import React from 'react';

const AppointmentList = ({ appointments }) => {
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
              Doctor
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Specialization
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Reason
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Notes
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
                {appointment.doctor?.user?.firstName || 'N/A'} {appointment.doctor?.user?.lastName || ''}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                {appointment.doctor?.user?.specialization || appointment.doctor?.specialization || 'N/A'} 
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
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                {appointment.notes || 'N/A'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AppointmentList;
