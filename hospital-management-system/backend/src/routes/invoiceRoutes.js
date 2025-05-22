const express = require('express');
const router = express.Router();

const {
  createInvoice,
  getAllInvoices,
  getInvoicesForPatient,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
} = require('../controllers/invoiceController');

const { protect, authorize } = require('../middlewares/authMiddleware');

// @route   POST /api/invoices
// @desc    Create a new invoice
// @access  Private (Admin, Accountant)
router.post('/', protect, authorize('admin', 'accountant'), createInvoice);

// @route   GET /api/invoices
// @desc    Get all invoices
// @access  Private (Admin, Accountant)
router.get('/', protect, authorize('admin', 'accountant'), getAllInvoices);

// @route   GET /api/invoices/mine
// @desc    Get invoices for the logged-in patient
// @access  Private (Patient)
router.get('/mine', protect, authorize('patient'), getInvoicesForPatient);

// @route   GET /api/invoices/:invoiceId
// @desc    Get a single invoice by its ID
// @access  Private (Admin, Accountant, Patient-self) - Controller handles self-access
router.get('/:invoiceId', protect, authorize('admin', 'accountant', 'patient'), getInvoiceById);

// @route   PUT /api/invoices/:invoiceId
// @desc    Update an invoice
// @access  Private (Admin, Accountant)
router.put('/:invoiceId', protect, authorize('admin', 'accountant'), updateInvoice);

// @route   DELETE /api/invoices/:invoiceId
// @desc    Delete an invoice
// @access  Private (Admin only)
router.delete('/:invoiceId', protect, authorize('admin'), deleteInvoice);

module.exports = router;
