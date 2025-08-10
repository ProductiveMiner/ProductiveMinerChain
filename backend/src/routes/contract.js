const express = require('express');
const router = express.Router();

// Mock contract data
const mockContractData = {
  health: {
    status: 'connected',
    network: {
      chainId: 31337,
      name: 'Hardhat Network'
    },
    contractAddress: '0x05D277F6FB68EB0460f4488608C747EaEdDC7429',
    tokenAddress: '0x29Da977Cd0b3C5326fc02EcC8D0C7efC294290E2'
  },
  stats: {
    totalDiscoveries: 42,
    totalSessions: 156,
    totalStaked: 500000,
    totalRewardsDistributed: 25000,
    currentActiveSessions: 8,
    isPaused: false
  },
  networkStats: {
    maxDifficulty: 50,
    baseReward: 100,
    quantumSecurityLevel: 256,
    averageComputationalComplexity: 750,
    totalStaked: 500000,
    totalRewardsDistributed: 25000,
    currentActiveSessions: 8,
    totalDiscoveries: 42,
    totalSessions: 156
  }
};

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    res.json(mockContractData.health);
  } catch (error) {
    console.error('Contract health check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Contract statistics endpoint
router.get('/stats/contract', async (req, res) => {
  try {
    res.json(mockContractData.stats);
  } catch (error) {
    console.error('Contract stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Network statistics endpoint
router.get('/stats/network', async (req, res) => {
  try {
    res.json(mockContractData.networkStats);
  } catch (error) {
    console.error('Network stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Contract configuration endpoint
router.get('/config', async (req, res) => {
  try {
    res.json({
      contractAddress: mockContractData.health.contractAddress,
      tokenAddress: mockContractData.health.tokenAddress,
      network: mockContractData.health.network,
      features: [
        'Quantum Security',
        'Mathematical Mining',
        'Staking Integration',
        'Session Management'
      ]
    });
  } catch (error) {
    console.error('Contract config error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
