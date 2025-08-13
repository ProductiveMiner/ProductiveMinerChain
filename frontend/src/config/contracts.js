// ProductiveMiner Contract Configuration
// Updated for deployed ProductiveMinerFixed contract

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
    // ProductiveMinerFixed Contract (Fixed Version with Proper Token Integration)
               PRODUCTIVE_MINER_FIXED: {
             name: 'ProductiveMinerFixed',
             address: '0xB576afEfB7C466B0146ee81A9256a3DE1ACF2146', // Fixed ProductiveMiner address (CORRECTED)
             network: 'SEPOLIA',
             abi: 'ProductiveMinerFixed.json', // Use the fixed version ABI
             verified: true,
             deploymentTx: '0x...', // Will be updated after verification
             deployer: '0x9bEb6D047aB5126bF20D9BD0940e022628276ab4', // Deployer address
             deploymentDate: '2025-01-13',
             etherscanUrl: 'https://sepolia.etherscan.io/address/0xB576afEfB7C466B0146ee81A9256a3DE1ACF2146#code'
           },

    // Legacy ProductiveMiner Contract (Local)
    PRODUCTIVE_MINER: {
      name: 'ProductiveMiner',
      address: '0x5FbDB2315678afecb367f032d93F642f64180aa3', // Local development address
      network: 'LOCAL',
      abi: 'ProductiveMiner.json',
      verified: false,
      note: 'Local development only - use PRODUCTIVE_MINER_FIXED for production'
    }
  },

  // Default Network (change this to SEPOLIA for production)
  DEFAULT_NETWORK: 'SEPOLIA',

             // MINED Token Configuration - Asymptotic Model with Universal Multi-Chain Hooks
         MINED_TOKEN: {
           name: 'MINED',
           symbol: 'MINED',
           address: '0x82134Fb8350C522F50282fEde9c0fAd5F76d80ae', // Asymptotic MINED Token address
           decimals: 18,
           totalSupply: '1100000000000000000000000000', // 1.1 billion tokens in wei (includes all pools)
           initialSupply: '1000000000000000000000000000', // 1 billion initial supply
           asymptoticTarget: '1500000000000000000000000000', // 1.5 billion asymptotic target
           network: 'SEPOLIA',
           status: 'deployed_asymptotic_with_universal_multi_chain_hooks',
           tokenomics: {
             model: 'asymptotic',
             equation: 'S(t) = S₀ + Σ(E(t) - B(t))',
             emission: 'E(t) = E₀ × e^(-λt) × (1 + α × ResearchValue(t))',
             deflationary: true,
             researchBurns: true,
             multiChainReady: true
           }
         },

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
