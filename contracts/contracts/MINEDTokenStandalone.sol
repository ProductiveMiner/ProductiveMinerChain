// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MINEDTokenStandalone is ERC20, Ownable {
    error E1();
    error E2();
    error E3();
    error E4();
    error E5();
    error E6();
    error E7();
    error E8();
    error E9();
    error E10();
    error E11();
    error E12();
    error E13();
    error E14();
    error E15();
    error E16();
    error E17();
    error E18();
    error E19();
    error E20();
    error E21();
    error E22();
    error E23();
    error E24();
    error E25();
    error E26();
    error E27();
    error E28();
    error E29();
    error E30();
    error E31();
    error E32();

    uint256 private constant INITIAL_SUPPLY = 1e27;
    uint256 private constant CIRCULATING_SUPPLY = 500_000_000 * 1e18;
    uint256 private constant STAKING_POOL = 200_000_000 * 1e18;
    uint256 private constant GOVERNANCE_POOL = 50_000_000 * 1e18;
    uint256 private constant RESEARCH_ACCESS_POOL = 100_000_000 * 1e18;
    uint256 private constant MINING_REWARDS_POOL = 100_000_000 * 1e18;
    uint256 private constant TRANSACTION_FEE_POOL = 50_000_000 * 1e18;
    uint256 private constant TREASURY_POOL = 100_000_000 * 1e18;
    uint16 private constant BASE_BURN = 1000;
    uint16 private constant MILLENNIUM_BURN = 2500;
    uint16 private constant MAJOR_BURN = 1500;
    uint16 private constant COLLAB_BURN = 1200;
    uint256 private constant INITIAL_EMISSION_RATE = 1000;
    uint256 private constant DECAY_CONSTANT = 1;
    uint256 private constant RESEARCH_MULTIPLIER_MIN = 100;
    uint256 private constant RESEARCH_MULTIPLIER_MAX = 2500;
    address private constant ARBITRUM_SYS = address(100);
    uint256 private constant MAX_VALIDATOR_COUNT = 10;
    uint256 private constant MIN_FEE = 1e18;
    uint256 private constant MIN_RESEARCH_VALUE = 50;
    uint256 private constant MIN_REWARD = 100;
    
    struct PackedState {
        uint128 totalBurned;
        uint64 lastEmissionBlock;
        uint32 totalValidators;
        uint32 nextDiscoveryId;
        uint128 totalResearchValue;
    }
    
    struct Validator {
        uint128 stakedAmount;
        uint32 totalValidations;
        uint32 registrationTime;
        uint16 reputation;
        bool isActive;
    }
    
    struct Discovery {
        address researcher;
        uint8 workType;
        uint16 complexity;
        uint8 significance;
        uint256 researchValue;
        uint32 submissionTime;
        uint32 validationCount;
        bool isValidated;
        bool isCollaborative;
        bool isFromPoW;
    }
    
    struct WorkTypeInfo {
        uint16 difficultyMultiplier;
        uint16 baseReward;
        bool isActive;
    }
    
    struct MiningSession {
        uint128 targetHash;
        uint16 difficulty;
        uint8 workType;
        uint64 startTime;
        uint64 endTime;
        uint32 nonce;
        address miner;
        bool isCompleted;
    }
    
    struct PoWResult {
        uint32 sessionId;
        uint128 hash;
        uint16 complexity;
        uint8 significance;
        bool isValid;
    }
    
    struct ValidationRequest {
        uint32 discoveryId;
        uint256 fee;
        uint32 validationCount;
        bool isCompleted;
    }
    
    mapping(address => Validator) public validators;
    mapping(uint32 => Discovery) public discoveries;
    mapping(uint32 => ValidationRequest) public validationRequests;
    mapping(uint32 => mapping(address => bool)) public hasValidated;
    mapping(uint8 => WorkTypeInfo) public workTypes;
    mapping(uint32 => MiningSession) public miningSessions;
    mapping(uint32 => PoWResult) public powResults;
    mapping(address => uint256) public userStakes;
    mapping(address => uint256) public userStakingRewards;
    
    PackedState public state;
    uint256 public stakingPoolBalance;
    uint256 public validatorRewardPool;
    uint256 public totalStaked;
    uint256 public circulatingSupply;
    uint256 public governancePool;
    uint256 public researchAccessPool;
    uint256 public miningRewardsPool;
    uint256 public transactionFeePool;
    uint256 public treasuryPool;
    uint256 public cumulativeEmission;
    uint256 public cumulativeBurn;
    uint256 public lastEmissionBlock;
    uint32 public nextSessionId;
    uint32 public nextPowResultId;
    uint8 private constant MAX_WORK_TYPE = 24;
    bool public testMode = true; // Test mode for easier PoW verification
    
    event ValidatorRegistered(address indexed validator, uint256 stake);
    event DiscoverySubmitted(uint32 indexed discoveryId, address indexed researcher, uint8 workType, uint256 researchValue);
    event DiscoveryValidated(uint32 indexed discoveryId, address indexed validator, bool isValid);
    event ValidationRequested(uint32 indexed requestId, uint32 indexed discoveryId, uint256 fee);
    event TokensStaked(address indexed user, uint256 amount);
    event TokensUnstaked(address indexed user, uint256 amount, uint256 rewards);
    event StakingRewardsClaimed(address indexed user, uint256 amount);
    event TokensBurned(address indexed from, uint256 amount);
    event MiningSessionStarted(uint32 indexed sessionId, address indexed miner, uint8 workType, uint16 difficulty);
    event MiningSessionCompleted(uint32 indexed sessionId, address indexed miner, uint32 nonce, uint128 hash);
    event PoWResultSubmitted(uint32 indexed resultId, uint32 indexed sessionId, address indexed miner, uint128 hash);
    event PoWRewardMinted(address indexed miner, uint256 amount, string reason);
    event AutoValidationRequested(uint32 indexed discoveryId, uint32 indexed powResultId, uint256 fee);
    event ManualDiscoveryRewarded(address indexed researcher, uint256 amount, uint32 indexed discoveryId);
    
    constructor() payable ERC20("MINED Token", "MINED") Ownable(msg.sender) {
        address contractAddr = address(this);
        _mint(contractAddr, INITIAL_SUPPLY);
        circulatingSupply = CIRCULATING_SUPPLY;
        stakingPoolBalance = STAKING_POOL;
        governancePool = GOVERNANCE_POOL;
        researchAccessPool = RESEARCH_ACCESS_POOL;
        miningRewardsPool = MINING_REWARDS_POOL;
        transactionFeePool = TRANSACTION_FEE_POOL;
        treasuryPool = TREASURY_POOL;
        lastEmissionBlock = uint64(_getCurrentBlockNumber());
        delete cumulativeEmission;
        delete cumulativeBurn;
        state.lastEmissionBlock = uint64(_getCurrentBlockNumber());
        _initWorkTypes();
        _initializeValidators();
        _transfer(contractAddr, msg.sender, circulatingSupply);
    }
    
    function _getCurrentBlockNumber() internal view returns (uint256) {
        (bool success, bytes memory data) = ARBITRUM_SYS.staticcall(
            abi.encodeWithSignature("arbBlockNumber()")
        );
        if (success && data.length >= 32) {
            return abi.decode(data, (uint256));
        }
        return block.number;
    }
    
    function _initializeValidators() internal {
        address[] memory initialValidators = new address[](5);
        initialValidators[0] = 0x742d35Cc6634C0532925A3B8D4C9dB96C4B4d8B6;
        initialValidators[1] = 0x1234567890123456789012345678901234567890;
        initialValidators[2] = 0x2345678901234567890123456789012345678901;
        initialValidators[3] = 0x3456789012345678901234567890123456789012;
        initialValidators[4] = 0x4567890123456789012345678901234567890123;
        
        uint256[] memory initialStakes = new uint256[](5);
        initialStakes[0] = 1e24;
        initialStakes[1] = 5e23;
        initialStakes[2] = 5e23;
        initialStakes[3] = 3e23;
        initialStakes[4] = 2e23;
        
        uint256 length = initialValidators.length;
        if (length >= MAX_VALIDATOR_COUNT) revert E1();
        
        address contractAddr = address(this);
        
        for (uint i = 0; i < length;) {
            address validator = initialValidators[i];
            uint256 stakeAmount = initialStakes[i];
            
            if (validator != address(0)) {
                if (stakingPoolBalance < stakeAmount) revert E2();
                
                Validator storage newValidator = validators[validator];
                newValidator.stakedAmount = uint128(stakeAmount);
                delete newValidator.totalValidations;
                newValidator.reputation = 100;
                newValidator.registrationTime = uint32(block.timestamp);
                newValidator.isActive = true;
                
                userStakes[validator] = stakeAmount;
                totalStaked = totalStaked + stakeAmount;
                stakingPoolBalance = stakingPoolBalance - stakeAmount;
                
                uint256 validatorContribution = stakeAmount / 10;
                validatorRewardPool = validatorRewardPool + validatorContribution;
                
                _transfer(contractAddr, validator, stakeAmount);
                
                emit ValidatorRegistered(validator, stakeAmount);
                emit TokensStaked(validator, stakeAmount);
            }
            unchecked { ++i; }
        }
        unchecked { state.totalValidators = uint32(initialValidators.length); }
    }
    
    function submitDiscovery(uint8 workType, uint16 complexity, uint8 significance, uint256 researchValue, bool isCollaborative) external returns (uint32) {
        if (workType >= MAX_WORK_TYPE) revert E3();
        if (!workTypes[workType].isActive) revert E4();
        if (complexity == 0) revert E5();
        if (complexity > 10) revert E6();
        if (significance == 0) revert E7();
        if (significance > 3) revert E8();
        if (researchValue == 0) revert E9();
        
        uint32 discoveryId = state.nextDiscoveryId++;
        
        Discovery storage discovery = discoveries[discoveryId];
        discovery.researcher = msg.sender;
        discovery.workType = workType;
        discovery.complexity = complexity;
        discovery.significance = significance;
        discovery.researchValue = researchValue;
        discovery.submissionTime = uint32(block.timestamp);
        delete discovery.isValidated;
        discovery.isCollaborative = isCollaborative;
        delete discovery.isFromPoW;
        
        unchecked {
            state.totalResearchValue += uint128(researchValue);
        }
        
        emit DiscoverySubmitted(discoveryId, msg.sender, workType, researchValue);
        return discoveryId;
    }
    
    function requestValidation(uint32 discoveryId, uint256 fee) external returns (uint32) {
        if (discoveries[discoveryId].researcher == address(0)) revert E10();
        if (fee < MIN_FEE) revert E11();
        if (userStakes[msg.sender] < fee) revert E12();
        
        userStakes[msg.sender] = userStakes[msg.sender] - fee;
        totalStaked = totalStaked - fee;
        stakingPoolBalance = stakingPoolBalance - fee;
        validatorRewardPool = validatorRewardPool + fee;
        
        uint32 requestId = uint32(block.timestamp + discoveryId);
        ValidationRequest storage request = validationRequests[requestId];
        request.discoveryId = discoveryId;
        request.fee = fee;
        request.validationCount = 0;
        request.isCompleted = false;
        
        emit ValidationRequested(requestId, discoveryId, fee);
        return requestId;
    }
    
    function validateDiscovery(uint32 requestId, bool isValid) external {
        if (!validators[msg.sender].isActive) revert E13();
        if (hasValidated[requestId][msg.sender]) revert E14();
        
        ValidationRequest storage request = validationRequests[requestId];
        if (request.isCompleted) revert E15();
        
        Discovery storage discovery = discoveries[request.discoveryId];
        hasValidated[requestId][msg.sender] = true;
        request.validationCount++;
        
        if (request.validationCount >= 3) {
            request.isCompleted = true;
            discovery.isValidated = isValid;
            
            if (isValid) {
                uint256 validatorReward = (request.fee * 500) / 10000;
                
                if (validatorRewardPool >= validatorReward) {
                    validatorRewardPool = validatorRewardPool - validatorReward;
                    _transfer(address(this), msg.sender, validatorReward);
                } else {
                    uint256 availableReward = validatorRewardPool;
                    delete validatorRewardPool;
                    if (availableReward != 0) {
                        _transfer(address(this), msg.sender, availableReward);
                    }
                }
                
                bool isManualDiscovery = !_isPoWDiscovery(request.discoveryId);
                
                if (isManualDiscovery) {
                    uint256 manualDiscoveryReward = _calcManualDiscoveryReward(
                        discovery.workType,
                        discovery.complexity,
                        discovery.significance,
                        discovery.researchValue,
                        discovery.isCollaborative
                    );
                    
                    if (stakingPoolBalance >= manualDiscoveryReward) {
                        stakingPoolBalance = stakingPoolBalance - manualDiscoveryReward;
                        _transfer(address(this), discovery.researcher, manualDiscoveryReward);
                        emit ManualDiscoveryRewarded(discovery.researcher, manualDiscoveryReward, request.discoveryId);
                    } else {
                        uint256 availableReward = stakingPoolBalance;
                        delete stakingPoolBalance;
                        if (availableReward != 0) {
                            _transfer(address(this), discovery.researcher, availableReward);
                            emit ManualDiscoveryRewarded(discovery.researcher, availableReward, request.discoveryId);
                        }
                    }
                }
            }
        }
        
        emit DiscoveryValidated(request.discoveryId, msg.sender, isValid);
    }
    
    function stake(uint256 amount) external {
        if (amount == 0) revert E16();
        if (balanceOf(msg.sender) < amount) revert E17();
        
        address contractAddr = address(this);
        _transfer(msg.sender, contractAddr, amount);
        
        userStakes[msg.sender] = userStakes[msg.sender] + amount;
        totalStaked = totalStaked + amount;
        stakingPoolBalance = stakingPoolBalance + amount;
        
        uint256 validatorContribution = amount / 10;
        validatorRewardPool = validatorRewardPool + validatorContribution;
        
        emit TokensStaked(msg.sender, amount);
    }
    
    function unstake(uint256 amount) external {
        if (amount == 0) revert E18();
        if (userStakes[msg.sender] < amount) revert E19();
        
        uint256 rewards = _calculateStakingRewards(msg.sender);
        if (rewards != 0) {
            userStakingRewards[msg.sender] = userStakingRewards[msg.sender] + rewards;
        }
        
        userStakes[msg.sender] = userStakes[msg.sender] - amount;
        totalStaked = totalStaked - amount;
        stakingPoolBalance = stakingPoolBalance - amount;
        
        uint256 validatorContribution = amount / 10;
        if (validatorContribution >= validatorRewardPool) {
            delete validatorRewardPool;
        } else {
            validatorRewardPool = validatorRewardPool - validatorContribution;
        }
        
        _transfer(address(this), msg.sender, amount);
        
        emit TokensUnstaked(msg.sender, amount, rewards);
    }
    
    function claimStakingRewards() external {
        uint256 rewards = _calculateStakingRewards(msg.sender) + userStakingRewards[msg.sender];
        if (rewards == 0) revert E20();
        
        delete userStakingRewards[msg.sender];
        
        _transfer(address(this), msg.sender, rewards);
        
        emit StakingRewardsClaimed(msg.sender, rewards);
    }
    
    function _calculateStakingRewards(address user) internal view returns (uint256) {
        if (userStakes[user] == 0 || totalStaked == 0) return 0;
        
        uint256 stakingDuration = block.timestamp - validators[user].registrationTime;
        uint256 apy = 5;
        uint256 rewards = (userStakes[user] * apy * stakingDuration) / (365 days * 100);
        
        return rewards;
    }
    
    function startMiningSession(uint8 workType, uint16 difficulty) external returns (uint32) {
        if (workType > MAX_WORK_TYPE) revert E21();
        if (!workTypes[workType].isActive) revert E22();
        if (difficulty == 0 || difficulty > 1000) revert E23();
        
        uint32 sessionId = nextSessionId++;
        
        MiningSession storage session = miningSessions[sessionId];
        bytes32 hash = keccak256(abi.encodePacked(block.timestamp, msg.sender, workType, difficulty));
        session.targetHash = uint128(uint256(hash));
        session.difficulty = difficulty;
        session.workType = workType;
        session.startTime = uint64(block.timestamp);
        session.miner = msg.sender;
        session.isCompleted = false;
        
        emit MiningSessionStarted(sessionId, msg.sender, workType, difficulty);
        return sessionId;
    }
    
    function submitPoWResult(uint32 sessionId, uint32 nonce, uint128 hash, uint16 complexity, uint8 significance) external returns (uint32) {
        return _submitPoWResultInternal(sessionId, nonce, hash, complexity, significance);
    }
    
    function _submitPoWResultInternal(uint32 sessionId, uint32 nonce, uint128 hash, uint16 complexity, uint8 significance) internal returns (uint32) {
        MiningSession storage session = miningSessions[sessionId];
        if (session.miner != msg.sender) revert E24();
        if (session.isCompleted) revert E25();
        if (session.startTime == 0) revert E26();
        
        _verifyPoWResult(session, nonce, hash);
        
        if (nonce == 0) revert E27();
        if (nonce < session.startTime) revert E28();
        
        session.endTime = uint64(block.timestamp);
        session.nonce = nonce;
        session.isCompleted = true;
        
        uint32 resultId = nextPowResultId++;
        _createPoWResult(resultId, sessionId, hash, complexity, significance);
        
        emit MiningSessionCompleted(sessionId, msg.sender, nonce, hash);
        emit PoWResultSubmitted(resultId, sessionId, msg.sender, hash);
        
        _autoRequestValidation(resultId, session.workType, complexity, significance);
        
        return resultId;
    }
    
    function _verifyPoWResult(MiningSession storage session, uint32 nonce, uint128 hash) internal view {
        bytes32 expectedHashBytes = keccak256(abi.encodePacked(session.targetHash, nonce));
        uint128 expectedHash = uint128(uint256(expectedHashBytes));
        if (hash != expectedHash) revert E29();
        
        bytes32 fullHash = keccak256(abi.encodePacked(session.targetHash, nonce));
        uint256 difficulty = session.difficulty;
        
        uint256 hashValue = uint256(fullHash);
        uint256 requiredZeros;
        
        if (testMode) {
            // In test mode, use much easier difficulty (8 leading zeros)
            requiredZeros = 8;
        } else {
            // In production, use the full difficulty calculation
            requiredZeros = 256 - difficulty;
        }
        
        uint256 actualZeros = 0;
        uint256 tempHash = hashValue;
        
        while (tempHash != 0 && actualZeros < requiredZeros) {
            if (tempHash & 1 == 0) {
                actualZeros++;
                tempHash = tempHash >> 1;
            } else {
                break;
            }
        }
        
        if (actualZeros < requiredZeros) revert E30();
    }
    
    function _createPoWResult(uint32 resultId, uint32 sessionId, uint128 hash, uint16 complexity, uint8 significance) internal {
        PoWResult storage result = powResults[resultId];
        result.sessionId = sessionId;
        result.hash = hash;
        result.complexity = complexity;
        result.significance = significance;
        result.isValid = true;
    }
    
    function _autoRequestValidation(uint32 powResultId, uint8 workType, uint16 complexity, uint8 significance) internal {
        PoWResult storage result = powResults[powResultId];
        if (!result.isValid) revert E31();
        
        uint256 researchValue = _calculateResearchValue(workType, complexity, significance);
        
        uint32 discoveryId = _submitDiscoveryFromPoW(workType, complexity, significance, researchValue, false);
        
        uint256 powReward = _calcPoWReward(workType, complexity, significance, researchValue, false);
        _distributePoWReward(msg.sender, powReward);
        
        uint256 burnAmount = _calcBurn(significance, false, powReward);
        if (burnAmount != 0) {
            _burn(msg.sender, burnAmount);
            cumulativeBurn = cumulativeBurn + burnAmount;
        }
        
        _requestValidationWithFee(discoveryId, powResultId, researchValue);
    }
    
    function _calculateResearchValue(uint8 workType, uint16 complexity, uint8 significance) internal view returns (uint256) {
        uint256 baseResearchValue = workTypes[workType].baseReward;
        uint256 complexityMultiplier = _getComplexityMultiplier(complexity);
        uint256 significanceMultiplier = _getSignificanceMultiplier(significance);
        uint256 researchValue = baseResearchValue * complexityMultiplier * significanceMultiplier / 10000;
        
        if (researchValue < MIN_RESEARCH_VALUE) {
            researchValue = MIN_RESEARCH_VALUE;
        }
        
        return researchValue;
    }
    
    function _getComplexityMultiplier(uint16 complexity) internal pure returns (uint256) {
        if (complexity <= 3) return 100;
        if (complexity <= 6) return 250;
        if (complexity <= 8) return 500;
        return 1000;
    }
    
    function _getSignificanceMultiplier(uint8 significance) internal pure returns (uint256) {
        if (significance == 3) return 2500;
        if (significance == 2) return 1500;
        return 100;
    }
    
    function _requestValidationWithFee(uint32 discoveryId, uint32 powResultId, uint256 researchValue) internal {
        uint256 autoFee = researchValue / 100;
        
        if (stakingPoolBalance >= autoFee) {
            stakingPoolBalance = stakingPoolBalance - autoFee;
            _requestValidationInternal(discoveryId, autoFee);
            emit AutoValidationRequested(discoveryId, powResultId, autoFee);
            _triggerAutomaticValidation(discoveryId, autoFee);
        } else {
            uint256 availableFee = stakingPoolBalance;
            delete stakingPoolBalance;
            if (availableFee != 0) {
                _requestValidationInternal(discoveryId, availableFee);
                emit AutoValidationRequested(discoveryId, powResultId, availableFee);
                _triggerAutomaticValidation(discoveryId, availableFee);
            }
        }
    }
    
    function _triggerAutomaticValidation(uint32 discoveryId, uint256 fee) internal {
        uint256 validatorCount = 0;
        address[] memory activeValidators = new address[](MAX_VALIDATOR_COUNT);
        
        for (uint256 i = 0; i < 100 && validatorCount < MAX_VALIDATOR_COUNT;) {
            address validatorAddr = address(uint160(i + 1));
            if (validators[validatorAddr].isActive) {
                activeValidators[validatorCount] = validatorAddr;
                validatorCount++;
            }
            unchecked { ++i; }
        }
        
        if (validatorCount != 0) {
            uint256 feePerValidator = fee / validatorCount;
            address contractAddr = address(this);
            
            for (uint256 i = 0; i < validatorCount;) {
                address validator = activeValidators[i];
                if (validator != address(0)) {
                    validatorRewardPool = validatorRewardPool - feePerValidator;
                    _transfer(contractAddr, validator, feePerValidator);
                    
                    validators[validator].totalValidations++;
                    validators[validator].reputation = validators[validator].reputation + 10;
                    
                    emit DiscoveryValidated(discoveryId, validator, true);
                }
                unchecked { ++i; }
            }
            
            discoveries[discoveryId].isValidated = true;
            discoveries[discoveryId].validationCount = uint32(validatorCount);
        }
    }
    
    function _submitDiscoveryFromPoW(uint8 workType, uint16 complexity, uint8 significance, uint256 researchValue, bool isCollaborative) internal returns (uint32) {
        uint32 discoveryId = state.nextDiscoveryId++;
        
        Discovery storage discovery = discoveries[discoveryId];
        discovery.researcher = msg.sender;
        discovery.workType = workType;
        discovery.complexity = complexity;
        discovery.significance = significance;
        discovery.researchValue = researchValue;
        discovery.submissionTime = uint32(block.timestamp);
        discovery.isValidated = false;
        discovery.isCollaborative = isCollaborative;
        discovery.isFromPoW = true;
        
        uint256 powReward = _calcPoWReward(workType, complexity, significance, researchValue, isCollaborative);
        uint256 burnAmount = _calcBurn(significance, isCollaborative, powReward);
        
        _mint(msg.sender, powReward - burnAmount);
        if (burnAmount != 0) {
            _burn(msg.sender, burnAmount);
            cumulativeBurn = cumulativeBurn + burnAmount;
        }
        
        unchecked {
            state.totalResearchValue += uint128(researchValue);
        }
        
        emit DiscoverySubmitted(discoveryId, msg.sender, workType, researchValue);
        return discoveryId;
    }
    
    function _calcPoWReward(uint8, uint16, uint8, uint256 researchValue, bool isCollaborative) internal pure returns (uint256) {
        // Convert research value to MINED tokens (with 18 decimals)
        // Research value is in small units, convert to MINED tokens
        uint256 baseReward = researchValue * 1e18 / 1000; // Convert to MINED tokens
        
        // Apply collaborative bonus if applicable
        if (isCollaborative) {
            baseReward = baseReward * 120 / 100;
        }
        
        // Ensure minimum reward
        if (baseReward < MIN_REWARD) {
            baseReward = MIN_REWARD;
        }
        
        // Cap maximum reward to prevent excessive inflation
        uint256 maxReward = 1000 * 1e18; // 1000 MINED tokens max
        if (baseReward > maxReward) {
            baseReward = maxReward;
        }
        
        return baseReward;
    }
    
    function _distributePoWReward(address miner, uint256 reward) internal {
        if (miningRewardsPool >= reward) {
            miningRewardsPool = miningRewardsPool - reward;
            _transfer(address(this), miner, reward);
            emit PoWRewardMinted(miner, reward, "Mining reward from pool");
        } else {
            uint256 asymptoticReward = _calcAsymptoticEmission(state.totalResearchValue);
            
            if (asymptoticReward < MIN_REWARD) {
                asymptoticReward = MIN_REWARD;
            }
            
            _mint(miner, asymptoticReward);
            _updateAsymptoticEmission(asymptoticReward);
            emit PoWRewardMinted(miner, asymptoticReward, "Asymptotic emission");
        }
    }
    
    function _updateAsymptoticEmission(uint256 emissionAmount) internal {
        cumulativeEmission = cumulativeEmission + emissionAmount;
        lastEmissionBlock = uint64(_getCurrentBlockNumber());
    }
    
    function _requestValidationInternal(uint32 discoveryId, uint256 fee) internal returns (uint32) {
        if (discoveries[discoveryId].researcher == address(0)) revert E32();
        
        uint32 requestId = uint32(block.timestamp + discoveryId);
        ValidationRequest storage request = validationRequests[requestId];
        request.discoveryId = discoveryId;
        request.fee = fee;
        request.validationCount = 0;
        request.isCompleted = false;
        
        emit ValidationRequested(requestId, discoveryId, fee);
        return requestId;
    }
    
    function _calcBurn(uint8 significance, bool isCollab, uint256 reward) internal pure returns (uint256) {
        uint256 burnRate;
        if (significance == 3) {
            burnRate = MILLENNIUM_BURN;
        } else if (significance == 2) {
            burnRate = MAJOR_BURN;
        } else if (isCollab) {
            burnRate = COLLAB_BURN;
        } else {
            burnRate = BASE_BURN;
        }
        
        return (reward * burnRate) / 10000;
    }
    
    function _calcManualDiscoveryReward(uint8 workType, uint16 complexity, uint8 significance, uint256 researchValue, bool isCollaborative) internal view returns (uint256) {
        uint256 baseReward = workTypes[workType].baseReward;
        uint256 complexityMultiplier = uint256(complexity) * 500;
        uint256 significanceMultiplier = uint256(significance) * 250;
        uint256 researchMultiplier = researchValue / 2000;
        
        uint256 reward = baseReward * complexityMultiplier * significanceMultiplier * researchMultiplier / 1e6;
        
        if (isCollaborative) {
            reward = reward * 120 / 100;
        }
        
        return reward >> 1;
    }
    
    function _isPoWDiscovery(uint32 discoveryId) internal view returns (bool) {
        return discoveries[discoveryId].isFromPoW;
    }
    
    function _initWorkTypes() private {
        WorkTypeInfo storage wt0 = workTypes[0];
        wt0.difficultyMultiplier = 10000;
        wt0.baseReward = 500;
        wt0.isActive = true;
        
        WorkTypeInfo storage wt1 = workTypes[1];
        wt1.difficultyMultiplier = 8000;
        wt1.baseReward = 300;
        wt1.isActive = true;
        
        WorkTypeInfo storage wt2 = workTypes[2];
        wt2.difficultyMultiplier = 8000;
        wt2.baseReward = 400;
        wt2.isActive = true;
        
        WorkTypeInfo storage wt3 = workTypes[3];
        wt3.difficultyMultiplier = 6000;
        wt3.baseReward = 200;
        wt3.isActive = true;
        
        WorkTypeInfo storage wt4 = workTypes[4];
        wt4.difficultyMultiplier = 8000;
        wt4.baseReward = 300;
        wt4.isActive = true;
        
        WorkTypeInfo storage wt5 = workTypes[5];
        wt5.difficultyMultiplier = 6000;
        wt5.baseReward = 200;
        wt5.isActive = true;
        
        WorkTypeInfo storage wt6 = workTypes[6];
        wt6.difficultyMultiplier = 8000;
        wt6.baseReward = 300;
        wt6.isActive = true;
        
        WorkTypeInfo storage wt7 = workTypes[7];
        wt7.difficultyMultiplier = 10000;
        wt7.baseReward = 500;
        wt7.isActive = true;
        
        WorkTypeInfo storage wt8 = workTypes[8];
        wt8.difficultyMultiplier = 4000;
        wt8.baseReward = 150;
        wt8.isActive = true;
        
        WorkTypeInfo storage wt9 = workTypes[9];
        wt9.difficultyMultiplier = 4000;
        wt9.baseReward = 100;
        wt9.isActive = true;
        
        WorkTypeInfo storage wt10 = workTypes[10];
        wt10.difficultyMultiplier = 8000;
        wt10.baseReward = 300;
        wt10.isActive = true;
        
        WorkTypeInfo storage wt11 = workTypes[11];
        wt11.difficultyMultiplier = 6000;
        wt11.baseReward = 200;
        wt11.isActive = true;
        
        WorkTypeInfo storage wt12 = workTypes[12];
        wt12.difficultyMultiplier = 10000;
        wt12.baseReward = 800;
        wt12.isActive = true;
        
        WorkTypeInfo storage wt13 = workTypes[13];
        wt13.difficultyMultiplier = 10000;
        wt13.baseReward = 600;
        wt13.isActive = true;
        
        WorkTypeInfo storage wt14 = workTypes[14];
        wt14.difficultyMultiplier = 6000;
        wt14.baseReward = 320;
        wt14.isActive = true;
        
        WorkTypeInfo storage wt15 = workTypes[15];
        wt15.difficultyMultiplier = 10000;
        wt15.baseReward = 360;
        wt15.isActive = true;
        
        WorkTypeInfo storage wt16 = workTypes[16];
        wt16.difficultyMultiplier = 6000;
        wt16.baseReward = 200;
        wt16.isActive = true;
        
        WorkTypeInfo storage wt17 = workTypes[17];
        wt17.difficultyMultiplier = 10000;
        wt17.baseReward = 1000;
        wt17.isActive = true;
        
        WorkTypeInfo storage wt18 = workTypes[18];
        wt18.difficultyMultiplier = 10000;
        wt18.baseReward = 500;
        wt18.isActive = true;
        
        WorkTypeInfo storage wt19 = workTypes[19];
        wt19.difficultyMultiplier = 6000;
        wt19.baseReward = 200;
        wt19.isActive = true;
        
        WorkTypeInfo storage wt20 = workTypes[20];
        wt20.difficultyMultiplier = 10000;
        wt20.baseReward = 600;
        wt20.isActive = true;
        
        WorkTypeInfo storage wt21 = workTypes[21];
        wt21.difficultyMultiplier = 8000;
        wt21.baseReward = 400;
        wt21.isActive = true;
        
        WorkTypeInfo storage wt22 = workTypes[22];
        wt22.difficultyMultiplier = 6000;
        wt22.baseReward = 200;
        wt22.isActive = true;
        
        WorkTypeInfo storage wt23 = workTypes[23];
        wt23.difficultyMultiplier = 6000;
        wt23.baseReward = 200;
        wt23.isActive = true;
        
        WorkTypeInfo storage wt24 = workTypes[24];
        wt24.difficultyMultiplier = 8000;
        wt24.baseReward = 300;
        wt24.isActive = true;
    }
    
    function _calcAsymptoticEmission(uint256 researchValue) internal view returns (uint256) {
        uint256 currentBlock = _getCurrentBlockNumber();
        uint256 blocksSinceLastEmission = currentBlock - lastEmissionBlock;
        uint256 timeFactor = blocksSinceLastEmission * DECAY_CONSTANT / 10000;
        uint256 emissionDecay = INITIAL_EMISSION_RATE;
        
        for (uint256 i = 0; i < timeFactor && i < 100;) {
            emissionDecay = emissionDecay * 9999 / 10000;
            unchecked { ++i; }
        }
        
        uint256 researchMultiplier;
        if (researchValue <= 1000) {
            researchMultiplier = RESEARCH_MULTIPLIER_MIN + 
                ((RESEARCH_MULTIPLIER_MAX - RESEARCH_MULTIPLIER_MIN) * researchValue / 1000);
            researchMultiplier = researchMultiplier / 10000;
        } else {
            uint256 cappedResearchValue = 1000 + (researchValue - 1000) / 10;
            researchMultiplier = RESEARCH_MULTIPLIER_MIN + 
                ((RESEARCH_MULTIPLIER_MAX - RESEARCH_MULTIPLIER_MIN) * cappedResearchValue / 1000);
            researchMultiplier = researchMultiplier / 10000;
        }
        
        uint256 researchBonus = emissionDecay * researchMultiplier * researchValue / 1000;
        return emissionDecay + researchBonus;
    }
}