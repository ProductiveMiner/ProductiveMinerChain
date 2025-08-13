import Web3 from 'web3';
import CONTRACT_CONFIG from '../config/contracts';
import ProductiveMinerFixedABI from '../contracts/ProductiveMinerFixed.json';

class Web3Service {
  constructor() {
    this.web3 = null;
    this.contract = null;
    this.account = null;
    this.network = null;
    this.isConnected = false;
  }

  // Initialize Web3 connection
  async initialize() {
    try {
      // Check if MetaMask is installed
      if (typeof window.ethereum !== 'undefined') {
        this.web3 = new Web3(window.ethereum);
        console.log('🔗 Web3 initialized with MetaMask');
        
        // Request account access
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        this.account = accounts[0];
        
        // Get network ID
        const networkId = await this.web3.eth.net.getId();
        this.network = this.getNetworkName(networkId);
        
        // Check if we're on the correct network (convert both to numbers for comparison)
        const numericNetworkId = typeof networkId === 'bigint' ? Number(networkId) : Number(networkId);
        const expectedChainId = Number(CONTRACT_CONFIG.NETWORKS.SEPOLIA.chainId);
        
        if (numericNetworkId !== expectedChainId) {
          console.warn(`⚠️ Wrong network detected: ${this.network}. Please switch to Sepolia Testnet.`);
          await this.switchToSepolia();
        }
        
        // Initialize contract
        await this.initializeContract();
        
        this.isConnected = true;
        console.log('✅ Web3 connection established');
        return true;
      } else {
        console.error('❌ MetaMask not found. Please install MetaMask.');
        return false;
      }
    } catch (error) {
      console.error('❌ Web3 initialization failed:', error);
      return false;
    }
  }

