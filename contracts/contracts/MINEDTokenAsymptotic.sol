// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title MINEDTokenAsymptotic
 * @dev MINED Token with asymptotic tokenomic model as specified
 * 
 * Tokenomics:
 * - Initial Supply: 1 billion MINED tokens
 * - Asymptotic function: S(t) = S₀ + Σ(E(t) - B(t))
 * - Emission: E(t) = E₀ × e^(-λt) × (1 + α × ResearchValue(t))
 * - Deflationary pressure as supply approaches 1.5 billion asymptotically
 * - Research-based burns and transaction fee burns
 * - Collaborative incentives and governance participation
 * 
 * Initial Distribution:
 * - Circulating Supply: 500M (50%)
 * - Staked Tokens: 200M (20%)
 * - Governance Pool: 50M (5%)
 * - Research Access: 100M (10%)
 * - Mining Rewards: 100M (10%)
 * - Transaction Fees: 50M (5%)
 * - Treasury: 100M (10%)
 */
contract MINEDTokenAsymptotic is ERC20, ERC20Burnable, ERC20Pausable, Ownable, ReentrancyGuard {
    
    // Asymptotic model parameters
    uint256 public constant INITIAL_SUPPLY = 1_000_000_000 * 10**18; // 1 billion tokens
    uint256 public constant ASYMPTOTIC_TARGET = 1_500_000_000 * 10**18; // 1.5 billion target
    uint256 public constant INITIAL_EMISSION_RATE = 1000 * 10**18; // E₀ = 1000 tokens/block
    uint256 public constant DECAY_CONSTANT = 1; // λ = 0.0001 (scaled by 10000)
    uint256 public constant DECAY_SCALE = 10000; // Scaling factor for precision
    uint256 public constant RESEARCH_MULTIPLIER_BASE = 1; // α = 0.01 (scaled by 100)
    uint256 public constant RESEARCH_SCALE = 100; // Scaling factor for research multiplier
    
    // Platform addresses
    address public miningRewardsPool;
    address public stakingRewardsPool;
    address public governancePool;
    address public researchAccessPool;
    address public transactionFeesPool;
    address public treasury;
    address public productiveMinerContract;
    
    // Multi-chain integration mapping
    mapping(string => address) public bridgeContracts; // chainId => bridgeContract
    mapping(string => bool) public chainIntegrationEnabled; // chainId => enabled
    string[] public supportedChains;
    
    // Asymptotic state tracking
    uint256 public currentBlockHeight;
    uint256 public totalResearchValue;
    uint256 public lastEmissionBlock;
    uint256 public totalEmitted;
    uint256 public totalBurned;
    
    // Research value tracking
    mapping(uint256 => uint256) public blockResearchValue; // blockHeight => researchValue
    mapping(address => uint256) public userResearchContributions;
    
    // Burn tracking
    mapping(address => uint256) public userBurns;
    mapping(uint256 => uint256) public blockBurns; // blockHeight => burnAmount
    
    // Minter role for ProductiveMiner contract
    mapping(address => bool) public minters;
    
    // Research complexity multipliers
    mapping(uint8 => uint256) public complexityMultipliers;
    mapping(uint8 => uint256) public significanceMultipliers;
    
    // Events
    event MinterAdded(address indexed minter);
    event MinterRemoved(address indexed minter);
    event AsymptoticEmission(uint256 blockHeight, uint256 emission, uint256 researchValue, uint256 multiplier);
    event ResearchValueAdded(uint256 blockHeight, address indexed contributor, uint256 researchValue);
    event MiningRewardsMinted(address indexed to, uint256 amount, uint256 blockHeight);
    event StakingRewardsMinted(address indexed to, uint256 amount, uint256 blockHeight);
    event ResearchRewardsMinted(address indexed to, uint256 amount, uint256 blockHeight);
    event TreasuryMinted(address indexed to, uint256 amount, uint256 blockHeight);
    event ResearchBurn(address indexed from, uint256 amount, uint256 researchImpact);
    event TransactionFeeBurn(uint256 amount, uint256 blockHeight);
    event CollaborativeBurn(address indexed from, uint256 amount, uint256 bonus);
    event ChainIntegrationEnabled(string indexed chainId, address indexed bridgeContract);
    event ChainIntegrationDisabled(string indexed chainId);
    event CrossChainTransfer(address indexed from, address indexed to, uint256 amount, string sourceChain, string targetChain);
    
    // Modifiers
    modifier onlyMinter() {
        require(minters[msg.sender] || msg.sender == owner(), "MINED: caller is not a minter");
        _;
    }
    
    modifier onlyProductiveMiner() {
        require(msg.sender == productiveMinerContract, "MINED: only ProductiveMiner can call this");
        _;
    }
    
    modifier onlyBridgeContract() {
        bool isBridgeContract = false;
        for (uint i = 0; i < supportedChains.length; i++) {
            if (msg.sender == bridgeContracts[supportedChains[i]]) {
                isBridgeContract = true;
                break;
            }
        }
        require(isBridgeContract, "MINED: only bridge contracts can call this");
        _;
    }
    
    /**
     * @dev Constructor - Initializes the MINED token with asymptotic model
     * @param _initialHolder Address to receive initial distribution
     * @param _miningRewardsPool Address for mining rewards pool
     * @param _stakingRewardsPool Address for staking rewards pool
     * @param _governancePool Address for governance pool
     * @param _researchAccessPool Address for research access pool
     * @param _transactionFeesPool Address for transaction fees pool
     * @param _treasury Address for treasury
     * @param _productiveMiner Address of ProductiveMiner contract
     */
    constructor(
        address _initialHolder,
        address _miningRewardsPool,
        address _stakingRewardsPool,
        address _governancePool,
        address _researchAccessPool,
        address _transactionFeesPool,
        address _treasury,
        address _productiveMiner
    ) ERC20("MINED", "MINED") Ownable(msg.sender) {
        require(_initialHolder != address(0), "MINED: invalid initial holder");
        require(_miningRewardsPool != address(0), "MINED: invalid mining rewards pool");
        require(_stakingRewardsPool != address(0), "MINED: invalid staking rewards pool");
        require(_governancePool != address(0), "MINED: invalid governance pool");
        require(_researchAccessPool != address(0), "MINED: invalid research access pool");
        require(_transactionFeesPool != address(0), "MINED: invalid transaction fees pool");
        require(_treasury != address(0), "MINED: invalid treasury");
        require(_productiveMiner != address(0), "MINED: invalid productive miner");
        
        miningRewardsPool = _miningRewardsPool;
        stakingRewardsPool = _stakingRewardsPool;
        governancePool = _governancePool;
        researchAccessPool = _researchAccessPool;
        transactionFeesPool = _transactionFeesPool;
        treasury = _treasury;
        productiveMinerContract = _productiveMiner;
        
        currentBlockHeight = 1;
        lastEmissionBlock = 1;
        
        // Add ProductiveMiner as minter
        minters[_productiveMiner] = true;
        emit MinterAdded(_productiveMiner);
        
        // Initialize complexity multipliers
        complexityMultipliers[1] = 100; // Beginner (1-3): 1.0x
        complexityMultipliers[2] = 250; // Intermediate (4-6): 2.5x
        complexityMultipliers[3] = 500; // Advanced (7-8): 5.0x
        complexityMultipliers[4] = 1000; // Expert (9-10): 10.0x
        
        // Initialize significance multipliers
        significanceMultipliers[1] = 2500; // Millennium Problems: 25.0x
        significanceMultipliers[2] = 1500; // Major Theorems: 15.0x
        significanceMultipliers[3] = 100; // Standard Research: 1.0x
        significanceMultipliers[4] = 300; // Collaborative Discovery: 3.0x
        
        // Mint initial distribution (1 billion tokens total)
        _mint(_initialHolder, INITIAL_SUPPLY * 50 / 100); // 500M circulating supply (50%)
        _mint(_stakingRewardsPool, INITIAL_SUPPLY * 20 / 100); // 200M staked tokens (20%)
        _mint(_governancePool, INITIAL_SUPPLY * 5 / 100); // 50M governance pool (5%)
        _mint(_researchAccessPool, INITIAL_SUPPLY * 10 / 100); // 100M research access (10%)
        _mint(_miningRewardsPool, INITIAL_SUPPLY * 10 / 100); // 100M mining rewards (10%)
        _mint(_transactionFeesPool, INITIAL_SUPPLY * 5 / 100); // 50M transaction fees (5%)
        _mint(_treasury, INITIAL_SUPPLY * 10 / 100); // 100M treasury (10%)
        
        totalEmitted = INITIAL_SUPPLY;
    }
    
    // =============================================================================
    // ASYMPTOTIC EMISSION MODEL
    // =============================================================================
    
    /**
     * @dev Calculate asymptotic emission: E(t) = E₀ × e^(-λt) × (1 + α × ResearchValue(t))
     * @param _blockHeight Current block height
     * @return emission Calculated emission amount
     */
    function calculateAsymptoticEmission(uint256 _blockHeight) public view returns (uint256 emission) {
        require(_blockHeight > 0, "MINED: invalid block height");
        
        // Calculate time decay: e^(-λt)
        uint256 timeDecay = _calculateTimeDecay(_blockHeight);
        
        // Calculate research multiplier: (1 + α × ResearchValue(t))
        uint256 researchMultiplier = _calculateResearchMultiplier(_blockHeight);
        
        // Calculate emission: E₀ × timeDecay × researchMultiplier
        emission = (INITIAL_EMISSION_RATE * timeDecay * researchMultiplier) / (DECAY_SCALE * RESEARCH_SCALE);
        
        // Ensure emission doesn't exceed asymptotic target
        if (totalSupply() + emission > ASYMPTOTIC_TARGET) {
            emission = ASYMPTOTIC_TARGET > totalSupply() ? ASYMPTOTIC_TARGET - totalSupply() : 0;
        }
        
        return emission;
    }
    
    /**
     * @dev Calculate time decay factor: e^(-λt)
     * @param _blockHeight Current block height
     * @return timeDecay Time decay factor (scaled by DECAY_SCALE)
     */
    function _calculateTimeDecay(uint256 _blockHeight) internal view returns (uint256 timeDecay) {
        // Simplified exponential decay calculation
        uint256 timeFactor = _blockHeight * DECAY_CONSTANT;
        if (timeFactor > 1000) {
            timeFactor = 1000; // Cap to prevent overflow
        }
        
        // Approximate e^(-λt) using a lookup table or simplified calculation
        timeDecay = DECAY_SCALE - (timeFactor * DECAY_SCALE) / 10000;
        if (timeDecay < DECAY_SCALE / 10) {
            timeDecay = DECAY_SCALE / 10; // Minimum decay factor
        }
        
        return timeDecay;
    }
    
    /**
     * @dev Calculate research multiplier: (1 + α × ResearchValue(t))
     * @param _blockHeight Current block height
     * @return researchMultiplier Research multiplier (scaled by RESEARCH_SCALE)
     */
    function _calculateResearchMultiplier(uint256 _blockHeight) internal view returns (uint256 researchMultiplier) {
        uint256 blockResearch = blockResearchValue[_blockHeight];
        uint256 researchFactor = (blockResearch * RESEARCH_MULTIPLIER_BASE) / 1000; // Scale down research value
        
        researchMultiplier = RESEARCH_SCALE + researchFactor;
        
        // Cap research multiplier to prevent excessive emission
        if (researchMultiplier > RESEARCH_SCALE * 5) {
            researchMultiplier = RESEARCH_SCALE * 5;
        }
        
        return researchMultiplier;
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
        
        // Check asymptotic target
        require(totalSupply() + _amount <= ASYMPTOTIC_TARGET, "MINED: would exceed asymptotic target");
        
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
        
        // Check asymptotic target
        require(totalSupply() + _amount <= ASYMPTOTIC_TARGET, "MINED: would exceed asymptotic target");
        
        // Mint tokens
        _mint(_to, _amount);
        totalEmitted += _amount;
        
        // Update block height
        currentBlockHeight = _blockHeight;
        
        emit StakingRewardsMinted(_to, _amount, _blockHeight);
    }
    
    /**
     * @dev Mint research rewards (called by ProductiveMiner)
     * @param _to Address to mint tokens to
     * @param _amount Amount to mint
     * @param _blockHeight Current block height
     */
    function mintResearchRewards(address _to, uint256 _amount, uint256 _blockHeight) external onlyProductiveMiner {
        require(_to != address(0), "MINED: invalid recipient");
        require(_amount > 0, "MINED: amount must be positive");
        require(_blockHeight > 0, "MINED: invalid block height");
        
        // Check asymptotic target
        require(totalSupply() + _amount <= ASYMPTOTIC_TARGET, "MINED: would exceed asymptotic target");
        
        // Mint tokens
        _mint(_to, _amount);
        totalEmitted += _amount;
        
        // Update block height
        currentBlockHeight = _blockHeight;
        
        emit ResearchRewardsMinted(_to, _amount, _blockHeight);
    }
    
    // =============================================================================
    // DEFLATIONARY MECHANISMS
    // =============================================================================
    
    /**
     * @dev Burn tokens based on research impact
     * @param _amount Amount to burn
     * @param _researchImpact Research impact level (1-4: Standard, Collaborative, Major, Millennium)
     */
    function burnForResearch(uint256 _amount, uint8 _researchImpact) external {
        require(_amount > 0, "MINED: amount must be positive");
        require(_researchImpact >= 1 && _researchImpact <= 4, "MINED: invalid research impact");
        require(balanceOf(msg.sender) >= _amount, "MINED: insufficient balance");
        
        // Calculate burn rate based on research impact
        uint256 burnRate;
        if (_researchImpact == 1) {
            burnRate = 10; // Standard Research: 10%
        } else if (_researchImpact == 2) {
            burnRate = 12; // Collaborative Research: 12%
        } else if (_researchImpact == 3) {
            burnRate = 15; // Major Theorems: 15%
        } else {
            burnRate = 25; // Millennium Problems: 25%
        }
        
        uint256 burnAmount = (_amount * burnRate) / 100;
        
        // Burn tokens
        _burn(msg.sender, burnAmount);
        totalBurned += burnAmount;
        userBurns[msg.sender] += burnAmount;
        blockBurns[block.number] += burnAmount;
        
        emit ResearchBurn(msg.sender, burnAmount, _researchImpact);
    }
    
    /**
     * @dev Burn transaction fees (called by ProductiveMiner)
     * @param _amount Amount to burn
     */
    function burnTransactionFees(uint256 _amount) external onlyProductiveMiner {
        require(_amount > 0, "MINED: amount must be positive");
        require(balanceOf(msg.sender) >= _amount, "MINED: insufficient balance");
        
        // Burn tokens
        _burn(msg.sender, _amount);
        totalBurned += _amount;
        blockBurns[block.number] += _amount;
        
        emit TransactionFeeBurn(_amount, block.number);
    }
    
    /**
     * @dev Burn tokens for collaborative work bonus
     * @param _amount Amount to burn
     */
    function burnForCollaboration(uint256 _amount) external {
        require(_amount > 0, "MINED: amount must be positive");
        require(balanceOf(msg.sender) >= _amount, "MINED: insufficient balance");
        
        // 20% additional burn for collaborative work
        uint256 burnAmount = (_amount * 20) / 100;
        
        // Burn tokens
        _burn(msg.sender, burnAmount);
        totalBurned += burnAmount;
        userBurns[msg.sender] += burnAmount;
        blockBurns[block.number] += burnAmount;
        
        emit CollaborativeBurn(msg.sender, burnAmount, 20);
    }
    
    // =============================================================================
    // MULTI-CHAIN INTEGRATION FUNCTIONS
    // =============================================================================
    
    /**
     * @dev Enable integration with any blockchain
     * @param _chainId Unique identifier for the blockchain (e.g., "ETH", "POLKADOT", "BSC", "SOLANA")
     * @param _bridgeContract Address of the bridge contract for the chain
     */
    function enableChainIntegration(string memory _chainId, address _bridgeContract) external onlyOwner {
        require(_bridgeContract != address(0), "MINED: invalid bridge contract");
        require(bytes(_chainId).length > 0, "MINED: invalid chain ID");
        require(!chainIntegrationEnabled[_chainId], "MINED: chain integration already enabled");
        
        bridgeContracts[_chainId] = _bridgeContract;
        chainIntegrationEnabled[_chainId] = true;
        supportedChains.push(_chainId);
        minters[_bridgeContract] = true;
        
        emit ChainIntegrationEnabled(_chainId, _bridgeContract);
        emit MinterAdded(_bridgeContract);
    }
    
    /**
     * @dev Disable integration with a specific blockchain
     * @param _chainId Chain identifier to disable
     */
    function disableChainIntegration(string memory _chainId) external onlyOwner {
        require(chainIntegrationEnabled[_chainId], "MINED: chain integration not enabled");
        
        address bridgeContract = bridgeContracts[_chainId];
        chainIntegrationEnabled[_chainId] = false;
        minters[bridgeContract] = false;
        
        // Remove from supported chains array
        for (uint i = 0; i < supportedChains.length; i++) {
            if (keccak256(bytes(supportedChains[i])) == keccak256(bytes(_chainId))) {
                supportedChains[i] = supportedChains[supportedChains.length - 1];
                supportedChains.pop();
                break;
            }
        }
        
        emit ChainIntegrationDisabled(_chainId);
        emit MinterRemoved(bridgeContract);
    }
    
    /**
     * @dev Mint tokens for cross-chain transfers (called by bridge contracts)
     * @param _to Recipient address
     * @param _amount Amount to mint
     * @param _sourceChain Source chain identifier
     * @param _targetChain Target chain identifier
     */
    function mintForCrossChainTransfer(
        address _to,
        uint256 _amount,
        string memory _sourceChain,
        string memory _targetChain
    ) external onlyBridgeContract {
        require(_to != address(0), "MINED: invalid recipient");
        require(_amount > 0, "MINED: amount must be positive");
        require(bytes(_sourceChain).length > 0, "MINED: invalid source chain");
        require(bytes(_targetChain).length > 0, "MINED: invalid target chain");
        
        // Check asymptotic target
        require(totalSupply() + _amount <= ASYMPTOTIC_TARGET, "MINED: would exceed asymptotic target");
        
        // Mint tokens
        _mint(_to, _amount);
        totalEmitted += _amount;
        
        emit CrossChainTransfer(address(0), _to, _amount, _sourceChain, _targetChain);
    }
    
    /**
     * @dev Burn tokens for cross-chain transfers (called by bridge contracts)
     * @param _from Source address
     * @param _amount Amount to burn
     * @param _sourceChain Source chain identifier
     * @param _targetChain Target chain identifier
     */
    function burnForCrossChainTransfer(
        address _from,
        uint256 _amount,
        string memory _sourceChain,
        string memory _targetChain
    ) external onlyBridgeContract {
        require(_from != address(0), "MINED: invalid source");
        require(_amount > 0, "MINED: amount must be positive");
        require(bytes(_sourceChain).length > 0, "MINED: invalid source chain");
        require(bytes(_targetChain).length > 0, "MINED: invalid target chain");
        require(balanceOf(_from) >= _amount, "MINED: insufficient balance");
        
        // Burn tokens
        _burn(_from, _amount);
        totalBurned += _amount;
        
        emit CrossChainTransfer(_from, address(0), _amount, _sourceChain, _targetChain);
    }
    
    /**
     * @dev Get multi-chain integration status
     * @return chainIds Array of supported chain IDs
     * @return bridgeAddresses Array of bridge contract addresses
     * @return enabledStatus Array of enabled status for each chain
     */
    function getMultiChainStatus() external view returns (
        string[] memory chainIds,
        address[] memory bridgeAddresses,
        bool[] memory enabledStatus
    ) {
        chainIds = new string[](supportedChains.length);
        bridgeAddresses = new address[](supportedChains.length);
        enabledStatus = new bool[](supportedChains.length);
        
        for (uint i = 0; i < supportedChains.length; i++) {
            chainIds[i] = supportedChains[i];
            bridgeAddresses[i] = bridgeContracts[supportedChains[i]];
            enabledStatus[i] = chainIntegrationEnabled[supportedChains[i]];
        }
        
        return (chainIds, bridgeAddresses, enabledStatus);
    }
    
    /**
     * @dev Check if a specific chain integration is enabled
     * @param _chainId Chain identifier to check
     * @return enabled Whether the chain integration is enabled
     * @return bridgeContract Bridge contract address for the chain
     */
    function isChainIntegrationEnabled(string memory _chainId) external view returns (
        bool enabled,
        address bridgeContract
    ) {
        return (
            chainIntegrationEnabled[_chainId],
            bridgeContracts[_chainId]
        );
    }
    
    /**
     * @dev Get total number of supported chains
     * @return count Number of supported chains
     */
    function getSupportedChainCount() external view returns (uint256 count) {
        return supportedChains.length;
    }
    
    // =============================================================================
    // GOVERNANCE AND UTILITY FUNCTIONS
    // =============================================================================
    
    /**
     * @dev Add minter role
     * @param _minter Address to add as minter
     */
    function addMinter(address _minter) external onlyOwner {
        require(_minter != address(0), "MINED: invalid minter address");
        minters[_minter] = true;
        emit MinterAdded(_minter);
    }
    
    /**
     * @dev Remove minter role
     * @param _minter Address to remove as minter
     */
    function removeMinter(address _minter) external onlyOwner {
        require(_minter != address(0), "MINED: invalid minter address");
        minters[_minter] = false;
        emit MinterRemoved(_minter);
    }
    
    /**
     * @dev Get current asymptotic statistics
     * @return currentSupply Current total supply
     * @return asymptoticTarget Asymptotic target (1.5 billion)
     * @return emitted Total tokens emitted
     * @return burned Total tokens burned
     * @return researchValue Total research value
     */
    function getAsymptoticStats() external view returns (
        uint256 currentSupply,
        uint256 asymptoticTarget,
        uint256 emitted,
        uint256 burned,
        uint256 researchValue
    ) {
        return (
            totalSupply(),
            ASYMPTOTIC_TARGET,
            totalEmitted,
            totalBurned,
            totalResearchValue
        );
    }
    
    /**
     * @dev Get user statistics
     * @param _user User address
     * @return balance User's token balance
     * @return researchContributions User's research contributions
     * @return burns User's burned tokens
     */
    function getUserStats(address _user) external view returns (
        uint256 balance,
        uint256 researchContributions,
        uint256 burns
    ) {
        return (
            balanceOf(_user),
            userResearchContributions[_user],
            userBurns[_user]
        );
    }
    
    /**
     * @dev Pause token transfers (emergency only)
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
    
    // Override required functions
    function _update(address from, address to, uint256 value) internal override(ERC20, ERC20Pausable) {
        super._update(from, to, value);
    }
}
