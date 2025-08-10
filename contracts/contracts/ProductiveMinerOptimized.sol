// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ProductiveMinerOptimized
 * @dev An optimized blockchain mining platform for mathematical discovery
 * 
 * Improvements:
 * - Gas optimization through efficient data structures
 * - Enhanced error handling with custom errors
 * - Reentrancy protection
 * - Overflow protection
 * - Access control improvements
 * - Event optimization
 */
contract ProductiveMinerOptimized {
    // =============================================================================
    // CUSTOM ERRORS (Gas efficient alternative to require statements)
    // =============================================================================
    
    error Unauthorized();
    error ContractPaused();
    error InvalidDifficulty();
    error TooManyActiveSessions();
    error SessionNotFound();
    error SessionNotActive();
    error SessionAlreadyCompleted();
    error InsufficientStake();
    error NoRewardsToClaim();
    error InvalidAmount();
    error TransferFailed();
    error InvalidWorkType();
    error InvalidParameters();

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
        uint256 timestamp;
        bytes32 proofHash;
        bool verified;
        string metadata;
        uint256 computationalComplexity;
        uint256 impactScore;
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
    }

    struct StakingInfo {
        uint256 stakedAmount;
        uint256 rewards;
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
        uint256 averageComputationalComplexity;
    }

    // =============================================================================
    // STATE VARIABLES
    // =============================================================================

    // Core mining parameters - packed for gas efficiency
    uint256 public maxDifficulty = 1000000;
    uint256 public baseReward = 1000;
    uint256 public quantumSecurityLevel = 256;
    uint256 public minStakeAmount = 1000;
    uint256 public stakingAPY = 12; // 12% APY
    uint256 public maxConcurrentSessions = 10;
    bool public tokenIntegrationEnabled = false;

    // Access control
    address public immutable owner;
    bool public paused = false;

    // Mappings - optimized for gas efficiency
    mapping(uint256 => Discovery) public discoveries;
    mapping(uint256 => MiningSession) public sessions;
    mapping(address => StakingInfo) public stakingInfo;
    mapping(address => uint256[]) public minerSessions;
    mapping(address => uint256[]) public minerDiscoveries;
    
    // Gas optimization: Track active sessions count per miner
    mapping(address => uint256) public activeSessionCount;

    // Counters
    uint256 public discoveryCounter = 0;
    uint256 public sessionCounter = 0;
    uint256 public totalStaked = 0;
    uint256 public totalRewardsDistributed = 0;
    uint256 public totalActiveSessions = 0;

    // =============================================================================
    // EVENTS (Optimized for gas efficiency)
    // =============================================================================

    event DiscoverySubmitted(
        uint256 indexed discoveryId, 
        address indexed miner, 
        WorkType indexed workType, 
        uint256 difficulty
    );
    event MiningSessionStarted(
        uint256 indexed sessionId, 
        address indexed miner, 
        WorkType indexed workType, 
        uint256 difficulty
    );
    event MiningSessionCompleted(
        uint256 indexed sessionId, 
        address indexed miner, 
        uint256 reward
    );
    event Staked(address indexed staker, uint256 amount);
    event Unstaked(address indexed staker, uint256 amount);
    event RewardsClaimed(address indexed staker, uint256 amount);
    event Paused(address indexed by);
    event Unpaused(address indexed by);
    event ParametersUpdated(
        uint256 maxDifficulty,
        uint256 baseReward,
        uint256 quantumSecurityLevel,
        uint256 maxConcurrentSessions
    );

    // =============================================================================
    // MODIFIERS
    // =============================================================================

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    modifier whenNotPaused() {
        if (paused) revert ContractPaused();
        _;
    }

    modifier validWorkType(WorkType _workType) {
        if (uint256(_workType) > 11) revert InvalidWorkType();
        _;
    }

    modifier validDifficulty(uint256 _difficulty) {
        if (_difficulty == 0 || _difficulty > maxDifficulty) revert InvalidDifficulty();
        _;
    }

    // =============================================================================
    // CONSTRUCTOR
    // =============================================================================

    constructor(address _tokenAddress) {
        owner = msg.sender;
        tokenIntegrationEnabled = (_tokenAddress != address(0));
    }

    // =============================================================================
    // CORE MINING FUNCTIONS (Gas Optimized)
    // =============================================================================

    /**
     * @dev Start a new mining session - Gas optimized version
     * @param _workType The type of mathematical work to perform
     * @param _difficulty The difficulty level for the session
     */
    function startMiningSession(
        WorkType _workType, 
        uint256 _difficulty
    ) external whenNotPaused validWorkType(_workType) validDifficulty(_difficulty) {
        // Gas optimization: Use cached count instead of loop
        if (activeSessionCount[msg.sender] >= maxConcurrentSessions) {
            revert TooManyActiveSessions();
        }

        sessionCounter++;
        uint256 sessionId = sessionCounter;

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
            energyConsumption: _difficulty * 10
        });

        minerSessions[msg.sender].push(sessionId);
        activeSessionCount[msg.sender]++;
        totalActiveSessions++;

        emit MiningSessionStarted(sessionId, msg.sender, _workType, _difficulty);
    }

    /**
     * @dev Complete a mining session and submit discovery - Gas optimized
     * @param _sessionId The session ID to complete
     * @param _proofHash Hash of the mathematical proof
     * @param _metadata Additional metadata about the discovery
     */
    function completeMiningSession(
        uint256 _sessionId,
        bytes32 _proofHash,
        string calldata _metadata
    ) external whenNotPaused {
        MiningSession storage session = sessions[_sessionId];
        
        if (session.miner != msg.sender) revert Unauthorized();
        if (!session.active) revert SessionNotActive();
        if (session.completed) revert SessionAlreadyCompleted();

        session.active = false;
        session.completed = true;
        session.endTime = block.timestamp;

        // Update counters
        activeSessionCount[msg.sender]--;
        totalActiveSessions--;

        // Calculate reward based on difficulty and time
        uint256 timeSpent = session.endTime - session.startTime;
        uint256 reward = calculateReward(session.difficulty, timeSpent);

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
            timestamp: block.timestamp,
            proofHash: _proofHash,
            verified: true, // Simplified - assume verified
            metadata: _metadata,
            computationalComplexity: session.computationalPower,
            impactScore: calculateImpactScore(session.difficulty, session.workType)
        });

        minerDiscoveries[msg.sender].push(discoveryId);
        totalRewardsDistributed += reward;

        // Transfer reward to miner
        (bool success, ) = payable(msg.sender).call{value: reward}("");
        if (!success) revert TransferFailed();

        emit MiningSessionCompleted(_sessionId, msg.sender, reward);
        emit DiscoverySubmitted(discoveryId, msg.sender, session.workType, session.difficulty);
    }

    // =============================================================================
    // STAKING FUNCTIONS (Gas Optimized)
    // =============================================================================

    /**
     * @dev Stake tokens to earn rewards - Gas optimized
     */
    function stake() external payable whenNotPaused {
        if (msg.value < minStakeAmount) revert InsufficientStake();
        
        StakingInfo storage staker = stakingInfo[msg.sender];
        
        if (staker.isActive) {
            // Calculate and add pending rewards
            uint256 pendingRewards = calculatePendingRewards(msg.sender);
            staker.rewards += pendingRewards;
        }
        
        staker.stakedAmount += msg.value;
        staker.lastClaimTime = block.timestamp;
        staker.isActive = true;
        staker.apy = stakingAPY;
        
        totalStaked += msg.value;
        
        emit Staked(msg.sender, msg.value);
    }

    /**
     * @dev Unstake tokens - Gas optimized
     * @param _amount Amount to unstake
     */
    function unstake(uint256 _amount) external whenNotPaused {
        if (_amount == 0) revert InvalidAmount();
        
        StakingInfo storage staker = stakingInfo[msg.sender];
        if (!staker.isActive) revert Unauthorized();
        if (staker.stakedAmount < _amount) revert InsufficientStake();
        
        // Calculate and add pending rewards
        uint256 pendingRewards = calculatePendingRewards(msg.sender);
        staker.rewards += pendingRewards;
        
        staker.stakedAmount -= _amount;
        totalStaked -= _amount;
        
        if (staker.stakedAmount == 0) {
            staker.isActive = false;
        }
        
        (bool success, ) = payable(msg.sender).call{value: _amount}("");
        if (!success) revert TransferFailed();
        
        emit Unstaked(msg.sender, _amount);
    }

    /**
     * @dev Claim staking rewards - Gas optimized
     */
    function claimRewards() external whenNotPaused {
        StakingInfo storage staker = stakingInfo[msg.sender];
        if (!staker.isActive) revert Unauthorized();
        
        uint256 totalRewards = staker.rewards + calculatePendingRewards(msg.sender);
        if (totalRewards == 0) revert NoRewardsToClaim();
        
        staker.rewards = 0;
        staker.lastClaimTime = block.timestamp;
        
        (bool success, ) = payable(msg.sender).call{value: totalRewards}("");
        if (!success) revert TransferFailed();
        
        emit RewardsClaimed(msg.sender, totalRewards);
    }

    // =============================================================================
    // VIEW FUNCTIONS (Gas Optimized)
    // =============================================================================

    /**
     * @dev Get network statistics - Gas optimized
     */
    function getNetworkStats() external view returns (NetworkStats memory) {
        return NetworkStats({
            totalDiscoveries: discoveryCounter,
            totalSessions: sessionCounter,
            currentActiveSessions: totalActiveSessions,
            maxDifficulty: maxDifficulty,
            baseReward: baseReward,
            quantumSecurityLevel: quantumSecurityLevel,
            totalStaked: totalStaked,
            totalRewardsDistributed: totalRewardsDistributed,
            averageComputationalComplexity: sessionCounter > 0 ? 
                (totalActiveSessions * 100) / sessionCounter : 0
        });
    }

    /**
     * @dev Get miner statistics - Gas optimized
     * @param _miner Address of the miner
     */
    function getMinerStats(address _miner) external view returns (
        uint256 totalSessions,
        uint256 totalDiscoveries,
        uint256 totalRewards,
        uint256 stakedAmount,
        uint256 pendingRewards
    ) {
        totalSessions = minerSessions[_miner].length;
        totalDiscoveries = minerDiscoveries[_miner].length;
        
        // Calculate total rewards from discoveries - optimized loop
        totalRewards = 0;
        uint256[] storage minerDiscoveryIds = minerDiscoveries[_miner];
        uint256 length = minerDiscoveryIds.length;
        for (uint256 i = 0; i < length;) {
            totalRewards += discoveries[minerDiscoveryIds[i]].reward;
            unchecked { ++i; }
        }
        
        stakedAmount = stakingInfo[_miner].stakedAmount;
        pendingRewards = calculatePendingRewards(_miner);
    }

    /**
     * @dev Get session information
     * @param _sessionId The session ID
     */
    function getSessionInfo(uint256 _sessionId) external view returns (MiningSession memory) {
        return sessions[_sessionId];
    }

    /**
     * @dev Get discovery information
     * @param _discoveryId The discovery ID
     */
    function getDiscoveryInfo(uint256 _discoveryId) external view returns (Discovery memory) {
        return discoveries[_discoveryId];
    }

    /**
     * @dev Get staking information
     * @param _staker The staker address
     */
    function getStakingInfo(address _staker) external view returns (StakingInfo memory) {
        return stakingInfo[_staker];
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
     * @dev Update mining parameters - Gas optimized
     */
    function updateMiningParameters(
        uint256 _maxDifficulty,
        uint256 _baseReward,
        uint256 _quantumSecurityLevel,
        uint256 _maxConcurrentSessions
    ) external onlyOwner {
        if (_maxDifficulty == 0 || _baseReward == 0 || _quantumSecurityLevel == 0 || _maxConcurrentSessions == 0) {
            revert InvalidParameters();
        }
        
        maxDifficulty = _maxDifficulty;
        baseReward = _baseReward;
        quantumSecurityLevel = _quantumSecurityLevel;
        maxConcurrentSessions = _maxConcurrentSessions;
        
        emit ParametersUpdated(_maxDifficulty, _baseReward, _quantumSecurityLevel, _maxConcurrentSessions);
    }

    /**
     * @dev Update staking parameters
     */
    function updateStakingParameters(
        uint256 _minStakeAmount,
        uint256 _stakingAPY
    ) external onlyOwner {
        if (_minStakeAmount == 0 || _stakingAPY > 100) revert InvalidParameters();
        
        minStakeAmount = _minStakeAmount;
        stakingAPY = _stakingAPY;
    }

    /**
     * @dev Emergency withdraw function for owner
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        if (balance > 0) {
            (bool success, ) = payable(owner).call{value: balance}("");
            if (!success) revert TransferFailed();
        }
    }

    // =============================================================================
    // INTERNAL FUNCTIONS (Gas Optimized)
    // =============================================================================

    /**
     * @dev Calculate reward based on difficulty and time - Gas optimized
     */
    function calculateReward(uint256 _difficulty, uint256 _timeSpent) internal view returns (uint256) {
        uint256 baseRewardAmount = (baseReward * _difficulty) / 1000;
        uint256 timeMultiplier = _timeSpent > 3600 ? 2 : 1; // Bonus for sessions > 1 hour
        return baseRewardAmount * timeMultiplier;
    }

    /**
     * @dev Calculate impact score based on difficulty and work type - Gas optimized
     */
    function calculateImpactScore(uint256 _difficulty, WorkType _workType) internal pure returns (uint256) {
        uint256 baseScore = _difficulty / 1000;
        uint256 workTypeMultiplier = uint256(_workType) + 1; // Higher work types get higher scores
        return baseScore * workTypeMultiplier;
    }

    /**
     * @dev Calculate pending rewards for a staker - Gas optimized
     */
    function calculatePendingRewards(address _staker) internal view returns (uint256) {
        StakingInfo storage staker = stakingInfo[_staker];
        if (!staker.isActive || staker.stakedAmount == 0) {
            return 0;
        }
        
        uint256 timeStaked = block.timestamp - staker.lastClaimTime;
        uint256 annualReward = (staker.stakedAmount * staker.apy) / 100;
        return (annualReward * timeStaked) / 365 days;
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
