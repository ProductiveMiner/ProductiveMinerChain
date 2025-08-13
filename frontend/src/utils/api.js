import axios from 'axios';

// API Configuration - ECS Backend URLs
// Using proper domain name with HTTPS for backend APIs
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api.productiveminer.org';
const BLOCKCHAIN_URL = process.env.REACT_APP_BLOCKCHAIN_URL || 'https://api.productiveminer.org'; // Backend-proxied blockchain endpoints
const MATH_ENGINE_URL = process.env.REACT_APP_MATH_ENGINE_URL || 'https://api.productiveminer.org';

console.log('🔧 API Configuration:', {
  API_BASE_URL,
  BLOCKCHAIN_URL,
  MATH_ENGINE_URL
});

// Create axios instances with proper configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const blockchainClient = axios.create({
  baseURL: BLOCKCHAIN_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Note: In production (S3 + ECS) we route math engine calls through the backend
// so we prefer using apiClient for those endpoints.

// Request interceptors for logging
apiClient.interceptors.request.use(
  (config) => {
    console.log(`🔍 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    // Attach temporary user identification headers for mining persistence
    try {
      const userId = window.localStorage.getItem('USER_ID') || '1';
      const walletAddress = window.localStorage.getItem('WALLET_ADDRESS') || '';
      config.headers = config.headers || {};
      if (userId) config.headers['x-user-id'] = userId;
      if (walletAddress) config.headers['x-wallet-address'] = walletAddress;
    } catch {}
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

blockchainClient.interceptors.request.use(
  (config) => {
    console.log(`🔍 Blockchain Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Blockchain Request Error:', error);
    return Promise.reject(error);
  }
);

// (mathEngineClient interceptors intentionally removed for simplicity)

// Response interceptors for logging
apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error(`❌ API Response Error: ${error.response?.status} ${error.config?.url}`, error.message);
    return Promise.reject(error);
  }
);

