const { ethers } = require('ethers');

class ContractService {
  constructor() {
    this.provider = null;
    this.contract = null;
    this.signer = null;
    this.isConnected = false;
    this.contractAddress = process.env.CONTRACT_ADDRESS || '0x7877EFAb4aD3610792a135f6f8A241962fD2ab76'; // Correct MINEDToken address
    this.tokenAddress = process.env.TOKEN_ADDRESS || '0x7877EFAb4aD3610792a135f6f8A241962fD2ab76'; // Correct MINEDToken address
    this.privateKey = process.env.PRIVATE_KEY || null;
    this.rpcUrl = process.env.WEB3_PROVIDER || 'https://eth-sepolia.g.alchemy.com/v2/EsD9nEjl3rvwE35tYtTZC';
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
      // Load the complete MINEDTokenFixed ABI
      const fs = require('fs');
      const path = require('path');
      const contractABI = JSON.parse(fs.readFileSync(path.join(__dirname, '../contracts/MINEDToken.json'), 'utf8')).abi;

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
        throw new Error('Contract not initialized');
      }

      const [
        totalSupply,
        totalStaked,
        nextDiscoveryId,
        nextSessionId,
        stakingPoolBalance,
        validatorRewardPool,
        state
      ] = await Promise.all([
        this.contract.totalSupply(),
        this.contract.totalStaked(),
        this.contract.nextDiscoveryId(),
        this.contract.nextSessionId(),
        this.contract.stakingPoolBalance(),
        this.contract.validatorRewardPool(),
        this.contract.state()
      ]);

