const express = require('express');
const { query } = require('../database/connection');
const { getRedisClient } = require('../database/redis');
const winston = require('winston');

const router = express.Router();

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: '/app/logs/health.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// Health check endpoint
router.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// Database test endpoint
router.get('/database', async (req, res) => {
  try {
    // Test basic connection
    const connectionTest = await query('SELECT NOW() as current_time');
    
    // Check if tables exist
    const tablesTest = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('blocks', 'transactions', 'mining_sessions', 'users')
    `);
    
    // Check table counts
    const blocksCount = await query('SELECT COUNT(*) as count FROM blocks');
    const transactionsCount = await query('SELECT COUNT(*) as count FROM transactions');
    const miningSessionsCount = await query('SELECT COUNT(*) as count FROM mining_sessions');
    const usersCount = await query('SELECT COUNT(*) as count FROM users');
    
    // Check recent data
    const recentBlocks = await query('SELECT block_number, status, created_at FROM blocks ORDER BY block_number DESC LIMIT 5');
    const recentSessions = await query('SELECT id, status, coins_earned, created_at FROM mining_sessions ORDER BY created_at DESC LIMIT 5');
    
    res.json({
      status: 'healthy',
      database: {
        connection: 'connected',
        currentTime: connectionTest.rows[0].current_time,
        tables: {
          found: tablesTest.rows.map(row => row.table_name),
          counts: {
            blocks: parseInt(blocksCount.rows[0]?.count || 0),
            transactions: parseInt(transactionsCount.rows[0]?.count || 0),
            miningSessions: parseInt(miningSessionsCount.rows[0]?.count || 0),
            users: parseInt(usersCount.rows[0]?.count || 0)
          }
        },
        recentData: {
          blocks: recentBlocks.rows,
          miningSessions: recentSessions.rows
        }
      }
    });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({
      status: 'error',
      database: {
        connection: 'failed',
        error: error.message
      }
    });
  }
});

// Detailed health check with database and Redis
router.get('/detailed', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    services: {
      database: 'unknown',
      redis: 'unknown'
    },
    memory: {
      used: process.memoryUsage().heapUsed,
      total: process.memoryUsage().heapTotal,
      external: process.memoryUsage().external
    }
  };

  try {
    // Check database connection
    const dbStart = Date.now();
    await query('SELECT 1');
    const dbTime = Date.now() - dbStart;
    health.services.database = 'healthy';
    health.services.databaseResponseTime = dbTime;
  } catch (error) {
    logger.error('Database health check failed:', error);
    health.services.database = 'unhealthy';
    health.status = 'degraded';
  }

  try {
    // Check Redis connection
    const redisStart = Date.now();
    const redisClient = getRedisClient();
    await redisClient.ping();
    const redisTime = Date.now() - redisStart;
    health.services.redis = 'healthy';
    health.services.redisResponseTime = redisTime;
  } catch (error) {
    logger.error('Redis health check failed:', error);
    health.services.redis = 'unhealthy';
    health.status = 'degraded';
  }

  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});

// Readiness probe for Kubernetes
router.get('/ready', async (req, res) => {
  try {
    // Check if all critical services are available
    await query('SELECT 1');
    const redisClient = getRedisClient();
    await redisClient.ping();
    
    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Readiness check failed:', error);
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Liveness probe for Kubernetes
router.get('/live', (req, res) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Metrics endpoint for monitoring
router.get('/metrics', async (req, res) => {
  const metrics = {
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      heapUsed: process.memoryUsage().heapUsed,
      heapTotal: process.memoryUsage().heapTotal,
      external: process.memoryUsage().external,
      rss: process.memoryUsage().rss
    },
    cpu: process.cpuUsage(),
    versions: {
      node: process.version,
      platform: process.platform,
      arch: process.arch
    }
  };

  try {
    // Database metrics
    const dbResult = await query('SELECT count(*) as user_count FROM users');
    metrics.database = {
      userCount: parseInt(dbResult.rows[0].user_count)
    };
  } catch (error) {
    logger.error('Failed to get database metrics:', error);
    metrics.database = { error: 'unavailable' };
  }

  try {
    // Redis metrics
    const redisClient = getRedisClient();
    const redisInfo = await redisClient.info();
    metrics.redis = {
      info: redisInfo
    };
  } catch (error) {
    logger.error('Failed to get Redis metrics:', error);
    metrics.redis = { error: 'unavailable' };
  }

  res.status(200).json(metrics);
});

module.exports = router;
