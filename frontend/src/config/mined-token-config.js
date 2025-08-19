// MINED Token Configuration for ProductiveMiner.org
// ERC20 Token Only - No Smart Contract Integration

export const MINED_TOKEN_CONFIG = {
  // Network Configuration
  network: {
    name: "Sepolia Testnet",
    chainId: 11155111,
    rpcUrl: "https://eth-sepolia.g.alchemy.com/v2/EsD9nEjl3rvwE35tYtTZC",
    currencySymbol: "ETH"
  },

  // Contract Addresses (Deployed to Sepolia) - ERC20 Only
  contracts: {
    minedToken: "0x7877EFAb4aD3610792a135f6f8A241962fD2ab76" // MINEDToken contract
  },

  // Token Information
  token: {
    name: "MINED Token (Standalone)",
    symbol: "MINED",
    decimals: 18,
    totalSupply: "1000000000.0",
    softCap: "1500000000.0",
    description: "Standalone MINED Token with asymptotic emission model for mathematical discovery mining"
  },

  // Asymptotic Emission Model
  emissionModel: {
    formula: "E(t) = E₀ × e^(-λt) × (1 + α × ResearchValue(t))",
    parameters: {
      initialEmissionRate: "1000000000000000000000",
      decayConstant: "1",
      researchMultiplierBase: "1",
      decayScale: "10000",
      researchScale: "100"
    },
    description: "Asymptotic emission model with exponential decay and research value boost"
  },

  // Pool Addresses
  pools: {
    miningRewardsPool: "0x7877EFAb4aD3610792a135f6f8A241962fD2ab76",
    stakingRewardsPool: "0x7877EFAb4aD3610792a135f6f8A241962fD2ab76",
    researchFund: "0x7877EFAb4aD3610792a135f6f8A241962fD2ab76",
    treasury: "0x7877EFAb4aD3610792a135f6f8A241962fD2ab76"
  },

  // Features
  features: {
    asymptoticEmission: true,
    researchValueIntegration: true,
    mathematicalDiscoveryMining: true,
    realTimeMonitoring: true,
    tokenRewards: true
  },

  // Monitoring Services
  monitoring: {
    grafana: "http://localhost:3002"
  }
};

// MetaMask Network Configuration
export const METAMASK_NETWORK_CONFIG = {
  chainId: '0xaa36a7', // 11155111 in hex (Sepolia)
  chainName: 'Sepolia Testnet',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18
  },
  rpcUrls: ['https://eth-sepolia.g.alchemy.com/v2/EsD9nEjl3rvwE35tYtTZC'],
  blockExplorerUrls: ['https://sepolia.etherscan.io']
};

