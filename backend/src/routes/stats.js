const express = require('express');
const { query, safeQuery, isDatabaseAvailable } = require('../database/connection');
const { get, hgetall } = require('../database/redis');
const { asyncHandler, NotFoundError } = require('../middleware/errorHandler');
const { requireAdmin } = require('../middleware/auth');
const winston = require('winston');
const path = require('path');
const { ethers } = require('ethers');

const router = express.Router();

// Use relative path for logs in development, absolute path in production
const logDir = process.env.NODE_ENV === 'production' ? '/app/logs' : './logs';
const statsLogPath = path.join(logDir, 'stats.log');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: statsLogPath })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// MINED Token ABI (simplified for stats)
const MINED_TOKEN_ABI = [
  { "constant": true, "inputs": [], "name": "totalSupply", "outputs": [{"name": "", "type": "uint256"}], "type": "function" },
  { "constant": true, "inputs": [], "name": "name", "outputs": [{"name": "", "type": "string"}], "type": "function" },
  { "constant": true, "inputs": [], "name": "symbol", "outputs": [{"name": "", "type": "string"}], "type": "function" },
  { "constant": true, "inputs": [], "name": "decimals", "outputs": [{"name": "", "type": "uint8"}], "type": "function" }
];

// Get real-time stats from Aurora database and blockchain
router.get('/dashboard', asyncHandler(async (req, res) => {
  try {
    console.log('📊 Getting real-time stats from Aurora and blockchain...');
    
    // Check database connection
    const dbAvailable = await isDatabaseAvailable();
    if (!dbAvailable) {
      console.log('⚠️ Database not available, using fallback data');
      return res.json({
        success: false,
        message: 'Database temporarily unavailable',
        data: getFallbackStats()
      });
    }

    // Get real data from Aurora database
    const discoveriesData = await safeQuery(`
      SELECT 
        COUNT(*) as total_discoveries,
        COALESCE(SUM(CAST(research_value AS DECIMAL(18,8))), 0) as total_research_value,
        COALESCE(AVG(CAST(complexity AS INT)), 0) as avg_complexity,
        COUNT(CASE WHEN validation_status = 'validated' THEN 1 END) as validated_discoveries
      FROM discoveries
    `, [], { rows: [{ total_discoveries: 0, total_research_value: 0, avg_complexity: 0, validated_discoveries: 0 }] });

    // Get mining sessions data
    const miningData = await safeQuery(`
      SELECT 
        COUNT(*) as total_sessions,
        COUNT(CASE WHEN is_completed = true THEN 1 END) as completed_sessions,
        COALESCE(SUM(duration), 0) as total_mining_time,
        COALESCE(AVG(CAST(difficulty AS INT)), 0) as avg_difficulty,
        COALESCE(AVG(duration), 0) as avg_session_duration
      FROM mining_sessions
    `, [], { rows: [{ total_sessions: 0, completed_sessions: 0, total_mining_time: 0, avg_difficulty: 0, avg_session_duration: 0 }] });

    // Get network metrics
    const networkData = await safeQuery(`
      SELECT 
        active_miners,
        discoveries_per_hour,
        total_research_value,
        total_burned_tokens,
        timestamp
      FROM network_metrics
      ORDER BY timestamp DESC
      LIMIT 1
    `, [], { rows: [{ active_miners: 0, discoveries_per_hour: 0, total_research_value: 0, total_burned_tokens: 0, timestamp: new Date() }] });

    // Get validators count
    const validatorsData = await safeQuery(`
      SELECT COUNT(*) as total_validators
      FROM validators
      WHERE is_active = true
    `, [], { rows: [{ total_validators: 0 }] });

    // Get real blockchain data from MINED token contract
    let blockchainData = null;
    try {
      const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/EsD9nEjl3rvwE35tYtTZC');
      const tokenContract = new ethers.Contract(process.env.MINED_TOKEN_ADDRESS || '0xf7b687854bA99B4Acafa509Fc42105B2a21369A7', MINED_TOKEN_ABI, provider);
      
      const [totalSupply, name, symbol, decimals, currentBlock] = await Promise.all([
        tokenContract.totalSupply(),
        tokenContract.name(),
        tokenContract.symbol(),
        tokenContract.decimals(),
        provider.getBlockNumber()
      ]);

      blockchainData = {
        totalSupply: parseFloat(ethers.formatEther(totalSupply)),
        name,
        symbol,
        decimals: parseInt(decimals),
        currentBlock,
        contractAddress: process.env.MINED_TOKEN_ADDRESS
      };
    } catch (error) {
      console.error('❌ Failed to get blockchain data:', error.message);
      blockchainData = {
        totalSupply: 999999999.999999999999995497, // From Etherscan
        name: 'MINED Token',
        symbol: 'MINED',
        decimals: 18,
        currentBlock: 0,
        contractAddress: process.env.MINED_TOKEN_ADDRESS,
        note: 'Using cached data - blockchain connection failed'
      };
    }

    const discoveries = discoveriesData.rows[0];
    const mining = miningData.rows[0];
    const network = networkData.rows[0];
    const validators = validatorsData.rows[0];

    // Return real data from Aurora and blockchain
    const realStats = {
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        discoveries: {
          total: parseInt(discoveries.total_discoveries || 0),
          validated: parseInt(discoveries.validated_discoveries || 0),
          totalResearchValue: parseFloat(discoveries.total_research_value || 0),
          avgComplexity: parseFloat(discoveries.avg_complexity || 0)
        },
        mining: {
          totalSessions: parseInt(mining.total_sessions || 0),
          completedSessions: parseInt(mining.completed_sessions || 0),
          totalMiningTime: parseInt(mining.total_mining_time || 0),
          avgDifficulty: parseFloat(mining.avg_difficulty || 0),
          avgSessionDuration: parseFloat(mining.avg_session_duration || 0)
        },
        network: {
          activeMiners: parseInt(network.active_miners || 0),
          discoveriesPerHour: parseFloat(network.discoveries_per_hour || 0),
          totalResearchValue: parseFloat(network.total_research_value || 0),
          totalBurnedTokens: parseFloat(network.total_burned_tokens || 0)
        },
        validators: {
          total: parseInt(validators.total_validators || 0)
        },
        blockchain: blockchainData
      },
      source: 'Aurora RDS + Blockchain'
    };

    console.log('✅ Real stats retrieved successfully');
    res.json(realStats);

  } catch (error) {
    console.error('❌ Error getting real stats:', error);
    res.json({
      success: false,
      message: 'Failed to get real-time stats',
      data: getFallbackStats(),
      error: error.message
    });
  }
}));

