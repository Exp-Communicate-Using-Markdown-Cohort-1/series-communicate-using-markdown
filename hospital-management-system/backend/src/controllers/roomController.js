const Room = require('../models/Room');
const Patient = require('../models/Patient'); // Needed for populating patient details in bed
const User = require('../models/User'); // For req.user

// @desc    Create a new room
// @route   POST /api/rooms
// @access  Private (Admin only)
const createRoom = async (req, res, next) => {
  try {
    const { roomNumber, roomType, department, capacity, features } = req.body;

    // 1. Input Validation
    if (!roomNumber || !roomType || typeof capacity !== 'number' || capacity <= 0) {
      return res.status(400).json({ message: 'Bad Request: roomNumber, roomType, and a valid positive capacity are required.' });
    }

    // 2. Check for existing roomNumber
    const existingRoom = await Room.findOne({ roomNumber });
    if (existingRoom) {
      return res.status(400).json({ message: `Room with number ${roomNumber} already exists.` });
    }

    // 3. Initialize beds array
    const beds = [];
    for (let i = 1; i <= capacity; i++) {
      beds.push({
        bedIdentifier: i.toString(),
        isOccupied: false,
        patient: null,
        admissionDate: null,
        dischargeDateExpected: null,
        notes: '',
      });
    }

    // 4. Create New Room
    const newRoom = new Room({
      roomNumber,
      roomType,
      department: department || '',
      capacity,
      beds,
      currentOccupancy: 0, // Initially empty
      status: 'Available', // Default status
      features: features || [],
    });

    await newRoom.save();

    // 5. Send Response
    res.status(201).json({
      success: true,
      message: 'Room created successfully.',
      data: newRoom,
    });

  } catch (error) {
    console.error('Error creating room:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: `Validation Error: ${error.message}` });
    }
    if (error.code === 11000) { // Duplicate key for roomNumber
        return res.status(400).json({ message: `Room number ${roomNumber} already exists (duplicate key).` });
    }
    next(error);
  }
};

// @desc    Get all rooms
// @route   GET /api/rooms
// @access  Private (Admin, Nurse, Doctor)
const getAllRooms = async (req, res, next) => {
  try {
    const { roomType, department, status } = req.query;
    const query = {};

    if (roomType) query.roomType = roomType;
    if (department) query.department = department;
    if (status) query.status = status;

    const rooms = await Room.find(query)
      .populate({
        path: 'beds.patient',
        select: 'user medicalRecordNumber', // Select fields from Patient
        populate: {
          path: 'user',
          select: 'firstName lastName email' // Select fields from User
        }
      })
      .sort({ roomNumber: 1 }); // Sort by room number

    res.status(200).json({
      success: true,
      count: rooms.length,
      data: rooms,
    });
  } catch (error) {
    console.error('Error fetching all rooms:', error);
    next(error);
  }
};

// @desc    Get single room by ID
// @route   GET /api/rooms/:id
// @access  Private (Admin, Nurse, Doctor)
const getRoomById = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id)
      .populate({
        path: 'beds.patient',
        select: 'user medicalRecordNumber',
        populate: {
          path: 'user',
          select: 'firstName lastName email'
        }
      });

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found.' });
    }

    res.status(200).json({
      success: true,
      data: room,
    });
  } catch (error) {
    console.error(`Error fetching room by ID ${req.params.id}:`, error);
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid room ID format.' });
    }
    next(error);
  }
};

// @desc    Update room details (roomType, department, features, status)
// @route   PUT /api/rooms/:id
// @access  Private (Admin only)
const updateRoomDetails = async (req, res, next) => {
  try {
    const { roomType, department, features, status } = req.body;

    // Find room by ID
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found.' });
    }

    // Capacity is not updated here as per subtask instructions
    if (req.body.capacity && req.body.capacity !== room.capacity) {
        return res.status(400).json({ success: false, message: 'Room capacity cannot be changed via this route. Please create a new room if capacity needs adjustment.'});
    }
     if (req.body.beds || req.body.currentOccupancy) {
        return res.status(400).json({ success: false, message: 'Beds and current occupancy are managed via assign/discharge routes.'});
    }


    // Update fields if provided
    if (roomType) room.roomType = roomType;
    if (department) room.department = department;
    if (features) room.features = features;
    if (status) {
        // Validate status against enum
        const allowedStatuses = Room.schema.path('status').enumValues;
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ message: `Invalid status. Must be one of: ${allowedStatuses.join(', ')}` });
        }
        // Additional logic: if changing status to 'Available', ensure occupancy allows it.
        if (status === 'Available' && room.currentOccupancy >= room.capacity) {
            return res.status(400).json({ message: "Cannot set status to 'Available' when room is at full capacity." });
        }
        // If changing status to 'Full', ensure occupancy matches capacity
        if (status === 'Full' && room.currentOccupancy < room.capacity) {
            // This might be an admin override, or an indication of data inconsistency.
            // For now, allow admin to set it, but this implies beds might not be correctly marked.
            console.warn(`Warning: Room ${room.roomNumber} set to 'Full' but occupancy (${room.currentOccupancy}) is less than capacity (${room.capacity}).`);
        }
        room.status = status;
    }

    const updatedRoom = await room.save();

    res.status(200).json({
      success: true,
      message: 'Room details updated successfully.',
      data: updatedRoom,
    });

  } catch (error) {
    console.error(`Error updating room details for ${req.params.id}:`, error);
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid room ID format.' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: `Validation Error: ${error.message}` });
    }
    next(error);
  }
};

