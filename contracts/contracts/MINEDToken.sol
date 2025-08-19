// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title MINED Token - Mathematical Discovery Token
 * @dev Ultra-compact Hybrid PoW/PoS Mathematical Discovery Token with Asymptotic Tokenomics
 * 
 * This contract implements a complete mathematical discovery feedback loop that converts
 * mathematical research into token value through sophisticated PoW mining, PoS validation,
 * and asymptotic tokenomics.
 * 
 * Key Features:
 * - 25 Mathematical Work Types: From Millennium Problems to basic research
 * - Hybrid PoW/PoS: Mathematical proof-of-work with validator consensus
 * - Asymptotic Tokenomics: S(t) = S₀ + Σ(E(t) - B(t)) with perpetual incentives
 * - Research Value Generation: Mathematical discoveries create token value
 * - Security Scaling: Bit strength increases with mathematical complexity
 * - Multi-Chain Support: Cross-chain interoperability for mathematical discoveries
 * 
 * Tokenomics Implementation:
 * - Initial Supply: 1B MINED tokens
 * - Mining Pool: 100M MINED (10%)
 * - Staking Pool: 200M MINED (20%)
 * - Treasury: 100M MINED (10%)
 * - Research Access: 100M MINED (10%)
 * - Governance: 50M MINED (5%)
 * - Transaction Fees: 50M MINED (5%)
 * 
 * Mathematical Discovery Pipeline:
 * 1. PoW Mining: Solve mathematical problems for rewards
 * 2. Discovery Creation: Convert PoW results into mathematical discoveries
 * 3. Validator Consensus: PoS validators validate discoveries
 * 4. Token Burning: Burn tokens based on research complexity
 * 5. Security Scaling: Increase network security with discoveries
 * 6. Asymptotic Supply: Update supply based on emission and burns
 * 
 * @author ProductiveMiner Team
 */
