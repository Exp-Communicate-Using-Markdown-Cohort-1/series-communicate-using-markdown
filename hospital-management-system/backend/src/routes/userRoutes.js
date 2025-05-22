const express = require('express');
const router = express.Router();

const {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} = require('../controllers/userController');

const { protect, authorize } = require('../middlewares/authMiddleware');

// All routes in this file are protected and require admin privileges by default.
// Specific routes can have more granular permissions if needed in the future,
// e.g., allowing a user to get/update their own profile.

// @route   GET /api/users
// @desc    Get all users
// @access  Private/Admin
router.get('/', protect, authorize('admin'), getAllUsers);

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private/Admin (Self-access can be added here later if req.user.id === req.params.id)
router.get('/:id', protect, authorize('admin'), getUserById);

// @route   PUT /api/users/:id
// @desc    Update user by ID
// @access  Private/Admin (Self-access can be added here later if req.user.id === req.params.id)
router.put('/:id', protect, authorize('admin'), updateUser);

// @route   DELETE /api/users/:id
// @desc    Delete user by ID
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), deleteUser);

module.exports = router;
