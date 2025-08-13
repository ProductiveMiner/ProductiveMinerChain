// ProductiveMiner API Configuration
// Updated for AWS ECS deployment with proper domain URLs

const API_CONFIG = {
  // Backend API endpoints - Using proper domain
  BACKEND_API: {
    BASE_URL: process.env.REACT_APP_API_URL || 'https://api.productiveminer.org',
    ENDPOINTS: {
      HEALTH: '/api/health',
      USERS: '/api/users',
      SESSIONS: '/api/sessions',
      // Mining endpoints
      MINING_INFO: '/api/mining/info',
      MINING_START: '/api/mining/start',
      MINING_STOP: '/api/mining/stop',
      WALLET: '/api/wallet',
      VALIDATORS: '/api/validators',
      RESEARCH: '/api/research',
      EXPLORER: '/api/explorer',
      STATS: '/api/stats',
      CONTRACT: '/api/contract'
    }
  },
  
  // Mathematical Engine endpoints - Using proper domain
  MATHEMATICAL_ENGINE: {
    BASE_URL: process.env.REACT_APP_MATH_ENGINE_URL || 'https://api.productiveminer.org',
    ENDPOINTS: {
      HEALTH: '/health',
      ROOT: '/',
      ENGINES: '/engines/stats',
      DISTRIBUTION: '/engines/distribution',
      MINING_STATUS: '/mining/status',
      DISCOVERIES: '/discoveries',
      COMPUTE: '/compute',
      // Mathematical computation endpoints
      RIEMANN_ZEROS: '/compute',
      GOLDBACH: '/compute',
      PRIME_PATTERNS: '/compute',
      YANG_MILLS: '/compute',
      NAVIER_STOKES: '/compute',
      BIRCH_SWINNERTON: '/compute',
      ECC: '/compute',
      LATTICE: '/compute',
      POINCARE: '/compute'
    }
  },
  
  // WebSocket configuration - Using proper domain
  WEBSOCKET: {
    URL: (typeof window !== 'undefined')
      ? `wss://api.productiveminer.org/ws`
      : (process.env.REACT_APP_WS_URL || 'wss://api.productiveminer.org/ws'),
    RECONNECT_INTERVAL: 5000,
    MAX_RECONNECT_ATTEMPTS: 5
  },
  
  // Request configuration
  REQUEST_CONFIG: {
    TIMEOUT: 30000,
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000
  },

  // Ethereum configuration
  ETHEREUM: {
    NETWORK_ID: 11155111, // Sepolia Testnet
    CHAIN_ID: 11155111,
    RPC_URL: 'https://eth-sepolia.g.alchemy.com/v2/EsD9nEjl3rvwE35tYtTZC', // Live Alchemy RPC URL
    CONTRACT_ADDRESS: '0xB576afEfB7C466B0146ee81A9256a3DE1ACF2146', // ProductiveMinerFixed contract (CORRECTED)
    TOKEN_ADDRESS: '0xC46C90F37B83868fA46A3653daf3C3b49a4f1604', // MINEDTokenFixed contract (CORRECTED)
    EXPLORER_URL: 'https://sepolia.etherscan.io'
  }
};

export default API_CONFIG;
