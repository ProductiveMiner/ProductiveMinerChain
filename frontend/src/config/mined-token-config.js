// MINED Token Configuration for ProductiveMiner.org
// This file contains all the configuration needed to integrate the MINED token

export const MINED_TOKEN_CONFIG = {
  // Network Configuration
  network: {
    name: "Sepolia Testnet",
    chainId: 11155111,
    rpcUrl: "https://eth-sepolia.g.alchemy.com/v2/EsD9nEjl3rvwE35tYtTZC",
    currencySymbol: "ETH"
  },

           // Contract Addresses (Deployed to Sepolia)
         contracts: {
           productiveMiner: "0xB576afEfB7C466B0146ee81A9256a3DE1ACF2146", // ProductiveMinerFixed address (CORRECTED)
           minedToken: "0xC46C90F37B83868fA46A3653daf3C3b49a4f1604", // MINEDTokenFixed address (CORRECTED)
           tokenBridge: "0x3D9cCBF6B083A2C1A7CE3F9C0B033e03732260c1"
         },

  // Token Information
  token: {
    name: "MINED Token (Asymptotic Enhanced)",
    symbol: "MINED",
    decimals: 18,
    totalSupply: "1000000000.0",
    softCap: "1500000000.0",
    description: "Enhanced MINED Token with asymptotic emission model for long-term mathematical discovery mining"
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
    miningRewardsPool: "0x9bEb6D047aB5126bF20D9BD0940e022628276ab4",
    stakingRewardsPool: "0x9bEb6D047aB5126bF20D9BD0940e022628276ab4",
    researchFund: "0x9bEb6D047aB5126bF20D9BD0940e022628276ab4",
    treasury: "0x9bEb6D047aB5126bF20D9BD0940e022628276ab4"
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

// Token ABI (minimal for basic interactions)
export const MINED_TOKEN_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function getAsymptoticTokenInfo() view returns (string, string, uint8, uint256, uint256, uint256, uint256)",
  "function getEmissionParameters() view returns (uint256, uint256, uint256, uint256, uint256)",
  "function getUserResearchContributions(address) view returns (uint256)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event AsymptoticEmission(uint256 blockHeight, uint256 emission, uint256 researchValue, uint256 multiplier)",
  "event ResearchValueAdded(uint256 blockHeight, address indexed contributor, uint256 researchValue)"
];

// Token Bridge ABI
export const TOKEN_BRIDGE_ABI = [
  "function minedToken() view returns (address)",
  "function productiveMinerContract() view returns (address)",
  "function miningRewardRate() view returns (uint256)",
  "function stakingRewardRate() view returns (uint256)",
  "function researchRewardRate() view returns (uint256)",
  "function distributeMiningReward(address _miner, uint256 _ethAmount)",
  "function distributeStakingReward(address _staker, uint256 _ethAmount)",
  "function distributeResearchReward(address _researcher, uint256 _ethAmount)",
  "function miningRewards(address) view returns (uint256)",
  "function stakingRewards(address) view returns (uint256)",
  "function researchRewards(address) view returns (uint256)",
  "function lastClaimTime(address) view returns (uint256)",
  "event TokenRewardDistributed(address indexed recipient, uint256 ethAmount, uint256 tokenAmount, string rewardType)"
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
