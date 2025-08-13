import { ethers } from 'ethers';
import CONTRACT_CONFIG from '../config/contracts';
import { MINED_TOKEN_CONFIG } from '../config/mined-token-config';
import MINEDTokenFixedABI from '../contracts/MINEDTokenFixed.json';

class MinedTokenService {
  constructor() {
    this.provider = null;
    this.contract = null;
    this.tokenContract = null;
    this.isInitialized = false;
  }

  async initialize() {
    try {
      // Initialize provider for Sepolia - Use Alchemy RPC directly for reliability
      const ALCHEMY_RPC_URL = 'https://eth-sepolia.g.alchemy.com/v2/EsD9nEjl3rvwE35tYtTZC';
      this.provider = new ethers.JsonRpcProvider(ALCHEMY_RPC_URL);
      
      // Get the network
      const network = await this.provider.getNetwork();
      
      // Check if we're on Sepolia
      if (network.chainId !== 11155111n) {
        console.warn('Network mismatch detected. Expected Sepolia (11155111), got:', network.chainId);
        // Don't throw error, just warn - the RPC should still work
      }
      
      // Initialize ProductiveMiner contract
      const contractABI = await this.getContractABI();
      this.contract = new ethers.Contract(
        CONTRACT_CONFIG.CONTRACTS.PRODUCTIVE_MINER_FIXED.address,
        contractABI,
        this.provider
      );
      
      // Initialize MINED token contract with actual ABI file
      this.tokenAsymptoticContract = new ethers.Contract(
        MINED_TOKEN_CONFIG.contracts.minedToken,
        MINEDTokenFixedABI.abi,
        this.provider
      );
      
      this.isInitialized = true;
      console.log('MINED Token Service initialized successfully with Alchemy RPC');
      return true;
    } catch (error) {
      console.error('Failed to initialize MINED Token Service:', error);
      
      // Try fallback RPC if main fails
      try {
        console.log('Trying fallback RPC...');
        const FALLBACK_RPC_URL = 'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161';
        this.provider = new ethers.JsonRpcProvider(FALLBACK_RPC_URL);
        
        // Test the fallback
        const network = await this.provider.getNetwork();
        console.log('Fallback RPC connected to:', network.name);
        
        // Reinitialize contracts with fallback
        const contractABI = await this.getContractABI();
        this.contract = new ethers.Contract(
          CONTRACT_CONFIG.CONTRACTS.PRODUCTIVE_MINER_FIXED.address,
          contractABI,
          this.provider
        );
        
        this.tokenAsymptoticContract = new ethers.Contract(
          MINED_TOKEN_CONFIG.contracts.minedToken,
          MINEDTokenFixedABI.abi,
          this.provider
        );
        
        this.isInitialized = true;
        console.log('MINED Token Service initialized successfully with fallback RPC');
        return true;
      } catch (fallbackError) {
        console.error('Fallback RPC also failed:', fallbackError);
        return false;
      }
    }
  }

  async getContractABI() {
    try {
      const response = await fetch('/contracts/ProductiveMinerFixed.json');
      const contractData = await response.json();
      return contractData.abi;
    } catch (error) {
      console.error('Failed to load contract ABI:', error);
      throw error;
    }
  }



  // Alias for getTokenBalance to match frontend expectations
  async getBalance(address) {
    return this.getTokenBalance(address);
  }

  // Refresh token balance (same as getBalance but with better logging)
  async refreshBalance(address) {
    console.log('Refreshing MINED token balance...');
    const balance = await this.getTokenBalance(address);
    console.log('Refreshed MINED token balance:', balance);
    return balance;
  }

