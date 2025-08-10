import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// ES6 module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

// Memory management utility
function checkMemoryUsage() {
  const used = process.memoryUsage();
  const memoryUsageMB = {
    rss: Math.round(used.rss / 1024 / 1024),
    heapTotal: Math.round(used.heapTotal / 1024 / 1024),
    heapUsed: Math.round(used.heapUsed / 1024 / 1024),
    external: Math.round(used.external / 1024 / 1024)
  };
  
  // Force garbage collection if memory usage is high
  if (memoryUsageMB.heapUsed > 800) {
    if (global.gc) {
      global.gc();
      console.log('🧹 Memory cleanup triggered');
    }
  }
  
  return memoryUsageMB;
}

// Mathematical computation limits
const MATHEMATICAL_LIMITS = {
  MAX_BIT_STRENGTH: 18432,  // As per whitepaper quantum resistance
  MAX_ITERATIONS: 10000,
  MAX_RESULTS: 100,
  MAX_DIFFICULTY: 50,
  MAX_PRECISION: 1e-10,
  MAX_VALUE: 1000
};

// Work types from whitepaper
const WORK_TYPES = {
  PRIME_PATTERN: 'Prime Pattern Discovery',
  RIEMANN_ZERO: 'Riemann Zero Computation',
  YANG_MILLS: 'Yang-Mills Field Theory',
  GOLDBACH: 'Goldbach Conjecture Verification',
  NAVIER_STOKES: 'Navier-Stokes Simulation',
  BIRCH_SWINNERTON: 'Birch-Swinnerton-Dyer',
  ELLIPTIC_CURVE: 'Elliptic Curve Cryptography',
  LATTICE: 'Lattice Cryptography',
  POINCARE: 'Poincaré Conjecture'
};

// Blockchain state
let blockchainState = {
  height: 0,
  lastBlockTime: Date.now(),
  difficulty: 1,
  totalStake: 1000000,
  validators: new Map(),
  pendingTransactions: [],
  miningSessions: new Map(),
  blocks: [],
  discoveries: new Map(),
  solutionSets: new Map(),
  discoveryCounter: 0,
  networkStats: {
    totalNodes: 15,
    activeNodes: 12,
    hashRate: '3.75 GH/s',
    averageBlockTime: 20.9,
    tps: 47.8
  }
};

// Initialize validators as per whitepaper
function initializeValidators() {
  const validators = [
    { id: 'validator-1', stake: 100000, address: '0x1234567890abcdef1234567890abcdef12345678' },
    { id: 'validator-2', stake: 150000, address: '0x2345678901bcdef1234567890abcdef1234567890' },
    { id: 'validator-3', stake: 200000, address: '0x3456789012cdef1234567890abcdef12345678901' },
    { id: 'validator-4', stake: 125000, address: '0x4567890123def1234567890abcdef12345678901a' },
    { id: 'validator-5', stake: 175000, address: '0x567890123adef1234567890abcdef12345678901ab' }
  ];
  
  validators.forEach(v => {
    blockchainState.validators.set(v.id, {
      stake: v.stake,
      address: v.address,
      status: 'active',
      blocksValidated: 0,
      uptime: 99.8
    });
  });
}

// Tokenomics state (from whitepaper Section 3)
let tokenomicsState = {
  totalSupply: 1_000_000_000,  // 1B MINED
  circulatingSupply: 500_000_000,  // 50%
  stakedTokens: 200_000_000,  // 20%
  governancePool: 50_000_000,  // 5%
  researchAccess: 100_000_000,  // 10%
  miningRewards: 100_000_000,  // 10%
  transactionFees: 50_000_000,  // 5%
  treasury: 100_000_000,  // 10%
  
  // Emission parameters
  emissionRate: 1000,  // E₀ = 1000 tokens/block
  decayConstant: 0.0001,  // λ = 0.0001
  researchMultiplier: 0.01,  // α = 0.01-0.25
  
  // Burn rates
  burnRates: {
    millenniumProblems: 0.25,
    majorTheorems: 0.15,
    standardResearch: 0.10,
    collaborativeResearch: 0.12
  },
  
  // Soft cap for asymptotic approach
  softCap: 1_500_000_000,
  
  totalBurned: 0,
  phase2StartBlock: 100000
};

// User rewards system
let userRewards = {
  MINED: 10000,
  USD: 5000,
  totalMined: 0,
  totalStaked: 0,
  stakingRewards: 0,
  miningHistory: [],
  stakingHistory: []
};

