const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ProductiveMiner", function () {
  let ProductiveMiner;
  let productiveMiner;
  let owner;
  let miner1;
  let miner2;
  let staker1;
  let staker2;

  const ZERO_ADDRESS = ethers.ZeroAddress;

  beforeEach(async function () {
    // Get signers
    [owner, miner1, miner2, staker1, staker2] = await ethers.getSigners();

    // Deploy contract
    ProductiveMiner = await ethers.getContractFactory("ProductiveMiner");
    productiveMiner = await ProductiveMiner.deploy(ZERO_ADDRESS);
    await productiveMiner.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      expect(await productiveMiner.owner()).to.equal(owner.address);
    });

    it("Should initialize with correct default values", async function () {
      expect(await productiveMiner.maxDifficulty()).to.equal(50);
      expect(await productiveMiner.baseReward()).to.equal(100);
      expect(await productiveMiner.quantumSecurityLevel()).to.equal(256);
      expect(await productiveMiner.minStakeAmount()).to.equal(1000);
      expect(await productiveMiner.stakingAPY()).to.equal(500); // 5%
      expect(await productiveMiner.maxConcurrentSessions()).to.equal(50);
      expect(await productiveMiner.tokenIntegrationEnabled()).to.equal(false);
    });

    it("Should return correct version", async function () {
      expect(await productiveMiner.version()).to.equal("ProductiveMiner v2.0.0 - Enhanced OpenZeppelin Secured");
    });
  });

  describe("Staking", function () {
    it("Should allow staking tokens", async function () {
      const stakeAmount = 2000;
      
      // Mock token transfer (since no real token integration)
      await productiveMiner.connect(staker1).stakeTokens(stakeAmount);
      
      const stakingInfo = await productiveMiner.getStakingInfo(staker1.address);
      expect(stakingInfo.stakedAmount).to.equal(stakeAmount);
      expect(stakingInfo.isActive).to.equal(true);
      expect(stakingInfo.apy).to.equal(500);
    });

    it("Should calculate pending rewards correctly", async function () {
      const stakeAmount = 2000;
      await productiveMiner.connect(staker1).stakeTokens(stakeAmount);
      
      // Fast forward time
      await ethers.provider.send("evm_increaseTime", [365 * 24 * 60 * 60]); // 1 year
      await ethers.provider.send("evm_mine");
      
      const pendingRewards = await productiveMiner.getPendingRewards(staker1.address);
      expect(pendingRewards).to.be.gt(0);
    });

    it("Should allow unstaking tokens", async function () {
      const stakeAmount = 2000;
      const unstakeAmount = 1000;
      
      await productiveMiner.connect(staker1).stakeTokens(stakeAmount);
      await productiveMiner.connect(staker1).unstakeTokens(unstakeAmount);
      
      const stakingInfo = await productiveMiner.getStakingInfo(staker1.address);
      expect(stakingInfo.stakedAmount).to.equal(stakeAmount - unstakeAmount);
    });

    it("Should prevent staking below minimum amount", async function () {
      const stakeAmount = 500; // Below minimum of 1000
      
      await expect(
        productiveMiner.connect(staker1).stakeTokens(stakeAmount)
      ).to.be.revertedWith("Stake amount must be positive");
    });
  });

  describe("Mining Sessions", function () {
    beforeEach(async function () {
      // Setup staking for miners
      await productiveMiner.connect(miner1).stakeTokens(2000);
      await productiveMiner.connect(miner2).stakeTokens(2000);
    });

    it("Should start mining session successfully", async function () {
      const workType = 0; // PRIME_PATTERN_DISCOVERY
      const difficulty = 25;
      const quantumLevel = 256;
      const computationalPower = 1000;
      
      await productiveMiner.connect(miner1).startMiningSession(
        workType,
        difficulty,
        quantumLevel,
        computationalPower
      );
      
      expect(await productiveMiner.hasActiveMiningSession(miner1.address)).to.equal(true);
      expect(await productiveMiner.currentActiveSessions()).to.equal(1);
    });

    it("Should prevent starting session without minimum stake", async function () {
      const workType = 0;
      const difficulty = 25;
      const quantumLevel = 256;
      const computationalPower = 1000;
      
      // Try with a new address that hasn't staked
      await expect(
        productiveMiner.connect(staker2).startMiningSession(
          workType,
          difficulty,
          quantumLevel,
          computationalPower
        )
      ).to.be.revertedWith("Insufficient stake");
    });

    it("Should prevent multiple active sessions per miner", async function () {
      const workType = 0;
      const difficulty = 25;
      const quantumLevel = 256;
      const computationalPower = 1000;
      
      await productiveMiner.connect(miner1).startMiningSession(
        workType,
        difficulty,
        quantumLevel,
        computationalPower
      );
      
      await expect(
        productiveMiner.connect(miner1).startMiningSession(
          workType,
          difficulty,
          quantumLevel,
          computationalPower
        )
      ).to.be.revertedWith("Active session exists");
    });

    it("Should complete mining session successfully", async function () {
      const workType = 0;
      const difficulty = 25;
      const quantumLevel = 256;
      const computationalPower = 1000;
      
      await productiveMiner.connect(miner1).startMiningSession(
        workType,
        difficulty,
        quantumLevel,
        computationalPower
      );
      
      const proofHash = ethers.keccak256(ethers.toUtf8Bytes("test proof"));
      const metadata = "Test discovery metadata";
      const computationalComplexity = 500;
      const impactScore = 75;
      
      await productiveMiner.connect(miner1).completeMiningSession(
        proofHash,
        true, // successful
        metadata,
        computationalComplexity,
        impactScore
      );
      
      expect(await productiveMiner.hasActiveMiningSession(miner1.address)).to.equal(false);
      expect(await productiveMiner.currentActiveSessions()).to.equal(0);
      expect(await productiveMiner.totalDiscoveries()).to.equal(1);
    });

    it("Should prevent completing session without active session", async function () {
      const proofHash = ethers.keccak256(ethers.toUtf8Bytes("test proof"));
      
      await expect(
        productiveMiner.connect(miner1).completeMiningSession(
          proofHash,
          true,
          "metadata",
          500,
          75
        )
      ).to.be.revertedWith("No active mining session");
    });
  });

  describe("Reward Calculation", function () {
    it("Should calculate rewards correctly", async function () {
      const difficulty = 25;
      const quantumLevel = 256;
      const computationalComplexity = 500;
      
      const reward = await productiveMiner.calculateReward(
        difficulty,
        quantumLevel,
        computationalComplexity
      );
      
      expect(reward).to.be.gt(0);
    });

    it("Should handle edge cases in reward calculation", async function () {
      const difficulty = 1;
      const quantumLevel = 128;
      const computationalComplexity = 100;
      
      const reward = await productiveMiner.calculateReward(
        difficulty,
        quantumLevel,
        computationalComplexity
      );
      
      expect(reward).to.be.gt(0);
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to update max difficulty", async function () {
      const newDifficulty = 75;
      await productiveMiner.connect(owner).updateMaxDifficulty(newDifficulty);
      expect(await productiveMiner.maxDifficulty()).to.equal(newDifficulty);
    });

    it("Should prevent non-owner from updating max difficulty", async function () {
      const newDifficulty = 75;
      await expect(
        productiveMiner.connect(miner1).updateMaxDifficulty(newDifficulty)
      ).to.be.revertedWithCustomError(productiveMiner, "OwnableUnauthorizedAccount");
    });

    it("Should allow owner to update quantum security level", async function () {
      const newLevel = 512;
      await productiveMiner.connect(owner).updateQuantumSecurityLevel(newLevel);
      expect(await productiveMiner.quantumSecurityLevel()).to.equal(newLevel);
    });

    it("Should allow owner to update base reward", async function () {
      const newReward = 200;
      await productiveMiner.connect(owner).updateBaseReward(newReward);
      expect(await productiveMiner.baseReward()).to.equal(newReward);
    });

    it("Should allow owner to update staking APY", async function () {
      const newAPY = 1000; // 10%
      await productiveMiner.connect(owner).updateStakingAPY(newAPY);
      expect(await productiveMiner.stakingAPY()).to.equal(newAPY);
    });

    it("Should prevent APY above 20%", async function () {
      const newAPY = 2500; // 25%
      await expect(
        productiveMiner.connect(owner).updateStakingAPY(newAPY)
      ).to.be.revertedWith("APY cannot exceed 20%");
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      // Setup test data
      await productiveMiner.connect(miner1).stakeTokens(2000);
      await productiveMiner.connect(miner2).stakeTokens(2000);
    });

    it("Should return correct network stats", async function () {
      const stats = await productiveMiner.getNetworkStats();
      
      expect(stats.totalDiscoveries).to.equal(0);
      expect(stats.totalSessions).to.equal(0);
      expect(stats.currentActiveSessions).to.equal(0);
      expect(stats.maxDifficulty).to.equal(50);
      expect(stats.baseReward).to.equal(100);
      expect(stats.quantumSecurityLevel).to.equal(256);
      expect(stats.totalStaked).to.equal(4000);
      expect(stats.totalRewardsDistributed).to.equal(0);
    });

    it("Should return correct contract stats", async function () {
      const stats = await productiveMiner.getContractStats();
      
      expect(stats.totalDiscoveries).to.equal(0);
      expect(stats.totalSessions).to.equal(0);
      expect(stats.totalStaked).to.equal(4000);
      expect(stats.totalRewardsDistributed).to.equal(0);
      expect(stats.currentActiveSessions).to.equal(0);
      expect(stats.isPaused).to.equal(false);
    });

    it("Should return correct staking info", async function () {
      const stakingInfo = await productiveMiner.getStakingInfo(miner1.address);
      
      expect(stakingInfo.stakedAmount).to.equal(2000);
      expect(stakingInfo.isActive).to.equal(true);
      expect(stakingInfo.apy).to.equal(500);
    });
  });

  describe("Signature Verification", function () {
    it("Should verify proof signatures correctly", async function () {
      const proofHash = ethers.keccak256(ethers.toUtf8Bytes("test proof"));
      const messageHash = ethers.hashMessage(ethers.getBytes(proofHash));
      const signature = await miner1.signMessage(ethers.getBytes(proofHash));
      
      const isValid = await productiveMiner.verifyProofSignature(
        proofHash,
        signature,
        miner1.address
      );
      
      expect(isValid).to.equal(true);
    });

    it("Should reject invalid signatures", async function () {
      const proofHash = ethers.keccak256(ethers.toUtf8Bytes("test proof"));
      const messageHash = ethers.hashMessage(ethers.getBytes(proofHash));
      const signature = await miner1.signMessage(ethers.getBytes(proofHash));
      
      const isValid = await productiveMiner.verifyProofSignature(
        proofHash,
        signature,
        miner2.address // Wrong signer
      );
      
      expect(isValid).to.equal(false);
    });
  });

  describe("Emergency Functions", function () {
    it("Should allow owner to pause contract", async function () {
      await productiveMiner.connect(owner).pause();
      expect(await productiveMiner.paused()).to.equal(true);
    });

    it("Should prevent non-owner from pausing", async function () {
      await expect(
        productiveMiner.connect(miner1).pause()
      ).to.be.revertedWithCustomError(productiveMiner, "OwnableUnauthorizedAccount");
    });

    it("Should allow owner to unpause contract", async function () {
      await productiveMiner.connect(owner).pause();
      await productiveMiner.connect(owner).unpause();
      expect(await productiveMiner.paused()).to.equal(false);
    });

    it("Should prevent operations when paused", async function () {
      await productiveMiner.connect(owner).pause();
      
      await expect(
        productiveMiner.connect(miner1).stakeTokens(1000)
      ).to.be.revertedWith("Contract is paused");
    });
  });

  describe("Gas Optimization", function () {
    it("Should optimize gas usage for staking", async function () {
      const stakeAmount = 2000;
      
      const tx = await productiveMiner.connect(staker1).stakeTokens(stakeAmount);
      const receipt = await tx.wait();
      
      console.log("Staking gas used:", receipt.gasUsed.toString());
      expect(receipt.gasUsed).to.be.lt(200000); // Should be under 200k gas
    });

    it("Should optimize gas usage for mining session", async function () {
      await productiveMiner.connect(miner1).stakeTokens(2000);
      
      const tx = await productiveMiner.connect(miner1).startMiningSession(
        0, // workType
        25, // difficulty
        256, // quantumLevel
        1000 // computationalPower
      );
      const receipt = await tx.wait();
      
      console.log("Start mining session gas used:", receipt.gasUsed.toString());
      expect(receipt.gasUsed).to.be.lt(300000); // Should be under 300k gas
    });
  });
});
