// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title TokenIntegrationBridge
 * @dev Bridge contract to integrate MINED token with existing ProductiveMiner contract
 * 
 * This contract acts as a bridge between the deployed ProductiveMiner contract
 * and the MINED token, enabling token-based rewards for mining activities.
 */
contract TokenIntegrationBridge is Ownable, ReentrancyGuard, Pausable {
    
    // Token contract
    IERC20 public minedToken;
    
    // ProductiveMiner contract address
    address public productiveMinerContract;
    
    // Reward pools
    address public miningRewardsPool;
    address public stakingRewardsPool;
    address public researchFund;
    address public treasury;
    
    // Reward rates (tokens per ETH reward)
    uint256 public miningRewardRate = 100; // 100 MINED per ETH
    uint256 public stakingRewardRate = 50; // 50 MINED per ETH
    uint256 public researchRewardRate = 25; // 25 MINED per ETH
    
    // Events
    event TokenRewardDistributed(address indexed miner, uint256 ethAmount, uint256 tokenAmount, string rewardType);
    event MiningRewardClaimed(address indexed miner, uint256 tokenAmount);
    event StakingRewardClaimed(address indexed staker, uint256 tokenAmount);
    event ResearchRewardClaimed(address indexed researcher, uint256 tokenAmount);
    event RewardRatesUpdated(uint256 miningRate, uint256 stakingRate, uint256 researchRate);
    
    // Mappings to track rewards
    mapping(address => uint256) public miningRewards;
    mapping(address => uint256) public stakingRewards;
    mapping(address => uint256) public researchRewards;
    mapping(address => uint256) public lastClaimTime;
    
    // Modifiers
    modifier onlyProductiveMiner() {
        require(msg.sender == productiveMinerContract, "Only ProductiveMiner can call this");
        _;
    }
    

    
    /**
     * @dev Constructor
     * @param _minedToken MINED token contract address
     * @param _productiveMiner ProductiveMiner contract address
     * @param _miningRewardsPool Mining rewards pool address
     * @param _stakingRewardsPool Staking rewards pool address
     * @param _researchFund Research fund address
     * @param _treasury Treasury address
     */
    constructor(
        address _minedToken,
        address _productiveMiner,
        address _miningRewardsPool,
        address _stakingRewardsPool,
        address _researchFund,
        address _treasury
    ) Ownable(msg.sender) {
        require(_minedToken != address(0), "Invalid token address");
        require(_productiveMiner != address(0), "Invalid ProductiveMiner address");
        require(_miningRewardsPool != address(0), "Invalid mining rewards pool");
        require(_stakingRewardsPool != address(0), "Invalid staking rewards pool");
        require(_researchFund != address(0), "Invalid research fund");
        require(_treasury != address(0), "Invalid treasury");
        
        minedToken = IERC20(_minedToken);
        productiveMinerContract = _productiveMiner;
        miningRewardsPool = _miningRewardsPool;
        stakingRewardsPool = _stakingRewardsPool;
        researchFund = _researchFund;
        treasury = _treasury;
    }
    
    /**
     * @dev Distribute mining rewards in tokens
     * @param _miner Miner address
     * @param _ethAmount ETH reward amount from ProductiveMiner
     */
    function distributeMiningReward(address _miner, uint256 _ethAmount) 
        external 
        onlyProductiveMiner 
        whenNotPaused 
        nonReentrant 
    {
        require(_miner != address(0), "Invalid miner address");
        require(_ethAmount > 0, "Invalid reward amount");
        
        uint256 tokenAmount = _ethAmount * miningRewardRate;
        
        // Check if we have enough tokens in the mining rewards pool
        uint256 poolBalance = minedToken.balanceOf(miningRewardsPool);
        require(poolBalance >= tokenAmount, "Insufficient tokens in mining rewards pool");
        
        // Transfer tokens from mining rewards pool to miner
        require(
            minedToken.transferFrom(miningRewardsPool, _miner, tokenAmount),
            "Token transfer failed"
        );
        
        // Track the reward
        miningRewards[_miner] += tokenAmount;
        lastClaimTime[_miner] = block.timestamp;
        
        emit TokenRewardDistributed(_miner, _ethAmount, tokenAmount, "mining");
    }
    
    /**
     * @dev Distribute staking rewards in tokens
     * @param _staker Staker address
     * @param _ethAmount ETH reward amount from ProductiveMiner
     */
    function distributeStakingReward(address _staker, uint256 _ethAmount) 
        external 
        onlyProductiveMiner 
        whenNotPaused 
        nonReentrant 
    {
        require(_staker != address(0), "Invalid staker address");
        require(_ethAmount > 0, "Invalid reward amount");
        
        uint256 tokenAmount = _ethAmount * stakingRewardRate;
        
        // Check if we have enough tokens in the staking rewards pool
        uint256 poolBalance = minedToken.balanceOf(stakingRewardsPool);
        require(poolBalance >= tokenAmount, "Insufficient tokens in staking rewards pool");
        
        // Transfer tokens from staking rewards pool to staker
        require(
            minedToken.transferFrom(stakingRewardsPool, _staker, tokenAmount),
            "Token transfer failed"
        );
        
        // Track the reward
        stakingRewards[_staker] += tokenAmount;
        lastClaimTime[_staker] = block.timestamp;
        
        emit TokenRewardDistributed(_staker, _ethAmount, tokenAmount, "staking");
    }
    
    /**
     * @dev Distribute research rewards in tokens
     * @param _researcher Researcher address
     * @param _ethAmount ETH reward amount from ProductiveMiner
     */
    function distributeResearchReward(address _researcher, uint256 _ethAmount) 
        external 
        onlyProductiveMiner 
        whenNotPaused 
        nonReentrant 
    {
        require(_researcher != address(0), "Invalid researcher address");
        require(_ethAmount > 0, "Invalid reward amount");
        
        uint256 tokenAmount = _ethAmount * researchRewardRate;
        
        // Check if we have enough tokens in the research fund
        uint256 fundBalance = minedToken.balanceOf(researchFund);
        require(fundBalance >= tokenAmount, "Insufficient tokens in research fund");
        
        // Transfer tokens from research fund to researcher
        require(
            minedToken.transferFrom(researchFund, _researcher, tokenAmount),
            "Token transfer failed"
        );
        
        // Track the reward
        researchRewards[_researcher] += tokenAmount;
        lastClaimTime[_researcher] = block.timestamp;
        
        emit TokenRewardDistributed(_researcher, _ethAmount, tokenAmount, "research");
    }
    
    /**
     * @dev Claim accumulated mining rewards
     */
    function claimMiningRewards() external whenNotPaused nonReentrant {
        uint256 reward = miningRewards[msg.sender];
        require(reward > 0, "No mining rewards to claim");
        
        miningRewards[msg.sender] = 0;
        
        emit MiningRewardClaimed(msg.sender, reward);
    }
    
    /**
     * @dev Claim accumulated staking rewards
     */
    function claimStakingRewards() external whenNotPaused nonReentrant {
        uint256 reward = stakingRewards[msg.sender];
        require(reward > 0, "No staking rewards to claim");
        
        stakingRewards[msg.sender] = 0;
        
        emit StakingRewardClaimed(msg.sender, reward);
    }
    
    /**
     * @dev Claim accumulated research rewards
     */
    function claimResearchRewards() external whenNotPaused nonReentrant {
        uint256 reward = researchRewards[msg.sender];
        require(reward > 0, "No research rewards to claim");
        
        researchRewards[msg.sender] = 0;
        
        emit ResearchRewardClaimed(msg.sender, reward);
    }
    
    /**
     * @dev Get user's total rewards
     * @param _user User address
     * @return mining Total mining rewards
     * @return staking Total staking rewards
     * @return research Total research rewards
     */
    function getUserRewards(address _user) external view returns (
        uint256 mining,
        uint256 staking,
        uint256 research
    ) {
        return (
            miningRewards[_user],
            stakingRewards[_user],
            researchRewards[_user]
        );
    }
    
    /**
     * @dev Update reward rates (owner only)
     * @param _miningRate New mining reward rate
     * @param _stakingRate New staking reward rate
     * @param _researchRate New research reward rate
     */
    function updateRewardRates(
        uint256 _miningRate,
        uint256 _stakingRate,
        uint256 _researchRate
    ) external onlyOwner {
        miningRewardRate = _miningRate;
        stakingRewardRate = _stakingRate;
        researchRewardRate = _researchRate;
        
        emit RewardRatesUpdated(_miningRate, _stakingRate, _researchRate);
    }
    
    /**
     * @dev Update pool addresses (owner only)
     * @param _miningRewardsPool New mining rewards pool
     * @param _stakingRewardsPool New staking rewards pool
     * @param _researchFund New research fund
     * @param _treasury New treasury
     */
    function updatePoolAddresses(
        address _miningRewardsPool,
        address _stakingRewardsPool,
        address _researchFund,
        address _treasury
    ) external onlyOwner {
        require(_miningRewardsPool != address(0), "Invalid mining rewards pool");
        require(_stakingRewardsPool != address(0), "Invalid staking rewards pool");
        require(_researchFund != address(0), "Invalid research fund");
        require(_treasury != address(0), "Invalid treasury");
        
        miningRewardsPool = _miningRewardsPool;
        stakingRewardsPool = _stakingRewardsPool;
        researchFund = _researchFund;
        treasury = _treasury;
    }
    
    /**
     * @dev Pause the contract (emergency only)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause the contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Get contract information
     */
    function getContractInfo() external view returns (
        address _minedToken,
        address _productiveMiner,
        uint256 _miningRate,
        uint256 _stakingRate,
        uint256 _researchRate,
        bool _paused
    ) {
        return (
            address(minedToken),
            productiveMinerContract,
            miningRewardRate,
            stakingRewardRate,
            researchRewardRate,
            paused()
        );
    }
}
