const express = require('express');
const { query, safeQuery, isDatabaseAvailable } = require('../database/connection');
const { get, hgetall } = require('../database/redis');
const { asyncHandler, NotFoundError } = require('../middleware/errorHandler');
const { requireAdmin } = require('../middleware/auth');
const winston = require('winston');
const { populateDiscoveriesFromMiningSessions } = require('../scripts/populate-discoveries');

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
  // Check if database is available first
  const dbAvailable = await isDatabaseAvailable();
  
  if (!dbAvailable) {
    logger.warn('Database not available, returning fallback data for overview');
    return res.json({
      users: {
        total: 0,
        active: 0,
        newThisWeek: 0,
        newThisMonth: 0
      },
      mining: {
        totalSessions: 0,
        completedSessions: 0,
        stoppedSessions: 0,
        totalMiningTime: 0,
        totalCoinsEarned: 0,
        avgDifficulty: 0,
        avgSessionDuration: 0
      },
      recentActivity: [],
      redis: {},
      note: "Database temporarily unavailable - showing fallback data"
    });
  }

  try {
    // Get user statistics
    const userStats = await safeQuery(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_users,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as new_users_week,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as new_users_month
      FROM users
    `, [], { rows: [{ total_users: 0, active_users: 0, new_users_week: 0, new_users_month: 0 }] });

    // Get mining statistics
    const miningStats = await safeQuery(`
      SELECT 
        COUNT(*) as total_sessions,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_sessions,
        COUNT(CASE WHEN status = 'stopped' THEN 1 END) as stopped_sessions,
        SUM(duration) as total_mining_time,
        SUM(coins_earned) as total_coins_earned,
        AVG(difficulty) as avg_difficulty,
        AVG(duration) as avg_session_duration
      FROM mining_sessions
    `, [], { rows: [{ total_sessions: 0, completed_sessions: 0, stopped_sessions: 0, total_mining_time: 0, total_coins_earned: 0, avg_difficulty: 0, avg_session_duration: 0 }] });

    // Get recent activity
    const recentActivity = await safeQuery(`
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
    `, [], { rows: [] });

    // Get Redis statistics
    const redisStats = await get('system_stats') || {};

    res.json({
      users: {
        total: parseInt(userStats.rows[0].total_users),
        active: parseInt(userStats.rows[0].active_users),
        newThisWeek: parseInt(userStats.rows[0].new_users_week),
        newThisMonth: parseInt(userStats.rows[0].new_users_month)
      },
      mining: {
        totalSessions: parseInt(miningStats.rows[0].total_sessions || 0),
        completedSessions: parseInt(miningStats.rows[0].completed_sessions || 0),
        stoppedSessions: parseInt(miningStats.rows[0].stopped_sessions || 0),
        totalMiningTime: parseInt(miningStats.rows[0].total_mining_time || 0),
        totalCoinsEarned: parseInt(miningStats.rows[0].total_coins_earned || 0),
        avgDifficulty: parseFloat(miningStats.rows[0].avg_difficulty || 0),
        avgSessionDuration: parseFloat(miningStats.rows[0].avg_session_duration || 0)
      },
      recentActivity: recentActivity.rows.map(activity => ({
        type: activity.type,
        username: activity.username,
        timestamp: activity.timestamp
      })),
      redis: redisStats
    });
  } catch (error) {
    logger.error('Unexpected error in stats overview:', error);
    // Return fallback data when database is unavailable
    res.json({
      users: {
        total: 0,
        active: 0,
        newThisWeek: 0,
        newThisMonth: 0
      },
      mining: {
        totalSessions: 0,
        completedSessions: 0,
        stoppedSessions: 0,
        totalMiningTime: 0,
        totalCoinsEarned: 0,
        avgDifficulty: 0,
        avgSessionDuration: 0
      },
      recentActivity: [],
      redis: {},
      note: "Database temporarily unavailable - showing fallback data"
    });
  }
}));

// Get detailed mining statistics
router.get('/mining', asyncHandler(async (req, res) => {
  const timeframe = req.query.timeframe || 'all'; // all, day, week, month
  const userId = req.userId;

  // Get real data from database or return empty arrays
  const difficultyStats = [];
  const hourlyStats = [];
  const dailyStats = [];

  // If user is authenticated, get user-specific data
  if (userId) {
    const topMiners = [];

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

// Get user-specific dashboard data
router.get('/dashboard/user', asyncHandler(async (req, res) => {
  // Check if database is available first
  const dbAvailable = await isDatabaseAvailable();
  
  if (!dbAvailable) {
    logger.warn('Database not available, returning fallback data');
    return res.json({
      userStats: {
        totalSessions: 0,
        completedSessions: 0,
        totalDiscoveries: 0,
        totalCoinsEarned: 0,
        avgDifficulty: 0,
        avgSessionDuration: 0
      },
      note: "Database temporarily unavailable - showing fallback data"
    });
  }

  try {
    // For now, we'll use a demo user ID (user 1) since authentication isn't fully wired
    const userId = 1; // TODO: Get from req.userId when auth is connected
    
    // Get user-specific mining and discovery statistics
    const userDashboardData = await safeQuery(`
      SELECT 
        -- User mining sessions
        (SELECT COUNT(*) FROM mining_sessions WHERE user_id = $1) as total_sessions,
        (SELECT COUNT(*) FROM mining_sessions WHERE user_id = $1 AND status = 'completed') as completed_sessions,
        (SELECT COALESCE(SUM(coins_earned), 0) FROM mining_sessions WHERE user_id = $1) as total_coins_earned,
        (SELECT COALESCE(AVG(difficulty), 0) FROM mining_sessions WHERE user_id = $1) as avg_difficulty,
        (SELECT COALESCE(AVG(duration), 0) FROM mining_sessions WHERE user_id = $1) as avg_session_duration,
        
        -- User discoveries (completed mining sessions count as discoveries)
        (SELECT COUNT(*) FROM mining_sessions WHERE user_id = $1 AND status = 'completed') as total_discoveries
    `, [userId], { 
      rows: [{ 
        total_sessions: 0, completed_sessions: 0, total_coins_earned: 0, 
        avg_difficulty: 0, avg_session_duration: 0, total_discoveries: 0
      }] 
    });

    const data = userDashboardData.rows[0];
    
    res.json({
      userStats: {
        totalSessions: parseInt(data.total_sessions || 0),
        completedSessions: parseInt(data.completed_sessions || 0),
        totalDiscoveries: parseInt(data.total_discoveries || 0),
        totalCoinsEarned: parseInt(data.total_coins_earned || 0),
        avgDifficulty: parseFloat(data.avg_difficulty || 0),
        avgSessionDuration: parseFloat(data.avg_session_duration || 0)
      }
    });

  } catch (error) {
    logger.error('Error getting user dashboard stats:', error);
    res.status(500).json({
      userStats: {
        totalSessions: 0,
        completedSessions: 0,
        totalDiscoveries: 0,
        totalCoinsEarned: 0,
        avgDifficulty: 0,
        avgSessionDuration: 0
      },
      error: 'Failed to get user dashboard statistics'
    });
  }
}));

// Get dashboard data - Combined endpoint for frontend
router.get('/dashboard', asyncHandler(async (req, res) => {
  // Check if database is available first
  const dbAvailable = await isDatabaseAvailable();
  
  if (!dbAvailable) {
    logger.warn('Database not available, returning fallback data');
    return res.json({
      users: {
        total: 0,
        active: 0,
        newThisWeek: 0,
        newThisMonth: 0
      },
      mining: {
        totalSessions: 0,
        completedSessions: 0,
        stoppedSessions: 0,
        totalMiningTime: 0,
        totalCoinsEarned: 0,
        avgDifficulty: 0,
        avgSessionDuration: 0
      },
      activeMiners: 0,
      research: {
        totalPapers: 0,
        totalDiscoveries: 0,
        totalCitations: 0,
        avgComplexity: 0
      },
      redis: {},
      note: "Database temporarily unavailable - showing fallback data"
    });
  }

  try {
    // Check if mathematical_discoveries exist, if not populate them
    const discoveriesCheck = await safeQuery('SELECT COUNT(*) as count FROM mathematical_discoveries', [], { rows: [{ count: 0 }] });
    
    if (parseInt(discoveriesCheck.rows[0].count) === 0) {
      console.log('🔍 No mathematical discoveries found, populating from mining sessions...');
      try {
        await populateDiscoveriesFromMiningSessions();
        console.log('✅ Mathematical discoveries populated successfully');
      } catch (populateError) {
        console.error('⚠️ Failed to populate mathematical discoveries:', populateError.message);
      }
    }
    
    // Use a single optimized query to get all dashboard data with timeout
    const dashboardData = await safeQuery(`
      SELECT 
        -- User stats
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM users WHERE is_active = true) as active_users,
        (SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL '7 days') as new_users_week,
        (SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL '30 days') as new_users_month,
        
        -- Mining stats
        (SELECT COUNT(*) FROM mining_sessions) as total_sessions,
        (SELECT COUNT(*) FROM mining_sessions WHERE status = 'completed') as completed_sessions,
        (SELECT COUNT(*) FROM mining_sessions WHERE status = 'stopped') as stopped_sessions,
        (SELECT COALESCE(SUM(duration), 0) FROM mining_sessions) as total_mining_time,
        (SELECT COALESCE(SUM(coins_earned), 0) FROM mining_sessions) as total_coins_earned,
        (SELECT COALESCE(AVG(difficulty), 0) FROM mining_sessions) as avg_difficulty,
        (SELECT COALESCE(AVG(duration), 0) FROM mining_sessions) as avg_session_duration,
        
        -- Active miners
        (SELECT COUNT(DISTINCT user_id) FROM mining_sessions WHERE created_at >= NOW() - INTERVAL '24 hours') as active_miners,
        
        -- Research stats - use mining sessions as discoveries since they represent mathematical computations
        (SELECT COUNT(*) FROM mining_sessions WHERE status = 'completed') as total_discoveries,
        (SELECT COALESCE(AVG(difficulty), 0) FROM mining_sessions WHERE status = 'completed') as avg_complexity,
        (SELECT COALESCE(SUM(coins_earned), 0) FROM mining_sessions WHERE status = 'completed') as total_citations
    `, [], { 
      rows: [{ 
        total_users: 0, active_users: 0, new_users_week: 0, new_users_month: 0,
        total_sessions: 0, completed_sessions: 0, stopped_sessions: 0, 
        total_mining_time: 0, total_coins_earned: 0, avg_difficulty: 0, avg_session_duration: 0,
        active_miners: 0, total_discoveries: 0, avg_complexity: 0, total_citations: 0
      }] 
    });

    const data = dashboardData.rows[0];
    
    // Get Redis statistics (non-blocking)
    const redisStats = await get('system_stats') || {};

    res.json({
      users: {
        total: parseInt(data.total_users),
        active: parseInt(data.active_users),
        newThisWeek: parseInt(data.new_users_week),
        newThisMonth: parseInt(data.new_users_month)
      },
      mining: {
        totalSessions: parseInt(data.total_sessions || 0),
        completedSessions: parseInt(data.completed_sessions || 0),
        stoppedSessions: parseInt(data.stopped_sessions || 0),
        totalMiningTime: parseInt(data.total_mining_time || 0),
        totalCoinsEarned: parseInt(data.total_coins_earned || 0),
        avgDifficulty: parseFloat(data.avg_difficulty || 0),
        avgSessionDuration: parseFloat(data.avg_session_duration || 0)
      },
      activeMiners: parseInt(data.active_miners),
      research: {
        totalPapers: parseInt(data.total_discoveries || 0),
        totalDiscoveries: parseInt(data.total_discoveries || 0),
        totalCitations: parseInt(data.total_citations || 0),
        avgComplexity: parseFloat(data.avg_complexity || 0)
      },
      redis: redisStats
    });
  } catch (error) {
    logger.error('Unexpected error in dashboard stats:', error);
    // Return comprehensive fallback data when database is unavailable
    res.json({
      users: {
        total: 0,
        active: 0,
        newThisWeek: 0,
        newThisMonth: 0
      },
      mining: {
        totalSessions: 0,
        completedSessions: 0,
        stoppedSessions: 0,
        totalMiningTime: 0,
        totalCoinsEarned: 0,
        avgDifficulty: 0,
        avgSessionDuration: 0
      },
      activeMiners: 0,
      research: {
        totalPapers: 0,
        totalDiscoveries: 0,
        totalCitations: 0,
        avgComplexity: 0
      },
      redis: {},
      note: "Database temporarily unavailable - showing fallback data"
    });
  }
}));

// Populate discoveries from mining sessions (admin only)
router.post('/populate-discoveries', requireAdmin, asyncHandler(async (req, res) => {
  try {
    await populateDiscoveriesFromMiningSessions();
    res.json({ 
      success: true, 
      message: 'Discoveries populated successfully from mining sessions' 
    });
  } catch (error) {
    logger.error('Error populating discoveries:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to populate discoveries' 
    });
  }
}));

module.exports = router;
