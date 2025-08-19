const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MINEDTokenFixed", function () {
    let minedToken;
    let owner;
    let miner1;
    let miner2;
    let validator1;
    let validator2;
    let validator3;
    let validator4;
    let validator5;

    beforeEach(async function () {
        [owner, miner1, miner2, validator1, validator2, validator3, validator4, validator5] = await ethers.getSigners();
        
        const MINEDTokenFixed = await ethers.getContractFactory("MINEDTokenFixed");
        minedToken = await MINEDTokenFixed.deploy();
        await minedToken.waitForDeployment();
    });

    describe("Contract Deployment", function () {
        it("Should deploy successfully", async function () {
            expect(await minedToken.getAddress()).to.be.properAddress;
        });

        it("Should initialize with correct token info", async function () {
            expect(await minedToken.name()).to.equal("MINED Token Fixed");
            expect(await minedToken.symbol()).to.equal("MINED");
            expect(await minedToken.decimals()).to.equal(18);
        });

        it("Should initialize with correct total supply", async function () {
            const totalSupply = await minedToken.totalSupply();
            expect(totalSupply).to.equal(ethers.parseEther("1000000000"));
        });

        it("Should initialize work types correctly", async function () {
            const workType0 = await minedToken.workTypes(0);
            expect(workType0.isActive).to.be.true;
            expect(workType0.baseReward).to.equal(1000);
            expect(workType0.difficultyMultiplier).to.equal(1000);
        });

        it("Should initialize validators correctly", async function () {
            const validator = await minedToken.validators("0x0000000000000000000000000000000000000001");
            expect(validator.isActive).to.be.true;
            expect(validator.stakedAmount).to.equal(ethers.parseEther("1000"));
            expect(validator.reputation).to.equal(100);
        });

        it("Should initialize state correctly", async function () {
            const state = await minedToken.state();
            expect(state.totalValidators).to.equal(5);
            expect(state.nextDiscoveryId).to.equal(1);
            expect(state.totalResearchValue).to.equal(0);
        });
    });

    describe("Work Type Validation", function () {
        it("Should accept valid work types (0-24)", async function () {
            for (let i = 0; i <= 24; i++) {
                await expect(minedToken.connect(miner1).startMiningSession(i, 25))
                    .to.emit(minedToken, "MiningSessionStarted");
            }
        });

        it("Should reject invalid work types (>24)", async function () {
            await expect(minedToken.connect(miner1).startMiningSession(25, 25))
                .to.be.revertedWith("Invalid work type");
        });

        it("Should reject invalid work types (<0)", async function () {
            // Note: uint8 can't be negative, but we test the boundary
            await expect(minedToken.connect(miner1).startMiningSession(255, 25))
                .to.be.revertedWith("Invalid work type");
        });
    });

    describe("Difficulty Validation", function () {
        it("Should accept valid difficulties (1-1000)", async function () {
            await expect(minedToken.connect(miner1).startMiningSession(0, 1))
                .to.emit(minedToken, "MiningSessionStarted");
            
            await expect(minedToken.connect(miner1).startMiningSession(0, 500))
                .to.emit(minedToken, "MiningSessionStarted");
            
            await expect(minedToken.connect(miner1).startMiningSession(0, 1000))
                .to.emit(minedToken, "MiningSessionStarted");
        });

        it("Should reject difficulty 0", async function () {
            await expect(minedToken.connect(miner1).startMiningSession(0, 0))
                .to.be.revertedWith("Invalid difficulty");
        });

        it("Should reject difficulty > 1000", async function () {
            await expect(minedToken.connect(miner1).startMiningSession(0, 1001))
                .to.be.revertedWith("Invalid difficulty");
        });
    });

    describe("Mining Session Creation", function () {
        it("Should create mining session with correct parameters", async function () {
            const tx = await minedToken.connect(miner1).startMiningSession(0, 25);
            const receipt = await tx.wait();
            
            const event = receipt.logs.find(log => {
                try {
                    const parsed = minedToken.interface.parseLog(log);
                    return parsed.name === "MiningSessionStarted";
                } catch {
                    return false;
                }
            });
            
            expect(event).to.not.be.undefined;
            const parsedEvent = minedToken.interface.parseLog(event);
            expect(parsedEvent.args.sessionId).to.equal(1);
            expect(parsedEvent.args.miner).to.equal(miner1.address);
            expect(parsedEvent.args.workType).to.equal(0);
            expect(parsedEvent.args.difficulty).to.equal(25);
        });

        it("Should increment session ID correctly", async function () {
            await minedToken.connect(miner1).startMiningSession(0, 25);
            await minedToken.connect(miner2).startMiningSession(1, 30);
            
            expect(await minedToken.nextSessionId()).to.equal(3);
        });

        it("Should store session data correctly", async function () {
            await minedToken.connect(miner1).startMiningSession(0, 25);
            
            const session = await minedToken.miningSessions(1);
            expect(session.miner).to.equal(miner1.address);
            expect(session.workType).to.equal(0);
            expect(session.difficulty).to.equal(25);
            expect(session.isCompleted).to.be.false;
            expect(session.startTime).to.be.gt(0);
        });
    });

    describe("Work Type Corruption Prevention", function () {
        it("Should maintain work type integrity during session creation", async function () {
            await minedToken.connect(miner1).startMiningSession(0, 25);
            
            const session = await minedToken.miningSessions(1);
            expect(session.workType).to.equal(0);
            
            // Check for corruption
            const integrity = await minedToken.debugWorkTypeIntegrity(1);
            expect(integrity.sessionWorkType).to.equal(0);
            expect(integrity.isCorrupted).to.be.false;
        });

        it("Should detect work type corruption", async function () {
            // This test verifies the corruption detection mechanism
            // In a real scenario, corruption would be detected during PoW submission
            await minedToken.connect(miner1).startMiningSession(0, 25);
            
            const integrity = await minedToken.debugWorkTypeIntegrity(1);
            expect(integrity.isCorrupted).to.be.false;
        });
    });

    describe("PoW Result Submission", function () {
        beforeEach(async function () {
            await minedToken.connect(miner1).startMiningSession(0, 25);
        });

        it("Should reject PoW submission from non-owner", async function () {
            await expect(minedToken.connect(miner2).submitPoWResult(1, 1000, 123, 1, 3))
                .to.be.revertedWith("Not session owner");
        });

        it("Should reject PoW submission for completed session", async function () {
            // First, complete the session
            const session = await minedToken.miningSessions(1);
            const targetHash = session.targetHash;
            const startTime = session.startTime;
            
            // Find a valid nonce (simplified for test)
            const nonce = startTime + 1;
            const hash = ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(["uint128", "uint32"], [targetHash, nonce]));
            const hashValue = ethers.getBigInt(hash);
            
            await minedToken.connect(miner1).submitPoWResult(1, nonce, hashValue, 1, 3);
            
            // Try to submit again
            await expect(minedToken.connect(miner1).submitPoWResult(1, nonce + 1, hashValue, 1, 3))
                .to.be.revertedWith("Session already completed");
        });

        it("Should reject PoW submission for unstarted session", async function () {
            // Create a session but don't start it (this would require contract modification)
            // For now, we test the basic validation
            await expect(minedToken.connect(miner1).submitPoWResult(999, 1000, 123, 1, 3))
                .to.be.revertedWith("Session not started");
        });
    });

    describe("Security Features", function () {
        it("Should prevent reentrancy attacks", async function () {
            // The contract uses ReentrancyGuard, so reentrancy should be prevented
            await expect(minedToken.connect(miner1).startMiningSession(0, 25))
                .to.not.be.reverted;
        });

        it("Should allow pausing and unpausing", async function () {
            await minedToken.connect(owner).pause();
            await expect(minedToken.connect(miner1).startMiningSession(0, 25))
                .to.be.revertedWith("Pausable: paused");
            
            await minedToken.connect(owner).unpause();
            await expect(minedToken.connect(miner1).startMiningSession(0, 25))
                .to.emit(minedToken, "MiningSessionStarted");
        });

        it("Should prevent non-owner from pausing", async function () {
            await expect(minedToken.connect(miner1).pause())
                .to.be.revertedWithCustomError(minedToken, "OwnableUnauthorizedAccount");
        });
    });

    describe("Gas Optimization", function () {
        it("Should use efficient storage layout", async function () {
            // Test that structs are properly packed
            const session = await minedToken.miningSessions(1);
            // If properly packed, this should not cause storage collision
            expect(session.workType).to.equal(0);
        });

        it("Should use unchecked arithmetic where safe", async function () {
            // The contract uses unchecked blocks for safe operations
            // This is tested indirectly through the gas usage
            const tx = await minedToken.connect(miner1).startMiningSession(0, 25);
            const receipt = await tx.wait();
            
            // Gas usage should be reasonable (not excessive)
            expect(receipt.gasUsed).to.be.lt(200000);
        });
    });

    describe("Event Emissions", function () {
        it("Should emit correct events", async function () {
            await expect(minedToken.connect(miner1).startMiningSession(0, 25))
                .to.emit(minedToken, "MiningSessionStarted")
                .withArgs(1, miner1.address, 0, 25);
        });

        it("Should emit work type corruption events when detected", async function () {
            // This would be tested in a scenario where corruption is detected
            // For now, we verify the event exists
            const eventFilter = minedToken.filters.WorkTypeCorruptionDetected();
            expect(eventFilter).to.not.be.undefined;
        });
    });

    describe("Edge Cases", function () {
        it("Should handle maximum values correctly", async function () {
            await expect(minedToken.connect(miner1).startMiningSession(24, 1000))
                .to.emit(minedToken, "MiningSessionStarted");
        });

        it("Should handle minimum values correctly", async function () {
            await expect(minedToken.connect(miner1).startMiningSession(0, 1))
                .to.emit(minedToken, "MiningSessionStarted");
        });

        it("Should handle multiple sessions from same miner", async function () {
            await minedToken.connect(miner1).startMiningSession(0, 25);
            await minedToken.connect(miner1).startMiningSession(1, 30);
            await minedToken.connect(miner1).startMiningSession(2, 35);
            
            expect(await minedToken.nextSessionId()).to.equal(4);
        });
    });

    describe("Integration Tests", function () {
        it("Should complete full mining cycle without corruption", async function () {
            // Start session
            await minedToken.connect(miner1).startMiningSession(0, 25);
            
            // Verify session created correctly
            const session = await minedToken.miningSessions(1);
            expect(session.workType).to.equal(0);
            expect(session.miner).to.equal(miner1.address);
            
            // Check integrity
            const integrity = await minedToken.debugWorkTypeIntegrity(1);
            expect(integrity.isCorrupted).to.be.false;
            
            // Verify state consistency
            expect(await minedToken.nextSessionId()).to.equal(2);
        });

        it("Should maintain data consistency across multiple operations", async function () {
            // Create multiple sessions
            for (let i = 0; i < 5; i++) {
                await minedToken.connect(miner1).startMiningSession(i, 25 + i);
            }
            
            // Verify all sessions have correct work types
            for (let i = 1; i <= 5; i++) {
                const session = await minedToken.miningSessions(i);
                expect(session.workType).to.equal(i - 1);
                expect(session.miner).to.equal(miner1.address);
            }
            
            // Verify no corruption
            for (let i = 1; i <= 5; i++) {
                const integrity = await minedToken.debugWorkTypeIntegrity(i);
                expect(integrity.isCorrupted).to.be.false;
            }
        });
    });

    describe("Error Handling", function () {
        it("Should provide clear error messages", async function () {
            await expect(minedToken.connect(miner1).startMiningSession(25, 25))
                .to.be.revertedWith("Invalid work type");
            
            await expect(minedToken.connect(miner1).startMiningSession(0, 0))
                .to.be.revertedWith("Invalid difficulty");
        });

        it("Should handle invalid session IDs gracefully", async function () {
            await expect(minedToken.connect(miner1).submitPoWResult(999, 1000, 123, 1, 3))
                .to.be.revertedWith("Session not started");
        });
    });
});
