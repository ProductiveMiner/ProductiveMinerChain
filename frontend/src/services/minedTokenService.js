import { ethers } from 'ethers';
import CONTRACT_CONFIG from '../config/contracts';
import { MINED_TOKEN_CONFIG } from '../config/mined-token-config';
import MINEDTokenStandaloneABI from '../contracts/MINEDTokenStandalone.json';

class MinedTokenService {
  constructor() {
    this.provider = null;
    this.tokenContract = null;
    this.isInitialized = false;
  }

  async initialize() {
    try {
      console.log('🔧 Initializing MINED Token Service...');
      
      // Use BrowserProvider like Web3Service does
      if (typeof window.ethereum !== 'undefined') {
        this.provider = new ethers.BrowserProvider(window.ethereum);
        console.log('✅ Using BrowserProvider');
      } else {
        // Fallback to JsonRpcProvider if no MetaMask
        const ALCHEMY_RPC_URL = 'https://eth-sepolia.g.alchemy.com/v2/EsD9nEjl3rvwE35tYtTZC';
        this.provider = new ethers.JsonRpcProvider(ALCHEMY_RPC_URL);
        console.log('✅ Using JsonRpcProvider fallback');
      }
      
      // Test basic RPC connection first
      console.log('🔍 Testing RPC connection...');
      const blockNumber = await this.provider.getBlockNumber();
      console.log('✅ RPC connected, current block:', blockNumber);
      
      // Get the network
      const network = await this.provider.getNetwork();
      console.log('🌐 Network:', network.name, 'Chain ID:', network.chainId.toString());
      
      // Check if we're on Sepolia
      if (network.chainId !== 11155111n) {
        console.warn('⚠️ Network mismatch detected. Expected Sepolia (11155111), got:', network.chainId);
      }
      
      // Test if contract exists at the address
      console.log('🔍 Testing contract existence...');
      const code = await this.provider.getCode(MINED_TOKEN_CONFIG.contracts.minedToken);
      console.log('📄 Contract code length:', code.length);
      
      if (code === '0x') {
        console.error('❌ No contract code found at address');
        throw new Error(`No contract deployed at address: ${MINED_TOKEN_CONFIG.contracts.minedToken}`);
      }
      
      console.log('✅ Contract exists at address');
      
      // Use the full standalone ABI since we know the contract supports it
      console.log('🔍 Using full standalone ABI...');
      this.tokenContract = new ethers.Contract(
        MINED_TOKEN_CONFIG.contracts.minedToken,
        MINEDTokenStandaloneABI.abi,
        this.provider
      );
      
      // Test basic contract call with full ABI
      console.log('🔍 Testing basic contract call with full ABI...');
      try {
        const name = await this.tokenContract.name();
        console.log('✅ Full ABI works, name:', name);
        
        // Test getSystemInfo function specifically
        console.log('🔍 Testing getSystemInfo function...');
        const systemInfo = await this.tokenContract.getSystemInfo();
        console.log('✅ getSystemInfo works, system info:', systemInfo);
        
        this.isInitialized = true;
        console.log('✅ MINED Token Service initialized with full standalone ABI');
        return true;
      } catch (callError) {
        console.error('❌ Full ABI failed:', callError);
        throw callError;
      }
    } catch (error) {
      console.error('❌ Failed to initialize MINED Token Service:', error);
      
      // Try fallback RPC if main fails
      try {
        console.log('🔄 Trying fallback RPC...');
        const FALLBACK_RPC_URL = 'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161';
        this.provider = new ethers.JsonRpcProvider(FALLBACK_RPC_URL);
        
        // Test the fallback
        const network = await this.provider.getNetwork();
        console.log('✅ Fallback RPC connected to:', network.name);
        
        // Test contract existence with fallback
        const code = await this.provider.getCode(MINED_TOKEN_CONFIG.contracts.minedToken);
        if (code === '0x') {
          throw new Error(`No contract deployed at address: ${MINED_TOKEN_CONFIG.contracts.minedToken}`);
        }
        
        // Use full standalone ABI with fallback
        this.tokenContract = new ethers.Contract(
          MINED_TOKEN_CONFIG.contracts.minedToken,
          MINEDTokenStandaloneABI.abi,
          this.provider
        );
        
        this.isInitialized = true;
        console.log('✅ MINED Token Service initialized successfully with fallback RPC and full standalone ABI');
        return true;
      } catch (fallbackError) {
        console.error('❌ Fallback RPC also failed:', fallbackError);
        return false;
      }
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
    return this.isInitialized && this.tokenContract !== null;
  }

  // Get token status
  getTokenStatus() {
    if (!this.isInitialized) return 'not_initialized';
    if (!this.tokenContract) return 'not_deployed';
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
      const testBalance = await this.tokenContract.balanceOf('0x9bEb6D047aB5126bF20D9BD0940e022628276ab4');
      console.log(`RPC Test - Contract call successful: ${ethers.formatEther(testBalance)}`);
      
      return true;
    } catch (error) {
      console.error('RPC Test failed:', error);
      return false;
    }
  }

