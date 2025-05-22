const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const config = require('./config/config');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const patientRoutes = require('./routes/patientRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const medicalRecordRoutes = require('./routes/medicalRecordRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const roomRoutes = require('./routes/roomRoutes'); // Import room routes

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = config.PORT || 5000;

// Middleware to parse JSON
app.use(express.json());

// Basic route
app.get('/', (req, res) => {
  res.send('Hospital Management System Backend API is running.');
});

// Mount Authentication Routes
app.use('/api/auth', authRoutes);

// Mount User CRUD Routes
app.use('/api/users', userRoutes);

// Mount Patient CRUD Routes
app.use('/api/patients', patientRoutes);

// Mount Doctor CRUD Routes
app.use('/api/doctors', doctorRoutes);

// Mount Appointment CRUD Routes
app.use('/api/appointments', appointmentRoutes);

// Mount Medical Record CRUD Routes
app.use('/api/medical-records', medicalRecordRoutes);

// Mount Invoice CRUD Routes
app.use('/api/invoices', invoiceRoutes);

// Mount Notification Routes
app.use('/api/notifications', notificationRoutes);

// Mount Room Routes
app.use('/api/rooms', roomRoutes); // Added room routes

// Database Connection
mongoose.connect(config.MONGO_URI, {
  // useNewUrlParser: true, // No longer needed
  // useUnifiedTopology: true, // No longer needed
})
.then(() => console.log('MongoDB Connected Successfully.'))
.catch(err => {
  console.error('MongoDB Connection Error:', err.message);
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Global Error Handler:", err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'An unexpected error occurred.',
    stack: config.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT} in ${config.NODE_ENV} mode.`);
});