// Learning state (ML models from whitepaper)
let learningState = {
  models: new Map(),
  optimizations: new Map(),
  learningCycles: [],
  discoveryPatterns: new Map(),
  adaptationCount: 0,
  trainingCycles: 0,
  neuralNetworks: [
    { name: 'Solution Quality Prediction', inputs: 23, outputs: 1 },
    { name: 'Difficulty Estimation', inputs: 18, outputs: 1 },
    { name: 'Complexity Prediction', inputs: 21, outputs: 1 },
    { name: 'Pattern Recognition', inputs: 28, outputs: 9 },
    { name: 'Optimization Strategy', inputs: 25, outputs: 5 },
    { name: 'Value Estimation', inputs: 19, outputs: 1 },
    { name: 'Security Analysis', inputs: 14, outputs: 1 },
    { name: 'Efficiency Optimization', inputs: 22, outputs: 3 },
    { name: 'Memory Optimization', inputs: 20, outputs: 4 }
  ]
};

// Security state (adaptive quantum security)
let securityState = {
  quantumSecurityLevel: 256,  // Starting level
  currentBitStrength: 256,
  maxBitStrength: 18432,  // Quantum resistance future
  encryptionStrength: 2048,
  adaptiveEnabled: true,
  threatLevel: 0.1,
  securityEvents: []
};

// Calculate adaptive bit strength (from whitepaper Section 4.4)
function calculateAdaptiveBitStrength(workType, difficulty, blockHeight) {
  const baseStrength = {
    [WORK_TYPES.PRIME_PATTERN]: 256,
    [WORK_TYPES.RIEMANN_ZERO]: 512,
    [WORK_TYPES.YANG_MILLS]: 384,
    [WORK_TYPES.GOLDBACH]: 320,
    [WORK_TYPES.NAVIER_STOKES]: 1024,
    [WORK_TYPES.BIRCH_SWINNERTON]: 768,
    [WORK_TYPES.ELLIPTIC_CURVE]: 448,
    [WORK_TYPES.LATTICE]: 2048,
    [WORK_TYPES.POINCARE]: 640
  };
  
  const base = baseStrength[workType] || 256;
  const complexityMultiplier = 1 + (difficulty / 50);
  const heightMultiplier = 1 + (blockHeight * 0.001);
  const adaptiveBitStrength = Math.min(
    base * complexityMultiplier * heightMultiplier,
    securityState.maxBitStrength
  );
  
  return Math.round(adaptiveBitStrength);
}

// Calculate research value (from tokenomics)
function calculateResearchValue(workType, difficulty, complexity) {
  const baseValues = {
    [WORK_TYPES.PRIME_PATTERN]: { min: 50, max: 200 },
    [WORK_TYPES.RIEMANN_ZERO]: { min: 100, max: 500 },
    [WORK_TYPES.YANG_MILLS]: { min: 200, max: 800 },
    [WORK_TYPES.GOLDBACH]: { min: 75, max: 300 },
    [WORK_TYPES.NAVIER_STOKES]: { min: 150, max: 600 },
    [WORK_TYPES.BIRCH_SWINNERTON]: { min: 125, max: 400 },
    [WORK_TYPES.ELLIPTIC_CURVE]: { min: 80, max: 320 },
    [WORK_TYPES.LATTICE]: { min: 90, max: 360 },
    [WORK_TYPES.POINCARE]: { min: 300, max: 1000 }
  };
  
  const range = baseValues[workType] || { min: 50, max: 200 };
  const value = range.min + (range.max - range.min) * (difficulty / 50);
  
  // Apply complexity multiplier
  const complexityMultipliers = {
    'Beginner': 1.0,
    'Intermediate': 2.5,
    'Advanced': 5.0,
    'Expert': 10.0
  };
  
  const multiplier = complexityMultipliers[complexity] || 1.0;
  return value * multiplier;
}

// Perform mathematical work (simplified from whitepaper)
function performMathematicalWork(workType, difficulty) {
  checkMemoryUsage();
  
  const bitStrength = calculateAdaptiveBitStrength(workType, difficulty, blockchainState.height);
  const researchValue = calculateResearchValue(workType, difficulty, 'Advanced');
  
  // Simulate mathematical computation
  const result = {
    success: true,
    workType: workType,
    difficulty: difficulty,
    bitStrengthGain: bitStrength - securityState.currentBitStrength,
    researchValue: researchValue,
    complexity: difficulty * 2,
    proof: crypto.createHash('sha256')
      .update(`${workType}-${difficulty}-${Date.now()}`)
      .digest('hex'),
    timestamp: Date.now()
  };
  
  // Update security state
  securityState.currentBitStrength = Math.max(securityState.currentBitStrength, bitStrength);
  
  return result;
}

// Validate block (PoS)
function validateBlock() {
  if (blockchainState.validators.size === 0) {
    return true; // Fallback for development
  }
  
  const totalStake = Array.from(blockchainState.validators.values())
    .reduce((sum, validator) => sum + validator.stake, 0);
  
  const randomValue = Math.random() * totalStake;
  let currentSum = 0;
  
  for (const [id, validator] of blockchainState.validators) {
    currentSum += validator.stake;
    if (randomValue <= currentSum) {
      validator.blocksValidated++;
      console.log(`✅ Block validated by ${id} (stake: ${validator.stake})`);
      return true;
    }
  }
  
  return false;
}

