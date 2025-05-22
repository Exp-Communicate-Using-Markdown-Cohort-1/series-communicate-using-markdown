const express = require('express');
const router = express.Router();

const {
  createPatientProfile,
  getAllPatients,
  getPatientById,
  updatePatientProfile,
  deletePatientProfile,
} = require('../controllers/patientController');

const { protect, authorize } = require('../middlewares/authMiddleware');

// @route   POST /api/patients
// @desc    Create a new patient profile
// @access  Private (Admin, Nurse)
router.post('/', protect, authorize('admin', 'nurse'), createPatientProfile);

// @route   GET /api/patients
// @desc    Get all patients
// @access  Private (Admin, Doctor, Nurse)
router.get('/', protect, authorize('admin', 'doctor', 'nurse'), getAllPatients);

// @route   GET /api/patients/:id
// @desc    Get patient by ID (Patient document ID)
// @access  Private (Admin, Doctor, Nurse, Patient-self)
// Controller logic handles self-access for 'patient' role
router.get('/:id', protect, authorize('admin', 'doctor', 'nurse', 'patient'), getPatientById);

// @route   PUT /api/patients/:id
// @desc    Update patient profile by ID (Patient document ID)
// @access  Private (Admin, Nurse, Patient-self)
// Controller logic handles self-access for 'patient' role
router.put('/:id', protect, authorize('admin', 'nurse', 'patient'), updatePatientProfile);

// @route   DELETE /api/patients/:id
// @desc    Delete patient profile by ID (Patient document ID)
// @access  Private (Admin)
router.delete('/:id', protect, authorize('admin'), deletePatientProfile);

module.exports = router;
