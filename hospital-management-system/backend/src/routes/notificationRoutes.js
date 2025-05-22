const express = require('express');
const router = express.Router();

const {
  createNotification,
  getNotificationsForUser,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} = require('../controllers/notificationController');

const { protect, authorize } = require('../middlewares/authMiddleware');

// @route   POST /api/notifications
// @desc    Create a new notification (Admin only for manual creation)
// @access  Private (Admin)
router.post('/', protect, authorize('admin'), createNotification);

// @route   GET /api/notifications/mine
// @desc    Get notifications for the logged-in user
// @access  Private (User-self)
router.get('/mine', protect, getNotificationsForUser);

// @route   PATCH /api/notifications/:notificationId/read
// @desc    Mark a specific notification as read for the logged-in user
// @access  Private (User-self)
router.patch('/:notificationId/read', protect, markNotificationAsRead);

// @route   PATCH /api/notifications/mark-all-read
// @desc    Mark all unread notifications for the logged-in user as read
// @access  Private (User-self)
router.patch('/mark-all-read', protect, markAllNotificationsAsRead);

// @route   DELETE /api/notifications/:notificationId
// @desc    Delete a specific notification for the logged-in user
// @access  Private (User-self)
router.delete('/:notificationId', protect, deleteNotification);

module.exports = router;
