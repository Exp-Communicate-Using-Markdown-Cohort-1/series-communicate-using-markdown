const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// const Patient = require('./Patient'); // Not strictly necessary for ref
// const Doctor = require('./Doctor');   // Not strictly necessary for ref

const appointmentSchema = new Schema({
  patient: {
    type: Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
  },
  doctor: {
    type: Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true,
  },
  appointmentDate: {
    type: Date,
    required: true,
  },
  startTime: { // e.g., "10:00" (24-hour format recommended)
    type: String,
    required: true,
    match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Please use HH:MM format for startTime'],
  },
  endTime: { // e.g., "10:30" (24-hour format recommended)
    type: String,
    required: true,
    match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Please use HH:MM format for endTime'],
    // Add validation: endTime must be after startTime
  },
  reason: {
    type: String,
    trim: true,
  },
  status: {
    type: String,
    enum: ['Scheduled', 'Completed', 'Cancelled', 'Pending Approval', 'Rejected'],
    default: 'Pending Approval',
    required: true, // Ensure status is always present
  },
  notes: { // Optional notes by doctor or patient regarding the appointment
    type: String,
    trim: true,
  },
}, {
  timestamps: true, // Adds createdAt and updatedAt timestamps
});

// Potential validation: Ensure endTime is after startTime
// appointmentSchema.path('endTime').validate(function (value) {
//   // `this.startTime` will give you the value of startTime in the same document
//   return this.startTime < value;
// }, 'End time must be after start time.');

// Indexing for faster queries, especially for doctor and patient appointments
appointmentSchema.index({ doctor: 1, appointmentDate: 1, startTime: 1 });
appointmentSchema.index({ patient: 1, appointmentDate: 1, startTime: 1 });


const Appointment = mongoose.model('Appointment', appointmentSchema);

module.exports = Appointment;
