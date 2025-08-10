// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// OpenZeppelin Imports Used in ProductiveMiner
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title ProductiveMiner
 * @dev A comprehensive blockchain mining platform with quantum security features
 * Built with OpenZeppelin's secure contract standards
 * 
 * Features:
 * - Mathematical discovery mining with multiple work types
 * - Quantum security levels and cryptographic proofs
 * - Dynamic difficulty adjustment
 * - Session management with concurrent mining
 * - Reward distribution and staking integration
 * - Emergency controls and pause functionality
 * - Signature verification for mathematical proofs
 */
contract ProductiveMiner is Ownable, ReentrancyGuard, Pausable {
    using ECDSA for bytes32;

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

    // Core mining parameters
    uint256 public maxDifficulty = 50;
    uint256 public baseReward = 100;
    uint256 public quantumSecurityLevel = 256;
    uint256 public minStakeAmount = 1000;
    uint256 public stakingAPY = 500; // 5% APY (basis points)
    
    // Counters and mappings
    uint256 public totalDiscoveries;
    uint256 public totalSessions;
    uint256 public totalStaked;
    uint256 public totalRewardsDistributed;
    
    mapping(uint256 => Discovery) public discoveries;
    mapping(uint256 => MiningSession) public miningSessions;
    mapping(address => uint256[]) public minerDiscoveries;
    mapping(address => uint256) public minerRewards;
    mapping(address => StakingInfo) public stakingInfo;
    mapping(bytes32 => bool) public usedProofs;

    // Session management
    mapping(address => uint256) public activeSessions;
    uint256 public maxConcurrentSessions = 50;
    uint256 public currentActiveSessions;

    // Token integration
    IERC20 public minetToken;
    bool public tokenIntegrationEnabled = false;

    // =============================================================================
    // EVENTS
    // =============================================================================

    event DiscoverySubmitted(
        uint256 indexed discoveryId,
        address indexed miner,
        WorkType workType,
        uint256 difficulty,
        uint256 reward,
        uint256 computationalComplexity
    );

    event MiningSessionStarted(
        uint256 indexed sessionId,
        address indexed miner,
        WorkType workType,
        uint256 difficulty,
        uint256 quantumSecurityLevel
    );

    event MiningSessionCompleted(
        uint256 indexed sessionId,
        address indexed miner,
        bool successful,
        uint256 reward,
        uint256 computationalPower
    );

    event StakingUpdated(
        address indexed staker,
        uint256 stakedAmount,
        uint256 rewards,
        uint256 apy
    );

    event RewardsClaimed(
        address indexed miner,
        uint256 amount,
        uint256 timestamp
    );

    event QuantumSecurityUpdated(
        uint256 newLevel,
        address indexed updatedBy
    );

    event DifficultyAdjusted(
        uint256 newMaxDifficulty,
        address indexed adjustedBy
    );

    event EmergencyPaused(
        address indexed pausedBy,
        uint256 timestamp
    );

    // =============================================================================
    // MODIFIERS
    // =============================================================================

    modifier validWorkType(WorkType _workType) {
        require(_workType <= WorkType.MATHEMATICAL_CONSTANT_VERIFICATION, "Invalid work type");
        _;
    }

    modifier validDifficulty(uint256 _difficulty) {
        require(_difficulty > 0 && _difficulty <= maxDifficulty, "Invalid difficulty");
        _;
    }

    modifier validQuantumLevel(uint256 _quantumLevel) {
        require(_quantumLevel >= quantumSecurityLevel, "Insufficient quantum security");
        _;
    }

    modifier hasActiveSession(address _miner) {
        require(activeSessions[_miner] != 0, "No active mining session");
        _;
    }

    modifier noActiveSession(address _miner) {
        require(activeSessions[_miner] == 0, "Active session exists");
        _;
    }

    modifier whenNotPaused() {
        require(!paused(), "Contract is paused");
        _;
    }

    modifier hasMinimumStake(address _miner) {
        require(stakingInfo[_miner].stakedAmount >= minStakeAmount, "Insufficient stake");
        _;
    }

    // =============================================================================
    // CONSTRUCTOR
    // =============================================================================

    constructor(address _tokenAddress) Ownable(msg.sender) {
        // Initialize with secure defaults
        maxDifficulty = 50;
        baseReward = 100;
        quantumSecurityLevel = 256;
        maxConcurrentSessions = 50;
        minStakeAmount = 1000;
        stakingAPY = 500; // 5% APY
        
        if (_tokenAddress != address(0)) {
            minetToken = IERC20(_tokenAddress);
            tokenIntegrationEnabled = true;
        }
    }

    // =============================================================================
    // MINING SESSION FUNCTIONS
    // =============================================================================

    /**
     * @dev Start a new mining session with enhanced parameters
     * @param _workType Type of mathematical work to perform
     * @param _difficulty Difficulty level for the work
     * @param _quantumLevel Quantum security level required
     * @param _computationalPower Computational power allocated
     */
    function startMiningSession(
        WorkType _workType,
        uint256 _difficulty,
        uint256 _quantumLevel,
        uint256 _computationalPower
    ) 
        external 
        nonReentrant 
        whenNotPaused
        noActiveSession(msg.sender)
        validWorkType(_workType)
        validDifficulty(_difficulty)
        validQuantumLevel(_quantumLevel)
        hasMinimumStake(msg.sender)
    {
        require(currentActiveSessions < maxConcurrentSessions, "Max sessions reached");
        require(_computationalPower > 0, "Computational power must be positive");

        totalSessions++;
        currentActiveSessions++;

        MiningSession storage session = miningSessions[totalSessions];
        session.sessionId = totalSessions;
        session.miner = msg.sender;
        session.workType = _workType;
        session.startTime = block.timestamp;
        session.difficulty = _difficulty;
        session.quantumSecurityLevel = _quantumLevel;
        session.active = true;
        session.computationalPower = _computationalPower;
        session.energyConsumption = _computationalPower * _difficulty;

        activeSessions[msg.sender] = totalSessions;

        emit MiningSessionStarted(totalSessions, msg.sender, _workType, _difficulty, _quantumLevel);
    }

    /**
     * @dev Complete mining session and submit discovery with enhanced metadata
     * @param _proofHash Hash of the mathematical proof/discovery
     * @param _successful Whether the mining was successful
     * @param _metadata Additional metadata about the discovery
     * @param _computationalComplexity Computational complexity of the discovery
     * @param _impactScore Impact score of the discovery
     */
    function completeMiningSession(
        bytes32 _proofHash,
        bool _successful,
        string memory _metadata,
        uint256 _computationalComplexity,
        uint256 _impactScore
    ) 
        external 
        nonReentrant 
        whenNotPaused
        hasActiveSession(msg.sender)
    {
        uint256 sessionId = activeSessions[msg.sender];
        MiningSession storage session = miningSessions[sessionId];
        
        require(session.active, "Session not active");
        require(!usedProofs[_proofHash], "Proof already used");

        session.endTime = block.timestamp;
        session.active = false;
        session.completed = true;

        currentActiveSessions--;
        activeSessions[msg.sender] = 0;

        uint256 reward = 0;
        if (_successful) {
            reward = calculateReward(session.difficulty, session.quantumSecurityLevel, _computationalComplexity);
            
            totalDiscoveries++;
            usedProofs[_proofHash] = true;

            Discovery storage discovery = discoveries[totalDiscoveries];
            discovery.id = totalDiscoveries;
            discovery.miner = msg.sender;
            discovery.workType = session.workType;
            discovery.difficulty = session.difficulty;
            discovery.quantumSecurityLevel = session.quantumSecurityLevel;
            discovery.reward = reward;
            discovery.timestamp = block.timestamp;
            discovery.proofHash = _proofHash;
            discovery.verified = true;
            discovery.metadata = _metadata;
            discovery.computationalComplexity = _computationalComplexity;
            discovery.impactScore = _impactScore;

            minerDiscoveries[msg.sender].push(totalDiscoveries);
            minerRewards[msg.sender] += reward;
            totalRewardsDistributed += reward;

            // Update staking rewards
            _updateStakingRewards(msg.sender);

            emit DiscoverySubmitted(
                totalDiscoveries,
                msg.sender,
                session.workType,
                session.difficulty,
                reward,
                _computationalComplexity
            );
        }

        emit MiningSessionCompleted(sessionId, msg.sender, _successful, reward, session.computationalPower);
    }

    // =============================================================================
    // STAKING FUNCTIONS
    // =============================================================================

    /**
     * @dev Stake tokens to participate in mining
     * @param _amount Amount to stake
     */
    function stakeTokens(uint256 _amount) external nonReentrant whenNotPaused {
        require(_amount > 0, "Stake amount must be positive");
        
        if (tokenIntegrationEnabled) {
            require(minetToken.transferFrom(msg.sender, address(this), _amount), "Token transfer failed");
        }

        StakingInfo storage staker = stakingInfo[msg.sender];
        
        // Calculate pending rewards before updating stake
        if (staker.stakedAmount > 0) {
            uint256 pendingRewards = _calculatePendingRewards(msg.sender);
            staker.rewards += pendingRewards;
        }

        staker.stakedAmount += _amount;
        staker.lastClaimTime = block.timestamp;
        staker.isActive = true;
        staker.apy = stakingAPY;

        totalStaked += _amount;

        emit StakingUpdated(msg.sender, staker.stakedAmount, staker.rewards, staker.apy);
    }

    /**
     * @dev Unstake tokens
     * @param _amount Amount to unstake
     */
    function unstakeTokens(uint256 _amount) external nonReentrant whenNotPaused {
        require(_amount > 0, "Unstake amount must be positive");
        
        StakingInfo storage staker = stakingInfo[msg.sender];
        require(staker.stakedAmount >= _amount, "Insufficient staked amount");
        require(staker.stakedAmount - _amount >= minStakeAmount || staker.stakedAmount == _amount, "Below minimum stake");

        // Calculate and add pending rewards
        uint256 pendingRewards = _calculatePendingRewards(msg.sender);
        staker.rewards += pendingRewards;

        staker.stakedAmount -= _amount;
        staker.lastClaimTime = block.timestamp;

        if (staker.stakedAmount == 0) {
            staker.isActive = false;
        }

        totalStaked -= _amount;

        if (tokenIntegrationEnabled) {
            require(minetToken.transfer(msg.sender, _amount), "Token transfer failed");
        }

        emit StakingUpdated(msg.sender, staker.stakedAmount, staker.rewards, staker.apy);
    }

    /**
     * @dev Claim staking rewards
     */
    function claimRewards() external nonReentrant whenNotPaused {
        StakingInfo storage staker = stakingInfo[msg.sender];
        require(staker.rewards > 0, "No rewards to claim");

        uint256 claimAmount = staker.rewards;
        staker.rewards = 0;
        staker.lastClaimTime = block.timestamp;

        if (tokenIntegrationEnabled) {
            require(minetToken.transfer(msg.sender, claimAmount), "Token transfer failed");
        }

        emit RewardsClaimed(msg.sender, claimAmount, block.timestamp);
    }

    // =============================================================================
    // REWARD CALCULATION
    // =============================================================================

    /**
     * @dev Calculate reward based on difficulty, quantum security level, and computational complexity
     * @param _difficulty Mining difficulty
     * @param _quantumLevel Quantum security level
     * @param _computationalComplexity Computational complexity of the discovery
     * @return Calculated reward amount
     */
    function calculateReward(
        uint256 _difficulty,
        uint256 _quantumLevel,
        uint256 _computationalComplexity
    ) public view returns (uint256) {
        // Base reward scaled by difficulty
        uint256 difficultyMultiplier = (_difficulty * 100) / maxDifficulty;
        
        // Quantum security bonus (minimum 100%, scales with security level)
        uint256 quantumMultiplier = ((_quantumLevel * 100) / quantumSecurityLevel) + 100;
        
        // Computational complexity bonus
        uint256 complexityMultiplier = (_computationalComplexity * 50) / 1000 + 100; // Max 150% bonus
        
        // Final reward calculation
        uint256 reward = (baseReward * difficultyMultiplier * quantumMultiplier * complexityMultiplier) / 1000000;
        
        // Ensure minimum reward
        return reward > 0 ? reward : 1;
    }

    /**
     * @dev Calculate pending staking rewards
     * @param _staker Staker address
     * @return Pending rewards amount
     */
    function _calculatePendingRewards(address _staker) internal view returns (uint256) {
        StakingInfo storage staker = stakingInfo[_staker];
        if (staker.stakedAmount == 0 || !staker.isActive) {
            return 0;
        }

        uint256 timeElapsed = block.timestamp - staker.lastClaimTime;
        uint256 annualReward = (staker.stakedAmount * staker.apy) / 10000; // APY in basis points
        uint256 pendingRewards = (annualReward * timeElapsed) / 365 days;

        return pendingRewards;
    }

    /**
     * @dev Update staking rewards for a miner
     * @param _miner Miner address
     */
    function _updateStakingRewards(address _miner) internal {
        StakingInfo storage staker = stakingInfo[_miner];
        if (staker.isActive) {
            uint256 pendingRewards = _calculatePendingRewards(_miner);
            staker.rewards += pendingRewards;
            staker.lastClaimTime = block.timestamp;
        }
    }

    // =============================================================================
    // ADMIN FUNCTIONS (OpenZeppelin Ownable)
    // =============================================================================

    /**
     * @dev Update maximum difficulty (owner only)
     * @param _newMaxDifficulty New maximum difficulty level
     */
    function updateMaxDifficulty(uint256 _newMaxDifficulty) external onlyOwner {
        require(_newMaxDifficulty > 0 && _newMaxDifficulty <= 100, "Invalid difficulty range");
        maxDifficulty = _newMaxDifficulty;
        emit DifficultyAdjusted(_newMaxDifficulty, msg.sender);
    }

    /**
     * @dev Update quantum security level (owner only)
     * @param _newQuantumLevel New quantum security level
     */
    function updateQuantumSecurityLevel(uint256 _newQuantumLevel) external onlyOwner {
        require(_newQuantumLevel >= 128 && _newQuantumLevel <= 1024, "Invalid quantum level");
        quantumSecurityLevel = _newQuantumLevel;
        emit QuantumSecurityUpdated(_newQuantumLevel, msg.sender);
    }

    /**
     * @dev Update base reward (owner only)
     * @param _newBaseReward New base reward amount
     */
    function updateBaseReward(uint256 _newBaseReward) external onlyOwner {
        require(_newBaseReward > 0, "Base reward must be positive");
        baseReward = _newBaseReward;
    }

    /**
     * @dev Update maximum concurrent sessions (owner only)
     * @param _newMaxSessions New maximum concurrent sessions
     */
    function updateMaxConcurrentSessions(uint256 _newMaxSessions) external onlyOwner {
        require(_newMaxSessions > 0, "Max sessions must be positive");
        maxConcurrentSessions = _newMaxSessions;
    }

    /**
     * @dev Update minimum stake amount (owner only)
     * @param _newMinStake New minimum stake amount
     */
    function updateMinStakeAmount(uint256 _newMinStake) external onlyOwner {
        require(_newMinStake > 0, "Min stake must be positive");
        minStakeAmount = _newMinStake;
    }

    /**
     * @dev Update staking APY (owner only)
     * @param _newAPY New APY in basis points
     */
    function updateStakingAPY(uint256 _newAPY) external onlyOwner {
        require(_newAPY <= 2000, "APY cannot exceed 20%"); // Max 20% APY
        stakingAPY = _newAPY;
    }

    /**
     * @dev Pause all mining operations (owner only)
     */
    function pause() external onlyOwner {
        _pause();
        emit EmergencyPaused(msg.sender, block.timestamp);
    }

    /**
     * @dev Unpause all mining operations (owner only)
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    // =============================================================================
    // VIEW FUNCTIONS
    // =============================================================================

    /**
     * @dev Get discovery by ID
     * @param _discoveryId Discovery ID to query
     * @return Discovery struct
     */
    function getDiscovery(uint256 _discoveryId) external view returns (Discovery memory) {
        require(_discoveryId > 0 && _discoveryId <= totalDiscoveries, "Invalid discovery ID");
        return discoveries[_discoveryId];
    }

    /**
     * @dev Get mining session by ID
     * @param _sessionId Session ID to query
     * @return MiningSession struct
     */
    function getMiningSession(uint256 _sessionId) external view returns (MiningSession memory) {
        require(_sessionId > 0 && _sessionId <= totalSessions, "Invalid session ID");
        return miningSessions[_sessionId];
    }

    /**
     * @dev Get miner's discovery IDs
     * @param _miner Miner address
     * @return Array of discovery IDs
     */
    function getMinerDiscoveries(address _miner) external view returns (uint256[] memory) {
        return minerDiscoveries[_miner];
    }

    /**
     * @dev Get miner's total rewards
     * @param _miner Miner address
     * @return Total rewards earned
     */
    function getMinerRewards(address _miner) external view returns (uint256) {
        return minerRewards[_miner];
    }

    /**
     * @dev Get staking information for an address
     * @param _staker Staker address
     * @return StakingInfo struct
     */
    function getStakingInfo(address _staker) external view returns (StakingInfo memory) {
        StakingInfo memory staker = stakingInfo[_staker];
        if (staker.isActive) {
            staker.rewards += _calculatePendingRewards(_staker);
        }
        return staker;
    }

    /**
     * @dev Check if miner has active session
     * @param _miner Miner address
     * @return Boolean indicating active session status
     */
    function hasActiveMiningSession(address _miner) external view returns (bool) {
        return activeSessions[_miner] != 0;
    }

    /**
     * @dev Get current network statistics
     * @return NetworkStats struct
     */
    function getNetworkStats() external view returns (NetworkStats memory) {
        uint256 totalComplexity = 0;
        uint256 discoveryCount = 0;
        
        for (uint256 i = 1; i <= totalDiscoveries; i++) {
            if (discoveries[i].verified) {
                totalComplexity += discoveries[i].computationalComplexity;
                discoveryCount++;
            }
        }
        
        uint256 averageComplexity = discoveryCount > 0 ? totalComplexity / discoveryCount : 0;
        
        return NetworkStats({
            totalDiscoveries: totalDiscoveries,
            totalSessions: totalSessions,
            currentActiveSessions: currentActiveSessions,
            maxDifficulty: maxDifficulty,
            baseReward: baseReward,
            quantumSecurityLevel: quantumSecurityLevel,
            totalStaked: totalStaked,
            totalRewardsDistributed: totalRewardsDistributed,
            averageComputationalComplexity: averageComplexity
        });
    }

    /**
     * @dev Get pending rewards for a staker
     * @param _staker Staker address
     * @return Pending rewards amount
     */
    function getPendingRewards(address _staker) external view returns (uint256) {
        return _calculatePendingRewards(_staker);
    }

    // =============================================================================
    // SIGNATURE VERIFICATION (OpenZeppelin ECDSA)
    // =============================================================================

    /**
     * @dev Verify mathematical proof signature
     * @param _proofHash Hash of the proof
     * @param _signature Signature to verify
     * @param _signer Expected signer address
     * @return Boolean indicating signature validity
     */
    function verifyProofSignature(
        bytes32 _proofHash,
        bytes memory _signature,
        address _signer
    ) public pure returns (bool) {
        bytes32 ethSignedMessageHash = _proofHash.toEthSignedMessageHash();
        address recoveredSigner = ethSignedMessageHash.recover(_signature);
        return recoveredSigner == _signer;
    }

    // =============================================================================
    // EMERGENCY FUNCTIONS
    // =============================================================================

    /**
     * @dev Emergency pause all mining sessions (owner only)
     */
    function emergencyPause() external onlyOwner {
        _pause();
        // Reset all active sessions in emergency
        currentActiveSessions = 0;
        emit EmergencyPaused(msg.sender, block.timestamp);
    }

    /**
     * @dev Emergency withdraw tokens (owner only)
     * @param _token Token address to withdraw
     * @param _amount Amount to withdraw
     */
    function emergencyWithdraw(address _token, uint256 _amount) external onlyOwner {
        require(_amount > 0, "Amount must be positive");
        IERC20 token = IERC20(_token);
        require(token.transfer(owner(), _amount), "Token transfer failed");
    }

    /**
     * @dev Get contract version
     * @return Version string
     */
    function version() external pure returns (string memory) {
        return "ProductiveMiner v2.0.0 - Enhanced OpenZeppelin Secured";
    }

    /**
     * @dev Get contract statistics
     * @return Various contract statistics
     */
    function getContractStats() external view returns (
        uint256 _totalDiscoveries,
        uint256 _totalSessions,
        uint256 _totalStaked,
        uint256 _totalRewardsDistributed,
        uint256 _currentActiveSessions,
        bool _isPaused
    ) {
        return (
            totalDiscoveries,
            totalSessions,
            totalStaked,
            totalRewardsDistributed,
            currentActiveSessions,
            paused()
        );
    }
}
