const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const connectDB = require('./src/config/database');

// Import routes
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes'); // Add this
const studentRoutes = require('./src/routes/studentRoutes');
const verifierRoutes = require('./src/routes/verifierRoutes');
const classRoutes = require('./src/routes/classRoutes');
const examRoutes = require('./src/routes/examRoutes');
const stakeRoutes = require('./src/routes/stakeRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes); // Add this
app.use('/api/student', studentRoutes);
app.use('/api/verifier', verifierRoutes);
app.use('/api/class', classRoutes);
app.use('/api/exam', examRoutes);
app.use('/api/stake', stakeRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ message: 'StakED Backend is running!' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});