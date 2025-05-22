const Doctor = require('../models/Doctor');
const User = require('../models/User'); // Needed to check user role and existence

// @desc    Create a new doctor profile
// @route   POST /api/doctors
// @access  Private/Admin
const createDoctorProfile = async (req, res, next) => {
  try {
    const { userId, specialization, availability } = req.body;

    // 1. Input Validation
    if (!userId || !specialization) {
      return res.status(400).json({ message: 'Bad Request: userId and specialization are required.' });
    }

    // 2. Check if User exists and has 'doctor' role
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found for the provided userId.' });
    }
    if (user.role !== 'doctor') {
      return res.status(400).json({ message: `User with ID ${userId} does not have the 'doctor' role. Profile can only be created for users with 'doctor' role.` });
    }

    // 3. Check for Existing Doctor Profile
    const existingDoctor = await Doctor.findOne({ user: userId });
    if (existingDoctor) {
      return res.status(400).json({ message: `A doctor profile already exists for user ID ${userId}.` });
    }

    // 4. Create New Doctor Profile
    const newDoctor = new Doctor({
      user: userId,
      specialization,
      availability: availability || [], // Default to empty array if not provided
    });

    await newDoctor.save();

    // 5. Send Response (populate user details)
    const populatedDoctor = await Doctor.findById(newDoctor._id).populate('user', 'firstName lastName email phoneNumber');

    res.status(201).json({
      success: true,
      message: 'Doctor profile created successfully.',
      data: populatedDoctor,
    });

  } catch (error) {
    console.error('Error creating doctor profile:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: `Validation Error: ${error.message}` });
    }
    if (error.code === 11000) { // Duplicate key error for user reference
        return res.status(400).json({ message: 'Duplicate key error. This user likely already has a doctor profile.' });
    }
    next(error);
  }
};

// @desc    Get all doctors
// @route   GET /api/doctors
// @access  Private (Authenticated users - admin, patient, nurse, doctor)
const getAllDoctors = async (req, res, next) => {
  try {
    const doctors = await Doctor.find({})
      .populate('user', 'firstName lastName email phoneNumber role') // Select fields from User
      .sort({ createdAt: -1 }); // Sort by creation date, newest first

    res.status(200).json({
      success: true,
      count: doctors.length,
      data: doctors,
    });
  } catch (error) {
    console.error('Error fetching all doctors:', error);
    next(error);
  }
};

// @desc    Get single doctor by ID
// @route   GET /api/doctors/:id (Doctor document ID)
// @access  Private (Authenticated users)
const getDoctorById = async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.params.id)
      .populate('user', 'firstName lastName email phoneNumber role'); // Populate user details

    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found.' });
    }

    res.status(200).json({
      success: true,
      data: doctor,
    });
  } catch (error) {
    console.error(`Error fetching doctor by ID ${req.params.id}:`, error);
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid doctor ID format.' });
    }
    next(error);
  }
};

// @desc    Update doctor profile
// @route   PUT /api/doctors/:id (Doctor document ID)
// @access  Private (Admin or self)
const updateDoctorProfile = async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.params.id);

    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found.' });
    }

    // Self-access check for users with 'doctor' role
    if (req.user.role === 'doctor' && doctor.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden: You can only update your own doctor profile.' });
    }

    // Fields that can be updated
    const { specialization, availability } = req.body;

    // Update allowed fields
    if (specialization !== undefined) doctor.specialization = specialization;
    if (availability !== undefined) doctor.availability = availability;
    // User-related details (name, email, phone) should be updated via User model routes by admin,
    // or via a dedicated profile update endpoint for the user themselves.

    const updatedDoctor = await doctor.save();
    const populatedDoctor = await Doctor.findById(updatedDoctor._id).populate('user', 'firstName lastName email phoneNumber');

    res.status(200).json({
      success: true,
      message: 'Doctor profile updated successfully.',
      data: populatedDoctor,
    });

  } catch (error) {
    console.error(`Error updating doctor profile ${req.params.id}:`, error);
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid doctor ID format.' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: `Validation Error: ${error.message}` });
    }
    next(error);
  }
};

// @desc    Delete doctor profile
// @route   DELETE /api/doctors/:id (Doctor document ID)
// @access  Private (Admin)
const deleteDoctorProfile = async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.params.id);

    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found.' });
    }

    // Consider related data: Appointments, MedicalRecords.
    // Application logic should define how to handle these (e.g., reassign, anonymize).
    // For now, just deleting the Doctor profile.
    // Example: await Appointment.updateMany({ doctor: doctor._id }, { $set: { doctor: null } }); // Or reassign
    // Example: await MedicalRecord.updateMany({ doctor: doctor._id }, { $set: { doctor: null } }); // Or reassign

    await doctor.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Doctor profile deleted successfully.',
    });
    // Alternatively, res.status(204).send();

  } catch (error) {
    console.error(`Error deleting doctor profile ${req.params.id}:`, error);
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid doctor ID format.' });
    }
    next(error);
  }
};

module.exports = {
  createDoctorProfile,
  getAllDoctors,
  getDoctorById,
  updateDoctorProfile,
  deleteDoctorProfile,
};
