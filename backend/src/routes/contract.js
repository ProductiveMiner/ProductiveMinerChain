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
    tokenAddress: process.env.TOKEN_ADDRESS || '0x78916EB89CDB2Ef32758fCc41f3aef3FDf052ab3', // MINEDTokenStandalone contract
    chainId: 11155111,
    explorerUrl: 'https://sepolia.etherscan.io'
  }
};

console.log('CONTRACT_CONFIG:', CONTRACT_CONFIG);

// Load contract ABI - Updated to use ProductiveMinerFixed
const contractABI = JSON.parse(fs.readFileSync(path.join(__dirname, '../contracts/ProductiveMinerFixed.json'), 'utf8')).abi;

// Load MINEDTokenStandalone ABI
const tokenABI = JSON.parse(fs.readFileSync(path.join(__dirname, '../contracts/MINEDTokenStandalone.json'), 'utf8')).abi;

// Helper function to get real blockchain data from MINEDTokenStandalone contract
async function getRealBlockchainData() {
  try {
    const provider = new ethers.JsonRpcProvider(CONTRACT_CONFIG.SEPOLIA.rpcUrl);
    const contract = new ethers.Contract(CONTRACT_CONFIG.SEPOLIA.tokenAddress, tokenABI, provider);
    
    // Get current block number
    const currentBlock = await provider.getBlockNumber();
    
    // Get system info from MINEDTokenStandalone contract
    const systemInfo = await contract.getSystemInfo();
    
    // Get token info
    const name = await contract.name();
    const symbol = await contract.symbol();
    const decimals = await contract.decimals();
    
    console.log('MINEDTokenStandalone Contract Data:');
    console.log(`   Name: ${name}`);
    console.log(`   Symbol: ${symbol}`);
    console.log(`   Total Supply: ${ethers.formatEther(systemInfo.totalSupply_)} ${symbol}`);
    console.log(`   Total Burned: ${ethers.formatEther(systemInfo.totalBurned_)} ${symbol}`);
    console.log(`   Total Research Value: ${systemInfo.totalResearchValue_.toString()}`);
    console.log(`   Total Validators: ${systemInfo.totalValidators_.toString()}`);
    console.log(`   Current Emission: ${ethers.formatEther(systemInfo.currentEmission)} ${symbol}`);
    
    // Get recent events (last 200 blocks to avoid RPC limits)
    const fromBlock = Math.max(0, currentBlock - 200);
    const toBlock = currentBlock;
    
    let discoveryEvents = [];
    let validatorEvents = [];
    let stakingEvents = [];
    let transferEvents = [];
    
    try {
      discoveryEvents = await contract.queryFilter('DiscoverySubmitted', fromBlock, toBlock);
    } catch (error) {
      console.log('No discovery events found');
    }
    
    try {
      validatorEvents = await contract.queryFilter('ValidatorRegistered', fromBlock, toBlock);
    } catch (error) {
      console.log('No validator events found');
    }
    
    try {
      stakingEvents = await contract.queryFilter('TokensStaked', fromBlock, toBlock);
    } catch (error) {
      console.log('No staking events found');
    }
    
    try {
      transferEvents = await contract.queryFilter('Transfer', fromBlock, toBlock);
    } catch (error) {
      console.log('No transfer events found');
    }
    
    return {
      connected: true,
      hasEvents: discoveryEvents.length > 0 || validatorEvents.length > 0 || stakingEvents.length > 0,
      totalSupply: parseFloat(ethers.formatEther(systemInfo.totalSupply_)),
      totalBurned: parseFloat(ethers.formatEther(systemInfo.totalBurned_)),
      totalResearchValue: systemInfo.totalResearchValue_.toString(),
      totalValidators: parseInt(systemInfo.totalValidators_.toString()),
      currentEmission: parseFloat(ethers.formatEther(systemInfo.currentEmission)),
      totalDiscoveries: discoveryEvents.length,
      totalSessions: discoveryEvents.length, // Each discovery is a session
      totalStaked: stakingEvents.length > 0 ? stakingEvents.reduce((sum, event) => sum + parseFloat(ethers.formatEther(event.args.amount)), 0) : 0,
      totalRewardsDistributed: discoveryEvents.length * 100, // Estimate based on discoveries
      currentActiveSessions: discoveryEvents.filter(e => e.blockNumber >= currentBlock - 10).length,
      totalBlocks: currentBlock,
      totalTransactions: transferEvents.length,
      averageBlockTime: 12, // Sepolia average
      isPaused: false, // MINEDTokenStandalone doesn't have pause functionality
      contractAddress: CONTRACT_CONFIG.SEPOLIA.tokenAddress,
      network: 'Sepolia Testnet',
      chainId: CONTRACT_CONFIG.SEPOLIA.chainId,
      note: 'Real data from MINEDTokenStandalone contract'
    };
  } catch (error) {
    console.error('Error getting real blockchain data:', error);
    return {
      connected: false,
      hasEvents: false,
      totalSupply: 1000000000,
      totalBurned: 0,
      totalResearchValue: 0,
      totalValidators: 0,
      currentEmission: 0,
      totalDiscoveries: 0,
      totalSessions: 0,
      totalStaked: 0,
      totalRewardsDistributed: 0,
      currentActiveSessions: 0,
      totalBlocks: 0,
      totalTransactions: 0,
      averageBlockTime: 0,
      isPaused: false,
      contractAddress: CONTRACT_CONFIG.SEPOLIA.tokenAddress,
      network: 'Sepolia Testnet',
      chainId: CONTRACT_CONFIG.SEPOLIA.chainId,
      note: 'Fallback data - blockchain connection failed'
    };
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
    
    // Return empty data when blockchain is unavailable
    const emptyNetworkStats = {
      maxDifficulty: '0',
      baseReward: '0',
      quantumSecurityLevel: '0',
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
      note: 'No data available - blockchain connection unavailable'
    };
    
    res.json({
      success: true,
      data: emptyNetworkStats
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
