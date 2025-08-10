const { ethers } = require('ethers');

class ContractService {
  constructor() {
    this.provider = null;
    this.contract = null;
    this.signer = null;
    this.isConnected = false;
    this.contractAddress = process.env.CONTRACT_ADDRESS || '0x05D277F6FB68EB0460f4488608C747EaEdDC7429';
    this.tokenAddress = process.env.TOKEN_ADDRESS || '0x29Da977Cd0b3C5326fc02EcC8D0C7efC294290E2';
    this.privateKey = process.env.PRIVATE_KEY || null;
    this.rpcUrl = process.env.CONTRACT_RPC_URL || 'http://productiveminer-contracts:8545';
  }

  async initialize() {
    try {
      // Connect to the blockchain network
      this.provider = new ethers.JsonRpcProvider(this.rpcUrl);
      
      // Create signer if private key is provided
      if (this.privateKey) {
        this.signer = new ethers.Wallet(this.privateKey, this.provider);
      } else {
        // Use default account for read-only operations
        this.signer = this.provider;
      }

      // Load contract ABI and address
      if (this.contractAddress) {
        await this.loadContract();
      }

      this.isConnected = true;
      console.log('Contract service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize contract service:', error);
      this.isConnected = false;
    }
  }

  async loadContract() {
    try {
      // Contract ABI - simplified version for integration
      const contractABI = [
        // View functions
        "function getNetworkStats() external view returns (tuple(uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256))",
        "function getContractStats() external view returns (tuple(uint256,uint256,uint256,uint256,uint256,bool))",
        "function getStakingInfo(address _staker) external view returns (tuple(uint256,uint256,uint256,uint256,bool))",
        "function getMinerRewards(address _miner) external view returns (uint256)",
        "function hasActiveMiningSession(address _miner) external view returns (bool)",
        "function calculateReward(uint256 _difficulty, uint256 _quantumLevel, uint256 _computationalComplexity) external view returns (uint256)",
        
        // State-changing functions
        "function startMiningSession(uint8 _workType, uint256 _difficulty, uint256 _quantumLevel, uint256 _computationalPower) external",
        "function completeMiningSession(bytes32 _proofHash, bool _successful, string memory _metadata, uint256 _computationalComplexity, uint256 _impactScore) external",
        "function stakeTokens(uint256 _amount) external",
        "function unstakeTokens(uint256 _amount) external",
        "function claimRewards() external",
        
        // Events
        "event DiscoverySubmitted(uint256 indexed discoveryId, address indexed miner, uint8 workType, uint256 difficulty, uint256 reward, uint256 computationalComplexity)",
        "event MiningSessionStarted(uint256 indexed sessionId, address indexed miner, uint8 workType, uint256 difficulty, uint256 quantumSecurityLevel)",
        "event MiningSessionCompleted(uint256 indexed sessionId, address indexed miner, bool successful, uint256 reward, uint256 computationalPower)",
        "event StakingUpdated(address indexed staker, uint256 stakedAmount, uint256 rewards, uint256 apy)",
        "event RewardsClaimed(address indexed miner, uint256 amount, uint256 timestamp)"
      ];

      this.contract = new ethers.Contract(this.contractAddress, contractABI, this.signer);
      console.log(`Contract loaded at address: ${this.contractAddress}`);
    } catch (error) {
      console.error('Failed to load contract:', error);
      throw error;
    }
  }

  async getNetworkStats() {
    try {
      if (!this.contract) {
        return this.getMockNetworkStats();
      }

      const stats = await this.contract.getNetworkStats();
      return {
        totalDiscoveries: Number(stats[0]),
        totalSessions: Number(stats[1]),
        currentActiveSessions: Number(stats[2]),
        maxDifficulty: Number(stats[3]),
        baseReward: Number(stats[4]),
        quantumSecurityLevel: Number(stats[5]),
        totalStaked: Number(stats[6]),
        totalRewardsDistributed: Number(stats[7]),
        averageComputationalComplexity: Number(stats[8])
      };
    } catch (error) {
      console.error('Failed to get network stats from contract:', error);
      return this.getMockNetworkStats();
    }
  }

  async getContractStats() {
    try {
      if (!this.contract) {
        return this.getMockContractStats();
      }

      const stats = await this.contract.getContractStats();
      return {
        totalDiscoveries: Number(stats[0]),
        totalSessions: Number(stats[1]),
        totalStaked: Number(stats[2]),
        totalRewardsDistributed: Number(stats[3]),
        currentActiveSessions: Number(stats[4]),
        isPaused: stats[5]
      };
    } catch (error) {
      console.error('Failed to get contract stats:', error);
      return this.getMockContractStats();
    }
  }

