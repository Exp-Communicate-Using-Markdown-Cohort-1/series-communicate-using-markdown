const Notification = require('../models/Notification');
const User = require('../models/User'); // For validating recipient and sender

// @desc    Create a new notification (typically by Admin/System)
// @route   POST /api/notifications
// @access  Private (Admin)
const createNotification = async (req, res, next) => {
  try {
    const { recipientId, title, message, type, link } = req.body;
    const senderId = req.user._id; // Assuming admin is logged in and is the sender

    // 1. Input Validation
    if (!recipientId || !title || !message || !type) {
      return res.status(400).json({ message: 'Bad Request: recipientId, title, message, and type are required.' });
    }

    // 2. Validate Recipient
    const recipientUser = await User.findById(recipientId);
    if (!recipientUser) {
      return res.status(404).json({ message: `Recipient user not found with ID ${recipientId}.` });
    }

    // 3. Create New Notification
    const newNotification = new Notification({
      sender: senderId, // Admin user creating it
      recipient: recipientId,
      title,
      message,
      type,
      link: link || null, // Optional
    });

    await newNotification.save();

    // 4. Send Response (populate details if needed, though often not for simple creation)
    // For consistency, we can populate.
    const populatedNotification = await Notification.findById(newNotification._id)
        .populate('sender', 'firstName lastName email role')
        .populate('recipient', 'firstName lastName email role');


    res.status(201).json({
      success: true,
      message: 'Notification created successfully.',
      data: populatedNotification,
    });

  } catch (error) {
    console.error('Error creating notification:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: `Validation Error: ${error.message}` });
    }
    next(error);
  }
};

// @desc    Get notifications for the logged-in user
// @route   GET /api/notifications/mine
// @access  Private (User-self)
const getNotificationsForUser = async (req, res, next) => {
  try {
    const recipientId = req.user._id;
    const { status } = req.query; // Optional filter by status (e.g., 'Unread', 'Read')

    const query = { recipient: recipientId };
    if (status && ['Unread', 'Read'].includes(status)) {
      query.status = status;
    }

    const notifications = await Notification.find(query)
      .populate('sender', 'firstName lastName role') // Populate sender details if needed
      .sort({ createdAt: -1 }); // Newest first

    res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications,
    });

  } catch (error) {
    console.error('Error fetching notifications for user:', error);
    next(error);
  }
};

// @desc    Mark a specific notification as read
// @route   PATCH /api/notifications/:notificationId/read
// @access  Private (User-self)
const markNotificationAsRead = async (req, res, next) => {
  try {
    const notificationId = req.params.notificationId;
    const recipientId = req.user._id;

    const notification = await Notification.findOne({
      _id: notificationId,
      recipient: recipientId,
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found or you are not authorized to modify it.' });
    }

    if (notification.status === 'Read') {
      return res.status(200).json({
        success: true,
        message: 'Notification is already marked as read.',
        data: notification,
      });
    }

    notification.status = 'Read';
    await notification.save();

    res.status(200).json({
      success: true,
      message: 'Notification marked as read.',
      data: notification,
    });

  } catch (error) {
    console.error('Error marking notification as read:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid notification ID format.' });
    }
    next(error);
  }
};

// @desc    Mark all unread notifications for the logged-in user as read
// @route   PATCH /api/notifications/mark-all-read
// @access  Private (User-self)
const markAllNotificationsAsRead = async (req, res, next) => {
  try {
    const recipientId = req.user._id;

    const updateResult = await Notification.updateMany(
      { recipient: recipientId, status: 'Unread' },
      { $set: { status: 'Read' } }
    );

    res.status(200).json({
      success: true,
      message: 'All unread notifications marked as read.',
      data: {
        modifiedCount: updateResult.modifiedCount, // Number of documents updated
      },
    });

  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    next(error);
  }
};

// @desc    Delete a specific notification for the logged-in user
// @route   DELETE /api/notifications/:notificationId
// @access  Private (User-self)
const deleteNotification = async (req, res, next) => {
  try {
    const notificationId = req.params.notificationId;
    const recipientId = req.user._id;

    const notification = await Notification.findOne({
      _id: notificationId,
      recipient: recipientId,
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found or you are not authorized to delete it.' });
    }

    await notification.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully.',
      // data: {} // Or use 204 No Content
    });
    // Alternatively: res.status(204).send();

  } catch (error) {
    console.error('Error deleting notification:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid notification ID format.' });
    }
    next(error);
  }
};

module.exports = {
  createNotification,
  getNotificationsForUser,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
};
