const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const User = require('../models/User'); // To get user._id for self-scheduling checks

// @desc    Create a new appointment
// @route   POST /api/appointments
// @access  Private (Patient-self, Doctor, Nurse, Admin)
const createAppointment = async (req, res, next) => {
  try {
    const { patientId, doctorId, appointmentDate, startTime, endTime, reason } = req.body;
    const requestingUser = req.user; // User performing the action

    // 1. Input Validation
    if (!patientId || !doctorId || !appointmentDate || !startTime || !endTime) {
      return res.status(400).json({ message: 'Bad Request: patientId, doctorId, appointmentDate, startTime, and endTime are required.' });
    }

    // Validate date and time formats/logic (e.g., endTime > startTime)
    // For simplicity, basic checks here. More robust validation can be added.
    if (new Date(appointmentDate) < new Date().setHours(0,0,0,0) && !['admin', 'nurse'].includes(requestingUser.role)) { // Allow backdating for admin/nurse
        return res.status(400).json({ message: 'Appointment date cannot be in the past for patients/doctors.' });
    }
    if (startTime >= endTime) {
        return res.status(400).json({ message: 'End time must be after start time.' });
    }


    // 2. Check if Patient and Doctor exist
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: `Patient not found with ID ${patientId}.` });
    }
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: `Doctor not found with ID ${doctorId}.` });
    }

    // 3. Authorization for creating appointment
    // If a patient is making the request, they can only book for themselves.
    if (requestingUser.role === 'patient') {
      // Find the patient profile linked to the logged-in user
      const selfPatientProfile = await Patient.findOne({ user: requestingUser._id });
      if (!selfPatientProfile || selfPatientProfile._id.toString() !== patientId) {
        return res.status(403).json({ message: 'Forbidden: Patients can only create appointments for themselves.' });
      }
    }
    // Doctors, Nurses, Admins can create for any patient.

    // 4. Determine initial status based on role
    let initialStatus = 'Pending Approval'; // Default for patient self-booking
    if (['admin', 'doctor', 'nurse'].includes(requestingUser.role)) {
      initialStatus = 'Scheduled';
    }

    // TODO: (Future enhancement) Check doctor's availability and prevent double booking.
    // This would involve querying existing appointments for the doctor at the given date/time
    // and checking against their `availability` schedule in the Doctor model.

    // 5. Create New Appointment
    const newAppointment = new Appointment({
      patient: patientId,
      doctor: doctorId,
      appointmentDate,
      startTime,
      endTime,
      reason: reason || '', // Default to empty string if no reason
      status: initialStatus,
      // Notes can be added later via an update if needed
    });

    await newAppointment.save();

    // 6. Send Response (populate details)
    const populatedAppointment = await Appointment.findById(newAppointment._id)
      .populate('patient', 'user medicalRecordNumber') // Populate patient, then user within patient
      .populate({
        path: 'patient',
        populate: { path: 'user', select: 'firstName lastName email phoneNumber' }
      })
      .populate({
        path: 'doctor',
        populate: { path: 'user', select: 'firstName lastName email phoneNumber specialization' }
      });


    res.status(201).json({
      success: true,
      message: `Appointment ${initialStatus} successfully.`,
      data: populatedAppointment,
    });

  } catch (error) {
    console.error('Error creating appointment:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: `Validation Error: ${error.message}` });
    }
    next(error);
  }
};

// @desc    Get all appointments
// @route   GET /api/appointments
// @access  Private (Admin, Nurse)
const getAllAppointments = async (req, res, next) => {
  try {
    // Basic filtering examples (can be expanded)
    const { doctorId, patientId, status, date } = req.query;
    const query = {};

    if (doctorId) query.doctor = doctorId;
    if (patientId) query.patient = patientId;
    if (status) query.status = status;
    if (date) { // Assuming date is in YYYY-MM-DD format
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(startDate.getDate() + 1);
      query.appointmentDate = { $gte: startDate, $lt: endDate };
    }

    const appointments = await Appointment.find(query)
      .populate({
        path: 'patient',
        populate: { path: 'user', select: 'firstName lastName email' }
      })
      .populate({
        path: 'doctor',
        populate: { path: 'user', select: 'firstName lastName email specialization' }
      })
      .sort({ appointmentDate: -1, startTime: -1 }); // Sort by date and time

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments,
    });
  } catch (error) {
    console.error('Error fetching all appointments:', error);
    next(error);
  }
};

