import { mathematicalServices } from './api.js';

class MathEngineService {
  constructor() {
    this.isConnected = false;
    this.healthCheckInterval = null;
  }

  // Initialize connection to math engine
  async initialize() {
    try {
      console.log('🔧 Initializing Math Engine Service...');
      
      // Test connection to math engine
      const healthResponse = await this.healthCheck();
      this.isConnected = healthResponse.status === 'healthy';
      
      if (this.isConnected) {
        console.log('✅ Math Engine connected successfully');
        this.startHealthCheck();
      } else {
        console.warn('⚠️ Math Engine health check failed - continuing without math engine');
      }
      
      return this.isConnected;
    } catch (error) {
      console.warn('⚠️ Math Engine not available - continuing without math engine:', error.message);
      this.isConnected = false;
      return false;
    }
  }

  // Health check for math engine
  async healthCheck() {
    try {
      const response = await mathematicalServices.healthCheck();
      return response.data;
    } catch (error) {
      console.warn('⚠️ Math Engine health check failed:', error.message);
      throw error;
    }
  }

  // Start periodic health checks
  startHealthCheck() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    this.healthCheckInterval = setInterval(async () => {
      try {
        const health = await this.healthCheck();
        this.isConnected = health.status === 'healthy';
      } catch (error) {
        this.isConnected = false;
        console.warn('⚠️ Math Engine health check failed:', error.message);
      }
    }, 30000); // Check every 30 seconds
  }

  // Stop health checks
  stopHealthCheck() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  // Perform mathematical computation
  async compute(workType, parameters = {}) {
    if (!this.isConnected) {
      console.warn('⚠️ Math Engine not connected - using fallback computation');
      // Return a fallback result when math engine is not available
      return this.getFallbackResult(workType, parameters);
    }

    try {
      console.log(`🧮 Computing ${workType} with parameters:`, parameters);
      
      const response = await mathematicalServices.compute({
        work_type: workType,
        parameters: parameters
      });
      
      console.log(`✅ ${workType} computation completed:`, response.data);
      return response.data;
    } catch (error) {
      console.warn(`⚠️ ${workType} computation failed, using fallback:`, error.message);
      return this.getFallbackResult(workType, parameters);
    }
  }

  // Fallback computation when math engine is not available
  getFallbackResult(workType, parameters = {}) {
    console.log(`❌ Math engine unavailable for ${workType}`);
    
    // Return error response instead of mock data
    return {
      status: 'error',
      error: 'Mathematical engine is currently unavailable',
      work_type: workType,
      message: 'Please try again later or contact support if the issue persists'
    };
  }

  // Specific mathematical computations for all 25 work types
  // Millennium Problems (5 Types)
  async computeRiemannZeros(count = 10) {
    return this.compute('riemann_zeros', { count });
  }

  async computeBirchSwinnerton() {
    return this.compute('birch_swinnerton', {});
  }

  async computeYangMills() {
    return this.compute('yang_mills', {});
  }

  async computeNavierStokes() {
    return this.compute('navier_stokes', {});
  }

  async computePoincare() {
    return this.compute('poincare_conjecture', {});
  }

  // Major Theorems (1 Type)
  async computeGoldbach(limit = 1000) {
    return this.compute('goldbach_conjecture', { limit });
  }

  // Advanced Research (8 Types)
  async computePrimePatterns(limit = 1000) {
    return this.compute('prime_pattern_discovery', { limit });
  }

  async computeTwinPrimes(limit = 1000) {
    return this.compute('twin_primes', { limit });
  }

  async computePerfectNumbers(limit = 1000) {
    return this.compute('perfect_numbers', { limit });
  }

  async computeMersennePrimes(limit = 1000) {
    return this.compute('mersenne_primes', { limit });
  }

  async computeDifferentialEquations() {
    return this.compute('differential_equations', {});
  }

  async computeAlgebraicTopology() {
    return this.compute('algebraic_topology', {});
  }

  async computeQuantumComputing() {
    return this.compute('quantum_computing', {});
  }

  async computeOptimizationAlgorithms() {
    return this.compute('optimization_algorithms', {});
  }

  // Applied Research (6 Types)
  async computeEllipticCurveCrypto() {
    return this.compute('elliptic_curve_crypto', {});
  }

  async computeLatticeCrypto() {
    return this.compute('lattice_cryptography', {});
  }

  async computeCryptoHashFunctions() {
    return this.compute('crypto_hash_functions', {});
  }

  async computeMachineLearning() {
    return this.compute('machine_learning', {});
  }

  async computeBlockchainProtocols() {
    return this.compute('blockchain_protocols', {});
  }

  async computeDistributedSystems() {
    return this.compute('distributed_systems', {});
  }

  // Standard Research (2 Types)
  async computeNumberTheory() {
    return this.compute('number_theory', {});
  }

  async computeEuclideanGeometry() {
    return this.compute('euclidean_geometry', {});
  }

  // Complex Problems (1 Type)
  async computeCollatzConjecture(limit = 1000) {
    return this.compute('collatz_conjecture', { limit });
  }

  // Basic Research (2 Types)
  async computeFibonacciPatterns(limit = 1000) {
    return this.compute('fibonacci_patterns', { limit });
  }

  async computePascalTriangle(rows = 100) {
    return this.compute('pascal_triangle', { rows });
  }

  // Get available work types - All 25 mathematical work types
  getAvailableWorkTypes() {
    return [
      // Millennium Problems (5 Types)
      { id: 'riemann_zeros', name: 'Riemann Zeros', description: 'Millennium Problem: Zeros of the Riemann zeta function', category: 'Millennium Problems', baseReward: 100 },
      { id: 'goldbach_conjecture', name: 'Goldbach Conjecture', description: 'Major Theorem: Even number decomposition into primes', category: 'Major Theorems', baseReward: 80 },
      { id: 'birch_swinnerton', name: 'Birch-Swinnerton-Dyer', description: 'Millennium Problem: Elliptic curve rank calculations', category: 'Millennium Problems', baseReward: 90 },
      { id: 'prime_pattern_discovery', name: 'Prime Pattern Discovery', description: 'Advanced Research: Discover patterns in prime numbers', category: 'Advanced Research', baseReward: 60 },
      { id: 'twin_primes', name: 'Twin Primes', description: 'Advanced Research: Twin prime number research', category: 'Advanced Research', baseReward: 70 },
      { id: 'collatz_conjecture', name: 'Collatz Conjecture', description: 'Complex Problem: 3n+1 sequence analysis', category: 'Complex Problems', baseReward: 50 },
      { id: 'perfect_numbers', name: 'Perfect Numbers', description: 'Advanced Research: Perfect number discovery', category: 'Advanced Research', baseReward: 65 },
      { id: 'mersenne_primes', name: 'Mersenne Primes', description: 'Advanced Research: Mersenne prime discovery', category: 'Advanced Research', baseReward: 95 },
      { id: 'fibonacci_patterns', name: 'Fibonacci Patterns', description: 'Basic Research: Fibonacci sequence analysis', category: 'Basic Research', baseReward: 40 },
      { id: 'pascal_triangle', name: 'Pascal Triangle', description: 'Basic Research: Pascal triangle patterns', category: 'Basic Research', baseReward: 35 },
      { id: 'differential_equations', name: 'Differential Equations', description: 'Advanced Research: Differential equation solutions', category: 'Advanced Research', baseReward: 75 },
      { id: 'number_theory', name: 'Number Theory', description: 'Standard Research: Fundamental number theory', category: 'Standard Research', baseReward: 55 },
      { id: 'yang_mills', name: 'Yang-Mills Field Theory', description: 'Millennium Problem: Gauge field theory calculations', category: 'Millennium Problems', baseReward: 100 },
      { id: 'navier_stokes', name: 'Navier-Stokes Simulation', description: 'Millennium Problem: Fluid dynamics calculations', category: 'Millennium Problems', baseReward: 95 },
      { id: 'elliptic_curve_crypto', name: 'Elliptic Curve Cryptography', description: 'Applied Research: ECC cryptographic systems', category: 'Applied Research', baseReward: 60 },
      { id: 'lattice_cryptography', name: 'Lattice Cryptography', description: 'Applied Research: Post-quantum cryptography', category: 'Applied Research', baseReward: 65 },
      { id: 'crypto_hash_functions', name: 'Cryptographic Hash Functions', description: 'Applied Research: Hash function analysis', category: 'Applied Research', baseReward: 50 },
      { id: 'poincare_conjecture', name: 'Poincaré Conjecture', description: 'Millennium Problem: Topology calculations', category: 'Millennium Problems', baseReward: 100 },
      { id: 'algebraic_topology', name: 'Algebraic Topology', description: 'Advanced Research: Topological algebra', category: 'Advanced Research', baseReward: 85 },
      { id: 'euclidean_geometry', name: 'Euclidean Geometry', description: 'Standard Research: Classical geometry', category: 'Standard Research', baseReward: 55 },
      { id: 'quantum_computing', name: 'Quantum Computing', description: 'Advanced Research: Quantum algorithms', category: 'Advanced Research', baseReward: 90 },
      { id: 'machine_learning', name: 'Machine Learning', description: 'Applied Research: ML algorithm optimization', category: 'Applied Research', baseReward: 75 },
      { id: 'blockchain_protocols', name: 'Blockchain Protocols', description: 'Applied Research: Protocol analysis', category: 'Applied Research', baseReward: 60 },
      { id: 'distributed_systems', name: 'Distributed Systems', description: 'Applied Research: Distributed algorithms', category: 'Applied Research', baseReward: 55 },
      { id: 'optimization_algorithms', name: 'Optimization Algorithms', description: 'Advanced Research: Algorithm optimization', category: 'Advanced Research', baseReward: 70 }
    ];
  }

  // Get connection status
  getConnectionStatus() {
    return {
      connected: this.isConnected,
      timestamp: new Date().toISOString()
    };
  }

  // Cleanup
  destroy() {
    this.stopHealthCheck();
    this.isConnected = false;
  }
}

// Create singleton instance
const mathEngineService = new MathEngineService();

export default mathEngineService;
