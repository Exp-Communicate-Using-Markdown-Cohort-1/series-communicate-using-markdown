const Invoice = require('../models/Invoice');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const User = require('../models/User'); // For req.user

// @desc    Create a new invoice
// @route   POST /api/invoices
// @access  Private (Admin, Accountant)
const createInvoice = async (req, res, next) => {
  try {
    const { patientId, appointmentId, services, status, dueDate, notes } = req.body;

    // 1. Input Validation
    if (!patientId || !appointmentId || !services || !Array.isArray(services) || services.length === 0) {
      return res.status(400).json({ message: 'Bad Request: patientId, appointmentId, and at least one service item are required.' });
    }

    // Validate each service item
    for (const item of services) {
      if (!item.serviceName || typeof item.unitPrice !== 'number' || item.unitPrice < 0) {
        return res.status(400).json({ message: 'Bad Request: Each service item must have a serviceName and a valid non-negative unitPrice.' });
      }
      item.quantity = item.quantity || 1; // Default quantity to 1 if not provided
      if (typeof item.quantity !== 'number' || item.quantity < 1) {
        return res.status(400).json({ message: 'Bad Request: Service quantity must be a positive number.' });
      }
    }

    // 2. Check if Patient and Appointment exist
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: `Patient not found with ID ${patientId}.` });
    }
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: `Appointment not found with ID ${appointmentId}.` });
    }
    // Optionally, check if appointment.patient matches patientId

    // 3. Calculate total prices for services and overall totalAmount
    let calculatedTotalAmount = 0;
    const processedServices = services.map(item => {
      const totalPrice = (item.quantity || 1) * item.unitPrice;
      calculatedTotalAmount += totalPrice;
      return {
        serviceName: item.serviceName,
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice,
        totalPrice: totalPrice, // Store calculated total price for the item
      };
    });

    // 4. Create New Invoice
    const newInvoice = new Invoice({
      patient: patientId,
      appointment: appointmentId,
      services: processedServices,
      totalAmount: calculatedTotalAmount,
      status: status || 'Pending', // Default status if not provided
      dueDate,
      notes,
    });

    await newInvoice.save();

    // 5. Send Response (populate details)
    const populatedInvoice = await Invoice.findById(newInvoice._id)
      .populate({
        path: 'patient',
        populate: { path: 'user', select: 'firstName lastName email' }
      })
      .populate({
        path: 'appointment',
        // Populate relevant appointment details if needed, e.g., date
        select: 'appointmentDate startTime reason'
      });

    res.status(201).json({
      success: true,
      message: 'Invoice created successfully.',
      data: populatedInvoice,
    });

  } catch (error) {
    console.error('Error creating invoice:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: `Validation Error: ${error.message}` });
    }
    next(error);
  }
};

// @desc    Get all invoices
// @route   GET /api/invoices
// @access  Private (Admin, Accountant)
const getAllInvoices = async (req, res, next) => {
  try {
    const { patientId, status, startDate, endDate } = req.query;
    const query = {};

    if (patientId) query.patient = patientId;
    if (status) query.status = status;
    if (startDate && endDate) {
      query.createdAt = { $gte: new Date(startDate), $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)) };
    } else if (startDate) {
      query.createdAt = { $gte: new Date(startDate) };
    } else if (endDate) {
      query.createdAt = { $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)) };
    }

    const invoices = await Invoice.find(query)
      .populate({
        path: 'patient',
        populate: { path: 'user', select: 'firstName lastName email' }
      })
      .populate({
        path: 'appointment',
        select: 'appointmentDate'
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: invoices.length,
      data: invoices,
    });
  } catch (error) {
    console.error('Error fetching all invoices:', error);
    next(error);
  }
};

// @desc    Get invoices for the logged-in patient
// @route   GET /api/invoices/mine
// @access  Private (Patient-self)
const getInvoicesForPatient = async (req, res, next) => {
  try {
    const loggedInUserId = req.user._id;

    // Find the patient profile linked to the logged-in user
    const patientProfile = await Patient.findOne({ user: loggedInUserId });
    if (!patientProfile) {
      // This case should ideally not happen if user role is 'patient' and they have a profile
      return res.status(404).json({ success: false, message: 'Patient profile not found for logged-in user.' });
    }

    const invoices = await Invoice.find({ patient: patientProfile._id })
      .populate({
        path: 'appointment',
        select: 'appointmentDate reason'
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: invoices.length,
      data: invoices,
    });

  } catch (error) {
    console.error('Error fetching invoices for patient:', error);
    next(error);
  }
};

