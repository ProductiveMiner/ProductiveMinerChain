const express = require('express');
const router = express.Router();
const axios = require('axios');
const { query } = require('../database/connection');
const { get } = require('../database/redis');
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// Debug logging for environment variables
console.log('Environment variables:');
console.log('CONTRACT_ADDRESS:', process.env.CONTRACT_ADDRESS);
console.log('TOKEN_ADDRESS:', process.env.TOKEN_ADDRESS);
console.log('WEB3_PROVIDER:', process.env.WEB3_PROVIDER);

// Contract configuration for Sepolia
const CONTRACT_CONFIG = {
  SEPOLIA: {
    rpcUrl: process.env.WEB3_PROVIDER || 'https://eth-sepolia.g.alchemy.com/v2/EsD9nEjl3rvwE35tYtTZC',
    contractAddress: process.env.CONTRACT_ADDRESS || '0xf58fA04DC5E087991EdC6f4ADEF1F87814f9F68b', // ProductiveMinerFixed contract
    tokenAddress: process.env.TOKEN_ADDRESS || '0x1a963782dB0e5502defb04d662B7031FaB9e15E2', // MINEDTokenFixed contract
    chainId: 11155111,
    explorerUrl: 'https://sepolia.etherscan.io'
  }
};

console.log('CONTRACT_CONFIG:', CONTRACT_CONFIG);

// Load contract ABI - Updated to use ProductiveMinerFixed
const contractABI = JSON.parse(fs.readFileSync(path.join(__dirname, '../contracts/ProductiveMinerFixed.json'), 'utf8')).abi;

// Helper function to get real blockchain data from Sepolia contract
async function getRealBlockchainData() {
  try {
    const provider = new ethers.JsonRpcProvider(CONTRACT_CONFIG.SEPOLIA.rpcUrl);
    const contract = new ethers.Contract(CONTRACT_CONFIG.SEPOLIA.contractAddress, contractABI, provider);
    
    // Get current block number
    const currentBlock = await provider.getBlockNumber();
    
    // Get contract state (these should always work)
    let isPaused = false;
    let maxDifficulty = '1000000';
    let baseReward = '0.001';
    let quantumSecurityLevel = '1';
    
    try {
      isPaused = await contract.paused();
      console.log('Contract paused status:', isPaused);
    } catch (error) {
      console.log('paused() function failed:', error.message);
    }
    
    try {
      maxDifficulty = await contract.maxDifficulty();
      console.log('Contract maxDifficulty:', maxDifficulty.toString());
    } catch (error) {
      console.log('maxDifficulty() function failed:', error.message);
    }
    
    try {
      baseReward = await contract.baseReward();
      console.log('Contract baseReward:', ethers.formatEther(baseReward));
    } catch (error) {
      console.log('baseReward() function failed:', error.message);
    }
    
    try {
      quantumSecurityLevel = await contract.quantumSecurityLevel();
      console.log('Contract quantumSecurityLevel:', quantumSecurityLevel.toString());
    } catch (error) {
      console.log('quantumSecurityLevel() function failed:', error.message);
    }
    
    // Query contract events for real blockchain data
    // Use a more recent block range to catch recent activity
    const fromBlock = Math.max(0, currentBlock - 1000); // Last 1000 blocks
    const toBlock = currentBlock;
    
    // Try to get events, but don't fail if there are none
    let discoveryEvents = [];
    let sessionEvents = [];
    let rewardsEvents = [];
    let stakedEvents = [];
    
    try {
      // Get DiscoverySubmitted events
      discoveryEvents = await contract.queryFilter('DiscoverySubmitted', fromBlock, toBlock);
      console.log('DiscoverySubmitted events found:', discoveryEvents.length);
    } catch (error) {
      console.log('DiscoverySubmitted events not found:', error.message);
    }
    
    try {
      // Get MiningSessionStarted events
      sessionEvents = await contract.queryFilter('MiningSessionStarted', fromBlock, toBlock);
      console.log('MiningSessionStarted events found:', sessionEvents.length);
    } catch (error) {
      console.log('MiningSessionStarted events not found:', error.message);
    }
    
    try {
      // Get MiningSessionCompleted events
      const completedEvents = await contract.queryFilter('MiningSessionCompleted', fromBlock, toBlock);
      console.log('MiningSessionCompleted events found:', completedEvents.length);
    } catch (error) {
      console.log('MiningSessionCompleted events not found:', error.message);
    }
    
    try {
      // Get RewardsClaimed events
      rewardsEvents = await contract.queryFilter('RewardsClaimed', fromBlock, toBlock);
      console.log('RewardsClaimed events found:', rewardsEvents.length);
    } catch (error) {
      console.log('RewardsClaimed events not found:', error.message);
    }
    
    try {
      // Get Staked events
      stakedEvents = await contract.queryFilter('Staked', fromBlock, toBlock);
      console.log('Staked events found:', stakedEvents.length);
    } catch (error) {
      console.log('Staked events not found:', error.message);
    }
    
    // Also try to get all events from the contract to see what's actually happening
    try {
      const allEvents = await contract.queryFilter('*', fromBlock, toBlock);
      console.log('Total events found:', allEvents.length);
      if (allEvents.length > 0) {
        console.log('Event topics found:', allEvents.map(e => e.topics[0]));
      }
    } catch (error) {
      console.log('Failed to get all events:', error.message);
    }
    
    // Calculate real statistics from events
    const totalDiscoveries = discoveryEvents.length;
    const totalSessions = sessionEvents.length;
    const totalRewardsDistributed = rewardsEvents.reduce((total, event) => {
      return total + parseFloat(ethers.formatEther(event.args.amount || 0));
    }, 0);
    
    // Get current active sessions (estimate based on recent events)
    const currentActiveSessions = Math.max(0, totalSessions - rewardsEvents.length);
    
    // Get total staked from events
    const totalStaked = stakedEvents.reduce((total, event) => {
      return total + parseFloat(ethers.formatEther(event.args.amount || 0));
    }, 0);
    
    // Calculate blockchain statistics
    const totalBlocks = currentBlock;
    const totalTransactions = totalSessions + totalDiscoveries + rewardsEvents.length + stakedEvents.length;
    const totalValidators = Math.max(1, Math.floor(totalStaked / 1000)); // Estimate 1 validator per 1000 staked
    const averageBlockTime = 12; // Sepolia average block time
    
    const hasEvents = totalDiscoveries > 0 || totalSessions > 0 || totalStaked > 0 || totalRewardsDistributed > 0;
    
    console.log('Contract data summary:', {
      totalDiscoveries,
      totalSessions,
      totalStaked,
      totalRewardsDistributed,
      hasEvents,
      currentBlock
    });
    
    return {
      maxDifficulty: maxDifficulty.toString(),
      baseReward: ethers.formatEther(baseReward),
      quantumSecurityLevel: quantumSecurityLevel.toString(),
      totalStaked,
      totalRewardsDistributed,
      currentActiveSessions,
      totalDiscoveries,
      totalSessions,
      totalBlocks,
      totalTransactions,
      totalValidators,
      averageBlockTime,
      isPaused,
      connected: true,
      hasEvents
    };
  } catch (error) {
    console.error('Failed to get real blockchain data from Sepolia:', error);
    throw new Error('Unable to fetch blockchain data');
  }
}

