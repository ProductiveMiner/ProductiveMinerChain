const { ethers } = require('ethers');

class ContractService {
  constructor() {
    this.provider = null;
    this.contract = null;
    this.signer = null;
    this.isConnected = false;
    this.contractAddress = process.env.CONTRACT_ADDRESS || '0xc7374F27c695112B81495ECF28b90aD441CCf4b9';
    this.tokenAddress = process.env.TOKEN_ADDRESS || '0x1a963782dB0e5502defb04d662B7031FaB9e15E2'; // MINEDTokenFixed
    this.privateKey = process.env.PRIVATE_KEY || null;
    this.rpcUrl = process.env.CONTRACT_RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/EsD9nEjl3rvwE35tYtTZC';
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
        await this.setupEventListeners();
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
        "function maxDifficulty() external view returns (uint256)",
        "function baseReward() external view returns (uint256)",
        "function minStakeAmount() external view returns (uint256)",
        "function stakingAPY() external view returns (uint256)",
        "function totalStaked() external view returns (uint256)",
        "function discoveryCounter() external view returns (uint256)",
        "function sessionCounter() external view returns (uint256)",
        "function totalRewardsDistributed() external view returns (uint256)",
        "function getMinerStats(address _miner) external view returns (tuple(uint256,uint256,uint256,uint256,uint256))",
        "function stakingInfo(address _staker) external view returns (tuple(uint256,uint256,uint48,bool))",
        "function discoveries(uint256 _id) external view returns (tuple(uint256,address,uint8,uint256,uint256,uint48,bytes32,bool,string))",
        "function sessions(uint256 _id) external view returns (tuple(uint256,address,uint8,uint48,uint48,uint256,bool,bool))",
        
        // State-changing functions
        "function startMiningSession(uint8 _workType, uint256 _difficulty) external",
        "function completeMiningSession(uint256 _sessionId, bytes32 _proofHash, string calldata _metadata) external",
        "function stake() external payable",
        "function unstake(uint256 _amount) external",
        "function claimRewards() external",
        
        // Events
        "event DiscoverySubmitted(uint256 indexed discoveryId, address indexed miner, uint8 indexed workType, uint256 difficulty)",
        "event MiningSessionStarted(uint256 indexed sessionId, address indexed miner, uint8 indexed workType, uint256 difficulty)",
        "event MiningSessionCompleted(uint256 indexed sessionId, address indexed miner, uint256 reward)",
        "event Staked(address indexed staker, uint256 amount)",
        "event Unstaked(address indexed staker, uint256 amount)",
        "event RewardsClaimed(address indexed staker, uint256 amount)"
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

      const [
        maxDifficulty,
        baseReward,
        totalStaked,
        discoveryCounter,
        sessionCounter,
        totalRewardsDistributed
      ] = await Promise.all([
        this.contract.maxDifficulty(),
        this.contract.baseReward(),
        this.contract.totalStaked(),
        this.contract.discoveryCounter(),
        this.contract.sessionCounter(),
        this.contract.totalRewardsDistributed()
      ]);

      return {
        maxDifficulty: Number(maxDifficulty),
        baseReward: Number(baseReward),
        totalStaked: Number(totalStaked),
        totalDiscoveries: Number(discoveryCounter),
        totalSessions: Number(sessionCounter),
        totalRewardsDistributed: Number(totalRewardsDistributed),
        currentActiveSessions: 8, // This would need to be calculated by iterating sessions
        quantumSecurityLevel: 256,
        averageComputationalComplexity: 750
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

      const stakingInfo = await this.contract.stakingInfo(address);
      const apy = await this.contract.stakingAPY();
      
      return {
        stakedAmount: Number(stakingInfo[0]),
        rewards: Number(stakingInfo[1]),
        lastClaimTime: Number(stakingInfo[2]),
        apy: Number(apy),
        isActive: stakingInfo[3]
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

  async startMiningSession(workType, difficulty) {
    try {
      if (!this.contract || !this.signer) {
        console.warn('Contract not available, returning mock response');
        return { success: true, sessionId: Date.now() };
      }

      const tx = await this.contract.startMiningSession(workType, difficulty);
      const receipt = await tx.wait();
      
      console.log(`Mining session started: ${receipt.transactionHash}`);
      return { success: true, sessionId: Date.now(), txHash: receipt.transactionHash };
    } catch (error) {
      console.error('Failed to start mining session:', error);
      return { success: false, error: error.message };
    }
  }

  async completeMiningSession(sessionId, proofHash, metadata) {
    try {
      if (!this.contract || !this.signer) {
        console.warn('Contract not available, returning mock response');
        return { success: true, reward: 100 };
      }

      const tx = await this.contract.completeMiningSession(sessionId, proofHash, metadata);
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

  // Setup event listeners for real-time updates
  async setupEventListeners() {
    try {
      if (!this.contract) {
        console.warn('Contract not available for event listeners');
        return;
      }

      // Listen for new discoveries
      this.contract.on('DiscoverySubmitted', async (discoveryId, miner, workType, difficulty, event) => {
        console.log('🎯 New discovery submitted:', {
          discoveryId: discoveryId.toString(),
          miner,
          workType: workType.toString(),
          difficulty: difficulty.toString(),
          txHash: event.transactionHash
        });

        // Update database with new discovery
        await this.updateDiscoveryInDatabase(discoveryId, miner, workType, difficulty, 0, 0, event.transactionHash);
      });

      // Listen for mining session starts
      this.contract.on('MiningSessionStarted', async (sessionId, miner, workType, difficulty, event) => {
        console.log('⛏️ Mining session started:', {
          sessionId: sessionId.toString(),
          miner,
          workType: workType.toString(),
          difficulty: difficulty.toString(),
          txHash: event.transactionHash
        });

        // Update database with new session
        await this.updateSessionInDatabase(sessionId, miner, workType, difficulty, 256, event.transactionHash);
      });

      // Listen for mining session completions
      this.contract.on('MiningSessionCompleted', async (sessionId, miner, reward, event) => {
        console.log('✅ Mining session completed:', {
          sessionId: sessionId.toString(),
          miner,
          reward: reward.toString(),
          txHash: event.transactionHash
        });

        // Update database with completed session
        await this.updateCompletedSessionInDatabase(sessionId, miner, true, reward, 0, event.transactionHash);
      });

      console.log('Event listeners setup successfully');
    } catch (error) {
      console.error('Failed to setup event listeners:', error);
    }
  }

  // Update discovery in database
  async updateDiscoveryInDatabase(discoveryId, miner, workType, difficulty, reward, computationalComplexity, txHash) {
    try {
      const { query } = require('../database/connection');
      
      const workTypeNames = [
        'PRIME_PATTERN_DISCOVERY',
        'RIEMANN_ZERO_COMPUTATION', 
        'YANG_MILLS_FIELD_THEORY',
        'GOLDBACH_CONJECTURE_VERIFICATION',
        'NAVIER_STOKES_SIMULATION',
        'BIRCH_SWINNERTON_DYER',
        'ELLIPTIC_CURVE_CRYPTOGRAPHY',
        'LATTICE_CRYPTOGRAPHY',
        'POINCARE_CONJECTURE',
        'QUANTUM_ALGORITHM_OPTIMIZATION',
        'CRYPTOGRAPHIC_PROTOCOL_ANALYSIS',
        'MATHEMATICAL_CONSTANT_VERIFICATION'
      ];

      const workTypeName = workTypeNames[Number(workType)] || 'UNKNOWN';
      
      await query(`
        INSERT INTO discoveries (id, miner_address, work_type, difficulty, reward, computational_complexity, tx_hash, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE
        miner_address = VALUES(miner_address),
        work_type = VALUES(work_type),
        difficulty = VALUES(difficulty),
        reward = VALUES(reward),
        computational_complexity = VALUES(computational_complexity),
        tx_hash = VALUES(tx_hash),
        updated_at = NOW()
      `, [
        discoveryId.toString(),
        miner,
        workTypeName,
        difficulty.toString(),
        reward.toString(),
        computationalComplexity.toString(),
        txHash
      ]);

      console.log(`✅ Discovery ${discoveryId} updated in database`);
    } catch (error) {
      console.error('Failed to update discovery in database:', error);
    }
  }

  // Update session in database
  async updateSessionInDatabase(sessionId, miner, workType, difficulty, quantumSecurityLevel, txHash) {
    try {
      const { query } = require('../database/connection');
      
      const workTypeNames = [
        'PRIME_PATTERN_DISCOVERY',
        'RIEMANN_ZERO_COMPUTATION', 
        'YANG_MILLS_FIELD_THEORY',
        'GOLDBACH_CONJECTURE_VERIFICATION',
        'NAVIER_STOKES_SIMULATION',
        'BIRCH_SWINNERTON_DYER',
        'ELLIPTIC_CURVE_CRYPTOGRAPHY',
        'LATTICE_CRYPTOGRAPHY',
        'POINCARE_CONJECTURE',
        'QUANTUM_ALGORITHM_OPTIMIZATION',
        'CRYPTOGRAPHIC_PROTOCOL_ANALYSIS',
        'MATHEMATICAL_CONSTANT_VERIFICATION'
      ];

      const workTypeName = workTypeNames[Number(workType)] || 'UNKNOWN';
      
      await query(`
        INSERT INTO mining_sessions (id, miner_address, work_type, difficulty, quantum_security_level, tx_hash, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, 'active', NOW())
        ON DUPLICATE KEY UPDATE
        miner_address = VALUES(miner_address),
        work_type = VALUES(work_type),
        difficulty = VALUES(difficulty),
        quantum_security_level = VALUES(quantum_security_level),
        tx_hash = VALUES(tx_hash),
        updated_at = NOW()
      `, [
        sessionId.toString(),
        miner,
        workTypeName,
        difficulty.toString(),
        quantumSecurityLevel.toString(),
        txHash
      ]);

      console.log(`✅ Session ${sessionId} updated in database`);
    } catch (error) {
      console.error('Failed to update session in database:', error);
    }
  }

  // Update completed session in database
  async updateCompletedSessionInDatabase(sessionId, miner, successful, reward, computationalPower, txHash) {
    try {
      const { query } = require('../database/connection');
      
      await query(`
        UPDATE mining_sessions 
        SET status = ?, reward = ?, computational_power = ?, completed_at = NOW(), updated_at = NOW()
        WHERE id = ?
      `, [
        successful ? 'completed' : 'failed',
        reward.toString(),
        computationalPower.toString(),
        sessionId.toString()
      ]);

      console.log(`✅ Session ${sessionId} marked as completed in database`);
    } catch (error) {
      console.error('Failed to update completed session in database:', error);
    }
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
