import axios from 'axios';

// API Configuration - CloudFront-proxied backend URLs
// Using relative paths to avoid mixed content errors and let CloudFront handle routing
const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';
const BLOCKCHAIN_URL = process.env.REACT_APP_BLOCKCHAIN_URL || '/api'; // Backend-proxied blockchain endpoints
const MATH_ENGINE_URL = process.env.REACT_APP_MATH_ENGINE_URL || '/api/engine';

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
  // Token data
  getTokenData: async () => {
    return apiCall(apiClient, '/token/data');
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
    return apiCall(apiClient, '/research/papers');
  },

  getDiscoveries: async () => {
    return apiCall(apiClient, '/research/discoveries');
  },

  getResearchStats: async () => {
    return apiCall(apiClient, '/research/stats');
  },

  downloadResearch: async (data) => {
    return apiCall(apiClient, '/research/download', 'POST', data);
  },

  // Contract API Methods
  getContractHealth: async () => {
    return apiCall(apiClient, '/contract/health');
  },

  getContractStats: async () => {
    return apiCall(apiClient, '/contract/stats/contract');
  },

  getContractNetworkStats: async () => {
    return apiCall(apiClient, '/contract/stats/network');
  },

  getContractConfig: async () => {
    return apiCall(apiClient, '/contract/config');
  }
};

// Blockchain API Methods (via Backend)
export const flowAPI = {
  // System status
  getSystemStatus: async () => {
    const [statusResponse, networkResponse] = await Promise.all([
      apiCall(apiClient, '/contract/health'),
      apiCall(apiClient, '/contract/stats/network')
    ]);
    return {
      system: statusResponse,
      network: networkResponse
    };
  },

  // Network activity
  getNetworkActivity: async () => {
    return apiCall(apiClient, '/contract/stats/network');
  },

  // Hashrate data
  getHashrateData: async () => {
    return apiCall(apiClient, '/contract/stats/network');
  },

  // Latest blocks
  getLatestBlock: async () => {
    return apiCall(apiClient, '/mining/info');
  },

  // Specific block
  getBlock: async (number) => {
    return apiCall(apiClient, '/mining/info');
  },

  // Transaction data
  getTransaction: async (hash) => {
    return apiCall(apiClient, '/wallet/transactions');
  },

  // Validators
  getValidators: async () => {
    return apiCall(apiClient, '/validators');
  },

  // Mining statistics
  getMiningStats: async () => {
    return apiCall(apiClient, '/mining/stats');
  },

  // Start mining
  startMining: async (requestBody) => {
    return apiCall(apiClient, '/mining/start', 'POST', requestBody);
  },

  // Stop mining
  stopMining: async (requestBody) => {
    return apiCall(apiClient, '/mining/stop', 'POST', requestBody);
  }
};

// Mathematical Engine API Methods
export const mathEngineAPI = {
  // Engine distribution (via backend)
  getEngineDistribution: async () => {
    return apiCall(apiClient, '/engines/distribution');
  },

  // Engine statistics (via backend)
  getEngineStats: async () => {
    return apiCall(apiClient, '/engines/stats');
  },

  // Mining status (via backend)
  getMiningStatus: async () => {
    // Prefer public status to avoid auth
    return apiCall(apiClient, '/mining/public/status');
  },

  // Mathematical discoveries (via backend research API)
  getDiscoveries: async () => {
    return apiCall(apiClient, '/research/discoveries');
  },

  // Start a computation as a mining session (via backend)
  computeProblem: async (engineType, parameters) => {
    const workTypeMap = {
      'riemann-zeros': 'Riemann Zero Computation',
      'yang-mills': 'Yang-Mills Field Theory',
      'goldbach': 'Goldbach Conjecture Verification',
      'navier-stokes': 'Navier-Stokes Simulation',
      'birch-swinnerton': 'Birch-Swinnerton-Dyer',
      'ecc': 'Elliptic Curve Cryptography',
      'lattice': 'Lattice Cryptography',
      'poincare': 'Poincaré Conjecture',
      'prime-pattern': 'Prime Pattern Discovery'
    };
    const workType = workTypeMap[engineType] || 'Prime Pattern Discovery';
    const requestBody = {
      workType,
      difficulty: parameters?.difficulty || 25,
      action: parameters?.action || 'start'
    };
    return apiCall(apiClient, '/mining/start', 'POST', requestBody);
  },

  // Stop mining (via backend)
  stopMining: async () => {
    return apiCall(apiClient, '/mining/stop', 'POST');
  }
};

// Explorer API Methods (served by backend)
export const explorerAPI = {
  getBlocks: async (limit = 20) => {
    const qs = typeof limit === 'number' ? `?limit=${limit}` : '';
    return apiCall(apiClient, `/explorer/blocks${qs}`);
  },
  getTransactions: async (limit = 50) => {
    const qs = typeof limit === 'number' ? `?limit=${limit}` : '';
    return apiCall(apiClient, `/explorer/transactions${qs}`);
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
