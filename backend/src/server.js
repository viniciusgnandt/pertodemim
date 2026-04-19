require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');

const authRoutes = require('./routes/auth');
const establishmentRoutes = require('./routes/establishments');
const productRoutes = require('./routes/products');
const serviceRoutes = require('./routes/services');
const hoursExceptionRoutes = require('./routes/hoursExceptions');
const uploadRoutes = require('./routes/upload');
const reviewRoutes = require('./routes/reviews');
const favoriteRoutes = require('./routes/favorites');
const integrationRoutes = require('./routes/integrations');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(morgan('dev'));

app.use(cors({
  origin: (origin, callback) => {
// Allow requests with no origin (native mobile apps)
    if (!origin) return callback(null, true);

    const allowed = [
      process.env.FRONTEND_URL || 'http://localhost:5173',
      'http://localhost:4173',
      'http://localhost:8081',
      'http://localhost:8082',
    ];

    // Allow any Expo origin (local dev and EAS Update)
    if (
      allowed.includes(origin) ||
      origin.startsWith('exp://') ||
      origin.startsWith('https://u.expo.dev') ||
      origin.startsWith('https://expo.dev')
    ) return callback(null, true);

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/establishments', establishmentRoutes);
app.use('/api/establishments/:id/services', serviceRoutes);
app.use('/api/establishments/:id/hours-exceptions', hoursExceptionRoutes);
app.use('/api/products', productRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/integrations', integrationRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

async function startServer() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pertodemim?replicaSet=rs0', {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB');

    const { seedIfEmpty } = require('./seed');
    await seedIfEmpty();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('❌ Failed to connect to MongoDB:', err.message);
    setTimeout(startServer, 5000);
  }
}

startServer();

module.exports = app;