// Get general stats endpoint
router.get('/', asyncHandler(async (req, res) => {
  try {
    console.log('📊 Getting general stats from Aurora...');
    
    // Check database connection
    const dbAvailable = await isDatabaseAvailable();
    if (!dbAvailable) {
      console.log('⚠️ Database not available, using fallback data');
      return res.json(getFallbackStats());
    }

    // Get real data from Aurora database
    const discoveriesData = await safeQuery(`
      SELECT 
        COUNT(*) as total_discoveries,
        COALESCE(SUM(CAST(research_value AS DECIMAL(18,8))), 0) as total_research_value,
        COALESCE(AVG(CAST(complexity AS INT)), 0) as avg_complexity,
        COUNT(CASE WHEN validation_status = 'validated' THEN 1 END) as validated_discoveries
      FROM discoveries
    `, [], { rows: [{ total_discoveries: 0, total_research_value: 0, avg_complexity: 0, validated_discoveries: 0 }] });

    // Get mining sessions data
    const miningData = await safeQuery(`
      SELECT 
        COUNT(*) as total_sessions,
        COUNT(CASE WHEN is_completed = true THEN 1 END) as completed_sessions,
        COALESCE(SUM(duration), 0) as total_mining_time,
        COALESCE(AVG(CAST(difficulty AS INT)), 0) as avg_difficulty,
        COALESCE(AVG(duration), 0) as avg_session_duration
      FROM mining_sessions
    `, [], { rows: [{ total_sessions: 0, completed_sessions: 0, total_mining_time: 0, avg_difficulty: 0, avg_session_duration: 0 }] });

    // Get network metrics
    const networkData = await safeQuery(`
      SELECT 
        active_miners,
        discoveries_per_hour,
        total_research_value,
        total_burned_tokens,
        timestamp
      FROM network_metrics
      ORDER BY timestamp DESC
      LIMIT 1
    `, [], { rows: [{ active_miners: 0, discoveries_per_hour: 0, total_research_value: 0, total_burned_tokens: 0, timestamp: new Date() }] });

    // Get validators count
    const validatorsData = await safeQuery(`
      SELECT COUNT(*) as total_validators
      FROM validators
      WHERE is_active = true
    `, [], { rows: [{ total_validators: 0 }] });

    // Get blockchain data
    let blockchainData = null;
    try {
      const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/EsD9nEjl3rvwE35tYtTZC');
      const tokenContract = new ethers.Contract(process.env.MINED_TOKEN_ADDRESS || '0xf7b687854bA99B4Acafa509Fc42105B2a21369A7', MINED_TOKEN_ABI, provider);
      
      const [totalSupply, currentBlock] = await Promise.all([
        tokenContract.totalSupply(),
        provider.getBlockNumber()
      ]);

      blockchainData = {
        totalSupply: parseFloat(ethers.formatEther(totalSupply)),
        totalBurned: parseFloat(networkData.rows[0].total_burned_tokens || 0),
        totalResearchValue: parseFloat(networkData.rows[0].total_research_value || 0),
        totalValidators: parseInt(validatorsData.rows[0].total_validators || 0),
        currentEmission: parseFloat(networkData.rows[0].discoveries_per_hour || 0),
        discoveryEvents: parseInt(discoveriesData.rows[0].total_discoveries || 0),
        validatorEvents: parseInt(validatorsData.rows[0].total_validators || 0),
        stakingEvents: 0,
        currentBlock: currentBlock
      };
    } catch (error) {
      console.error('❌ Failed to get blockchain data:', error.message);
      blockchainData = {
        totalSupply: 999999999.999999999999995497,
        totalBurned: parseFloat(networkData.rows[0].total_burned_tokens || 0),
        totalResearchValue: parseFloat(networkData.rows[0].total_research_value || 0),
        totalValidators: parseInt(validatorsData.rows[0].total_validators || 0),
        currentEmission: parseFloat(networkData.rows[0].discoveries_per_hour || 0),
        discoveryEvents: parseInt(discoveriesData.rows[0].total_discoveries || 0),
        validatorEvents: parseInt(validatorsData.rows[0].total_validators || 0),
        stakingEvents: 0,
        currentBlock: 0,
        note: 'Using cached blockchain data'
      };
    }

    const discoveries = discoveriesData.rows[0];
    const mining = miningData.rows[0];
    const network = networkData.rows[0];
    const validators = validatorsData.rows[0];

    const statsData = {
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        discoveries: {
          total: parseInt(discoveries.total_discoveries || 0),
          validated: parseInt(discoveries.validated_discoveries || 0),
          totalResearchValue: parseFloat(discoveries.total_research_value || 0),
          avgComplexity: parseFloat(discoveries.avg_complexity || 0)
        },
        mining: {
          totalSessions: parseInt(mining.total_sessions || 0),
          completedSessions: parseInt(mining.completed_sessions || 0),
          totalMiningTime: parseInt(mining.total_mining_time || 0),
          avgDifficulty: parseFloat(mining.avg_difficulty || 0),
          avgSessionDuration: parseFloat(mining.avg_session_duration || 0)
        },
        network: {
          activeMiners: parseInt(network.active_miners || 0),
          discoveriesPerHour: parseFloat(network.discoveries_per_hour || 0),
          totalResearchValue: parseFloat(network.total_research_value || 0),
          totalBurnedTokens: parseFloat(network.total_burned_tokens || 0)
        },
        validators: {
          total: parseInt(validators.total_validators || 0)
        },
        blockchain: blockchainData
      },
      source: 'Aurora RDS + Blockchain'
    };

    console.log('✅ General stats retrieved successfully');
    res.json(statsData);

  } catch (error) {
    console.error('❌ Error getting general stats:', error);
    res.json({
      success: false,
      message: 'Failed to get general stats',
      data: getFallbackStats(),
      error: error.message
    });
  }
}));

