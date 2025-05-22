const express = require('express');
const router = express.Router();

const {
  createDoctorProfile,
  getAllDoctors,
  getDoctorById,
  updateDoctorProfile,
  deleteDoctorProfile,
} = require('../controllers/doctorController');

const { protect, authorize } = require('../middlewares/authMiddleware');

// @route   POST /api/doctors
// @desc    Create a new doctor profile
// @access  Private/Admin
router.post('/', protect, authorize('admin'), createDoctorProfile);

// @route   GET /api/doctors
// @desc    Get all doctors
// @access  Private (All authenticated users can view doctors for now)
router.get('/', protect, getAllDoctors);

// @route   GET /api/doctors/:id (Doctor document ID)
// @desc    Get doctor by ID
// @access  Private (All authenticated users can view a doctor's profile for now)
router.get('/:id', protect, getDoctorById);

// @route   PUT /api/doctors/:id (Doctor document ID)
// @desc    Update doctor profile
// @access  Private (Admin or Doctor-self)
// Controller logic handles self-access for 'doctor' role
router.put('/:id', protect, authorize('admin', 'doctor'), updateDoctorProfile);

// @route   DELETE /api/doctors/:id (Doctor document ID)
// @desc    Delete doctor profile
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), deleteDoctorProfile);

module.exports = router;