// Helper function to get real database data
async function getRealDatabaseData() {
  try {
    // Get blocks count from database
    const blocksResult = await query('SELECT COUNT(*) as total_blocks FROM blocks');
    const totalBlocks = parseInt(blocksResult.rows[0]?.total_blocks || 0);

    // Get transactions count from database
    const transactionsResult = await query('SELECT COUNT(*) as total_transactions FROM transactions');
    const totalTransactions = parseInt(transactionsResult.rows[0]?.total_transactions || 0);

    // Get validators count from database
    const validatorsResult = await query('SELECT COUNT(*) as total_validators FROM users WHERE role = \'validator\'');
    const totalValidators = parseInt(validatorsResult.rows[0]?.total_validators || 0);

    return {
      totalBlocks,
      totalTransactions,
      totalValidators,
      averageBlockTime: 0
    };
  } catch (error) {
    console.error('Failed to get database data:', error);
    throw new Error('Unable to fetch database data');
  }
}

// Health check endpoint - Only real data
router.get('/health', async (req, res) => {
  try {
    const provider = new ethers.JsonRpcProvider(CONTRACT_CONFIG.SEPOLIA.rpcUrl);
    const currentBlock = await provider.getBlockNumber();
    
    res.json({
      status: 'connected',
      network: {
        chainId: CONTRACT_CONFIG.SEPOLIA.chainId,
        name: 'Sepolia Testnet'
      },
      contractAddress: CONTRACT_CONFIG.SEPOLIA.contractAddress,
      tokenAddress: CONTRACT_CONFIG.SEPOLIA.tokenAddress,
      currentBlock: currentBlock,
      lastBlockTime: Date.now()
    });
  } catch (error) {
    console.error('Contract health check error:', error);
    res.status(500).json({ error: 'Unable to connect to blockchain' });
  }
});

