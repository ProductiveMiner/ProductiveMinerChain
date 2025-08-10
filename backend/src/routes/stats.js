const express = require('express');
const { query } = require('../database/connection');
const { get, hgetall } = require('../database/redis');
const { asyncHandler, NotFoundError } = require('../middleware/errorHandler');
const { requireAdmin } = require('../middleware/auth');
const winston = require('winston');

const router = express.Router();

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: '/app/logs/stats.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// Get system overview statistics
router.get('/overview', asyncHandler(async (req, res) => {
  // Get user statistics
  const userStats = await query(`
    SELECT 
      COUNT(*) as total_users,
      COUNT(CASE WHEN is_active = true THEN 1 END) as active_users,
      COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as new_users_week,
      COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as new_users_month
    FROM users
  `);

  // Get mining statistics
  const miningStats = await query(`
    SELECT 
      COUNT(*) as total_sessions,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_sessions,
      COUNT(CASE WHEN status = 'stopped' THEN 1 END) as stopped_sessions,
      SUM(duration) as total_mining_time,
      SUM(coins_earned) as total_coins_earned,
      AVG(difficulty) as avg_difficulty,
      AVG(duration) as avg_session_duration
    FROM mining_sessions
  `);

  // Get recent activity
  const recentActivity = await query(`
    SELECT 
      'user_registration' as type,
      u.username,
      u.created_at as timestamp
    FROM users u
    WHERE u.created_at >= NOW() - INTERVAL '7 days'
    UNION ALL
    SELECT 
      'mining_session' as type,
      u.username,
      ms.created_at as timestamp
    FROM mining_sessions ms
    JOIN users u ON ms.user_id = u.id
    WHERE ms.created_at >= NOW() - INTERVAL '7 days'
    ORDER BY timestamp DESC
    LIMIT 20
  `);

  // Get Redis statistics
  const redisStats = await get('system_stats') || {};

  res.json({
    users: userStats.rows[0] ? {
      total: parseInt(userStats.rows[0].total_users),
      active: parseInt(userStats.rows[0].active_users),
      newThisWeek: parseInt(userStats.rows[0].new_users_week),
      newThisMonth: parseInt(userStats.rows[0].new_users_month)
    } : null,
    mining: miningStats.rows[0] ? {
      totalSessions: parseInt(miningStats.rows[0].total_sessions || 0),
      completedSessions: parseInt(miningStats.rows[0].completed_sessions || 0),
      stoppedSessions: parseInt(miningStats.rows[0].stopped_sessions || 0),
      totalMiningTime: parseInt(miningStats.rows[0].total_mining_time || 0),
      totalCoinsEarned: parseInt(miningStats.rows[0].total_coins_earned || 0),
      avgDifficulty: parseFloat(miningStats.rows[0].avg_difficulty || 0),
      avgSessionDuration: parseFloat(miningStats.rows[0].avg_session_duration || 0)
    } : null,
    recentActivity: recentActivity.rows.map(activity => ({
      type: activity.type,
      username: activity.username,
      timestamp: activity.timestamp
    })),
    redis: redisStats
  });
}));

