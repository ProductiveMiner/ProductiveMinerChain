const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ProductiveMinerOptimized", function () {
    let ProductiveMinerOptimized;
    let productiveMiner;
    let owner;
    let miner1;
    let miner2;
    let staker1;
    let staker2;
    let addrs;

    const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

    beforeEach(async function () {
        [owner, miner1, miner2, staker1, staker2, ...addrs] = await ethers.getSigners();
        
        ProductiveMinerOptimized = await ethers.getContractFactory("ProductiveMinerOptimized");
        productiveMiner = await ProductiveMinerOptimized.deploy(ZERO_ADDRESS);
        await productiveMiner.deployed();
    });

    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            expect(await productiveMiner.owner()).to.equal(owner.address);
        });

        it("Should initialize with correct default values", async function () {
            expect(await productiveMiner.maxDifficulty()).to.equal(1000000);
            expect(await productiveMiner.baseReward()).to.equal(1000);
            expect(await productiveMiner.quantumSecurityLevel()).to.equal(256);
            expect(await productiveMiner.minStakeAmount()).to.equal(1000);
            expect(await productiveMiner.stakingAPY()).to.equal(12);
            expect(await productiveMiner.maxConcurrentSessions()).to.equal(10);
            expect(await productiveMiner.paused()).to.equal(false);
        });

        it("Should disable token integration when zero address is passed", async function () {
            expect(await productiveMiner.tokenIntegrationEnabled()).to.equal(false);
        });
    });

    describe("Access Control", function () {
        it("Should allow only owner to pause", async function () {
            await expect(productiveMiner.connect(miner1).pause()).to.be.revertedWithCustomError(
                productiveMiner, "Unauthorized"
            );
            
            await expect(productiveMiner.pause()).to.not.be.reverted;
            expect(await productiveMiner.paused()).to.equal(true);
        });

        it("Should allow only owner to unpause", async function () {
            await productiveMiner.pause();
            
            await expect(productiveMiner.connect(miner1).unpause()).to.be.revertedWithCustomError(
                productiveMiner, "Unauthorized"
            );
            
            await expect(productiveMiner.unpause()).to.not.be.reverted;
            expect(await productiveMiner.paused()).to.equal(false);
        });

        it("Should allow only owner to update mining parameters", async function () {
            await expect(
                productiveMiner.connect(miner1).updateMiningParameters(2000000, 2000, 512, 20)
            ).to.be.revertedWithCustomError(productiveMiner, "Unauthorized");
            
            await expect(productiveMiner.updateMiningParameters(2000000, 2000, 512, 20)).to.not.be.reverted;
        });

        it("Should allow only owner to update staking parameters", async function () {
            await expect(
                productiveMiner.connect(miner1).updateStakingParameters(2000, 15)
            ).to.be.revertedWithCustomError(productiveMiner, "Unauthorized");
            
            await expect(productiveMiner.updateStakingParameters(2000, 15)).to.not.be.reverted;
        });

        it("Should allow only owner to emergency withdraw", async function () {
            await expect(productiveMiner.connect(miner1).emergencyWithdraw()).to.be.revertedWithCustomError(
                productiveMiner, "Unauthorized"
            );
            
            await expect(productiveMiner.emergencyWithdraw()).to.not.be.reverted;
        });
    });

    describe("Mining Sessions", function () {
        it("Should start a mining session successfully", async function () {
            const workType = 0; // PRIME_PATTERN_DISCOVERY
            const difficulty = 1000;
            
            await expect(productiveMiner.connect(miner1).startMiningSession(workType, difficulty))
                .to.emit(productiveMiner, "MiningSessionStarted")
                .withArgs(1, miner1.address, workType, difficulty);
            
            const session = await productiveMiner.getSessionInfo(1);
            expect(session.miner).to.equal(miner1.address);
            expect(session.workType).to.equal(workType);
            expect(session.difficulty).to.equal(difficulty);
            expect(session.active).to.equal(true);
            expect(session.completed).to.equal(false);
        });

        it("Should reject invalid difficulty", async function () {
            const workType = 0;
            
            await expect(productiveMiner.connect(miner1).startMiningSession(workType, 0))
                .to.be.revertedWithCustomError(productiveMiner, "InvalidDifficulty");
            
            await expect(productiveMiner.connect(miner1).startMiningSession(workType, 2000000))
                .to.be.revertedWithCustomError(productiveMiner, "InvalidDifficulty");
        });

        it("Should reject invalid work type", async function () {
            const difficulty = 1000;
            
            await expect(productiveMiner.connect(miner1).startMiningSession(12, difficulty))
                .to.be.revertedWithCustomError(productiveMiner, "InvalidWorkType");
        });

        it("Should reject when contract is paused", async function () {
            await productiveMiner.pause();
            
            await expect(productiveMiner.connect(miner1).startMiningSession(0, 1000))
                .to.be.revertedWithCustomError(productiveMiner, "ContractPaused");
        });

        it("Should limit concurrent sessions per miner", async function () {
            const workType = 0;
            const difficulty = 1000;
            
            // Start max concurrent sessions
            for (let i = 0; i < 10; i++) {
                await productiveMiner.connect(miner1).startMiningSession(workType, difficulty);
            }
            
            // Try to start one more
            await expect(productiveMiner.connect(miner1).startMiningSession(workType, difficulty))
                .to.be.revertedWithCustomError(productiveMiner, "TooManyActiveSessions");
        });

        it("Should complete a mining session successfully", async function () {
            const workType = 0;
            const difficulty = 1000;
            
            await productiveMiner.connect(miner1).startMiningSession(workType, difficulty);
            
            // Fund the contract for rewards
            await owner.sendTransaction({
                to: productiveMiner.address,
                value: ethers.utils.parseEther("10")
            });
            
            const proofHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("proof"));
            const metadata = "Test discovery metadata";
            
            await expect(productiveMiner.connect(miner1).completeMiningSession(1, proofHash, metadata))
                .to.emit(productiveMiner, "MiningSessionCompleted")
                .and.to.emit(productiveMiner, "DiscoverySubmitted");
            
            const session = await productiveMiner.getSessionInfo(1);
            expect(session.active).to.equal(false);
            expect(session.completed).to.equal(true);
            
            const discovery = await productiveMiner.getDiscoveryInfo(1);
            expect(discovery.miner).to.equal(miner1.address);
            expect(discovery.workType).to.equal(workType);
            expect(discovery.difficulty).to.equal(difficulty);
        });

        it("Should reject completion by non-owner of session", async function () {
            await productiveMiner.connect(miner1).startMiningSession(0, 1000);
            
            await expect(productiveMiner.connect(miner2).completeMiningSession(1, ethers.constants.HashZero, ""))
                .to.be.revertedWithCustomError(productiveMiner, "Unauthorized");
        });

        it("Should reject completion of inactive session", async function () {
            await productiveMiner.connect(miner1).startMiningSession(0, 1000);
            await productiveMiner.connect(miner1).completeMiningSession(1, ethers.constants.HashZero, "");
            
            await expect(productiveMiner.connect(miner1).completeMiningSession(1, ethers.constants.HashZero, ""))
                .to.be.revertedWithCustomError(productiveMiner, "SessionAlreadyCompleted");
        });
    });

    describe("Staking", function () {
        it("Should stake successfully", async function () {
            const stakeAmount = ethers.utils.parseEther("1");
            
            await expect(productiveMiner.connect(staker1).stake({ value: stakeAmount }))
                .to.emit(productiveMiner, "Staked")
                .withArgs(staker1.address, stakeAmount);
            
            const stakingInfo = await productiveMiner.getStakingInfo(staker1.address);
            expect(stakingInfo.stakedAmount).to.equal(stakeAmount);
            expect(stakingInfo.isActive).to.equal(true);
            expect(stakingInfo.apy).to.equal(12);
        });

        it("Should reject insufficient stake amount", async function () {
            const stakeAmount = ethers.utils.parseEther("0.5"); // Less than minStakeAmount
            
            await expect(productiveMiner.connect(staker1).stake({ value: stakeAmount }))
                .to.be.revertedWithCustomError(productiveMiner, "InsufficientStake");
        });

        it("Should unstake successfully", async function () {
            const stakeAmount = ethers.utils.parseEther("2");
            const unstakeAmount = ethers.utils.parseEther("1");
            
            await productiveMiner.connect(staker1).stake({ value: stakeAmount });
            
            await expect(productiveMiner.connect(staker1).unstake(unstakeAmount))
                .to.emit(productiveMiner, "Unstaked")
                .withArgs(staker1.address, unstakeAmount);
            
            const stakingInfo = await productiveMiner.getStakingInfo(staker1.address);
            expect(stakingInfo.stakedAmount).to.equal(ethers.utils.parseEther("1"));
        });

        it("Should reject unstaking more than staked", async function () {
            const stakeAmount = ethers.utils.parseEther("1");
            const unstakeAmount = ethers.utils.parseEther("2");
            
            await productiveMiner.connect(staker1).stake({ value: stakeAmount });
            
            await expect(productiveMiner.connect(staker1).unstake(unstakeAmount))
                .to.be.revertedWithCustomError(productiveMiner, "InsufficientStake");
        });

        it("Should reject unstaking zero amount", async function () {
            await productiveMiner.connect(staker1).stake({ value: ethers.utils.parseEther("1") });
            
            await expect(productiveMiner.connect(staker1).unstake(0))
                .to.be.revertedWithCustomError(productiveMiner, "InvalidAmount");
        });

        it("Should claim rewards successfully", async function () {
            const stakeAmount = ethers.utils.parseEther("1");
            
            await productiveMiner.connect(staker1).stake({ value: stakeAmount });
            
            // Fast forward time to accumulate rewards
            await ethers.provider.send("evm_increaseTime", [365 * 24 * 60 * 60]); // 1 year
            await ethers.provider.send("evm_mine");
            
            await expect(productiveMiner.connect(staker1).claimRewards())
                .to.emit(productiveMiner, "RewardsClaimed");
        });

        it("Should reject claiming when not staking", async function () {
            await expect(productiveMiner.connect(staker1).claimRewards())
                .to.be.revertedWithCustomError(productiveMiner, "Unauthorized");
        });

        it("Should reject claiming when no rewards", async function () {
            await productiveMiner.connect(staker1).stake({ value: ethers.utils.parseEther("1") });
            
            await expect(productiveMiner.connect(staker1).claimRewards())
                .to.be.revertedWithCustomError(productiveMiner, "NoRewardsToClaim");
        });
    });

    describe("View Functions", function () {
        it("Should return correct network stats", async function () {
            const stats = await productiveMiner.getNetworkStats();
            
            expect(stats.totalDiscoveries).to.equal(0);
            expect(stats.totalSessions).to.equal(0);
            expect(stats.currentActiveSessions).to.equal(0);
            expect(stats.maxDifficulty).to.equal(1000000);
            expect(stats.baseReward).to.equal(1000);
            expect(stats.quantumSecurityLevel).to.equal(256);
            expect(stats.totalStaked).to.equal(0);
            expect(stats.totalRewardsDistributed).to.equal(0);
        });

        it("Should return correct miner stats", async function () {
            const stats = await productiveMiner.getMinerStats(miner1.address);
            
            expect(stats.totalSessions).to.equal(0);
            expect(stats.totalDiscoveries).to.equal(0);
            expect(stats.totalRewards).to.equal(0);
            expect(stats.stakedAmount).to.equal(0);
            expect(stats.pendingRewards).to.equal(0);
        });

        it("Should return correct session info", async function () {
            await productiveMiner.connect(miner1).startMiningSession(0, 1000);
            
            const session = await productiveMiner.getSessionInfo(1);
            expect(session.miner).to.equal(miner1.address);
            expect(session.workType).to.equal(0);
            expect(session.difficulty).to.equal(1000);
            expect(session.active).to.equal(true);
        });

        it("Should return correct discovery info", async function () {
            await productiveMiner.connect(miner1).startMiningSession(0, 1000);
            
            // Fund contract
            await owner.sendTransaction({
                to: productiveMiner.address,
                value: ethers.utils.parseEther("10")
            });
            
            await productiveMiner.connect(miner1).completeMiningSession(1, ethers.constants.HashZero, "metadata");
            
            const discovery = await productiveMiner.getDiscoveryInfo(1);
            expect(discovery.miner).to.equal(miner1.address);
            expect(discovery.workType).to.equal(0);
            expect(discovery.difficulty).to.equal(1000);
            expect(discovery.verified).to.equal(true);
        });
    });

    describe("Admin Functions", function () {
        it("Should update mining parameters correctly", async function () {
            await expect(productiveMiner.updateMiningParameters(2000000, 2000, 512, 20))
                .to.emit(productiveMiner, "ParametersUpdated")
                .withArgs(2000000, 2000, 512, 20);
            
            expect(await productiveMiner.maxDifficulty()).to.equal(2000000);
            expect(await productiveMiner.baseReward()).to.equal(2000);
            expect(await productiveMiner.quantumSecurityLevel()).to.equal(512);
            expect(await productiveMiner.maxConcurrentSessions()).to.equal(20);
        });

        it("Should reject invalid mining parameters", async function () {
            await expect(productiveMiner.updateMiningParameters(0, 2000, 512, 20))
                .to.be.revertedWithCustomError(productiveMiner, "InvalidParameters");
        });

        it("Should update staking parameters correctly", async function () {
            await productiveMiner.updateStakingParameters(2000, 15);
            
            expect(await productiveMiner.minStakeAmount()).to.equal(2000);
            expect(await productiveMiner.stakingAPY()).to.equal(15);
        });

        it("Should reject invalid staking parameters", async function () {
            await expect(productiveMiner.updateStakingParameters(0, 15))
                .to.be.revertedWithCustomError(productiveMiner, "InvalidParameters");
            
            await expect(productiveMiner.updateStakingParameters(2000, 101))
                .to.be.revertedWithCustomError(productiveMiner, "InvalidParameters");
        });

        it("Should emergency withdraw successfully", async function () {
            // Send ETH to contract
            await owner.sendTransaction({
                to: productiveMiner.address,
                value: ethers.utils.parseEther("1")
            });
            
            const initialBalance = await ethers.provider.getBalance(owner.address);
            await productiveMiner.emergencyWithdraw();
            const finalBalance = await ethers.provider.getBalance(owner.address);
            
            expect(finalBalance.gt(initialBalance)).to.be.true;
        });
    });

    describe("Gas Optimization", function () {
        it("Should use less gas for multiple operations", async function () {
            const workType = 0;
            const difficulty = 1000;
            
            // Measure gas for starting session
            const tx1 = await productiveMiner.connect(miner1).startMiningSession(workType, difficulty);
            const receipt1 = await tx1.wait();
            
            // Measure gas for staking
            const tx2 = await productiveMiner.connect(staker1).stake({ value: ethers.utils.parseEther("1") });
            const receipt2 = await tx2.wait();
            
            // Verify gas usage is reasonable
            expect(receipt1.gasUsed).to.be.lt(200000);
            expect(receipt2.gasUsed).to.be.lt(100000);
        });
    });

    describe("Error Handling", function () {
        it("Should handle custom errors correctly", async function () {
            // Test various error conditions
            await expect(productiveMiner.connect(miner1).startMiningSession(12, 1000))
                .to.be.revertedWithCustomError(productiveMiner, "InvalidWorkType");
            
            await expect(productiveMiner.connect(miner1).startMiningSession(0, 0))
                .to.be.revertedWithCustomError(productiveMiner, "InvalidDifficulty");
            
            await expect(productiveMiner.connect(staker1).stake({ value: 500 }))
                .to.be.revertedWithCustomError(productiveMiner, "InsufficientStake");
        });
    });
});
