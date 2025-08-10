import Web3 from 'web3';
import CONTRACT_CONFIG from '../config/contracts';
import ProductiveMinerSecureABI from '../contracts/ProductiveMinerSecure.json';

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
        
        // Check if we're on the correct network
        if (networkId !== CONTRACT_CONFIG.NETWORKS.SEPOLIA.chainId) {
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

  // Initialize contract instance
  async initializeContract() {
    try {
      const contractAddress = CONTRACT_CONFIG.CONTRACTS.PRODUCTIVE_MINER_SECURE.address;
      this.contract = new this.web3.eth.Contract(
        ProductiveMinerSecureABI.abi,
        contractAddress
      );
      console.log('✅ Contract initialized:', contractAddress);
    } catch (error) {
      console.error('❌ Contract initialization failed:', error);
    }
  }

  // Get network name from chain ID
  getNetworkName(chainId) {
    switch (chainId) {
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

  // Contract interaction methods
  async getContractInfo() {
    if (!this.contract) return null;
    
    try {
      const [owner, paused, maxDifficulty, baseReward, totalStaked] = await Promise.all([
        this.contract.methods.owner().call(),
        this.contract.methods.paused().call(),
        this.contract.methods.maxDifficulty().call(),
        this.contract.methods.baseReward().call(),
        this.contract.methods.totalStaked().call()
      ]);

      return {
        owner,
        paused,
        maxDifficulty,
        baseReward,
        totalStaked,
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
        totalSessions: stats.totalSessions,
        totalDiscoveries: stats.totalDiscoveries,
        totalRewards: stats.totalRewards,
        stakedAmount: stats.stakedAmount,
        pendingRewards: stats.pendingRewards
      };
    } catch (error) {
      console.error('❌ Failed to get miner stats:', error);
      return null;
    }
  }

  // Get staking information
  async getStakingInfo(stakerAddress) {
    if (!this.contract) return null;
    
    try {
      const stakingInfo = await this.contract.methods.getStakingInfo(stakerAddress).call();
      return {
        stakedAmount: stakingInfo.stakedAmount,
        rewards: stakingInfo.rewards,
        lastClaimTime: stakingInfo.lastClaimTime,
        isActive: stakingInfo.isActive
      };
    } catch (error) {
      console.error('❌ Failed to get staking info:', error);
      return null;
    }
  }

  // Start mining session
  async startMiningSession(workType, difficulty) {
    if (!this.contract || !this.account) {
      throw new Error('Web3 not connected or no account selected');
    }

    try {
      const gasEstimate = await this.contract.methods
        .startMiningSession(workType, difficulty)
        .estimateGas({ from: this.account });

      const result = await this.contract.methods
        .startMiningSession(workType, difficulty)
        .send({
          from: this.account,
          gas: Math.floor(gasEstimate * 1.2) // Add 20% buffer
        });

      console.log('✅ Mining session started:', result.transactionHash);
      return result;
    } catch (error) {
      console.error('❌ Failed to start mining session:', error);
      throw error;
    }
  }

  // Complete mining session
  async completeMiningSession(sessionId, proofHash, metadata) {
    if (!this.contract || !this.account) {
      throw new Error('Web3 not connected or no account selected');
    }

    try {
      const gasEstimate = await this.contract.methods
        .completeMiningSession(sessionId, proofHash, metadata)
        .estimateGas({ from: this.account });

      const result = await this.contract.methods
        .completeMiningSession(sessionId, proofHash, metadata)
        .send({
          from: this.account,
          gas: Math.floor(gasEstimate * 1.2) // Add 20% buffer
        });

      console.log('✅ Mining session completed:', result.transactionHash);
      return result;
    } catch (error) {
      console.error('❌ Failed to complete mining session:', error);
      throw error;
    }
  }

  // Stake tokens
  async stake(amount) {
    if (!this.contract || !this.account) {
      throw new Error('Web3 not connected or no account selected');
    }

    try {
      const gasEstimate = await this.contract.methods
        .stake()
        .estimateGas({ from: this.account, value: amount });

      const result = await this.contract.methods
        .stake()
        .send({
          from: this.account,
          value: amount,
          gas: Math.floor(gasEstimate * 1.2) // Add 20% buffer
        });

      console.log('✅ Tokens staked:', result.transactionHash);
      return result;
    } catch (error) {
      console.error('❌ Failed to stake tokens:', error);
      throw error;
    }
  }

  // Unstake tokens
  async unstake(amount) {
    if (!this.contract || !this.account) {
      throw new Error('Web3 not connected or no account selected');
    }

    try {
      const gasEstimate = await this.contract.methods
        .unstake(amount)
        .estimateGas({ from: this.account });

      const result = await this.contract.methods
        .unstake(amount)
        .send({
          from: this.account,
          gas: Math.floor(gasEstimate * 1.2) // Add 20% buffer
        });

      console.log('✅ Tokens unstaked:', result.transactionHash);
      return result;
    } catch (error) {
      console.error('❌ Failed to unstake tokens:', error);
      throw error;
    }
  }

  // Claim rewards
  async claimRewards() {
    if (!this.contract || !this.account) {
      throw new Error('Web3 not connected or no account selected');
    }

    try {
      const gasEstimate = await this.contract.methods
        .claimRewards()
        .estimateGas({ from: this.account });

      const result = await this.contract.methods
        .claimRewards()
        .send({
          from: this.account,
          gas: Math.floor(gasEstimate * 1.2) // Add 20% buffer
        });

      console.log('✅ Rewards claimed:', result.transactionHash);
      return result;
    } catch (error) {
      console.error('❌ Failed to claim rewards:', error);
      throw error;
    }
  }

  // Listen for account changes
  setupAccountListener(callback) {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        this.account = accounts[0];
        console.log('🔄 Account changed:', this.account);
        if (callback) callback(this.account);
      });
    }
  }

  // Listen for network changes
  setupNetworkListener(callback) {
    if (window.ethereum) {
      window.ethereum.on('chainChanged', (chainId) => {
        const networkId = parseInt(chainId, 16);
        this.network = this.getNetworkName(networkId);
        console.log('🔄 Network changed:', this.network);
        if (callback) callback(this.network);
      });
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
