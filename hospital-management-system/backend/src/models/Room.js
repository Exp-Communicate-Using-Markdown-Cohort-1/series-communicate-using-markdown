const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// const Patient = require('./Patient'); // Not strictly necessary for ref

const bedSchema = new Schema({
  bedIdentifier: {
    type: String,
    required: true,
    trim: true,
  },
  isOccupied: {
    type: Boolean,
    default: false,
  },
  patient: {
    type: Schema.Types.ObjectId,
    ref: 'Patient',
    default: null,
  },
  admissionDate: {
    type: Date,
    default: null,
  },
  dischargeDateExpected: {
    type: Date,
    default: null,
  },
  notes: {
    type: String,
    trim: true,
  },
}, { _id: false }); // Using bedIdentifier as the primary way to identify a bed within a room

const roomSchema = new Schema({
  roomNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  roomType: {
    type: String,
    enum: ['Private', 'Semi-Private', 'Ward', 'ICU', 'Operating Room', 'Other'],
    required: true,
  },
  department: { // e.g., "Cardiology", "General Surgery", "Pediatrics"
    type: String,
    trim: true,
  },
  beds: [bedSchema],
  capacity: { // Total number of beds in the room
    type: Number,
    required: true,
    min: [0, 'Capacity cannot be negative'], // Should generally be at least 1 for most room types
  },
  currentOccupancy: {
    type: Number,
    default: 0,
    min: [0, 'Occupancy cannot be negative'],
    // This should ideally be updated by a pre-save hook based on beds array
    validate: {
      validator: function(value) {
        return value <= this.capacity;
      },
      message: 'Current occupancy cannot exceed capacity.'
    }
  },
  status: {
    type: String,
    enum: ['Available', 'Full', 'Maintenance', 'Unavailable'],
    default: 'Available',
    required: true, // Ensure status is always present
  },
  features: { // e.g., ["TV", "Private Bathroom", "Oxygen Supply"]
    type: [String],
    default: [],
  },
}, {
  timestamps: true, // Adds createdAt and updatedAt timestamps
});

// Pre-save hook example (can be uncommented and refined later)
/*
roomSchema.pre('save', function(next) {
  this.currentOccupancy = this.beds.filter(bed => bed.isOccupied).length;
  if (this.currentOccupancy >= this.capacity) {
    if (this.status !== 'Maintenance' && this.status !== 'Unavailable') {
      this.status = 'Full';
    }
  } else {
    if (this.status === 'Full') {
      this.status = 'Available';
    }
  }
  // Ensure capacity matches the number of beds defined, or beds don't exceed capacity
  if (this.beds.length !== this.capacity) {
    // This could be an error or a warning, depending on desired strictness
    // For now, let's assume capacity is the source of truth for how many beds SHOULD be there.
    // Or, capacity could be auto-calculated from beds.length:
    // this.capacity = this.beds.length;
  }
  next();
});
*/

// Indexing for faster queries
roomSchema.index({ roomNumber: 1 });
roomSchema.index({ roomType: 1, status: 1 });
roomSchema.index({ department: 1, status: 1 });

const Room = mongoose.model('Room', roomSchema);

module.exports = Room;
