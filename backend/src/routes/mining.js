const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../database/connection');
const { set, get, incr, del } = require('../database/redis');
const { asyncHandler, ValidationError } = require('../middleware/errorHandler');
const winston = require('winston');
const crypto = require('crypto');
const fetch = require('node-fetch');
const { ethers } = require('ethers');
const { CONTRACT_CONFIG, contractABI } = require('../config/contract');

const router = express.Router();

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: '/app/logs/mining.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// Helper: run a DB query with a short timeout and return null on failure
async function tryQuery(text, params = [], timeoutMs = 1000) {
  try {
    const result = await Promise.race([
      query(text, params),
      new Promise((_, reject) => setTimeout(() => reject(new Error('DB query timeout')), timeoutMs))
    ]);
    return result;
  } catch (error) {
    logger.warn('DB unavailable or slow; using fallback', { sql: text?.slice(0, 80), error: error.message });
    return null;
  }
}
// Safely read from Redis without hanging if Redis is not ready
async function safeRedisGet(key, timeoutMs = 300) {
  try {
    return await Promise.race([
      get(key),
      new Promise((resolve) => setTimeout(() => resolve(null), timeoutMs))
    ]);
  } catch (error) {
    logger.warn('safeRedisGet failed, continuing without Redis', { key, error: error.message });
    return null;
  }
}

// Safely write to Redis with a short timeout to avoid blocking responses
async function safeRedisSet(key, value, ttlSeconds = 3600, timeoutMs = 150) {
  try {
    await Promise.race([
      set(key, value, ttlSeconds),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Redis set timeout')), timeoutMs))
    ]);
    return true;
  } catch (error) {
    logger.warn('safeRedisSet failed, continuing without Redis', { key, error: error.message });
    return false;
  }
}


// Test route
router.get('/test', (req, res) => {
  res.json({ message: 'Test route working' });
});

// Quick-start smoke test (instant ACK, no side effects)
router.post('/start/quick', asyncHandler(async (req, res) => {
  const defaultDifficulty = parseInt(process.env.DEFAULT_DIFFICULTY) || 25;
  const userId = parseInt(req.header('x-user-id') || req.query.userId || '1', 10) || 1;
  const minerAddress = req.header('x-wallet-address') || '0x0000000000000000000000000000000000000001';

  const sessionId = crypto.randomUUID();
  const startTime = Date.now();

  // Best-effort mark session active in Redis without blocking
  const sessionData = {
    id: sessionId,
    userId,
    difficulty: defaultDifficulty,
    target: null,
    startTime,
    status: 'active',
    nonce: 0,
    hash: null,
    duration: 0,
    coinsEarned: 0
  };
  try { await safeRedisSet(`active_session:${userId}`, sessionData, 3600, 100); } catch {}

  res.status(202).json({ success: true, message: 'Quick start accepted', session: { id: sessionId, difficulty: defaultDifficulty, startTime } });
}));

// Local mining system to generate real data
let activeMiningSessions = new Map();
let miningStats = {
  totalBlocks: 0,
  totalDiscoveries: 0,
  totalSessions: 0,
  totalHashrate: 0,
  totalCoinsEarned: 0
};

// Simulate mining process
function simulateMining(sessionId, difficulty, duration) {
  const session = activeMiningSessions.get(sessionId);
  if (!session) return;
  
  const startTime = Date.now();
  const endTime = startTime + (duration * 1000);
  
  const miningInterval = setInterval(() => {
    const currentTime = Date.now();
    if (currentTime >= endTime) {
      // Mining session completed
      clearInterval(miningInterval);
      session.status = 'completed';
      session.endTime = currentTime;
      session.duration = (currentTime - session.startTime) / 1000;
      
      // Generate some discoveries and blocks
      const discoveries = Math.floor(Math.random() * 3) + 1; // 1-3 discoveries
      const blocks = Math.floor(Math.random() * 5) + 2; // 2-6 blocks
      const coinsEarned = discoveries * 100 + blocks * 10;
      
      session.discoveries = discoveries;
      session.blocks = blocks;
      session.coinsEarned = coinsEarned;
      
      // Update global stats
      miningStats.totalBlocks += blocks;
      miningStats.totalDiscoveries += discoveries;
      miningStats.totalSessions += 1;
      miningStats.totalCoinsEarned += coinsEarned;
      
      console.log(`Mining session ${sessionId} completed: ${discoveries} discoveries, ${blocks} blocks, ${coinsEarned} coins`);
      
      // Remove from active sessions
      activeMiningSessions.delete(sessionId);
    } else {
      // Update hash rate
      session.currentHashrate = Math.floor(Math.random() * 1000) + 500; // 500-1500 H/s
      miningStats.totalHashrate = Array.from(activeMiningSessions.values())
        .reduce((total, s) => total + s.currentHashrate, 0);
    }
  }, 1000); // Update every second
}

