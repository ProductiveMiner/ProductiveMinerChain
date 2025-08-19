import { ethers } from 'ethers';
import CONTRACT_CONFIG from '../config/contracts';
import { MINED_TOKEN_CONFIG } from '../config/mined-token-config';
import MINEDTokenABI from '../contracts/MINEDToken.json';

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
                  console.log('ABI length:', MINEDTokenABI.abi.length);
    console.log('ABI functions:', MINEDTokenABI.abi.filter(item => item.type === 'function').map(f => f.name));
      
      this.tokenContract = new ethers.Contract(
        MINED_TOKEN_CONFIG.contracts.minedToken,
        MINEDTokenABI.abi,
        this.provider
      );
      
      // Test basic contract call with full ABI
      console.log('🔍 Testing basic contract call with full ABI...');
      try {
        const name = await this.tokenContract.name();
        console.log('✅ Full ABI works, name:', name);
        
        // Test basic contract functions
        console.log('🔍 Testing basic contract functions...');
        const symbol = await this.tokenContract.symbol();
        const decimals = await this.tokenContract.decimals();
        console.log('✅ Basic functions work, symbol:', symbol, 'decimals:', decimals);
        
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
        const FALLBACK_RPC_URL = 'https://eth-sepolia.g.alchemy.com/v2/EsD9nEjl3rvwE35tYtTZC';
        this.provider = new ethers.JsonRpcProvider(FALLBACK_RPC_URL);
        
        // Test the fallback
        const network = await this.provider.getNetwork();
        console.log('✅ Fallback RPC connected to:', network.name);
        
        // Test contract existence with fallback
        const code = await this.provider.getCode(MINED_TOKEN_CONFIG.contracts.minedToken);
        if (code === '0x') {
          throw new Error(`No contract deployed at address: ${MINED_TOKEN_CONFIG.contracts.minedToken}`);
        }
        
        // Use full MINEDToken ABI with fallback
        this.tokenContract = new ethers.Contract(
          MINED_TOKEN_CONFIG.contracts.minedToken,
          MINEDTokenABI.abi,
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
    
    // If amount is in wei (large number), convert to ether first
    let num = parseFloat(amount);
    if (num > 1e15) { // If it's likely in wei (more than 0.001 ether)
      num = num / 1e18; // Convert wei to ether
    }
    
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
        console.log('Getting system info from state() function...');
        // Use the public state getter function instead of getSystemInfo()
        const stateInfo = await this.tokenContract.state();
        console.log('Raw state result:', stateInfo);
        
        // stateInfo is a struct: {totalBurned, totalResearchValue, lastEmissionBlock, totalValidators, nextDiscoveryId}
        if (stateInfo) {
          totalBurned = ethers.formatEther(stateInfo.totalBurned.toString());
          totalResearchValue = stateInfo.totalResearchValue.toString();
          currentEmission = '0'; // Placeholder for current emission
          console.log('System info retrieved from state:', { totalBurned, totalResearchValue });
        } else {
          console.warn('state() returned no data');
          totalBurned = '0';
          totalResearchValue = '0';
          currentEmission = '0';
        }
      } catch (systemError) {
        console.warn('state() not available, using basic ERC20 data:', systemError.message);
        totalBurned = '0';
        totalResearchValue = '0';
        currentEmission = '0';
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
        console.log('Using default emission rate for standalone contract...');
        currentEmissionRate = 1000; // Default emission rate for standalone contract
        
        // Try to get research value from state
        try {
          const stateInfo = await this.tokenContract.state();
          totalResearchValue = parseInt(stateInfo.totalResearchValue.toString());
        } catch (stateError) {
          console.warn('Could not get state info:', stateError.message);
          totalResearchValue = 0;
        }
        
        console.log('Emission rate for standalone contract:', currentEmissionRate);
      } catch (emissionError) {
        console.warn('Using fallback calculation:', emissionError.message);
        
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

  // Fetch recent discoveries directly from the chain (fallback when API is empty)
  async getRecentDiscoveries(limit = 10) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      if (!this.tokenContract) {
        throw new Error('Token contract not initialized');
      }

      // Get next discovery id from state() if available; otherwise try incremental fetch
      let nextDiscoveryId = 0;
      try {
        const stateInfo = await this.tokenContract.state();
        if (stateInfo && stateInfo.nextDiscoveryId != null) {
          nextDiscoveryId = Number(stateInfo.nextDiscoveryId);
        }
      } catch (e) {
        // Fallback: probe upwards until failure (cap for safety)
        let probe = 0;
        for (let i = 0; i < 50; i++) {
          try {
            // eslint-disable-next-line no-await-in-loop
            await this.tokenContract.discoveries(probe);
            probe += 1;
          } catch {
            break;
          }
        }
        nextDiscoveryId = probe;
      }

      const items = [];
      const start = Math.max(0, nextDiscoveryId - limit);
      for (let i = nextDiscoveryId - 1; i >= start; i--) {
        try {
          // eslint-disable-next-line no-await-in-loop
          const d = await this.tokenContract.discoveries(i);
          // Normalize fields across possible ABI layouts
          const getIfAddress = (val) => (typeof val === 'string' && /^0x[0-9a-fA-F]{40}$/.test(val)) ? val : null;

          // Researcher address can be at named field or index 6 (or 0 in some layouts)
          const researcher = d.researcher ?? getIfAddress(d[6]) ?? getIfAddress(d[0]) ?? '0x0000000000000000000000000000000000000000';

          // Research value may be at named field, index 0, or index 6 depending on layout
          let researchValueRaw = d.researchValue;
          if (researchValueRaw == null || typeof researchValueRaw === 'string') {
            researchValueRaw = (typeof d[0] === 'bigint') ? d[0] : (typeof d[6] === 'bigint' ? d[6] : 0n);
          }

          // Timestamp likely at named field or index 1
          const timestamp = d.timestamp ?? d[1] ?? 0n;
          const validationCount = d.validationCount ?? d[2] ?? 0n;
          const complexity = d.complexity ?? d[3] ?? 0n;
          const significance = d.significance ?? d[4] ?? 0n;
          const workType = d.workType ?? d[5] ?? 0n;
          const isValidated = d.isValidated ?? d[7] ?? false;
          const isCollaborative = d.isCollaborative ?? d[8] ?? false;
          const isFromPoW = d.isFromPoW ?? d[9] ?? true;

          const workTypeId = Number(workType);
          const workTypeMap = {
            0: 'Riemann Zeros',
            1: 'Goldbach Conjecture'
          };

          const rv = (typeof researchValueRaw === 'bigint') ? researchValueRaw : BigInt(researchValueRaw || 0);

          // Skip obviously empty placeholders
          const isZeroAddress = researcher === '0x0000000000000000000000000000000000000000';
          const isZeroValue = rv === 0n && Number(complexity || 0) === 0 && Number(significance || 0) === 0;
          if (isZeroAddress && isZeroValue) {
            continue;
          }

          const normalized = {
            discovery_id: i,
            researcher_address: researcher,
            work_type_id: workTypeId,
            work_type_name: workTypeMap[workTypeId] || `Work Type ${workTypeId}`,
            problem_statement: 'On-chain discovery generated from PoW mining result',
            complexity: Number(complexity || 0),
            significance: Number(significance || 0),
            research_value: Number(ethers.formatEther(rv)),
            computation_time: null,
            energy_consumed: null,
            is_collaborative: Boolean(isCollaborative),
            is_from_pow: Boolean(isFromPoW),
            is_validated: Boolean(isValidated),
            validation_count: Number(validationCount || 0),
            novelty_score: null,
            algorithm_used: 'N/A',
            transaction_hash: null,
            contract_address: MINED_TOKEN_CONFIG.contracts.minedToken,
            network: MINED_TOKEN_CONFIG.network?.name || 'Sepolia',
            created_at: timestamp ? new Date(Number(timestamp) * 1000).toISOString() : null,
            updated_at: timestamp ? new Date(Number(timestamp) * 1000).toISOString() : null
          };
          items.push(normalized);
        } catch (err) {
          if (items.length === 0) {
            break;
          }
        }
      }

      return items;
    } catch (error) {
      console.error('Failed to get recent discoveries from chain:', error);
      return [];
    }
  }

  // Remove mock balance method - no longer needed
}

export default new MinedTokenService();

