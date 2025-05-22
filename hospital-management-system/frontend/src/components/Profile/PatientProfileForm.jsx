import React, { useState, useEffect } from 'react';

const PatientProfileForm = ({ patientProfile, onUpdate, isLoading, error }) => {
  const [formData, setFormData] = useState({
    medicalRecordNumber: '', // Read-only
    bloodType: '',
    chronicConditions: '', // Stored as array, display as comma-separated string
    dateOfBirth: '', // Format for input type="date"
    maritalStatus: '',
  });

  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const maritalStatuses = ['Single', 'Married', 'Divorced', 'Widowed', 'Other'];

  useEffect(() => {
    if (patientProfile) {
      setFormData({
        medicalRecordNumber: patientProfile.medicalRecordNumber || '',
        bloodType: patientProfile.bloodType || '',
        chronicConditions: Array.isArray(patientProfile.chronicConditions) 
          ? patientProfile.chronicConditions.join(', ') 
          : '',
        dateOfBirth: patientProfile.dateOfBirth 
          ? new Date(patientProfile.dateOfBirth).toISOString().split('T')[0] 
          : '',
        maritalStatus: patientProfile.maritalStatus || '',
      });
    }
  }, [patientProfile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const updateData = {
      bloodType: formData.bloodType,
      chronicConditions: formData.chronicConditions.split(',').map(item => item.trim()).filter(item => item), // Convert back to array
      dateOfBirth: formData.dateOfBirth,
      maritalStatus: formData.maritalStatus,
      // medicalRecordNumber is not updatable by user
    };
    onUpdate(updateData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 shadow rounded-lg mt-6">
      <h3 className="text-lg font-medium leading-6 text-gray-900">Medical Information</h3>
      <p className="mt-1 text-sm text-gray-600">
        Update your patient-specific medical details. Medical Record Number is read-only.
      </p>

      <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
        <div className="sm:col-span-3">
          <label htmlFor="medicalRecordNumber" className="block text-sm font-medium text-gray-700">
            Medical Record Number
          </label>
          <input
            type="text"
            name="medicalRecordNumber"
            id="medicalRecordNumber"
            value={formData.medicalRecordNumber}
            readOnly
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 focus:outline-none sm:text-sm"
          />
        </div>

        <div className="sm:col-span-3">
          <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">
            Date of Birth
          </label>
          <input
            type="date"
            name="dateOfBirth"
            id="dateOfBirth"
            value={formData.dateOfBirth}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        
        <div className="sm:col-span-3">
          <label htmlFor="bloodType" className="block text-sm font-medium text-gray-700">
            Blood Type
          </label>
          <select
            id="bloodType"
            name="bloodType"
            value={formData.bloodType}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="">Select Blood Type</option>
            {bloodTypes.map(type => <option key={type} value={type}>{type}</option>)}
          </select>
        </div>

        <div className="sm:col-span-3">
          <label htmlFor="maritalStatus" className="block text-sm font-medium text-gray-700">
            Marital Status
          </label>
          <select
            id="maritalStatus"
            name="maritalStatus"
            value={formData.maritalStatus}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="">Select Marital Status</option>
            {maritalStatuses.map(status => <option key={status} value={status}>{status}</option>)}
          </select>
        </div>

        <div className="sm:col-span-6">
          <label htmlFor="chronicConditions" className="block text-sm font-medium text-gray-700">
            Chronic Conditions (comma-separated)
          </label>
          <input
            type="text"
            name="chronicConditions"
            id="chronicConditions"
            value={formData.chronicConditions}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="e.g., Hypertension, Diabetes"
          />
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <div className="pt-5">
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
          >
            {isLoading ? 'Saving...' : 'Save Medical Details'}
          </button>
        </div>
      </div>
    </form>
  );
};

export default PatientProfileForm;