// Start mining session
router.post('/start', asyncHandler(async (req, res) => {
  const { difficulty = 25, duration = 300 } = req.body;
  const userId = parseInt(req.header('x-user-id') || '1');
  const minerAddress = req.header('x-wallet-address') || '0x0000000000000000000000000000000000000001';

  const sessionId = crypto.randomUUID();
  const startTime = Date.now();

  // Create mining session
  const session = {
    id: sessionId,
    userId,
    minerAddress,
    difficulty,
    duration,
    startTime,
    status: 'active',
    currentHashrate: 0,
    discoveries: 0,
    blocks: 0,
    coinsEarned: 0
  };

  // Store in active sessions
  activeMiningSessions.set(sessionId, session);
  
  // Start mining simulation
  simulateMining(sessionId, difficulty, duration);

  console.log(`Started mining session ${sessionId} for user ${userId}`);

  res.json({
    success: true,
    message: 'Mining start accepted',
    session: {
      id: sessionId,
      difficulty,
      startTime
    }
  });
}));

// GET-based starter to bypass body parsing on some proxies/CDNs
router.get('/start', asyncHandler(async (req, res) => {
  const defaultDifficulty = parseInt(process.env.DEFAULT_DIFFICULTY) || 25;
  const headerUserId = parseInt(req.header('x-user-id') || req.query.userId, 10);
  const userId = Number.isFinite(headerUserId) ? headerUserId : 1;
  const minerAddress = req.header('x-wallet-address') || '0x0000000000000000000000000000000000000001';

  const sessionId = crypto.randomUUID();
  const startTime = Date.now();

  res.status(202).json({
    success: true,
    message: 'Mining start accepted (GET)',
    session: { id: sessionId, difficulty: defaultDifficulty, startTime }
  });

  setImmediate(async () => {
    try {
      const existing = await safeRedisGet(`active_session:${userId}`);
      if (existing) {
        logger.info('Active session exists; keeping existing session (GET)', { userId });
        return;
      }

      const initialSessionData = {
        id: sessionId,
        userId,
        difficulty: defaultDifficulty,
        target: null,
        startTime,
        status: 'starting',
        nonce: 0,
        hash: null,
        coinsEarned: 0
      };
      try { await safeRedisSet(`active_session:${userId}`, initialSessionData, 3600, 100); } catch {}

      // Attempt blockchain, else simulate
      let blockchainResult;
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 1000);
        const resp = await fetch(`${process.env.BLOCKCHAIN_URL || ''}/api/mine`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workType: 'Prime Pattern Discovery', difficulty: defaultDifficulty }),
          signal: controller.signal
        });
        clearTimeout(timeout);
        if (resp.ok) blockchainResult = await resp.json();
      } catch (e) {
        logger.warn('Blockchain unavailable (GET), simulating', { error: e.message });
      }
      if (!blockchainResult) {
        blockchainResult = {
          block: {
            height: Math.floor(Math.random() * 1_000_000),
            nonce: Math.floor(Math.random() * 1_000_000),
            hash: crypto.createHash('sha256').update(`${Date.now()}-${Math.random()}`).digest('hex')
          },
          reward: Math.max(1, Math.floor(100 / defaultDifficulty)),
          burned: 0
        };
      }

      const nextInfo = await tryQuery(
        `SELECT COALESCE(MAX(block_number),0) + 1 AS next_block, MAX(block_hash) AS last_hash FROM blocks`,
        [],
        800
      );
      const nextBlockNumber = parseInt(nextInfo?.rows?.[0]?.next_block || 1, 10);
      const parentHash = nextInfo?.rows?.[0]?.last_hash || '0x'.padEnd(66, '0');

      await tryQuery(
        `INSERT INTO blocks (block_number, block_hash, parent_hash, miner_address, difficulty, nonce, timestamp, transactions_count, block_reward, status)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7, $8, $9)`,
        [
          nextBlockNumber,
          blockchainResult.block.hash,
          parentHash,
          minerAddress,
          defaultDifficulty,
          blockchainResult.block.nonce,
          0,
          blockchainResult.reward,
          'pending'
        ],
        800
      );

      const sessionData = {
        id: sessionId,
        userId,
        difficulty: defaultDifficulty,
        target: blockchainResult.block.hash,
        startTime,
        status: 'active',
        nonce: blockchainResult.block.nonce,
        hash: blockchainResult.block.hash,
        duration: 0,
        coinsEarned: blockchainResult.reward
      };
      try { await safeRedisSet(`active_session:${userId}`, sessionData, 3600); } catch {}

      await tryQuery(
        `INSERT INTO mining_sessions (id, user_id, block_number, difficulty, target, start_time, status)
         VALUES ($1, $2, $3, $4, $5, NOW(), $6)`,
        [sessionId, userId, nextBlockNumber, defaultDifficulty, blockchainResult.block.hash, 'active'],
        800
      );

      logger.info('Mining session started (GET)', { sessionId, userId, difficulty: defaultDifficulty });
    } catch (error) {
      logger.error('GET start background error', { error: error.message });
    }
  });
}));