// Contract statistics endpoint - Only real blockchain data
router.get('/stats/contract', async (req, res) => {
  try {
    console.log('Fetching contract stats...');
    
    // Get real blockchain data
    const blockchainData = await getRealBlockchainData();
    
    res.json({
      success: true,
      data: {
        totalBlocks: blockchainData.totalBlocks || 0,
        totalTransactions: blockchainData.totalTransactions || 0,
        totalValidators: blockchainData.totalValidators || 0,
        averageBlockTime: blockchainData.averageBlockTime || 0,
        totalDiscoveries: blockchainData.totalDiscoveries,
        totalSessions: blockchainData.totalSessions,
        totalStaked: blockchainData.totalStaked,
        totalRewardsDistributed: blockchainData.totalRewardsDistributed,
        currentActiveSessions: blockchainData.currentActiveSessions,
        isPaused: blockchainData.isPaused,
        connected: blockchainData.connected,
        hasEvents: blockchainData.hasEvents,
        note: blockchainData.hasEvents ? 'Real blockchain data' : 'No events found yet - contract is ready for mining'
      }
    });
  } catch (error) {
    console.error('Contract stats error:', error);
    
    // Return fallback data when blockchain is unavailable
    const fallbackContractStats = {
      totalBlocks: 0,
      totalTransactions: 0,
      totalValidators: 0,
      averageBlockTime: 0,
      totalDiscoveries: 0,
      totalSessions: 0,
      totalStaked: 0,
      totalRewardsDistributed: 0,
      currentActiveSessions: 0,
      isPaused: false,
      connected: false,
      hasEvents: false,
      note: 'Using fallback data - blockchain connection unavailable'
    };
    
    res.json({
      success: true,
      data: fallbackContractStats
    });
  }
});

// Network statistics endpoint - Only real blockchain data
router.get('/stats/network', async (req, res) => {
  try {
    console.log('Fetching network stats...');
    
    // Get real blockchain data
    const blockchainData = await getRealBlockchainData();
    
    res.json({
      success: true,
      data: {
        maxDifficulty: blockchainData.maxDifficulty,
        baseReward: blockchainData.baseReward,
        quantumSecurityLevel: blockchainData.quantumSecurityLevel,
        totalStaked: blockchainData.totalStaked,
        totalRewardsDistributed: blockchainData.totalRewardsDistributed,
        currentActiveSessions: blockchainData.currentActiveSessions,
        totalDiscoveries: blockchainData.totalDiscoveries,
        totalSessions: blockchainData.totalSessions,
        totalBlocks: blockchainData.totalBlocks || 0,
        totalTransactions: blockchainData.totalTransactions || 0,
        totalValidators: blockchainData.totalValidators || 0,
        averageBlockTime: blockchainData.averageBlockTime || 0,
        connected: blockchainData.connected,
        hasEvents: blockchainData.hasEvents,
        note: blockchainData.hasEvents ? 'Real blockchain data' : 'No events found yet - contract is ready for mining'
      }
    });
  } catch (error) {
    console.error('Network stats error:', error);
    
    // Return fallback data when blockchain is unavailable
    const fallbackNetworkStats = {
      maxDifficulty: '1000',
      baseReward: '0.001',
      quantumSecurityLevel: '1',
      totalStaked: 0,
      totalRewardsDistributed: 0,
      currentActiveSessions: 0,
      totalDiscoveries: 0,
      totalSessions: 0,
      totalBlocks: 0,
      totalTransactions: 0,
      totalValidators: 0,
      averageBlockTime: 0,
      connected: false,
      hasEvents: false,
      note: 'Using fallback data - blockchain connection unavailable'
    };
    
    res.json({
      success: true,
      data: fallbackNetworkStats
    });
  }
});

// Contract configuration endpoint - Only real data
router.get('/config', async (req, res) => {
  try {
    res.json({
      contractAddress: CONTRACT_CONFIG.SEPOLIA.contractAddress,
      tokenAddress: CONTRACT_CONFIG.SEPOLIA.tokenAddress,
      network: {
        chainId: CONTRACT_CONFIG.SEPOLIA.chainId,
        name: 'Sepolia Testnet',
        rpcUrl: CONTRACT_CONFIG.SEPOLIA.rpcUrl,
        explorerUrl: CONTRACT_CONFIG.SEPOLIA.explorerUrl
      },
      features: [
        'Quantum Security',
        'Mathematical Mining',
        'Staking Integration',
        'Session Management',
        'Real Blockchain Data'
      ]
    });
  } catch (error) {
    console.error('Contract config error:', error);
    res.status(500).json({ error: 'Unable to fetch contract configuration' });
  }
});

module.exports = router;
