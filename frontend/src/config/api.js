// MINED Token API Configuration
// ERC20 Token Only - No Smart Contract Integration

const API_CONFIG = {
  // Backend API endpoints - Direct connection to ECS
  BACKEND_API: {
    BASE_URL: process.env.REACT_APP_API_URL || '',
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
      CONTRACT: '/api/contract',
      TOKEN: '/api/token/data'
    }
  },
  
  // Mathematical Engine endpoints - Direct connection to ECS
  MATHEMATICAL_ENGINE: {
    BASE_URL: process.env.REACT_APP_ENGINE_URL || 'https://math-engine.productiveminer.org',
    ENDPOINTS: {
      HEALTH: '/health',
      COMPUTE: '/api/v1/compute',
      // Mathematical computation endpoints - all use the same compute endpoint
      RIEMANN_ZEROS: '/api/v1/compute',
      GOLDBACH: '/api/v1/compute',
      PRIME_PATTERNS: '/api/v1/compute',
      YANG_MILLS: '/api/v1/compute',
      NAVIER_STOKES: '/api/v1/compute',
      BIRCH_SWINNERTON: '/api/v1/compute',
      ECC: '/api/v1/compute',
      LATTICE: '/api/v1/compute',
      POINCARE: '/api/v1/compute'
    }
  },
  
  // WebSocket configuration - Direct connection to ECS
  WEBSOCKET: {
    URL: (typeof window !== 'undefined')
      ? (process.env.REACT_APP_WS_URL || 'wss://api.productiveminer.org/ws')
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

  // Ethereum configuration - ERC20 Token Only
  ETHEREUM: {
    NETWORK_ID: 11155111, // Sepolia Testnet
    CHAIN_ID: 11155111,
    RPC_URL: 'https://eth-sepolia.g.alchemy.com/v2/EsD9nEjl3rvwE35tYtTZC', // Live Alchemy RPC URL
    TOKEN_ADDRESS: '0x7877EFAb4aD3610792a135f6f8A241962fD2ab76', // MINEDToken contract
    EXPLORER_URL: 'https://sepolia.etherscan.io'
  }
};

export default API_CONFIG;