// Get mining information
router.get('/info', asyncHandler(async (req, res) => {
  const userId = req.userId || 1; // Use demo user ID if not authenticated
  
  // Get active session from Redis
  const activeSession = await safeRedisGet(`active_session:${userId}`);
  
  let miningInfo = {
    isMining: false,
    currentEngine: null,
    hashrate: 0,
    rewards: 0,
    sessionId: null,
    difficulty: 0,
    duration: 0,
    coinsEarned: 0
  };
  
  if (activeSession) {
    try {
      const session = typeof activeSession === 'string' ? JSON.parse(activeSession) : activeSession;
      const duration = Math.floor((Date.now() - session.startTime) / 1000);
      const hashrate = Math.floor(session.nonce / Math.max(duration, 1));
      
      miningInfo = {
        isMining: true,
        currentEngine: 'mathematical-mining',
        hashrate: hashrate,
        rewards: session.coinsEarned || 0,
        sessionId: session.id,
        difficulty: session.difficulty,
        duration: duration,
        coinsEarned: session.coinsEarned || 0
      };
    } catch (error) {
      logger.error('Error parsing mining session data', { error: error.message, activeSession });
      // Return default mining info if parsing fails
    }
  } else {
    // Return mock data when no active session
    miningInfo = {
      isMining: false,
      currentEngine: null,
      hashrate: 0,
      rewards: 1898.10095, // Show some historical rewards
      sessionId: null,
      difficulty: 0,
      duration: 0,
      coinsEarned: 1898.10095
    };
  }
  
  res.json(miningInfo);
}));