// Get detailed mining statistics
router.get('/mining', asyncHandler(async (req, res) => {
  const timeframe = req.query.timeframe || 'all'; // all, day, week, month
  const userId = req.userId;

  // Static data for now (without database)
  const difficultyStats = [
    { difficulty: 20, sessions: 1500, completed: 1200, stopped: 300, avgDuration: 45.5, totalCoins: 18000, minDuration: 10, maxDuration: 120 },
    { difficulty: 25, sessions: 2200, completed: 1800, stopped: 400, avgDuration: 67.2, totalCoins: 27000, minDuration: 15, maxDuration: 180 },
    { difficulty: 30, sessions: 1800, completed: 1400, stopped: 400, avgDuration: 89.1, totalCoins: 21000, minDuration: 20, maxDuration: 240 },
    { difficulty: 35, sessions: 1200, completed: 900, stopped: 300, avgDuration: 112.3, totalCoins: 13500, minDuration: 25, maxDuration: 300 },
    { difficulty: 40, sessions: 800, completed: 600, stopped: 200, avgDuration: 145.7, totalCoins: 9000, minDuration: 30, maxDuration: 360 }
  ];

  const hourlyStats = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    sessions: Math.floor(Math.random() * 100) + 50,
    totalCoins: Math.floor(Math.random() * 1000) + 500
  }));

  const dailyStats = Array.from({ length: 7 }, (_, i) => ({
    date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    sessions: Math.floor(Math.random() * 500) + 200,
    completed: Math.floor(Math.random() * 400) + 150,
    totalCoins: Math.floor(Math.random() * 5000) + 2000,
    avgDifficulty: Math.floor(Math.random() * 10) + 25
  }));

  // If user is authenticated, get user-specific data
  if (userId) {
    const topMiners = [
      { rank: 1, username: 'miner1', sessions: 150, totalTime: 7200, totalCoins: 2250, avgDifficulty: 28.5 },
      { rank: 2, username: 'miner2', sessions: 120, totalTime: 6000, totalCoins: 1800, avgDifficulty: 27.2 },
      { rank: 3, username: 'miner3', sessions: 100, totalTime: 4800, totalCoins: 1500, avgDifficulty: 29.1 }
    ];

    res.json({
      timeframe,
      difficultyStats,
      hourlyStats,
      dailyStats,
      topMiners
    });
  } else {
    // Public data for unauthenticated users
    res.json({
      timeframe,
      difficultyStats,
      hourlyStats,
      dailyStats,
      topMiners: [] // Don't show user data for public access
    });
  }
}));

// Public mining statistics endpoint (no authentication required)
router.get('/public/mining', asyncHandler(async (req, res) => {
  const timeframe = req.query.timeframe || 'all'; // all, day, week, month

  let timeFilter = '';
  if (timeframe === 'day') {
    timeFilter = "AND created_at >= NOW() - INTERVAL '24 hours'";
  } else if (timeframe === 'week') {
    timeFilter = "AND created_at >= NOW() - INTERVAL '7 days'";
  } else if (timeframe === 'month') {
    timeFilter = "AND created_at >= NOW() - INTERVAL '30 days'";
  }

  // Get global mining statistics
  const globalStats = await query(`
    SELECT 
      COUNT(*) as total_sessions,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_sessions,
      SUM(duration) as total_mining_time,
      SUM(coins_earned) as total_coins_earned,
      AVG(difficulty) as avg_difficulty
    FROM mining_sessions 
    WHERE 1=1 ${timeFilter}
  `);

  // Get difficulty distribution
  const difficultyStats = await query(`
    SELECT 
      difficulty,
      COUNT(*) as sessions,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
      AVG(duration) as avg_duration,
      SUM(coins_earned) as total_coins
    FROM mining_sessions 
    WHERE 1=1 ${timeFilter}
    GROUP BY difficulty
    ORDER BY difficulty
  `);

  // Get recent activity
  const recentActivity = await query(`
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as sessions,
      SUM(coins_earned) as total_coins
    FROM mining_sessions 
    WHERE created_at >= NOW() - INTERVAL '7 days'
    GROUP BY DATE(created_at)
    ORDER BY date DESC
    LIMIT 7
  `);

  res.json({
    timeframe,
    globalStats: globalStats.rows[0] ? {
      totalSessions: parseInt(globalStats.rows[0].total_sessions || 0),
      completedSessions: parseInt(globalStats.rows[0].completed_sessions || 0),
      totalMiningTime: parseInt(globalStats.rows[0].total_mining_time || 0),
      totalCoinsEarned: parseInt(globalStats.rows[0].total_coins_earned || 0),
      avgDifficulty: parseFloat(globalStats.rows[0].avg_difficulty || 0)
    } : null,
    difficultyStats: difficultyStats.rows.map(stat => ({
      difficulty: stat.difficulty,
      sessions: parseInt(stat.sessions),
      completed: parseInt(stat.completed),
      avgDuration: parseFloat(stat.avg_duration || 0),
      totalCoins: parseInt(stat.total_coins || 0)
    })),
    recentActivity: recentActivity.rows.map(stat => ({
      date: stat.date,
      sessions: parseInt(stat.sessions),
      totalCoins: parseInt(stat.total_coins || 0)
    }))
  });
}));

