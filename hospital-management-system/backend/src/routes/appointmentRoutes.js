const express = require('express');
const router = express.Router();

const {
  createAppointment,
  getAllAppointments,
  getAppointmentsForUser,
  getAppointmentById,
  updateAppointmentStatus,
  updateAppointmentDetails,
  deleteAppointment,
} = require('../controllers/appointmentController');

const { protect, authorize } = require('../middlewares/authMiddleware');

// @route   POST /api/appointments
// @desc    Create a new appointment
// @access  Private (Patient-self, Doctor, Nurse, Admin) - Controller handles specific logic
router.post('/', protect, authorize('patient', 'doctor', 'nurse', 'admin'), createAppointment);

// @route   GET /api/appointments
// @desc    Get all appointments (admin/nurse view with filters)
// @access  Private (Admin, Nurse)
router.get('/', protect, authorize('admin', 'nurse'), getAllAppointments);

// @route   GET /api/appointments/mine
// @desc    Get appointments for the logged-in user (patient or doctor)
// @access  Private (Patient, Doctor)
router.get('/mine', protect, authorize('patient', 'doctor'), getAppointmentsForUser);

// @route   GET /api/appointments/:id
// @desc    Get a single appointment by ID
// @access  Private (Admin, Nurse, Patient involved, Doctor involved) - Controller handles specific logic
router.get('/:id', protect, authorize('admin', 'nurse', 'patient', 'doctor'), getAppointmentById);

// @route   PATCH /api/appointments/:id/status
// @desc    Update the status of an appointment
// @access  Private (Admin, Nurse, Patient involved, Doctor involved) - Controller handles specific logic
router.patch('/:id/status', protect, authorize('admin', 'nurse', 'patient', 'doctor'), updateAppointmentStatus);

// @route   PUT /api/appointments/:id
// @desc    Update details of an appointment (reschedule, reason, notes)
// @access  Private (Admin, Nurse, Patient involved, Doctor involved) - Controller handles specific logic
router.put('/:id', protect, authorize('admin', 'nurse', 'patient', 'doctor'), updateAppointmentDetails);

// @route   DELETE /api/appointments/:id
// @desc    Delete or cancel an appointment
// @access  Private (Admin for hard delete; Patient/Doctor for cancellation) - Controller handles specific logic
router.delete('/:id', protect, authorize('admin', 'patient', 'doctor'), deleteAppointment);


module.exports = router;