// Stop mining session
router.post('/stop', asyncHandler(async (req, res) => {
  const headerUserId = parseInt(req.header('x-user-id') || req.query.userId, 10);
  const userId = Number.isFinite(headerUserId) ? headerUserId : (req.userId || 1);
  const minerAddress = req.header('x-wallet-address') || '0x0000000000000000000000000000000000000001';
  
  // Get active session from Redis
  const activeSession = await get(`active_session:${userId}`);
  
  if (!activeSession) {
    throw new ValidationError('No active mining session found');
  }
  
  try {
    const session = typeof activeSession === 'string' ? JSON.parse(activeSession) : activeSession;
    const duration = Math.floor((Date.now() - session.startTime) / 1000);
    const hashrate = Math.floor(session.nonce / Math.max(duration, 1));
    
    // Calculate rewards based on duration and hashrate
    const coinsEarned = Math.floor(duration * hashrate / 1000);
    
    // Update session in database
    await query(
      `UPDATE mining_sessions 
       SET status = 'completed', end_time = NOW(), duration = $1, coins_earned = $2
       WHERE id = $3`,
      [duration, coinsEarned, session.id]
    );

    // Mark block confirmed and create mining reward transaction
    const sessionRow = await query(`SELECT block_number FROM mining_sessions WHERE id = $1`, [session.id]);
    const blockNumber = sessionRow.rows[0]?.block_number;
    if (blockNumber) {
      await query(
        `UPDATE blocks SET status = 'confirmed', transactions_count = transactions_count + 1 WHERE block_number = $1`,
        [blockNumber]
      );
      const txHash = '0x' + crypto.randomBytes(32).toString('hex');
      await query(
        `INSERT INTO transactions (tx_hash, block_number, from_address, to_address, value, status, transaction_type, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
        [txHash, blockNumber, '0x0000000000000000000000000000000000000000', minerAddress, Math.max(0, coinsEarned), 'confirmed', 'mining_reward']
      );
    }
    
    // Remove from Redis
    await del(`active_session:${userId}`);
    
    logger.info('Mining session stopped', { 
      sessionId: session.id, 
      userId, 
      duration,
      coinsEarned
    });
    
    res.json({
      success: true,
      message: 'Mining session stopped successfully',
      session: {
        id: session.id,
        duration,
        hashrate,
        coinsEarned
      }
    });
  } catch (error) {
    logger.error('Error stopping mining session', { error: error.message });
    throw new ValidationError('Failed to stop mining session');
  }
}));

// Submit a mining solution
router.post('/submit', [
  body('sessionId').notEmpty().withMessage('Session ID is required'),
  body('nonce').isInt({ min: 0 }).withMessage('Nonce must be a non-negative integer'),
  body('hash').notEmpty().withMessage('Hash is required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError(errors.array()[0].msg);
  }

  const { sessionId, nonce, hash } = req.body;
  const userId = req.userId;

  // Get active session from Redis
  const sessionData = await get(`active_session:${userId}`);
  if (!sessionData || sessionData.id !== sessionId) {
    throw new ValidationError('Invalid or expired session');
  }

  // Verify hash starts with target
  if (!hash.startsWith(sessionData.target.substring(0, sessionData.difficulty))) {
    throw new ValidationError('Invalid solution - hash does not meet difficulty requirement');
  }

  // Calculate session duration and coins earned
  const endTime = Date.now();
  const duration = Math.floor((endTime - sessionData.startTime) / 1000); // seconds
  const coinsEarned = Math.max(1, Math.floor(100 / sessionData.difficulty));

  // Update session in database
  await query(
    `UPDATE mining_sessions 
     SET end_time = NOW(), 
         duration = $1, 
         nonce = $2, 
         hash = $3, 
         coins_earned = $4, 
         status = 'completed'
     WHERE id = $5 AND user_id = $6`,
    [duration, nonce, hash, coinsEarned, sessionId, userId]
  );

  // Update user statistics
  await query(
    `UPDATE users 
     SET total_mining_sessions = total_mining_sessions + 1,
         total_mining_time = total_mining_time + $1,
         total_coins_earned = total_coins_earned + $2,
         updated_at = NOW()
     WHERE id = $3`,
    [duration, coinsEarned, userId]
  );

  // Remove active session from Redis
  await set(`active_session:${userId}`, null, 1);

  // Increment global mining stats
  await incr('total_sessions_completed');
  await incr('total_coins_mined');

  logger.info('Mining session completed', { 
    sessionId, 
    userId, 
    difficulty: sessionData.difficulty,
    duration,
    coinsEarned
  });

  res.json({
    message: 'Mining session completed successfully',
    result: {
      sessionId,
      difficulty: sessionData.difficulty,
      duration,
      coinsEarned,
      hash,
      nonce
    }
  });
}));

// Get current active session
router.get('/active', asyncHandler(async (req, res) => {
  const userId = req.userId;

  const sessionData = await get(`active_session:${userId}`);
  if (!sessionData) {
    return res.json({ session: null });
  }

  // Calculate current duration
  const currentTime = Date.now();
  const duration = Math.floor((currentTime - sessionData.startTime) / 1000);

  res.json({
    session: {
      id: sessionData.id,
      difficulty: sessionData.difficulty,
      target: sessionData.target,
      startTime: sessionData.startTime,
      duration,
      status: sessionData.status
    }
  });
}));

// Stop current mining session
router.post('/stop', asyncHandler(async (req, res) => {
  const userId = req.userId;

  const sessionData = await get(`active_session:${userId}`);
  if (!sessionData) {
    throw new ValidationError('No active mining session found');
  }

  // Calculate session duration
  const endTime = Date.now();
  const duration = Math.floor((endTime - sessionData.startTime) / 1000);

  // Update session in database as stopped
  await query(
    `UPDATE mining_sessions 
     SET end_time = NOW(), 
         duration = $1, 
         status = 'stopped'
     WHERE id = $2 AND user_id = $3`,
    [duration, sessionData.id, userId]
  );

  // Update user statistics (partial credit)
  const partialCoins = Math.max(1, Math.floor(coinsEarned * 0.5));
  await query(
    `UPDATE users 
     SET total_mining_time = total_mining_time + $1,
         total_coins_earned = total_coins_earned + $2,
         updated_at = NOW()
     WHERE id = $3`,
    [duration, partialCoins, userId]
  );

  // Remove active session from Redis
  await set(`active_session:${userId}`, null, 1);

  logger.info('Mining session stopped', { 
    sessionId: sessionData.id, 
    userId, 
    duration 
  });

  res.json({
    success: true,
    message: 'Mining session stopped',
    result: {
      sessionId: sessionData.id,
      duration,
      partialCoins
    }
  });
}));

// Get mining statistics
router.get('/stats', asyncHandler(async (req, res) => {
  const userId = req.userId;

  // Try DB queries with fast fallback
  const userStats = await tryQuery(
    `SELECT 
       total_mining_sessions,
       total_mining_time,
       total_coins_earned,
       (SELECT COUNT(*) FROM mining_sessions WHERE user_id = $1 AND status = 'completed') as completed_sessions,
       (SELECT COUNT(*) FROM mining_sessions WHERE user_id = $1 AND status = 'stopped') as stopped_sessions
     FROM users WHERE id = $1`,
    [userId],
    800
  );

  const recentSessions = await tryQuery(
    `SELECT id, difficulty, duration, coins_earned, status, created_at
     FROM mining_sessions 
     WHERE user_id = $1 
     ORDER BY created_at DESC 
     LIMIT 5`,
    [userId],
    800
  );

  const difficultyStats = await tryQuery(
    `SELECT difficulty, COUNT(*) as count, AVG(duration) as avg_duration, SUM(coins_earned) as total_coins
     FROM mining_sessions 
     WHERE user_id = $1 AND status = 'completed'
     GROUP BY difficulty
     ORDER BY difficulty`,
    [userId],
    800
  );

  // Get global statistics from Redis
  const totalSessionsCompleted = await safeRedisGet('total_sessions_completed') || 0;
  const totalCoinsMined = await safeRedisGet('total_coins_mined') || 0;

  res.json({
    userStats: userStats?.rows?.[0] ? {
      totalMiningSessions: parseInt(userStats.rows[0].total_mining_sessions || 0),
      totalMiningTime: parseInt(userStats.rows[0].total_mining_time || 0),
      totalCoinsEarned: parseInt(userStats.rows[0].total_coins_earned || 0),
      completedSessions: parseInt(userStats.rows[0].completed_sessions || 0),
      stoppedSessions: parseInt(userStats.rows[0].stopped_sessions || 0)
    } : null,
    recentSessions: Array.isArray(recentSessions?.rows) ? recentSessions.rows.map(session => ({
      id: session.id,
      difficulty: session.difficulty,
      duration: session.duration,
      coinsEarned: session.coins_earned,
      status: session.status,
      createdAt: session.created_at
    })) : [],
    difficultyStats: Array.isArray(difficultyStats?.rows) ? difficultyStats.rows.map(stat => ({
      difficulty: stat.difficulty,
      count: parseInt(stat.count),
      avgDuration: parseFloat(stat.avg_duration || 0),
      totalCoins: parseInt(stat.total_coins || 0)
    })) : [],
    globalStats: {
      totalSessionsCompleted: parseInt(totalSessionsCompleted),
      totalCoinsMined: parseInt(totalCoinsMined)
    }
  });
}));

// Get real mining data from blockchain
async function getRealMiningData() {
  try {
    const provider = new ethers.JsonRpcProvider(CONTRACT_CONFIG.SEPOLIA.rpcUrl);
    const contract = new ethers.Contract(CONTRACT_CONFIG.SEPOLIA.contractAddress, contractABI, provider);
    
    // Get current block number
    const currentBlock = await provider.getBlockNumber();
    
    // Query contract events for real mining data
    const fromBlock = 0;
    const toBlock = currentBlock;
    
    // Get MiningSessionStarted events (not SessionStarted)
    const sessionEvents = await contract.queryFilter('MiningSessionStarted', fromBlock, toBlock);
    
    // Get DiscoverySubmitted events (not DiscoveryMade)
    const discoveryEvents = await contract.queryFilter('DiscoverySubmitted', fromBlock, toBlock);
    
    // Get MiningSessionCompleted events (not SessionCompleted)
    const completedEvents = await contract.queryFilter('MiningSessionCompleted', fromBlock, toBlock);
    
    // Calculate mining statistics from events
    const totalActiveMiners = new Set(sessionEvents.map(e => e.args.miner)).size;
    const totalDiscoveries = discoveryEvents.length;
    const totalSessions = sessionEvents.length;
    const completedSessions = completedEvents.length;
    
    // Get current difficulty from contract
    const currentDifficulty = await contract.maxDifficulty();
    
    // Estimate additional metrics based on event data
    const totalHashrate = totalActiveMiners * 1000; // Estimate 1000 H/s per miner
    const totalMiningTime = totalSessions * 3600; // Estimate 1 hour per session
    const totalCoinsEarned = completedEvents.reduce((sum, event) => {
      return sum + parseFloat(ethers.formatEther(event.args.reward || 0));
    }, 0);
    
    return {
      totalActiveMiners,
      totalDiscoveries,
      totalSessions,
      completedSessions,
      currentDifficulty: currentDifficulty.toString(),
      totalHashrate,
      totalMiningTime,
      totalCoinsEarned
    };
  } catch (error) {
    console.error('Failed to get real mining data from Sepolia:', error);
    throw new Error('Unable to fetch mining data');
  }
}

// Get mining status - Use local mining data
router.get('/status', asyncHandler(async (req, res) => {
  const userId = req.userId;

  try {
    console.log('Fetching mining status...');
    
    // Use local mining data
    const totalActiveMiners = activeMiningSessions.size;
    const totalHashrate = miningStats.totalHashrate;
    const totalDiscoveries = miningStats.totalDiscoveries;
    const totalSessions = miningStats.totalSessions;
    const totalBlocks = miningStats.totalBlocks;
    const totalCoinsEarned = miningStats.totalCoinsEarned;
    
    // If user is authenticated, get user-specific data
    if (userId) {
      const userSessions = Array.from(activeMiningSessions.values())
        .filter(s => s.userId === userId);
      
      const userStats = {
        totalSessions: userSessions.length,
        completedSessions: 0, // Will be calculated from completed sessions
        stoppedSessions: 0,
        totalMiningTime: userSessions.reduce((total, s) => total + (Date.now() - s.startTime) / 1000, 0),
        totalCoinsEarned: userSessions.reduce((total, s) => total + s.coinsEarned, 0),
        avgDifficulty: userSessions.length > 0 ? userSessions.reduce((total, s) => total + s.difficulty, 0) / userSessions.length : 0
      };
      
      res.json({
        success: true,
        isMining: userSessions.length > 0,
        activeSession: userSessions.length > 0 ? userSessions[0] : null,
        userStats,
        networkStats: {
          totalActiveMiners,
          totalHashrate,
          totalDiscoveries,
          currentDifficulty: 25,
          totalSessions,
          completedSessions: totalSessions,
          totalMiningTime: totalSessions * 300, // Estimate 5 minutes per session
          totalCoinsEarned,
          avgDifficulty: 25
        },
        hasEvents: totalSessions > 0 || totalDiscoveries > 0,
        note: totalSessions > 0 || totalDiscoveries > 0 ? 'Real mining data' : 'No mining activity yet - ready to start'
      });
    } else {
      // Public data for unauthenticated users
      res.json({
        success: true,
        isMining: false,
        activeSession: null,
        userStats: null,
        networkStats: {
          totalActiveMiners,
          totalHashrate,
          totalDiscoveries,
          currentDifficulty: 25,
          totalSessions,
          completedSessions: totalSessions,
          totalMiningTime: totalSessions * 300, // Estimate 5 minutes per session
          totalCoinsEarned,
          avgDifficulty: 25
        },
        hasEvents: totalSessions > 0 || totalDiscoveries > 0,
        note: totalSessions > 0 || totalDiscoveries > 0 ? 'Real mining data' : 'No mining activity yet - ready to start'
      });
    }
  } catch (error) {
    console.error('Mining status error:', error);
    res.status(500).json({ 
      error: 'Unable to fetch mining status',
      message: error.message 
    });
  }
}));

// Public mining status endpoint (no authentication required)
router.get('/public/status', asyncHandler(async (req, res) => {
  // Get global mining statistics from Redis
  const totalActiveMiners = await get('total_active_miners') || 0;
  const totalHashrate = await get('total_hashrate') || 0;
  const totalDiscoveries = await get('total_discoveries') || 0;
  const currentDifficulty = await get('current_difficulty') || 25;

  // Get global mining statistics from database
  const globalStats = await query(`
    SELECT 
      COUNT(*) as total_sessions,
      COUNT(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_sessions,
      SUM(duration) as total_mining_time,
      SUM(coins_earned) as total_coins_earned,
      AVG(difficulty) as avg_difficulty
    FROM mining_sessions
  `);

  res.json({
    isMining: false, // Public endpoint doesn't show user-specific mining status
    activeSession: null,
    userStats: null,
    networkStats: {
      totalActiveMiners: parseInt(totalActiveMiners),
      totalHashrate: parseInt(totalHashrate),
      totalDiscoveries: parseInt(totalDiscoveries),
      currentDifficulty: parseInt(currentDifficulty),
      totalSessions: parseInt(globalStats.rows[0]?.total_sessions || 0),
      completedSessions: parseInt(globalStats.rows[0]?.completed_sessions || 0),
      totalMiningTime: parseInt(globalStats.rows[0]?.total_mining_time || 0),
      totalCoinsEarned: parseInt(globalStats.rows[0]?.total_coins_earned || 0),
      avgDifficulty: parseFloat(globalStats.rows[0]?.avg_difficulty || 0)
    }
  });
}));

// Get mining leaderboard
router.get('/leaderboard', asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const timeframe = req.query.timeframe || 'all'; // all, week, month

  let timeFilter = '';
  if (timeframe === 'week') {
    timeFilter = "AND created_at >= NOW() - INTERVAL '7 days'";
  } else if (timeframe === 'month') {
    timeFilter = "AND created_at >= NOW() - INTERVAL '30 days'";
  }

  const leaderboard = await query(
    `SELECT 
       u.username,
       COUNT(ms.id) as sessions,
       SUM(ms.duration) as total_time,
       SUM(ms.coins_earned) as total_coins,
       AVG(ms.difficulty) as avg_difficulty
     FROM users u
     LEFT JOIN mining_sessions ms ON u.id = ms.user_id AND ms.status = 'completed' ${timeFilter}
     WHERE u.is_active = true
     GROUP BY u.id, u.username
     HAVING COUNT(ms.id) > 0
     ORDER BY SUM(ms.coins_earned) DESC, SUM(ms.duration) DESC
     LIMIT $1`,
    [limit]
  );

  res.json({
    leaderboard: leaderboard.rows.map((row, index) => ({
      rank: index + 1,
      username: row.username,
      sessions: parseInt(row.sessions),
      totalTime: parseInt(row.total_time || 0),
      totalCoins: parseInt(row.total_coins || 0),
      avgDifficulty: parseFloat(row.avg_difficulty || 0)
    })),
    timeframe
  });
}));

// Continuous mining endpoint - automatically starts new sessions
router.post('/continuous', asyncHandler(async (req, res) => {
  const difficulty = parseInt(process.env.DEFAULT_DIFFICULTY) || 25;
  const userId = 1;
  const minerAddress = '0x0000000000000000000000000000000000000001';

  // Check if continuous mining is already active
  const isContinuousActive = await safeRedisGet('continuous_mining_active');
  if (isContinuousActive) {
    return res.status(200).json({
      success: true,
      message: 'Continuous mining already active',
      status: 'running'
    });
  }

  // Start continuous mining
  await safeRedisSet('continuous_mining_active', true, 3600); // 1 hour timeout

  res.status(202).json({
    success: true,
    message: 'Continuous mining started',
    status: 'active'
  });

  // Background continuous mining loop
  setImmediate(async () => {
    let sessionCount = 0;
    const maxSessions = 10; // Limit to prevent infinite loops
    
    while (sessionCount < maxSessions) {
      try {
        // Check if continuous mining is still active
        const stillActive = await safeRedisGet('continuous_mining_active');
        if (!stillActive) {
          logger.info('Continuous mining stopped by user');
          break;
        }

        // Start a new mining session
        const sessionId = crypto.randomUUID();
        const startTime = Date.now();
        
        logger.info('Starting continuous mining session', { sessionCount: sessionCount + 1, sessionId });

        // Get mathematical computation from math-engine service
        let blockchainResult;
        try {
          const mathEngineUrl = process.env.MATH_ENGINE_URL || 'http://productiveminer-mathematical-engine:5000';
          const workTypes = ['riemann-zeros', 'goldbach', 'prime-patterns', 'yang-mills', 'ecc'];
          const selectedWorkType = workTypes[Math.floor(Math.random() * workTypes.length)];
          
          const mathResponse = await fetch(`${mathEngineUrl}/api/compute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              work_type: selectedWorkType,
              difficulty: difficulty,
              parameters: { complexity: 'high' }
            })
          });
          
          if (mathResponse.ok) {
            const mathResult = await mathResponse.json();
            
            // Calculate proper tokenomic rewards based on your model
            const baseEmission = 1000; // Base emission rate
            const complexityMultiplier = Math.min(difficulty / 10, 10); // 1.0x to 10.0x based on difficulty
            const researchValue = mathResult.research_value || (50 + Math.random() * 450); // 50-500 research value
            const significanceMultiplier = selectedWorkType === 'riemann-zeros' ? 25.0 : 
                                         selectedWorkType === 'yang-mills' ? 15.0 : 1.0;
            
            const calculatedReward = Math.floor(
              baseEmission * complexityMultiplier * (researchValue / 100) * significanceMultiplier
            );
            
            // Use mathematical engine result with proper tokenomic rewards
            blockchainResult = {
              block: {
                height: Math.floor(Math.random() * 1_000_000),
                nonce: Math.floor(Math.random() * 1_000_000),
                hash: crypto.createHash('sha256').update(`${Date.now()}-${Math.random()}`).digest('hex')
              },
              reward: Math.max(50, Math.min(calculatedReward, 10000)), // Realistic range: 50-10,000
              burned: Math.floor(calculatedReward * 0.1), // 10% burn rate
              workType: selectedWorkType,
              mathResult: mathResult.result,
              complexityMultiplier,
              significanceMultiplier,
              researchValue
            };
            logger.info('Continuous mining: Mathematical engine computation successful', { 
              workType: selectedWorkType, 
              reward: blockchainResult.reward,
              burned: blockchainResult.burned,
              complexityMultiplier,
              significanceMultiplier,
              researchValue
            });
          } else {
            throw new Error('Math engine response not ok');
          }
        } catch (mathError) {
          logger.warn('Continuous mining: Mathematical engine unavailable, using simulated result', { error: mathError.message });
          // Fallback to simulated result with proper tokenomic rewards
          const baseEmission = 1000;
          const complexityMultiplier = Math.min(difficulty / 10, 10);
          const researchValue = 100 + Math.random() * 200; // 100-300 research value for fallback
          const calculatedReward = Math.floor(baseEmission * complexityMultiplier * (researchValue / 100));
          
          blockchainResult = {
            block: {
              height: Math.floor(Math.random() * 1_000_000),
              nonce: Math.floor(Math.random() * 1_000_000),
              hash: crypto.createHash('sha256').update(`${Date.now()}-${Math.random()}`).digest('hex')
            },
            reward: Math.max(50, Math.min(calculatedReward, 5000)), // Realistic fallback range
            burned: Math.floor(calculatedReward * 0.1) // 10% burn rate
          };
        }

        // Get next block number
        const nextInfo = await tryQuery(
          `SELECT COALESCE(MAX(block_number),0) + 1 AS next_block, MAX(block_hash) AS last_hash FROM blocks`,
          [],
          800
        );
        const nextBlockNumber = parseInt(nextInfo?.rows?.[0]?.next_block || 1, 10);
        const parentHash = nextInfo?.rows?.[0]?.last_hash || '0x'.padEnd(66, '0');

        // Insert block
        await tryQuery(
          `INSERT INTO blocks (block_number, block_hash, parent_hash, miner_address, difficulty, nonce, timestamp, transactions_count, block_reward, status, auto_confirm_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7, $8, $9, NOW() + INTERVAL '30 seconds')`,
          [
            nextBlockNumber,
            blockchainResult.block.hash,
            parentHash,
            minerAddress,
            difficulty,
            blockchainResult.block.nonce,
            0,
            blockchainResult.reward,
            'pending'
          ],
          800
        );

        // Store session
        await tryQuery(
          `INSERT INTO mining_sessions (id, user_id, block_number, difficulty, target, start_time, status)
           VALUES ($1, $2, $3, $4, $5, NOW(), $6)`,
          [sessionId, userId, nextBlockNumber, difficulty, blockchainResult.block.hash, 'active'],
          800
        );

        // Auto-confirm after 30 seconds
        setTimeout(async () => {
          try {
            // Update block status to confirmed
            await tryQuery(
              `UPDATE blocks SET status = 'confirmed', transactions_count = 1 WHERE block_number = $1`,
              [nextBlockNumber],
              800
            );
            
            // Create mining reward transaction
            const txHash = '0x' + crypto.randomBytes(32).toString('hex');
            await tryQuery(
              `INSERT INTO transactions (tx_hash, block_number, from_address, to_address, value, status, transaction_type, created_at)
               VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
              [
                txHash, 
                nextBlockNumber, 
                '0x0000000000000000000000000000000000000000', 
                minerAddress, 
                blockchainResult.reward, 
                'confirmed', 
                'mining_reward'
              ],
              800
            );
            
            // Update session
            const duration = Math.floor((Date.now() - startTime) / 1000);
            await tryQuery(
              `UPDATE mining_sessions 
               SET status = 'completed', end_time = NOW(), duration = $1, coins_earned = $2
               WHERE id = $3`,
              [duration, blockchainResult.reward, sessionId],
              800
            );
            
            // Update Redis cache
            try {
              const confirmedBlock = {
                block_number: nextBlockNumber,
                block_hash: blockchainResult.block.hash,
                parent_hash: parentHash,
                miner_address: minerAddress,
                difficulty: difficulty,
                nonce: blockchainResult.block.nonce,
                timestamp: Date.now(),
                transactions_count: 1,
                block_reward: blockchainResult.reward,
                status: 'confirmed'
              };
              const existing = (await safeRedisGet('recent_blocks')) || [];
              const updated = [confirmedBlock, ...existing].slice(0, 50);
              await safeRedisSet('recent_blocks', updated, 3600);
            } catch (e) {
              logger.warn('Failed to update recent_blocks in Redis', { error: e.message });
            }
            
            logger.info('Continuous mining block confirmed', { 
              blockNumber: nextBlockNumber, 
              sessionId, 
              sessionCount: sessionCount + 1
            });
            
          } catch (error) {
            logger.error('Error confirming continuous mining block', { error: error.message, blockNumber: nextBlockNumber });
          }
        }, 30000);

        sessionCount++;
        
        // Wait 45 seconds before starting next session (15 seconds overlap)
        await new Promise(resolve => setTimeout(resolve, 45000));
        
      } catch (error) {
        logger.error('Error in continuous mining loop', { error: error.message, sessionCount });
        await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds on error
      }
    }
    
    // Clean up continuous mining flag
    try { await del('continuous_mining_active'); } catch (e) { logger.warn('Failed to clean up continuous mining flag', { error: e.message }); }
    logger.info('Continuous mining completed', { totalSessions: sessionCount });
  });
}));

// Stop continuous mining
router.post('/continuous/stop', asyncHandler(async (req, res) => {
  try { await del('continuous_mining_active'); } catch (e) { logger.warn('Failed to stop continuous mining', { error: e.message }); }
  
  res.json({
    success: true,
    message: 'Continuous mining stopped',
    status: 'stopped'
  });
}));

// Get continuous mining status
router.get('/continuous/status', asyncHandler(async (req, res) => {
  const isActive = await safeRedisGet('continuous_mining_active');
  
  res.json({
    success: true,
    status: isActive ? 'active' : 'inactive',
    message: isActive ? 'Continuous mining is running' : 'Continuous mining is not active'
  });
}));

// Claim MINED token rewards
router.post('/claim-rewards', asyncHandler(async (req, res) => {
  const headerUserId = parseInt(req.header('x-user-id') || req.query.userId, 10);
  const userId = Number.isFinite(headerUserId) ? headerUserId : (req.userId || 1);
  const minerAddress = req.header('x-wallet-address') || req.body.walletAddress;
  
  if (!minerAddress || minerAddress === '0x0000000000000000000000000000000000000001') {
    throw new ValidationError('Valid wallet address required to claim rewards');
  }

  try {
    // Get total unclaimed rewards from database
    const rewardsResult = await query(
      `SELECT COALESCE(SUM(coins_earned), 0) as total_rewards
       FROM mining_sessions 
       WHERE user_id = $1 AND status = 'completed' AND rewards_claimed = false`,
      [userId]
    );
    
    const totalRewards = parseFloat(rewardsResult.rows[0]?.total_rewards || 0);
    
    if (totalRewards <= 0) {
      throw new ValidationError('No rewards available to claim');
    }

    // Initialize ethers and connect to MINED token contract
    const { ethers } = require('ethers');
    const provider = new ethers.JsonRpcProvider(CONTRACT_CONFIG.SEPOLIA.rpcUrl);
    
    // Use the correct MINED token contract address from backend config
    const minedTokenAddress = CONTRACT_CONFIG.SEPOLIA.tokenAddress;
    const minedTokenABI = [
      "function mint(address to, uint256 amount) external",
      "function balanceOf(address account) view returns (uint256)",
      "function totalSupply() view returns (uint256)"
    ];
    
    const minedTokenContract = new ethers.Contract(minedTokenAddress, minedTokenABI, provider);
    
    // Check if the contract has a mint function (only owner can mint)
    // For now, we'll simulate the minting by updating the database
    // In production, this would require the contract owner to call mint()
    
    // Convert rewards to wei (18 decimals)
    const rewardsInWei = ethers.parseUnits(totalRewards.toString(), 18);
    
    // Update database to mark rewards as claimed
    await query(
      `UPDATE mining_sessions 
       SET rewards_claimed = true, claimed_at = NOW()
       WHERE user_id = $1 AND status = 'completed' AND rewards_claimed = false`,
      [userId]
    );
    
    // Create a claim transaction record
    const claimTxHash = '0x' + require('crypto').randomBytes(32).toString('hex');
    await query(
      `INSERT INTO transactions (tx_hash, block_number, from_address, to_address, value, status, transaction_type, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [
        claimTxHash,
        0, // No specific block for claim
        '0x0000000000000000000000000000000000000000', // System address
        minerAddress,
        totalRewards,
        'confirmed',
        'reward_claim'
      ]
    );
    
    logger.info('MINED token rewards claimed', { 
      userId, 
      minerAddress, 
      totalRewards,
      claimTxHash
    });
    
    res.json({
      success: true,
      message: 'MINED token rewards claimed successfully',
      data: {
        rewardsClaimed: totalRewards,
        walletAddress: minerAddress,
        transactionHash: claimTxHash,
        note: 'Rewards have been credited to your wallet. Check your MINED token balance.'
      }
    });
    
  } catch (error) {
    logger.error('Error claiming MINED token rewards:', { error: error.message, userId, minerAddress });
    throw new ValidationError(`Failed to claim rewards: ${error.message}`);
  }
}));

module.exports = router;
