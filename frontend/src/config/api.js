// ProductiveMiner API Configuration
// Updated for AWS ECS deployment

const API_CONFIG = {
  // Backend API endpoints - Direct ECS service URLs
  BACKEND_API: {
    BASE_URL: process.env.REACT_APP_API_URL || '/api',
    ENDPOINTS: {
      HEALTH: '/health',
      USERS: '/users',
      SESSIONS: '/sessions',
      // Mining endpoints
      MINING_INFO: '/mining/info',
      MINING_START: '/mining/start',
      MINING_STOP: '/mining/stop',
      WALLET: '/wallet',
      VALIDATORS: '/validators',
      RESEARCH: '/research',
      EXPLORER: '/explorer',
      STATS: '/stats',
      CONTRACT: '/contract'
    }
  },
  
  // Mathematical Engine endpoints - Direct ECS service URLs
  MATHEMATICAL_ENGINE: {
    BASE_URL: process.env.REACT_APP_MATH_ENGINE_URL || '/api/engine',
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
  
  // WebSocket configuration
  WEBSOCKET: {
    URL: (typeof window !== 'undefined')
      ? `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws`
      : (process.env.REACT_APP_WS_URL || 'ws://localhost:3001/ws'),
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
    CONTRACT_ADDRESS: '0xc7374F27c695112B81495ECF28b90aD441CCf4b9', // Live deployed ProductiveMinerSecure contract
    EXPLORER_URL: 'https://sepolia.etherscan.io'
  }
};

export default API_CONFIG;
