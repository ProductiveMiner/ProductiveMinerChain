// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./MINEDTokenAsymptoticEnhanced.sol";

/**
 * @title ProductiveMiner (Asymptotic Integration)
 * @dev Enhanced ProductiveMiner contract with asymptotic token integration
 * 
 * Features:
 * - Mathematical discovery mining with multiple work types
 * - Asymptotic token emission integration
 * - Research value tracking and contribution
 * - Dynamic difficulty adjustment
 * - Session management with token rewards
 * - Emergency controls
 * - Integration with MINEDTokenAsymptotic
 */
contract ProductiveMinerAsymptotic {
    // =============================================================================
    // STRUCTS AND ENUMS
    // =============================================================================

    enum WorkType {
        PRIME_PATTERN_DISCOVERY,
        RIEMANN_ZERO_COMPUTATION,
        YANG_MILLS_FIELD_THEORY,
        GOLDBACH_CONJECTURE_VERIFICATION,
        NAVIER_STOKES_SIMULATION,
        BIRCH_SWINNERTON_DYER,
        ELLIPTIC_CURVE_CRYPTOGRAPHY,
        LATTICE_CRYPTOGRAPHY,
        POINCARE_CONJECTURE,
        QUANTUM_ALGORITHM_OPTIMIZATION,
        CRYPTOGRAPHIC_PROTOCOL_ANALYSIS,
        MATHEMATICAL_CONSTANT_VERIFICATION
    }

    struct Discovery {
        uint256 id;
        address miner;
        WorkType workType;
        uint256 difficulty;
        uint256 quantumSecurityLevel;
        uint256 reward;
        uint256 tokenReward;
        uint256 timestamp;
        bytes32 proofHash;
        bool verified;
        string metadata;
        uint256 computationalComplexity;
        uint256 impactScore;
        uint256 researchValue;
    }

    struct MiningSession {
        uint256 sessionId;
        address miner;
        WorkType workType;
        uint256 startTime;
        uint256 endTime;
        uint256 difficulty;
        uint256 quantumSecurityLevel;
        bool active;
        bool completed;
        uint256 computationalPower;
        uint256 energyConsumption;
        uint256 researchValue;
    }

    struct StakingInfo {
        uint256 stakedAmount;
        uint256 rewards;
        uint256 tokenRewards;
        uint256 lastClaimTime;
        uint256 apy;
        bool isActive;
    }

    struct NetworkStats {
        uint256 totalDiscoveries;
        uint256 totalSessions;
        uint256 currentActiveSessions;
        uint256 maxDifficulty;
        uint256 baseReward;
        uint256 quantumSecurityLevel;
        uint256 totalStaked;
        uint256 totalRewardsDistributed;
        uint256 totalTokenRewardsDistributed;
        uint256 averageComputationalComplexity;
        uint256 totalResearchValue;
        uint256 currentBlockHeight;
    }

    // =============================================================================
    // STATE VARIABLES
    // =============================================================================

    // Core mining parameters
    uint256 public maxDifficulty = 1000000;
    uint256 public baseReward = 1000;
    uint256 public quantumSecurityLevel = 256;
    uint256 public minStakeAmount = 1000;
    uint256 public stakingAPY = 12; // 12% APY
    uint256 public maxConcurrentSessions = 10;
    bool public tokenIntegrationEnabled = true;

    // Asymptotic token integration
    MINEDTokenAsymptoticEnhanced public minedToken;
    uint256 public currentBlockHeight = 1;
    uint256 public totalResearchValue = 0;
    
    // Research value multipliers by work type
    mapping(WorkType => uint256) public workTypeResearchMultipliers;

    // Access control
    address public owner;
    bool public paused = false;

    // Mappings
    mapping(uint256 => Discovery) public discoveries;
    mapping(uint256 => MiningSession) public sessions;
    mapping(address => StakingInfo) public stakingInfo;
    mapping(address => uint256[]) public minerSessions;
    mapping(address => uint256[]) public minerDiscoveries;

    // Counters
    uint256 public discoveryCounter = 0;
    uint256 public sessionCounter = 0;
    uint256 public totalStaked = 0;
    uint256 public totalRewardsDistributed = 0;
    uint256 public totalTokenRewardsDistributed = 0;

    // =============================================================================
    // EVENTS
    // =============================================================================

    event DiscoverySubmitted(uint256 indexed discoveryId, address indexed miner, WorkType workType, uint256 difficulty, uint256 researchValue);
    event MiningSessionStarted(uint256 indexed sessionId, address indexed miner, WorkType workType, uint256 difficulty);
    event MiningSessionCompleted(uint256 indexed sessionId, address indexed miner, uint256 reward, uint256 tokenReward);
    event Staked(address indexed staker, uint256 amount);
    event Unstaked(address indexed staker, uint256 amount);
    event RewardsClaimed(address indexed staker, uint256 amount, uint256 tokenAmount);
    event Paused(address indexed by);
    event Unpaused(address indexed by);
    event TokenIntegrationEnabled(address indexed tokenAddress);
    event ResearchValueAdded(uint256 indexed blockHeight, address indexed contributor, uint256 researchValue);

    // =============================================================================
    // MODIFIERS
    // =============================================================================

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }

    modifier whenTokenIntegrationEnabled() {
        require(tokenIntegrationEnabled, "Token integration is disabled");
        _;
    }

    // =============================================================================
    // CONSTRUCTOR
    // =============================================================================

    constructor(address _minedTokenAddress) {
        owner = msg.sender;
        tokenIntegrationEnabled = (_minedTokenAddress != address(0));
        
        if (tokenIntegrationEnabled) {
            minedToken = MINEDTokenAsymptoticEnhanced(_minedTokenAddress);
            emit TokenIntegrationEnabled(_minedTokenAddress);
        }
        
        // Initialize research value multipliers
        workTypeResearchMultipliers[WorkType.PRIME_PATTERN_DISCOVERY] = 10;
        workTypeResearchMultipliers[WorkType.RIEMANN_ZERO_COMPUTATION] = 50;
        workTypeResearchMultipliers[WorkType.YANG_MILLS_FIELD_THEORY] = 40;
        workTypeResearchMultipliers[WorkType.GOLDBACH_CONJECTURE_VERIFICATION] = 15;
        workTypeResearchMultipliers[WorkType.NAVIER_STOKES_SIMULATION] = 30;
        workTypeResearchMultipliers[WorkType.BIRCH_SWINNERTON_DYER] = 25;
        workTypeResearchMultipliers[WorkType.ELLIPTIC_CURVE_CRYPTOGRAPHY] = 20;
        workTypeResearchMultipliers[WorkType.LATTICE_CRYPTOGRAPHY] = 35;
        workTypeResearchMultipliers[WorkType.POINCARE_CONJECTURE] = 60;
        workTypeResearchMultipliers[WorkType.QUANTUM_ALGORITHM_OPTIMIZATION] = 45;
        workTypeResearchMultipliers[WorkType.CRYPTOGRAPHIC_PROTOCOL_ANALYSIS] = 18;
        workTypeResearchMultipliers[WorkType.MATHEMATICAL_CONSTANT_VERIFICATION] = 12;
    }

    // =============================================================================
    // CORE MINING FUNCTIONS
    // =============================================================================

    /**
     * @dev Start a new mining session
     * @param _workType The type of mathematical work to perform
     * @param _difficulty The difficulty level for the session
     */
    function startMiningSession(WorkType _workType, uint256 _difficulty) external whenNotPaused {
        require(_difficulty <= maxDifficulty, "Difficulty exceeds maximum");
        require(_difficulty > 0, "Difficulty must be greater than 0");
        
        // Check if miner has active sessions
        uint256 activeSessions = 0;
        for (uint256 i = 0; i < minerSessions[msg.sender].length; i++) {
            uint256 existingSessionId = minerSessions[msg.sender][i];
            if (sessions[existingSessionId].active) {
                activeSessions++;
            }
        }
        require(activeSessions < maxConcurrentSessions, "Too many active sessions");

        sessionCounter++;
        uint256 sessionId = sessionCounter;

        // Calculate research value for this session
        uint256 researchValue = calculateResearchValue(_workType, _difficulty, _difficulty * 100);

        sessions[sessionId] = MiningSession({
            sessionId: sessionId,
            miner: msg.sender,
            workType: _workType,
            startTime: block.timestamp,
            endTime: 0,
            difficulty: _difficulty,
            quantumSecurityLevel: quantumSecurityLevel,
            active: true,
            completed: false,
            computationalPower: _difficulty * 100,
            energyConsumption: _difficulty * 10,
            researchValue: researchValue
        });

        minerSessions[msg.sender].push(sessionId);

        emit MiningSessionStarted(sessionId, msg.sender, _workType, _difficulty);
    }

    /**
     * @dev Complete a mining session and submit discovery
     * @param _sessionId The session ID to complete
     * @param _proofHash Hash of the mathematical proof
     * @param _metadata Additional metadata about the discovery
     */
    function completeMiningSession(
        uint256 _sessionId,
        bytes32 _proofHash,
        string memory _metadata
    ) external whenNotPaused {
        require(sessions[_sessionId].miner == msg.sender, "Not the session miner");
        require(sessions[_sessionId].active, "Session not active");
        require(sessions[_sessionId].completed == false, "Session already completed");

        MiningSession storage session = sessions[_sessionId];
        session.active = false;
        session.completed = true;
        session.endTime = block.timestamp;

        // Calculate reward based on difficulty and time
        uint256 timeSpent = session.endTime - session.startTime;
        uint256 reward = calculateReward(session.difficulty, timeSpent);
        uint256 tokenReward = 0;

        // Create discovery
        discoveryCounter++;
        uint256 discoveryId = discoveryCounter;

        discoveries[discoveryId] = Discovery({
            id: discoveryId,
            miner: msg.sender,
            workType: session.workType,
            difficulty: session.difficulty,
            quantumSecurityLevel: session.quantumSecurityLevel,
            reward: reward,
            tokenReward: tokenReward,
            timestamp: block.timestamp,
            proofHash: _proofHash,
            verified: true, // Simplified - assume verified
            metadata: _metadata,
            computationalComplexity: session.computationalPower,
            impactScore: calculateImpactScore(session.difficulty, session.workType),
            researchValue: session.researchValue
        });

        minerDiscoveries[msg.sender].push(discoveryId);
        totalRewardsDistributed += reward;

        // Handle token integration
        if (tokenIntegrationEnabled) {
            handleTokenRewards(msg.sender, session.researchValue, discoveryId);
        }

        emit MiningSessionCompleted(_sessionId, msg.sender, reward, tokenReward);
        emit DiscoverySubmitted(discoveryId, msg.sender, session.workType, session.difficulty, session.researchValue);
    }

    // =============================================================================
    // TOKEN INTEGRATION FUNCTIONS
    // =============================================================================

    /**
     * @dev Handle token rewards for completed mining sessions
     * @param _miner Address of the miner
     * @param _researchValue Research value of the discovery
     * @param _discoveryId ID of the discovery
     */
    function handleTokenRewards(address _miner, uint256 _researchValue, uint256 _discoveryId) internal {
        // Increment block height
        currentBlockHeight++;
        
        // Add research value to the token contract
        minedToken.addResearchValue(currentBlockHeight, _researchValue, _miner);
        
        // Calculate token reward using asymptotic emission
        uint256 tokenReward = minedToken.calculateAsymptoticEmission(currentBlockHeight, _researchValue);
        
        // Mint mining rewards using asymptotic emission with correct parameters
        minedToken.mintMiningRewards(_miner, tokenReward, currentBlockHeight);
        
        // Update discovery with token reward
        discoveries[_discoveryId].tokenReward = tokenReward;
        totalTokenRewardsDistributed += tokenReward;
        
        // Update total research value
        totalResearchValue += _researchValue;
        
        emit ResearchValueAdded(currentBlockHeight, _miner, _researchValue);
    }

    /**
     * @dev Claim staking rewards with token integration
     */
    function claimStakingRewards() external whenNotPaused whenTokenIntegrationEnabled {
        StakingInfo storage staker = stakingInfo[msg.sender];
        require(staker.isActive, "Not staking");
        
        uint256 totalRewards = staker.rewards + calculatePendingRewards(msg.sender);
        uint256 totalTokenRewards = staker.tokenRewards + calculatePendingTokenRewards(msg.sender);
        
        require(totalRewards > 0 || totalTokenRewards > 0, "No rewards to claim");
        
        staker.rewards = 0;
        staker.tokenRewards = 0;
        staker.lastClaimTime = block.timestamp;
        
        // Transfer ETH rewards
        if (totalRewards > 0) {
            payable(msg.sender).transfer(totalRewards);
        }
        
        // Mint token rewards
        if (totalTokenRewards > 0) {
            currentBlockHeight++;
            minedToken.mintStakingRewards(msg.sender, totalTokenRewards);
        }
        
        emit RewardsClaimed(msg.sender, totalRewards, totalTokenRewards);
    }

    // =============================================================================
    // STAKING FUNCTIONS
    // =============================================================================

    /**
     * @dev Stake tokens to earn rewards
     */
    function stake() external payable whenNotPaused {
        require(msg.value >= minStakeAmount, "Stake amount too low");
        
        StakingInfo storage staker = stakingInfo[msg.sender];
        
        if (staker.isActive) {
            // Calculate and add pending rewards
            uint256 pendingRewards = calculatePendingRewards(msg.sender);
            uint256 pendingTokenRewards = calculatePendingTokenRewards(msg.sender);
            staker.rewards += pendingRewards;
            staker.tokenRewards += pendingTokenRewards;
        }
        
        staker.stakedAmount += msg.value;
        staker.lastClaimTime = block.timestamp;
        staker.isActive = true;
        staker.apy = stakingAPY;
        
        totalStaked += msg.value;
        
        emit Staked(msg.sender, msg.value);
    }

    /**
     * @dev Unstake tokens
     * @param _amount Amount to unstake
     */
    function unstake(uint256 _amount) external whenNotPaused {
        StakingInfo storage staker = stakingInfo[msg.sender];
        require(staker.isActive, "Not staking");
        require(staker.stakedAmount >= _amount, "Insufficient staked amount");
        
        // Calculate and add pending rewards
        uint256 pendingRewards = calculatePendingRewards(msg.sender);
        uint256 pendingTokenRewards = calculatePendingTokenRewards(msg.sender);
        staker.rewards += pendingRewards;
        staker.tokenRewards += pendingTokenRewards;
        
        staker.stakedAmount -= _amount;
        totalStaked -= _amount;
        
        if (staker.stakedAmount == 0) {
            staker.isActive = false;
        }
        
        payable(msg.sender).transfer(_amount);
        
        emit Unstaked(msg.sender, _amount);
    }

    // =============================================================================
    // VIEW FUNCTIONS
    // =============================================================================

    /**
     * @dev Get network statistics with token integration
     */
    function getNetworkStats() external view returns (NetworkStats memory) {
        uint256 activeSessions = 0;
        uint256 totalComplexity = 0;
        
        for (uint256 i = 1; i <= sessionCounter; i++) {
            if (sessions[i].active) {
                activeSessions++;
            }
            totalComplexity += sessions[i].computationalPower;
        }
        
        return NetworkStats({
            totalDiscoveries: discoveryCounter,
            totalSessions: sessionCounter,
            currentActiveSessions: activeSessions,
            maxDifficulty: maxDifficulty,
            baseReward: baseReward,
            quantumSecurityLevel: quantumSecurityLevel,
            totalStaked: totalStaked,
            totalRewardsDistributed: totalRewardsDistributed,
            totalTokenRewardsDistributed: totalTokenRewardsDistributed,
            averageComputationalComplexity: sessionCounter > 0 ? totalComplexity / sessionCounter : 0,
            totalResearchValue: totalResearchValue,
            currentBlockHeight: currentBlockHeight
        });
    }

    /**
     * @dev Get miner statistics with token integration
     * @param _miner Address of the miner
     */
    function getMinerStats(address _miner) external view returns (
        uint256 totalSessions,
        uint256 totalDiscoveries,
        uint256 totalRewards,
        uint256 totalTokenRewards,
        uint256 stakedAmount,
        uint256 pendingRewards,
        uint256 pendingTokenRewards,
        uint256 researchContributions
    ) {
        totalSessions = minerSessions[_miner].length;
        totalDiscoveries = minerDiscoveries[_miner].length;
        
        // Calculate total rewards from discoveries
        totalRewards = 0;
        totalTokenRewards = 0;
        for (uint256 i = 0; i < minerDiscoveries[_miner].length; i++) {
            uint256 discoveryId = minerDiscoveries[_miner][i];
            totalRewards += discoveries[discoveryId].reward;
            totalTokenRewards += discoveries[discoveryId].tokenReward;
        }
        
        stakedAmount = stakingInfo[_miner].stakedAmount;
        pendingRewards = calculatePendingRewards(_miner);
        pendingTokenRewards = calculatePendingTokenRewards(_miner);
        
        if (tokenIntegrationEnabled) {
            researchContributions = minedToken.getUserResearchContributions(_miner);
        }
    }

    // =============================================================================
    // ADMIN FUNCTIONS
    // =============================================================================

    /**
     * @dev Pause the contract
     */
    function pause() external onlyOwner {
        paused = true;
        emit Paused(msg.sender);
    }

    /**
     * @dev Unpause the contract
     */
    function unpause() external onlyOwner {
        paused = false;
        emit Unpaused(msg.sender);
    }

    /**
     * @dev Update mining parameters
     */
    function updateMiningParameters(
        uint256 _maxDifficulty,
        uint256 _baseReward,
        uint256 _quantumSecurityLevel,
        uint256 _maxConcurrentSessions
    ) external onlyOwner {
        maxDifficulty = _maxDifficulty;
        baseReward = _baseReward;
        quantumSecurityLevel = _quantumSecurityLevel;
        maxConcurrentSessions = _maxConcurrentSessions;
    }

    /**
     * @dev Update staking parameters
     */
    function updateStakingParameters(
        uint256 _minStakeAmount,
        uint256 _stakingAPY
    ) external onlyOwner {
        minStakeAmount = _minStakeAmount;
        stakingAPY = _stakingAPY;
    }

    /**
     * @dev Update token integration
     * @param _tokenAddress New token contract address
     */
    function updateTokenIntegration(address _tokenAddress) external onlyOwner {
        if (_tokenAddress == address(0)) {
            tokenIntegrationEnabled = false;
        } else {
            minedToken = MINEDTokenAsymptoticEnhanced(_tokenAddress);
            tokenIntegrationEnabled = true;
            emit TokenIntegrationEnabled(_tokenAddress);
        }
    }

    // =============================================================================
    // INTERNAL FUNCTIONS
    // =============================================================================

    /**
     * @dev Calculate reward based on difficulty and time
     */
    function calculateReward(uint256 _difficulty, uint256 _timeSpent) internal view returns (uint256) {
        uint256 baseRewardAmount = baseReward * _difficulty / 1000;
        uint256 timeMultiplier = _timeSpent > 3600 ? 2 : 1; // Bonus for sessions > 1 hour
        return baseRewardAmount * timeMultiplier;
    }

    /**
     * @dev Calculate research value based on work type and difficulty
     */
    function calculateResearchValue(WorkType _workType, uint256 _difficulty, uint256 _complexity) internal view returns (uint256) {
        uint256 baseValue = _difficulty * _complexity / 1000;
        uint256 multiplier = workTypeResearchMultipliers[_workType];
        return baseValue * multiplier;
    }

    /**
     * @dev Calculate impact score based on difficulty and work type
     */
    function calculateImpactScore(uint256 _difficulty, WorkType _workType) internal pure returns (uint256) {
        uint256 baseScore = _difficulty / 1000;
        uint256 workTypeMultiplier = uint256(_workType) + 1; // Higher work types get higher scores
        return baseScore * workTypeMultiplier;
    }

    /**
     * @dev Calculate pending rewards for a staker
     */
    function calculatePendingRewards(address _staker) internal view returns (uint256) {
        StakingInfo storage staker = stakingInfo[_staker];
        if (!staker.isActive || staker.stakedAmount == 0) {
            return 0;
        }
        
        uint256 timeStaked = block.timestamp - staker.lastClaimTime;
        uint256 annualReward = staker.stakedAmount * staker.apy / 100;
        return annualReward * timeStaked / 365 days;
    }

    /**
     * @dev Calculate pending token rewards for a staker
     */
    function calculatePendingTokenRewards(address _staker) internal view returns (uint256) {
        if (!tokenIntegrationEnabled) {
            return 0;
        }
        
        StakingInfo storage staker = stakingInfo[_staker];
        if (!staker.isActive || staker.stakedAmount == 0) {
            return 0;
        }
        
        // Calculate token rewards based on staking amount and time
        uint256 timeStaked = block.timestamp - staker.lastClaimTime;
        uint256 annualTokenReward = staker.stakedAmount * 50 / 10000; // 0.5% annual token reward
        return annualTokenReward * timeStaked / 365 days;
    }

    // =============================================================================
    // FALLBACK FUNCTIONS
    // =============================================================================

    receive() external payable {
        // Allow receiving ETH for staking
    }

    fallback() external payable {
        // Fallback function
    }
}