// Get dashboard data - Main endpoint for frontend
router.get('/dashboard', asyncHandler(async (req, res) => {
  try {
    console.log('📊 Getting dashboard data from Aurora...');
    
    // Check database connection
    const dbAvailable = await isDatabaseAvailable();
    if (!dbAvailable) {
      console.log('⚠️ Database not available, using fallback data');
      return res.json(getFallbackDashboardData());
    }

    // Get real discoveries data
    const discoveriesData = await safeQuery(`
      SELECT 
        COUNT(*) as total_discoveries,
        COALESCE(SUM(CAST(research_value AS DECIMAL(18,8))), 0) as total_research_value,
        COALESCE(AVG(CAST(complexity AS INT)), 0) as avg_complexity,
        COUNT(CASE WHEN validation_status = 'validated' THEN 1 END) as validated_discoveries
      FROM discoveries
    `, [], { rows: [{ total_discoveries: 0, total_research_value: 0, avg_complexity: 0, validated_discoveries: 0 }] });

    // Get mining sessions data
    const miningData = await safeQuery(`
      SELECT 
        COUNT(*) as total_sessions,
        COUNT(CASE WHEN is_completed = true THEN 1 END) as completed_sessions,
        COALESCE(SUM(duration), 0) as total_mining_time,
        COALESCE(AVG(CAST(difficulty AS INT)), 0) as avg_difficulty,
        COALESCE(AVG(duration), 0) as avg_session_duration
      FROM mining_sessions
    `, [], { rows: [{ total_sessions: 0, completed_sessions: 0, total_mining_time: 0, avg_difficulty: 0, avg_session_duration: 0 }] });

    // Get network metrics
    const networkData = await safeQuery(`
      SELECT 
        active_miners,
        discoveries_per_hour,
        total_research_value,
        total_burned_tokens,
        bit_strength,
        security_enhancement_rate
      FROM network_metrics
      ORDER BY timestamp DESC
      LIMIT 1
    `, [], { rows: [{ active_miners: 0, discoveries_per_hour: 0, total_research_value: 0, total_burned_tokens: 0, bit_strength: 256, security_enhancement_rate: 0.0001 }] });

    // Get validators count
    const validatorsData = await safeQuery(`
      SELECT COUNT(*) as total_validators
      FROM validators
      WHERE is_active = true
    `, [], { rows: [{ total_validators: 0 }] });

    // Get blockchain data
    let blockchainData = null;
    try {
      const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/EsD9nEjl3rvwE35tYtTZC');
      const tokenContract = new ethers.Contract(process.env.MINED_TOKEN_ADDRESS || '0xf7b687854bA99B4Acafa509Fc42105B2a21369A7', MINED_TOKEN_ABI, provider);
      
      const [totalSupply, currentBlock] = await Promise.all([
        tokenContract.totalSupply(),
        provider.getBlockNumber()
      ]);

      blockchainData = {
        totalSupply: parseFloat(ethers.formatEther(totalSupply)),
        totalBurned: parseFloat(networkData.rows[0].total_burned_tokens || 0),
        totalResearchValue: parseFloat(networkData.rows[0].total_research_value || 0),
        totalValidators: parseInt(validatorsData.rows[0].total_validators || 0),
        currentEmission: parseFloat(networkData.rows[0].discoveries_per_hour || 0),
        discoveryEvents: parseInt(discoveriesData.rows[0].total_discoveries || 0),
        validatorEvents: parseInt(validatorsData.rows[0].total_validators || 0),
        stakingEvents: 0,
        currentBlock: currentBlock
      };
    } catch (error) {
      console.error('❌ Failed to get blockchain data:', error.message);
      blockchainData = {
        totalSupply: 999999999.999999999999995497,
        totalBurned: parseFloat(networkData.rows[0].total_burned_tokens || 0),
        totalResearchValue: parseFloat(networkData.rows[0].total_research_value || 0),
        totalValidators: parseInt(validatorsData.rows[0].total_validators || 0),
        currentEmission: parseFloat(networkData.rows[0].discoveries_per_hour || 0),
        discoveryEvents: parseInt(discoveriesData.rows[0].total_discoveries || 0),
        validatorEvents: parseInt(validatorsData.rows[0].total_validators || 0),
        stakingEvents: 0,
        currentBlock: 0,
        note: 'Using cached blockchain data'
      };
    }

    const discoveries = discoveriesData.rows[0];
    const mining = miningData.rows[0];
    const network = networkData.rows[0];
    const validators = validatorsData.rows[0];

    const dashboardData = {
      success: true,
      users: {
        total: 0, // No users table in current schema
        active: 0,
        newThisWeek: 0,
        newThisMonth: 0
      },
      mining: {
        totalSessions: parseInt(mining.total_sessions || 0),
        completedSessions: parseInt(mining.completed_sessions || 0),
        stoppedSessions: 0,
        totalMiningTime: parseInt(mining.total_mining_time || 0),
        totalCoinsEarned: 0,
        avgDifficulty: parseFloat(mining.avg_difficulty || 0),
        avgSessionDuration: parseFloat(mining.avg_session_duration || 0)
      },
      activeMiners: parseInt(network.active_miners || 0),
      research: {
        totalPapers: parseInt(discoveries.total_discoveries || 0),
        totalDiscoveries: parseInt(discoveries.total_discoveries || 0),
        totalCitations: parseFloat(discoveries.total_research_value || 0),
        avgComplexity: parseFloat(discoveries.avg_complexity || 0)
      },
      blockchain: blockchainData,
      redis: {},
      note: "Using real data from Aurora database and blockchain"
    };

    console.log('✅ Dashboard data retrieved successfully');
    res.json(dashboardData);

  } catch (error) {
    console.error('❌ Error getting dashboard data:', error);
    res.json(getFallbackDashboardData());
  }
}));

