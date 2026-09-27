require('dotenv').config();
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

// Error handler
const errorHandler = require('./src/middleware/errorHandler');

const app = express();

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow uploads to be served
}));

// Global rate limiter — 200 req / 15 min per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

// Stricter limit for auth endpoints — 20 req / 15 min
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many auth attempts, please try again later.' },
});

app.use('/api', globalLimiter);
app.use('/api/auth', authLimiter);

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Body parsers ──────────────────────────────────────────────────────────────
// Webhook route needs raw body — mount BEFORE json parser
app.use('/api/subscription/webhook', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Static files (uploads) ────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Unfazed API is running 🚀',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// ── API Routes ────────────────────────────────────────────────────────────────
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

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
