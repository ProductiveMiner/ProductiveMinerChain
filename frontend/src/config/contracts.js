// MINED Token ERC20 Configuration
// ERC20 Token Only - No Smart Contract Integration

const CONTRACT_CONFIG = {
  // Network Configuration
  NETWORKS: {
    // Sepolia Testnet (where your token is deployed)
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

  // Default Network (change this to SEPOLIA for production)
  DEFAULT_NETWORK: 'SEPOLIA',

  // MINED Token Configuration - ERC20 Only
  MINED_TOKEN: {
    name: 'MINED',
    symbol: 'MINED',
    address: '0x78916EB89CDB2Ef32758fCc41f3aef3FDf052ab3', // Standalone MINED Token address
    decimals: 18,
    totalSupply: '1100000000000000000000000000', // 1.1 billion tokens in wei (includes all pools)
    initialSupply: '1000000000000000000000000000', // 1 billion initial supply
    asymptoticTarget: '1500000000000000000000000000', // 1.5 billion asymptotic target
    network: 'SEPOLIA',
    status: 'deployed_standalone_erc20_only',
    tokenomics: {
      model: 'asymptotic',
      equation: 'S(t) = S₀ + Σ(E(t) - B(t))',
      emission: 'E(t) = E₀ × e^(-λt) × (1 + α × ResearchValue(t))',
      deflationary: true,
      researchBurns: true,
      multiChainReady: true
    },
    etherscanUrl: 'https://sepolia.etherscan.io/address/0x78916EB89CDB2Ef32758fCc41f3aef3FDf052ab3#code'
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

  // Token Interaction Settings
  INTERACTION: {
    gasLimit: 3000000,
    gasPrice: 'auto', // Let wallet determine
    confirmations: 1, // For testnet
    timeout: 60000 // 60 seconds
  }
};

export default CONTRACT_CONFIG;