// Fallback functions
function getFallbackStats() {
  return {
    discoveries: { total: 0, validated: 0, totalResearchValue: 0, avgComplexity: 0 },
    mining: { totalSessions: 0, completedSessions: 0, totalMiningTime: 0, avgDifficulty: 0, avgSessionDuration: 0 },
    network: { activeMiners: 0, discoveriesPerHour: 0, totalResearchValue: 0, totalBurnedTokens: 0 },
    validators: { total: 0 },
    blockchain: {
      totalSupply: 999999999.999999999999995497,
      name: 'MINED Token',
      symbol: 'MINED',
      decimals: 18,
      currentBlock: 0,
      contractAddress: process.env.MINED_TOKEN_ADDRESS
    }
  };
}

function getFallbackDashboardData() {
  return {
    success: false,
    users: { total: 0, active: 0, newThisWeek: 0, newThisMonth: 0 },
    mining: { totalSessions: 0, completedSessions: 0, stoppedSessions: 0, totalMiningTime: 0, totalCoinsEarned: 0, avgDifficulty: 0, avgSessionDuration: 0 },
    activeMiners: 0,
    research: { totalPapers: 0, totalDiscoveries: 0, totalCitations: 0, avgComplexity: 0 },
    blockchain: {
      totalSupply: 999999999.999999999999995497,
      totalBurned: 0,
      totalResearchValue: 0,
      totalValidators: 0,
      currentEmission: 0,
      discoveryEvents: 0,
      validatorEvents: 0,
      stakingEvents: 0,
      currentBlock: 0
    },
    redis: {},
    note: "Using fallback data - database unavailable"
  };
}

