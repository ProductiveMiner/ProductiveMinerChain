import axios from 'axios';
import API_CONFIG from '../config/api.js';

// Create axios instance for backend API
const backendAPI = axios.create({
  baseURL: API_CONFIG.BACKEND_API.BASE_URL,
  timeout: API_CONFIG.REQUEST_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Create axios instance for mathematical engine
const mathematicalEngine = axios.create({
  baseURL: API_CONFIG.MATHEMATICAL_ENGINE.BASE_URL,
  timeout: API_CONFIG.REQUEST_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Backend API services
export const backendServices = {
  // Health check
  healthCheck: () => backendAPI.get(API_CONFIG.BACKEND_API.ENDPOINTS.HEALTH),
  
  // User management
  getUsers: () => backendAPI.get(API_CONFIG.BACKEND_API.ENDPOINTS.USERS),
  createUser: (userData) => backendAPI.post(API_CONFIG.BACKEND_API.ENDPOINTS.USERS, userData),
  
  // Session management
  getSessions: () => backendAPI.get(API_CONFIG.BACKEND_API.ENDPOINTS.SESSIONS),
  createSession: (sessionData) => backendAPI.post(API_CONFIG.BACKEND_API.ENDPOINTS.SESSIONS, sessionData),
  
  // Mining operations
  getMiningData: () => backendAPI.get(API_CONFIG.BACKEND_API.ENDPOINTS.MINING_INFO),
  startMining: (miningData) => backendAPI.post(API_CONFIG.BACKEND_API.ENDPOINTS.MINING_START, miningData),
  stopMining: () => backendAPI.post(API_CONFIG.BACKEND_API.ENDPOINTS.MINING_STOP),
  
  // Wallet operations
  getWallet: () => backendAPI.get(API_CONFIG.BACKEND_API.ENDPOINTS.WALLET),
  updateWallet: (walletData) => backendAPI.post(API_CONFIG.BACKEND_API.ENDPOINTS.WALLET, walletData),
  
  // Validator operations
  getValidators: () => backendAPI.get(API_CONFIG.BACKEND_API.ENDPOINTS.VALIDATORS),
  createValidator: (validatorData) => backendAPI.post(API_CONFIG.BACKEND_API.ENDPOINTS.VALIDATORS, validatorData),
  
  // Research operations
  getResearch: () => backendAPI.get(API_CONFIG.BACKEND_API.ENDPOINTS.RESEARCH),
  createResearch: (researchData) => backendAPI.post(API_CONFIG.BACKEND_API.ENDPOINTS.RESEARCH, researchData),
  
  // Explorer operations
  getExplorerData: () => backendAPI.get(API_CONFIG.BACKEND_API.ENDPOINTS.EXPLORER),
  searchTransactions: (searchData) => backendAPI.post(API_CONFIG.BACKEND_API.ENDPOINTS.EXPLORER, searchData),
};

// Mathematical engine services
export const mathematicalServices = {
  // Health check
  healthCheck: () => mathematicalEngine.get(API_CONFIG.MATHEMATICAL_ENGINE.ENDPOINTS.HEALTH),
  
  // General computation
  compute: (computationData) => mathematicalEngine.post(API_CONFIG.MATHEMATICAL_ENGINE.ENDPOINTS.COMPUTE, computationData),
  
  // Specific mathematical computations
  computePrimePatterns: (params) => mathematicalEngine.post(API_CONFIG.MATHEMATICAL_ENGINE.ENDPOINTS.PRIME_PATTERNS, params),
  computeRiemannZeros: (params) => mathematicalEngine.post(API_CONFIG.MATHEMATICAL_ENGINE.ENDPOINTS.RIEMANN_ZEROS, params),
  computeYangMills: (params) => mathematicalEngine.post(API_CONFIG.MATHEMATICAL_ENGINE.ENDPOINTS.YANG_MILLS, params),
  computeGoldbach: (params) => mathematicalEngine.post(API_CONFIG.MATHEMATICAL_ENGINE.ENDPOINTS.GOLDBACH, params),
  computeNavierStokes: (params) => mathematicalEngine.post(API_CONFIG.MATHEMATICAL_ENGINE.ENDPOINTS.NAVIER_STOKES, params),
  computeEllipticCurves: (params) => mathematicalEngine.post(API_CONFIG.MATHEMATICAL_ENGINE.ENDPOINTS.ELLIPTIC_CURVES, params),
  computeCryptography: (params) => mathematicalEngine.post(API_CONFIG.MATHEMATICAL_ENGINE.ENDPOINTS.CRYPTOGRAPHY, params),
  computeLatticeCrypto: (params) => mathematicalEngine.post(API_CONFIG.MATHEMATICAL_ENGINE.ENDPOINTS.LATTICE_CRYPTO, params),
  computePoincare: (params) => mathematicalEngine.post(API_CONFIG.MATHEMATICAL_ENGINE.ENDPOINTS.POINCARE, params),
  computeQuantumEntanglement: (params) => mathematicalEngine.post(API_CONFIG.MATHEMATICAL_ENGINE.ENDPOINTS.QUANTUM_ENTANGLEMENT, params),
  computeFractalGeometry: (params) => mathematicalEngine.post(API_CONFIG.MATHEMATICAL_ENGINE.ENDPOINTS.FRACTAL_GEOMETRY, params),
  computeChaosTheory: (params) => mathematicalEngine.post(API_CONFIG.MATHEMATICAL_ENGINE.ENDPOINTS.CHAOS_THEORY, params),
};

// Error handling interceptor
const errorHandler = (error) => {
  console.error('API Error:', error);
  return Promise.reject(error);
};

// Add error handling to both instances
backendAPI.interceptors.response.use(response => response, errorHandler);
mathematicalEngine.interceptors.response.use(response => response, errorHandler);

export default {
  backend: backendServices,
  mathematical: mathematicalServices,
};