// @desc    Get appointments for the logged-in user (patient or doctor)
// @route   GET /api/appointments/mine
// @access  Private (Patient-self, Doctor-self)
const getAppointmentsForUser = async (req, res, next) => {
  try {
    const loggedInUserId = req.user._id;
    const userRole = req.user.role;
    let query = {};

    if (userRole === 'patient') {
      // Find the patient profile linked to the logged-in user
      const patientProfile = await Patient.findOne({ user: loggedInUserId });
      if (!patientProfile) {
        return res.status(404).json({ success: false, message: 'Patient profile not found for logged-in user.' });
      }
      query.patient = patientProfile._id;
    } else if (userRole === 'doctor') {
      // Find the doctor profile linked to the logged-in user
      const doctorProfile = await Doctor.findOne({ user: loggedInUserId });
      if (!doctorProfile) {
        return res.status(404).json({ success: false, message: 'Doctor profile not found for logged-in user.' });
      }
      query.doctor = doctorProfile._id;
    } else {
      // This route should ideally be protected by roles 'patient' or 'doctor' only.
      // If other roles access it, they get an empty list unless an admin override is added.
      return res.status(403).json({ success: false, message: 'Forbidden: This route is for patients and doctors to view their own appointments.' });
    }

    const appointments = await Appointment.find(query)
      .populate({
        path: 'patient',
        populate: { path: 'user', select: 'firstName lastName email' }
      })
      .populate({
        path: 'doctor',
        populate: { path: 'user', select: 'firstName lastName email specialization' }
      })
      .sort({ appointmentDate: -1, startTime: -1 });

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments,
    });

  } catch (error) {
    console.error('Error fetching appointments for user:', error);
    next(error);
  }
};

// @desc    Get a single appointment by its ID
// @route   GET /api/appointments/:id
// @access  Private (Admin, Nurse, or Patient/Doctor involved in the appointment)
const getAppointmentById = async (req, res, next) => {
  try {
    const appointmentId = req.params.id;
    const loggedInUser = req.user;

    const appointment = await Appointment.findById(appointmentId)
      .populate({
        path: 'patient',
        populate: { path: 'user', select: 'firstName lastName email' }
      })
      .populate({
        path: 'doctor',
        populate: { path: 'user', select: 'firstName lastName email specialization' }
      });

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }

    // Authorization Check:
    let isAuthorized = false;
    if (['admin', 'nurse'].includes(loggedInUser.role)) {
      isAuthorized = true;
    } else if (loggedInUser.role === 'patient') {
      // Check if the logged-in user is the patient in the appointment
      if (appointment.patient && appointment.patient.user && appointment.patient.user._id.toString() === loggedInUser._id.toString()) {
        isAuthorized = true;
      }
    } else if (loggedInUser.role === 'doctor') {
      // Check if the logged-in user is the doctor in the appointment
      if (appointment.doctor && appointment.doctor.user && appointment.doctor.user._id.toString() === loggedInUser._id.toString()) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return res.status(403).json({ success: false, message: 'Forbidden: You are not authorized to view this appointment.' });
    }

    res.status(200).json({
      success: true,
      data: appointment,
    });

  } catch (error) {
    console.error(`Error fetching appointment by ID ${req.params.id}:`, error);
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid appointment ID format.' });
    }
    next(error);
  }
};

