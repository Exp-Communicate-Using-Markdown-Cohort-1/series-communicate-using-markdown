const MedicalRecord = require('../models/MedicalRecord');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const User = require('../models/User'); // For req.user

// @desc    Create a new medical record
// @route   POST /api/medical-records
// @access  Private (Doctor, Nurse, Admin)
const createMedicalRecord = async (req, res, next) => {
  try {
    const { patientId, diagnosis, prescription, notes, attachments } = req.body;
    const loggedInUser = req.user;
    let doctorId;

    // 1. Input Validation
    if (!patientId || !diagnosis) {
      return res.status(400).json({ message: 'Bad Request: patientId and diagnosis are required.' });
    }

    // 2. Determine Doctor ID and Authorization
    if (loggedInUser.role === 'doctor') {
      const doctorProfile = await Doctor.findOne({ user: loggedInUser._id });
      if (!doctorProfile) {
        return res.status(403).json({ message: 'Forbidden: Doctor profile not found for the logged-in user.' });
      }
      doctorId = doctorProfile._id;
    } else if (['admin', 'nurse'].includes(loggedInUser.role)) {
      // Admin/Nurse must provide doctorId in the body, or we could assign a default/system doctor
      // For now, let's assume if an admin/nurse creates it, they might specify the attending doctor.
      // This part can be ambiguous. Let's assume doctorId comes from req.body if not a doctor.
      if (!req.body.doctorId) {
          return res.status(400).json({ message: 'Bad Request: doctorId is required when admin/nurse creates a medical record.' });
      }
      const doctorExists = await Doctor.findById(req.body.doctorId);
      if (!doctorExists) {
          return res.status(404).json({ message: `Doctor not found with ID ${req.body.doctorId}` });
      }
      doctorId = req.body.doctorId;
    } else {
      return res.status(403).json({ message: 'Forbidden: Only doctors, nurses, or admins can create medical records.' });
    }

    // 3. Check if Patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: `Patient not found with ID ${patientId}.` });
    }

    // 4. Create New Medical Record
    const newRecord = new MedicalRecord({
      patient: patientId,
      doctor: doctorId,
      diagnosis,
      prescription: prescription || [],
      notes: notes || '',
      attachments: attachments || [],
      // date is defaulted by schema
    });

    await newRecord.save();

    // 5. Send Response (populate details)
    const populatedRecord = await MedicalRecord.findById(newRecord._id)
      .populate({
        path: 'patient',
        populate: { path: 'user', select: 'firstName lastName email' }
      })
      .populate({
        path: 'doctor',
        populate: { path: 'user', select: 'firstName lastName email specialization' }
      });

    res.status(201).json({
      success: true,
      message: 'Medical record created successfully.',
      data: populatedRecord,
    });

  } catch (error) {
    console.error('Error creating medical record:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: `Validation Error: ${error.message}` });
    }
    next(error);
  }
};

// @desc    Get all medical records for a specific patient
// @route   GET /api/medical-records/patient/:patientId
// @access  Private (Admin, Nurse, Patient-self, or Doctor associated with patient - simplified for now)
const getMedicalRecordsForPatient = async (req, res, next) => {
  try {
    const patientIdFromParams = req.params.patientId;
    const loggedInUser = req.user;

    // 1. Check if Patient exists
    const patient = await Patient.findById(patientIdFromParams);
    if (!patient) {
      return res.status(404).json({ message: `Patient not found with ID ${patientIdFromParams}.` });
    }

    // 2. Authorization
    let isAuthorized = false;
    if (['admin', 'nurse'].includes(loggedInUser.role)) {
      isAuthorized = true;
    } else if (loggedInUser.role === 'patient') {
      const selfPatientProfile = await Patient.findOne({ user: loggedInUser._id });
      if (selfPatientProfile && selfPatientProfile._id.toString() === patientIdFromParams) {
        isAuthorized = true;
      }
    } else if (loggedInUser.role === 'doctor') {
      // For now, allow any doctor to see any patient's records if they pass route-level authorization.
      // More complex logic could be: check if this doctor created any record for this patient,
      // or if this patient is in the doctor's `patients` list in the Doctor model.
      // For simplicity of this step, we assume route-level authorization is sufficient for doctors.
      isAuthorized = true; // Assuming if a doctor role reaches here, they are authorized by route
    }

    if (!isAuthorized) {
      return res.status(403).json({ message: 'Forbidden: You are not authorized to view these medical records.' });
    }

    // 3. Fetch Records
    const records = await MedicalRecord.find({ patient: patientIdFromParams })
      .populate({
        path: 'doctor',
        populate: { path: 'user', select: 'firstName lastName email specialization' }
      })
      .sort({ date: -1 }); // Sort by date, newest first

    res.status(200).json({
      success: true,
      count: records.length,
      data: records,
    });

  } catch (error) {
    console.error(`Error fetching medical records for patient ${req.params.patientId}:`, error);
    if (error.name === 'CastError' && error.path === '_id') { // Check if CastError is for patientId
      return res.status(400).json({ success: false, message: 'Invalid patient ID format.' });
    }
    next(error);
  }
};

