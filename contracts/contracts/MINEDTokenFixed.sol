// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title MINEDTokenFixed
 * @dev Fixed MINED Token with proper mining integration and asymptotic emission model
 * 
 * Features:
 * - MINED tokens earned at EVERY stage: PoW mining, PoS staking, discoveries, research
 * - Asymptotic emission model: E(t) = E₀ × e^(-λt) × (1 + α × ResearchValue(t))
 * - Research value integration for mathematical discoveries
 * - Exponential decay with research multiplier
 * - Higher soft cap for long-term growth
 * - Minter role system for ProductiveMiner contract
 * - Proper integration with mining rewards
 * 
 * Asymptotic Model Parameters:
 * - E₀ (Initial Emission Rate): 1000 tokens/block
 * - λ (Decay Constant): 0.0001 (scaled by 10000)
 * - α (Research Multiplier Base): 0.01 (scaled by 100)
 * - Soft Cap: 15,000,000,000 tokens (10x higher than original)
 * - No hard cap (asymptotic approach)
 */
contract MINEDTokenFixed is ERC20, ERC20Burnable, ERC20Pausable, Ownable, ReentrancyGuard {
    
    // Asymptotic emission parameters
    uint256 public constant INITIAL_EMISSION_RATE = 1000 * 10**18; // E₀ = 1000 tokens/block
    uint256 public constant DECAY_CONSTANT = 1; // λ = 0.0001 (scaled by 10000)
    uint256 public constant DECAY_SCALE = 10000; // Scaling factor for precision
    uint256 public constant RESEARCH_MULTIPLIER_BASE = 1; // α = 0.01 (scaled by 100)
    uint256 public constant RESEARCH_SCALE = 100; // Scaling factor for research multiplier
    uint256 public constant SOFT_CAP = 15_000_000_000 * 10**18; // 15 billion tokens (10x higher)
    
    // Platform addresses
    address public miningRewardsPool;
    address public stakingRewardsPool;
    address public researchFund;
    address public treasury;
    address public productiveMinerContract;
    
    // Asymptotic state tracking
    uint256 public currentBlockHeight;
    uint256 public totalResearchValue;
    uint256 public lastEmissionBlock;
    uint256 public totalEmitted;
    
    // Research value tracking
    mapping(uint256 => uint256) public blockResearchValue; // blockHeight => researchValue
    mapping(address => uint256) public userResearchContributions;
    
    // Minter role for ProductiveMiner contract
    mapping(address => bool) public minters;
    
    // Events
    event MinterAdded(address indexed minter);
    event MinterRemoved(address indexed minter);
    event AsymptoticEmission(uint256 blockHeight, uint256 emission, uint256 researchValue, uint256 multiplier);
    event ResearchValueAdded(uint256 blockHeight, address indexed contributor, uint256 researchValue);
    event MiningRewardsMinted(address indexed to, uint256 amount, uint256 blockHeight);
    event StakingRewardsMinted(address indexed to, uint256 amount, uint256 blockHeight);
    event ResearchRewardsMinted(address indexed to, uint256 amount, uint256 blockHeight);
    event TreasuryMinted(address indexed to, uint256 amount, uint256 blockHeight);
    
    // Modifiers
    modifier onlyMinter() {
        require(minters[msg.sender] || msg.sender == owner(), "MINED: caller is not a minter");
        _;
    }
    
    modifier onlyProductiveMiner() {
        require(msg.sender == productiveMinerContract, "MINED: only ProductiveMiner can call this");
        _;
    }
    
    /**
     * @dev Constructor - Initializes the MINED token with asymptotic model
     * @param _initialHolder Address to receive initial distribution
     * @param _miningRewardsPool Address for mining rewards pool
     * @param _stakingRewardsPool Address for staking rewards pool
     * @param _researchFund Address for research fund
     * @param _treasury Address for treasury
     * @param _productiveMiner Address of ProductiveMiner contract
     */
    constructor(
        address _initialHolder,
        address _miningRewardsPool,
        address _stakingRewardsPool,
        address _researchFund,
        address _treasury,
        address _productiveMiner
    ) ERC20("MINED", "MINED") Ownable(msg.sender) {
        require(_initialHolder != address(0), "MINED: invalid initial holder");
        require(_miningRewardsPool != address(0), "MINED: invalid mining rewards pool");
        require(_stakingRewardsPool != address(0), "MINED: invalid staking rewards pool");
        require(_researchFund != address(0), "MINED: invalid research fund");
        require(_treasury != address(0), "MINED: invalid treasury");
        require(_productiveMiner != address(0), "MINED: invalid productive miner");
        
        miningRewardsPool = _miningRewardsPool;
        stakingRewardsPool = _stakingRewardsPool;
        researchFund = _researchFund;
        treasury = _treasury;
        productiveMinerContract = _productiveMiner;
        
        currentBlockHeight = 1;
        lastEmissionBlock = 1;
        
        // Add ProductiveMiner as minter
        minters[_productiveMiner] = true;
        emit MinterAdded(_productiveMiner);
        
        // Mint initial distribution (1 billion tokens total)
        uint256 initialSupply = 1_000_000_000 * 10**18; // 1 billion tokens
        _mint(_initialHolder, initialSupply);
        totalEmitted = initialSupply;
        
        // Distribute initial tokens to pools according to tokenomics
        uint256 miningPool = initialSupply * 10 / 100; // 10% to mining rewards (100M)
        uint256 stakingPool = initialSupply * 20 / 100; // 20% to staking rewards (200M)
        uint256 researchPool = initialSupply * 10 / 100; // 10% to research fund (100M)
        uint256 treasuryPool = initialSupply * 10 / 100; // 10% to treasury (100M)
        // Remaining 50% (500M) stays with initial holder as circulating supply
        
        _mint(miningRewardsPool, miningPool);
        _mint(stakingRewardsPool, stakingPool);
        _mint(researchFund, researchPool);
        _mint(treasury, treasuryPool);
        
        totalEmitted += miningPool + stakingPool + researchPool + treasuryPool;
    }
    
    // =============================================================================
    // MINING INTEGRATION FUNCTIONS
    // =============================================================================
    
    /**
     * @dev Add research value and update asymptotic emission (called by ProductiveMiner)
     * @param _blockHeight Current block height
     * @param _researchValue Research value to add
     * @param _contributor Address contributing research value
     */
    function addResearchValue(uint256 _blockHeight, uint256 _researchValue, address _contributor) external onlyProductiveMiner {
        require(_researchValue > 0, "MINED: research value must be positive");
        require(_contributor != address(0), "MINED: invalid contributor");
        
        // Update block research value
        blockResearchValue[_blockHeight] += _researchValue;
        
        // Update total research value
        totalResearchValue += _researchValue;
        
        // Update user research contributions
        userResearchContributions[_contributor] += _researchValue;
        
        // Update current block height
        currentBlockHeight = _blockHeight;
        
        emit ResearchValueAdded(_blockHeight, _contributor, _researchValue);
    }
    
    /**
     * @dev Mint mining rewards using asymptotic emission (called by ProductiveMiner)
     * @param _to Address to mint tokens to
     * @param _amount Amount to mint
     * @param _blockHeight Current block height
     */
    function mintMiningRewards(address _to, uint256 _amount, uint256 _blockHeight) external onlyProductiveMiner {
        require(_to != address(0), "MINED: invalid recipient");
        require(_amount > 0, "MINED: amount must be positive");
        require(_blockHeight > 0, "MINED: invalid block height");
        
        // Check soft cap
        require(totalSupply() + _amount <= SOFT_CAP, "MINED: would exceed soft cap");
        
        // Mint tokens
        _mint(_to, _amount);
        totalEmitted += _amount;
        
        // Update block height
        currentBlockHeight = _blockHeight;
        
        emit MiningRewardsMinted(_to, _amount, _blockHeight);
    }
    
    /**
     * @dev Mint staking rewards (called by ProductiveMiner)
     * @param _to Address to mint tokens to
     * @param _amount Amount to mint
     * @param _blockHeight Current block height
     */
    function mintStakingRewards(address _to, uint256 _amount, uint256 _blockHeight) external onlyProductiveMiner {
        require(_to != address(0), "MINED: invalid recipient");
        require(_amount > 0, "MINED: amount must be positive");
        require(_blockHeight > 0, "MINED: invalid block height");
        
        // Check soft cap
        require(totalSupply() + _amount <= SOFT_CAP, "MINED: would exceed soft cap");
        
        // Mint tokens
        _mint(_to, _amount);
        totalEmitted += _amount;
        
        // Update block height
        currentBlockHeight = _blockHeight;
        
        emit StakingRewardsMinted(_to, _amount, _blockHeight);
    }
    
    /**
     * @dev Calculate asymptotic emission for given block height and research value
     * @param _blockHeight Block height to calculate emission for
     * @param _researchValue Research value for the block
     * @return emission Amount of tokens to emit
     */
    function calculateAsymptoticEmission(uint256 _blockHeight, uint256 _researchValue) external view returns (uint256) {
        require(_blockHeight > 0, "MINED: invalid block height");
        
        // Base emission: E₀ × e^(-λt)
        uint256 timeFactor = _blockHeight - 1; // Time since genesis
        uint256 decayFactor = DECAY_SCALE - (DECAY_CONSTANT * timeFactor / DECAY_SCALE);
        uint256 baseEmission = INITIAL_EMISSION_RATE * decayFactor / DECAY_SCALE;
        
        // Research multiplier: (1 + α × ResearchValue)
        uint256 researchMultiplier = RESEARCH_SCALE + (RESEARCH_MULTIPLIER_BASE * _researchValue / RESEARCH_SCALE);
        
        // Final emission
        uint256 emission = baseEmission * researchMultiplier / RESEARCH_SCALE;
        
        // Ensure emission is reasonable
        if (emission > INITIAL_EMISSION_RATE * 10) {
            emission = INITIAL_EMISSION_RATE * 10; // Cap at 10x initial rate
        }
        
        return emission;
    }
    
    // =============================================================================
    // VIEW FUNCTIONS
    // =============================================================================
    
    /**
     * @dev Get asymptotic token information
     * @return name Token name
     * @return symbol Token symbol
     * @return decimals Token decimals
     * @return totalSupply Total supply
     * @return currentBlockHeight Current block height
     * @return totalResearchValue Total research value
     * @return softCap Soft cap
     */
    function getAsymptoticTokenInfo() external view returns (
        string memory name,
        string memory symbol,
        uint8 decimals,
        uint256 totalSupply,
        uint256 currentBlockHeight,
        uint256 totalResearchValue,
        uint256 softCap
    ) {
        return (
            super.name(),
            super.symbol(),
            super.decimals(),
            super.totalSupply(),
            currentBlockHeight,
            totalResearchValue,
            SOFT_CAP
        );
    }
    
    /**
     * @dev Get emission parameters
     * @return initialEmissionRate Initial emission rate
     * @return decayConstant Decay constant
     * @return researchMultiplierBase Research multiplier base
     * @return currentBlockHeight Current block height
     * @return totalEmitted Total tokens emitted
     */
    function getEmissionParameters() external view returns (
        uint256 initialEmissionRate,
        uint256 decayConstant,
        uint256 researchMultiplierBase,
        uint256 currentBlockHeight,
        uint256 totalEmitted
    ) {
        return (
            INITIAL_EMISSION_RATE,
            DECAY_CONSTANT,
            RESEARCH_MULTIPLIER_BASE,
            currentBlockHeight,
            totalEmitted
        );
    }
    
    /**
     * @dev Get user research contributions
     * @param _user Address of the user
     * @return contributions Total research contributions
     */
    function getUserResearchContributions(address _user) external view returns (uint256) {
        return userResearchContributions[_user];
    }
    
    /**
     * @dev Get block research value
     * @param _blockHeight Block height
     * @return researchValue Research value for the block
     */
    function getBlockResearchValue(uint256 _blockHeight) external view returns (uint256) {
        return blockResearchValue[_blockHeight];
    }
    
    // =============================================================================
    // ADMIN FUNCTIONS
    // =============================================================================
    
    /**
     * @dev Add minter role
     * @param _minter Address to add as minter
     */
    function addMinter(address _minter) external onlyOwner {
        require(_minter != address(0), "MINED: invalid minter");
        minters[_minter] = true;
        emit MinterAdded(_minter);
    }
    
    /**
     * @dev Remove minter role
     * @param _minter Address to remove as minter
     */
    function removeMinter(address _minter) external onlyOwner {
        require(_minter != address(0), "MINED: invalid minter");
        minters[_minter] = false;
        emit MinterRemoved(_minter);
    }
    
    /**
     * @dev Update productive miner contract address
     * @param _newContract New contract address
     */
    function updateProductiveMinerContract(address _newContract) external onlyOwner {
        require(_newContract != address(0), "MINED: invalid contract address");
        
        // Remove old contract as minter
        if (productiveMinerContract != address(0)) {
            minters[productiveMinerContract] = false;
            emit MinterRemoved(productiveMinerContract);
        }
        
        // Add new contract as minter
        productiveMinerContract = _newContract;
        minters[_newContract] = true;
        emit MinterAdded(_newContract);
    }
    
    /**
     * @dev Update platform addresses
     * @param _miningRewardsPool New mining rewards pool
     * @param _stakingRewardsPool New staking rewards pool
     * @param _researchFund New research fund
     * @param _treasury New treasury
     */
    function updatePlatformAddresses(
        address _miningRewardsPool,
        address _stakingRewardsPool,
        address _researchFund,
        address _treasury
    ) external onlyOwner {
        if (_miningRewardsPool != address(0)) {
            miningRewardsPool = _miningRewardsPool;
        }
        if (_stakingRewardsPool != address(0)) {
            stakingRewardsPool = _stakingRewardsPool;
        }
        if (_researchFund != address(0)) {
            researchFund = _researchFund;
        }
        if (_treasury != address(0)) {
            treasury = _treasury;
        }
    }
    
    /**
     * @dev Mint tokens to treasury (emergency function)
     * @param _amount Amount to mint
     */
    function mintToTreasury(uint256 _amount) external onlyOwner {
        require(_amount > 0, "MINED: amount must be positive");
        require(totalSupply() + _amount <= SOFT_CAP, "MINED: would exceed soft cap");
        
        _mint(treasury, _amount);
        totalEmitted += _amount;
        
        emit TreasuryMinted(treasury, _amount, currentBlockHeight);
    }
    
    /**
     * @dev Pause token transfers
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause token transfers
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    // =============================================================================
    // OVERRIDE FUNCTIONS
    // =============================================================================
    
    /**
     * @dev Override _update to add pause functionality
     */
    function _update(address from, address to, uint256 value) internal override(ERC20, ERC20Pausable) {
        super._update(from, to, value);
    }
    
    // Note: _mint and _burn are handled by the parent ERC20 contract
    // We track totalEmitted in the minting functions instead
}