      return {
        maxDifficulty: 1000, // Default max difficulty for standalone contract
        baseReward: 1000, // Default base reward
        totalStaked: Number(totalStaked),
        totalDiscoveries: Number(nextDiscoveryId),
        totalSessions: Number(nextSessionId),
        totalRewardsDistributed: Number(validatorRewardPool),
        currentActiveSessions: 0, // Would need to iterate sessions to calculate
        quantumSecurityLevel: 256,
        averageComputationalComplexity: 750,
        totalSupply: Number(totalSupply),
        stakingPoolBalance: Number(stakingPoolBalance),
        totalBurned: Number(state.totalBurned),
        totalResearchValue: Number(state.totalResearchValue),
        totalValidators: Number(state.totalValidators)
      };
    } catch (error) {
      console.error('Failed to get network stats from contract:', error);
      throw error; // Re-throw error instead of returning mock data
    }
  }

  async getContractStats() {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      const [nextDiscoveryId, nextSessionId, totalStaked, validatorRewardPool, state] = await Promise.all([
        this.contract.nextDiscoveryId(),
        this.contract.nextSessionId(),
        this.contract.totalStaked(),
        this.contract.validatorRewardPool(),
        this.contract.state()
      ]);
      
      return {
        totalDiscoveries: Number(nextDiscoveryId),
        totalSessions: Number(nextSessionId),
        totalStaked: Number(totalStaked),
        totalRewardsDistributed: Number(validatorRewardPool),
        currentActiveSessions: 0, // Would need to iterate sessions to calculate
        isPaused: false // Standalone contract doesn't have pause functionality
      };
    } catch (error) {
      console.error('Failed to get contract stats:', error);
      throw error; // Re-throw error instead of returning mock data
    }
  }

  async getStakingInfo(address) {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      const [userStakes, userStakingRewards, totalStaked, validatorRewardPool] = await Promise.all([
        this.contract.userStakes(address),
        this.contract.userStakingRewards(address),
        this.contract.totalStaked(),
        this.contract.validatorRewardPool()
      ]);
      
      // Calculate APY based on validator reward pool and total staked
      const apy = totalStaked > 0 ? (Number(validatorRewardPool) / Number(totalStaked)) * 100 * 365 : 8.0;
      
      return {
        stakedAmount: Number(userStakes),
        rewards: Number(userStakingRewards),
        lastClaimTime: Date.now(), // Not available in standalone contract
        apy: Math.min(20, Math.max(0, apy)), // Cap at 20% APY
        isActive: Number(userStakes) > 0
      };
    } catch (error) {
      console.error('Failed to get staking info:', error);
      throw error; // Re-throw error instead of returning mock data
    }
  }

  async getMinerRewards(address) {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      // Get user staking rewards as a proxy for miner rewards
      const userStakingRewards = await this.contract.userStakingRewards(address);
      return Number(userStakingRewards);
    } catch (error) {
      console.error('Failed to get miner rewards:', error);
      throw error; // Re-throw error instead of returning mock data
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
        throw new Error('Contract not initialized');
      }

      const reward = await this.contract.calculateReward(difficulty, quantumLevel, computationalComplexity);
      return Number(reward);
    } catch (error) {
      console.error('Failed to calculate reward:', error);
      throw error; // Re-throw error instead of returning mock data
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

  // ============ NEW MINING FUNCTIONS ============

  /**
   * Start a new PoW mining session with automatic PoS conversion
   */
  async startPoWMiningSession(workType, difficulty, userAddress) {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      console.log(`🚀 Starting PoW mining session: workType=${workType}, difficulty=${difficulty}, user=${userAddress}`);
      
      const tx = await this.contract.startMiningSession(workType, difficulty);
      const receipt = await tx.wait();
      
      // Parse the MiningSessionStarted event
      const event = receipt.logs.find(log => {
        try {
          const parsed = this.contract.interface.parseLog(log);
          return parsed.name === 'MiningSessionStarted';
        } catch {
          return false;
        }
      });
      
      if (event) {
        const parsed = this.contract.interface.parseLog(event);
        const sessionId = parsed.args.sessionId;
        console.log(`✅ PoW mining session started: sessionId=${sessionId}`);
        return { success: true, sessionId: sessionId.toString() };
      }
      
      return { success: true, sessionId: 'unknown' };
    } catch (error) {
      console.error('❌ Failed to start PoW mining session:', error);
      throw error;
    }
  }

  /**
   * Submit a PoW result and automatically convert to PoS validation
   */
  async submitPoWResult(sessionId, nonce, hash, complexity, significance, userAddress) {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      console.log(`⛏️ Submitting PoW result: sessionId=${sessionId}, nonce=${nonce}, complexity=${complexity}`);
      
      const tx = await this.contract.submitPoWResult(sessionId, nonce, hash, complexity, significance);
      const receipt = await tx.wait();
      
      // Parse the events
      const events = receipt.logs.map(log => {
        try {
          return this.contract.interface.parseLog(log);
        } catch {
          return null;
        }
      }).filter(Boolean);
      
      const miningCompleted = events.find(e => e.name === 'MiningSessionCompleted');
      const powSubmitted = events.find(e => e.name === 'PoWResultSubmitted');
      const autoValidation = events.find(e => e.name === 'AutoValidationRequested');
      const discoverySubmitted = events.find(e => e.name === 'DiscoverySubmitted');
      
      console.log(`✅ PoW result submitted successfully`);
      console.log(`📊 Events: MiningCompleted=${!!miningCompleted}, PoWSubmitted=${!!powSubmitted}, AutoValidation=${!!autoValidation}, DiscoverySubmitted=${!!discoverySubmitted}`);
      
      return {
        success: true,
        resultId: powSubmitted ? powSubmitted.args.resultId.toString() : 'unknown',
        discoveryId: discoverySubmitted ? discoverySubmitted.args.discoveryId.toString() : 'unknown',
        events: {
          miningCompleted: !!miningCompleted,
          powSubmitted: !!powSubmitted,
          autoValidation: !!autoValidation,
          discoverySubmitted: !!discoverySubmitted
        }
      };
    } catch (error) {
      console.error('❌ Failed to submit PoW result:', error);
      throw error;
    }
  }

  /**
   * Get mining session details
   */
  async getMiningSession(sessionId) {
    try {
      if (!this.contract) {
        return this.getMockMiningSession(sessionId);
      }

      const session = await this.contract.getMiningSession(sessionId);
      
      return {
        targetHash: session.targetHash.toString(),
        startTime: session.startTime.toString(),
        endTime: session.endTime.toString(),
        nonce: session.nonce.toString(),
        difficulty: session.difficulty.toString(),
        workType: session.workType.toString(),
        miner: session.miner,
        isCompleted: session.isCompleted,
        autoValidationRequested: session.autoValidationRequested
      };
    } catch (error) {
      console.error('❌ Failed to get mining session:', error);
      return this.getMockMiningSession(sessionId);
    }
  }

  /**
   * Get PoW result details
   */
  async getPoWResult(resultId) {
    try {
      if (!this.contract) {
        return this.getMockPoWResult(resultId);
      }

      const result = await this.contract.getPoWResult(resultId);
      
      return {
        hash: result.hash.toString(),
        timestamp: result.timestamp.toString(),
        sessionId: result.sessionId.toString(),
        complexity: result.complexity.toString(),
        significance: result.significance.toString(),
        miner: result.miner,
        isValid: result.isValid
      };
    } catch (error) {
      console.error('❌ Failed to get PoW result:', error);
      return this.getMockPoWResult(resultId);
    }
  }

  /**
   * Get comprehensive mining statistics including PoW-to-PoS conversion
   */
  async getMiningStats() {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      const stats = await this.contract.getMiningStats();
      
      return {
        totalSessions: stats.totalSessions.toString(),
        completedSessions: stats.completedSessions.toString(),
        totalPoWResults: stats.totalPoWResults.toString(),
        autoValidationRequests: stats.autoValidationRequests.toString(),
        powToPosConversionRate: stats.completedSessions > 0 ? 
          (stats.autoValidationRequests * 100 / stats.completedSessions).toFixed(2) + '%' : '0%'
      };
    } catch (error) {
      console.error('❌ Failed to get mining stats:', error);
      throw error; // Re-throw error instead of returning mock data
    }
  }

  // ============ STAKING POOL FUNCTIONS ============

  /**
   * Stake tokens to contribute to validator reward pool
   */
  async stakeTokens(amount, userAddress) {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      console.log(`🔒 Staking tokens: amount=${amount}, user=${userAddress}`);
      
      const tx = await this.contract.stake(amount);
      const receipt = await tx.wait();
      
      // Parse the TokensStaked event
      const event = receipt.logs.find(log => {
        try {
          const parsed = this.contract.interface.parseLog(log);
          return parsed.name === 'TokensStaked';
        } catch {
          return false;
        }
      });
      
      if (event) {
        const parsed = this.contract.interface.parseLog(event);
        console.log(`✅ Tokens staked successfully: ${parsed.args.amount.toString()}`);
      }
      
      return { success: true, amount: amount.toString() };
    } catch (error) {
      console.error('❌ Failed to stake tokens:', error);
      throw error;
    }
  }

  /**
   * Unstake tokens from the staking pool
   */
  async unstakeTokens(amount, userAddress) {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      console.log(`🔓 Unstaking tokens: amount=${amount}, user=${userAddress}`);
      
      const tx = await this.contract.unstake(amount);
      const receipt = await tx.wait();
      
      // Parse the TokensUnstaked event
      const event = receipt.logs.find(log => {
        try {
          const parsed = this.contract.interface.parseLog(log);
          return parsed.name === 'TokensUnstaked';
        } catch {
          return false;
        }
      });
      
      if (event) {
        const parsed = this.contract.interface.parseLog(event);
        console.log(`✅ Tokens unstaked successfully: ${parsed.args.amount.toString()}`);
      }
      
      return { success: true, amount: amount.toString() };
    } catch (error) {
      console.error('❌ Failed to unstake tokens:', error);
      throw error;
    }
  }

  /**
   * Claim staking rewards
   */
  async claimStakingRewards(userAddress) {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      console.log(`💰 Claiming staking rewards: user=${userAddress}`);
      
      const tx = await this.contract.claimStakingRewards();
      const receipt = await tx.wait();
      
      // Parse the StakingRewardsClaimed event
      const event = receipt.logs.find(log => {
        try {
          const parsed = this.contract.interface.parseLog(log);
          return parsed.name === 'StakingRewardsClaimed';
        } catch {
          return false;
        }
      });
      
      if (event) {
        const parsed = this.contract.interface.parseLog(event);
        console.log(`✅ Staking rewards claimed: ${parsed.args.amount.toString()}`);
        return { success: true, rewards: parsed.args.amount.toString() };
      }
      
      return { success: true, rewards: '0' };
    } catch (error) {
      console.error('❌ Failed to claim staking rewards:', error);
      throw error;
    }
  }

  /**
   * Get staking pool information
   */
  async getStakingPoolInfo() {
    try {
      if (!this.contract) {
        return this.getMockStakingPoolInfo();
      }

      const [totalStaked, stakingPoolBalance, validatorRewardPool, state] = await Promise.all([
        this.contract.totalStaked(),
        this.contract.stakingPoolBalance(),
        this.contract.validatorRewardPool(),
        this.contract.state()
      ]);
      
      return {
        totalStaked: totalStaked.toString(),
        stakingPoolBalance: stakingPoolBalance.toString(),
        validatorRewardPool: validatorRewardPool.toString(),
        totalValidators: state.totalValidators.toString(),
        totalStakingRewards: '0' // Not tracked separately in standalone contract
      };
    } catch (error) {
      console.error('❌ Failed to get staking pool info:', error);
      return this.getMockStakingPoolInfo();
    }
  }

  /**
   * Get validator reward information
   */
  async getValidatorRewardInfo() {
    try {
      if (!this.contract) {
        return this.getMockValidatorRewardInfo();
      }

      const validatorRewardPool = await this.contract.validatorRewardPool();
      
      return {
        availableRewards: validatorRewardPool.toString(),
        totalValidatorRewards: validatorRewardPool.toString(),
        pendingValidationFees: '0' // Not tracked separately in standalone contract
      };
    } catch (error) {
      console.error('❌ Failed to get validator reward info:', error);
      return this.getMockValidatorRewardInfo();
    }
  }

  /**
   * Get user staking information
   */
  async getUserStakingInfo(userAddress) {
    try {
      if (!this.contract) {
        return this.getMockUserStakingInfo(userAddress);
      }

      const [userStakes, userStakingRewards] = await Promise.all([
        this.contract.userStakes(userAddress),
        this.contract.userStakingRewards(userAddress)
      ]);
      
      return {
        stakedAmount: userStakes.toString(),
        pendingRewards: userStakingRewards.toString(),
        totalRewards: userStakingRewards.toString()
      };
    } catch (error) {
      console.error('❌ Failed to get user staking info:', error);
      return this.getMockUserStakingInfo(userAddress);
    }
  }

  /**
   * Get initial validators information
   */
  async getInitialValidatorsInfo() {
    try {
      if (!this.contract) {
        return this.getMockInitialValidatorsInfo();
      }

      // Get state info to get total validators
      const state = await this.contract.state();
      const totalValidators = Number(state.totalValidators);
      
      // For standalone contract, we can't get individual validator info easily
      // Return basic info based on state
      const validators = [];
      for (let i = 0; i < totalValidators; i++) {
        validators.push({
          address: `0x${i.toString().padStart(40, '0')}`, // Placeholder addresses
          stakedAmount: '1000000000000000000000000', // 1M tokens default
          reputation: '100',
          isActive: true
        });
      }
      
      return {
        validators,
        totalValidators: totalValidators,
        totalStaked: (totalValidators * 1000000000000000000000000).toString(),
        systemInfo: {
          powOnlyMinting: true,
          description: "New tokens are ONLY minted from PoW activities",
          validatorRewardSource: "staking_pool",
          initialValidators: totalValidators
        }
      };
    } catch (error) {
      console.error('❌ Failed to get initial validators info:', error);
      return this.getMockInitialValidatorsInfo();
    }
  }

  /**
   * Get PoW-only minting statistics
   */
  async getPoWMintingStats() {
    try {
      if (!this.contract) {
        return this.getMockPoWMintingStats();
      }

      // Get system info to show PoW-only minting
      const systemInfo = await this.contract.state();
      
      return {
        totalSupply: systemInfo.totalSupply ? systemInfo.totalSupply.toString() : '0',
        totalBurned: systemInfo.totalBurned ? systemInfo.totalBurned.toString() : '0',
        totalResearchValue: systemInfo.totalResearchValue ? systemInfo.totalResearchValue.toString() : '0',
        totalValidators: systemInfo.totalValidators ? systemInfo.totalValidators.toString() : '0',
        totalDiscoveries: systemInfo.nextDiscoveryId ? systemInfo.nextDiscoveryId.toString() : '0',
        powOnlyMinting: true,
        mintingSources: {
          powMining: "ONLY source of new token minting",
          validatorRewards: "from staking pool (no minting)",
          stakingRewards: "from staking pool (no minting)",
          emission: "DISABLED - no emission minting"
        },
        validatorSystem: {
          initialValidators: 5,
          rewardSource: "staking_pool",
          stakingPoolContribution: "10% of all staked tokens"
        }
      };
    } catch (error) {
      console.error('❌ Failed to get PoW minting stats:', error);
      return this.getMockPoWMintingStats();
    }
  }

  /**
   * Get discovery reward information
   */
  async getDiscoveryRewardInfo() {
    try {
      if (!this.contract) {
        return this.getMockDiscoveryRewardInfo();
      }

      // Get state info to get discovery count
      const state = await this.contract.state();
      const totalDiscoveries = Number(state.nextDiscoveryId);
      
      return {
        totalPoWDiscoveries: totalDiscoveries.toString(),
        totalManualDiscoveries: '0', // Not tracked separately in standalone contract
        totalPoWRewards: '0', // Not tracked separately in standalone contract
        totalManualRewards: '0', // Not tracked separately in standalone contract
        pendingManualRewards: '0', // Not tracked separately in standalone contract
        manualRewardsEnabled: true,
        rewardSystem: {
          powRewards: "New tokens minted for PoW discoveries",
          manualRewards: "Existing tokens from staking pool for validated manual discoveries",
          rewardRatio: "Manual discoveries get 50% of PoW rewards (using existing tokens)",
          validationRequired: "Manual discoveries must pass PoS validation to receive rewards"
        }
      };
    } catch (error) {
      console.error('❌ Failed to get discovery reward info:', error);
      return this.getMockDiscoveryRewardInfo();
    }
  }

  /**
   * Calculate potential manual discovery reward
   */
  async calculateManualDiscoveryReward(workType, complexity, significance, researchValue, isCollaborative) {
    try {
      if (!this.contract) {
        return this.getMockManualDiscoveryReward(workType, complexity, significance, researchValue, isCollaborative);
      }

      // This would require calling the contract's _calcManualDiscoveryReward function
      // For now, we'll calculate it client-side based on the same formula
      const baseRewards = {
        0: 1000, // Riemann
        1: 750,  // Goldbach
        2: 700,  // Birch-Swinnerton
        3: 500,  // Prime Pattern
        4: 650,  // Twin Primes
        5: 600,  // Collatz
        6: 720,  // Perfect Numbers
        7: 1000, // Mersenne
        8: 450,  // Fibonacci
        9: 400,  // Pascal
        10: 760, // Differential
        11: 640, // Number Theory
        12: 900, // Yang-Mills
        13: 850, // Navier-Stokes
        14: 550, // ECC
        15: 800, // Lattice
        16: 680, // Crypto Hash
        17: 950, // Poincare
        18: 920, // Algebraic Topology
        19: 560, // Euclidean
        20: 1100, // Quantum
        21: 840, // ML
        22: 600, // Blockchain
        23: 560, // Distributed
        24: 760  // Optimization
      };

      const baseReward = baseRewards[workType] || 500;
      const complexityMultiplier = complexity * 500;
      const significanceMultiplier = significance * 250;
      const researchMultiplier = researchValue / 2000;
      
      let reward = baseReward * complexityMultiplier * significanceMultiplier * researchMultiplier / 1000000;
      
      if (isCollaborative) {
        reward = reward * 1.2; // 20% bonus
      }
      
      // Manual discoveries get 50% of PoW rewards
      reward = reward / 2;
      
      return {
        potentialReward: Math.floor(reward).toString(),
        baseReward: baseReward.toString(),
        complexityMultiplier: complexityMultiplier.toString(),
        significanceMultiplier: significanceMultiplier.toString(),
        researchMultiplier: researchMultiplier.toString(),
        collaborativeBonus: isCollaborative ? "20%" : "0%",
        finalMultiplier: "50% of PoW reward (using existing tokens)"
      };
    } catch (error) {
      console.error('❌ Failed to calculate manual discovery reward:', error);
      return this.getMockManualDiscoveryReward(workType, complexity, significance, researchValue, isCollaborative);
    }
  }

  // ============ MOCK FUNCTIONS FOR FALLBACK ============

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
      this.contract.on('DiscoverySubmitted', async (id, researcher, workType, value, event) => {
        console.log('🎯 New discovery submitted:', {
          discoveryId: id.toString(),
          researcher,
          workType: workType.toString(),
          value: value.toString(),
          txHash: event.transactionHash
        });

        // Update database with new discovery
        await this.updateDiscoveryInDatabase(id, researcher, workType, value, 0, 0, event.transactionHash);
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
  async updateDiscoveryInDatabase(discoveryId, researcher, workType, value, reward, computationalComplexity, txHash) {
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
        INSERT INTO discoveries (id, miner_address, work_type, difficulty, reward, computational_complexity, tx_hash, research_value, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE
        miner_address = VALUES(miner_address),
        work_type = VALUES(work_type),
        difficulty = VALUES(difficulty),
        reward = VALUES(reward),
        computational_complexity = VALUES(computational_complexity),
        tx_hash = VALUES(tx_hash),
        research_value = VALUES(research_value),
        updated_at = NOW()
      `, [
        discoveryId.toString(),
        researcher,
        workTypeName,
        '0', // difficulty not in event
        reward.toString(),
        computationalComplexity.toString(),
        txHash,
        value.toString()
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

  // ============ MOCK STAKING FUNCTIONS ============

  getMockStakingPoolInfo() {
    return {
      totalStaked: '1000000000000000000000000', // 1M tokens
      stakingPoolBalance: '1000000000000000000000000',
      validatorRewardPool: '100000000000000000000000', // 100K tokens
      totalValidators: '1',
      totalStakingRewards: '50000000000000000000000' // 50K tokens
    };
  }

  getMockValidatorRewardInfo() {
    return {
      availableRewards: '100000000000000000000000',
      totalValidatorRewards: '50000000000000000000000',
      pendingValidationFees: '10000000000000000000000'
    };
  }

  getMockUserStakingInfo(userAddress) {
    return {
      stakedAmount: '100000000000000000000000', // 100K tokens
      pendingRewards: '5000000000000000000000', // 5K tokens
      totalRewards: '5000000000000000000000'
    };
  }

  // ============ MOCK FUNCTIONS FOR NEW FEATURES ============

  getMockInitialValidatorsInfo() {
    return {
      validators: [
        {
          address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
          stakedAmount: '1000000000000000000000000', // 1M tokens
          reputation: '100',
          isActive: true
        },
        {
          address: '0x1234567890123456789012345678901234567890',
          stakedAmount: '500000000000000000000000', // 500K tokens
          reputation: '100',
          isActive: true
        },
        {
          address: '0x2345678901234567890123456789012345678901',
          stakedAmount: '500000000000000000000000', // 500K tokens
          reputation: '100',
          isActive: true
        },
        {
          address: '0x3456789012345678901234567890123456789012',
          stakedAmount: '300000000000000000000000', // 300K tokens
          reputation: '100',
          isActive: true
        },
        {
          address: '0x4567890123456789012345678901234567890123',
          stakedAmount: '200000000000000000000000', // 200K tokens
          reputation: '100',
          isActive: true
        }
      ],
      totalValidators: 5,
      totalStaked: '2500000000000000000000000', // 2.5M tokens
      systemInfo: {
        powOnlyMinting: true,
        description: "New tokens are ONLY minted from PoW activities",
        validatorRewardSource: "staking_pool",
        initialValidators: 5
      }
    };
  }

  getMockPoWMintingStats() {
    return {
      totalSupply: '1000000000000000000000000000', // 1B tokens
      totalBurned: '7347000000000000000000', // 7.347M burned
      totalResearchValue: '2882361000000000000000000', // 2.88B research value
      totalValidators: '5',
      totalDiscoveries: '136',
      powOnlyMinting: true,
      mintingSources: {
        powMining: "ONLY source of new token minting",
        validatorRewards: "from staking pool (no minting)",
        stakingRewards: "from staking pool (no minting)",
        emission: "DISABLED - no emission minting"
      },
      validatorSystem: {
        initialValidators: 5,
        rewardSource: "staking_pool",
        stakingPoolContribution: "10% of all staked tokens"
      }
    };
  }

  // ============ MOCK FUNCTIONS FOR DISCOVERY REWARDS ============

  getMockDiscoveryRewardInfo() {
    return {
      totalPoWDiscoveries: '136',
      totalManualDiscoveries: '25',
      totalPoWRewards: '5000000000000000000000000', // 5M tokens
      totalManualRewards: '250000000000000000000000', // 250K tokens
      pendingManualRewards: '50000000000000000000000', // 50K tokens
      manualRewardsEnabled: true,
      rewardSystem: {
        powRewards: "New tokens minted for PoW discoveries",
        manualRewards: "Existing tokens from staking pool for validated manual discoveries",
        rewardRatio: "Manual discoveries get 50% of PoW rewards (using existing tokens)",
        validationRequired: "Manual discoveries must pass PoS validation to receive rewards"
      }
    };
  }

  getMockManualDiscoveryReward(workType, complexity, significance, researchValue, isCollaborative) {
    const baseRewards = {
      0: 1000, // Riemann
      1: 750,  // Goldbach
      2: 700,  // Birch-Swinnerton
      3: 500,  // Prime Pattern
      4: 650,  // Twin Primes
      5: 600,  // Collatz
      6: 720,  // Perfect Numbers
      7: 1000, // Mersenne
      8: 450,  // Fibonacci
      9: 400,  // Pascal
      10: 760, // Differential
      11: 640, // Number Theory
      12: 900, // Yang-Mills
      13: 850, // Navier-Stokes
      14: 550, // ECC
      15: 800, // Lattice
      16: 680, // Crypto Hash
      17: 950, // Poincare
      18: 920, // Algebraic Topology
      19: 560, // Euclidean
      20: 1100, // Quantum
      21: 840, // ML
      22: 600, // Blockchain
      23: 560, // Distributed
      24: 760  // Optimization
    };

    const baseReward = baseRewards[workType] || 500;
    const complexityMultiplier = complexity * 500;
    const significanceMultiplier = significance * 250;
    const researchMultiplier = researchValue / 2000;
    
    let reward = baseReward * complexityMultiplier * significanceMultiplier * researchMultiplier / 1000000;
    
    if (isCollaborative) {
      reward = reward * 1.2; // 20% bonus
    }
    
    // Manual discoveries get 50% of PoW rewards
    reward = reward / 2;
    
    return {
      potentialReward: Math.floor(reward).toString(),
      baseReward: baseReward.toString(),
      complexityMultiplier: complexityMultiplier.toString(),
      significanceMultiplier: significanceMultiplier.toString(),
      researchMultiplier: researchMultiplier.toString(),
      collaborativeBonus: isCollaborative ? "20%" : "0%",
      finalMultiplier: "50% of PoW reward (using existing tokens)"
    };
  }
}

module.exports = new ContractService();