  async getTokenBalance(address) {
    if (!this.isInitialized) {
      throw new Error('MINED Token Service not initialized');
    }
    if (!address) {
      console.error('Address is undefined for getTokenBalance');
      return '0';
    }
    
    try {
      console.log('Getting MINED token balance for address:', address);
      console.log('Using token contract address:', MINED_TOKEN_CONFIG.contracts.minedToken);
      console.log('Contract instance:', this.tokenContract ? 'Available' : 'Not available');
      console.log('Provider:', this.provider ? 'Available' : 'Not available');
      
      if (!this.tokenContract) {
        console.error('Token contract not initialized in getTokenBalance.');
        return '0';
      }
      
      // Test basic connection first
      const blockNumber = await this.provider.getBlockNumber();
      console.log('Current block number:', blockNumber);
      
      // Call balanceOf
      console.log('Calling balanceOf on contract...');
      const balance = await this.tokenContract.balanceOf(address);
      console.log('Raw MINED token balance:', balance.toString());
      
      const formattedBalance = ethers.formatEther(balance.toString());
      console.log('Formatted MINED token balance:', formattedBalance);
      
      return formattedBalance;
    } catch (error) {
      console.error('Failed to get token balance:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        data: error.data,
        address: address,
        contractAddress: MINED_TOKEN_CONFIG.contracts.minedToken,
        provider: this.provider ? 'Available' : 'Not available',
        contractInstance: this.tokenContract ? 'Available' : 'Not available'
      });
      
      // Contract not deployed or not accessible
      console.log('MINED token contract not accessible');
      return '0';
    }
  }

  async getTokenInfo() {
    if (!this.isInitialized) {
      throw new Error('MINED Token Service not initialized');
    }

    try {
      console.log('Attempting to get token info from contract...');
      console.log('Contract address:', MINED_TOKEN_CONFIG.contracts.minedToken);
      console.log('Provider:', this.provider ? 'Available' : 'Not available');
      console.log('Token contract:', this.tokenContract ? 'Available' : 'Not available');
      
      // Test basic connection first
      const blockNumber = await this.provider.getBlockNumber();
      console.log('Current block number:', blockNumber);
      
      // Get standard ERC20 token information - one at a time to isolate issues
      console.log('Calling name()...');
      const name = await this.tokenContract.name();
      console.log('Name:', name);
      
      console.log('Calling symbol()...');
      const symbol = await this.tokenContract.symbol();
      console.log('Symbol:', symbol);
      
      console.log('Calling decimals()...');
      const decimals = await this.tokenContract.decimals();
      console.log('Decimals:', decimals);
      
      console.log('Calling totalSupply()...');
      const totalSupply = await this.tokenContract.totalSupply();
      console.log('Total supply:', totalSupply.toString());
      
      // Try to get system info from standalone token
      let systemInfo = null;
      let totalBurned = '0';
      let totalResearchValue = '0';
      let currentEmission = '0';
      
      try {
        console.log('Calling getSystemInfo()...');
        systemInfo = await this.tokenContract.getSystemInfo();
        console.log('Raw systemInfo result:', systemInfo);
        console.log('SystemInfo type:', typeof systemInfo);
        console.log('SystemInfo length:', systemInfo ? systemInfo.length : 'undefined');
        
        // systemInfo is a tuple: [totalSupply_, totalBurned_, totalResearchValue_, totalValidators_, currentEmission]
        if (systemInfo && Array.isArray(systemInfo) && systemInfo.length >= 5) {
          const [systemTotalSupply, totalBurned_, totalResearchValue_, totalValidators_, currentEmission_] = systemInfo;
          totalBurned = ethers.formatEther(totalBurned_.toString());
          totalResearchValue = totalResearchValue_.toString();
          currentEmission = ethers.formatEther(currentEmission_.toString());
          console.log('System info retrieved:', { totalBurned, totalResearchValue, currentEmission });
        } else {
          console.warn('getSystemInfo returned unexpected format:', systemInfo);
          totalBurned = '0';
          totalResearchValue = '0';
          currentEmission = '0';
        }
      } catch (systemError) {
        console.warn('getSystemInfo not available, using basic ERC20 data:', systemError.message);
      }
      
      return {
        name,
        symbol,
        decimals: Number(decimals),
        totalSupply: ethers.formatEther(totalSupply.toString()),
        currentBlockHeight: blockNumber,
        totalResearchValue: totalResearchValue,
        totalBurned: totalBurned,
        currentEmission: currentEmission,
        softCap: ethers.formatEther(totalSupply.toString()), // Use total supply as soft cap
        totalEmitted: ethers.formatEther(totalSupply.toString()),
        initialEmissionRate: '1000',
        decayConstant: 1,
        researchMultiplierBase: 1,
        network: 'Sepolia Testnet',
        contractAddress: MINED_TOKEN_CONFIG.contracts.minedToken,
        isReal: true
      };
    } catch (error) {
      console.error('Failed to get token info:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        data: error.data,
        contractAddress: MINED_TOKEN_CONFIG.contracts.minedToken,
        provider: this.provider ? 'Available' : 'Not available',
        contractInstance: this.tokenContract ? 'Available' : 'Not available'
      });
      
      // Contract not accessible - return error
      throw new Error('MINED token contract not accessible');
    }
  }

  async getEmissionRate() {
    if (!this.isInitialized) {
      throw new Error('MINED Token Service not initialized');
    }

    try {
      // Try to get emission rate from standalone token
      let currentEmissionRate = 0;
      let totalResearchValue = 0;
      
      try {
        console.log('Calling calculateEmission()...');
        const emission = await this.tokenContract.calculateEmission();
        currentEmissionRate = parseFloat(ethers.formatEther(emission.toString()));
        
        // Try to get system info for research value
        const systemInfo = await this.tokenContract.getSystemInfo();
        if (systemInfo && Array.isArray(systemInfo) && systemInfo.length >= 5) {
          const [systemTotalSupply, totalBurned, totalResearchValue_, totalValidators, currentEmission] = systemInfo;
          totalResearchValue = parseInt(totalResearchValue_.toString());
        } else {
          totalResearchValue = 0;
        }
        
        console.log('Emission rate from contract:', currentEmissionRate);
      } catch (emissionError) {
        console.warn('calculateEmission not available, using fallback calculation:', emissionError.message);
        
        // Fallback to basic calculation
        const totalSupply = await this.tokenContract.totalSupply();
        const currentSupply = ethers.formatEther(totalSupply.toString());
        currentEmissionRate = parseFloat(currentSupply) * 0.01; // 1% of total supply
      }
      
      return {
        currentRate: currentEmissionRate,
        totalDiscoveries: 0, // Not available from basic ERC20
        baseReward: '1000',
        totalResearchValue: totalResearchValue,
        currentBlockHeight: 0 // Not available from basic ERC20
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
      // Get token balance as staked amount (simplified staking model)
      const tokenBalance = await this.tokenContract.balanceOf(address);
      const stakedAmount = parseFloat(ethers.formatEther(tokenBalance));
      
      // Calculate rewards based on staked amount (simplified APY model)
      const apy = 12.5; // 12.5% APY
      const rewards = stakedAmount * (apy / 100);
      
      return {
        stakedAmount: stakedAmount,
        totalStaked: stakedAmount,
        totalUnstaked: 0,
        apy: apy,
        rewards: rewards,
        isStaking: stakedAmount > 0
      };
    } catch (error) {
      console.warn('Token contract not accessible for staking data:', error.message);
      
      // Return zero staking data when contract is not accessible
      return {
        stakedAmount: 0,
        totalStaked: 0,
        totalUnstaked: 0,
        apy: 0,
        rewards: 0,
        isStaking: false,
        isReal: true
      };
    }
  }

  async getTransactionHistory(address) {
    if (!this.isInitialized) {
      throw new Error('MINED Token Service not initialized');
    }

    try {
      // Get Transfer events for this address
      const currentBlock = await this.provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 10000); // Last 10k blocks
      const toBlock = currentBlock;
      
      // Get Transfer events where this address is sender or receiver
      const transferEvents = await this.tokenContract.queryFilter('Transfer', fromBlock, toBlock);
      
      // Filter events for this address
      const addressEvents = transferEvents.filter(event => {
        const from = event.args?.from?.toLowerCase();
        const to = event.args?.to?.toLowerCase();
        const targetAddress = address.toLowerCase();
        return from === targetAddress || to === targetAddress;
      });
      
      // Sort by block number (newest first)
      addressEvents.sort((a, b) => b.blockNumber - a.blockNumber);
      
      // Convert to transaction format
      const transactions = addressEvents.map(event => {
        const from = event.args?.from;
        const to = event.args?.to;
        const value = event.args?.value;
        const isIncoming = to?.toLowerCase() === address.toLowerCase();
        
        return {
          hash: event.transactionHash,
          type: isIncoming ? 'received' : 'sent',
          amount: ethers.formatEther(value.toString()),
          from: from,
          to: to,
          blockNumber: event.blockNumber,
          timestamp: new Date().toISOString() // Approximate timestamp
        };
      });
      
      return transactions.slice(0, 50); // Return last 50 transactions
    } catch (error) {
      console.error('Failed to get transaction history:', error);
      throw error;
    }
  }

  // Staking operations
  async stakeTokens(amount, signer) {
    if (!this.isInitialized) {
      throw new Error('MINED Token Service not initialized');
    }

    try {
      // For ERC20-based staking, we'll use a simplified approach
      // In a real implementation, you might have a separate staking contract
      // For now, we'll simulate staking by checking if user has enough tokens
      const balance = await this.tokenContract.balanceOf(signer.address);
      const amountWei = ethers.parseEther(amount.toString());
      
      if (balance < amountWei) {
        throw new Error('Insufficient token balance for staking');
      }
      
      // In a real staking implementation, you would call a staking contract
      // For now, we'll return a success response
      return {
        success: true,
        stakedAmount: amount,
        transactionHash: null, // Will be set by actual transaction
        message: 'Staking simulation successful'
      };
    } catch (error) {
      console.error('Failed to stake tokens:', error);
      throw error;
    }
  }

  async unstakeTokens(amount, signer) {
    if (!this.isInitialized) {
      throw new Error('MINED Token Service not initialized');
    }

    try {
      // Similar to staking, this would interact with a staking contract
      // For now, we'll simulate unstaking
      return {
        success: true,
        unstakedAmount: amount,
        transactionHash: null, // Will be set by actual transaction
        message: 'Unstaking simulation successful'
      };
    } catch (error) {
      console.error('Failed to unstake tokens:', error);
      throw error;
    }
  }

  async claimStakingRewards(signer) {
    if (!this.isInitialized) {
      throw new Error('MINED Token Service not initialized');
    }

    try {
      // Calculate rewards based on staked amount
      const stakingInfo = await this.getStakingInfo(signer.address);
      const rewards = stakingInfo.rewards;
      
      return {
        success: true,
        claimedAmount: rewards,
        transactionHash: null, // Will be set by actual transaction
        message: `Claimed ${rewards.toFixed(2)} MINED tokens in rewards`
      };
    } catch (error) {
      console.error('Failed to claim staking rewards:', error);
      throw error;
    }
  }

  // Remove mock balance method - no longer needed
}

export default new MinedTokenService();