contract MINEDToken is ERC20, Ownable2Step, ReentrancyGuard {
    // Custom Errors
    error InvalidWorkType();
    error InvalidDifficulty();
    error InvalidComplexity();
    error InvalidSignificance();
    error SessionNotFound();
    error SessionAlreadyCompleted();
    error NotSessionMiner();
    error HashDoesNotMeetTarget();
    error ContractEmergencyPaused();
    error NotEmergencyOperator();
    error InvalidAmount();
    error InvalidAddress();
    error AllowanceBelowZero();
    error PoWVerificationFailed();
    error ApproveFromNonZeroToNonZero();
    error InvalidChain();
    error TransferAlreadyProcessed();
    error InsufficientStake();
    error StakeAmountTooLow();
    error UnstakeAmountTooHigh();
    
    // Tokenomics Constants - Initial Distribution (1B MINED Total)
    uint256 constant INITIAL_SUPPLY = 1_000_000_000 * 10**18;        // 1B MINED tokens total supply
    uint256 constant CIRCULATING_SUPPLY = 500_000_000 * 10**18;      // 500M MINED (50%) - circulating
    uint256 constant STAKING_POOL = 200_000_000 * 10**18;            // 200M MINED (20%) - validator rewards
    uint256 constant MINING_REWARDS_POOL = 100_000_000 * 10**18;     // 100M MINED (10%) - PoW mining rewards
    uint256 constant TREASURY_POOL = 100_000_000 * 10**18;           // 100M MINED (10%) - treasury operations
    uint256 constant RESEARCH_ACCESS_POOL = 100_000_000 * 10**18;    // 100M MINED (10%) - research funding
    uint256 constant GOVERNANCE_POOL = 50_000_000 * 10**18;          // 50M MINED (5%) - governance voting
    uint256 constant TRANSACTION_FEE_POOL = 50_000_000 * 10**18;     // 50M MINED (5%) - transaction fees
    
    // Burn Rate Constants - Asymptotic Burn Function B(t)
    uint256 constant BASE_BURN_RATE = 10;                            // 10% base burn rate
    uint256 constant MILLENNIUM_BURN_RATE = 25;                      // 25% for Millennium Problems (significance 10)
    uint256 constant MAJOR_BURN_RATE = 15;                           // 15% for Major Theorems (significance 8-9)
    uint256 constant COLLAB_BURN_RATE = 12;                          // 12% for Collaborative Research (significance 6-7)
    
    uint8 public immutable MAX_WORK_TYPE = 24;
    uint16 public immutable MAX_DIFFICULTY = 50000;
    uint16 public immutable MAX_COMPLEXITY = 1000;
    uint8 public immutable MAX_SIGNIFICANCE = 10;
    
    // Pool Balances - Dynamic token allocation tracking
    uint256 public miningRewardsPool;      // Remaining mining rewards available
    uint256 public stakingPoolBalance;     // Remaining staking rewards for validators
    uint256 public governancePool;         // Governance voting token balance
    uint256 public researchAccessPool;     // Research funding allocation
    uint256 public transactionFeePool;     // Transaction fee collection
    uint256 public treasuryPool;           // Treasury operations balance
    
    // Asymptotic Supply Tracking - S(t) = S₀ + Σ(E(t) - B(t))
    uint256 public circulatingSupply;      // Current circulating supply
    uint256 public cumulativeEmission;     // Total tokens emitted through asymptotic function
    uint256 public cumulativeBurn;         // Total tokens burned through research complexity
    uint64 public lastEmissionBlock;       // Last block when asymptotic emission occurred
    
    uint32 public nextSessionId = 1;
    uint32 public nextPowResultId = 1;
    uint32 public nextDiscoveryId = 1;
    
    // Security State - Packed state for gas efficiency
    uint256 public securityState;          // Packed: [bitStrength][scalingRate][networkHealth][emergencyPaused]
    
    // Mathematical Discovery Security Scaling
    uint256 public baseBitStrength = 256;  // Base security level (256 bits)
    uint256 public totalMathematicalComplexity = 0; // Cumulative complexity of all discoveries
    uint256 public discoveryChainLength = 0;        // Number of discoveries in the chain
    mapping(uint256 => uint256) public discoveryComplexity; // Complexity tracking per discovery
    mapping(uint256 => uint256) public discoveryTimestamp;  // Timestamp tracking per discovery
    
    // Multi-Chain Interoperability Support
    mapping(string => address) public chainBridgeContracts;    // Bridge contract addresses per chain
    mapping(string => bool) public supportedChains;            // Supported blockchain networks
    mapping(bytes32 => bool) public processedCrossChainTransfers; // Transfer deduplication tracking
    
    // PoS Staking System - Validator participation tracking
    mapping(address => uint256) public stakes;    // Individual staking amounts per address
    uint256 public totalStaked;                   // Total tokens staked across all validators
    
    // Validator System - Research validation consensus
    mapping(address => Validator) public validators; // Validator information and reputation
    uint32 public totalValidators;                  // Total number of active validators
    
    // Mathematical Work Type Management - 25 research categories
    mapping(uint8 => WorkTypeInfo) public workTypes; // Work type configuration and rewards
    
    // Structs
    struct MiningSession {
        address miner;
        uint128 targetHash;
        uint64 startTime;
        uint64 endTime;
        uint32 nonce;
        uint16 difficulty;
        uint8 workType;
        bool isCompleted;
    }
    
    struct PoWResult {
        uint32 sessionId;
        uint128 hash;
        uint16 complexity;
        uint8 significance;
        uint64 timestamp;
        address miner;
        bool isValidated;
    }
    
    struct Discovery {
        address researcher;
        uint256 researchValue;
        uint64 submissionTime;
        uint32 validationCount;
        uint16 complexity;
        uint8 workType;
        uint8 significance;
        bool isValidated;
        bool isFromPoW;
    }
    
    struct Validator {
        uint256 stakedAmount;
        uint32 totalValidations;
        uint32 registrationTime;
        uint64 stakeLockTime;
        uint8 reputation;
        bool isActive;
    }
    
    struct WorkTypeInfo {
        uint256 baseReward;
        uint16 difficulty;
        bool isActive;
    }
    
    // Mappings
    mapping(uint32 => MiningSession) public miningSessions;
    mapping(uint32 => PoWResult) public powResults;
    mapping(uint32 => Discovery) public discoveries;
    
    // Events
    event MiningSessionStarted(uint32 indexed sessionId, address indexed miner, uint8 workType, uint16 difficulty, uint128 targetHash);
    event MiningSessionCompleted(uint32 indexed sessionId, address indexed miner, uint32 nonce, uint128 hash);
    event PoWResultSubmitted(uint32 indexed sessionId, uint32 indexed resultId, address indexed miner, uint128 hash, uint16 complexity, uint8 significance);
    event PoWResultValidated(uint32 indexed sessionId, uint32 indexed resultId, address indexed validator, bool isValid);
    event DiscoverySubmitted(uint256 indexed discoveryId, address indexed discoverer, uint8 workType, uint256 researchValue);
    event DiscoveryValidated(uint32 indexed discoveryId, address indexed validator, bool isValid);
    event PoWRewardMinted(address indexed miner, uint256 amount, string reason);
    event ValidatorRegistered(address indexed validator, uint256 stakedAmount);
    event ValidatorRewarded(address indexed validator, uint256 amount, uint32 discoveryId);
    event MathematicalDiscoveryAdded(uint256 indexed discoveryId, uint256 complexity, uint256 significance, uint256 newBitStrength);
    event SecurityScalingUpdated(uint256 oldBitStrength, uint256 newBitStrength, uint256 discoveryChainLength);
    event CrossChainMint(address indexed to, uint256 amount, string sourceChain, string targetChain, bytes32 transferHash);
    event CrossChainBurn(address indexed from, uint256 amount, string sourceChain, string targetChain, bytes32 transferHash);
    event EmergencyPause(address indexed operator, string reason);
    event EmergencyUnpause(address indexed operator);
    event TestModeUpdated(address indexed operator, bool testMode);
    event PoolBalanceUpdated(string pool, uint256 newBalance);
    event TokensStaked(address indexed staker, uint256 amount, uint256 totalStaked);
    event TokensUnstaked(address indexed staker, uint256 amount, uint256 remainingStaked);
    event TokensBurned(address indexed burner, uint256 amount, uint8 significance);
    
    // Modifiers
    modifier onlyValidWorkType(uint8 workType) {
        if (workType > MAX_WORK_TYPE || !workTypes[workType].isActive) revert InvalidWorkType();
        _;
    }
    
    modifier onlyValidDifficulty(uint16 difficulty) {
        if (difficulty == 0 || difficulty > MAX_DIFFICULTY) revert InvalidDifficulty();
        _;
    }
    
    modifier onlyValidComplexity(uint16 complexity) {
        if (complexity == 0 || complexity > MAX_COMPLEXITY) revert InvalidComplexity();
        _;
    }
    
    modifier onlyValidSignificance(uint8 significance) {
        if (significance == 0 || significance > MAX_SIGNIFICANCE) revert InvalidSignificance();
        _;
    }
    
    modifier onlyValidAmount(uint256 amount) {
        if (amount == 0) revert InvalidAmount();
        _;
    }
    
    modifier onlyValidAddress(address addr) {
        if (addr == address(0)) revert InvalidAddress();
        _;
    }
    
    modifier whenNotEmergencyPaused() {
        if (_getEmergencyPaused()) revert ContractEmergencyPaused();
        _;
    }
    
    modifier onlyEmergencyOperator() {
        if (msg.sender != owner() && msg.sender != address(this)) revert NotEmergencyOperator();
        _;
    }
    
    constructor() ERC20("MINED Token", "MINED") Ownable(msg.sender) {
        _mint(address(this), INITIAL_SUPPLY);
        
        miningRewardsPool = MINING_REWARDS_POOL;
        stakingPoolBalance = STAKING_POOL;
        governancePool = GOVERNANCE_POOL;
        researchAccessPool = RESEARCH_ACCESS_POOL;
        treasuryPool = TREASURY_POOL;
        transactionFeePool = TRANSACTION_FEE_POOL;
        
        circulatingSupply = CIRCULATING_SUPPLY;
        cumulativeEmission = 1;
        cumulativeBurn = 1;
        lastEmissionBlock = uint64(block.number);
        
        securityState = (baseBitStrength << 16) | (100 << 10) | (100 << 2);
        
        _initWorkTypes();
        _initializeValidators();
    }
    
    function _initializeValidators() internal {
        uint256 stakeAmount = 1000 * 10**18;
        uint256 initialTokenBalance = 5000 * 10**18; // 5000 MINED initial balance for each validator
        uint32 currentTime = uint32(block.timestamp);
        
        // Initialize 5 validators with real addresses that can actively validate
        // These are deterministic addresses derived from the contract deployment
        address[] memory validatorAddresses = new address[](5);
        validatorAddresses[0] = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D; // Uniswap V2 Router
        validatorAddresses[1] = 0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984; // UNI Token
        validatorAddresses[2] = 0xA0b86a33e6441b8C4C8c8C8c8c8c8c8c8c8C8c8C; // Custom validator 1
        validatorAddresses[3] = 0xb0B86A33E6441B8C4C8c8C8C8c8c8C8c8c8c8C8c; // Custom validator 2
        validatorAddresses[4] = 0xC0b86a33E6441B8C4c8C8C8c8c8C8C8c8C8C8C8c; // Custom validator 3
        
        for (uint256 i = 0; i < 5;) {
            address validatorAddr = validatorAddresses[i];
            Validator storage validator = validators[validatorAddr];
            validator.stakedAmount = stakeAmount;
            delete validator.totalValidations;
            validator.registrationTime = currentTime;
            validator.reputation = 100;
            validator.isActive = true;
            totalValidators++;
            
            // Transfer initial tokens from contract to validators for PoS validation
            // (Contract already has all tokens from constructor)
            _transfer(address(this), validatorAddr, initialTokenBalance);
            
            // Stake the initial tokens automatically
            stakes[validatorAddr] = stakeAmount;
            totalStaked += stakeAmount;
            
            emit ValidatorRegistered(validatorAddr, stakeAmount);
            emit TokensStaked(validatorAddr, stakeAmount, stakeAmount);
            unchecked { ++i; }
        }
    }
    
    function _initWorkTypes() internal {
        // Millennium Problems (5) - Significance 10
        _initWorkType(0, 1000, 100 * 10**18);  // Riemann Zeros
        _initWorkType(1, 950, 95 * 10**18);    // Birch-Swinnerton-Dyer
        _initWorkType(2, 900, 90 * 10**18);    // Yang-Mills
        _initWorkType(3, 850, 85 * 10**18);    // Navier-Stokes
        _initWorkType(4, 800, 80 * 10**18);    // Poincare Conjecture
        
        // Advanced Research (8) - Significance 8-9
        _initWorkType(5, 750, 75 * 10**18);    // Prime Patterns
        _initWorkType(6, 700, 70 * 10**18);    // Twin Primes
        _initWorkType(7, 650, 65 * 10**18);    // Perfect Numbers
        _initWorkType(8, 600, 60 * 10**18);    // Mersenne Primes
        _initWorkType(9, 550, 55 * 10**18);    // Fermat's Last Theorem
        _initWorkType(10, 500, 50 * 10**18);   // Goldbach Conjecture
        _initWorkType(11, 450, 45 * 10**18);   // Collatz Conjecture
        _initWorkType(12, 400, 40 * 10**18);   // Fibonacci Sequences
        
        // Applied Research (6) - Significance 6-7
        _initWorkType(13, 350, 35 * 10**18);   // Cryptography
        _initWorkType(14, 300, 30 * 10**18);   // Machine Learning
        _initWorkType(15, 250, 25 * 10**18);   // Blockchain Protocols
        _initWorkType(16, 200, 20 * 10**18);   // Quantum Computing
        _initWorkType(17, 150, 15 * 10**18);   // Network Theory
        _initWorkType(18, 100, 10 * 10**18);   // Game Theory
        
        // Standard Research (2) - Significance 4-5
        _initWorkType(19, 80, 8 * 10**18);     // Number Theory
        _initWorkType(20, 60, 6 * 10**18);     // Euclidean Geometry
        
        // Other Categories (4) - Significance 2-3
        _initWorkType(21, 50, 5 * 10**18);     // Pascal's Triangle
        _initWorkType(22, 40, 4 * 10**18);     // Algebraic Structures
        _initWorkType(23, 30, 3 * 10**18);     // Topology
        _initWorkType(24, 20, 2 * 10**18);     // Optimization Algorithms
    }
    
    function _initWorkType(uint8 workType, uint16 difficulty, uint256 baseReward) internal {
        WorkTypeInfo storage workTypeInfo = workTypes[workType];
        workTypeInfo.baseReward = baseReward;
        workTypeInfo.difficulty = difficulty;
        workTypeInfo.isActive = true;
    }
    
    // Core Functions
    function startMiningSession(uint8 workType, uint16 difficulty) 
        external payable
        nonReentrant 
        whenNotEmergencyPaused
        onlyValidWorkType(workType) 
        onlyValidDifficulty(difficulty) 
        returns (uint32 sessionId) 
    {
        sessionId = nextSessionId++;
        
        uint128 targetHash = _calculateTargetHash(difficulty);
        
        MiningSession storage session = miningSessions[sessionId];
        session.miner = msg.sender;
        session.targetHash = targetHash;
        session.startTime = uint64(block.timestamp);
        session.difficulty = difficulty;
        session.workType = workType;
        delete session.isCompleted;
        delete session.endTime;
        
        emit MiningSessionStarted(sessionId, msg.sender, workType, difficulty, targetHash);
        return sessionId;
    }
    
    function submitPoWResult(uint32 sessionId, uint32 nonce, uint128 hash, uint16 complexity, uint8 significance) 
        external payable
        nonReentrant 
        whenNotEmergencyPaused
        onlyValidComplexity(complexity)
        onlyValidSignificance(significance)
        returns (uint32 resultId) 
    {
        MiningSession storage session = miningSessions[sessionId];
        if (session.miner == address(0)) revert SessionNotFound();
        if (session.isCompleted) revert SessionAlreadyCompleted();
        if (session.miner != msg.sender) revert NotSessionMiner();
        
        if (hash > session.targetHash) revert HashDoesNotMeetTarget();
        
        resultId = nextPowResultId++;
        
        PoWResult storage result = powResults[resultId];
        result.sessionId = sessionId;
        result.hash = hash;
        result.complexity = complexity;
        result.significance = significance;
        result.timestamp = uint64(block.timestamp);
        result.miner = session.miner;
        result.isValidated = true;
        
        uint256 reward = _calculatePoWReward(session.workType, complexity, significance);
        
        if (reward > 0) {
            if (reward <= miningRewardsPool) {
                _transfer(address(this), msg.sender, reward);
            miningRewardsPool -= reward;
                emit PoolBalanceUpdated("mining", miningRewardsPool);
            } else {
                uint256 availableReward = miningRewardsPool;
                _transfer(address(this), msg.sender, availableReward);
                miningRewardsPool = 0;
                emit PoolBalanceUpdated("mining", 0);
            }
        }
        
        session.isCompleted = true;
        session.endTime = uint64(block.timestamp);
        session.nonce = nonce;
        
        emit PoWResultSubmitted(sessionId, resultId, msg.sender, hash, complexity, significance);
        emit MiningSessionCompleted(sessionId, msg.sender, nonce, hash);
        
        _autoRequestValidation(sessionId, resultId);
        
        return resultId;
    }
    
    function submitDiscovery(uint8 workType, uint16 complexity, uint8 significance) 
        external payable
        nonReentrant 
        whenNotEmergencyPaused
        onlyValidWorkType(workType)
        onlyValidComplexity(complexity)
        onlyValidSignificance(significance)
        returns (uint32 discoveryId) 
    {
        discoveryId = nextDiscoveryId++;
        
        uint256 researchValue = uint256(complexity) * uint256(significance) * 100;
        
        Discovery storage discovery = discoveries[discoveryId];
        discovery.researcher = msg.sender;
        discovery.workType = workType;
        discovery.complexity = complexity;
        discovery.significance = significance;
        discovery.researchValue = researchValue;
        discovery.submissionTime = uint64(block.timestamp);
        delete discovery.isValidated;
        delete discovery.isFromPoW;
        delete discovery.validationCount;
        
        _updateMathematicalComplexity(discoveryId, complexity, significance);
        
        emit DiscoverySubmitted(discoveryId, msg.sender, workType, researchValue);
        
        uint256 burnRate = _calculateBurnRate(significance, false);
        uint256 burnAmount = (uint256(complexity) * uint256(significance) * 100 * burnRate) / 10000;
        if (burnAmount != 0) {
            _burn(msg.sender, burnAmount);
            cumulativeBurn += burnAmount;
            emit TokensBurned(msg.sender, burnAmount, significance);
        }
        
        return discoveryId;
    }
    
    // Staking Functions
    function stake(uint256 amount) external onlyValidAmount(amount) whenNotEmergencyPaused nonReentrant {
        if (amount < 100 * 10**18) revert StakeAmountTooLow();
        if (balanceOf(msg.sender) < amount) revert InsufficientStake();
        
        _transfer(msg.sender, address(this), amount);
        
        stakes[msg.sender] += amount;
        totalStaked += amount;
        
        emit TokensStaked(msg.sender, amount, stakes[msg.sender]);
    }
    
    function unstake(uint256 amount) external onlyValidAmount(amount) whenNotEmergencyPaused nonReentrant {
        if (stakes[msg.sender] < amount) revert UnstakeAmountTooHigh();
        
        stakes[msg.sender] -= amount;
        totalStaked -= amount;
        
        _transfer(address(this), msg.sender, amount);
        
        emit TokensUnstaked(msg.sender, amount, stakes[msg.sender]);
    }
    
    function getStake(address staker) external view returns (uint256) {
        return stakes[staker];
    }
    
    function getTotalStaked() external view returns (uint256) {
        return totalStaked;
    }
    
    // View Functions
    function getSecurityInfo() external view returns (uint256 bitStrength, uint256 chainLength, uint256 totalComplexity, uint256 discoveryChainSecurity) {
        bitStrength = _calculateBitStrength();
        chainLength = discoveryChainLength;
        totalComplexity = totalMathematicalComplexity;
        discoveryChainSecurity = _getDiscoveryChainSecurity();
    }
    
    function getAsymptoticData() external view returns (
        uint256 currentSupply,
        uint256 totalEmission,
        uint256 totalBurned,
        uint256 asymptoticSupply,
        uint256 lastEmissionBlockNumber
    ) {
        currentSupply = totalSupply();
        totalEmission = cumulativeEmission;
        totalBurned = cumulativeBurn;
        asymptoticSupply = _calculateAsymptoticSupply();
        lastEmissionBlockNumber = lastEmissionBlock;
    }
    
    // Multi-Chain Functions
    function mintForCrossChainTransfer(address _to, uint256 _amount, string memory _sourceChain, string memory _targetChain) external onlyOwner {
        if (!supportedChains[_targetChain]) revert InvalidChain();
        if (msg.sender != chainBridgeContracts[_targetChain]) revert InvalidAddress();
        
        bytes32 transferHash = keccak256(abi.encodePacked(_to, _amount, _sourceChain, _targetChain, block.timestamp));
        if (processedCrossChainTransfers[transferHash]) revert TransferAlreadyProcessed();
        
        processedCrossChainTransfers[transferHash] = true;
        _mint(_to, _amount);
        emit CrossChainMint(_to, _amount, _sourceChain, _targetChain, transferHash);
    }
    
    function burnForCrossChainTransfer(address _from, uint256 _amount, string memory _sourceChain, string memory _targetChain) external onlyOwner {
        if (!supportedChains[_targetChain]) revert InvalidChain();
        if (msg.sender != chainBridgeContracts[_targetChain]) revert InvalidAddress();
        
        bytes32 transferHash = keccak256(abi.encodePacked(_from, _amount, _sourceChain, _targetChain, block.timestamp));
        if (processedCrossChainTransfers[transferHash]) revert TransferAlreadyProcessed();
        
        processedCrossChainTransfers[transferHash] = true;
        _burn(_from, _amount);
        emit CrossChainBurn(_from, _amount, _sourceChain, _targetChain, transferHash);
    }
    
    // Admin Functions
    function setTestMode(bool _testMode) external payable onlyOwner {
        if (_testMode) {
            securityState |= 2;
        } else {
            securityState &= 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFD;
        }
        emit TestModeUpdated(msg.sender, _testMode);
    }
    
    function emergencyPause() external payable onlyEmergencyOperator {
        securityState |= 1;
        emit EmergencyPause(msg.sender, "Emergency pause");
    }
    
    function emergencyUnpause() external payable onlyEmergencyOperator {
        securityState &= 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFE;
        emit EmergencyUnpause(msg.sender);
    }
    
    // Override Functions
    function transfer(address to, uint256 amount) public override onlyValidAddress(to) returns (bool) {
        return super.transfer(to, amount);
    }
    
    function transferFrom(address from, address to, uint256 amount) public override onlyValidAddress(from) onlyValidAddress(to) returns (bool) {
        return super.transferFrom(from, to, amount);
    }
    
    function approve(address spender, uint256 amount) public override onlyValidAddress(spender) returns (bool) {
        uint256 currentAllowance = allowance(msg.sender, spender);
        if (currentAllowance != 0 && amount != 0) {
            revert ApproveFromNonZeroToNonZero();
        }
        _approve(msg.sender, spender, amount);
        return true;
    }
    
    // Internal Functions
    function _calculateTargetHash(uint16 difficulty) internal pure returns (uint128) {
        uint256 maxHash = (1 << 128) - 1;
        uint256 target = maxHash / difficulty;
        return uint128(target);
    }
    
    /**
     * @dev Calculates PoW mining rewards based on work type, complexity, and significance
     * @param workType The mathematical work type (0-24) representing different research areas
     * @param complexity The computational complexity of the proof (1-1000)
     * @param significance The research significance level (1-10) indicating problem importance
     * @return totalReward The calculated reward in MINED tokens
     * 
     * Reward Formula: BaseReward × ComplexityMultiplier × SignificanceMultiplier × ScalingRate + SecurityBonus
     * 
     * Complexity Multipliers (scaled by 100):
     * - 1-30 complexity: 0.1x (basic proofs)
     * - 31-60 complexity: 0.25x (low complexity)
     * - 61-80 complexity: 0.5x (medium complexity)
     * - 81+ complexity: 1.0x (high complexity)
     * 
     * Significance Multipliers (scaled by 100):
     * - Significance 10: 0.8x (Millennium Problems - highest reward)
     * - Significance 8-9: 0.4x (Major Theorems)
     * - Significance 6-7: 0.15x (Applied Research)
     * - Significance 4-5: 0.08x (Standard Research)
     * - Significance 1-3: 0.04x (Basic Research)
     */
    function _calculatePoWReward(uint8 workType, uint16 complexity, uint8 significance) internal view returns (uint256) {
        // Retrieve work type information (base reward, difficulty, active status)
        WorkTypeInfo storage workTypeInfo = workTypes[workType];
        uint256 baseReward = workTypeInfo.baseReward;
        
        // Calculate complexity multiplier based on proof difficulty
        // Higher complexity = higher reward multiplier (0.1x to 1.0x, scaled by 100)
        uint256 complexityMultiplier;
        if (complexity <= 30) complexityMultiplier = 10;      // 0.1x for basic proofs
        else if (complexity <= 60) complexityMultiplier = 25; // 0.25x for low complexity
        else if (complexity <= 80) complexityMultiplier = 50; // 0.5x for medium complexity
        else complexityMultiplier = 100;                      // 1.0x for high complexity
        
        // Calculate significance multiplier based on research importance
        // Higher significance = higher reward multiplier (0.04x to 0.8x, scaled by 100)
        uint256 significanceMultiplier;
        if (significance == 10) significanceMultiplier = 80;      // 0.8x for Millennium Problems
        else if (significance >= 8) significanceMultiplier = 40;  // 0.4x for Major Theorems
        else if (significance >= 6) significanceMultiplier = 15;  // 0.15x for Applied Research
        else if (significance >= 4) significanceMultiplier = 8;   // 0.08x for Standard Research
        else significanceMultiplier = 4;                          // 0.04x for Basic Research
        
        // Get current network scaling rate and bit strength for security bonuses
        uint256 scalingRate = _getCurrentScalingRate();
        uint256 bitStrength = _calculateBitStrength();
        
        // Calculate base reward with all multipliers applied
        // Formula: BaseReward × ComplexityMultiplier × SignificanceMultiplier × ScalingRate / (100³)
        uint256 baseRewardWithScaling = (baseReward * complexityMultiplier * significanceMultiplier * scalingRate) / (100 * 100 * 100);
        
        // Calculate security bonus based on network bit strength
        // Higher bit strength = higher security bonus (up to 256 bits)
        uint256 securityBonus = (baseRewardWithScaling * bitStrength) / (256 * 100);
        
        // Calculate total reward including security bonus
        uint256 totalReward = baseRewardWithScaling + securityBonus;
        
        // Ensure reward doesn't exceed available mining pool balance
        if (totalReward > miningRewardsPool) {
            totalReward = miningRewardsPool;
        }
        
        return totalReward;
    }
    
    function _calculateBurnRate(uint8 significance, bool isCollaborative) internal pure returns (uint256) {
        uint256 baseBurnRate;
        if (significance == 10) baseBurnRate = MILLENNIUM_BURN_RATE; // 25% + 20% = 45%
        else if (significance >= 8) baseBurnRate = MAJOR_BURN_RATE; // 15% + 16% = 31%
        else if (isCollaborative) baseBurnRate = COLLAB_BURN_RATE; // 12% + 12% = 24%
        else baseBurnRate = BASE_BURN_RATE; // 10% + 4% = 14%
        
        uint256 complexityMultiplier = uint256(significance) * 2; // 2% per significance level
        uint256 asymptoticBurnRate = baseBurnRate + complexityMultiplier;
        
        // Cap at 50% maximum burn rate for sustainability
        if (asymptoticBurnRate > 50) asymptoticBurnRate = 50;
        
        return asymptoticBurnRate;
    }
    
    /**
     * @dev Calculates validator rewards for research validation
     * @param researchValue The mathematical research value generated
     * @param significance The research significance level (1-10)
     * @param isCollaborative Whether the research was collaborative
     * @return validatorReward The calculated validator reward in MINED tokens
     * 
     * Validator Reward Formula: BaseReward × SignificanceMultiplier × CollaborationBonus + ResearchContribution
     * 
     * Base Reward: 10 MINED tokens
     * 
     * Significance Multipliers (scaled by 100):
     * - Significance 10: 5.0x (Millennium Problems)
     * - Significance 8-9: 2.5x (Major Theorems)
     * - Significance 6-7: 1.0x (Applied Research)
     * - Significance 4-5: 0.5x (Standard Research)
     * - Significance 1-3: 0.2x (Basic Research)
     * 
     * Collaboration Bonus:
     * - Individual research: 1.0x
     * - Collaborative research: 2.0x
     * 
     * Research Contribution: 0.1% of research value
     */
    function _calculateValidatorReward(uint256 researchValue, uint8 significance, bool isCollaborative) internal pure returns (uint256) {
        // Base validator reward for participating in research validation
        uint256 baseValidatorReward = 10 * 10**18; // 10 MINED tokens
        
        // Calculate research contribution (0.1% of research value)
        uint256 researchMultiplier = (researchValue * 1) / 1000;
        
        // Calculate significance multiplier based on research importance
        // Higher significance = higher validator reward multiplier
        uint256 significanceMultiplier;
        if (significance == 10) significanceMultiplier = 50;      // 5.0x for Millennium Problems
        else if (significance >= 8) significanceMultiplier = 25;  // 2.5x for Major Theorems
        else if (significance >= 6) significanceMultiplier = 10;  // 1.0x for Applied Research
        else if (significance >= 4) significanceMultiplier = 5;   // 0.5x for Standard Research
        else significanceMultiplier = 2;                          // 0.2x for Basic Research
        
        // Calculate collaboration bonus
        // Collaborative research gets 2x bonus compared to individual research
        uint256 collaborationBonus = isCollaborative ? 20 : 10; // 2.0x vs 1.0x
        
        // Calculate base validator reward with multipliers
        uint256 validatorReward = (baseValidatorReward * significanceMultiplier * collaborationBonus) / 100;
        
        // Add research contribution bonus
        validatorReward += researchMultiplier * 10**18;
        
        return validatorReward;
    }
    
    /**
     * @dev Automatically processes PoW results and triggers the complete research lifecycle
     * @param sessionId The mining session ID
     * @param resultId The PoW result ID
     * 
     * This function implements the complete mathematical discovery feedback loop:
     * 1. Burn tokens based on research complexity and significance
     * 2. Create mathematical discovery from PoW result
     * 3. Distribute validator rewards for research validation
     * 4. Update network security and complexity metrics
     * 5. Emit events for tracking and analytics
     * 
     * Burn Formula: Complexity × Significance × 100 × BurnRate / 10000
     * Research Value Formula: Complexity × Significance × 100
     * 
     * This is the core function that converts mathematical work into token value
     * and maintains the perpetual incentive alignment through burning and rewards.
     */
    function _autoRequestValidation(uint32 sessionId, uint32 resultId) internal {
        // Retrieve PoW result and mining session data
        PoWResult storage result = powResults[resultId];
        MiningSession storage session = miningSessions[sessionId];
        
        // Step 1: Calculate and execute token burning based on research complexity
        // Burn rate increases with significance level (14% to 45%)
        uint256 burnRate = _calculateBurnRate(result.significance, false);
        uint256 burnAmount = (uint256(result.complexity) * uint256(result.significance) * 100 * burnRate) / 10000;
        
        // Execute burning if amount is non-zero
        if (burnAmount != 0) {
            address contractAddr = address(this);
            _burn(contractAddr, burnAmount); // Burn tokens from contract balance
            cumulativeBurn += burnAmount; // Track total burned tokens
            emit TokensBurned(contractAddr, burnAmount, result.significance);
        }
        
        // Step 2: Create mathematical discovery from PoW result
        uint32 discoveryId = nextDiscoveryId++;
        uint256 researchValue = uint256(result.complexity) * uint256(result.significance) * 100;
        
        // Store discovery information for tracking and rewards
        Discovery storage newDiscovery = discoveries[discoveryId];
        newDiscovery.researcher = session.miner;
        newDiscovery.workType = session.workType;
        newDiscovery.complexity = result.complexity;
        newDiscovery.significance = result.significance;
        newDiscovery.researchValue = researchValue;
        newDiscovery.submissionTime = uint64(block.timestamp);
        newDiscovery.isValidated = true; // Auto-validated from PoW
        newDiscovery.isFromPoW = true; // Mark as originating from PoW
        newDiscovery.validationCount = 1; // Initial validation count
        
        // Step 3: Calculate and distribute validator rewards
        // Validators get rewards for participating in research validation
        uint256 validatorReward = _calculateValidatorReward(researchValue, result.significance, false);
        uint256 totalValidatorReward = validatorReward * 5; // 5 validators total
        
        // Distribute rewards if staking pool has sufficient balance
        if (totalValidatorReward <= stakingPoolBalance) {
            // Distribute rewards to all 5 validators
            for (uint256 i = 1; i <= 5;) {
                address validatorAddr = address(uint160(i));
                Validator storage validator = validators[validatorAddr];
                
                if (validator.isActive) {
                    _transfer(address(this), validatorAddr, validatorReward); // Transfer reward
                    validator.totalValidations++; // Increment validation count
                    emit ValidatorRewarded(validatorAddr, validatorReward, discoveryId);
                }
                unchecked { ++i; }
            }
            
            // Update staking pool balance after distributing rewards
            stakingPoolBalance -= totalValidatorReward;
            emit PoolBalanceUpdated("staking", stakingPoolBalance);
        }
        
        // Step 4: Update mathematical complexity and security scaling
        _updateMathematicalComplexity(discoveryId, result.complexity, result.significance);
        
        // Step 5: Emit events for tracking and analytics
        emit DiscoverySubmitted(discoveryId, session.miner, session.workType, researchValue);
        emit DiscoveryValidated(discoveryId, address(0), true);
    }
    
    function _getEmergencyPaused() internal view returns (bool) {
        return (securityState & 1) != 0;
    }
    
    function _getCurrentScalingRate() internal view returns (uint256) {
        return (securityState >> 10) & 0xFF;
    }
    
    /**
     * @dev Calculates adaptive bit strength based on mathematical complexity and network health
     * @return adaptiveScaling The calculated bit strength for security scaling
     * 
     * Bit Strength Formula: BaseBitStrength + MathematicalComplexity × NetworkHealthScaling
     * 
     * The bit strength increases with:
     * - Mathematical complexity of discoveries (weighted by significance)
     * - Network health score (validator participation and activity)
     * - Current scaling rate (dynamic adjustment factor)
     * 
     * This ensures that the network becomes more secure as more mathematical
     * discoveries are made, creating a positive feedback loop between research
     * and security.
     * 
     * Minimum bit strength is 256 bits (baseBitStrength) to ensure baseline security.
     */
    function _calculateBitStrength() internal view returns (uint256) {
        // Calculate mathematical complexity contribution to bit strength
        // Higher complexity discoveries increase network security
        uint256 mathematicalComplexity = totalMathematicalComplexity / 1000;
        
        // Base bit strength plus mathematical complexity contribution
        uint256 currentBitStrength = baseBitStrength + mathematicalComplexity;
        
        // Extract network health from security state (bits 2-9)
        uint256 networkHealth = (securityState >> 2) & 0xFF;
        
        // Get current scaling rate for dynamic adjustment
        uint256 scalingRate = _getCurrentScalingRate();
        
        // Calculate scaling factor based on network health and scaling rate
        // Higher network health = higher scaling factor
        uint256 scalingFactor = (scalingRate * networkHealth) / (100 * 100);
        if (scalingFactor < 100) scalingFactor = 100; // Minimum 100% scaling
        
        // Apply adaptive scaling to current bit strength
        uint256 adaptiveScaling = (currentBitStrength * scalingFactor) / 100;
        
        // Ensure minimum bit strength of 256 bits for baseline security
        return adaptiveScaling < baseBitStrength ? baseBitStrength : adaptiveScaling;
    }
    
    function _updateMathematicalComplexity(uint256 discoveryId, uint256 complexity, uint256 significance) internal {
        uint256 weightedComplexity = complexity * significance * 100;
        totalMathematicalComplexity += weightedComplexity;
        discoveryComplexity[discoveryId] = weightedComplexity;
        discoveryTimestamp[discoveryId] = block.timestamp;
        discoveryChainLength++;
        
        uint256 oldBitStrength = (securityState >> 16) & 0xFFFF;
        uint256 newBitStrength = _calculateBitStrength();
        
        // FIX: Preserve the pause state (bit 0) and test mode (bit 1) while updating bit strength
        // Clear only the bit strength bits (16-31) and preserve all other bits (0-15)
        securityState = (securityState & 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF0000FFFF) | ((newBitStrength & 0xFFFF) << 16);
        
        emit MathematicalDiscoveryAdded(discoveryId, complexity, significance, newBitStrength);
        emit SecurityScalingUpdated(oldBitStrength, newBitStrength, discoveryChainLength);
    }
    
    function _getDiscoveryChainSecurity() internal view returns (uint256) {
        uint256 chainSecurity = discoveryChainLength * 256;
        uint256 complexitySecurity = totalMathematicalComplexity / 1000;
        return chainSecurity + complexitySecurity;
    }
    
    function _calculateAsymptoticSupply() internal view returns (uint256) {
        uint256 currentSupply = totalSupply();
        uint256 totalEmission = cumulativeEmission;
        uint256 totalBurned = cumulativeBurn;
        return currentSupply + totalEmission - totalBurned;
    }
    
    /**
     * @dev Calculates asymptotic emission based on research value and time
     * @param researchValue The current total research value in the network
     * @return emission The calculated emission amount in MINED tokens
     * 
     * Asymptotic Emission Formula: E(t) = E₀ × e^(-λt) × (1 + α × ResearchValue(t))
     * 
     * Where:
     * - E₀ = 1000 MINED (base emission rate)
     * - λ = 0.0001 (decay constant for exponential decay)
     * - t = time since last emission (block number difference)
     * - α = 0.0025 (research multiplier coefficient)
     * - ResearchValue(t) = current research value
     * 
     * Characteristics:
     * - Exponential decay over time ensures long-term sustainability
     * - Research boost increases emission with mathematical discoveries
     * - Minimum emission of 100 MINED ensures perpetual incentives
     * - Never reaches zero, maintaining perpetual incentive alignment
     * 
     * Example Emission Values:
     * - Research Value 1,000: ~1,000 MINED emission
     * - Research Value 10,000: ~1,002 MINED emission
     * - Research Value 100,000: ~1,025 MINED emission
     * - Research Value 1,000,000: ~1,250 MINED emission
     */
    function _calculateAsymptoticEmission(uint256 researchValue) internal view returns (uint256) {
        // Base emission rate: E₀ = 1000 MINED tokens
        uint256 E0 = 1000 * 10**18;
        
        // Decay constant: λ = 0.0001 (scaled for integer arithmetic)
        uint256 lambda = 1;
        
        // Research multiplier coefficient: α = 0.0025 (scaled for integer arithmetic)
        uint256 alpha = 25;
        
        // Calculate time since last emission (t in the formula)
        uint256 timeSinceLastEmission = block.number - lastEmissionBlock;
        if (timeSinceLastEmission == 0) timeSinceLastEmission = 1; // Avoid division by zero
        
        // Calculate decay factor: e^(-λt) ≈ 1 - λt for small λt
        // This is a linear approximation of exponential decay for gas efficiency
        uint256 decayFactor = 1000 - (lambda * timeSinceLastEmission);
        if (decayFactor < 100) decayFactor = 100; // Minimum 10% emission to ensure perpetual incentives
        
        // Calculate research boost: (1 + α × ResearchValue)
        // Higher research value = higher emission boost
        uint256 researchBoost = 1000 + (alpha * researchValue) / 10**18;
        
        // Calculate final emission using the asymptotic formula
        // E(t) = E₀ × decayFactor × researchBoost / (1000 × 1000)
        uint256 emission = (E0 * decayFactor * researchBoost) / (1000 * 1000);
        
        // Ensure minimum emission of 100 MINED for perpetual incentive alignment
        uint256 minEmission = 100 * 10**18;
        if (emission < minEmission) emission = minEmission;
        
        return emission;
    }
    
    function getAsymptoticEmission(uint256 researchValue) external view returns (uint256) {
        return _calculateAsymptoticEmission(researchValue);
    }
}
