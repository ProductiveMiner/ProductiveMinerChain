// MINED Token API Configuration
// ERC20 Token Only - No Smart Contract Integration

const API_CONFIG = {
  // Backend API endpoints - Using production domain
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
  
  // Mathematical Engine endpoints - Using production domain
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

  // Ethereum configuration - ERC20 Token Only
  ETHEREUM: {
    NETWORK_ID: 11155111, // Sepolia Testnet
    CHAIN_ID: 11155111,
    RPC_URL: 'https://eth-sepolia.g.alchemy.com/v2/EsD9nEjl3rvwE35tYtTZC', // Live Alchemy RPC URL
    TOKEN_ADDRESS: '0x78916EB89CDB2Ef32758fCc41f3aef3FDf052ab3', // MINEDTokenStandalone ERC20 contract
    EXPLORER_URL: 'https://sepolia.etherscan.io'
  }
};

export default API_CONFIG;