// User stats endpoint
router.get('/user/:address', asyncHandler(async (req, res) => {
  try {
    const userAddress = req.params.address;
    console.log(`📊 Getting user stats for address: ${userAddress}`);
    
    // Check database connection
    const dbAvailable = await isDatabaseAvailable();
    if (!dbAvailable) {
      console.log('⚠️ Database not available, using fallback user data');
      return res.json({
        success: false,
        message: 'Database temporarily unavailable',
        data: getFallbackUserStats(userAddress)
      });
    }

    // Get user's mining sessions
    const userMiningData = await safeQuery(`
      SELECT 
        COUNT(*) as total_sessions,
        COUNT(CASE WHEN is_completed = true THEN 1 END) as completed_sessions,
        COALESCE(SUM(duration), 0) as total_mining_time,
        COALESCE(AVG(CAST(difficulty AS INT)), 0) as avg_difficulty,
        COALESCE(SUM(CAST(coins_earned AS DECIMAL(18,8))), 0) as total_coins_earned
      FROM mining_sessions
      WHERE user_address = $1
    `, [userAddress], { rows: [{ total_sessions: 0, completed_sessions: 0, total_mining_time: 0, avg_difficulty: 0, total_coins_earned: 0 }] });

    // Get user's discoveries
    const userDiscoveriesData = await safeQuery(`
      SELECT 
        COUNT(*) as total_discoveries,
        COUNT(CASE WHEN validation_status = 'validated' THEN 1 END) as validated_discoveries,
        COALESCE(SUM(CAST(research_value AS DECIMAL(18,8))), 0) as total_research_value,
        COALESCE(AVG(CAST(complexity AS INT)), 0) as avg_complexity
      FROM discoveries
      WHERE researcher_address = $1
    `, [userAddress], { rows: [{ total_discoveries: 0, validated_discoveries: 0, total_research_value: 0, avg_complexity: 0 }] });

    // Get user's staking info (if staking table exists)
    const userStakingData = await safeQuery(`
      SELECT 
        COALESCE(SUM(CAST(staked_amount AS DECIMAL(18,8))), 0) as total_staked,
        COUNT(*) as staking_positions
      FROM users
      WHERE wallet_address = $1
    `, [userAddress], { rows: [{ total_staked: 0, staking_positions: 0 }] });

    const mining = userMiningData.rows[0];
    const discoveries = userDiscoveriesData.rows[0];
    const staking = userStakingData.rows[0];

    const userStats = {
      success: true,
      address: userAddress,
      mining: {
        totalSessions: parseInt(mining.total_sessions || 0),
        completedSessions: parseInt(mining.completed_sessions || 0),
        totalMiningTime: parseInt(mining.total_mining_time || 0),
        totalCoinsEarned: parseFloat(mining.total_coins_earned || 0),
        avgDifficulty: parseFloat(mining.avg_difficulty || 0)
      },
      discoveries: {
        total: parseInt(discoveries.total_discoveries || 0),
        validated: parseInt(discoveries.validated_discoveries || 0),
        totalResearchValue: parseFloat(discoveries.total_research_value || 0),
        avgComplexity: parseFloat(discoveries.avg_complexity || 0)
      },
      staking: {
        totalStaked: parseFloat(staking.total_staked || 0),
        positions: parseInt(staking.staking_positions || 0)
      },
      timestamp: new Date().toISOString()
    };

    console.log('✅ User stats retrieved successfully');
    res.json(userStats);

  } catch (error) {
    console.error('❌ Error getting user stats:', error);
    res.json(getFallbackUserStats(req.params.address));
  }
}));

// Fallback user stats function
function getFallbackUserStats(address) {
  return {
    success: false,
    address: address,
    mining: { totalSessions: 0, completedSessions: 0, totalMiningTime: 0, totalCoinsEarned: 0, avgDifficulty: 0 },
    discoveries: { total: 0, validated: 0, totalResearchValue: 0, avgComplexity: 0 },
    staking: { totalStaked: 0, positions: 0 },
    timestamp: new Date().toISOString(),
    note: "Using fallback data - database unavailable"
  };
}

// Health check endpoint
router.get('/health', asyncHandler(async (req, res) => {
  const dbAvailable = await isDatabaseAvailable();
  res.json({
    status: 'healthy',
    database: dbAvailable ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
}));

module.exports = router;
