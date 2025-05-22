import React, { useEffect } from 'react';
import usePatientDataStore from '../../store/patientDataStore';
import NotificationList from '../../components/Notifications/NotificationList'; // Adjust path
import useAuthStore from '../../store/authStore';

const PatientNotificationsPage = () => {
  const { 
    notifications, 
    isLoadingNotifications, 
    errorNotifications, 
    fetchMyNotifications,
    markAllNotificationsRead 
  } = usePatientDataStore();
  
  const { user } = useAuthStore();

  useEffect(() => {
    if (user && user.role === 'patient') {
      fetchMyNotifications();
    }
  }, [fetchMyNotifications, user]);

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      // Optionally, re-fetch or rely on store's local update logic
      // fetchMyNotifications(); 
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
      // Handle error display to user if necessary
    }
  };

  if (user && user.role !== 'patient') {
    return (
      <div className="p-4">
        <h2 className="text-xl font-semibold text-red-600">Access Denied</h2>
        <p className="text-gray-700">This page is only accessible to patients.</p>
      </div>
    );
  }
  
  if (isLoadingNotifications) {
    return <div className="p-4 text-lg text-gray-700">Loading notifications...</div>;
  }

  if (errorNotifications) {
    return <div className="p-4 text-red-600">Error: {errorNotifications}</div>;
  }

  const unreadCount = notifications.filter(n => n.status === 'Unread').length;

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-800">My Notifications</h1>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Mark All as Read ({unreadCount})
          </button>
        )}
      </div>
      <NotificationList notifications={notifications} />
    </div>
  );
};

export default PatientNotificationsPage;