  async getStakingInfo(address) {
    try {
      if (!this.contract) {
        return this.getMockStakingInfo();
      }

      const stakingInfo = await this.contract.getStakingInfo(address);
      return {
        stakedAmount: Number(stakingInfo[0]),
        rewards: Number(stakingInfo[1]),
        lastClaimTime: Number(stakingInfo[2]),
        apy: Number(stakingInfo[3]),
        isActive: stakingInfo[4]
      };
    } catch (error) {
      console.error('Failed to get staking info:', error);
      return this.getMockStakingInfo();
    }
  }

  async getMinerRewards(address) {
    try {
      if (!this.contract) {
        return 1898.10095; // Mock historical rewards
      }

      const rewards = await this.contract.getMinerRewards(address);
      return Number(rewards);
    } catch (error) {
      console.error('Failed to get miner rewards:', error);
      return 1898.10095; // Mock historical rewards
    }
  }

  async hasActiveMiningSession(address) {
    try {
      if (!this.contract) {
        return false;
      }

      return await this.contract.hasActiveMiningSession(address);
    } catch (error) {
      console.error('Failed to check active mining session:', error);
      return false;
    }
  }

  async calculateReward(difficulty, quantumLevel, computationalComplexity) {
    try {
      if (!this.contract) {
        return this.calculateMockReward(difficulty, quantumLevel, computationalComplexity);
      }

      const reward = await this.contract.calculateReward(difficulty, quantumLevel, computationalComplexity);
      return Number(reward);
    } catch (error) {
      console.error('Failed to calculate reward:', error);
      return this.calculateMockReward(difficulty, quantumLevel, computationalComplexity);
    }
  }

  async startMiningSession(workType, difficulty, quantumLevel, computationalPower) {
    try {
      if (!this.contract || !this.signer) {
        console.warn('Contract not available, returning mock response');
        return { success: true, sessionId: Date.now() };
      }

      const tx = await this.contract.startMiningSession(workType, difficulty, quantumLevel, computationalPower);
      const receipt = await tx.wait();
      
      console.log(`Mining session started: ${receipt.transactionHash}`);
      return { success: true, sessionId: Date.now(), txHash: receipt.transactionHash };
    } catch (error) {
      console.error('Failed to start mining session:', error);
      return { success: false, error: error.message };
    }
  }

  async completeMiningSession(proofHash, successful, metadata, computationalComplexity, impactScore) {
    try {
      if (!this.contract || !this.signer) {
        console.warn('Contract not available, returning mock response');
        return { success: true, reward: 100 };
      }

      const tx = await this.contract.completeMiningSession(proofHash, successful, metadata, computationalComplexity, impactScore);
      const receipt = await tx.wait();
      
      console.log(`Mining session completed: ${receipt.transactionHash}`);
      return { success: true, txHash: receipt.transactionHash, reward: 100 };
    } catch (error) {
      console.error('Failed to complete mining session:', error);
      return { success: false, error: error.message };
    }
  }

  // Mock data methods for when contract is not available
  getMockNetworkStats() {
    return {
      totalDiscoveries: 42,
      totalSessions: 156,
      currentActiveSessions: 8,
      maxDifficulty: 50,
      baseReward: 100,
      quantumSecurityLevel: 256,
      totalStaked: 500000,
      totalRewardsDistributed: 25000,
      averageComputationalComplexity: 750
    };
  }

  getMockContractStats() {
    return {
      totalDiscoveries: 42,
      totalSessions: 156,
      totalStaked: 500000,
      totalRewardsDistributed: 25000,
      currentActiveSessions: 8,
      isPaused: false
    };
  }

  getMockStakingInfo() {
    return {
      stakedAmount: 50000,
      rewards: 2500,
      lastClaimTime: Math.floor(Date.now() / 1000),
      apy: 500, // 5%
      isActive: true
    };
  }

  calculateMockReward(difficulty, quantumLevel, computationalComplexity) {
    const difficultyMultiplier = (difficulty * 100) / 50;
    const quantumMultiplier = ((quantumLevel * 100) / 256) + 100;
    const complexityMultiplier = (computationalComplexity * 50) / 1000 + 100;
    
    const reward = (100 * difficultyMultiplier * quantumMultiplier * complexityMultiplier) / 1000000;
    return Math.max(reward, 1);
  }

  // Health check
  async healthCheck() {
    try {
      if (!this.provider) {
        return { status: 'disconnected', message: 'Provider not initialized' };
      }

      const network = await this.provider.getNetwork();
      return {
        status: 'connected',
        chainId: network.chainId,
        isConnected: this.isConnected,
        contractAddress: this.contractAddress
      };
    } catch (error) {
      console.error('Contract service health check failed:', error);
      return { status: 'error', message: error.message };
    }
  }
}

module.exports = new ContractService();