// Calculate token emission (asymptotic model)
function calculateEmission(blockHeight) {
  const E0 = tokenomicsState.emissionRate;
  const lambda = tokenomicsState.decayConstant;
  const alpha = tokenomicsState.researchMultiplier;
  const researchValue = blockchainState.discoveries.size * 10; // Simplified
  
  // E(t) = E₀ × e^(-λt) × (1 + α × ResearchValue(t))
  const emission = E0 * Math.exp(-lambda * blockHeight) * (1 + alpha * researchValue);
  
  return Math.max(emission, 1); // Minimum 1 token
}

// Calculate burn amount
function calculateBurn(workType, researchValue) {
  let burnRate = tokenomicsState.burnRates.standardResearch;
  
  // Millennium problems get higher burn rate
  if ([WORK_TYPES.RIEMANN_ZERO, WORK_TYPES.YANG_MILLS, 
       WORK_TYPES.BIRCH_SWINNERTON, WORK_TYPES.POINCARE].includes(workType)) {
    burnRate = tokenomicsState.burnRates.millenniumProblems;
  }
  
  return researchValue * burnRate;
}

// Create new block
async function createBlock(workType, difficulty) {
  if (!validateBlock()) {
    return { success: false, error: 'Validation failed' };
  }
  
  const mathWork = performMathematicalWork(workType, difficulty);
  
  if (!mathWork.success) {
    return { success: false, error: 'Mathematical work failed' };
  }
  
  const blockHeight = blockchainState.height + 1;
  const emission = calculateEmission(blockHeight);
  const burnAmount = calculateBurn(workType, mathWork.researchValue);
  
  const block = {
    height: blockHeight,
    hash: crypto.createHash('sha256')
      .update(`${blockHeight}-${workType}-${difficulty}-${Date.now()}`)
      .digest('hex'),
    previousHash: blockchainState.blocks.length > 0 
      ? blockchainState.blocks[blockchainState.blocks.length - 1].hash 
      : '0000000000000000000000000000000000000000000000000000000000000000',
    timestamp: Date.now(),
    workType: workType,
    difficulty: difficulty,
    miner: `0x${crypto.randomBytes(20).toString('hex')}`,
    validator: Array.from(blockchainState.validators.keys())[0],
    reward: emission,
    burned: burnAmount,
    bitStrength: securityState.currentBitStrength,
    quantumSecurityLevel: securityState.quantumSecurityLevel,
    researchValue: mathWork.researchValue,
    proof: mathWork.proof,
    transactions: [],
    nonce: Math.floor(Math.random() * 1000000),
    size: Math.floor(Math.random() * 1000) + 500,
    gasUsed: Math.floor(Math.random() * 100000) + 50000,
    gasLimit: 1000000
  };
  
  // Generate mock transactions for the block
  const numTransactions = Math.floor(Math.random() * 10) + 5; // 5-14 txs
  for (let i = 0; i < numTransactions; i++) {
    const tx = {
      hash: '0x' + crypto.randomBytes(32).toString('hex'),
      blockNumber: blockHeight,
      from: `0x${crypto.randomBytes(20).toString('hex')}`,
      to: `0x${crypto.randomBytes(20).toString('hex')}`,
      value: Math.floor(Math.random() * 1000000) + 1,
      gas: Math.floor(Math.random() * 90000) + 21000,
      gasPrice: 20000000000,
      gasUsed: Math.floor(Math.random() * 90000) + 21000,
      status: Math.random() > 0.02 ? 'success' : 'failed',
      timestamp: Math.floor(block.timestamp / 1000),
      nonce: Math.floor(Math.random() * 10),
      input: '0x',
      contractAddress: null
    };
    block.transactions.push(tx);
  }
  
  // Update blockchain state
  blockchainState.blocks.push(block);
  blockchainState.height = blockHeight;
  blockchainState.lastBlockTime = Date.now();
  
  // Update tokenomics
  tokenomicsState.totalBurned += burnAmount;
  tokenomicsState.miningRewards -= emission;
  
  // Create discovery record
  const discovery = {
    id: `disc-${blockHeight}-${crypto.randomBytes(8).toString('hex')}`,
    workType: workType,
    problemStatement: `Mathematical computation for ${workType}`,
    solution: mathWork.proof,
    proof: mathWork.proof,
    complexity: getComplexityForWorkType(workType),
    significance: getSignificanceForWorkType(workType),
    applications: getApplicationsForWorkType(workType),
    discoveredBy: block.miner,
    blockHeight: blockHeight,
    timestamp: Date.now(),
    verificationStatus: 'verified',
    verificationScore: 0.99,
    impactScore: mathWork.researchValue / 10,
    researchValue: mathWork.researchValue
  };
  
  blockchainState.discoveries.set(discovery.id, discovery);
  blockchainState.discoveryCounter++;
  
  // Save to file
  saveBlockchainState();
  
  console.log(`⛏️ Block ${blockHeight} mined! Work: ${workType}, Reward: ${emission.toFixed(2)}, Burned: ${burnAmount.toFixed(2)}`);
  console.log(`🔒 Bit Strength: ${securityState.currentBitStrength} bits`);
  
  return { success: true, block, discovery };
}

