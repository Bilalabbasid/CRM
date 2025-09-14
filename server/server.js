const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const compression = require('compression');
require('dotenv').config();

// Provide safe development defaults when env vars are missing
if (!process.env.JWT_SECRET) {
  console.warn('⚠️  JWT_SECRET is not set. Using development default (not for production).');
  process.env.JWT_SECRET = 'dev_jwt_secret';
}
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const customerRoutes = require('./routes/customers');
const reservationRoutes = require('./routes/reservations');
const orderRoutes = require('./routes/orders');
const menuRoutes = require('./routes/menu');
const reportRoutes = require('./routes/reports');
const staffRoutes = require('./routes/staff');
const inventoryRoutes = require('./routes/inventory');

const app = express();

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

// In development disable the rate limiter to avoid blocking local health checks and frequent dev requests
if (process.env.NODE_ENV && process.env.NODE_ENV.toLowerCase() === 'development') {
  console.log('⚠️ Rate limiter disabled in development mode');
} else {
  app.use('/api/', limiter);
}

// CORS configuration - allow configured FRONTEND_URL and localhost with any port during development
const configuredFrontend = process.env.FRONTEND_URL;
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // allow server-to-server or same-origin requests

    // Allow explicit configured frontend
    if (configuredFrontend && origin === configuredFrontend) return callback(null, true);

    // Allow any localhost origin (http(s)://localhost(:port)?) during development
    const localhostRegex = /^https?:\/\/localhost(:\d+)?$/;
    if (localhostRegex.test(origin)) return callback(null, true);

    return callback(new Error('CORS policy: This origin is not allowed'), false);
  },
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/restaurant_crm', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected successfully'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/inventory', inventoryRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 API URL: http://localhost:${PORT}/api`);
});

module.exports = app;