// @desc    Get a single invoice by its ID
// @route   GET /api/invoices/:invoiceId
// @access  Private (Admin, Accountant, or Patient-self)
const getInvoiceById = async (req, res, next) => {
  try {
    const invoiceId = req.params.invoiceId;
    const loggedInUser = req.user;

    const invoice = await Invoice.findById(invoiceId)
      .populate({
        path: 'patient',
        populate: { path: 'user', select: 'firstName lastName email' }
      })
      .populate({
        path: 'appointment',
        select: 'appointmentDate reason'
      });

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }

    // Authorization Check
    let isAuthorized = false;
    if (['admin', 'accountant'].includes(loggedInUser.role)) {
      isAuthorized = true;
    } else if (loggedInUser.role === 'patient') {
      // Check if the logged-in user is the patient associated with the invoice
      const selfPatientProfile = await Patient.findOne({ user: loggedInUser._id });
      if (selfPatientProfile && invoice.patient && invoice.patient._id.toString() === selfPatientProfile._id.toString()) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return res.status(403).json({ message: 'Forbidden: You are not authorized to view this invoice.' });
    }

    res.status(200).json({
      success: true,
      data: invoice,
    });

  } catch (error) {
    console.error(`Error fetching invoice by ID ${req.params.invoiceId}:`, error);
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid invoice ID format.' });
    }
    next(error);
  }
};

// @desc    Update an invoice
// @route   PUT /api/invoices/:invoiceId
// @access  Private (Admin, Accountant)
const updateInvoice = async (req, res, next) => {
  try {
    const invoiceId = req.params.invoiceId;
    const { services, status, dueDate, paidDate, paymentMethod, notes } = req.body;
    // const loggedInUser = req.user; // For potential future use if non-admin/accountant access is added

    // 1. Find Invoice
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }

    // 2. Authorization Check (Route level ensures only Admin/Accountant)
    // No further checks needed here if route is strictly for Admin/Accountant.

    // 3. Update Fields
    if (services && Array.isArray(services)) {
      let calculatedTotalAmount = 0;
      const processedServices = services.map(item => {
        if (!item.serviceName || typeof item.unitPrice !== 'number' || item.unitPrice < 0) {
          // Throw an error or handle as needed, for now skipping invalid items or returning error
          throw new Error('Invalid service item provided during update.');
        }
        item.quantity = item.quantity || 1;
        if (typeof item.quantity !== 'number' || item.quantity < 1) {
            throw new Error('Service quantity must be a positive number.');
        }
        const totalPrice = (item.quantity || 1) * item.unitPrice;
        calculatedTotalAmount += totalPrice;
        return {
          serviceName: item.serviceName,
          quantity: item.quantity || 1,
          unitPrice: item.unitPrice,
          totalPrice: totalPrice,
        };
      });
      invoice.services = processedServices;
      invoice.totalAmount = calculatedTotalAmount;
    }

    if (status) invoice.status = status;
    if (dueDate) invoice.dueDate = dueDate;
    if (paidDate) invoice.paidDate = paidDate;
    if (paymentMethod) invoice.paymentMethod = paymentMethod;
    if (notes !== undefined) invoice.notes = notes.trim();

    // Prevent patient or appointment from being changed on an existing invoice
    if (req.body.patient || req.body.appointment) {
        return res.status(400).json({ message: 'Patient or Appointment cannot be changed on an existing invoice.' });
    }

    const updatedInvoice = await invoice.save();

    // 4. Send Response
    const populatedInvoice = await Invoice.findById(updatedInvoice._id)
      .populate({
        path: 'patient',
        populate: { path: 'user', select: 'firstName lastName email' }
      })
      .populate({
        path: 'appointment',
        select: 'appointmentDate reason'
      });

    res.status(200).json({
      success: true,
      message: 'Invoice updated successfully.',
      data: populatedInvoice,
    });

  } catch (error) {
    console.error(`Error updating invoice ${req.params.invoiceId}:`, error);
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid invoice ID format.' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: `Validation Error: ${error.message}` });
    }
    if (error.message === 'Invalid service item provided during update.' || error.message === 'Service quantity must be a positive number.') {
        return res.status(400).json({ message: error.message });
    }
    next(error);
  }
};

// @desc    Delete an invoice
// @route   DELETE /api/invoices/:invoiceId
// @access  Private (Admin only)
const deleteInvoice = async (req, res, next) => {
  try {
    const invoiceId = req.params.invoiceId;

    // 1. Find Invoice
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }

    // 2. Authorization Check (Route level ensures only Admin)
    // No further checks needed here if route is strictly for Admin.

    // 3. Delete Invoice
    await invoice.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Invoice deleted successfully.',
      // data: {} // Or use 204 No Content
    });
    // Alternatively: res.status(204).send();

  } catch (error) {
    console.error(`Error deleting invoice ${req.params.invoiceId}:`, error);
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid invoice ID format.' });
    }
    next(error);
  }
};

module.exports = {
  createInvoice,
  getAllInvoices,
  getInvoicesForPatient,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
};
