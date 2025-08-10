// ProductiveMiner Contract Configuration
// Updated for deployed ProductiveMinerSecure contract

const CONTRACT_CONFIG = {
  // Network Configuration
  NETWORKS: {
    // Sepolia Testnet (where your contract is deployed)
    SEPOLIA: {
      chainId: 11155111,
      name: 'Sepolia Testnet',
      rpcUrl: 'https://eth-sepolia.g.alchemy.com/v2/EsD9nEjl3rvwE35tYtTZC', // Live Alchemy RPC URL
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

  // Contract Configuration
  CONTRACTS: {
    // ProductiveMinerSecure Contract (Deployed on Sepolia)
    PRODUCTIVE_MINER_SECURE: {
      name: 'ProductiveMinerSecure',
      address: '0xc7374F27c695112B81495ECF28b90aD441CCf4b9', // Live deployed contract address
      network: 'SEPOLIA',
      abi: 'ProductiveMinerSecure.json', // We'll create this
      verified: true,
      deploymentTx: '0x010fa53f173c7842450b25aa396f7716cf7b48f879ec455d4c000f8c665d52f5', // Live deployment transaction hash
      deployer: '', // Add your deployer address
      deploymentDate: '2025-08-10',
      etherscanUrl: 'https://sepolia.etherscan.io/address/0xc7374F27c695112B81495ECF28b90aD441CCf4b9#code'
    },

    // Legacy ProductiveMiner Contract (Local)
    PRODUCTIVE_MINER: {
      name: 'ProductiveMiner',
      address: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
      network: 'LOCAL',
      abi: 'ProductiveMiner.json',
      verified: false
    }
  },

  // Default Network (change this to SEPOLIA for production)
  DEFAULT_NETWORK: 'SEPOLIA',

  // Web3 Provider Configuration
  WEB3: {
    // For MetaMask and other wallet connections
    supportedChains: [11155111, 1337], // Sepolia and Local
    defaultChain: 11155111, // Sepolia
    
    // RPC URLs for different networks
    rpcUrls: {
      11155111: 'https://eth-sepolia.g.alchemy.com/v2/EsD9nEjl3rvwE35tYtTZC', // Live Alchemy RPC URL
      1337: 'http://localhost:8545'
    },
    
    // Block explorer URLs
    blockExplorerUrls: {
      11155111: 'https://sepolia.etherscan.io',
      1337: 'http://localhost:8545'
    }
  },

  // Contract Interaction Settings
  INTERACTION: {
    gasLimit: 3000000,
    gasPrice: 'auto', // Let wallet determine
    confirmations: 1, // For testnet
    timeout: 60000 // 60 seconds
  }
};

export default CONTRACT_CONFIG;
