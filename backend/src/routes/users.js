const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../database/connection');
const { asyncHandler, ValidationError, NotFoundError } = require('../middleware/errorHandler');
const { requireAdmin } = require('../middleware/auth');
const winston = require('winston');
const path = require('path');

const router = express.Router();

// Use relative path for logs in development, absolute path in production
const logDir = process.env.NODE_ENV === 'production' ? '/app/logs' : './logs';
const usersLogPath = path.join(logDir, 'users.log');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: usersLogPath })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// Get user profile
router.get('/profile', asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT id, email, username, role, is_active, created_at, last_login, 
     total_mining_sessions, total_mining_time, total_coins_earned
     FROM users WHERE id = $1`,
    [req.userId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('User not found');
  }

  const user = result.rows[0];

  res.json({
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      isActive: user.is_active,
      createdAt: user.created_at,
      lastLogin: user.last_login,
      stats: {
        totalMiningSessions: parseInt(user.total_mining_sessions || 0),
        totalMiningTime: parseInt(user.total_mining_time || 0),
        totalCoinsEarned: parseInt(user.total_coins_earned || 0)
      }
    }
  });
}));

// Update user profile
router.put('/profile', [
  body('username').optional().isLength({ min: 3, max: 30 }).matches(/^[a-zA-Z0-9_]+$/).withMessage('Username must be 3-30 characters, alphanumeric and underscores only'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Valid email is required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError(errors.array()[0].msg);
  }

  const { username, email } = req.body;
  const updates = [];
  const values = [];
  let paramCount = 1;

  if (username) {
    // Check if username is already taken
    const existingUser = await query(
      'SELECT id FROM users WHERE username = $1 AND id != $2',
      [username, req.userId]
    );

    if (existingUser.rows.length > 0) {
      throw new ValidationError('Username is already taken');
    }

    updates.push(`username = $${paramCount}`);
    values.push(username);
    paramCount++;
  }

  if (email) {
    // Check if email is already taken
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1 AND id != $2',
      [email, req.userId]
    );

    if (existingUser.rows.length > 0) {
      throw new ValidationError('Email is already taken');
    }

    updates.push(`email = $${paramCount}`);
    values.push(email);
    paramCount++;
  }

  if (updates.length === 0) {
    throw new ValidationError('No valid fields to update');
  }

  updates.push(`updated_at = NOW()`);
  values.push(req.userId);

  const result = await query(
    `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING id, email, username, role, updated_at`,
    values
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('User not found');
  }

  const user = result.rows[0];

  logger.info('User profile updated', { userId: user.id, updates });

  res.json({
    message: 'Profile updated successfully',
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      updatedAt: user.updated_at
    }
  });
}));

// Get user statistics
router.get('/stats', asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT 
       total_mining_sessions,
       total_mining_time,
       total_coins_earned,
       created_at,
       last_login
     FROM users WHERE id = $1`,
    [req.userId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('User not found');
  }

  const user = result.rows[0];

  // Get recent mining sessions
  const sessionsResult = await query(
    `SELECT id, difficulty, duration, coins_earned, created_at
     FROM mining_sessions 
     WHERE user_id = $1 
     ORDER BY created_at DESC 
     LIMIT 10`,
    [req.userId]
  );

  // Get daily stats for the last 7 days
  const dailyStatsResult = await query(
    `SELECT 
       DATE(created_at) as date,
       COUNT(*) as sessions,
       SUM(duration) as total_time,
       SUM(coins_earned) as total_coins
     FROM mining_sessions 
     WHERE user_id = $1 
       AND created_at >= NOW() - INTERVAL '7 days'
     GROUP BY DATE(created_at)
     ORDER BY date DESC`,
    [req.userId]
  );

  res.json({
    stats: {
      totalMiningSessions: parseInt(user.total_mining_sessions || 0),
      totalMiningTime: parseInt(user.total_mining_time || 0),
      totalCoinsEarned: parseInt(user.total_coins_earned || 0),
      memberSince: user.created_at,
      lastLogin: user.last_login
    },
    recentSessions: sessionsResult.rows.map(session => ({
      id: session.id,
      difficulty: session.difficulty,
      duration: session.duration,
      coinsEarned: session.coins_earned,
      createdAt: session.created_at
    })),
    dailyStats: dailyStatsResult.rows.map(stat => ({
      date: stat.date,
      sessions: parseInt(stat.sessions),
      totalTime: parseInt(stat.total_time || 0),
      totalCoins: parseInt(stat.total_coins || 0)
    }))
  });
}));