// @desc    Update the status of an appointment
// @route   PATCH /api/appointments/:id/status
// @access  Private (Admin, Nurse, Doctor involved, Patient involved for cancellation)
const updateAppointmentStatus = async (req, res, next) => {
  try {
    const appointmentId = req.params.id;
    const { status } = req.body;
    const loggedInUser = req.user;

    // 1. Input Validation
    if (!status) {
      return res.status(400).json({ message: 'Bad Request: New status is required.' });
    }
    // Validate if the status is one of the allowed enum values
    const allowedStatuses = Appointment.schema.path('status').enumValues;
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Must be one of: ${allowedStatuses.join(', ')}` });
    }

    // 2. Find Appointment
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }

    // 3. Authorization Check
    let isAuthorized = false;
    const currentStatus = appointment.status;

    if (['admin', 'nurse'].includes(loggedInUser.role)) {
      isAuthorized = true; // Admins/Nurses can change to any valid status
    } else if (loggedInUser.role === 'doctor') {
      // Doctors can update status for their appointments (e.g., to 'Completed', 'Scheduled')
      if (appointment.doctor.toString() === (await Doctor.findOne({ user: loggedInUser._id }))?._id.toString()) {
        if (status === 'Completed' && currentStatus === 'Scheduled') isAuthorized = true;
        if (status === 'Scheduled' && currentStatus === 'Pending Approval') isAuthorized = true;
        // Add other doctor-allowed transitions as needed
      }
    } else if (loggedInUser.role === 'patient') {
      // Patients can cancel their 'Pending Approval' or 'Scheduled' appointments
      if (appointment.patient.toString() === (await Patient.findOne({ user: loggedInUser._id }))?._id.toString()) {
        if (status === 'Cancelled' && (currentStatus === 'Pending Approval' || currentStatus === 'Scheduled')) {
          isAuthorized = true;
        }
      }
    }

    if (!isAuthorized) {
      return res.status(403).json({ success: false, message: 'Forbidden: You are not authorized to update this appointment to the specified status or for this appointment.' });
    }

    // 4. Update Status
    appointment.status = status;
    await appointment.save();

    // 5. Send Response
    const populatedAppointment = await Appointment.findById(appointment._id)
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
      message: `Appointment status updated to ${status}.`,
      data: populatedAppointment,
    });

  } catch (error) {
    console.error(`Error updating appointment status for ${req.params.id}:`, error);
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid appointment ID format.' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: `Validation Error: ${error.message}` });
    }
    next(error);
  }
};

// @desc    Update details of an appointment (date, time, reason, notes)
// @route   PUT /api/appointments/:id
// @access  Private (Admin, Nurse, Doctor involved, Patient involved if status allows)
const updateAppointmentDetails = async (req, res, next) => {
  try {
    const appointmentId = req.params.id;
    const { appointmentDate, startTime, endTime, reason, notes } = req.body;
    const loggedInUser = req.user;

    // 1. Find Appointment
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }

    // 2. Authorization Check & Business Logic for Updates
    let isAuthorized = false;
    const currentStatus = appointment.status;

    if (['admin', 'nurse'].includes(loggedInUser.role)) {
      isAuthorized = true;
    } else if (loggedInUser.role === 'doctor') {
      const doctorProfile = await Doctor.findOne({ user: loggedInUser._id });
      if (doctorProfile && appointment.doctor.toString() === doctorProfile._id.toString()) {
        if (currentStatus === 'Scheduled' || currentStatus === 'Pending Approval') {
          isAuthorized = true;
        } else {
          return res.status(403).json({ success: false, message: `Forbidden: Doctors cannot update details for appointments with status '${currentStatus}'.` });
        }
      }
    } else if (loggedInUser.role === 'patient') {
      const patientProfile = await Patient.findOne({ user: loggedInUser._id });
      if (patientProfile && appointment.patient.toString() === patientProfile._id.toString()) {
        if (currentStatus === 'Pending Approval' || currentStatus === 'Scheduled') {
          isAuthorized = true;
        } else {
          return res.status(403).json({ success: false, message: `Forbidden: Patients cannot update details for appointments with status '${currentStatus}'.` });
        }
      }
    }

    if (!isAuthorized) {
      return res.status(403).json({ success: false, message: 'Forbidden: You are not authorized to update details for this appointment.' });
    }

    // 3. Update Fields
    if (appointmentDate) {
        // Allow admin/nurse to backdate, others cannot set date in past
        if (new Date(appointmentDate) < new Date().setHours(0,0,0,0) && !['admin', 'nurse'].includes(loggedInUser.role) ) {
             return res.status(400).json({ message: 'Appointment date cannot be in the past.' });
        }
        appointment.appointmentDate = appointmentDate;
    }

    // Validate and update startTime and endTime
    // Ensure startTime < endTime if both are provided or one is updated
    let finalStartTime = appointment.startTime;
    let finalEndTime = appointment.endTime;

    if (startTime) finalStartTime = startTime;
    if (endTime) finalEndTime = endTime;

    if (finalStartTime >= finalEndTime) {
        return res.status(400).json({ message: 'End time must be after start time.' });
    }
    if (startTime) appointment.startTime = startTime;
    if (endTime) appointment.endTime = endTime;
    
    if (reason !== undefined) appointment.reason = reason.trim();
    if (notes !== undefined) appointment.notes = notes.trim();

    // Business rule: If a patient or doctor modifies date/time for a 'Scheduled' appointment,
    // it might revert to 'Pending Approval' for admin/nurse to re-confirm.
    // This is an example, adjust based on actual workflow.
    if ((loggedInUser.role === 'patient' || loggedInUser.role === 'doctor') &&
        (appointmentDate || startTime || endTime) &&
        currentStatus === 'Scheduled') {
      // appointment.status = 'Pending Approval'; // Example: uncomment if this is desired
    }

    await appointment.save();

    // 4. Send Response
    const populatedAppointment = await Appointment.findById(appointment._id)
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
      message: 'Appointment details updated successfully.',
      data: populatedAppointment,
    });

  } catch (error) {
    console.error(`Error updating appointment details for ${req.params.id}:`, error);
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid appointment ID format.' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: `Validation Error: ${error.message}` });
    }
    next(error);
  }
};

// @desc    Delete an appointment or allow patient/doctor to cancel
// @route   DELETE /api/appointments/:id
// @access  Private (Admin for hard delete; Patient/Doctor for cancellation via status update)
const deleteAppointment = async (req, res, next) => {
  try {
    const appointmentId = req.params.id;
    const loggedInUser = req.user;

    // 1. Find Appointment
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }

    // 2. Authorization Check
    // Admin can hard delete any appointment.
    // Patients/Doctors can "cancel" their appointments if the status allows.
    // "Cancellation" here means setting the status to 'Cancelled'.

    if (loggedInUser.role === 'admin') {
      await appointment.deleteOne();
      return res.status(200).json({
        success: true,
        message: 'Appointment (hard) deleted by admin successfully.',
      });
      // Or use 204 No Content: res.status(204).send();
    }

    // For patients and doctors, "delete" means "cancel"
    if (loggedInUser.role === 'patient') {
      const patientProfile = await Patient.findOne({ user: loggedInUser._id });
      if (patientProfile && appointment.patient.toString() === patientProfile._id.toString()) {
        if (appointment.status === 'Pending Approval' || appointment.status === 'Scheduled') {
          appointment.status = 'Cancelled';
          await appointment.save();
          const populatedAppointment = await Appointment.findById(appointment._id)
            .populate({ path: 'patient', populate: { path: 'user', select: 'firstName lastName email' }})
            .populate({ path: 'doctor', populate: { path: 'user', select: 'firstName lastName email specialization' }});
          return res.status(200).json({
            success: true,
            message: 'Appointment cancelled by patient successfully.',
            data: populatedAppointment,
          });
        } else {
          return res.status(403).json({ success: false, message: `Forbidden: Patients can only cancel 'Pending Approval' or 'Scheduled' appointments. Current status: ${appointment.status}` });
        }
      }
    }

    if (loggedInUser.role === 'doctor') {
      const doctorProfile = await Doctor.findOne({ user: loggedInUser._id });
      if (doctorProfile && appointment.doctor.toString() === doctorProfile._id.toString()) {
        if (appointment.status === 'Pending Approval' || appointment.status === 'Scheduled') {
          appointment.status = 'Cancelled';
          await appointment.save();
           const populatedAppointment = await Appointment.findById(appointment._id)
            .populate({ path: 'patient', populate: { path: 'user', select: 'firstName lastName email' }})
            .populate({ path: 'doctor', populate: { path: 'user', select: 'firstName lastName email specialization' }});
          return res.status(200).json({
            success: true,
            message: 'Appointment cancelled by doctor successfully.',
            data: populatedAppointment,
          });
        } else {
          return res.status(403).json({ success: false, message: `Forbidden: Doctors can only cancel 'Pending Approval' or 'Scheduled' appointments. Current status: ${appointment.status}` });
        }
      }
    }
    
    // If not admin and not an authorized patient/doctor for cancellation
    return res.status(403).json({ success: false, message: 'Forbidden: You are not authorized to perform this action on this appointment.' });

  } catch (error) {
    console.error(`Error in deleteAppointment for ${req.params.id}:`, error);
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid appointment ID format.' });
    }
    next(error);
  }
};


module.exports = {
  createAppointment,
  getAllAppointments,
  getAppointmentsForUser,
  getAppointmentById,
  updateAppointmentStatus,
  updateAppointmentDetails,
  deleteAppointment,
};
