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

// Create axios instance for mathematical engine (direct connection to ECS)
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
  
  // All 25 mathematical work types - using the same compute endpoint
  // Millennium Problems (5 Types)
  computeRiemannZeros: (params) => mathematicalEngine.post(API_CONFIG.MATHEMATICAL_ENGINE.ENDPOINTS.COMPUTE, {
    work_type: 'riemann_zeros',
    parameters: params
  }),
  
  computeBirchSwinnerton: (params) => mathematicalEngine.post(API_CONFIG.MATHEMATICAL_ENGINE.ENDPOINTS.COMPUTE, {
    work_type: 'birch_swinnerton',
    parameters: params
  }),
  
  computeYangMills: (params) => mathematicalEngine.post(API_CONFIG.MATHEMATICAL_ENGINE.ENDPOINTS.COMPUTE, {
    work_type: 'yang_mills',
    parameters: params
  }),
  
  computeNavierStokes: (params) => mathematicalEngine.post(API_CONFIG.MATHEMATICAL_ENGINE.ENDPOINTS.COMPUTE, {
    work_type: 'navier_stokes',
    parameters: params
  }),
  
  computePoincare: (params) => mathematicalEngine.post(API_CONFIG.MATHEMATICAL_ENGINE.ENDPOINTS.COMPUTE, {
    work_type: 'poincare_conjecture',
    parameters: params
  }),
  
  // Major Theorems (1 Type)
  computeGoldbach: (params) => mathematicalEngine.post(API_CONFIG.MATHEMATICAL_ENGINE.ENDPOINTS.COMPUTE, {
    work_type: 'goldbach_conjecture',
    parameters: params
  }),
  
  // Advanced Research (8 Types)
  computePrimePatterns: (params) => mathematicalEngine.post(API_CONFIG.MATHEMATICAL_ENGINE.ENDPOINTS.COMPUTE, {
    work_type: 'prime_pattern_discovery',
    parameters: params
  }),
  
  computeTwinPrimes: (params) => mathematicalEngine.post(API_CONFIG.MATHEMATICAL_ENGINE.ENDPOINTS.COMPUTE, {
    work_type: 'twin_primes',
    parameters: params
  }),
  
  computePerfectNumbers: (params) => mathematicalEngine.post(API_CONFIG.MATHEMATICAL_ENGINE.ENDPOINTS.COMPUTE, {
    work_type: 'perfect_numbers',
    parameters: params
  }),
  
  computeMersennePrimes: (params) => mathematicalEngine.post(API_CONFIG.MATHEMATICAL_ENGINE.ENDPOINTS.COMPUTE, {
    work_type: 'mersenne_primes',
    parameters: params
  }),
  
  computeDifferentialEquations: (params) => mathematicalEngine.post(API_CONFIG.MATHEMATICAL_ENGINE.ENDPOINTS.COMPUTE, {
    work_type: 'differential_equations',
    parameters: params
  }),
  
  computeAlgebraicTopology: (params) => mathematicalEngine.post(API_CONFIG.MATHEMATICAL_ENGINE.ENDPOINTS.COMPUTE, {
    work_type: 'algebraic_topology',
    parameters: params
  }),
  
  computeQuantumComputing: (params) => mathematicalEngine.post(API_CONFIG.MATHEMATICAL_ENGINE.ENDPOINTS.COMPUTE, {
    work_type: 'quantum_computing',
    parameters: params
  }),
  
  computeOptimizationAlgorithms: (params) => mathematicalEngine.post(API_CONFIG.MATHEMATICAL_ENGINE.ENDPOINTS.COMPUTE, {
    work_type: 'optimization_algorithms',
    parameters: params
  }),
  
  // Applied Research (6 Types)
  computeEllipticCurveCrypto: (params) => mathematicalEngine.post(API_CONFIG.MATHEMATICAL_ENGINE.ENDPOINTS.COMPUTE, {
    work_type: 'elliptic_curve_crypto',
    parameters: params
  }),
  
  computeLatticeCrypto: (params) => mathematicalEngine.post(API_CONFIG.MATHEMATICAL_ENGINE.ENDPOINTS.COMPUTE, {
    work_type: 'lattice_cryptography',
    parameters: params
  }),
  
  computeCryptoHashFunctions: (params) => mathematicalEngine.post(API_CONFIG.MATHEMATICAL_ENGINE.ENDPOINTS.COMPUTE, {
    work_type: 'crypto_hash_functions',
    parameters: params
  }),
  
  computeMachineLearning: (params) => mathematicalEngine.post(API_CONFIG.MATHEMATICAL_ENGINE.ENDPOINTS.COMPUTE, {
    work_type: 'machine_learning',
    parameters: params
  }),
  
  computeBlockchainProtocols: (params) => mathematicalEngine.post(API_CONFIG.MATHEMATICAL_ENGINE.ENDPOINTS.COMPUTE, {
    work_type: 'blockchain_protocols',
    parameters: params
  }),
  
  computeDistributedSystems: (params) => mathematicalEngine.post(API_CONFIG.MATHEMATICAL_ENGINE.ENDPOINTS.COMPUTE, {
    work_type: 'distributed_systems',
    parameters: params
  }),
  
  // Standard Research (2 Types)
  computeNumberTheory: (params) => mathematicalEngine.post(API_CONFIG.MATHEMATICAL_ENGINE.ENDPOINTS.COMPUTE, {
    work_type: 'number_theory',
    parameters: params
  }),
  
  computeEuclideanGeometry: (params) => mathematicalEngine.post(API_CONFIG.MATHEMATICAL_ENGINE.ENDPOINTS.COMPUTE, {
    work_type: 'euclidean_geometry',
    parameters: params
  }),
  
  // Complex Problems (1 Type)
  computeCollatzConjecture: (params) => mathematicalEngine.post(API_CONFIG.MATHEMATICAL_ENGINE.ENDPOINTS.COMPUTE, {
    work_type: 'collatz_conjecture',
    parameters: params
  }),
  
  // Basic Research (2 Types)
  computeFibonacciPatterns: (params) => mathematicalEngine.post(API_CONFIG.MATHEMATICAL_ENGINE.ENDPOINTS.COMPUTE, {
    work_type: 'fibonacci_patterns',
    parameters: params
  }),
  
  computePascalTriangle: (params) => mathematicalEngine.post(API_CONFIG.MATHEMATICAL_ENGINE.ENDPOINTS.COMPUTE, {
    work_type: 'pascal_triangle',
    parameters: params
  }),
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