// Get user mining sessions
router.get('/sessions', asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  const result = await query(
    `SELECT id, difficulty, duration, coins_earned, created_at
     FROM mining_sessions 
     WHERE user_id = $1 
     ORDER BY created_at DESC 
     LIMIT $2 OFFSET $3`,
    [req.userId, limit, offset]
  );

  const countResult = await query(
    'SELECT COUNT(*) as total FROM mining_sessions WHERE user_id = $1',
    [req.userId]
  );

  const total = parseInt(countResult.rows[0].total);
  const totalPages = Math.ceil(total / limit);

  res.json({
    sessions: result.rows.map(session => ({
      id: session.id,
      difficulty: session.difficulty,
      duration: session.duration,
      coinsEarned: session.coins_earned,
      createdAt: session.created_at
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  });
}));

// Admin routes
// Get all users (admin only)
router.get('/', requireAdmin, asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;
  const search = req.query.search || '';

  let whereClause = '';
  let values = [];
  let paramCount = 1;

  if (search) {
    whereClause = `WHERE username ILIKE $${paramCount} OR email ILIKE $${paramCount}`;
    values.push(`%${search}%`);
    paramCount++;
  }

  const result = await query(
    `SELECT id, email, username, role, is_active, created_at, last_login,
            total_mining_sessions, total_mining_time, total_coins_earned
     FROM users ${whereClause}
     ORDER BY created_at DESC 
     LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
    [...values, limit, offset]
  );

  const countResult = await query(
    `SELECT COUNT(*) as total FROM users ${whereClause}`,
    values
  );

  const total = parseInt(countResult.rows[0].total);
  const totalPages = Math.ceil(total / limit);

  res.json({
    users: result.rows.map(user => ({
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      isActive: user.is_active,
      createdAt: user.created_at,
      lastLogin: user.last_login,
      stats: {
        totalMiningSessions: parseInt(user.total_mining_sessions || 0),
        totalMiningTime: parseInt(user.total_mining_time || 0),
        totalCoinsEarned: parseInt(user.total_coins_earned || 0)
      }
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  });
}));

// Update user (admin only)
router.put('/:userId', requireAdmin, [
  body('role').optional().isIn(['user', 'admin']).withMessage('Role must be user or admin'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError(errors.array()[0].msg);
  }

  const { userId } = req.params;
  const { role, isActive } = req.body;

  const updates = [];
  const values = [];
  let paramCount = 1;

  if (role !== undefined) {
    updates.push(`role = $${paramCount}`);
    values.push(role);
    paramCount++;
  }

  if (isActive !== undefined) {
    updates.push(`is_active = $${paramCount}`);
    values.push(isActive);
    paramCount++;
  }

  if (updates.length === 0) {
    throw new ValidationError('No valid fields to update');
  }

  updates.push(`updated_at = NOW()`);
  values.push(userId);

  const result = await query(
    `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING id, email, username, role, is_active, updated_at`,
    values
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('User not found');
  }

  const user = result.rows[0];

  logger.info('User updated by admin', { 
    adminId: req.userId, 
    targetUserId: user.id, 
    updates 
  });

  res.json({
    message: 'User updated successfully',
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      isActive: user.is_active,
      updatedAt: user.updated_at
    }
  });
}));

module.exports = router;
