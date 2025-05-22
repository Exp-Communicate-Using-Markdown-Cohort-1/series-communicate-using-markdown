const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// const Patient = require('./Patient'); // Not strictly necessary for ref
// const Doctor = require('./Doctor');   // Not strictly necessary for ref

const prescriptionSchema = new Schema({
  medication: {
    type: String,
    required: true,
    trim: true,
  },
  dosage: {
    type: String,
    required: true,
    trim: true,
  },
  frequency: {
    type: String,
    required: true,
    trim: true,
  },
  duration: { // e.g., "7 days", "until finished"
    type: String,
    required: true,
    trim: true,
  },
}, { _id: false }); // No separate _id for subdocuments unless needed

const attachmentSchema = new Schema({
  fileName: {
    type: String,
    required: true,
    trim: true,
  },
  fileUrl: { // URL to the stored file (e.g., S3, Cloudinary)
    type: String,
    required: true,
    trim: true,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
}, { _id: false }); // No separate _id for subdocuments unless needed

const medicalRecordSchema = new Schema({
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
  date: {
    type: Date,
    default: Date.now,
    required: true, // Ensure date is always present
  },
  diagnosis: {
    type: String,
    required: true,
    trim: true,
  },
  prescription: [prescriptionSchema], // Array of prescription subdocuments
  notes: {
    type: String,
    trim: true,
  },
  attachments: [attachmentSchema], // Array of attachment subdocuments
}, {
  timestamps: true, // Adds createdAt and updatedAt timestamps
});

// Indexing for faster queries, especially for patient records
medicalRecordSchema.index({ patient: 1, date: -1 }); // Sort by date descending for a patient
medicalRecordSchema.index({ doctor: 1, date: -1 }); // Sort by date descending for a doctor

const MedicalRecord = mongoose.model('MedicalRecord', medicalRecordSchema);

module.exports = MedicalRecord;
