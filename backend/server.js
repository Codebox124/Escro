const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
// When the API runs inside Next.js (pages/api/[...path].js) the working
// directory is the project root, so also load backend/.env from there.
// Existing variables are never overridden; on Vercel, env vars come from the dashboard.
require('dotenv').config({ path: require('path').resolve(process.cwd(), 'backend', '.env') });

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const productRoutes = require('./routes/product.routes');
const storeRoutes = require('./routes/store.routes');
const orderRoutes = require('./routes/order.routes');
const escrowRoutes = require('./routes/escrow.routes');
const courierRoutes = require('./routes/courier.routes');
const reviewRoutes = require('./routes/review.routes');
const agencyRoutes = require('./routes/agency.routes');
const sellerRoutes = require('./routes/seller.routes');

const app = express();

// Behind a hosting proxy (Render, Railway, Heroku…) so rate limiting sees each
// visitor's real IP instead of the proxy's.
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
// FRONTEND_URL may list several origins, comma-separated
// (e.g. "https://escro.vercel.app,http://localhost:3000").
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map((o) => o.trim().replace(/\/$/, ''))
  .filter(Boolean);
app.use(cors((req, cb) => {
  const origin = req.headers.origin;
  // Same-origin requests (frontend and API on one domain, e.g. one Vercel
  // deployment) are always allowed, including every preview URL.
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const sameOrigin = !!origin && !!host && origin.replace(/^https?:\/\//, '') === host;
  if (!origin || sameOrigin || allowedOrigins.includes(origin)) {
    return cb(null, { origin: true, credentials: true });
  }
  cb(new Error(`Origin ${origin} is not allowed by CORS`));
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  // Dashboards poll (messages every 10s, jobs every 30s, status every 60s), so a
  // busy user easily makes a few hundred requests per window.
  max: Number(process.env.RATE_LIMIT_MAX) || 1500,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Compression middleware
app.use(compression());

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
// Platform controls (admin → Settings): status endpoint + maintenance mode guard
const platformRoutes = require('./routes/platform.routes');
app.use(platformRoutes.maintenanceGuard);
app.use('/api/platform', platformRoutes);

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/escrow', escrowRoutes);
app.use('/api/couriers', courierRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/agencies', agencyRoutes);
app.use('/api/seller', sellerRoutes);
app.use('/api/shop', require('./routes/shop.routes'));         // public marketplace
app.use('/api/customer', require('./routes/customer.routes')); // cart, checkout, buyer orders
app.use('/api/services', require('./routes/services.routes')); // services marketplace
app.use('/api/admin', require('./routes/admin.routes'));       // platform admin

// Stripe webhook endpoint (must be before body parser)
app.post('/api/webhooks/stripe', express.raw({type: 'application/json'}), require('./controllers/webhook.controller').handleStripeWebhook);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Run as a standalone server with `node server.js`. On Vercel the app is
// imported and served as a function instead, so it must not listen itself.
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/health`);
  });
}

module.exports = app;