// @desc    Get a single medical record by its ID
// @route   GET /api/medical-records/:recordId
// @access  Private (Admin, Nurse, Patient-self, Doctor who created or is associated)
const getMedicalRecordById = async (req, res, next) => {
  try {
    const recordId = req.params.recordId;
    const loggedInUser = req.user;

    const record = await MedicalRecord.findById(recordId)
      .populate({
        path: 'patient',
        populate: { path: 'user', select: 'firstName lastName email' }
      })
      .populate({
        path: 'doctor',
        populate: { path: 'user', select: 'firstName lastName email specialization' }
      });

    if (!record) {
      return res.status(404).json({ success: false, message: 'Medical record not found.' });
    }

    // Authorization Check
    let isAuthorized = false;
    if (['admin', 'nurse'].includes(loggedInUser.role)) {
      isAuthorized = true;
    } else if (loggedInUser.role === 'patient') {
      const selfPatientProfile = await Patient.findOne({ user: loggedInUser._id });
      if (selfPatientProfile && record.patient && record.patient._id.toString() === selfPatientProfile._id.toString()) {
        isAuthorized = true;
      }
    } else if (loggedInUser.role === 'doctor') {
      const selfDoctorProfile = await Doctor.findOne({ user: loggedInUser._id });
      // Check if the logged-in doctor is the one who created the record or is associated (e.g. primary doctor for patient)
      // For now, only the authoring doctor or an admin/nurse can see it.
      // More complex "associated doctor" logic can be added if needed.
      if (selfDoctorProfile && record.doctor && record.doctor._id.toString() === selfDoctorProfile._id.toString()) {
        isAuthorized = true;
      }
      // Add logic here if other doctors can view this record based on patient association
    }

    if (!isAuthorized) {
      return res.status(403).json({ message: 'Forbidden: You are not authorized to view this medical record.' });
    }

    res.status(200).json({
      success: true,
      data: record,
    });

  } catch (error) {
    console.error(`Error fetching medical record by ID ${req.params.recordId}:`, error);
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid medical record ID format.' });
    }
    next(error);
  }
};

// @desc    Update a medical record
// @route   PUT /api/medical-records/:recordId
// @access  Private (Admin, or Doctor who created the record)
const updateMedicalRecord = async (req, res, next) => {
  try {
    const recordId = req.params.recordId;
    const loggedInUser = req.user;
    const { diagnosis, prescription, notes, attachments } = req.body;

    // 1. Find Record
    const record = await MedicalRecord.findById(recordId);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Medical record not found.' });
    }

    // 2. Authorization Check
    let isAuthorized = false;
    if (loggedInUser.role === 'admin') {
      isAuthorized = true;
    } else if (loggedInUser.role === 'doctor') {
      const selfDoctorProfile = await Doctor.findOne({ user: loggedInUser._id });
      if (selfDoctorProfile && record.doctor.toString() === selfDoctorProfile._id.toString()) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return res.status(403).json({ message: 'Forbidden: You are not authorized to update this medical record.' });
    }
    
    // Prevent patient or doctor ID from being changed via this update route
    if (req.body.patient || req.body.doctor) {
        return res.status(400).json({ message: 'Patient or Doctor cannot be changed on an existing medical record via this route.' });
    }


    // 3. Update Fields
    if (diagnosis !== undefined) record.diagnosis = diagnosis.trim();
    if (prescription !== undefined) record.prescription = prescription; // Assuming full array replacement
    if (notes !== undefined) record.notes = notes.trim();
    if (attachments !== undefined) record.attachments = attachments; // Assuming full array replacement

    // Date of record creation (record.date) generally should not be updated post-creation,
    // unless specifically allowed by business logic (e.g., for correction by admin).
    // For now, we don't allow `record.date` update here.

    const updatedRecord = await record.save();

    // 4. Send Response
    const populatedRecord = await MedicalRecord.findById(updatedRecord._id)
      .populate({
        path: 'patient',
        populate: { path: 'user', select: 'firstName lastName email' }
      })
      .populate({
        path: 'doctor',
        populate: { path: 'user', select: 'firstName lastName email specialization' }
      });

    res.status(200).json({
      success: true,
      message: 'Medical record updated successfully.',
      data: populatedRecord,
    });

  } catch (error) {
    console.error(`Error updating medical record ${req.params.recordId}:`, error);
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid medical record ID format.' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: `Validation Error: ${error.message}` });
    }
    next(error);
  }
};

// @desc    Delete a medical record
// @route   DELETE /api/medical-records/:recordId
// @access  Private (Admin only)
const deleteMedicalRecord = async (req, res, next) => {
  try {
    const recordId = req.params.recordId;

    // 1. Find Record
    const record = await MedicalRecord.findById(recordId);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Medical record not found.' });
    }

    // 2. Authorization Check (already handled by route-level 'admin' authorization, but good for explicitness)
    // if (req.user.role !== 'admin') {
    //   return res.status(403).json({ message: 'Forbidden: Only administrators can delete medical records.' });
    // }

    // 3. Delete Record
    await record.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Medical record deleted successfully.',
      // data: {} // Or use 204 No Content
    });
    // Alternatively: res.status(204).send();

  } catch (error) {
    console.error(`Error deleting medical record ${req.params.recordId}:`, error);
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid medical record ID format.' });
    }
    next(error);
  }
};


module.exports = {
  createMedicalRecord,
  getMedicalRecordsForPatient,
  getMedicalRecordById,
  updateMedicalRecord,
  deleteMedicalRecord,
};