// @desc    Assign a patient to a specific bed in a room
// @route   POST /api/rooms/:roomId/beds/:bedIdentifier/assign
// @access  Private (Admin, Nurse)
const assignPatientToBed = async (req, res, next) => {
  try {
    const { roomId, bedIdentifier } = req.params;
    const { patientId, admissionDate, dischargeDateExpected, notes } = req.body;

    // 1. Input Validation
    if (!patientId) {
      return res.status(400).json({ message: 'Bad Request: patientId is required.' });
    }

    // 2. Find Room and Patient
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found.' });
    }
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ success: false, message: `Patient not found with ID ${patientId}.` });
    }

    // 3. Find and Update Bed
    const bed = room.beds.find(b => b.bedIdentifier === bedIdentifier);
    if (!bed) {
      return res.status(404).json({ success: false, message: `Bed ${bedIdentifier} not found in room ${room.roomNumber}.` });
    }
    if (bed.isOccupied) {
      return res.status(400).json({ success: false, message: `Bed ${bedIdentifier} in room ${room.roomNumber} is already occupied.` });
    }

    bed.isOccupied = true;
    bed.patient = patientId;
    bed.admissionDate = admissionDate || Date.now();
    bed.dischargeDateExpected = dischargeDateExpected || null;
    bed.notes = notes || '';

    // 4. Update Room Occupancy and Status
    room.currentOccupancy = room.beds.filter(b => b.isOccupied).length;
    if (room.currentOccupancy >= room.capacity) {
      room.status = 'Full';
    } else {
      room.status = 'Available'; // Ensure it's available if not full
    }

    await room.save();

    // 5. Send Response
    const populatedRoom = await Room.findById(room._id)
        .populate({
            path: 'beds.patient',
            select: 'user medicalRecordNumber',
            populate: { path: 'user', select: 'firstName lastName email' }
        });

    res.status(200).json({
      success: true,
      message: `Patient ${patientId} assigned to bed ${bedIdentifier} in room ${room.roomNumber}.`,
      data: populatedRoom,
    });

  } catch (error) {
    console.error(`Error assigning patient to bed for room ${req.params.roomId}:`, error);
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid room or patient ID format.' });
    }
    next(error);
  }
};

// @desc    Discharge a patient from a specific bed in a room
// @route   POST /api/rooms/:roomId/beds/:bedIdentifier/discharge
// @access  Private (Admin, Nurse)
const dischargePatientFromBed = async (req, res, next) => {
  try {
    const { roomId, bedIdentifier } = req.params;
    // Optional: body could contain discharge notes or actual discharge date if different from now
    // const { dischargeNotes, actualDischargeDate } = req.body;

    // 1. Find Room
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found.' });
    }

    // 2. Find and Update Bed
    const bed = room.beds.find(b => b.bedIdentifier === bedIdentifier);
    if (!bed) {
      return res.status(404).json({ success: false, message: `Bed ${bedIdentifier} not found in room ${room.roomNumber}.` });
    }
    if (!bed.isOccupied) {
      return res.status(400).json({ success: false, message: `Bed ${bedIdentifier} in room ${room.roomNumber} is already vacant.` });
    }

    const dischargedPatientId = bed.patient; // Keep for logging or event creation if needed

    bed.isOccupied = false;
    bed.patient = null;
    bed.admissionDate = null;
    bed.dischargeDateExpected = null;
    // bed.notes = dischargeNotes || bed.notes; // Update notes if provided

    // 3. Update Room Occupancy and Status
    room.currentOccupancy = room.beds.filter(b => b.isOccupied).length;
    if (room.status === 'Full' && room.currentOccupancy < room.capacity) {
      room.status = 'Available';
    }
    // If room was 'Maintenance' or 'Unavailable', discharging a patient doesn't automatically make it 'Available'.
    // Admin should explicitly change status for those cases.

    await room.save();

    // 4. Send Response
     const populatedRoom = await Room.findById(room._id)
        .populate({
            path: 'beds.patient', // This will be null for the discharged bed
            select: 'user medicalRecordNumber',
            populate: { path: 'user', select: 'firstName lastName email' }
        });

    res.status(200).json({
      success: true,
      message: `Patient discharged from bed ${bedIdentifier} in room ${room.roomNumber}. Patient ID was ${dischargedPatientId}.`,
      data: populatedRoom,
    });

  } catch (error) {
    console.error(`Error discharging patient from bed for room ${req.params.roomId}:`, error);
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid room ID format.' });
    }
    next(error);
  }
};

// @desc    Delete a room
// @route   DELETE /api/rooms/:id
// @access  Private (Admin only)
const deleteRoom = async (req, res, next) => {
  try {
    const roomId = req.params.id;

    // 1. Find Room
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found.' });
    }

    // 2. Authorization Check (already handled by route-level 'admin' authorization)

    // 3. Check if all beds are vacant
    if (room.currentOccupancy > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete room ${room.roomNumber} as it is currently occupied. Please discharge all patients first.`,
      });
    }
    // An alternative stricter check:
    // const isAnyBedOccupied = room.beds.some(bed => bed.isOccupied);
    // if (isAnyBedOccupied) {
    //   return res.status(400).json({
    //     success: false,
    //     message: `Cannot delete room ${room.roomNumber}. One or more beds are still marked as occupied.`,
    //   });
    // }


    // 4. Delete Room
    await room.deleteOne();

    res.status(200).json({
      success: true,
      message: `Room ${room.roomNumber} deleted successfully.`,
      // data: {} // Or use 204 No Content
    });
    // Alternatively: res.status(204).send();

  } catch (error) {
    console.error(`Error deleting room ${req.params.id}:`, error);
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid room ID format.' });
    }
    next(error);
  }
};

module.exports = {
  createRoom,
  getAllRooms,
  getRoomById,
  updateRoomDetails,
  assignPatientToBed,
  dischargePatientFromBed,
  deleteRoom,
};
