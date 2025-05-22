const User = require('../models/User');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find({}).select('-password'); // Exclude password
    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    console.error('Error fetching all users:', error);
    next(error);
  }
};

// @desc    Get single user by ID
// @route   GET /api/users/:id
// @access  Private/Admin (or self)
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error(`Error fetching user by ID ${req.params.id}:`, error);
    if (error.name === 'CastError') { // Handle invalid ObjectId format
        return res.status(400).json({ success: false, message: 'Invalid user ID format' });
    }
    next(error);
  }
};

// @desc    Update user details
// @route   PUT /api/users/:id
// @access  Private/Admin (or self)
const updateUser = async (req, res, next) => {
  try {
    // Fields that can be updated by an admin.
    // For self-update, more restrictive logic would be needed.
    const { firstName, lastName, email, phoneNumber, role } = req.body;

    // Password should not be updated here directly to ensure hashing.
    // If email is updated, ensure it's not taken by another user (if it's a unique field).
    if (email) {
        const existingUser = await User.findOne({ email: email.toLowerCase(), _id: { $ne: req.params.id } });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email already in use by another account.' });
        }
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Update fields if they are provided in the request body
    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.email = email ? email.toLowerCase() : user.email;
    user.phoneNumber = phoneNumber || user.phoneNumber;
    user.role = role || user.role; // Admin can change roles

    const updatedUser = await user.save(); // This will trigger pre-save hooks (e.g. if password was part of it)

    // Exclude password from the response
    const userResponse = updatedUser.toObject();
    delete userResponse.password;

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: userResponse,
    });
  } catch (error) {
    console.error(`Error updating user ${req.params.id}:`, error);
    if (error.name === 'CastError') {
        return res.status(400).json({ success: false, message: 'Invalid user ID format' });
    }
    if (error.name === 'ValidationError') {
        return res.status(400).json({ success: false, message: `Validation Error: ${error.message}` });
    }
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Consider related data: Patient/Doctor profiles.
    // For now, just deleting the User.
    // Example: await Patient.deleteOne({ user: user._id });
    // Example: await Doctor.deleteOne({ user: user._id });
    // This needs careful handling based on application logic.

    await user.deleteOne(); // Using deleteOne() method on the document

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
      // data: {} // Or send 204 No Content
    });
    // Alternatively, use 204 No Content:
    // res.status(204).send();

  } catch (error) {
    console.error(`Error deleting user ${req.params.id}:`, error);
    if (error.name === 'CastError') {
        return res.status(400).json({ success: false, message: 'Invalid user ID format' });
    }
    next(error);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
};
