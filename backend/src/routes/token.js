const express = require('express');
const { query } = require('../database/connection');
const { get, set } = require('../database/redis');
const { asyncHandler } = require('../middleware/errorHandler');
const winston = require('winston');

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

const router = express.Router();

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: '/app/logs/token.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// Get token data
router.get('/data', asyncHandler(async (req, res) => {
  // Get token data from Redis or return default
  const tokenData = await safeRedisGet('token_data') || {
    name: 'MINED',
    symbol: 'MINED',
    totalSupply: 1000000000,
    circulatingSupply: 750000000,
    marketCap: 1500000000,
    price: 2.0,
    volume24h: 50000000,
    change24h: 5.2,
    holders: 12500,
    transactions: 45000,
    stakingAPY: 12.5,
    miningRewards: 25000000,
    researchFund: 50000000,
    treasury: 100000000,
    distribution: {
      mining: 40,
      staking: 25,
      research: 15,
      treasury: 10,
      team: 5,
      community: 5
    }
  };

  res.json(tokenData);
}));

// Get tokenomics
router.get('/tokenomics', asyncHandler(async (req, res) => {
  // Get tokenomics from Redis or return default
  const tokenomics = await safeRedisGet('tokenomics') || {
    totalSupply: 1000000000,
    initialDistribution: {
      mining: 400000000,
      staking: 250000000,
      research: 150000000,
      treasury: 100000000,
      team: 50000000,
      community: 50000000
    },
    vestingSchedule: {
      team: {
        total: 50000000,
        vested: 10000000,
        vestingPeriod: '4 years',
        cliff: '1 year'
      },
      community: {
        total: 50000000,
        vested: 25000000,
        vestingPeriod: '2 years',
        cliff: '6 months'
      }
    },
    inflationRate: 5.0,
    deflationaryMechanisms: [
      'Research fund allocation',
      'Staking rewards',
      'Treasury management'
    ],
    utility: [
      'Mining rewards',
      'Staking participation',
      'Research funding',
      'Governance voting',
      'Network fees'
    ]
  };

  res.json(tokenomics);
}));

module.exports = router;
