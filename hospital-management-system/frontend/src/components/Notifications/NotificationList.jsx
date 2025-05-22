import React from 'react';
import usePatientDataStore from '../../store/patientDataStore'; // To call markNotificationRead

const NotificationList = ({ notifications }) => {
  const { markNotificationRead } = usePatientDataStore();

  if (!notifications || notifications.length === 0) {
    return <p className="text-gray-600">No notifications found.</p>;
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString(undefined, {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    } catch (e) {
      return 'Invalid Date';
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationRead(notificationId);
      // The store action should ideally update the local state, triggering a re-render.
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
      // Optionally show an error to the user
    }
  };

  return (
    <div className="space-y-4">
      {notifications.map((notification) => (
        <div 
          key={notification._id} 
          className={`p-4 rounded-lg shadow-md ${
            notification.status === 'Unread' ? 'bg-blue-50 border-l-4 border-blue-500' : 'bg-white'
          }`}
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-gray-800">{notification.title}</h3>
              <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
              {notification.link && (
                <a 
                  href={notification.link} 
                  className="text-sm text-indigo-600 hover:text-indigo-800 mt-1 inline-block"
                  target="_blank" // if external links are possible
                  rel="noopener noreferrer" // for security with target="_blank"
                >
                  View Details
                </a>
              )}
            </div>
            {notification.status === 'Unread' && (
              <button
                onClick={() => handleMarkAsRead(notification._id)}
                className="ml-4 px-3 py-1 text-xs font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Mark as Read
              </button>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-2 text-right">
            {formatDate(notification.createdAt)}
          </p>
        </div>
      ))}
    </div>
  );
};

export default NotificationList;
