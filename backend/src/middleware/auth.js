const jwt = require('jsonwebtoken');
const { query } = require('../database/connection');
const winston = require('winston');
const path = require('path');

// Use relative path for logs in development, absolute path in production
const logDir = process.env.NODE_ENV === 'production' ? '/app/logs' : './logs';
const authLogPath = path.join(logDir, 'auth.log');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: authLogPath })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// Authentication middleware
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        error: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verify user exists in database
    const result = await query(
      'SELECT id, email, username, role, is_active FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: 'Invalid token. User not found.'
      });
    }

    const user = result.rows[0];
    
    if (!user.is_active) {
      return res.status(401).json({
        error: 'Account is deactivated.'
      });
    }

    req.user = user;
    req.userId = user.id;
    
    logger.info('Authentication successful', { userId: user.id, email: user.email });
    next();
  } catch (error) {
    logger.error('Authentication failed:', { error: error.message });
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired.'
      });
    }
    
    return res.status(500).json({
      error: 'Internal server error during authentication.'
    });
  }
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const result = await query(
      'SELECT id, email, username, role, is_active FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length > 0) {
      const user = result.rows[0];
      if (user.is_active) {
        req.user = user;
        req.userId = user.id;
      }
    }
    
    next();
  } catch (error) {
    // Don't fail the request, just continue without user
    logger.warn('Optional authentication failed:', { error: error.message });
    next();
  }
};

// Role-based authorization middleware
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required.'
      });
    }

    if (!roles.includes(req.user.role)) {
      logger.warn('Insufficient permissions', { 
        userId: req.user.id, 
        userRole: req.user.role, 
        requiredRoles: roles 
      });
      
      return res.status(403).json({
        error: 'Insufficient permissions.'
      });
    }

    next();
  };
};

// Admin role middleware
const requireAdmin = requireRole(['admin']);

// User or admin role middleware
const requireUserOrAdmin = requireRole(['user', 'admin']);

module.exports = {
  authMiddleware,
  optionalAuthMiddleware,
  requireRole,
  requireAdmin,
  requireUserOrAdmin
};
