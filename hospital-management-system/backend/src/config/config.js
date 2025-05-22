// This file will hold configuration variables,
// ideally loaded from environment variables.

// For now, we'll use placeholders.
// In a production environment, these should be set via a .env file or system environment variables.
// require('dotenv').config(); // Would be used if .env file is the primary source

const config = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 5000,
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/hospital_management_dev',
  JWT_SECRET: process.env.JWT_SECRET || 'YOUR_VERY_SECRET_KEY_HERE_REPLACE_IT',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
};

module.exports = config;
