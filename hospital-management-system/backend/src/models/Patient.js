const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Assuming User model is in the same directory or path is correctly managed
// For robust referencing, ensure User model is registered before Patient model if they are in separate files.
// const User = require('./User'); // Not strictly necessary for ref, but good for clarity if using User methods here

const patientSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true, // One user should have one patient profile
  },
  medicalRecordNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  bloodType: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    // required: false // Blood type might not always be known immediately
  },
  chronicConditions: {
    type: [String], // Array of strings
    default: [], // Default to an empty array
  },
  dateOfBirth: {
    type: Date,
    // required: false // Date of birth might not always be mandatory initially
  },
  maritalStatus: {
    type: String,
    enum: ['Single', 'Married', 'Divorced', 'Widowed', 'Other'],
    // required: false
  },
}, {
  timestamps: true, // Adds createdAt and updatedAt timestamps
});

const Patient = mongoose.model('Patient', patientSchema);

module.exports = Patient;
