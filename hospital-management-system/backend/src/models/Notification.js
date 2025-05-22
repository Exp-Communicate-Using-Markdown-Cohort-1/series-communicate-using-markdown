const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// const User = require('./User'); // Not strictly necessary for ref

const notificationSchema = new Schema({
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User', // Optional: system notifications might not have a sender
  },
  recipient: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  message: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    enum: [
      'AppointmentReminder',
      'AppointmentConfirmation',
      'AppointmentCancellation',
      'NewMedicalRecord',
      'InvoiceGenerated',
      'PaymentReminder',
      'SystemAlert',
      'GeneralMessage'
    ],
    default: 'GeneralMessage',
    required: true, // Ensure type is always present
  },
  status: {
    type: String,
    enum: ['Unread', 'Read'],
    default: 'Unread',
    required: true, // Ensure status is always present
  },
  link: { // Optional: A link to navigate to, e.g., /appointments/:id
    type: String,
    trim: true,
  },
}, {
  timestamps: true, // Adds createdAt and updatedAt timestamps
});

// Indexing for faster queries, especially for recipient notifications
notificationSchema.index({ recipient: 1, status: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
