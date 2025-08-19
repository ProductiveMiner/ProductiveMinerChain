import axios from 'axios';

// API Configuration - Using relative URLs for CloudFront proxy
const API_BASE_URL = process.env.REACT_APP_API_URL || '';

// Create axios instance with proper configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Increased from 10000 to 30000ms
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptors for logging
apiClient.interceptors.request.use(
  (config) => {
    console.log(`🔍 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Generic API call function
const apiCall = async (client, endpoint, method = 'GET', data = null) => {
  try {
    const response = await client.request({
      method,
      url: endpoint,
      data,
    });
    return response.data;
  } catch (error) {
    console.error(`API call failed: ${method} ${endpoint}`, error);
    throw error;
  }
};

// Backend API Methods - Updated to use correct endpoints
export const backendAPI = {
  // Dashboard data - Combined endpoint
  getDashboardData: async () => {
    return apiCall(apiClient, '/api/stats/dashboard');
  },

  // User-specific dashboard data
  getUserDashboardData: async () => {
    return apiCall(apiClient, '/api/stats/dashboard/user');
  },

  // User stats
  getUserStats: async (address) => {
    return apiCall(apiClient, `/api/stats/user/${address}`);
  },

  // Token data - Updated to use new endpoint
  getTokenData: async () => {
    return apiCall(apiClient, '/api/token/data');
  },

  // Validators data - Updated to use new endpoint
  getValidators: async () => {
    return apiCall(apiClient, '/api/validators');
  },

  // Research data - Updated to use new endpoints
  getResearchPapers: async () => {
    return apiCall(apiClient, '/api/research/papers');
  },

  getDiscoveries: async () => {
    return apiCall(apiClient, '/api/research/discoveries');
  },

  getResearchStats: async () => {
    return apiCall(apiClient, '/api/research/stats');
  },

  // Contract data - Updated to use new endpoints
  getContractHealth: async () => {
    return apiCall(apiClient, '/api/contract/health');
  },

  getContractStats: async () => {
    return apiCall(apiClient, '/api/contract/stats/contract');
  },

  getContractNetworkStats: async () => {
    return apiCall(apiClient, '/api/contract/stats/network');
  },

  // Network stats - Added missing function
  getNetworkStats: async () => {
    return apiCall(apiClient, '/api/contract/stats/network');
  },

  // Engine data - Updated to use new endpoints
  getEngineStats: async () => {
    return apiCall(apiClient, '/api/engines/stats');
  },

  getEngineDistribution: async () => {
    return apiCall(apiClient, '/api/engines/distribution');
  },

  // Mining data - Updated to use new endpoints
  getMiningStats: async () => {
    return apiCall(apiClient, '/api/mining/stats');
  },

  getMiningInfo: async () => {
    return apiCall(apiClient, '/api/mining/info');
  },

  // Wallet data
  getWalletInfo: async () => {
    return apiCall(apiClient, '/api/wallet/info');
  },

  getWalletTransactions: async () => {
    return apiCall(apiClient, '/api/wallet/transactions');
  },

  // Staking data
  getStakingInfo: async () => {
    return apiCall(apiClient, '/api/staking/info');
  },

  // Staking actions
  stakeTokens: async (stakeData) => {
    return apiCall(apiClient, '/api/staking/stake', {
      method: 'POST',
      data: stakeData
    });
  },

  unstakeTokens: async (unstakeData) => {
    return apiCall(apiClient, '/api/staking/unstake', {
      method: 'POST',
      data: unstakeData
    });
  },

  claimStakingRewards: async () => {
    return apiCall(apiClient, '/api/staking/claim', {
      method: 'POST'
    });
  },

  // Explorer data
  getExplorerStats: async () => {
    return apiCall(apiClient, '/api/explorer/stats');
  },

  getExplorerBlocks: async () => {
    return apiCall(apiClient, '/api/explorer/blocks');
  },

  // Blocks list for explorer
  getBlocksList: async () => {
    return apiCall(apiClient, '/api/explorer/blocks');
  },

  // Research download endpoints
  downloadResearchJSON: async () => {
    return apiCall(apiClient, '/api/research/download');
  },

  downloadResearchCSV: async () => {
    return apiCall(apiClient, '/api/research/download/csv');
  },

  // Computational findings endpoints
  getComputationalFindings: async () => {
    return apiCall(apiClient, '/api/research/computational-findings');
  },

  getComputationalFindingsByType: async (problemType) => {
    return apiCall(apiClient, `/api/research/computational-findings/${problemType}`);
  },

  downloadResearchPaper: async (problemType) => {
    return apiCall(apiClient, `/api/research/download/paper/${problemType}`);
  }
};

// Blockchain API Methods (via Backend) - Updated
export const flowAPI = {
  // System status - Updated to use correct endpoints
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

  // Validators - Updated to use correct endpoint
  getValidators: async () => {
    return apiCall(apiClient, '/api/validators');
  },

  // Mining statistics - Updated to use correct endpoint
  getMiningStats: async () => {
    return apiCall(apiClient, '/api/mining/stats');
  },

  // Staking data - Updated to use correct endpoint
  getStakingData: async () => {
    return apiCall(apiClient, '/api/staking/info');
  }
};

// Mathematical Engine API Methods - Updated
export const mathEngineAPI = {
  // Engine distribution - Updated to use correct endpoint
  getEngineDistribution: async () => {
    return apiCall(apiClient, '/api/engines/distribution');
  },

  // Engine statistics - Updated to use correct endpoint
  getEngineStats: async () => {
    return apiCall(apiClient, '/api/engines/stats');
  },

  // Mathematical discoveries - Updated to use correct endpoint
  getDiscoveries: async () => {
    return apiCall(apiClient, '/api/research/discoveries');
  }
};

// Explorer API Methods - Updated
export const explorerAPI = {
  getBlocks: async () => {
    return apiCall(apiClient, '/api/explorer/blocks');
  },

  getStats: async () => {
    return apiCall(apiClient, '/api/explorer/stats');
  }
};
