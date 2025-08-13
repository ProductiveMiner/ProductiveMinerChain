// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title MINEDTokenAsymptoticEnhanced
 * @dev Enhanced MINED Token with asymptotic emission model for mathematical discovery mining
 * 
 * Features:
 * - Asymptotic emission model: E(t) = E₀ × e^(-λt) × (1 + α × ResearchValue(t))
 * - Research value integration for mathematical discoveries
 * - Exponential decay with research multiplier
 * - Much higher soft cap for long-term growth
 * - Minter role system for ProductiveMiner contract
 * 
 * Asymptotic Model Parameters:
 * - E₀ (Initial Emission Rate): 1000 tokens/block
 * - λ (Decay Constant): 0.0001 (scaled by 10000)
 * - α (Research Multiplier Base): 0.01 (scaled by 100)
 * - Soft Cap: 15,000,000,000 tokens (10x higher than original)
 * - No hard cap (asymptotic approach)
 */
contract MINEDTokenAsymptoticEnhanced is ERC20, ERC20Burnable, ERC20Pausable, Ownable, ReentrancyGuard {
    
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
        require(_productiveMiner != address(0), "MINED: invalid ProductiveMiner address");
        
        // Set platform addresses
        miningRewardsPool = _miningRewardsPool;
        stakingRewardsPool = _stakingRewardsPool;
        researchFund = _researchFund;
        treasury = _treasury;
        productiveMinerContract = _productiveMiner;
        
        // Initialize asymptotic state
        currentBlockHeight = 1;
        lastEmissionBlock = 0;
        totalEmitted = 0;
        totalResearchValue = 0;
        
        // Mint initial distribution (5% of soft cap - much smaller initial distribution)
        uint256 initialDistribution = SOFT_CAP / 20; // 750 million tokens (5% instead of 10%)
        _mint(_initialHolder, initialDistribution);
        totalEmitted += initialDistribution;
        
        // Add owner and ProductiveMiner as minters
        minters[msg.sender] = true;
        minters[_productiveMiner] = true;
        emit MinterAdded(msg.sender);
        emit MinterAdded(_productiveMiner);
    }
    
    /**
     * @dev Calculate asymptotic emission for a given block height
     * @param _blockHeight Block height to calculate emission for
     * @param _researchValue Research value for the block
     * @return emission Calculated emission amount
     */
    function calculateAsymptoticEmission(uint256 _blockHeight, uint256 _researchValue) 
        public 
        view 
        returns (uint256 emission) 
    {
        // E(t) = E₀ × e^(-λt) × (1 + α × ResearchValue(t))
        
        // Calculate exponential decay: e^(-λt)
        // Using approximation: e^(-λt) ≈ 1 - λt + (λt)²/2 for small λt
        uint256 lambdaT = (DECAY_CONSTANT * _blockHeight) / DECAY_SCALE;
        
        // For small values, use approximation; for larger values, cap at minimum
        uint256 decayFactor;
        if (lambdaT < DECAY_SCALE) {
            // Approximation: 1 - λt + (λt)²/2
            uint256 lambdaTSquared = (lambdaT * lambdaT) / DECAY_SCALE;
            decayFactor = DECAY_SCALE - lambdaT + (lambdaTSquared / 2);
        } else {
            // For large values, use minimum decay factor
            decayFactor = DECAY_SCALE / 100; // 1% minimum
        }
        
        // Calculate research multiplier: (1 + α × ResearchValue)
        uint256 researchMultiplier = RESEARCH_SCALE + 
            ((RESEARCH_MULTIPLIER_BASE * _researchValue) / RESEARCH_SCALE);
        
        // Calculate final emission
        emission = (INITIAL_EMISSION_RATE * decayFactor * researchMultiplier) / 
                   (DECAY_SCALE * RESEARCH_SCALE);
        
        // Ensure minimum emission of 1 token
        if (emission < 10**18) {
            emission = 10**18;
        }
        
        // Check soft cap
        if (totalEmitted + emission > SOFT_CAP) {
            emission = SOFT_CAP > totalEmitted ? SOFT_CAP - totalEmitted : 0;
        }
        
        return emission;
    }
    
    /**
     * @dev Update ProductiveMiner contract address (owner only)
     * @param _newProductiveMiner New ProductiveMiner contract address
     */
    function updateProductiveMinerContract(address _newProductiveMiner) 
        external 
        onlyOwner 
    {
        require(_newProductiveMiner != address(0), "MINED: invalid ProductiveMiner address");
        
        // Remove old ProductiveMiner as minter if it exists
        if (productiveMinerContract != address(0)) {
            minters[productiveMinerContract] = false;
            emit MinterRemoved(productiveMinerContract);
        }
        
        // Update ProductiveMiner contract address
        productiveMinerContract = _newProductiveMiner;
        
        // Add new ProductiveMiner as minter
        minters[_newProductiveMiner] = true;
        emit MinterAdded(_newProductiveMiner);
    }

    /**
     * @dev Add research value for a block (called by ProductiveMiner)
     * @param _blockHeight Block height
     * @param _researchValue Research value to add
     * @param _contributor Address that contributed the research
     */
    function addResearchValue(uint256 _blockHeight, uint256 _researchValue, address _contributor) 
        external 
        onlyProductiveMiner 
    {
        require(_researchValue > 0, "MINED: research value must be positive");
        require(_contributor != address(0), "MINED: invalid contributor");
        
        blockResearchValue[_blockHeight] += _researchValue;
        totalResearchValue += _researchValue;
        userResearchContributions[_contributor] += _researchValue;
        
        emit ResearchValueAdded(_blockHeight, _contributor, _researchValue);
    }
    
    /**
     * @dev Mint mining rewards (called by ProductiveMiner)
     * @param _to Recipient address
     * @param _amount Amount to mint
     * @param _blockHeight Block height for the emission
     */
    function mintMiningRewards(address _to, uint256 _amount, uint256 _blockHeight) 
        external 
        onlyMinter 
    {
        require(_to != address(0), "MINED: invalid recipient");
        require(_amount > 0, "MINED: amount must be positive");
        require(totalEmitted + _amount <= SOFT_CAP, "MINED: would exceed soft cap");
        
        _mint(_to, _amount);
        totalEmitted += _amount;
        currentBlockHeight = _blockHeight;
        lastEmissionBlock = _blockHeight;
        
        emit MiningRewardsMinted(_to, _amount, _blockHeight);
    }
    
    /**
     * @dev Mint staking rewards
     * @param _to Recipient address
     * @param _amount Amount to mint
     */
    function mintStakingRewards(address _to, uint256 _amount) 
        external 
        onlyMinter 
    {
        require(_to != address(0), "MINED: invalid recipient");
        require(_amount > 0, "MINED: amount must be positive");
        require(totalEmitted + _amount <= SOFT_CAP, "MINED: would exceed soft cap");
        
        _mint(_to, _amount);
        totalEmitted += _amount;
        
        emit StakingRewardsMinted(_to, _amount, block.number);
    }
    
    /**
     * @dev Mint research rewards
     * @param _to Recipient address
     * @param _amount Amount to mint
     */
    function mintResearchRewards(address _to, uint256 _amount) 
        external 
        onlyMinter 
    {
        require(_to != address(0), "MINED: invalid recipient");
        require(_amount > 0, "MINED: amount must be positive");
        require(totalEmitted + _amount <= SOFT_CAP, "MINED: would exceed soft cap");
        
        _mint(_to, _amount);
        totalEmitted += _amount;
        
        emit ResearchRewardsMinted(_to, _amount, block.number);
    }
    
    /**
     * @dev Mint treasury tokens
     * @param _to Recipient address
     * @param _amount Amount to mint
     */
    function mintTreasury(address _to, uint256 _amount) 
        external 
        onlyMinter 
    {
        require(_to != address(0), "MINED: invalid recipient");
        require(_amount > 0, "MINED: amount must be positive");
        require(totalEmitted + _amount <= SOFT_CAP, "MINED: would exceed soft cap");
        
        _mint(_to, _amount);
        totalEmitted += _amount;
        
        emit TreasuryMinted(_to, _amount, block.number);
    }
    
    /**
     * @dev Add a new minter (only owner)
     * @param _minter Address to add as minter
     */
    function addMinter(address _minter) external onlyOwner {
        require(_minter != address(0), "MINED: invalid minter address");
        require(!minters[_minter], "MINED: already a minter");
        
        minters[_minter] = true;
        emit MinterAdded(_minter);
    }
    
    /**
     * @dev Remove a minter (only owner)
     * @param _minter Address to remove as minter
     */
    function removeMinter(address _minter) external onlyOwner {
        require(_minter != address(0), "MINED: invalid minter address");
        require(minters[_minter], "MINED: not a minter");
        require(_minter != owner(), "MINED: cannot remove owner as minter");
        
        minters[_minter] = false;
        emit MinterRemoved(_minter);
    }
    
    /**
     * @dev Get asymptotic token information
     * @return tokenName Token name
     * @return tokenSymbol Token symbol
     * @return tokenDecimals Token decimals
     * @return tokenTotalSupply Total supply
     * @return tokenSoftCap Soft cap
     * @return tokenCurrentBlockHeight Current block height
     * @return tokenTotalResearchValue Total research value
     * @return tokenTotalEmitted Total emitted tokens
     */
    function getAsymptoticTokenInfo() 
        external 
        view 
        returns (
            string memory tokenName,
            string memory tokenSymbol,
            uint8 tokenDecimals,
            uint256 tokenTotalSupply,
            uint256 tokenSoftCap,
            uint256 tokenCurrentBlockHeight,
            uint256 tokenTotalResearchValue,
            uint256 tokenTotalEmitted
        ) 
    {
        return (
            name(),
            symbol(),
            decimals(),
            totalSupply(),
            SOFT_CAP,
            currentBlockHeight,
            totalResearchValue,
            totalEmitted
        );
    }
    
    /**
     * @dev Get emission parameters
     * @return initialEmissionRate Initial emission rate
     * @return decayConstant Decay constant
     * @return researchMultiplierBase Research multiplier base
     * @return decayScale Decay scale
     * @return researchScale Research scale
     */
    function getEmissionParameters() 
        external 
        pure 
        returns (
            uint256 initialEmissionRate,
            uint256 decayConstant,
            uint256 researchMultiplierBase,
            uint256 decayScale,
            uint256 researchScale
        ) 
    {
        return (
            INITIAL_EMISSION_RATE,
            DECAY_CONSTANT,
            RESEARCH_MULTIPLIER_BASE,
            DECAY_SCALE,
            RESEARCH_SCALE
        );
    }
    
    /**
     * @dev Get user research contributions
     * @param _user User address
     * @return contributions Total research contributions
     */
    function getUserResearchContributions(address _user) 
        external 
        view 
        returns (uint256 contributions) 
    {
        return userResearchContributions[_user];
    }
    
    /**
     * @dev Pause token transfers (only owner)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause token transfers (only owner)
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Override _update to respect pause state
     */
    function _update(address from, address to, uint256 value) internal override(ERC20, ERC20Pausable) {
        super._update(from, to, value);
    }
}