// Helper functions
function getComplexityForWorkType(workType) {
  const complexities = {
    [WORK_TYPES.PRIME_PATTERN]: 'Extreme',
    [WORK_TYPES.RIEMANN_ZERO]: 'Ultra-Extreme',
    [WORK_TYPES.YANG_MILLS]: 'Ultra-Extreme',
    [WORK_TYPES.GOLDBACH]: 'Extreme',
    [WORK_TYPES.NAVIER_STOKES]: 'Very High',
    [WORK_TYPES.BIRCH_SWINNERTON]: 'Ultra-Extreme',
    [WORK_TYPES.ELLIPTIC_CURVE]: 'High',
    [WORK_TYPES.LATTICE]: 'Very High',
    [WORK_TYPES.POINCARE]: 'Ultra-Extreme'
  };
  return complexities[workType] || 'High';
}

function getSignificanceForWorkType(workType) {
  const significances = {
    [WORK_TYPES.PRIME_PATTERN]: 'Cryptography & Number Theory',
    [WORK_TYPES.RIEMANN_ZERO]: 'Millennium Problem',
    [WORK_TYPES.YANG_MILLS]: 'Millennium Problem',
    [WORK_TYPES.GOLDBACH]: 'Number Theory',
    [WORK_TYPES.NAVIER_STOKES]: 'Physics & Engineering',
    [WORK_TYPES.BIRCH_SWINNERTON]: 'Millennium Problem',
    [WORK_TYPES.ELLIPTIC_CURVE]: 'Cybersecurity',
    [WORK_TYPES.LATTICE]: 'Post-Quantum Security',
    [WORK_TYPES.POINCARE]: 'Millennium Problem (Solved)'
  };
  return significances[workType] || 'Mathematical Research';
}

function getApplicationsForWorkType(workType) {
  const applications = {
    [WORK_TYPES.PRIME_PATTERN]: ['Cryptography', 'Cybersecurity', 'Number Theory'],
    [WORK_TYPES.RIEMANN_ZERO]: ['Prime Number Theory', 'Cryptography', 'Mathematical Physics'],
    [WORK_TYPES.YANG_MILLS]: ['Particle Physics', 'Quantum Computing', 'Mathematical Physics'],
    [WORK_TYPES.GOLDBACH]: ['Number Theory', 'Cryptography', 'Mathematical Logic'],
    [WORK_TYPES.NAVIER_STOKES]: ['Weather Prediction', 'Aerospace Engineering', 'Climate Modeling'],
    [WORK_TYPES.BIRCH_SWINNERTON]: ['Elliptic Curve Cryptography', 'Number Theory', 'Algebraic Geometry'],
    [WORK_TYPES.ELLIPTIC_CURVE]: ['Cybersecurity', 'Digital Signatures', 'Key Exchange'],
    [WORK_TYPES.LATTICE]: ['Post-Quantum Cryptography', 'Secure Communications', 'Digital Signatures'],
    [WORK_TYPES.POINCARE]: ['Topology', 'Geometric Analysis', 'Mathematical Physics']
  };
  return applications[workType] || ['Mathematical Research', 'Scientific Computing'];
}

