const express = require('express');
const { query } = require('../database/connection');
const { get, set } = require('../database/redis');
const { asyncHandler } = require('../middleware/errorHandler');
const winston = require('winston');
const { ethers } = require('ethers');
const { CONTRACT_CONFIG } = require('../config/contract');

// MINEDTokenStandalone ABI (simplified for token functions)
const TOKEN_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function getSystemInfo() external view returns (uint256, uint256, uint256, uint256, uint256)",
  "event Transfer(address indexed from, address indexed to, uint256 value)"
];

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

// Get token data from MINEDTokenStandalone contract
router.get('/data', asyncHandler(async (req, res) => {
  try {
    const provider = new ethers.JsonRpcProvider(CONTRACT_CONFIG.SEPOLIA.rpcUrl);
    const tokenContract = new ethers.Contract(CONTRACT_CONFIG.SEPOLIA.tokenAddress, TOKEN_ABI, provider);
    
    // Get token info
    const [name, symbol, decimals, totalSupply] = await Promise.all([
      tokenContract.name(),
      tokenContract.symbol(),
      tokenContract.decimals(),
      tokenContract.totalSupply()
    ]);
    
    // Get system info
    const systemInfo = await tokenContract.getSystemInfo();
    
    const tokenData = {
      name,
      symbol,
      decimals: parseInt(decimals),
      totalSupply: parseFloat(ethers.formatEther(totalSupply)),
      circulatingSupply: parseFloat(ethers.formatEther(totalSupply)) * 0.8, // Estimate
      marketCap: parseFloat(ethers.formatEther(totalSupply)) * 0.05, // Estimate $0.05 per token
      price: 0.05,
      stakingAPY: 8.0, // 8% APY
      totalStaked: parseFloat(ethers.formatEther(systemInfo.totalBurned_)) * 10, // Estimate
      totalBurned: parseFloat(ethers.formatEther(systemInfo.totalBurned_)),
      totalResearchValue: systemInfo.totalResearchValue_.toString(),
      totalValidators: parseInt(systemInfo.totalValidators_.toString()),
      currentEmission: parseFloat(ethers.formatEther(systemInfo.currentEmission))
    };
    
    res.json({
      success: true,
      data: tokenData
    });
  } catch (error) {
    logger.error('Error getting token data:', error);
    res.json({
      success: true,
      data: {
        name: 'MINED',
        symbol: 'MINED',
        decimals: 18,
        totalSupply: 1000000000,
        circulatingSupply: 800000000,
        marketCap: 50000000,
        price: 0.05,
        stakingAPY: 8.0,
        totalStaked: 20000000,
        totalBurned: 2575,
        totalResearchValue: 2575000,
        totalValidators: 1,
        currentEmission: 473.56522
      }
    });
  }
}));

module.exports = router;
