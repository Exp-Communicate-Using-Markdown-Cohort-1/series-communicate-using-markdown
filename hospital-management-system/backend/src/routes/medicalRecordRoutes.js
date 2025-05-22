const express = require('express');
const router = express.Router();

const {
  createMedicalRecord,
  getMedicalRecordsForPatient,
  getMedicalRecordById,
  updateMedicalRecord,
  deleteMedicalRecord,
} = require('../controllers/medicalRecordController');

const { protect, authorize } = require('../middlewares/authMiddleware');

// @route   POST /api/medical-records
// @desc    Create a new medical record
// @access  Private (Doctor, Nurse, Admin) - Controller further refines based on logged-in user vs provided doctorId
router.post('/', protect, authorize('doctor', 'nurse', 'admin'), createMedicalRecord);

// @route   GET /api/medical-records/patient/:patientId
// @desc    Get all medical records for a specific patient
// @access  Private (Admin, Nurse, Patient-self, Doctor) - Controller handles specific access logic
router.get('/patient/:patientId', protect, authorize('admin', 'nurse', 'patient', 'doctor'), getMedicalRecordsForPatient);

// @route   GET /api/medical-records/:recordId
// @desc    Get a single medical record by its ID
// @access  Private (Admin, Nurse, Patient-self, Doctor who created/associated) - Controller handles specific access logic
router.get('/:recordId', protect, authorize('admin', 'nurse', 'patient', 'doctor'), getMedicalRecordById);

// @route   PUT /api/medical-records/:recordId
// @desc    Update a medical record
// @access  Private (Admin, or Doctor who created the record) - Controller handles specific access logic
router.put('/:recordId', protect, authorize('admin', 'doctor'), updateMedicalRecord);

// @route   DELETE /api/medical-records/:recordId
// @desc    Delete a medical record
// @access  Private (Admin only)
router.delete('/:recordId', protect, authorize('admin'), deleteMedicalRecord);

module.exports = router;
