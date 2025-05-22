const Patient = require('../models/Patient');
const User = require('../models/User'); // Needed to check user role and existence

// @desc    Create a new patient profile
// @route   POST /api/patients
// @access  Private (Admin, Nurse)
const createPatientProfile = async (req, res, next) => {
  try {
    const { userId, medicalRecordNumber, bloodType, chronicConditions, dateOfBirth, maritalStatus } = req.body;

    // 1. Input Validation
    if (!userId || !medicalRecordNumber) {
      return res.status(400).json({ message: 'Bad Request: userId and medicalRecordNumber are required.' });
    }

    // 2. Check if User exists and has 'patient' role (or is being made one)
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found for the provided userId.' });
    }
    // Assuming a user must have the 'patient' role to have a patient profile.
    // If a user can be implicitly converted to a patient by creating a profile, this check might change.
    if (user.role !== 'patient') {
        // Optionally, update user role to 'patient' if that's a desired workflow
        // user.role = 'patient'; await user.save();
        // For now, strict check:
        return res.status(400).json({ message: `User with ID ${userId} does not have the 'patient' role. Profile can only be created for users with 'patient' role.`});
    }


    // 3. Check for Existing Patient Profile (by userId or medicalRecordNumber)
    let existingPatient = await Patient.findOne({ user: userId });
    if (existingPatient) {
      return res.status(400).json({ message: `A patient profile already exists for user ID ${userId}.` });
    }
    existingPatient = await Patient.findOne({ medicalRecordNumber });
    if (existingPatient) {
      return res.status(400).json({ message: `A patient profile already exists with medical record number ${medicalRecordNumber}.` });
    }

    // 4. Create New Patient Profile
    const newPatient = new Patient({
      user: userId,
      medicalRecordNumber,
      bloodType,
      chronicConditions,
      dateOfBirth,
      maritalStatus,
    });

    await newPatient.save();

    // 5. Send Response (populate user details)
    const populatedPatient = await Patient.findById(newPatient._id).populate('user', 'firstName lastName email phoneNumber');

    res.status(201).json({
      success: true,
      message: 'Patient profile created successfully.',
      data: populatedPatient,
    });

  } catch (error) {
    console.error('Error creating patient profile:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: `Validation Error: ${error.message}` });
    }
    if (error.code === 11000) { // Duplicate key error
        return res.status(400).json({ message: 'Duplicate key error. Check medicalRecordNumber or user reference uniqueness.' });
    }
    next(error);
  }
};

// @desc    Get all patients
// @route   GET /api/patients
// @access  Private (Admin, Doctor, Nurse)
const getAllPatients = async (req, res, next) => {
  try {
    const patients = await Patient.find({})
      .populate('user', 'firstName lastName email phoneNumber role') // Select fields from User
      .sort({ createdAt: -1 }); // Sort by creation date, newest first

    res.status(200).json({
      success: true,
      count: patients.length,
      data: patients,
    });
  } catch (error) {
    console.error('Error fetching all patients:', error);
    next(error);
  }
};

// @desc    Get single patient by ID
// @route   GET /api/patients/:id
// @access  Private (Admin, Doctor, Nurse, or self)
const getPatientById = async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.params.id)
      .populate('user', 'firstName lastName email phoneNumber role'); // Populate user details

    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient profile not found.' });
    }

    // Self-access check for users with 'patient' role
    if (req.user.role === 'patient' && patient.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden: You can only access your own patient profile.' });
    }

    res.status(200).json({
      success: true,
      data: patient,
    });
  } catch (error) {
    console.error(`Error fetching patient by ID ${req.params.id}:`, error);
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid patient ID format.' });
    }
    next(error);
  }
};

// @desc    Update patient profile
// @route   PUT /api/patients/:id
// @access  Private (Admin, Nurse, or self)
const updatePatientProfile = async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient profile not found.' });
    }

    // Self-access check for users with 'patient' role
    if (req.user.role === 'patient' && patient.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden: You can only update your own patient profile.' });
    }

    // Fields that can be updated
    const { bloodType, chronicConditions, maritalStatus, medicalRecordNumber } = req.body;

    // Prevent non-admins from updating medicalRecordNumber after creation (example restriction)
    if (medicalRecordNumber && medicalRecordNumber !== patient.medicalRecordNumber && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Forbidden: Only administrators can change the medical record number.' });
    }
    if (medicalRecordNumber && medicalRecordNumber !== patient.medicalRecordNumber && req.user.role === 'admin') {
        // If admin changes medicalRecordNumber, check for uniqueness
        const existingPatient = await Patient.findOne({ medicalRecordNumber, _id: { $ne: req.params.id } });
        if (existingPatient) {
            return res.status(400).json({ success: false, message: `Medical record number ${medicalRecordNumber} is already in use.` });
        }
        patient.medicalRecordNumber = medicalRecordNumber;
    }

    // Update allowed fields
    if (bloodType !== undefined) patient.bloodType = bloodType;
    if (chronicConditions !== undefined) patient.chronicConditions = chronicConditions;
    if (maritalStatus !== undefined) patient.maritalStatus = maritalStatus;
    // Note: dateOfBirth is usually not updated frequently, handle as per policy.
    // User-related details (name, email, phone) should be updated via User model routes.

    const updatedPatient = await patient.save();
    const populatedPatient = await Patient.findById(updatedPatient._id).populate('user', 'firstName lastName email phoneNumber');


    res.status(200).json({
      success: true,
      message: 'Patient profile updated successfully.',
      data: populatedPatient,
    });

  } catch (error) {
    console.error(`Error updating patient profile ${req.params.id}:`, error);
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid patient ID format.' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: `Validation Error: ${error.message}` });
    }
    if (error.code === 11000 && error.keyPattern && error.keyPattern.medicalRecordNumber) {
        return res.status(400).json({ success: false, message: `Medical record number is already in use.` });
    }
    next(error);
  }
};

// @desc    Delete patient profile
// @route   DELETE /api/patients/:id
// @access  Private (Admin)
const deletePatientProfile = async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient profile not found.' });
    }

    // Consider related data: Appointments, MedicalRecords.
    // Application logic should define how to handle these.
    // For now, just deleting the Patient profile.
    // Example: await Appointment.deleteMany({ patient: patient._id });
    // Example: await MedicalRecord.deleteMany({ patient: patient._id });

    await patient.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Patient profile deleted successfully.',
      // data: {} // Or use 204 No Content
    });
    // Alternatively, res.status(204).send();

  } catch (error) {
    console.error(`Error deleting patient profile ${req.params.id}:`, error);
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid patient ID format.' });
    }
    next(error);
  }
};

module.exports = {
  createPatientProfile,
  getAllPatients,
  getPatientById,
  updatePatientProfile,
  deletePatientProfile,
};