// Token ABI (MINEDTokenStandalone contract functions)
export const MINED_TOKEN_ABI = [
  // Standard ERC20 functions
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  
  // Ownable functions
  "function owner() view returns (address)",
  "function transferOwnership(address newOwner)",
  
  // Public state variables (automatically get getter functions)
  "function state() view returns (uint128 totalBurned, uint128 totalResearchValue, uint64 lastEmissionBlock, uint32 totalValidators, uint32 nextDiscoveryId)",
  "function MAX_WORK_TYPE() view returns (uint8)",
  "function stakingPoolBalance() view returns (uint256)",
  "function validatorRewardPool() view returns (uint256)",
  "function totalStaked() view returns (uint256)",
  "function userStakes(address) view returns (uint256)",
  "function userStakingRewards(address) view returns (uint256)",
  "function validators(address) view returns (uint128 stakedAmount, uint64 totalValidations, uint32 reputation, uint32 registrationTime, bool isActive)",
  "function discoveries(uint32) view returns (uint128 researchValue, uint64 timestamp, uint32 validationCount, uint16 complexity, uint8 significance, uint8 workType, address researcher, bool isValidated, bool isCollaborative, bool isFromPoW)",
  "function workTypes(uint8) view returns (uint16 difficultyMultiplier, bool isActive)",
  
  // Main contract functions
  "function requestValidation(uint32 discoveryId, uint256 fee) returns (uint32)",
  "function validateDiscovery(uint32 requestId, bool isValid)",
  "function stake(uint256 amount)",
  "function unstake(uint256 amount)",
  "function claimStakingRewards()",
  "function startMiningSession(uint8 workType, uint16 difficulty) returns (uint32)",
  "function submitPoWResult(uint32 sessionId, uint32 nonce, uint128 hash, uint16 complexity, uint8 significance)",
  "function submitDiscovery(uint8 workType, uint8 significance, uint128 researchValue, string calldata description, bool isCollaborative) returns (uint32)",
  
  // Events
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
  "event DiscoverySubmitted(uint32 indexed discoveryId, address indexed researcher, uint8 workType, uint128 researchValue)",
  "event ValidationRequested(uint32 indexed requestId, uint32 indexed discoveryId, uint256 fee)",
  "event DiscoveryValidated(uint32 indexed discoveryId, bool isValid, uint256 tokensAwarded)",
  "event Staked(address indexed user, uint256 amount)",
  "event Unstaked(address indexed user, uint256 amount)",
  "event StakingRewardsClaimed(address indexed user, uint256 amount)",
  "event MiningSessionStarted(uint32 indexed sessionId, address indexed miner, uint8 workType, uint16 difficulty)",
  "event PoWResultSubmitted(uint32 indexed sessionId, address indexed miner, uint256 nonce, bytes32 hash)"
];

// Helper Functions
export const MINED_TOKEN_HELPERS = {
  // Format token amount for display
  formatTokenAmount: (amount, decimals = 18) => {
    return (parseFloat(amount) / Math.pow(10, decimals)).toFixed(2);
  },

  // Parse token amount from user input
  parseTokenAmount: (amount, decimals = 18) => {
    return (parseFloat(amount) * Math.pow(10, decimals)).toString();
  },

  // Calculate emission rate based on asymptotic model
  calculateEmissionRate: (blockHeight, researchValue, params) => {
    const E0 = parseFloat(params.initialEmissionRate) / Math.pow(10, 18);
    const lambda = parseFloat(params.decayConstant) / parseFloat(params.decayScale);
    const alpha = parseFloat(params.researchMultiplierBase) / parseFloat(params.researchScale);
    
    // E(t) = E₀ × e^(-λt) × (1 + α × ResearchValue(t))
    const decayFactor = Math.exp(-lambda * blockHeight);
    const researchMultiplier = 1 + alpha * researchValue;
    const emission = E0 * decayFactor * researchMultiplier;
    
    return Math.max(emission, 1); // Minimum 1 token
  },

  // Add MINED token to MetaMask
  addTokenToMetaMask: async (ethereum) => {
    try {
      await ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: MINED_TOKEN_CONFIG.contracts.minedToken,
            symbol: MINED_TOKEN_CONFIG.token.symbol,
            decimals: MINED_TOKEN_CONFIG.token.decimals,
            image: 'https://productiveminer.org/images/mined-token.png' // Add your token image
          }
        }
      });
      return true;
    } catch (error) {
      console.error('Error adding token to MetaMask:', error);
      return false;
    }
  },

  // Switch to ProductiveMiner network
  switchToProductiveMinerNetwork: async (ethereum) => {
    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: METAMASK_NETWORK_CONFIG.chainId }]
      });
      return true;
    } catch (switchError) {
      // If the network doesn't exist, add it
      if (switchError.code === 4902) {
        try {
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [METAMASK_NETWORK_CONFIG]
          });
          return true;
        } catch (addError) {
          console.error('Error adding network:', addError);
          return false;
        }
      }
      console.error('Error switching network:', switchError);
      return false;
    }
  }
};

export default MINED_TOKEN_CONFIG;
