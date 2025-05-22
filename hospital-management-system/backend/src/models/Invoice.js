const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// const Patient = require('./Patient'); // Not strictly necessary for ref
// const Appointment = require('./Appointment'); // Not strictly necessary for ref

const serviceItemSchema = new Schema({
  serviceName: {
    type: String,
    required: true,
    trim: true,
  },
  quantity: {
    type: Number,
    default: 1,
    min: [1, 'Quantity must be at least 1'], // Assuming quantity cannot be less than 1
  },
  unitPrice: {
    type: Number,
    required: true,
    min: [0, 'Unit price cannot be negative'],
  },
  totalPrice: {
    type: Number,
    required: true,
    min: [0, 'Total price cannot be negative'],
    // This could be calculated in a pre-save hook based on quantity and unitPrice
  },
}, { _id: false });

const invoiceSchema = new Schema({
  patient: {
    type: Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
  },
  appointment: {
    type: Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true,
  },
  services: [serviceItemSchema],
  totalAmount: {
    type: Number,
    required: true,
    min: [0, 'Total amount cannot be negative'],
    // This could be calculated in a pre-save hook based on the sum of totalPrice in services
  },
  status: {
    type: String,
    enum: ['Pending', 'Paid', 'Cancelled', 'Overdue'],
    default: 'Pending',
    required: true, // Ensure status is always present
  },
  dueDate: {
    type: Date,
  },
  paidDate: {
    type: Date,
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Credit Card', 'Insurance', 'Online', 'Other'],
  },
  notes: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true, // Adds createdAt and updatedAt timestamps
});

// Pre-save hook example (can be uncommented and refined later)
/*
invoiceSchema.pre('save', function(next) {
  // Calculate totalPrice for each service item
  this.services.forEach(service => {
    service.totalPrice = service.quantity * service.unitPrice;
  });

  // Calculate overall totalAmount
  this.totalAmount = this.services.reduce((sum, service) => sum + service.totalPrice, 0);
  next();
});
*/

// Indexing for faster queries
invoiceSchema.index({ patient: 1, status: 1 });
invoiceSchema.index({ appointment: 1 });
invoiceSchema.index({ dueDate: 1, status: 1 });

const Invoice = mongoose.model('Invoice', invoiceSchema);

module.exports = Invoice;