// File persistence
function saveBlockchainState() {
  try {
    const data = {
      height: blockchainState.height,
      blocks: blockchainState.blocks,
      discoveries: Array.from(blockchainState.discoveries.entries()),
      solutionSets: Array.from(blockchainState.solutionSets.entries()),
      tokenomics: {
        totalBurned: tokenomicsState.totalBurned,
        miningRewards: tokenomicsState.miningRewards
      },
      security: {
        currentBitStrength: securityState.currentBitStrength,
        quantumSecurityLevel: securityState.quantumSecurityLevel
      }
    };
    
    fs.writeFileSync('blockchain-data.json', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving blockchain state:', error);
  }
}

function loadBlockchainState() {
  try {
    if (fs.existsSync('blockchain-data.json')) {
      const data = JSON.parse(fs.readFileSync('blockchain-data.json', 'utf8'));
      blockchainState.height = data.height || 0;
      blockchainState.blocks = data.blocks || [];
      blockchainState.discoveries = new Map(data.discoveries || []);
      blockchainState.solutionSets = new Map(data.solutionSets || []);
      
      if (data.tokenomics) {
        tokenomicsState.totalBurned = data.tokenomics.totalBurned || 0;
        tokenomicsState.miningRewards = data.tokenomics.miningRewards || 100_000_000;
      }
      
      if (data.security) {
        securityState.currentBitStrength = data.security.currentBitStrength || 256;
        securityState.quantumSecurityLevel = data.security.quantumSecurityLevel || 256;
      }
      
      console.log(`📦 Loaded blockchain state: Block ${blockchainState.height}`);
    }
  } catch (error) {
    console.error('Error loading blockchain state:', error);
  }
}

// Initialize blockchain
function initializeBlockchain() {
  console.log('🔗 Initializing ProductiveMiner Blockchain');
  console.log('📄 Mathematical Discovery-Backed Finance');
  
  loadBlockchainState();
  initializeValidators();
  
  console.log(`✅ Blockchain initialized with height: ${blockchainState.height}`);
  console.log(`💰 Total Supply: ${tokenomicsState.totalSupply.toLocaleString()} MINED`);
  console.log(`🔥 Total Burned: ${tokenomicsState.totalBurned.toFixed(2)} MINED`);
  console.log(`🔒 Current Bit Strength: ${securityState.currentBitStrength} bits`);
  console.log(`🧮 Mathematical Engines: 9 active`);
}

// Unified Data Flow System
class ProductiveMinerFlow {
  constructor() {
    this.miningQueue = [];
    this.researchQueue = [];
    this.mlOptimizations = new Map();
    this.feedbackLoop = {
      miningEfficiency: 1.0,
      validationSpeed: 1.0,
      researchValue: 1.0,
      mlAccuracy: 1.0
    };
    this.cycleCount = 0;
  }

  // Main flow: Mining → Validation → Research → ML → Optimization → Back to Mining
  async processMiningCycle(workType, difficulty) {
    this.cycleCount++;
    console.log(`🔄 Starting Mining Cycle #${this.cycleCount}`);
    
    try {
      // Step 1: PoW Mathematical Mining
      const miningResult = await this.performMathematicalMining(workType, difficulty);
      
      // Step 2: PoS Computation Validation
      const validationResult = await this.validateComputation(miningResult);
      
      // Step 3: Add to Blockchain
      const blockResult = await this.addToBlockchain(validationResult);
      
      // Step 4: Research Repository & PoR Layer
      const researchResult = await this.processResearchDiscovery(blockResult);
      
      // Step 5: Adaptive ML Model
      const mlResult = await this.updateMLModel(researchResult);
      
      // Step 6: Algorithm & Security Optimizations
      const optimizationResult = await this.applyOptimizations(mlResult);
      
      // Step 7: Feedback Loop - Update mining parameters
      await this.updateMiningParameters(optimizationResult);
      
      console.log(`✅ Mining Cycle #${this.cycleCount} completed successfully`);
      return {
        cycleId: this.cycleCount,
        mining: miningResult,
        validation: validationResult,
        blockchain: blockResult,
        research: researchResult,
        ml: mlResult,
        optimization: optimizationResult
      };
      
    } catch (error) {
      console.error(`❌ Mining Cycle #${this.cycleCount} failed:`, error);
      throw error;
    }
  }

  async performMathematicalMining(workType, difficulty) {
    console.log(`⛏️ Performing mathematical mining: ${workType} (difficulty: ${difficulty})`);
    
    const mathWork = performMathematicalWork(workType, difficulty);
    const adaptiveDifficulty = this.calculateAdaptiveDifficulty(difficulty);
    
    return {
      workType,
      difficulty: adaptiveDifficulty,
      result: mathWork,
      efficiency: this.feedbackLoop.miningEfficiency,
      timestamp: Date.now()
    };
  }

  async validateComputation(miningResult) {
    console.log(`🔍 Validating computation with PoS`);
    
    const validationSuccess = validateBlock();
    const validationSpeed = this.feedbackLoop.validationSpeed;
    
    return {
      miningResult,
      validated: validationSuccess,
      speed: validationSpeed,
      timestamp: Date.now()
    };
  }

  async addToBlockchain(validationResult) {
    console.log(`🔗 Adding to blockchain`);
    
    const block = await createBlock(
      validationResult.miningResult.workType, 
      validationResult.miningResult.difficulty
    );
    
    return {
      validationResult,
      block: block.block,
      discovery: block.discovery,
      timestamp: Date.now()
    };
  }

  async processResearchDiscovery(blockResult) {
    console.log(`📚 Processing research discovery`);
    
    const discovery = blockResult.discovery;
    const researchValue = this.calculateResearchValue(discovery);
    
    // Add to research repository
    blockchainState.discoveries.set(discovery.id, {
      ...discovery,
      researchValue,
      processedAt: Date.now()
    });
    
    return {
      blockResult,
      discovery,
      researchValue,
      repositorySize: blockchainState.discoveries.size,
      timestamp: Date.now()
    };
  }

  async updateMLModel(researchResult) {
    console.log(`🤖 Updating ML model`);
    
    const discovery = researchResult.discovery;
    const modelUpdate = this.trainMLModel(discovery);
    
    // Update learning state
    learningState.adaptationCount++;
    learningState.trainingCycles++;
    
    return {
      researchResult,
      modelUpdate,
      adaptationCount: learningState.adaptationCount,
      trainingCycles: learningState.trainingCycles,
      timestamp: Date.now()
    };
  }

  async applyOptimizations(mlResult) {
    console.log(`⚡ Applying optimizations`);
    
    const optimizations = this.calculateOptimizations(mlResult);
    
    // Update feedback loop parameters
    this.feedbackLoop.miningEfficiency *= optimizations.miningEfficiency;
    this.feedbackLoop.validationSpeed *= optimizations.validationSpeed;
    this.feedbackLoop.researchValue *= optimizations.researchValue;
    this.feedbackLoop.mlAccuracy *= optimizations.mlAccuracy;
    
    return {
      mlResult,
      optimizations,
      feedbackLoop: this.feedbackLoop,
      timestamp: Date.now()
    };
  }

  async updateMiningParameters(optimizationResult) {
    console.log(`🔄 Updating mining parameters for next cycle`);
    
    // Update blockchain difficulty based on optimizations
    const newDifficulty = Math.max(1, Math.min(50, 
      blockchainState.difficulty * optimizationResult.optimizations.miningEfficiency
    ));
    
    blockchainState.difficulty = newDifficulty;
    
    // Update security parameters
    securityState.currentBitStrength = Math.min(
      securityState.maxBitStrength,
      securityState.currentBitStrength * optimizationResult.optimizations.mlAccuracy
    );
    
    console.log(`📊 Updated parameters - Difficulty: ${newDifficulty}, Bit Strength: ${securityState.currentBitStrength}`);
  }

  calculateAdaptiveDifficulty(baseDifficulty) {
    const efficiency = this.feedbackLoop.miningEfficiency;
    return Math.max(1, Math.min(50, baseDifficulty * efficiency));
  }

  calculateResearchValue(discovery) {
    const baseValue = discovery.researchValue || 100;
    const researchMultiplier = this.feedbackLoop.researchValue;
    return baseValue * researchMultiplier;
  }

  trainMLModel(discovery) {
    const modelUpdate = {
      discoveryType: discovery.workType,
      complexity: discovery.complexity,
      accuracy: this.feedbackLoop.mlAccuracy,
      trainingData: {
        workType: discovery.workType,
        difficulty: discovery.blockHeight,
        researchValue: discovery.researchValue
      }
    };
    
    return modelUpdate;
  }

  calculateOptimizations(mlResult) {
    const { adaptationCount, trainingCycles } = mlResult;
    
    return {
      miningEfficiency: 1.0 + (adaptationCount * 0.01),
      validationSpeed: 1.0 + (trainingCycles * 0.005),
      researchValue: 1.0 + (adaptationCount * 0.02),
      mlAccuracy: 1.0 + (trainingCycles * 0.01)
    };
  }

  // Get system status with feedback loop data
  getSystemStatus() {
    return {
      cycleCount: this.cycleCount,
      feedbackLoop: this.feedbackLoop,
      blockchain: {
        height: blockchainState.height,
        difficulty: blockchainState.difficulty,
        discoveries: blockchainState.discoveries.size
      },
      ml: {
        adaptationCount: learningState.adaptationCount,
        trainingCycles: learningState.trainingCycles,
        models: learningState.neuralNetworks.length
      },
      security: {
        currentBitStrength: securityState.currentBitStrength,
        quantumSecurityLevel: securityState.quantumSecurityLevel
      }
    };
  }
}

// Initialize the unified flow system
const productiveMinerFlow = new ProductiveMinerFlow();

// Create Express app
const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Initialize blockchain
initializeBlockchain();

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'", "ws:", "wss:"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(cors({
  origin: ['http://localhost:3002', 'http://localhost:3000', 'http://localhost:80', 'http://localhost'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// API Routes

// Test endpoint for debugging
app.get('/api/test', (req, res) => {
  console.log('🔍 Test endpoint called from:', req.headers.origin);
  res.json({
    message: 'Blockchain API is accessible',
    timestamp: new Date().toISOString(),
    origin: req.headers.origin
  });
});

// Unified System Status
app.get('/api/status', (req, res) => {
  const systemStatus = productiveMinerFlow.getSystemStatus();
  
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.1',
    service: 'ProductiveMiner',
    system: systemStatus,
    flow: {
      cycleCount: systemStatus.cycleCount,
      feedbackLoop: systemStatus.feedbackLoop,
      efficiency: systemStatus.feedbackLoop.miningEfficiency
    }
  });
});

