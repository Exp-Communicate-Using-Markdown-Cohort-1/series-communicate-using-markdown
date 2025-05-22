const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// const User = require('./User'); // Not strictly necessary for ref, but good for clarity
// const Patient = require('./Patient'); // Not strictly necessary for ref

const doctorSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true, // One user should have one doctor profile
  },
  specialization: {
    type: String,
    required: true,
    trim: true,
  },
  patients: [{
    type: Schema.Types.ObjectId,
    ref: 'Patient',
  }],
  appointments: [{
    type: Schema.Types.ObjectId,
    ref: 'Appointment', // Appointment model will be defined later
  }],
  ratings: [{
    patient: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
      required: true, // Assuming a rating must be associated with a patient
    },
    score: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    comment: {
      type: String,
      trim: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
  }],
  availability: [{
    dayOfWeek: { // e.g., "Monday", "Tuesday", etc.
      type: String,
      required: true,
      enum: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    },
    startTime: { // e.g., "09:00" (24-hour format recommended)
      type: String,
      required: true,
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Please use HH:MM format for startTime'],
    },
    endTime: { // e.g., "17:00" (24-hour format recommended)
      type: String,
      required: true,
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Please use HH:MM format for endTime'],
      // Add validation: endTime must be after startTime
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  }],
}, {
  timestamps: true, // Adds createdAt and updatedAt timestamps
});

// Potential validation: Ensure endTime is after startTime in availability
// doctorSchema.path('availability').validate(function(value) {
//   for (const slot of value) {
//     if (slot.startTime >= slot.endTime) {
//       return false;
//     }
//   }
//   return true;
// }, 'End time must be after start time for an availability slot.');

const Doctor = mongoose.model('Doctor', doctorSchema);

module.exports = Doctor;
