// Load .env only in development — Render injects env vars directly
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}
const express    = require('express');
const cors       = require('cors');
const path       = require('path');
const helmet     = require('helmet');
const rateLimit  = require('express-rate-limit');

// Route imports
const authRoutes         = require('./src/routes/authRoutes');
const profileRoutes      = require('./src/routes/profileRoutes');
const clientRoutes       = require('./src/routes/clientRoutes');
const sessionRoutes      = require('./src/routes/sessionRoutes');
const noteRoutes         = require('./src/routes/noteRoutes');
const invoiceRoutes      = require('./src/routes/invoiceRoutes');
const analyticsRoutes    = require('./src/routes/analyticsRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');
const exportRoutes       = require('./src/routes/exportRoutes');
const adminRoutes        = require('./src/routes/adminRoutes');
const availabilityRoutes = require('./src/routes/availabilityRoutes');
const subscriptionRoutes = require('./src/routes/subscriptionRoutes');
const paymentRoutes      = require('./src/routes/paymentRoutes');
const schedulingRoutes   = require('./src/routes/schedulingRoutes');
const entitlementRoutes  = require('./src/routes/entitlementRoutes');

// Error handler
const errorHandler = require('./src/middleware/errorHandler');

const app = express();

// â”€â”€ Security â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow uploads to be served
}));
// Rate limiting: disabled in development, active in production
if (process.env.NODE_ENV === 'production') {
  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, please try again later.' },
  });
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many auth attempts, please try again later.' },
  });
  app.use('/api', globalLimiter);
  app.use('/api/auth', authLimiter);
}

// â”€â”€ CORS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// CORS — accepts CLIENT_URL, all Vercel preview deployments, and localhost
const allowedOrigins = [
  process.env.CLIENT_URL?.replace(/\/$/, ''),
  'https://unfazed-1qofqfblt-nitish-kumar12.vercel.app',
  'https://unfazed-six.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin
    if (!origin) {
      return callback(null, true);
    }

    // Normalize origin by removing trailing slash
    const normalizedOrigin = origin.replace(/\/$/, '');

    // Accepts ANY *.vercel.app URL — no matter which preview Vercel assigns
    if (/^https:\/\/[a-zA-Z0-9-]+\.vercel\.app$/.test(origin)) {
     return callback(null, true);
   }

    // Allow explicitly configured origins
    if (allowedOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }

    return callback(
      new Error(`CORS: origin '${origin}' not allowed`)
    );
  },

  credentials: true,

  methods: [
    'GET',
    'POST',
    'PUT',
    'PATCH',
    'DELETE',
    'OPTIONS'
  ],

  allowedHeaders: [
    'Content-Type',
    'Authorization'
  ]
}));

// â”€â”€ Body parsers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Webhook route needs raw body â€” mount BEFORE json parser
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
app.use('/api/subscription/webhook', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// â”€â”€ Static files (uploads) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// â”€â”€ Health check â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app.get('/api/health', (req, res) => {
  const mongoose = require('mongoose');
  const dbState  = mongoose.connection.readyState;
  const dbStatus = ['disconnected','connected','connecting','disconnecting'][dbState] || 'unknown';
  const healthy  = dbState === 1;

  const rzKeyId     = (process.env.RAZORPAY_KEY_ID     || '').trim() || 'rzp_test_TiNBqobbpz64rc';
  const rzKeySecret = (process.env.RAZORPAY_KEY_SECRET || '').trim() || 'PST0SEgyQAjZdbmdp1kwc7tz';
  res.status(healthy ? 200 : 503).json({
    success:     healthy,
    message:     healthy ? 'Unfazed API is running' : 'Database not connected',
    timestamp:   new Date().toISOString(),
    environment: process.env.NODE_ENV,
    uptime:      Math.floor(process.uptime()) + 's',
    database:    dbStatus,
    version:     '1.0.0',
    razorpay: {
      key_id:     rzKeyId,
      key_secret: rzKeySecret !== 'NOT_SET' ? rzKeySecret.substring(0,6)+'...'+rzKeySecret.slice(-4)+' ('+rzKeySecret.length+' chars)' : 'NOT_SET',
    },
  });
});

// â”€â”€ API Routes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app.use('/api/auth',          authRoutes);
app.use('/api/profile',       profileRoutes);
app.use('/api/clients',       clientRoutes);
app.use('/api/sessions',      sessionRoutes);
app.use('/api/notes',         noteRoutes);
app.use('/api/invoices',      invoiceRoutes);
app.use('/api/analytics',     analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/export',        exportRoutes);
app.use('/api/admin',         adminRoutes);
app.use('/api/availability',  availabilityRoutes);
app.use('/api/subscription',  subscriptionRoutes);
app.use('/api/payments',      paymentRoutes);
app.use('/api/scheduling',    schedulingRoutes);
app.use('/api/entitlements',  entitlementRoutes);

// â”€â”€ 404 handler â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// â”€â”€ Global error handler â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app.use(errorHandler);

module.exports = app;