// System Flow Status
app.get('/api/flow', (req, res) => {
  const systemStatus = productiveMinerFlow.getSystemStatus();
  
  res.json({
    flow: {
      cycleCount: systemStatus.cycleCount,
      feedbackLoop: systemStatus.feedbackLoop,
      efficiency: systemStatus.feedbackLoop.miningEfficiency,
      validationSpeed: systemStatus.feedbackLoop.validationSpeed,
      researchValue: systemStatus.feedbackLoop.researchValue,
      mlAccuracy: systemStatus.feedbackLoop.mlAccuracy
    },
    blockchain: {
      height: systemStatus.blockchain.height,
      difficulty: systemStatus.blockchain.difficulty,
      discoveries: systemStatus.blockchain.discoveries
    },
    ml: {
      adaptationCount: systemStatus.ml.adaptationCount,
      trainingCycles: systemStatus.ml.trainingCycles,
      models: systemStatus.ml.models
    },
    security: {
      currentBitStrength: systemStatus.security.currentBitStrength,
      quantumSecurityLevel: systemStatus.security.quantumSecurityLevel
    }
  });
});

// Get blocks
app.get('/api/blocks', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  
  // Return latest blocks first
  const reversed = blockchainState.blocks.slice().reverse();
  const blocks = reversed.slice(startIndex, endIndex);
  
  res.json({
    blocks: blocks,
    pagination: {
      page: page,
      limit: limit,
      total: blockchainState.blocks.length,
      pages: Math.ceil(blockchainState.blocks.length / limit)
    }
  });
});

