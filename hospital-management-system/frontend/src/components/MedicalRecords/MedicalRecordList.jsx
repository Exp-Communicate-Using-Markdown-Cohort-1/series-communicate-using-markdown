import React from 'react';

const MedicalRecordList = ({ medicalRecords }) => {
  if (!medicalRecords || medicalRecords.length === 0) {
    return <p className="text-gray-600">No medical records found.</p>;
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
              Doctor
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Specialization
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Diagnosis
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Prescription(s)
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Notes
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {medicalRecords.map((record) => (
            <tr key={record._id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                {formatDate(record.date)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                {record.doctor?.user?.firstName || 'N/A'} {record.doctor?.user?.lastName || ''}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                {record.doctor?.user?.specialization || record.doctor?.specialization || 'N/A'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                {record.diagnosis}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                {record.prescription && record.prescription.length > 0 
                  ? record.prescription.map(p => `${p.medication} (${p.dosage})`).join(', ')
                  : 'N/A'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                {record.notes || 'N/A'}
              </td>
              {/* Consider adding attachments if needed */}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MedicalRecordList;
