// Minimal ABI for basic token contract interactions
export const MINIMAL_ABI = [
  // Basic ERC20 functions
  {
    "constant": true,
    "inputs": [],
    "name": "name",
    "outputs": [{"name": "", "type": "string"}],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "symbol",
    "outputs": [{"name": "", "type": "string"}],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "decimals",
    "outputs": [{"name": "", "type": "uint8"}],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "totalSupply",
    "outputs": [{"name": "", "type": "uint256"}],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [{"name": "_owner", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"name": "balance", "type": "uint256"}],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  // Mining functions
  {
    "constant": false,
    "inputs": [
      {"name": "workType", "type": "uint8"},
      {"name": "difficulty", "type": "uint16"}
    ],
    "name": "startMiningSession",
    "outputs": [{"name": "", "type": "uint32"}],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {"name": "sessionId", "type": "uint32"},
      {"name": "nonce", "type": "uint32"},
      {"name": "hash", "type": "uint128"},
      {"name": "complexity", "type": "uint16"},
      {"name": "significance", "type": "uint8"}
    ],
    "name": "submitPoWResult",
    "outputs": [{"name": "", "type": "uint32"}],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // State functions
  {
    "constant": true,
    "inputs": [],
    "name": "state",
    "outputs": [
      {"name": "totalBurned", "type": "uint128"},
      {"name": "totalResearchValue", "type": "uint128"},
      {"name": "lastEmissionBlock", "type": "uint64"},
      {"name": "totalValidators", "type": "uint32"},
      {"name": "nextDiscoveryId", "type": "uint32"}
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  // Staking functions
  {
    "constant": true,
    "inputs": [],
    "name": "stakingPoolBalance",
    "outputs": [{"name": "", "type": "uint256"}],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "totalStaked",
    "outputs": [{"name": "", "type": "uint256"}],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "validatorRewardPool",
    "outputs": [{"name": "", "type": "uint256"}],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  // Validator functions
  {
    "constant": true,
    "inputs": [{"name": "validator", "type": "address"}],
    "name": "validators",
    "outputs": [
      {"name": "stakedAmount", "type": "uint128"},
      {"name": "totalValidations", "type": "uint64"},
      {"name": "reputation", "type": "uint32"},
      {"name": "registrationTime", "type": "uint32"},
      {"name": "isActive", "type": "bool"}
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  // Work type functions
  {
    "constant": true,
    "inputs": [{"name": "workType", "type": "uint8"}],
    "name": "workTypes",
    "outputs": [
      {"name": "difficultyMultiplier", "type": "uint16"},
      {"name": "baseReward", "type": "uint16"},
      {"name": "isActive", "type": "bool"}
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  // Mining session functions
  {
    "constant": true,
    "inputs": [{"name": "sessionId", "type": "uint32"}],
    "name": "miningSessions",
    "outputs": [
      {"name": "targetHash", "type": "uint128"},
      {"name": "difficulty", "type": "uint16"},
      {"name": "workType", "type": "uint8"},
      {"name": "startTime", "type": "uint64"},
      {"name": "endTime", "type": "uint64"},
      {"name": "nonce", "type": "uint32"},
      {"name": "miner", "type": "address"},
      {"name": "isCompleted", "type": "bool"}
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "nextSessionId",
    "outputs": [{"name": "", "type": "uint32"}],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  // State functions
  {
    "constant": true,
    "inputs": [],
    "name": "state",
    "outputs": [
      {"name": "totalBurned", "type": "uint128"},
      {"name": "lastEmissionBlock", "type": "uint64"},
      {"name": "totalValidators", "type": "uint32"},
      {"name": "nextDiscoveryId", "type": "uint32"},
      {"name": "totalResearchValue", "type": "uint128"}
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "nextPowResultId",
    "outputs": [{"name": "", "type": "uint32"}],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  // Contract transaction functions
  {
    "constant": false,
    "inputs": [
      {"name": "workType", "type": "uint8"},
      {"name": "difficulty", "type": "uint16"}
    ],
    "name": "startMiningSession",
    "outputs": [{"name": "", "type": "uint32"}],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {"name": "sessionId", "type": "uint32"},
      {"name": "nonce", "type": "uint32"},
      {"name": "hash", "type": "uint128"},
      {"name": "complexity", "type": "uint16"},
      {"name": "significance", "type": "uint8"}
    ],
    "name": "submitPoWResult",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // PoW Result functions
  {
    "constant": true,
    "inputs": [{"name": "resultId", "type": "uint32"}],
    "name": "powResults",
    "outputs": [
      {"name": "sessionId", "type": "uint32"},
      {"name": "hash", "type": "uint128"},
      {"name": "complexity", "type": "uint16"},
      {"name": "significance", "type": "uint8"},
      {"name": "isValid", "type": "bool"}
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  // Discovery functions
  {
    "constant": true,
    "inputs": [{"name": "discoveryId", "type": "uint32"}],
    "name": "discoveries",
    "outputs": [
      {"name": "researcher", "type": "address"},
      {"name": "workType", "type": "uint8"},
      {"name": "complexity", "type": "uint16"},
      {"name": "significance", "type": "uint8"},
      {"name": "researchValue", "type": "uint256"},
      {"name": "submissionTime", "type": "uint32"},
      {"name": "validationCount", "type": "uint32"},
      {"name": "isValidated", "type": "bool"},
      {"name": "isCollaborative", "type": "bool"},
      {"name": "isFromPoW", "type": "bool"}
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  // Events
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "sessionId", "type": "uint32"},
      {"indexed": true, "name": "miner", "type": "address"},
      {"indexed": false, "name": "workType", "type": "uint8"},
      {"indexed": false, "name": "difficulty", "type": "uint16"}
    ],
    "name": "MiningSessionStarted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "sessionId", "type": "uint32"},
      {"indexed": true, "name": "miner", "type": "address"},
      {"indexed": false, "name": "nonce", "type": "uint32"},
      {"indexed": false, "name": "hash", "type": "uint128"}
    ],
    "name": "MiningSessionCompleted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "resultId", "type": "uint32"},
      {"indexed": true, "name": "sessionId", "type": "uint32"},
      {"indexed": true, "name": "miner", "type": "address"},
      {"indexed": false, "name": "hash", "type": "uint128"}
    ],
    "name": "PoWResultSubmitted",
    "type": "event"
  }
];
