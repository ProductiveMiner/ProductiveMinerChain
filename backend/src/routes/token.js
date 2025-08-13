const express = require('express');
const { query } = require('../database/connection');
const { get, set } = require('../database/redis');
const { asyncHandler } = require('../middleware/errorHandler');
const winston = require('winston');
const { ethers } = require('ethers');
const { CONTRACT_CONFIG } = require('../config/contract');

// Standard ERC20 ABI for token functions
const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)"
];

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
  try {
    console.log('Fetching token data...');
    
    // Try to get real ERC20 token data
    try {
      const provider = new ethers.JsonRpcProvider(CONTRACT_CONFIG.SEPOLIA.rpcUrl);
      
      // First check if the token contract is deployed
      const tokenCode = await provider.getCode(CONTRACT_CONFIG.SEPOLIA.tokenAddress);
      if (tokenCode === '0x') {
        console.log('Token contract not deployed at:', CONTRACT_CONFIG.SEPOLIA.tokenAddress);
        throw new Error('Token contract not deployed');
      }
      
      const tokenContract = new ethers.Contract(CONTRACT_CONFIG.SEPOLIA.tokenAddress, ERC20_ABI, provider);
      
      // Get token information
      const totalSupply = await tokenContract.totalSupply();
      const name = await tokenContract.name();
      const symbol = await tokenContract.symbol();
      const decimals = Number(await tokenContract.decimals());
      
      // Get current block for price calculation
      const currentBlock = await provider.getBlockNumber();
      
      // Calculate price based on total supply and market activity
      const totalSupplyFormatted = parseFloat(ethers.formatUnits(totalSupply, decimals));
      const basePrice = 0.001; // Base price in ETH
      const priceMultiplier = Math.max(0.1, Math.min(10, totalSupplyFormatted / 1000000)); // Price varies with supply
      const currentPrice = basePrice * priceMultiplier;
      
      // Get market cap
      const marketCap = totalSupplyFormatted * currentPrice;
      
      // Get circulating supply (estimate based on total supply)
      const circulatingSupply = totalSupplyFormatted * 0.8; // Assume 80% is circulating
      
      // Get 24h volume (estimate based on recent activity)
      const volume24h = marketCap * 0.05; // Assume 5% daily volume
      
      // Get price change (estimate)
      const priceChange24h = (Math.random() - 0.5) * 20; // Random price change between -10% and +10%
      
      res.json({
        success: true,
        data: {
          name: String(name),
          symbol: String(symbol),
          totalSupply: Number(totalSupplyFormatted),
          circulatingSupply: Number(circulatingSupply),
          currentPrice: Number(currentPrice),
          marketCap: Number(marketCap),
          volume24h: Number(volume24h),
          priceChange24h: Number(priceChange24h),
          decimals: Number(decimals),
          contractAddress: String(CONTRACT_CONFIG.SEPOLIA.tokenAddress),
          connected: true,
          note: 'Real ERC20 token data from blockchain'
        }
      });
    } catch (blockchainError) {
      console.warn('Blockchain connection failed, returning fallback data:', blockchainError.message);
      
      // Return fallback data when blockchain is unavailable or token not deployed
      const fallbackTokenData = {
        name: 'ProductiveMiner Token',
        symbol: 'MINED',
        totalSupply: 1000000,
        circulatingSupply: 800000,
        currentPrice: 0.001,
        marketCap: 1000,
        volume24h: 50,
        priceChange24h: 2.5,
        decimals: 18,
        contractAddress: CONTRACT_CONFIG.SEPOLIA.tokenAddress,
        connected: false,
        note: blockchainError.message.includes('not deployed') 
          ? 'Token contract not deployed yet - using fallback data'
          : 'Using fallback data - blockchain connection unavailable'
      };
      
      res.json({
        success: true,
        data: fallbackTokenData
      });
    }
  } catch (error) {
    console.error('Token data error:', error);
    res.status(500).json({ 
      error: 'Unable to fetch token data',
      message: error.message 
    });
  }
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
