// MINED Token ERC20 Configuration
// ERC20 Token Only - No Smart Contract Integration

const CONTRACT_CONFIG = {
  // Network Configuration
  NETWORKS: {
    // Sepolia Testnet (where your token is deployed)
    SEPOLIA: {
      chainId: 11155111,
      name: 'Sepolia Testnet',
      rpcUrl: 'https://eth-sepolia.g.alchemy.com/v2/EsD9nEjl3rvwE35tYtTZC', // Alchemy RPC URL
      explorerUrl: 'https://sepolia.etherscan.io',
      nativeCurrency: {
        name: 'Sepolia Ether',
        symbol: 'SEP',
        decimals: 18
      }
    },
    
    // Local Development Network
    LOCAL: {
      chainId: 1337,
      name: 'Local Network',
      rpcUrl: 'http://localhost:8545',
      explorerUrl: 'http://localhost:8545',
      nativeCurrency: {
        name: 'Ether',
        symbol: 'ETH',
        decimals: 18
      }
    }
  },

  // Default Network (change this to SEPOLIA for production)
  DEFAULT_NETWORK: 'SEPOLIA',

  // MINED Token Configuration - ERC20 Only
  MINED_TOKEN: {
    name: 'MINED',
    symbol: 'MINED',
    address: '0x7877EFAb4aD3610792a135f6f8A241962fD2ab76', // MINEDToken.sol contract
    decimals: 18,
    totalSupply: '1000000000000000000000000000', // 1 billion tokens initial supply
    initialSupply: '1000000000000000000000000000', // 1 billion initial supply
    network: 'SEPOLIA',
    status: 'deployed_verified_tokenomics_fixed',
    contractFeatures: {
      hybridPowPos: true,
      automaticRewards: true,
      stakingPool: true,
      validatorRewards: true,
      discoverySystem: true,
      workTypes: 25, // 0-24 work types
      maxWorkType: 24
    },
    tokenomics: {
      model: 'hybrid_pow_pos',
      powRewards: true,
      posStaking: true,
      automaticValidation: true,
      deflationary: true,
      researchBurns: true,
      multiChainReady: true
    },
    etherscanUrl: 'https://sepolia.etherscan.io/address/0x7877EFAb4aD3610792a135f6f8A241962fD2ab76#code'
  },

  // Web3 Provider Configuration
  WEB3: {
    // For MetaMask and other wallet connections
    supportedChains: [11155111, 1337], // Sepolia and Local
    defaultChain: 11155111, // Sepolia
    
    // RPC URLs for different networks
    rpcUrls: {
      11155111: 'https://eth-sepolia.g.alchemy.com/v2/EsD9nEjl3rvwE35tYtTZC', // Alchemy RPC URL
      1337: 'http://localhost:8545'
    },
    
    // Block explorer URLs
    blockExplorerUrls: {
      11155111: 'https://sepolia.etherscan.io',
      1337: 'http://localhost:8545'
    }
  },

  // Token Interaction Settings
  INTERACTION: {
    gasLimit: 3000000,
    gasPrice: 'auto', // Let wallet determine
    confirmations: 1, // For testnet
    timeout: 60000 // 60 seconds
  }
};

export default CONTRACT_CONFIG;
