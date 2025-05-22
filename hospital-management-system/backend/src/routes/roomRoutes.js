const express = require('express');
const router = express.Router();

const {
  createRoom,
  getAllRooms,
  getRoomById,
  updateRoomDetails,
  assignPatientToBed,
  dischargePatientFromBed,
  deleteRoom,
} = require('../controllers/roomController');

const { protect, authorize } = require('../middlewares/authMiddleware');

// @route   POST /api/rooms
// @desc    Create a new room
// @access  Private (Admin only)
router.post('/', protect, authorize('admin'), createRoom);

// @route   GET /api/rooms
// @desc    Get all rooms
// @access  Private (Admin, Nurse, Doctor)
router.get('/', protect, authorize('admin', 'nurse', 'doctor'), getAllRooms);

// @route   GET /api/rooms/:id
// @desc    Get room by ID
// @access  Private (Admin, Nurse, Doctor)
router.get('/:id', protect, authorize('admin', 'nurse', 'doctor'), getRoomById);

// @route   PUT /api/rooms/:id
// @desc    Update room details
// @access  Private (Admin only)
router.put('/:id', protect, authorize('admin'), updateRoomDetails);

// @route   POST /api/rooms/:roomId/beds/:bedIdentifier/assign
// @desc    Assign a patient to a bed
// @access  Private (Admin, Nurse)
router.post('/:roomId/beds/:bedIdentifier/assign', protect, authorize('admin', 'nurse'), assignPatientToBed);

// @route   POST /api/rooms/:roomId/beds/:bedIdentifier/discharge
// @desc    Discharge a patient from a bed
// @access  Private (Admin, Nurse)
router.post('/:roomId/beds/:bedIdentifier/discharge', protect, authorize('admin', 'nurse'), dischargePatientFromBed);

// @route   DELETE /api/rooms/:id
// @desc    Delete a room
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('admin'), deleteRoom);

module.exports = router;
