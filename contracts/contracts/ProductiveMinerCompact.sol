// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ProductiveMinerCompact
 * @dev Compact blockchain mining platform with essential exception handling
 * 
 * Optimizations:
 * - Reduced byte size while maintaining core functionality
 * - Essential exception handling for critical operations
 * - Gas-efficient error handling
 * - Streamlined validation
 */
contract ProductiveMinerCompact {
    // =============================================================================
    // CUSTOM ERRORS (Essential only)
    // =============================================================================
    
    error Unauthorized();
    error ContractPaused();
    error InvalidDifficulty();
    error TooManyActiveSessions();
    error SessionNotFound();
    error SessionNotActive();
    error InsufficientStake();
    error NoRewardsToClaim();
    error TransferFailed();
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
        uint256 reward;
        uint256 timestamp;
        bytes32 proofHash;
        bool verified;
        string metadata;
    }

    struct MiningSession {
        uint256 sessionId;
        address miner;
        WorkType workType;
        uint256 startTime;
        uint256 endTime;
        uint256 difficulty;
        bool active;
        bool completed;
    }

    struct StakingInfo {
        uint256 stakedAmount;
        uint256 rewards;
        uint256 lastClaimTime;
        bool isActive;
    }

    // =============================================================================
    // STATE VARIABLES
    // =============================================================================

    // Core parameters
    uint256 public maxDifficulty = 1000000;
    uint256 public baseReward = 1000;
    uint256 public minStakeAmount = 1000;
    uint256 public stakingAPY = 12;
    uint256 public maxConcurrentSessions = 10;

    // Access control
    address public immutable owner;
    bool public paused = false;

    // Mappings
    mapping(uint256 => Discovery) public discoveries;
    mapping(uint256 => MiningSession) public sessions;
    mapping(address => StakingInfo) public stakingInfo;
    mapping(address => uint256[]) public minerSessions;
    mapping(address => uint256[]) public minerDiscoveries;
    mapping(address => uint256) public activeSessionCount;

    // Counters
    uint256 public discoveryCounter = 0;
    uint256 public sessionCounter = 0;
    uint256 public totalStaked = 0;
    uint256 public totalRewardsDistributed = 0;
    uint256 public totalActiveSessions = 0;

    // =============================================================================
    // EVENTS
    // =============================================================================

    event DiscoverySubmitted(uint256 indexed discoveryId, address indexed miner, WorkType indexed workType, uint256 difficulty);
    event MiningSessionStarted(uint256 indexed sessionId, address indexed miner, WorkType indexed workType, uint256 difficulty);
    event MiningSessionCompleted(uint256 indexed sessionId, address indexed miner, uint256 reward);
    event Staked(address indexed staker, uint256 amount);
    event Unstaked(address indexed staker, uint256 amount);
    event RewardsClaimed(address indexed staker, uint256 amount);
    event Paused(address indexed by);
    event Unpaused(address indexed by);

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
        if (uint256(_workType) > 11) revert InvalidParameters();
        _;
    }

    modifier validDifficulty(uint256 _difficulty) {
        if (_difficulty == 0 || _difficulty > maxDifficulty) revert InvalidDifficulty();
        _;
    }

    // =============================================================================
    // CONSTRUCTOR
    // =============================================================================

    constructor() {
        owner = msg.sender;
    }

    // =============================================================================
    // CORE MINING FUNCTIONS (Compact Exception Handling)
    // =============================================================================

    /**
     * @dev Start a new mining session with essential exception handling
     */
    function startMiningSession(WorkType _workType, uint256 _difficulty) external whenNotPaused validWorkType(_workType) validDifficulty(_difficulty) {
        if (activeSessionCount[msg.sender] >= maxConcurrentSessions) revert TooManyActiveSessions();
        
        sessionCounter++;
        uint256 sessionId = sessionCounter;

        sessions[sessionId] = MiningSession({
            sessionId: sessionId,
            miner: msg.sender,
            workType: _workType,
            startTime: block.timestamp,
            endTime: 0,
            difficulty: _difficulty,
            active: true,
            completed: false
        });

        minerSessions[msg.sender].push(sessionId);
        activeSessionCount[msg.sender]++;
        totalActiveSessions++;

        emit MiningSessionStarted(sessionId, msg.sender, _workType, _difficulty);
    }

    /**
     * @dev Complete a mining session with essential exception handling
     */
    function completeMiningSession(uint256 _sessionId, bytes32 _proofHash, string calldata _metadata) external whenNotPaused {
        if (_sessionId == 0 || _sessionId > sessionCounter) revert SessionNotFound();
        
        MiningSession storage session = sessions[_sessionId];
        if (session.miner != msg.sender) revert Unauthorized();
        if (!session.active) revert SessionNotActive();
        if (session.completed) revert InvalidParameters();

        // Update session state
        session.active = false;
        session.completed = true;
        session.endTime = block.timestamp;
        activeSessionCount[msg.sender]--;
        totalActiveSessions--;

        // Calculate reward
        uint256 timeSpent = session.endTime - session.startTime;
        uint256 reward = (baseReward * session.difficulty) / 1000;
        if (timeSpent > 3600) reward *= 2;

        // Create discovery
        discoveryCounter++;
        uint256 discoveryId = discoveryCounter;

        discoveries[discoveryId] = Discovery({
            id: discoveryId,
            miner: msg.sender,
            workType: session.workType,
            difficulty: session.difficulty,
            reward: reward,
            timestamp: block.timestamp,
            proofHash: _proofHash,
            verified: true,
            metadata: _metadata
        });

        minerDiscoveries[msg.sender].push(discoveryId);
        totalRewardsDistributed += reward;

        // Transfer reward with exception handling
        (bool success, ) = payable(msg.sender).call{value: reward}("");
        if (!success) revert TransferFailed();

        emit MiningSessionCompleted(_sessionId, msg.sender, reward);
        emit DiscoverySubmitted(discoveryId, msg.sender, session.workType, session.difficulty);
    }

    // =============================================================================
    // STAKING FUNCTIONS (Compact Exception Handling)
    // =============================================================================

    /**
     * @dev Stake tokens with essential exception handling
     */
    function stake() external payable whenNotPaused {
        if (msg.value < minStakeAmount) revert InsufficientStake();
        
        StakingInfo storage staker = stakingInfo[msg.sender];
        
        // Calculate pending rewards if already staking
        if (staker.isActive) {
            uint256 timeStaked = block.timestamp - staker.lastClaimTime;
            uint256 annualReward = (staker.stakedAmount * stakingAPY) / 100;
            staker.rewards += (annualReward * timeStaked) / 365 days;
        }
        
        staker.stakedAmount += msg.value;
        staker.lastClaimTime = block.timestamp;
        staker.isActive = true;
        totalStaked += msg.value;
        
        emit Staked(msg.sender, msg.value);
    }

    /**
     * @dev Unstake tokens with essential exception handling
     */
    function unstake(uint256 _amount) external whenNotPaused {
        if (_amount == 0) revert InvalidParameters();
        
        StakingInfo storage staker = stakingInfo[msg.sender];
        if (!staker.isActive) revert Unauthorized();
        if (staker.stakedAmount < _amount) revert InsufficientStake();
        
        // Calculate pending rewards
        uint256 timeStaked = block.timestamp - staker.lastClaimTime;
        uint256 annualReward = (staker.stakedAmount * stakingAPY) / 100;
        staker.rewards += (annualReward * timeStaked) / 365 days;
        
        staker.stakedAmount -= _amount;
        totalStaked -= _amount;
        
        if (staker.stakedAmount == 0) {
            staker.isActive = false;
        }
        
        // Transfer with exception handling
        (bool success, ) = payable(msg.sender).call{value: _amount}("");
        if (!success) revert TransferFailed();
        
        emit Unstaked(msg.sender, _amount);
    }

    /**
     * @dev Claim staking rewards with essential exception handling
     */
    function claimRewards() external whenNotPaused {
        StakingInfo storage staker = stakingInfo[msg.sender];
        if (!staker.isActive) revert Unauthorized();
        
        uint256 timeStaked = block.timestamp - staker.lastClaimTime;
        uint256 annualReward = (staker.stakedAmount * stakingAPY) / 100;
        uint256 pendingRewards = (annualReward * timeStaked) / 365 days;
        uint256 totalRewards = staker.rewards + pendingRewards;
        
        if (totalRewards == 0) revert NoRewardsToClaim();
        
        staker.rewards = 0;
        staker.lastClaimTime = block.timestamp;
        
        // Transfer with exception handling
        (bool success, ) = payable(msg.sender).call{value: totalRewards}("");
        if (!success) revert TransferFailed();
        
        emit RewardsClaimed(msg.sender, totalRewards);
    }

    // =============================================================================
    // VIEW FUNCTIONS
    // =============================================================================

    function getMinerStats(address _miner) external view returns (
        uint256 totalSessions,
        uint256 totalDiscoveries,
        uint256 totalRewards,
        uint256 stakedAmount,
        uint256 pendingRewards
    ) {
        totalSessions = minerSessions[_miner].length;
        totalDiscoveries = minerDiscoveries[_miner].length;
        
        totalRewards = 0;
        uint256[] storage minerDiscoveryIds = minerDiscoveries[_miner];
        uint256 length = minerDiscoveryIds.length;
        for (uint256 i = 0; i < length;) {
            totalRewards += discoveries[minerDiscoveryIds[i]].reward;
            unchecked { ++i; }
        }
        
        stakedAmount = stakingInfo[_miner].stakedAmount;
        
        StakingInfo storage staker = stakingInfo[_miner];
        if (staker.isActive && staker.stakedAmount > 0) {
            uint256 timeStaked = block.timestamp - staker.lastClaimTime;
            uint256 annualReward = (staker.stakedAmount * stakingAPY) / 100;
            pendingRewards = (annualReward * timeStaked) / 365 days;
        }
    }

    function getSessionInfo(uint256 _sessionId) external view returns (MiningSession memory) {
        return sessions[_sessionId];
    }

    function getDiscoveryInfo(uint256 _discoveryId) external view returns (Discovery memory) {
        return discoveries[_discoveryId];
    }

    function getStakingInfo(address _staker) external view returns (StakingInfo memory) {
        return stakingInfo[_staker];
    }

    // =============================================================================
    // ADMIN FUNCTIONS
    // =============================================================================

    function pause() external onlyOwner {
        paused = true;
        emit Paused(msg.sender);
    }

    function unpause() external onlyOwner {
        paused = false;
        emit Unpaused(msg.sender);
    }

    function updateParameters(
        uint256 _maxDifficulty,
        uint256 _baseReward,
        uint256 _maxConcurrentSessions
    ) external onlyOwner {
        if (_maxDifficulty == 0 || _baseReward == 0 || _maxConcurrentSessions == 0) revert InvalidParameters();
        
        maxDifficulty = _maxDifficulty;
        baseReward = _baseReward;
        maxConcurrentSessions = _maxConcurrentSessions;
    }

    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        if (balance > 0) {
            (bool success, ) = payable(owner).call{value: balance}("");
            if (!success) revert TransferFailed();
        }
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
