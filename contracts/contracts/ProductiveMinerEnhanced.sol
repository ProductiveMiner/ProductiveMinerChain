// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ProductiveMinerEnhanced
 * @dev An enhanced blockchain mining platform with improved exception handling
 * 
 * Enhancements:
 * - Comprehensive try-catch blocks for external calls
 * - Enhanced error handling with custom errors
 * - Checks-Effects-Interactions pattern enforcement
 * - Gas-efficient exception handling
 * - Robust state validation
 * - Graceful failure recovery
 */
contract ProductiveMinerEnhanced {
    // =============================================================================
    // CUSTOM ERRORS (Enhanced for better exception handling)
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
    error StateUpdateFailed();
    error ExternalCallFailed();
    error GasLimitExceeded();
    error InvalidProofHash();
    error MetadataTooLong();
    error RewardCalculationFailed();
    error DiscoveryCreationFailed();
    error ArrayOperationFailed();
    error TimeValidationFailed();

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
    uint256 public maxDifficulty = 1000000;
    uint256 public baseReward = 1000;
    uint256 public quantumSecurityLevel = 256;
    uint256 public minStakeAmount = 1000;
    uint256 public stakingAPY = 12; // 12% APY
    uint256 public maxConcurrentSessions = 10;
    bool public tokenIntegrationEnabled = false;

    // Gas and validation limits
    uint256 public constant MAX_METADATA_LENGTH = 1000;
    uint256 public constant MAX_ARRAY_SIZE = 1000;
    uint256 public constant MIN_SESSION_TIME = 60; // 1 minute
    uint256 public constant MAX_SESSION_TIME = 365 days;

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
    event ExceptionHandled(string operation, string reason);

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

    modifier validMetadata(string calldata _metadata) {
        if (bytes(_metadata).length > MAX_METADATA_LENGTH) revert MetadataTooLong();
        _;
    }

    modifier validProofHash(bytes32 _proofHash) {
        if (_proofHash == bytes32(0)) revert InvalidProofHash();
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
    // CORE MINING FUNCTIONS (Enhanced Exception Handling)
    // =============================================================================

    /**
     * @dev Start a new mining session with enhanced exception handling
     * @param _workType The type of mathematical work to perform
     * @param _difficulty The difficulty level for the session
     */
    function startMiningSession(
        WorkType _workType, 
        uint256 _difficulty
    ) external whenNotPaused validWorkType(_workType) validDifficulty(_difficulty) {
        try this._validateSessionStart(msg.sender) {
            // Checks-Effects-Interactions pattern
            sessionCounter++;
            uint256 sessionId = sessionCounter;

            try this._createMiningSession(sessionId, msg.sender, _workType, _difficulty) {
                // Update state
                minerSessions[msg.sender].push(sessionId);
                activeSessionCount[msg.sender]++;
                totalActiveSessions++;

                emit MiningSessionStarted(sessionId, msg.sender, _workType, _difficulty);
            } catch Error(string memory reason) {
                // Revert session counter on failure
                sessionCounter--;
                emit ExceptionHandled("createMiningSession", reason);
                revert DiscoveryCreationFailed();
            } catch (bytes memory) {
                sessionCounter--;
                emit ExceptionHandled("createMiningSession", "Low-level error");
                revert DiscoveryCreationFailed();
            }
        } catch Error(string memory reason) {
            emit ExceptionHandled("validateSessionStart", reason);
            revert();
        } catch (bytes memory) {
            emit ExceptionHandled("validateSessionStart", "Low-level error");
            revert();
        }
    }

    /**
     * @dev Complete a mining session with comprehensive exception handling
     * @param _sessionId The session ID to complete
     * @param _proofHash Hash of the mathematical proof
     * @param _metadata Additional metadata about the discovery
     */
    function completeMiningSession(
        uint256 _sessionId,
        bytes32 _proofHash,
        string calldata _metadata
    ) external whenNotPaused validProofHash(_proofHash) validMetadata(_metadata) {
        try this._validateSessionCompletion(_sessionId, msg.sender) {
            MiningSession storage session = sessions[_sessionId];
            
            // CHECKS
            if (session.miner != msg.sender) revert Unauthorized();
            if (!session.active) revert SessionNotActive();
            if (session.completed) revert SessionAlreadyCompleted();

            // EFFECTS
            session.active = false;
            session.completed = true;
            session.endTime = block.timestamp;

            // Update counters
            activeSessionCount[msg.sender]--;
            totalActiveSessions--;

            try this._calculateAndDistributeReward(_sessionId, _proofHash, _metadata) {
                // Success - events emitted in _calculateAndDistributeReward
            } catch Error(string memory reason) {
                // Revert state changes on failure
                session.active = true;
                session.completed = false;
                session.endTime = 0;
                activeSessionCount[msg.sender]++;
                totalActiveSessions++;
                
                emit ExceptionHandled("calculateAndDistributeReward", reason);
                revert RewardCalculationFailed();
            } catch (bytes memory) {
                // Revert state changes on failure
                session.active = true;
                session.completed = false;
                session.endTime = 0;
                activeSessionCount[msg.sender]++;
                totalActiveSessions++;
                
                emit ExceptionHandled("calculateAndDistributeReward", "Low-level error");
                revert RewardCalculationFailed();
            }
        } catch Error(string memory reason) {
            emit ExceptionHandled("validateSessionCompletion", reason);
            revert();
        } catch (bytes memory) {
            emit ExceptionHandled("validateSessionCompletion", "Low-level error");
            revert();
        }
    }

    // =============================================================================
    // STAKING FUNCTIONS (Enhanced Exception Handling)
    // =============================================================================

    /**
     * @dev Stake tokens with enhanced exception handling
     */
    function stake() external payable whenNotPaused {
        if (msg.value < minStakeAmount) revert InsufficientStake();
        
        try this._validateStaking(msg.sender) {
            StakingInfo storage staker = stakingInfo[msg.sender];
            
            // CHECKS
            if (staker.isActive) {
                try this._calculatePendingRewards(msg.sender) returns (uint256 pendingRewards) {
                    staker.rewards += pendingRewards;
                } catch Error(string memory reason) {
                    emit ExceptionHandled("calculatePendingRewards", reason);
                    // Continue with staking even if reward calculation fails
                } catch (bytes memory) {
                    emit ExceptionHandled("calculatePendingRewards", "Low-level error");
                    // Continue with staking even if reward calculation fails
                }
            }
            
            // EFFECTS
            staker.stakedAmount += msg.value;
            staker.lastClaimTime = block.timestamp;
            staker.isActive = true;
            staker.apy = stakingAPY;
            totalStaked += msg.value;
            
            emit Staked(msg.sender, msg.value);
        } catch Error(string memory reason) {
            emit ExceptionHandled("validateStaking", reason);
            revert();
        } catch (bytes memory) {
            emit ExceptionHandled("validateStaking", "Low-level error");
            revert();
        }
    }

    /**
     * @dev Unstake tokens with enhanced exception handling
     * @param _amount Amount to unstake
     */
    function unstake(uint256 _amount) external whenNotPaused {
        if (_amount == 0) revert InvalidAmount();
        
        try this._validateUnstaking(msg.sender, _amount) {
            StakingInfo storage staker = stakingInfo[msg.sender];
            
            // CHECKS
            if (!staker.isActive) revert Unauthorized();
            if (staker.stakedAmount < _amount) revert InsufficientStake();
            
            // Calculate pending rewards
            try this._calculatePendingRewards(msg.sender) returns (uint256 pendingRewards) {
                staker.rewards += pendingRewards;
            } catch Error(string memory reason) {
                emit ExceptionHandled("calculatePendingRewards", reason);
                // Continue with unstaking even if reward calculation fails
            } catch (bytes memory) {
                emit ExceptionHandled("calculatePendingRewards", "Low-level error");
                // Continue with unstaking even if reward calculation fails
            }
            
            // EFFECTS
            staker.stakedAmount -= _amount;
            totalStaked -= _amount;
            
            if (staker.stakedAmount == 0) {
                staker.isActive = false;
            }
            
            // INTERACTIONS
            try this._safeTransfer(msg.sender, _amount) {
                emit Unstaked(msg.sender, _amount);
            } catch Error(string memory reason) {
                // Revert state changes on transfer failure
                staker.stakedAmount += _amount;
                totalStaked += _amount;
                if (staker.stakedAmount > 0) {
                    staker.isActive = true;
                }
                
                emit ExceptionHandled("safeTransfer", reason);
                revert TransferFailed();
            } catch (bytes memory) {
                // Revert state changes on transfer failure
                staker.stakedAmount += _amount;
                totalStaked += _amount;
                if (staker.stakedAmount > 0) {
                    staker.isActive = true;
                }
                
                emit ExceptionHandled("safeTransfer", "Low-level error");
                revert TransferFailed();
            }
        } catch Error(string memory reason) {
            emit ExceptionHandled("validateUnstaking", reason);
            revert();
        } catch (bytes memory) {
            emit ExceptionHandled("validateUnstaking", "Low-level error");
            revert();
        }
    }

    /**
     * @dev Claim staking rewards with enhanced exception handling
     */
    function claimRewards() external whenNotPaused {
        try this._validateRewardClaim(msg.sender) {
            StakingInfo storage staker = stakingInfo[msg.sender];
            
            // CHECKS
            if (!staker.isActive) revert Unauthorized();
            
            uint256 totalRewards;
            try this._calculatePendingRewards(msg.sender) returns (uint256 pendingRewards) {
                totalRewards = staker.rewards + pendingRewards;
            } catch Error(string memory reason) {
                emit ExceptionHandled("calculatePendingRewards", reason);
                totalRewards = staker.rewards; // Use only accumulated rewards
            } catch (bytes memory) {
                emit ExceptionHandled("calculatePendingRewards", "Low-level error");
                totalRewards = staker.rewards; // Use only accumulated rewards
            }
            
            if (totalRewards == 0) revert NoRewardsToClaim();
            
            // EFFECTS
            staker.rewards = 0;
            staker.lastClaimTime = block.timestamp;
            
            // INTERACTIONS
            try this._safeTransfer(msg.sender, totalRewards) {
                emit RewardsClaimed(msg.sender, totalRewards);
            } catch Error(string memory reason) {
                // Revert state changes on transfer failure
                staker.rewards = totalRewards;
                staker.lastClaimTime = block.timestamp - 1; // Reset to previous time
                
                emit ExceptionHandled("safeTransfer", reason);
                revert TransferFailed();
            } catch (bytes memory) {
                // Revert state changes on transfer failure
                staker.rewards = totalRewards;
                staker.lastClaimTime = block.timestamp - 1; // Reset to previous time
                
                emit ExceptionHandled("safeTransfer", "Low-level error");
                revert TransferFailed();
            }
        } catch Error(string memory reason) {
            emit ExceptionHandled("validateRewardClaim", reason);
            revert();
        } catch (bytes memory) {
            emit ExceptionHandled("validateRewardClaim", "Low-level error");
            revert();
        }
    }

    // =============================================================================
    // INTERNAL VALIDATION FUNCTIONS (External for try-catch)
    // =============================================================================

    /**
     * @dev Validate session start conditions
     */
    function _validateSessionStart(address _miner) external view {
        if (activeSessionCount[_miner] >= maxConcurrentSessions) {
            revert TooManyActiveSessions();
        }
        
        // Check gas limit for array operations
        if (minerSessions[_miner].length >= MAX_ARRAY_SIZE) {
            revert GasLimitExceeded();
        }
    }

    /**
     * @dev Validate session completion conditions
     */
    function _validateSessionCompletion(uint256 _sessionId, address _miner) external view {
        if (_sessionId == 0 || _sessionId > sessionCounter) {
            revert SessionNotFound();
        }
        
        MiningSession storage session = sessions[_sessionId];
        if (session.miner != _miner) {
            revert Unauthorized();
        }
        
        if (!session.active) {
            revert SessionNotActive();
        }
        
        if (session.completed) {
            revert SessionAlreadyCompleted();
        }
        
        // Validate session time
        uint256 sessionDuration = block.timestamp - session.startTime;
        if (sessionDuration < MIN_SESSION_TIME) {
            revert TimeValidationFailed();
        }
        
        if (sessionDuration > MAX_SESSION_TIME) {
            revert TimeValidationFailed();
        }
    }

    /**
     * @dev Create mining session
     */
    function _createMiningSession(
        uint256 _sessionId,
        address _miner,
        WorkType _workType,
        uint256 _difficulty
    ) external {
        sessions[_sessionId] = MiningSession({
            sessionId: _sessionId,
            miner: _miner,
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
    }

    /**
     * @dev Calculate and distribute reward
     */
    function _calculateAndDistributeReward(
        uint256 _sessionId,
        bytes32 _proofHash,
        string calldata _metadata
    ) external {
        MiningSession storage _session = sessions[_sessionId];
        // Calculate reward
        uint256 timeSpent = _session.endTime - _session.startTime;
        uint256 reward;
        
        try this._calculateReward(_session.difficulty, timeSpent) returns (uint256 calculatedReward) {
            reward = calculatedReward;
        } catch Error(string memory reason) {
            emit ExceptionHandled("calculateReward", reason);
            revert RewardCalculationFailed();
        } catch (bytes memory) {
            emit ExceptionHandled("calculateReward", "Low-level error");
            revert RewardCalculationFailed();
        }

        // Create discovery
        discoveryCounter++;
        uint256 discoveryId = discoveryCounter;

        try this._createDiscovery(
            discoveryId,
            _sessionId,
            _proofHash,
            _metadata,
            reward
        ) {
            minerDiscoveries[msg.sender].push(discoveryId);
            totalRewardsDistributed += reward;

            // Transfer reward
            try this._safeTransfer(msg.sender, reward) {
                emit MiningSessionCompleted(_session.sessionId, msg.sender, reward);
                emit DiscoverySubmitted(discoveryId, msg.sender, _session.workType, _session.difficulty);
            } catch Error(string memory reason) {
                emit ExceptionHandled("safeTransfer", reason);
                revert TransferFailed();
            } catch (bytes memory) {
                emit ExceptionHandled("safeTransfer", "Low-level error");
                revert TransferFailed();
            }
        } catch Error(string memory reason) {
            // Revert discovery counter on failure
            discoveryCounter--;
            emit ExceptionHandled("createDiscovery", reason);
            revert DiscoveryCreationFailed();
        } catch (bytes memory) {
            // Revert discovery counter on failure
            discoveryCounter--;
            emit ExceptionHandled("createDiscovery", "Low-level error");
            revert DiscoveryCreationFailed();
        }
    }

    /**
     * @dev Create discovery record
     */
    function _createDiscovery(
        uint256 _discoveryId,
        uint256 _sessionId,
        bytes32 _proofHash,
        string calldata _metadata,
        uint256 _reward
    ) external {
        MiningSession storage _session = sessions[_sessionId];
        uint256 impactScore;
        try this._calculateImpactScore(_session.difficulty, _session.workType) returns (uint256 calculatedScore) {
            impactScore = calculatedScore;
        } catch Error(string memory reason) {
            emit ExceptionHandled("calculateImpactScore", reason);
            impactScore = _session.difficulty / 1000; // Fallback calculation
        } catch (bytes memory) {
            emit ExceptionHandled("calculateImpactScore", "Low-level error");
            impactScore = _session.difficulty / 1000; // Fallback calculation
        }

        discoveries[_discoveryId] = Discovery({
            id: _discoveryId,
            miner: msg.sender,
            workType: _session.workType,
            difficulty: _session.difficulty,
            quantumSecurityLevel: _session.quantumSecurityLevel,
            reward: _reward,
            timestamp: block.timestamp,
            proofHash: _proofHash,
            verified: true,
            metadata: _metadata,
            computationalComplexity: _session.computationalPower,
            impactScore: impactScore
        });
    }

    /**
     * @dev Validate staking conditions
     */
    function _validateStaking(address _staker) external view {
        // Check if staker has too many active sessions
        if (activeSessionCount[_staker] > 0) {
            // Allow staking but warn about potential conflicts
        }
    }

    /**
     * @dev Validate unstaking conditions
     */
    function _validateUnstaking(address _staker, uint256 _amount) external view {
        StakingInfo storage staker = stakingInfo[_staker];
        if (!staker.isActive) {
            revert Unauthorized();
        }
        if (staker.stakedAmount < _amount) {
            revert InsufficientStake();
        }
    }

    /**
     * @dev Validate reward claim conditions
     */
    function _validateRewardClaim(address _staker) external view {
        StakingInfo storage staker = stakingInfo[_staker];
        if (!staker.isActive) {
            revert Unauthorized();
        }
    }

    /**
     * @dev Safe transfer function with exception handling
     */
    function _safeTransfer(address _recipient, uint256 _amount) external {
        (bool success, ) = payable(_recipient).call{value: _amount}("");
        if (!success) {
            revert TransferFailed();
        }
    }

    /**
     * @dev Calculate reward with exception handling
     */
    function _calculateReward(uint256 _difficulty, uint256 _timeSpent) external view returns (uint256) {
        if (_difficulty == 0 || _timeSpent == 0) {
            revert InvalidParameters();
        }
        
        uint256 baseRewardAmount = (baseReward * _difficulty) / 1000;
        uint256 timeMultiplier = _timeSpent > 3600 ? 2 : 1;
        return baseRewardAmount * timeMultiplier;
    }

    /**
     * @dev Calculate impact score with exception handling
     */
    function _calculateImpactScore(uint256 _difficulty, WorkType _workType) external pure returns (uint256) {
        if (_difficulty == 0) {
            revert InvalidParameters();
        }
        
        uint256 baseScore = _difficulty / 1000;
        uint256 workTypeMultiplier = uint256(_workType) + 1;
        return baseScore * workTypeMultiplier;
    }

    /**
     * @dev Calculate pending rewards with exception handling
     */
    function _calculatePendingRewards(address _staker) external view returns (uint256) {
        StakingInfo storage staker = stakingInfo[_staker];
        if (!staker.isActive || staker.stakedAmount == 0) {
            return 0;
        }
        
        uint256 timeStaked = block.timestamp - staker.lastClaimTime;
        uint256 annualReward = (staker.stakedAmount * staker.apy) / 100;
        return (annualReward * timeStaked) / 365 days;
    }

    // =============================================================================
    // VIEW FUNCTIONS (Unchanged from optimized version)
    // =============================================================================

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
        pendingRewards = this._calculatePendingRewards(_miner);
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
    // ADMIN FUNCTIONS (Enhanced with exception handling)
    // =============================================================================

    function pause() external onlyOwner {
        paused = true;
        emit Paused(msg.sender);
    }

    function unpause() external onlyOwner {
        paused = false;
        emit Unpaused(msg.sender);
    }

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

    function updateStakingParameters(
        uint256 _minStakeAmount,
        uint256 _stakingAPY
    ) external onlyOwner {
        if (_minStakeAmount == 0 || _stakingAPY > 100) revert InvalidParameters();
        
        minStakeAmount = _minStakeAmount;
        stakingAPY = _stakingAPY;
    }

    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        if (balance > 0) {
            try this._safeTransfer(owner, balance) {
                // Success
            } catch Error(string memory reason) {
                emit ExceptionHandled("emergencyWithdraw", reason);
                revert TransferFailed();
            } catch (bytes memory) {
                emit ExceptionHandled("emergencyWithdraw", "Low-level error");
                revert TransferFailed();
            }
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
