// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

// Compiler settings for maximum size optimization
// solc-optimize: true
// solc-optimize-runs: 1
// solc-via-ir: true

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";

/**
 * @title OptimizedMINEDToken
 * @dev Ultra-compact Hybrid PoW/PoS Mathematical Discovery Token
 */
contract OptimizedMINEDToken is ERC20, Ownable2Step {
    
    // ============ CONSTANTS ============
    uint256 private constant INITIAL_SUPPLY = 1e27;
    uint256 private constant INITIAL_EMISSION = 1e21;
    uint256 private constant MIN_VALIDATOR_STAKE = 2e22;
    
    uint16 private constant BASE_BURN = 1000;
    uint16 private constant MILLENNIUM_BURN = 2500;
    uint16 private constant MAJOR_BURN = 1500;
    uint16 private constant COLLAB_BURN = 1200;
    
    uint16 private constant BEGINNER_MUL = 1000;
    uint16 private constant INTERMEDIATE_MUL = 2500;
    uint16 private constant ADVANCED_MUL = 5000;
    uint16 private constant EXPERT_MUL = 10000;
    
    uint16 private constant MILLENNIUM_SIG = 25000;
    uint16 private constant MAJOR_SIG = 15000;
    uint16 private constant COLLAB_SIG = 3000;
    
    // ============ STATE ============
    struct PackedState {
        uint128 totalBurned;
        uint128 totalResearchValue;
        uint64 lastEmissionBlock;
        uint32 totalValidators;
        uint32 nextDiscoveryId;
    }
    
    PackedState public state;
    uint8 public maxWorkType = 24;
    
    // ============ STRUCTS ============
    struct Validator {
        uint128 stakedAmount;
        uint64 totalValidations;
        uint32 reputation;
        uint32 registrationTime;
        bool isActive;
    }
    
    struct Discovery {
        uint128 researchValue;
        uint64 timestamp;
        uint32 validationCount;
        uint16 complexity;
        uint8 significance;
        uint8 workType;
        address researcher;
        bool isValidated;
        bool isCollaborative;
    }
    
    struct ValidationRequest {
        uint128 fee;
        uint64 requestTime;
        uint32 discoveryId;
        uint16 consensusCount;
        bool isCompleted;
    }
    
    struct WorkTypeInfo {
        uint16 difficultyMultiplier;
        uint16 baseReward;
        bool isActive;
    }
    
    // ============ MAPPINGS ============
    mapping(address => Validator) public validators;
    mapping(uint32 => Discovery) public discoveries;
    mapping(uint32 => ValidationRequest) public validationRequests;
    mapping(address => uint256) public stakingInfo;
    mapping(address => uint256) public researchContributions;
    mapping(uint32 => mapping(address => bool)) public hasValidated;
    mapping(uint8 => WorkTypeInfo) public workTypes;
    
    // ============ EVENTS ============
    event ValidatorRegistered(address indexed validator, uint256 stake);
    event ValidatorSlashed(address indexed validator, uint256 amount);
    event DiscoverySubmitted(uint32 indexed id, address indexed researcher, uint8 workType, uint256 value);
    event ValidationRequested(uint32 indexed requestId, uint32 indexed discoveryId, uint256 fee);
    event DiscoveryValidated(uint32 indexed discoveryId, address indexed validator, bool consensus);
    event SecurityFeedback(uint32 indexed discoveryId, uint256 securityEnhancement);
    event TokensBurned(address indexed from, uint256 amount);
    event WorkTypeAdded(uint8 indexed workType);
    event TokensStaked(address indexed user, uint256 amount);
    event TokensUnstaked(address indexed user, uint256 amount, uint256 reward);
    event WorkTypeUpdated(uint8 indexed workType, bool isActive);
    event ValidatorUnregistered(address indexed validator);
    event EmissionMinted(address indexed to, uint256 amount);
    
    // ============ CONSTRUCTOR ============
    constructor(address holder) payable ERC20("MINED", "MINED") Ownable(holder) {
        require(holder != address(0), "Invalid holder");
        _mint(holder, INITIAL_SUPPLY);
        
        state.lastEmissionBlock = uint64(block.number);
        state.totalBurned = 1;
        state.totalResearchValue = 1;
        state.nextDiscoveryId = 1;
        
        _initWorkTypes();
    }
    
    // ============ VALIDATOR FUNCTIONS ============
    
    function registerValidator() external {
        uint256 minStake = MIN_VALIDATOR_STAKE;
        require(balanceOf(msg.sender) > minStake - 1, "Insufficient balance");
        require(!validators[msg.sender].isActive, "Already registered");
        
        address contractAddr = address(this);
        _transfer(msg.sender, contractAddr, minStake);
        
        Validator storage validator = validators[msg.sender];
        validator.stakedAmount = uint128(minStake);
        validator.totalValidations = 0;
        validator.reputation = 1000;
        validator.registrationTime = uint32(block.timestamp);
        validator.isActive = true;
        
        unchecked { ++state.totalValidators; }
        emit ValidatorRegistered(msg.sender, minStake);
    }
    
    function unregisterValidator() external {
        Validator storage validator = validators[msg.sender];
        require(validator.isActive, "Not registered");
        
        uint256 stakedAmount = validator.stakedAmount;
        address contractAddr = address(this);
        _transfer(contractAddr, msg.sender, stakedAmount);
        delete validators[msg.sender];
        unchecked { --state.totalValidators; }
        emit ValidatorUnregistered(msg.sender);
    }
    
    function slashValidator(address validatorAddr, uint256 amount) external payable onlyOwner {
        require(validatorAddr != address(0), "Invalid validator");
        Validator storage v = validators[validatorAddr];
        require(v.isActive, "Not active");
        require(amount != 0, "Zero amount");
        require(amount < v.stakedAmount + 1, "Amount too high");
        
        address contractAddr = address(this);
        _burn(contractAddr, amount);
        
        unchecked {
            state.totalBurned += uint128(amount);
            v.stakedAmount -= uint128(amount);
            v.reputation = v.reputation >= 100 ? v.reputation - 100 : 0;
        }
        
        if (v.stakedAmount <= MIN_VALIDATOR_STAKE - 1) {
            v.isActive = false;
            unchecked { --state.totalValidators; }
        }
        
        emit ValidatorSlashed(validatorAddr, amount);
        emit TokensBurned(contractAddr, amount);
    }
    
    // ============ DISCOVERY FUNCTIONS ============
    
    function submitDiscovery(
        uint8 workType,
        uint8 complexity,
        uint8 significance,
        uint256 researchValue,
        bool isCollaborative
    ) external returns (uint32) {
        require(workType < maxWorkType + 1, "Invalid work type");
        require(workTypes[workType].isActive, "Work type inactive");
        require(complexity != 0, "Zero complexity");
        require(complexity < 11, "Complexity too high");
        require(significance != 0, "Zero significance");
        require(significance < 4, "Significance too high");
        require(researchValue != 0, "Zero research value");
        
        uint32 discoveryId = state.nextDiscoveryId++;
        
        Discovery storage discovery = discoveries[discoveryId];
        discovery.researchValue = uint128(researchValue);
        discovery.timestamp = uint64(block.timestamp);
        discovery.validationCount = 0;
        discovery.complexity = complexity;
        discovery.significance = significance;
        discovery.workType = workType;
        discovery.researcher = msg.sender;
        discovery.isValidated = false;
        discovery.isCollaborative = isCollaborative;
        
        uint256 reward = _calcReward(workType, complexity, significance, researchValue, isCollaborative);
        uint256 burnAmount = _calcBurn(significance, isCollaborative, reward);
        
        _mint(msg.sender, reward - burnAmount);
        if (burnAmount != 0) {
            _burn(msg.sender, burnAmount);
            unchecked { state.totalBurned += uint128(burnAmount); }
        }
        
        unchecked {
            state.totalResearchValue += uint128(researchValue);
            researchContributions[msg.sender] += researchValue;
        }
        
        emit DiscoverySubmitted(discoveryId, msg.sender, workType, researchValue);
        return discoveryId;
    }
    
    function requestValidation(uint32 discoveryId, uint256 fee) external returns (uint32) {
        require(discoveries[discoveryId].researcher != address(0), "Discovery not found");
        require(fee > 1e18 - 1, "Fee too low");
        require(balanceOf(msg.sender) > fee - 1, "Insufficient balance");
        
        _burn(msg.sender, fee);
        unchecked { state.totalBurned += uint128(fee); }
        
        uint32 requestId = uint32(block.timestamp);
        ValidationRequest storage request = validationRequests[requestId];
        request.fee = uint128(fee);
        request.requestTime = uint64(block.timestamp);
        request.discoveryId = discoveryId;
        request.consensusCount = 0;
        request.isCompleted = false;
        
        emit ValidationRequested(requestId, discoveryId, fee);
        return requestId;
    }
    
    function validateDiscovery(uint32 requestId, bool isValid) external {
        require(validators[msg.sender].isActive, "Not validator");
        require(!hasValidated[requestId][msg.sender], "Already validated");
        
        ValidationRequest storage request = validationRequests[requestId];
        require(!request.isCompleted, "Request completed");
        
        Discovery storage discovery = discoveries[request.discoveryId];
        hasValidated[requestId][msg.sender] = true;
        
        if (isValid) {
            unchecked {
                ++request.consensusCount;
                ++validators[msg.sender].totalValidations;
            }
        }
        
        uint256 requiredConsensus = (state.totalValidators << 1) / 3 + 1;
        
        if (request.consensusCount >= requiredConsensus) {
            request.isCompleted = true;
            discovery.isValidated = true;
            discovery.validationCount = request.consensusCount;
            
            uint256 securityEnhancement = discovery.researchValue * discovery.complexity;
            emit SecurityFeedback(request.discoveryId, securityEnhancement);
            
            uint256 reward = (request.fee * 500) / 10000;
            _mint(msg.sender, reward);
        }
        
        emit DiscoveryValidated(request.discoveryId, msg.sender, request.consensusCount >= requiredConsensus);
    }
    
    // ============ EMISSION & STAKING ============
    
    function calculateEmission() public view returns (uint256 emission) {
        uint256 cachedLastBlock = state.lastEmissionBlock;
        uint256 cachedResearchValue = state.totalResearchValue;
        
        uint256 currentBlock = _getCurrentBlockNumber();
        uint256 blockDelta = currentBlock - cachedLastBlock;
        uint256 decay = blockDelta >= 10000 ? 1 : 10000 - blockDelta;
        uint256 research = cachedResearchValue != 1 ? cachedResearchValue - 1 : 0;
        
        uint256 researchMultiplier = 10000 + (research >> 15);
        emission = (INITIAL_EMISSION * decay * researchMultiplier) / 1e8;
    }
    
    // L2 compatibility: use ArbSys for Arbitrum, block.number for others
    function _getCurrentBlockNumber() internal view returns (uint256) {
        (bool success, bytes memory data) = address(100).staticcall(
            abi.encodeWithSignature("arbBlockNumber()")
        );
        
        if (success && data.length >= 32) {
            return abi.decode(data, (uint256));
        }
        
        return block.number;
    }
    
    function mintEmission(address to) external payable onlyOwner {
        require(to != address(0), "Invalid address");
        uint256 emission = calculateEmission();
        if (emission != 0) {
            _mint(to, emission);
            state.lastEmissionBlock = uint64(_getCurrentBlockNumber());
            emit EmissionMinted(to, emission);
        }
    }
    
    function stakeTokens(uint256 amount) external {
        require(amount != 0, "Zero amount");
        require(balanceOf(msg.sender) > amount - 1, "Insufficient balance");
        
        address contractAddr = address(this);
        _transfer(msg.sender, contractAddr, amount);
        unchecked { stakingInfo[msg.sender] += amount; }
        emit TokensStaked(msg.sender, amount);
    }
    
    function unstake(uint256 amount) external {
        require(amount != 0, "Zero amount");
        require(stakingInfo[msg.sender] > amount - 1, "Insufficient staked");
        
        unchecked { stakingInfo[msg.sender] -= amount; }
        uint256 reward = (amount * 8) / 100;
        
        address contractAddr = address(this);
        _transfer(contractAddr, msg.sender, amount);
        if (reward != 0) _mint(msg.sender, reward);
        emit TokensUnstaked(msg.sender, amount, reward);
    }
    
    // ============ WORK TYPE MANAGEMENT ============
    
    function addWorkType(uint8 workType, uint16 difficultyMultiplier, uint16 baseReward) external payable onlyOwner {
        require(workType > maxWorkType, "Invalid work type");
        require(difficultyMultiplier != 0, "Zero multiplier");
        
        workTypes[workType] = WorkTypeInfo({
            difficultyMultiplier: difficultyMultiplier,
            baseReward: baseReward,
            isActive: true
        });
        
        maxWorkType = workType;
        emit WorkTypeAdded(workType);
    }
    
    function updateWorkType(uint8 workType, bool isActive) external payable onlyOwner {
        require(workType < maxWorkType + 1, "Invalid work type");
        WorkTypeInfo storage workTypeInfo = workTypes[workType];
        if (workTypeInfo.isActive != isActive) {
            workTypeInfo.isActive = isActive;
            emit WorkTypeUpdated(workType, isActive);
        }
    }
    
    // ============ INTERNAL FUNCTIONS ============
    
    function _calcReward(uint8 workType, uint8 complexity, uint8 significance, uint256 researchValue, bool isCollab) 
        internal view returns (uint256) {
        
        WorkTypeInfo storage workInfo = workTypes[workType];
        uint256 complexityMul = workInfo.difficultyMultiplier != 0 ? workInfo.difficultyMultiplier :
                               (complexity <= 3 ? BEGINNER_MUL :
                                complexity <= 6 ? INTERMEDIATE_MUL :
                                complexity <= 8 ? ADVANCED_MUL : EXPERT_MUL);
                               
        uint256 sigMul = significance == 3 ? MILLENNIUM_SIG :
                        significance == 2 ? MAJOR_SIG :
                        isCollab ? COLLAB_SIG : 1000;
        
        return (INITIAL_EMISSION * complexityMul * sigMul * researchValue) / 1e12;
    }
    
    function _calcBurn(uint8 significance, bool isCollab, uint256 reward) 
        internal pure returns (uint256) {
        uint256 burnRate = significance == 3 ? MILLENNIUM_BURN :
                          significance == 2 ? MAJOR_BURN :
                          isCollab ? COLLAB_BURN : BASE_BURN;
        
        return (reward * burnRate) / 10000;
    }
    
    function _initWorkTypes() private {
        // Compact initialization - only essential data
        workTypes[0] = WorkTypeInfo(10000, 1000, true); // Riemann
        workTypes[1] = WorkTypeInfo(8000, 750, true);   // Goldbach
        workTypes[2] = WorkTypeInfo(8000, 700, true);   // Birch-Swinnerton
        workTypes[3] = WorkTypeInfo(6000, 500, true);   // Prime Pattern
        workTypes[4] = WorkTypeInfo(8000, 650, true);   // Twin Primes
        workTypes[5] = WorkTypeInfo(6000, 600, true);   // Collatz
        workTypes[6] = WorkTypeInfo(8000, 720, true);   // Perfect Numbers
        workTypes[7] = WorkTypeInfo(10000, 1000, true); // Mersenne
        workTypes[8] = WorkTypeInfo(4000, 450, true);   // Fibonacci
        workTypes[9] = WorkTypeInfo(4000, 400, true);   // Pascal
        workTypes[10] = WorkTypeInfo(8000, 760, true);  // Differential
        workTypes[11] = WorkTypeInfo(6000, 640, true);  // Number Theory
        workTypes[12] = WorkTypeInfo(10000, 900, true); // Yang-Mills
        workTypes[13] = WorkTypeInfo(10000, 850, true); // Navier-Stokes
        workTypes[14] = WorkTypeInfo(6000, 550, true);  // ECC
        workTypes[15] = WorkTypeInfo(10000, 800, true); // Lattice
        workTypes[16] = WorkTypeInfo(6000, 680, true);  // Crypto Hash
        workTypes[17] = WorkTypeInfo(10000, 950, true); // Poincare
        workTypes[18] = WorkTypeInfo(10000, 920, true); // Algebraic Topology
        workTypes[19] = WorkTypeInfo(6000, 560, true);  // Euclidean
        workTypes[20] = WorkTypeInfo(10000, 1100, true); // Quantum
        workTypes[21] = WorkTypeInfo(8000, 840, true);  // ML
        workTypes[22] = WorkTypeInfo(6000, 600, true);  // Blockchain
        workTypes[23] = WorkTypeInfo(6000, 560, true);  // Distributed
        workTypes[24] = WorkTypeInfo(8000, 760, true);  // Optimization
    }
    
    // ============ VIEW FUNCTIONS ============
    
    function getSystemInfo() external view returns (
        uint256 totalSupply_,
        uint256 totalBurned_,
        uint256 totalResearchValue_,
        uint256 totalValidators_,
        uint256 currentEmission
    ) {
        uint256 cachedTotalBurned = state.totalBurned;
        uint256 cachedTotalResearchValue = state.totalResearchValue;
        
        return (
            totalSupply(),
            cachedTotalBurned != 1 ? cachedTotalBurned - 1 : 0,
            cachedTotalResearchValue != 1 ? cachedTotalResearchValue - 1 : 0,
            state.totalValidators,
            calculateEmission()
        );
    }
    
    function getValidatorInfo(address validator) external view returns (
        uint256 stakedAmount,
        uint256 validations,
        uint256 reputation,
        bool isActive
    ) {
        Validator storage v = validators[validator];
        return (v.stakedAmount, v.totalValidations, v.reputation, v.isActive);
    }
    
    function getDiscovery(uint32 discoveryId) external view returns (
        address researcher,
        uint8 workType,
        uint8 complexity,
        uint8 significance,
        uint256 researchValue,
        bool isValidated,
        uint256 validationCount
    ) {
        Discovery storage d = discoveries[discoveryId];
        return (d.researcher, d.workType, uint8(d.complexity), d.significance, 
                uint256(d.researchValue), d.isValidated, uint256(d.validationCount));
    }
    
    function getWorkTypeInfo(uint8 workType) external view returns (
        uint16 difficultyMultiplier,
        uint16 baseReward,
        bool isActive
    ) {
        require(workType < maxWorkType + 1, "Invalid work type");
        WorkTypeInfo storage info = workTypes[workType];
        return (info.difficultyMultiplier, info.baseReward, info.isActive);
    }
}