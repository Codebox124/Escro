const jwt = require('jsonwebtoken');
const { supabaseAdmin } = require('../config/supabase');

/**
 * Middleware to protect routes - requires authentication
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Get token from Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Not authorized. Please log in to access this route.'
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ status: 'error', message: 'Token expired. Please log in again.' });
      }
      return res.status(401).json({ status: 'error', message: 'Invalid token. Please log in again.' });
    }

    // Fetch user from Supabase
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, role, is_active, is_verified')
      .eq('id', decoded.id)
      .single();

    if (error || !user) {
      return res.status(401).json({ status: 'error', message: 'User not found' });
    }

    if (!user.is_active) {
      return res.status(401).json({ status: 'error', message: 'User account is deactivated' });
    }

    req.user = user; // Attach user to request
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    next(error);
  }
};

/**
 * Middleware to restrict access to specific roles
 */
const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({
      status: 'error',
      message: `User role ${req.user?.role || 'unknown'} is not authorized to access this route`
    });
  }
  next();
};

/**
 * Optional auth - does not fail if token is missing or invalid
 */
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

        const { data: user } = await supabaseAdmin
          .from('users')
          .select('id, email, full_name, role, is_active, is_verified')
          .eq('id', decoded.id)
          .single();

        if (user && user.is_active) {
          req.user = user;
        }
      } catch (err) {
        // Invalid token: just skip attaching user
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { protect, authorize, optionalAuth };
