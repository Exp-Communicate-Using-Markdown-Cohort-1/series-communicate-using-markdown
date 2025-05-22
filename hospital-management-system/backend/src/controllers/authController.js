const User = require('../models/User');
const { generateToken } = require('../utils/jwtUtils');

/**
 * Registers a new user.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
const registerUser = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, phoneNumber, role } = req.body;

    // 1. Input Validation
    if (!firstName || !lastName || !email || !password || !role) {
      return res.status(400).json({
        message: 'Bad Request: Missing required fields. Please provide firstName, lastName, email, password, and role.',
      });
    }

    // 2. Check for Existing User
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'Bad Request: User already exists with this email.' });
    }

    // 3. Create New User
    const newUser = new User({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password,
      phoneNumber,
      role,
    });
    await newUser.save();

    // 4. Generate Token
    const token = generateToken({ id: newUser._id, role: newUser.role });

    // 5. Send Response
    res.status(201).json({
      message: 'User registered successfully.',
      token,
      user: {
        userId: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        role: newUser.role,
        phoneNumber: newUser.phoneNumber,
      },
    });
  } catch (error) {
    console.error('Error during user registration:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: `Validation Error: ${error.message}` });
    }
    if (error.code === 11000) {
        return res.status(400).json({ message: 'Duplicate key error. An account with similar details might already exist.' });
    }
    next(error);
  }
};


/**
 * Logs in an existing user.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. Input Validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Bad Request: Please provide both email and password.' });
    }

    // 2. Find User
    // Ensure email is compared in lowercase as it's stored
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized: Invalid email or password.' });
    }

    // 3. Compare Password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Unauthorized: Invalid email or password.' });
    }

    // 4. Generate Token
    const token = generateToken({ id: user._id, role: user.role });

    // 5. Send Response
    res.status(200).json({
      message: 'User logged in successfully.',
      token,
      user: {
        userId: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        phoneNumber: user.phoneNumber, // Include if available and desired
      },
    });
  } catch (error) {
    console.error('Error during user login:', error);
    next(error); // Pass to a generic error handler
  }
};

module.exports = {
  registerUser,
  loginUser,
};
