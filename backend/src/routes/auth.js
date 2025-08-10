const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { query } = require('../database/connection');
const { set, get } = require('../database/redis');
const { asyncHandler, ValidationError, UnauthorizedError } = require('../middleware/errorHandler');
const winston = require('winston');

const router = express.Router();

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: '/app/logs/auth.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// Validation rules
const registerValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('username').isLength({ min: 3, max: 30 }).matches(/^[a-zA-Z0-9_]+$/).withMessage('Username must be 3-30 characters, alphanumeric and underscores only'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Password confirmation does not match password');
    }
    return true;
  })
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
];

// Register new user
router.post('/register', registerValidation, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError(errors.array()[0].msg);
  }

  const { email, username, password } = req.body;

  // Check if user already exists
  const existingUser = await query(
    'SELECT id FROM users WHERE email = $1 OR username = $2',
    [email, username]
  );

  if (existingUser.rows.length > 0) {
    throw new ValidationError('User with this email or username already exists');
  }

  // Hash password
  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Create user
  const result = await query(
    `INSERT INTO users (email, username, password_hash, role, is_active, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
     RETURNING id, email, username, role, created_at`,
    [email, username, hashedPassword, 'user', true]
  );

  const user = result.rows[0];

  // Generate JWT token
  const token = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  // Store token in Redis for session management
  await set(`session:${user.id}`, { token, createdAt: new Date().toISOString() }, 86400); // 24 hours

  logger.info('User registered successfully', { userId: user.id, email: user.email });

  res.status(201).json({
    message: 'User registered successfully',
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      createdAt: user.created_at
    },
    token
  });
}));

// Login user
router.post('/login', loginValidation, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError(errors.array()[0].msg);
  }

  const { email, password } = req.body;

  // Find user
  const result = await query(
    'SELECT id, email, username, password_hash, role, is_active FROM users WHERE email = $1',
    [email]
  );

  if (result.rows.length === 0) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const user = result.rows[0];

  if (!user.is_active) {
    throw new UnauthorizedError('Account is deactivated');
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.password_hash);
  if (!isValidPassword) {
    throw new UnauthorizedError('Invalid email or password');
  }

  // Generate JWT token
  const token = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  // Store token in Redis
  await set(`session:${user.id}`, { token, createdAt: new Date().toISOString() }, 86400);

  // Update last login
  await query(
    'UPDATE users SET last_login = NOW() WHERE id = $1',
    [user.id]
  );

  logger.info('User logged in successfully', { userId: user.id, email: user.email });

  res.json({
    message: 'Login successful',
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role
    },
    token
  });
}));

// Logout user
router.post('/logout', asyncHandler(async (req, res) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // Remove session from Redis
      await query('DELETE FROM user_sessions WHERE user_id = $1 AND token = $2', [decoded.userId, token]);
      logger.info('User logged out', { userId: decoded.userId });
    } catch (error) {
      // Token might be invalid, but we still return success
      logger.warn('Logout with invalid token', { error: error.message });
    }
  }

  res.json({ message: 'Logout successful' });
}));

// Refresh token
router.post('/refresh', asyncHandler(async (req, res) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    throw new UnauthorizedError('No token provided');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user still exists and is active
    const result = await query(
      'SELECT id, email, username, role, is_active FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      throw new UnauthorizedError('User not found');
    }

    const user = result.rows[0];
    if (!user.is_active) {
      throw new UnauthorizedError('Account is deactivated');
    }

    // Generate new token
    const newToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Update session in Redis
    await set(`session:${user.id}`, { token: newToken, createdAt: new Date().toISOString() }, 86400);

    logger.info('Token refreshed', { userId: user.id });

    res.json({
      message: 'Token refreshed successfully',
      token: newToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new UnauthorizedError('Token expired');
    }
    throw new UnauthorizedError('Invalid token');
  }
}));

// Get current user profile
router.get('/me', asyncHandler(async (req, res) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    throw new UnauthorizedError('No token provided');
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  
  const result = await query(
    'SELECT id, email, username, role, is_active, created_at, last_login FROM users WHERE id = $1',
    [decoded.userId]
  );

  if (result.rows.length === 0) {
    throw new UnauthorizedError('User not found');
  }

  const user = result.rows[0];
  
  if (!user.is_active) {
    throw new UnauthorizedError('Account is deactivated');
  }

  res.json({
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      createdAt: user.created_at,
      lastLogin: user.last_login
    }
  });
}));

// Change password
router.post('/change-password', [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters long'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.newPassword) {
      throw new Error('Password confirmation does not match new password');
    }
    return true;
  })
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError(errors.array()[0].msg);
  }

  const { currentPassword, newPassword } = req.body;
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    throw new UnauthorizedError('No token provided');
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  
  // Get user with current password
  const result = await query(
    'SELECT id, password_hash FROM users WHERE id = $1',
    [decoded.userId]
  );

  if (result.rows.length === 0) {
    throw new UnauthorizedError('User not found');
  }

  const user = result.rows[0];

  // Verify current password
  const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
  if (!isValidPassword) {
    throw new UnauthorizedError('Current password is incorrect');
  }

  // Hash new password
  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

  // Update password
  await query(
    'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
    [hashedPassword, user.id]
  );

  logger.info('Password changed successfully', { userId: user.id });

  res.json({ message: 'Password changed successfully' });
}));

module.exports = router;