// Get discoveries
app.get('/api/discoveries', (req, res) => {
  const discoveries = Array.from(blockchainState.discoveries.values());
  const totalValue = discoveries.reduce((sum, d) => sum + d.researchValue, 0);
  
  res.json({
    discoveries: discoveries,
    totalDiscoveries: discoveries.length,
    totalResearchValue: totalValue,
    averageValue: discoveries.length > 0 ? totalValue / discoveries.length : 0
  });
});

// Mine block
app.post('/api/mine', async (req, res) => {
  try {
    const { workType, difficulty } = req.body;
    
    if (!workType || !difficulty) {
      return res.status(400).json({ error: 'Work type and difficulty required' });
    }
    
    if (!Object.values(WORK_TYPES).includes(workType)) {
      return res.status(400).json({ error: 'Invalid work type' });
    }
    
    if (difficulty < 1 || difficulty > 50) {
      return res.status(400).json({ error: 'Difficulty must be between 1 and 50' });
    }
    
    const result = await productiveMinerFlow.processMiningCycle(workType, difficulty);
    
    if (result.blockchain && result.blockchain.block) {
      // Update user rewards
      userRewards.MINED += result.blockchain.block.reward - result.blockchain.block.burned;
      userRewards.totalMined += result.blockchain.block.reward;
      userRewards.miningHistory.push({
        id: Date.now(),
        amount: result.blockchain.block.reward,
        burned: result.blockchain.block.burned,
        timestamp: new Date().toISOString(),
        workType: workType,
        blockHeight: result.blockchain.block.height
      });
      
      // Emit to WebSocket clients
      io.emit('newBlock', result.blockchain.block);
      io.emit('newDiscovery', result.blockchain.discovery);
      
      res.json({
        success: true,
        block: result.blockchain.block,
        discovery: result.blockchain.discovery,
        reward: result.blockchain.block.reward,
        burned: result.blockchain.block.burned,
        newBalance: userRewards.MINED
      });
    } else {
      res.status(500).json({ error: 'Mining failed - no block created' });
    }
  } catch (error) {
    console.error('Mining error:', error);
    res.status(500).json({ error: 'Mining failed' });
  }
});

// Get validators
app.get('/api/validators', (req, res) => {
  const validators = Array.from(blockchainState.validators.entries()).map(([id, data]) => ({
    id,
    ...data,
    votingPower: (data.stake / blockchainState.totalStake * 100).toFixed(2) + '%'
  }));
  
  res.json({
    validators: validators,
    totalValidators: validators.length,
    totalStake: blockchainState.totalStake
  });
});

// Get user balance
app.get('/api/balance', (req, res) => {
  res.json({
    MINED: userRewards.MINED,
    totalMined: userRewards.totalMined,
    totalStaked: userRewards.totalStaked,
    stakingRewards: userRewards.stakingRewards,
    miningHistory: userRewards.miningHistory.slice(-10)
  });
});

