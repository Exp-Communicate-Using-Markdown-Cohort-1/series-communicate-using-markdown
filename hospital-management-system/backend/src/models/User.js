const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // Corrected: Changed from bcryptjs to bcrypt to match common usage, ensure 'bcryptjs' is used if that's what was installed. Using bcryptjs as per instructions.
const Schema = mongoose.Schema;

const userSchema = new Schema({
  firstName: {
    type: String,
    required: true,
    trim: true,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
  },
  role: {
    type: String,
    required: true,
    enum: ["admin", "doctor", "nurse", "patient", "accountant"],
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/.+\@.+\..+/, 'Please fill a valid email address'],
  },
  password: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
});

// Pre-save hook for password hashing
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) {
    return next();
  }
  try {
    // Generate a salt
    const salt = await bcrypt.genSalt(10);
    // Hash the password with the salt
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error); // Pass errors to the next middleware
  }
});

// Method to compare candidate password with the hashed password
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error; // Or handle error as appropriate
  }
};

const User = mongoose.model('User', userSchema);

module.exports = User;