  // Switch to Sepolia testnet
  async switchToSepolia() {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${CONTRACT_CONFIG.NETWORKS.SEPOLIA.chainId.toString(16)}` }],
      });
      console.log('✅ Switched to Sepolia testnet');
    } catch (switchError) {
      // If Sepolia is not added to MetaMask, add it
      if (switchError.code === 4902) {
        await this.addSepoliaNetwork();
      } else {
        console.error('❌ Failed to switch network:', switchError);
      }
    }
  }

  // Add Sepolia network to MetaMask
  async addSepoliaNetwork() {
    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: `0x${CONTRACT_CONFIG.NETWORKS.SEPOLIA.chainId.toString(16)}`,
          chainName: 'Sepolia Testnet',
          nativeCurrency: CONTRACT_CONFIG.NETWORKS.SEPOLIA.nativeCurrency,
          rpcUrls: [CONTRACT_CONFIG.NETWORKS.SEPOLIA.rpcUrl],
          blockExplorerUrls: [CONTRACT_CONFIG.NETWORKS.SEPOLIA.explorerUrl]
        }],
      });
      console.log('✅ Sepolia network added to MetaMask');
    } catch (error) {
      console.error('❌ Failed to add Sepolia network:', error);
    }
  }

  // Initialize contract instance using Web3.js v4.x syntax
  async initializeContract() {
    try {
      const contractAddress = CONTRACT_CONFIG.CONTRACTS.PRODUCTIVE_MINER_FIXED.address;
      
      // Web3.js v4.x syntax
      this.contract = new this.web3.eth.Contract(
        ProductiveMinerFixedABI.abi,
        contractAddress
      );
      
      console.log('✅ Contract initialized:', contractAddress);
    } catch (error) {
      console.error('❌ Contract initialization failed:', error);
    }
  }

  // Get network name from chain ID
  getNetworkName(chainId) {
    // Convert chainId to number if it's a BigInt or string
    const numericChainId = typeof chainId === 'bigint' ? Number(chainId) : Number(chainId);
    
    switch (numericChainId) {
      case 1:
        return 'Ethereum Mainnet';
      case 11155111:
        return 'Sepolia Testnet';
      case 1337:
        return 'Local Network';
      default:
        return `Unknown Network (${chainId})`;
    }
  }

  // Get current account
  getCurrentAccount() {
    return this.account;
  }

  // Get current network
  getCurrentNetwork() {
    return this.network;
  }

  // Check if connected
  isWeb3Connected() {
    return this.isConnected && this.contract !== null;
  }

  // Contract interaction methods using Web3.js v4.x syntax
  async getContractInfo() {
    if (!this.contract) return null;
    
    try {
      const [owner, paused, maxDifficulty, baseReward, totalStaked, minedTokenAddress] = await Promise.all([
        this.contract.methods.owner().call(),
        this.contract.methods.paused().call(),
        this.contract.methods.maxDifficulty().call(),
        this.contract.methods.baseReward().call(),
        this.contract.methods.totalStaked().call(),
        this.contract.methods.minedToken().call()
      ]);

      return {
        owner,
        paused,
        maxDifficulty: maxDifficulty.toString(),
        baseReward: baseReward.toString(),
        totalStaked: totalStaked.toString(),
        minedTokenAddress,
        address: this.contract._address,
        network: this.network
      };
    } catch (error) {
      console.error('❌ Failed to get contract info:', error);
      return null;
    }
  }

  // Get miner statistics
  async getMinerStats(minerAddress) {
    if (!this.contract) return null;
    
    try {
      const stats = await this.contract.methods.getMinerStats(minerAddress).call();
      return {
        totalSessions: stats[0].toString(),
        totalDiscoveries: stats[1].toString(),
        totalRewards: stats[2].toString(),
        totalTokenRewards: stats[3].toString(),
        stakedAmount: stats[4].toString(),
        pendingRewards: stats[5].toString(),
        pendingTokenRewards: stats[6].toString(),
        researchContributions: stats[7].toString()
      };
    } catch (error) {
      console.error('❌ Failed to get miner stats:', error);
      return null;
    }
  }

  // Get staking information (using getMinerStats since there's no dedicated getStakingInfo function)
  async getStakingInfo(stakerAddress) {
    if (!this.contract) return null;
    
    try {
      const minerStats = await this.contract.methods.getMinerStats(stakerAddress).call();
      return {
        stakedAmount: minerStats[4].toString(), // stakedAmount from getMinerStats
        rewards: minerStats[5].toString(), // pendingRewards from getMinerStats
        tokenRewards: minerStats[6].toString(), // pendingTokenRewards from getMinerStats
        lastClaimTime: '0', // Not available in this contract
        apy: '12.5', // Fixed APY for now
        isActive: minerStats[4] > 0 // Active if staked amount > 0
      };
    } catch (error) {
      console.error('❌ Failed to get staking info:', error);
      return null;
    }
  }

  // Get network statistics
  async getNetworkStats() {
    if (!this.contract) return null;
    
    try {
      const stats = await this.contract.methods.getNetworkStats().call();
      return {
        totalDiscoveries: stats[0].toString(),
        totalSessions: stats[1].toString(),
        currentActiveSessions: stats[2].toString(),
        maxDifficulty: stats[3].toString(),
        baseReward: stats[4].toString(),
        quantumSecurityLevel: stats[5].toString(),
        totalStaked: stats[6].toString(),
        totalRewardsDistributed: stats[7].toString(),
        totalTokenRewardsDistributed: stats[8].toString(),
        averageComputationalComplexity: stats[9].toString(),
        totalResearchValue: stats[10].toString(),
        currentBlockHeight: stats[11].toString()
      };
    } catch (error) {
      console.error('❌ Failed to get network stats:', error);
      return null;
    }
  }

  // Start mining session
  async startMiningSession(workType, difficulty) {
    if (!this.contract || !this.account) return null;
    
    try {
      // Validate required parameters
      if (workType === undefined || workType === null) {
        throw new Error('workType is required');
      }
      if (difficulty === undefined || difficulty === null) {
        throw new Error('difficulty is required');
      }
      
      // Convert parameters to proper types for Web3.js v4.x
      // workType: uint8 -> number
      // difficulty: uint256 -> BigInt -> string
      const workTypeNum = Number(workType);
      const difficultyBigInt = BigInt(difficulty);
      const difficultyStr = difficultyBigInt.toString();
      
      console.log('Starting mining session with:', {
        workType: workTypeNum,
        difficulty: difficultyStr,
        workTypeType: typeof workTypeNum,
        difficultyType: typeof difficultyStr
      });
      
      // Try without gas estimation first
      console.log('Attempting contract call without gas estimation...');
      
      // Use Web3.js v4.x approach for proper type conversion
      const result = await this.contract.methods.startMiningSession(
        workTypeNum,
        difficultyStr
      ).send({
        from: this.account,
        gas: 500000 // Use fixed gas limit instead of estimation
      });
      
      console.log('Contract call successful:', result);
      return result;
    } catch (error) {
      console.error('❌ Failed to start mining session:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        data: error.data
      });
      return null;
    }
  }

  // Submit discovery
  async submitDiscovery(workType, difficulty, quantumSecurityLevel, proofHash, metadata) {
    if (!this.contract || !this.account) return null;
    
    try {
      // Validate required parameters
      if (workType === undefined || workType === null) {
        throw new Error('workType is required');
      }
      if (difficulty === undefined || difficulty === null) {
        throw new Error('difficulty is required');
      }
      if (quantumSecurityLevel === undefined || quantumSecurityLevel === null) {
        throw new Error('quantumSecurityLevel is required');
      }
      if (proofHash === undefined || proofHash === null) {
        throw new Error('proofHash is required');
      }
      if (metadata === undefined || metadata === null) {
        metadata = ''; // Default empty metadata
      }
      
      // Convert parameters to proper types for Web3.js v4.x
      // workType: uint8 -> number
      // difficulty: uint256 -> BigInt -> string
      // quantumSecurityLevel: uint256 -> BigInt -> string
      // proofHash: bytes32 -> string
      // metadata: string -> string
      const workTypeNum = Number(workType);
      const difficultyBigInt = BigInt(difficulty);
      const difficultyStr = difficultyBigInt.toString();
      const quantumSecurityLevelBigInt = BigInt(quantumSecurityLevel);
      const quantumSecurityLevelStr = quantumSecurityLevelBigInt.toString();
      const proofHashStr = proofHash.toString();
      const metadataStr = metadata.toString();
      
      console.log('Submitting discovery with:', {
        workType: workTypeNum,
        difficulty: difficultyStr,
        quantumSecurityLevel: quantumSecurityLevelStr,
        proofHash: proofHashStr,
        metadata: metadataStr
      });
      
      // Use fixed gas limit instead of estimation to avoid BigInt mixing issues
      const result = await this.contract.methods.submitDiscovery(
        workTypeNum,
        difficultyStr,
        quantumSecurityLevelStr,
        proofHashStr,
        metadataStr
      ).send({
        from: this.account,
        gas: 500000 // Use fixed gas limit instead of estimation
      });
      
      return result;
    } catch (error) {
      console.error('❌ Failed to submit discovery:', error);
      return null;
    }
  }

  // Complete mining session
  async completeMiningSession(sessionId, proofHash, metadata) {
    if (!this.contract || !this.account) return null;
    
    try {
      // Validate required parameters
      if (sessionId === undefined || sessionId === null) {
        throw new Error('sessionId is required');
      }
      if (proofHash === undefined || proofHash === null) {
        throw new Error('proofHash is required');
      }
      if (metadata === undefined || metadata === null) {
        metadata = ''; // Default empty metadata
      }
      
      // Convert parameters to proper types for Web3.js v4.x
      // sessionId: uint256 -> BigInt -> string
      // proofHash: bytes32 -> string
      // metadata: string -> string
      const sessionIdBigInt = BigInt(sessionId);
      const sessionIdStr = sessionIdBigInt.toString();
      const proofHashStr = proofHash.toString();
      const metadataStr = metadata.toString();
      
      console.log('Completing mining session with:', {
        sessionId: sessionIdStr,
        proofHash: proofHashStr,
        metadata: metadataStr
      });
      
      // Use fixed gas limit instead of estimation to avoid BigInt mixing issues
      const result = await this.contract.methods.completeMiningSession(
        sessionIdStr,
        proofHashStr,
        metadataStr
      ).send({
        from: this.account,
        gas: 500000 // Use fixed gas limit instead of estimation
      });
      
      return result;
    } catch (error) {
      console.error('❌ Failed to complete mining session:', error);
      return null;
    }
  }

  // Stake tokens
  async stakeTokens(amount) {
    if (!this.contract || !this.account) return null;
    
    try {
      const gasEstimate = await this.contract.methods.stake().estimateGas({
        from: this.account,
        value: this.web3.utils.toWei(amount.toString(), 'ether')
      });
      
      const result = await this.contract.methods.stake().send({
        from: this.account,
        value: this.web3.utils.toWei(amount.toString(), 'ether'),
        gas: Math.floor(gasEstimate * 1.2) // Add 20% buffer
      });
      
      return result;
    } catch (error) {
      console.error('❌ Failed to stake tokens:', error);
      return null;
    }
  }

  // Unstake tokens
  async unstakeTokens(amount) {
    if (!this.contract || !this.account) return null;
    
    try {
      const gasEstimate = await this.contract.methods.unstake(
        this.web3.utils.toWei(amount.toString(), 'ether')
      ).estimateGas({ from: this.account });
      
      const result = await this.contract.methods.unstake(
        this.web3.utils.toWei(amount.toString(), 'ether')
      ).send({
        from: this.account,
        gas: Math.floor(gasEstimate * 1.2) // Add 20% buffer
      });
      
      return result;
    } catch (error) {
      console.error('❌ Failed to unstake tokens:', error);
      return null;
    }
  }

  // Claim rewards
  async claimRewards() {
    if (!this.contract || !this.account) return null;
    
    try {
      const gasEstimate = await this.contract.methods.claimRewards().estimateGas({
        from: this.account
      });
      
      const result = await this.contract.methods.claimRewards().send({
        from: this.account,
        gas: Math.floor(gasEstimate * 1.2) // Add 20% buffer
      });
      
      return result;
    } catch (error) {
      console.error('❌ Failed to claim rewards:', error);
      return null;
    }
  }

  // Get user's active mining sessions
  async getActiveMiningSessions(userAddress) {
    if (!this.contract) return null;
    
    try {
      const sessions = await this.contract.methods.getActiveMiningSessions(userAddress).call();
      return sessions.map(session => ({
        sessionId: session[0].toString(),
        miner: session[1],
        workType: session[2].toString(),
        startTime: session[3].toString(),
        endTime: session[4].toString(),
        difficulty: session[5].toString(),
        quantumSecurityLevel: session[6].toString(),
        active: session[7],
        completed: session[8],
        computationalPower: session[9].toString(),
        energyConsumption: session[10].toString(),
        researchValue: session[11].toString()
      }));
    } catch (error) {
      console.error('❌ Failed to get active mining sessions:', error);
      return null;
    }
  }

  // Get user's discoveries
  async getUserDiscoveries(userAddress) {
    if (!this.contract) return null;
    
    try {
      const discoveries = await this.contract.methods.getUserDiscoveries(userAddress).call();
      return discoveries.map(discovery => ({
        id: discovery[0].toString(),
        miner: discovery[1],
        workType: discovery[2].toString(),
        difficulty: discovery[3].toString(),
        quantumSecurityLevel: discovery[4].toString(),
        reward: discovery[5].toString(),
        tokenReward: discovery[6].toString(),
        timestamp: discovery[7].toString(),
        proofHash: discovery[8],
        verified: discovery[9],
        metadata: discovery[10],
        computationalComplexity: discovery[11].toString(),
        impactScore: discovery[12].toString(),
        researchValue: discovery[13].toString()
      }));
    } catch (error) {
      console.error('❌ Failed to get user discoveries:', error);
      return null;
    }
  }

  // Setup account listener for MetaMask account changes
  setupAccountListener(callback) {
    if (typeof window.ethereum !== 'undefined') {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          this.account = accounts[0];
          callback(accounts[0]);
        } else {
          this.account = null;
          callback(null);
        }
      });
      
      // Also listen for network changes
      window.ethereum.on('chainChanged', (chainId) => {
        console.log('Network changed to chain ID:', chainId);
        // Re-initialize if needed
        this.initialize();
      });
    }
  }

  // Setup network listener for MetaMask network changes
  setupNetworkListener(callback) {
    if (typeof window.ethereum !== 'undefined') {
      window.ethereum.on('chainChanged', (chainId) => {
        console.log('Network changed to chain ID:', chainId);
        const networkName = this.getNetworkName(parseInt(chainId, 16));
        callback(networkName);
        // Re-initialize if needed
        this.initialize();
      });
    }
  }

  // Listen for events
  listenToEvents(eventName, callback) {
    if (!this.contract) return null;
    
    try {
      return this.contract.events[eventName]({}, (error, event) => {
        if (error) {
          console.error(`❌ Error listening to ${eventName}:`, error);
        } else {
          callback(event);
        }
      });
    } catch (error) {
      console.error(`❌ Failed to listen to ${eventName}:`, error);
      return null;
    }
  }

  // Disconnect
  disconnect() {
    this.web3 = null;
    this.contract = null;
    this.account = null;
    this.network = null;
    this.isConnected = false;
    console.log('🔌 Web3 disconnected');
  }
}

// Create singleton instance
const web3Service = new Web3Service();

export default web3Service;