// Get network stats
app.get('/api/network-stats', (req, res) => {
  const discoveries = Array.from(blockchainState.discoveries.values());
  const totalResearchValue = discoveries.reduce((sum, d) => sum + d.researchValue, 0);
  const totalTransactions = blockchainState.blocks.reduce((sum, b) => sum + (b.transactions?.length || 0), 0);
  
  res.json({
    ...blockchainState.networkStats,
    blockHeight: blockchainState.height,
    totalTransactions: totalTransactions,
    totalDiscoveries: discoveries.length,
    totalResearchValue: totalResearchValue,
    currentBitStrength: securityState.currentBitStrength,
    quantumSecurityLevel: securityState.quantumSecurityLevel,
    mlModelsActive: learningState.neuralNetworks.length,
    validatorsActive: blockchainState.validators.size
  });
});

// Get latest transactions (flattened)
app.get('/api/transactions', (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const transactions = [];
  
  for (let i = blockchainState.blocks.length - 1; i >= 0 && transactions.length < limit; i--) {
    const block = blockchainState.blocks[i];
    const txs = (block.transactions || []).map(tx => ({
      ...tx,
      blockNumber: block.height,
      timestamp: Math.floor(block.timestamp / 1000)
    }));
    transactions.push(...txs);
  }
  
  res.json({
    transactions: transactions.slice(0, limit),
    total: transactions.length
  });
});

// Get research repository
app.get('/api/research-repository', (req, res) => {
  const discoveries = Array.from(blockchainState.discoveries.values());
  const solutionSets = Array.from(blockchainState.solutionSets.values());
  
  // Group discoveries by work type
  const groupedDiscoveries = {};
  Object.values(WORK_TYPES).forEach(workType => {
    groupedDiscoveries[workType] = discoveries.filter(d => d.workType === workType);
  });
  
  res.json({
    discoveries: discoveries,
    solutionSets: solutionSets,
    groupedDiscoveries: groupedDiscoveries,
    totalDiscoveries: discoveries.length,
    totalSolutionSets: solutionSets.length,
    workTypes: Object.values(WORK_TYPES)
  });
});

// Ethereum RPC endpoints
app.post('/', async (req, res) => {
  const { jsonrpc, method, params, id } = req.body;
  
  if (jsonrpc !== '2.0') {
    return res.json({ jsonrpc: '2.0', error: { code: -32600, message: 'Invalid Request' }, id });
  }
  
  try {
    let result;
    
    switch (method) {
      case 'eth_blockNumber':
        result = `0x${blockchainState.height.toString(16)}`;
        break;
        
      case 'eth_getBlockByNumber':
        const blockNumber = params[0];
        const blockIndex = blockNumber === 'latest' ? blockchainState.blocks.length - 1 : parseInt(blockNumber, 16);
        result = blockchainState.blocks[blockIndex] || null;
        break;
        
      case 'eth_getBalance':
        result = '0x1000000000000000000'; // 1 ETH
        break;
        
      case 'eth_sendRawTransaction':
        result = '0x' + crypto.randomBytes(32).toString('hex');
        break;
        
      case 'eth_getTransactionCount':
        result = '0x0';
        break;
        
      case 'eth_estimateGas':
        result = '0x5208'; // 21000 gas
        break;
        
      case 'eth_gasPrice':
        result = '0x3b9aca00'; // 1 gwei
        break;
        
      case 'net_version':
        result = blockchainState.networkStats.totalNodes.toString();
        break;
        
      case 'eth_chainId':
        result = '0x1337'; // Chain ID 1337
        break;
        
      default:
        return res.json({ 
          jsonrpc: '2.0', 
          error: { code: -32601, message: 'Method not found' }, 
          id 
        });
    }
    
    res.json({ jsonrpc: '2.0', result, id });
  } catch (error) {
    console.error('RPC error:', error);
    res.json({ 
      jsonrpc: '2.0', 
      error: { code: -32603, message: 'Internal error' }, 
      id 
    });
  }
});

// WebSocket connections
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);
  
  // Send current blockchain state
  socket.emit('blockchainState', {
    height: blockchainState.height,
    lastBlock: blockchainState.blocks[blockchainState.blocks.length - 1] || null,
    discoveries: blockchainState.discoveries.size,
    validators: blockchainState.validators.size
  });
  
  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });
});

// Auto-mining for demo (every 30 seconds)
setInterval(async () => {
  if (blockchainState.height < 100) { // Limit for demo
    const workTypes = Object.values(WORK_TYPES);
    const randomWorkType = workTypes[Math.floor(Math.random() * workTypes.length)];
    const randomDifficulty = Math.floor(Math.random() * 20) + 1;
    
    try {
      await productiveMinerFlow.processMiningCycle(randomWorkType, randomDifficulty);
    } catch (error) {
      console.error('Auto-mining error:', error);
    }
  }
}, 30000);

// Start server
const PORT = process.env.PORT || 8545;
server.listen(PORT, () => {
  console.log(`🚀 ProductiveMiner Blockchain Node running on port ${PORT}`);
  console.log(`🔗 WebSocket server ready for real-time updates`);
  console.log(`⛏️ Auto-mining enabled (every 30 seconds)`);
});