// Get user statistics
router.get('/users', asyncHandler(async (req, res) => {
  // Get user growth over time
  const userGrowth = await query(`
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as new_users
    FROM users 
    WHERE created_at >= NOW() - INTERVAL '30 days'
    GROUP BY DATE(created_at)
    ORDER BY date DESC
  `);

  // Get user activity statistics
  const userActivity = await query(`
    SELECT 
      COUNT(CASE WHEN last_login >= NOW() - INTERVAL '24 hours' THEN 1 END) as active_24h,
      COUNT(CASE WHEN last_login >= NOW() - INTERVAL '7 days' THEN 1 END) as active_7d,
      COUNT(CASE WHEN last_login >= NOW() - INTERVAL '30 days' THEN 1 END) as active_30d,
      COUNT(CASE WHEN last_login IS NULL THEN 1 END) as never_logged_in
    FROM users
    WHERE is_active = true
  `);

  // Get user mining statistics
  const userMiningStats = await query(`
    SELECT 
      COUNT(CASE WHEN total_mining_sessions = 0 THEN 1 END) as no_mining,
      COUNT(CASE WHEN total_mining_sessions BETWEEN 1 AND 10 THEN 1 END) as light_miners,
      COUNT(CASE WHEN total_mining_sessions BETWEEN 11 AND 50 THEN 1 END) as moderate_miners,
      COUNT(CASE WHEN total_mining_sessions > 50 THEN 1 END) as heavy_miners
    FROM users
    WHERE is_active = true
  `);

  res.json({
    growth: userGrowth.rows.map(stat => ({
      date: stat.date,
      newUsers: parseInt(stat.new_users)
    })),
    activity: userActivity.rows[0] ? {
      active24h: parseInt(userActivity.rows[0].active_24h),
      active7d: parseInt(userActivity.rows[0].active_7d),
      active30d: parseInt(userActivity.rows[0].active_30d),
      neverLoggedIn: parseInt(userActivity.rows[0].never_logged_in)
    } : null,
    miningDistribution: userMiningStats.rows[0] ? {
      noMining: parseInt(userMiningStats.rows[0].no_mining),
      lightMiners: parseInt(userMiningStats.rows[0].light_miners),
      moderateMiners: parseInt(userMiningStats.rows[0].moderate_miners),
      heavyMiners: parseInt(userMiningStats.rows[0].heavy_miners)
    } : null
  });
}));

// Get system performance metrics (admin only)
router.get('/performance', requireAdmin, asyncHandler(async (req, res) => {
  // Get database performance metrics
  const dbStats = await query(`
    SELECT 
      schemaname,
      tablename,
      n_tup_ins as inserts,
      n_tup_upd as updates,
      n_tup_del as deletes,
      n_live_tup as live_rows,
      n_dead_tup as dead_rows
    FROM pg_stat_user_tables
    ORDER BY n_live_tup DESC
  `);

  // Get Redis performance metrics
  const redisInfo = await get('redis_performance') || {};

  // Get application metrics
  const appMetrics = await get('app_metrics') || {};

  res.json({
    database: {
      tables: dbStats.rows.map(table => ({
        schema: table.schemaname,
        table: table.tablename,
        inserts: parseInt(table.inserts || 0),
        updates: parseInt(table.updates || 0),
        deletes: parseInt(table.deletes || 0),
        liveRows: parseInt(table.live_rows || 0),
        deadRows: parseInt(table.dead_rows || 0)
      }))
    },
    redis: redisInfo,
    application: appMetrics
  });
}));

// Get real-time system status
router.get('/realtime', asyncHandler(async (req, res) => {
  // Get active sessions count
  const activeSessions = await query(`
    SELECT COUNT(*) as count
    FROM mining_sessions 
    WHERE status = 'active'
  `);

  // Get recent system events
  const recentEvents = await get('recent_events') || [];

  // Get current system load
  const systemLoad = {
    activeUsers: parseInt(activeSessions.rows[0]?.count || 0),
    timestamp: new Date().toISOString()
  };

  res.json({
    systemLoad,
    recentEvents,
    timestamp: new Date().toISOString()
  });
}));

module.exports = router;