  // Format amount for display
  formatAmount(amount) {
    if (!amount || amount === '0') return '0';
    const num = parseFloat(amount);
    return num.toLocaleString('en-US', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2
    });
  }

  // Check if token is deployed
  isTokenDeployed() {
    return this.isInitialized && this.contract !== null;
  }

  // Get token status
  getTokenStatus() {
    if (!this.isInitialized) return 'not_initialized';
    if (!this.contract) return 'not_deployed';
    return 'connected';
  }

  // Test RPC connection
  async testRPCConnection() {
    if (!this.provider) {
      console.error('No provider available');
      return false;
    }

    try {
      const blockNumber = await this.provider.getBlockNumber();
      const network = await this.provider.getNetwork();
      console.log(`RPC Test - Block: ${blockNumber}, Network: ${network.name} (${network.chainId})`);
      
      // Test contract call
      const testBalance = await this.tokenAsymptoticContract.balanceOf('0x9bEb6D047aB5126bF20D9BD0940e022628276ab4');
      console.log(`RPC Test - Contract call successful: ${ethers.formatEther(testBalance)}`);
      
      return true;
    } catch (error) {
      console.error('RPC Test failed:', error);
      return false;
    }
  }

  async getTokenBalance(address) {
    if (!this.isInitialized) {
      console.error('MINED Token Service not initialized');
      return '0';
    }

    try {
      console.log('=== MINED Token Balance Debug ===');
      console.log('Getting MINED token balance for address:', address);
      console.log('Using token contract address:', MINED_TOKEN_CONFIG.contracts.minedToken);
      console.log('Contract instance:', this.tokenAsymptoticContract);
      console.log('Provider:', this.provider);
      
      // Test RPC connection first
      try {
        const blockNumber = await this.provider.getBlockNumber();
        console.log('RPC Test - Current block:', blockNumber);
      } catch (rpcError) {
        console.error('RPC Test failed:', rpcError);
      }
      
      // Use the asymptotic contract instance with full ABI
      console.log('Calling balanceOf on contract...');
      const balance = await this.tokenAsymptoticContract.balanceOf(address);
      console.log('Raw MINED token balance:', balance);
      
      // Convert BigInt to string first, then format
      const balanceString = balance.toString();
      console.log('Balance as string:', balanceString);
      
      if (balanceString !== '0') {
        const formattedBalance = ethers.formatEther(balanceString);
        console.log('Formatted MINED token balance:', formattedBalance);
        console.log('=== Debug Complete ===');
        return formattedBalance;
      } else {
        console.log('MINED token balance is 0');
        console.log('=== Debug Complete ===');
        return '0';
      }
      
    } catch (error) {
      console.error('=== MINED Token Balance Error ===');
      console.error('Error getting MINED token balance:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        data: error.data,
        address: address,
        contractAddress: MINED_TOKEN_CONFIG.contracts.minedToken,
        provider: this.provider ? 'Available' : 'Not available',
        contractInstance: this.tokenAsymptoticContract ? 'Available' : 'Not available'
      });
      console.error('=== Error Debug Complete ===');
      // Return '0' for any error to prevent frontend crashes
      return '0';
    }
  }

  async getTokenInfo() {
    if (!this.isInitialized) {
      throw new Error('MINED Token Service not initialized');
    }

    try {
      // Get asymptotic token information from contract (new fixed contract has 7 return values)
      const asymptoticInfo = await this.tokenAsymptoticContract.getAsymptoticTokenInfo();
      const emissionParams = await this.tokenAsymptoticContract.getEmissionParameters();
      
      return {
        name: asymptoticInfo[0],
        symbol: asymptoticInfo[1],
        decimals: Number(asymptoticInfo[2]),
        totalSupply: ethers.formatEther(asymptoticInfo[3].toString()),
        currentBlockHeight: Number(asymptoticInfo[4]),
        totalResearchValue: asymptoticInfo[5].toString(),
        softCap: ethers.formatEther(asymptoticInfo[6].toString()),
        totalEmitted: ethers.formatEther(emissionParams[4].toString()), // Get from emission params
        initialEmissionRate: ethers.formatEther(emissionParams[0].toString()),
        decayConstant: Number(emissionParams[1]),
        researchMultiplierBase: Number(emissionParams[2]),
        network: 'Sepolia Testnet',
        contractAddress: CONTRACT_CONFIG.CONTRACTS.PRODUCTIVE_MINER_FIXED.address
      };
    } catch (error) {
      console.error('Failed to get token info:', error);
      throw error;
    }
  }

  async getEmissionRate() {
    if (!this.isInitialized) {
      throw new Error('MINED Token Service not initialized');
    }

    try {
      // Get asymptotic emission data from contract (new fixed contract has different return values)
      const asymptoticInfo = await this.tokenAsymptoticContract.getAsymptoticTokenInfo();
      const emissionParams = await this.tokenAsymptoticContract.getEmissionParameters();
      
      // Calculate current emission rate using asymptotic formula
      const currentBlockHeight = Number(asymptoticInfo[4]); // Index 4 in new contract
      const totalResearchValue = Number(asymptoticInfo[5]); // Index 5 in new contract
      const initialEmissionRate = parseFloat(ethers.formatEther(emissionParams[0].toString()));
      
      // Simple approximation of asymptotic emission
      const currentEmissionRate = initialEmissionRate * (1 + totalResearchValue * 0.01);
      
      return {
        currentRate: currentEmissionRate,
        totalDiscoveries: currentBlockHeight,
        baseReward: ethers.formatEther(emissionParams[0].toString()),
        totalResearchValue: totalResearchValue,
        currentBlockHeight: currentBlockHeight
      };
    } catch (error) {
      console.error('Failed to get emission rate:', error);
      throw error;
    }
  }

  async getStakingInfo(address) {
    if (!this.isInitialized) {
      throw new Error('MINED Token Service not initialized');
    }

    try {
      // Get real staking data from contract events
      const currentBlock = await this.provider.getBlockNumber();
      const fromBlock = 0;
      const toBlock = currentBlock;
      
      // Get Staked events for this address
      const stakedEvents = await this.contract.queryFilter('Staked', fromBlock, toBlock);
      const unstakedEvents = await this.contract.queryFilter('Unstaked', fromBlock, toBlock);
      
      // Calculate staked amount
      const totalStaked = stakedEvents
        .filter(event => event.args?.staker?.toLowerCase() === address.toLowerCase())
        .reduce((sum, event) => {
          return sum + parseFloat(ethers.formatEther((event.args?.amount || 0).toString()));
        }, 0);
      
      const totalUnstaked = unstakedEvents
        .filter(event => event.args?.staker?.toLowerCase() === address.toLowerCase())
        .reduce((sum, event) => {
          return sum + parseFloat(ethers.formatEther((event.args?.amount || 0).toString()));
        }, 0);
      
      const currentStaked = Math.max(0, totalStaked - totalUnstaked);
      
      return {
        stakedAmount: currentStaked,
        totalStaked: totalStaked,
        totalUnstaked: totalUnstaked,
        apy: 12.5, // Fixed APY for now
        rewards: currentStaked * 0.125 // Estimate based on APY
      };
    } catch (error) {
      console.error('Failed to get staking info:', error);
      throw error;
    }
  }

  async getTransactionHistory(address) {
    if (!this.isInitialized) {
      throw new Error('MINED Token Service not initialized');
    }

    try {
      // Get real transaction history from contract events
      const currentBlock = await this.provider.getBlockNumber();
      const fromBlock = 0;
      const toBlock = currentBlock;
      
      // Get all relevant events
      const rewardsEvents = await this.contract.queryFilter('RewardsClaimed', fromBlock, toBlock);
      const stakedEvents = await this.contract.queryFilter('Staked', fromBlock, toBlock);
      const unstakedEvents = await this.contract.queryFilter('Unstaked', fromBlock, toBlock);
      
      // Filter events for this address
      const addressEvents = [
        ...rewardsEvents.filter(e => e.args?.staker?.toLowerCase() === address.toLowerCase()),
        ...stakedEvents.filter(e => e.args?.staker?.toLowerCase() === address.toLowerCase()),
        ...unstakedEvents.filter(e => e.args?.staker?.toLowerCase() === address.toLowerCase())
      ];
      
      // Sort by block number (newest first)
      addressEvents.sort((a, b) => b.blockNumber - a.blockNumber);
      
      // Convert to transaction format
      const transactions = addressEvents.map(event => ({
        hash: event.transactionHash,
        type: event.eventName === 'RewardsClaimed' ? 'reward' : 
              event.eventName === 'Staked' ? 'stake' : 'unstake',
        amount: ethers.formatEther((event.args?.amount || 0).toString()),
        blockNumber: event.blockNumber,
        timestamp: new Date(event.blockNumber * 12000).toISOString()
      }));
      
      return transactions;
    } catch (error) {
      console.error('Failed to get transaction history:', error);
      throw error;
    }
  }

  // Remove mock balance method - no longer needed
}

export default new MinedTokenService();

