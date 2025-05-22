import React, { useState, useEffect } from 'react';
import useDoctorDataStore from '../../store/doctorDataStore';

const AvailabilityManager = () => {
  const { doctorProfile, saveDoctorAvailability, isLoadingAvailability, errorAvailability } = useDoctorDataStore();
  
  // Local state for managing the form and current availability display
  // Initialize with doctorProfile.availability or an empty array
  const [currentAvailability, setCurrentAvailability] = useState([]);
  
  // Form state for adding a new slot
  const [newSlot, setNewSlot] = useState({
    dayOfWeek: 'Monday',
    startTime: '09:00',
    endTime: '17:00',
    isAvailable: true, // Default to available
  });

  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  useEffect(() => {
    if (doctorProfile && doctorProfile.availability) {
      setCurrentAvailability(doctorProfile.availability);
    } else {
      setCurrentAvailability([]); // Ensure it's an array if profile or availability is null/undefined
    }
  }, [doctorProfile]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewSlot(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleAddSlot = (e) => {
    e.preventDefault();
    if (!newSlot.startTime || !newSlot.endTime || newSlot.startTime >= newSlot.endTime) {
      alert("Invalid time slot. End time must be after start time.");
      return;
    }
    // Check for overlapping slots before adding (basic check, can be more robust)
    const overlaps = currentAvailability.some(slot =>
      slot.dayOfWeek === newSlot.dayOfWeek &&
      ((newSlot.startTime < slot.endTime && newSlot.endTime > slot.startTime))
    );
    if (overlaps) {
        alert(`An overlapping availability slot already exists for ${newSlot.dayOfWeek}.`);
        return;
    }

    const updatedAvailability = [...currentAvailability, { ...newSlot, _id: Date.now().toString() }]; // Temporary _id for list key
    setCurrentAvailability(updatedAvailability);
    // Reset form, but keep dayOfWeek for convenience perhaps
    setNewSlot(prev => ({ ...prev, startTime: '09:00', endTime: '17:00', isAvailable: true }));
  };

  const handleRemoveSlot = (indexToRemove) => {
    const updatedAvailability = currentAvailability.filter((_, index) => index !== indexToRemove);
    setCurrentAvailability(updatedAvailability);
  };

  const handleSaveAvailability = async () => {
    // Remove temporary _ids if they exist before saving
    const finalAvailability = currentAvailability.map(({_id, ...slot}) => slot);
    try {
      await saveDoctorAvailability(finalAvailability);
      alert('Availability saved successfully!');
    } catch (error) {
      alert(`Failed to save availability: ${error.message}`);
    }
  };

  return (
    <div className="space-y-6 bg-white p-6 shadow rounded-lg">
      <h3 className="text-lg font-medium leading-6 text-gray-900">Manage Availability</h3>

      {/* Form to add new availability slot */}
      <form onSubmit={handleAddSlot} className="space-y-4 border p-4 rounded-md">
        <h4 className="text-md font-semibold">Add New Slot</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="dayOfWeek" className="block text-sm font-medium text-gray-700">Day</label>
            <select 
              name="dayOfWeek" 
              id="dayOfWeek"
              value={newSlot.dayOfWeek} 
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              {daysOfWeek.map(day => <option key={day} value={day}>{day}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">Start Time</label>
            <input 
              type="time" 
              name="startTime" 
              id="startTime"
              value={newSlot.startTime} 
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">End Time</label>
            <input 
              type="time" 
              name="endTime" 
              id="endTime"
              value={newSlot.endTime} 
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          {/* <div className="flex items-end">
            <label htmlFor="isAvailable" className="flex items-center text-sm font-medium text-gray-700">
              <input 
                type="checkbox"
                name="isAvailable"
                id="isAvailable"
                checked={newSlot.isAvailable}
                onChange={handleInputChange}
                className="mr-2 h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              Available
            </label>
          </div> */}
        </div>
        <button 
          type="submit"
          className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          Add Slot to List
        </button>
      </form>

      {/* Display current availability slots */}
      <div>
        <h4 className="text-md font-semibold mb-2">Current Availability Slots</h4>
        {currentAvailability.length === 0 ? (
          <p className="text-sm text-gray-500">No availability slots defined.</p>
        ) : (
          <ul className="space-y-2">
            {currentAvailability.map((slot, index) => (
              <li key={slot._id || index} className="flex justify-between items-center p-3 bg-gray-50 rounded-md shadow-sm">
                <div>
                  <span className="font-medium">{slot.dayOfWeek}:</span> {slot.startTime} - {slot.endTime}
                  {/* <span className={`ml-2 text-xs font-semibold px-2 py-0.5 rounded-full ${slot.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {slot.isAvailable ? 'Available' : 'Unavailable'}
                  </span> */}
                </div>
                <button 
                  onClick={() => handleRemoveSlot(index)}
                  className="text-red-500 hover:text-red-700 text-sm font-medium"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      {errorAvailability && (
        <p className="text-sm text-red-600">{errorAvailability}</p>
      )}

      <div className="pt-5">
        <div className="flex justify-end">
          <button
            onClick={handleSaveAvailability}
            disabled={isLoadingAvailability}
            className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
          >
            {isLoadingAvailability ? 'Saving...' : 'Save All Availability Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AvailabilityManager;