blockchainClient.interceptors.response.use(
  (response) => {
    console.log(`✅ Blockchain Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error(`❌ Blockchain Response Error: ${error.response?.status} ${error.config?.url}`, error.message);
    return Promise.reject(error);
  }
);

// (mathEngineClient interceptors intentionally removed for simplicity)

// Utility function for API calls with error handling
const apiCall = async (client, endpoint, method = 'GET', data = null) => {
  try {
    const config = {
      method,
      url: endpoint,
      ...(data && { data })
    };
    
    const response = await client(config);
    console.log(`✅ Success: ${endpoint}`, response.data);
    return response.data;
  } catch (error) {
    console.error(`❌ Error: ${endpoint}`, {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });
    throw error; // Re-throw the error so React Query can handle it
  }
};

// Backend API Methods
export const backendAPI = {
  // Dashboard data - Combined endpoint
  getDashboardData: async () => {
    try {
      // Try the dashboard endpoint first
      return await apiCall(apiClient, '/api/stats/dashboard');
    } catch (error) {
      console.log('Dashboard endpoint failed, using fallback data from contract stats');
      
      // Fallback: use contract stats to create dashboard data
      const contractStats = await apiCall(apiClient, '/api/contract/stats/contract');
      const networkStats = await apiCall(apiClient, '/api/contract/stats/network');
      
      return {
        success: true,
        data: {
          users: {
            total: 0,
            active: 0,
            newThisWeek: 0,
            newThisMonth: 0
          },
          mining: {
            totalSessions: contractStats.data?.totalSessions || 0,
            completedSessions: 0,
            stoppedSessions: 0,
            totalMiningTime: 0,
            totalCoinsEarned: contractStats.data?.totalRewardsDistributed || 0,
            avgDifficulty: 25,
            avgSessionDuration: 0
          },
          activeMiners: networkStats.data?.totalValidators || 0,
          research: {
            totalPapers: 0,
            totalDiscoveries: contractStats.data?.totalDiscoveries || 0,
            totalCitations: 0,
            avgComplexity: 0
          },
          redis: {},
          note: "Using fallback data from contract stats"
        }
      };
    }
  },

  // Token data
  getTokenData: async () => {
    return apiCall(apiClient, '/api/token/data');
  },

  // Wallet operations
  getWalletInfo: async () => {
    return apiCall(apiClient, '/wallet/info');
  },

  sendTransaction: async (transactionData) => {
    // Normalize to backend payload { to, amount, gasPrice }
    const payload = Array.isArray(transactionData)
      ? { to: transactionData[0], amount: transactionData[1], gasPrice: transactionData[2] }
      : transactionData;
    return apiCall(apiClient, '/wallet/send', 'POST', payload);
  },

  getWalletTransactions: async () => {
    return apiCall(apiClient, '/wallet/transactions');
  },

  // Staking operations
  getStakingInfo: async () => {
    return apiCall(apiClient, '/staking/info');
  },

  stakeTokens: async (stakeData) => {
    return apiCall(apiClient, '/staking/stake', 'POST', stakeData);
  },

  unstakeTokens: async (unstakeData) => {
    return apiCall(apiClient, '/staking/unstake', 'POST', unstakeData);
  },

  claimRewards: async () => {
    return apiCall(apiClient, '/staking/claim', 'POST');
  },

  // Mining operations
  getMiningInfo: async () => {
    return apiCall(apiClient, '/mining/info');
  },

  startMining: async (miningData) => {
    return apiCall(apiClient, '/mining/start', 'POST', miningData);
  },

  stopMining: async () => {
    return apiCall(apiClient, '/mining/stop', 'POST');
  },

  // Contact form
  submitContactForm: async (formData) => {
    return apiCall(apiClient, '/contact', 'POST', formData);
  },

  // Research operations
  getResearchPapers: async () => {
    return apiCall(apiClient, '/api/research/papers');
  },

  getDiscoveries: async () => {
    return apiCall(apiClient, '/api/research/discoveries');
  },

  getResearchStats: async () => {
    return apiCall(apiClient, '/api/research/stats');
  },

  downloadResearch: async (data) => {
    return apiCall(apiClient, '/api/research/download', 'POST', data);
  },

  // Contract API Methods
  getContractHealth: async () => {
    return apiCall(apiClient, '/api/contract/health');
  },

  getContractStats: async () => {
    return apiCall(apiClient, '/api/contract/stats/contract');
  },

  getContractNetworkStats: async () => {
    return apiCall(apiClient, '/api/contract/stats/network');
  },

  getContractConfig: async () => {
    return apiCall(apiClient, '/api/contract/config');
  },

  // Get network statistics
  getNetworkStats: async () => {
    return apiCall(apiClient, '/api/contract/stats/network');
  },

  // Get blocks list
  getBlocksList: async () => {
    // Since there's no blocks endpoint yet, let's use the contract stats endpoint
    // and create a mock blocks list from the data
    const contractStats = await apiCall(apiClient, '/api/contract/stats/contract');
    
    // Create mock blocks data based on contract stats
    const mockBlocks = [];
    const totalBlocks = contractStats.data?.totalBlocks || 0;
    
    for (let i = 0; i < Math.min(20, totalBlocks || 10); i++) {
      mockBlocks.push({
        blockNumber: totalBlocks - i,
        blockHash: `0x${Math.random().toString(16).slice(2, 66)}`,
        miner: `0x${Math.random().toString(16).slice(2, 42)}`,
        workType: 'Prime Pattern Discovery',
        difficulty: Math.floor(Math.random() * 1000000) + 2500000,
        reward: Math.floor(Math.random() * 1000) + 100,
        timestamp: Math.floor(Date.now() / 1000) - (i * 60),
        status: 'confirmed'
      });
    }
    
    return {
      success: true,
      data: {
        blocks: mockBlocks,
        totalBlocks: totalBlocks
      }
    };
  }
};

// Blockchain API Methods (via Backend)
export const flowAPI = {
  // System status
  getSystemStatus: async () => {
    const [statusResponse, networkResponse] = await Promise.all([
      apiCall(apiClient, '/api/contract/health'),
      apiCall(apiClient, '/api/contract/stats/network')
    ]);
    return {
      system: statusResponse,
      network: networkResponse
    };
  },

  // Network activity
  getNetworkActivity: async () => {
    return apiCall(apiClient, '/api/contract/stats/network');
  },

  // Hashrate data
  getHashrateData: async () => {
    return apiCall(apiClient, '/api/contract/stats/network');
  },

  // Latest blocks
  getLatestBlock: async () => {
    return apiCall(apiClient, '/api/mining/info');
  },

  // Specific block
  getBlock: async (number) => {
    return apiCall(apiClient, '/api/mining/info');
  },

  // Transaction data
  getTransaction: async (hash) => {
    return apiCall(apiClient, '/api/wallet/transactions');
  },

  // Validators
  getValidators: async () => {
    return apiCall(apiClient, '/api/validators');
  },

  // Mining statistics
  getMiningStats: async () => {
    return apiCall(apiClient, '/api/mining/stats');
  },

  // Staking data
  getStakingData: async () => {
    return apiCall(apiClient, '/api/staking/info');
  },

  // Start mining
  startMining: async (requestBody) => {
    return apiCall(apiClient, '/api/mining/start', 'POST', requestBody);
  },

  // Stop mining
  stopMining: async (requestBody) => {
    return apiCall(apiClient, '/api/mining/stop', 'POST', requestBody);
  }
};

// Mathematical Engine API Methods
export const mathEngineAPI = {
  // Engine distribution (via backend)
  getEngineDistribution: async () => {
    return apiCall(apiClient, '/api/engines/distribution');
  },

  // Engine statistics (via backend)
  getEngineStats: async () => {
    return apiCall(apiClient, '/api/engines/stats');
  },

  // Mining status (via backend)
  getMiningStatus: async () => {
    // Prefer public status to avoid auth
    return apiCall(apiClient, '/api/mining/public/status');
  },

  // Mathematical discoveries (via backend research API)
  getDiscoveries: async () => {
    return apiCall(apiClient, '/api/research/discoveries');
  },

  // Start a computation as a mining session (via backend)
  computeProblem: async (engineType, parameters) => {
    const workTypeMap = {
      'prime-pattern': 0, // PRIME_PATTERN_DISCOVERY
      'riemann-zeros': 1, // RIEMANN_ZERO_COMPUTATION
      'yang-mills': 2, // YANG_MILLS_FIELD_THEORY
      'goldbach': 3, // GOLDBACH_CONJECTURE_VERIFICATION
      'navier-stokes': 4, // NAVIER_STOKES_SIMULATION
      'birch-swinnerton': 5, // BIRCH_SWINNERTON_DYER
      'ecc': 6, // ELLIPTIC_CURVE_CRYPTOGRAPHY
      'lattice': 7, // LATTICE_CRYPTOGRAPHY
      'poincare': 8, // POINCARE_CONJECTURE
      'quantum-algorithm': 9, // QUANTUM_ALGORITHM_OPTIMIZATION
      'crypto-protocol': 10, // CRYPTOGRAPHIC_PROTOCOL_ANALYSIS
      'math-constant': 11 // MATHEMATICAL_CONSTANT_VERIFICATION
    };
    const workType = workTypeMap[engineType] !== undefined ? workTypeMap[engineType] : 0; // Default to PRIME_PATTERN_DISCOVERY
    const requestBody = {
      workType,
      difficulty: parameters?.difficulty || 25,
      action: parameters?.action || 'start'
    };
    return apiCall(apiClient, '/api/mining/start', 'POST', requestBody);
  },

  // Stop mining (via backend)
  stopMining: async () => {
    return apiCall(apiClient, '/api/mining/stop', 'POST');
  }
};

// Explorer API Methods (served by backend)
export const explorerAPI = {
  getBlocks: async (limit = 20) => {
    const qs = typeof limit === 'number' ? `?limit=${limit}` : '';
    return apiCall(apiClient, `/api/explorer/blocks${qs}`);
  },
  getTransactions: async (limit = 50) => {
    const qs = typeof limit === 'number' ? `?limit=${limit}` : '';
    return apiCall(apiClient, `/api/explorer/transactions${qs}`);
  }
};

// Test all API connections
export const testAPIConnections = async () => {
  console.log('🧪 Testing API Connections...');
  
  const tests = [
    { name: 'Backend Token Data', fn: () => backendAPI.getTokenData() },
    { name: 'Blockchain Status', fn: () => flowAPI.getSystemStatus() },
    { name: 'Blockchain Network Stats', fn: () => flowAPI.getHashrateData() },
    { name: 'Math Engine Distribution', fn: () => mathEngineAPI.getEngineDistribution() }
  ];

  for (const test of tests) {
    try {
      console.log(`\n🔍 Testing: ${test.name}`);
      const result = await test.fn();
      if (result) {
        console.log(`✅ ${test.name}: SUCCESS`, Object.keys(result).slice(0, 3));
      } else {
        console.log(`❌ ${test.name}: FAILED - No data returned`);
      }
    } catch (error) {
      console.log(`❌ ${test.name}: ERROR`, error.message);
    }
  }
  
  console.log('\n🧪 API Connection Test Complete');
};
