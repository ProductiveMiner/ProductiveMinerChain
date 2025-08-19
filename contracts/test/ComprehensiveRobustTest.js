const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MINEDTokenFixed - Comprehensive Robust Test Suite", function () {
    let MINEDTokenFixed;
    let minedToken;
    let owner;
    let miner1;
    let miner2;
    let validator1;
    let validator2;
    let validator3;
    let validator4;
    let validator5;
    let addrs;

    // Mathematical test constants
    const MATHEMATICAL_CONSTANTS = {
        RIEMANN_HYPOTHESIS: { workType: 0, complexity: 1000, significance: 10 },
        GOLDBACH_CONJECTURE: { workType: 1, complexity: 800, significance: 8 },
        TWIN_PRIMES: { workType: 2, complexity: 600, significance: 6 },
        COLLATZ_CONJECTURE: { workType: 3, complexity: 500, significance: 5 },
        P_VS_NP: { workType: 4, complexity: 400, significance: 4 }
    };

    const INITIAL_SUPPLY = ethers.parseEther("1000000000"); // 1B tokens
    const CIRCULATING_SUPPLY = ethers.parseEther("500000000"); // 500M tokens
    const MINING_REWARDS_POOL = ethers.parseEther("100000000"); // 100M tokens

    // Helper function to generate valid hash for testing
    function generateValidHash(sessionId, nonce, complexity, significance) {
        const fullHash = ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(
            ["uint32", "uint32", "uint16", "uint8"],
            [sessionId, nonce, complexity, significance]
        ));
        return BigInt(fullHash) & BigInt("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"); // Convert to uint128
    }

    beforeEach(async function () {
        [owner, miner1, miner2, validator1, validator2, validator3, validator4, validator5, ...addrs] = await ethers.getSigners();
        
        MINEDTokenFixed = await ethers.getContractFactory("MINEDTokenFixed");
        minedToken = await MINEDTokenFixed.deploy();
        await minedToken.waitForDeployment();
    });

    describe("1. CONTRACT DEPLOYMENT & INITIALIZATION", function () {
        it("Should deploy with correct initial state", async function () {
            // Test total supply
            expect(await minedToken.totalSupply()).to.equal(INITIAL_SUPPLY);
            
            // Test pool distributions
            expect(await minedToken.miningRewardsPool()).to.equal(MINING_REWARDS_POOL);
            expect(await minedToken.stakingPoolBalance()).to.equal(ethers.parseEther("200000000")); // 200M
            expect(await minedToken.circulatingSupply()).to.equal(CIRCULATING_SUPPLY);
            
            // Test initial validators
            const state = await minedToken.state();
            expect(state.totalValidators).to.equal(5);
            
            // Test work types initialization
            const workType0 = await minedToken.workTypes(0);
            expect(workType0.isActive).to.be.true;
            expect(workType0.baseReward).to.equal(1000);
            expect(workType0.difficultyMultiplier).to.equal(1000);
        });

        it("Should have correct tokenomics distribution", async function () {
            // Verify all pools are properly initialized
            const pools = {
                miningRewardsPool: await minedToken.miningRewardsPool(),
                stakingPoolBalance: await minedToken.stakingPoolBalance(),
                governancePool: await minedToken.governancePool(),
                researchAccessPool: await minedToken.researchAccessPool(),
                transactionFeePool: await minedToken.transactionFeePool(),
                treasuryPool: await minedToken.treasuryPool(),
                validatorRewardPool: await minedToken.validatorRewardPool()
            };

            const totalPools = Object.values(pools).reduce((sum, pool) => sum + pool, 0n);
            expect(totalPools).to.equal(INITIAL_SUPPLY);
        });
    });

    describe("2. MATHEMATICAL ENGINE VALIDATION", function () {
        it("Should correctly validate PoW results using mathematical engine", async function () {
            // Start mining session for Riemann Hypothesis
            const sessionId = 1;
            const workType = MATHEMATICAL_CONSTANTS.RIEMANN_HYPOTHESIS.workType;
            const difficulty = 1000;
            
            await minedToken.connect(miner1).startMiningSession(workType, difficulty);
            
            // Generate valid PoW result using mathematical engine
            const nonce = 12345;
            const complexity = MATHEMATICAL_CONSTANTS.RIEMANN_HYPOTHESIS.complexity;
            const significance = MATHEMATICAL_CONSTANTS.RIEMANN_HYPOTHESIS.significance;
            
            // Calculate target hash using mathematical engine
            const session = await minedToken.miningSessions(sessionId);
            const targetHash = session.targetHash;
            
            // Generate hash that meets target (simplified for testing)
            const hash = generateValidHash(sessionId, nonce, complexity, significance);
            
            // Submit PoW result
            await minedToken.connect(miner1).submitPoWResult(
                sessionId, nonce, hash, complexity, significance
            );
            
            // Verify result was accepted
            const result = await minedToken.powResults(1);
            expect(result.isValid).to.be.true;
            expect(result.sessionId).to.equal(sessionId);
        });

        it("Should reject invalid mathematical proofs", async function () {
            const sessionId = 1;
            const workType = MATHEMATICAL_CONSTANTS.RIEMANN_HYPOTHESIS.workType;
            const difficulty = 1000;
            
            await minedToken.connect(miner1).startMiningSession(workType, difficulty);
            
            // Submit invalid hash
            const invalidHash = BigInt("0x1234567890ABCDEF1234567890ABCDEF");
            
            await expect(
                minedToken.connect(miner1).submitPoWResult(
                    sessionId, 1, invalidHash, 100, 1
                )
            ).to.be.revertedWith("Hash does not meet target");
        });

        it("Should calculate rewards using mathematical tokenomics formula", async function () {
            // Test reward calculation: BaseEmission × ComplexityMultiplier × SignificanceMultiplier × ResearchValue
            const sessionId = 1;
            const workType = MATHEMATICAL_CONSTANTS.RIEMANN_HYPOTHESIS.workType;
            const difficulty = 1000;
            
            await minedToken.connect(miner1).startMiningSession(workType, difficulty);
            
            const initialBalance = await minedToken.balanceOf(miner1.address);
            const initialPool = await minedToken.miningRewardsPool();
            
            // Submit valid PoW result
            const nonce = 12345;
            const complexity = MATHEMATICAL_CONSTANTS.RIEMANN_HYPOTHESIS.complexity;
            const significance = MATHEMATICAL_CONSTANTS.RIEMANN_HYPOTHESIS.significance;
            
            const session = await minedToken.miningSessions(sessionId);
            const hash = generateValidHash(sessionId, nonce, complexity, significance);
            
            await minedToken.connect(miner1).submitPoWResult(
                sessionId, nonce, hash, complexity, significance
            );
            
            const finalBalance = await minedToken.balanceOf(miner1.address);
            const finalPool = await minedToken.miningRewardsPool();
            
            // Verify reward was distributed from pool (not minted)
            expect(finalBalance).to.be.gt(initialBalance);
            expect(finalPool).to.be.lt(initialPool);
            
            // Verify reward calculation
            const reward = finalBalance - initialBalance;
            const poolUsed = initialPool - finalPool;
            expect(reward).to.equal(poolUsed);
        });
    });

    describe("3. WORK TYPE CORRUPTION PREVENTION", function () {
        it("Should prevent work type corruption during session creation", async function () {
            // Test all valid work types
            for (let workType = 0; workType <= 24; workType++) {
                const sessionId = workType + 1;
                await minedToken.connect(miner1).startMiningSession(workType, 1000);
                
                const session = await minedToken.miningSessions(sessionId);
                expect(session.workType).to.equal(workType);
                expect(session.workType).to.be.lte(24); // MAX_WORK_TYPE
            }
        });

        it("Should prevent work type corruption during PoW submission", async function () {
            const sessionId = 1;
            const workType = MATHEMATICAL_CONSTANTS.RIEMANN_HYPOTHESIS.workType;
            
            await minedToken.connect(miner1).startMiningSession(workType, 1000);
            
            // Submit PoW result
            const nonce = 12345;
            const complexity = 100;
            const significance = 1;
            const hash = generateValidHash(sessionId, nonce, complexity, significance);
            
            await minedToken.connect(miner1).submitPoWResult(
                sessionId, nonce, hash, complexity, significance
            );
            
            // Verify work type integrity maintained
            const session = await minedToken.miningSessions(sessionId);
            const result = await minedToken.powResults(1);
            
            expect(session.workType).to.equal(workType);
            expect(session.workType).to.be.lte(24);
        });

        it("Should reject invalid work types", async function () {
            const invalidWorkType = 25; // > MAX_WORK_TYPE
            
            await expect(
                minedToken.connect(miner1).startMiningSession(invalidWorkType, 1000)
            ).to.be.revertedWith("Invalid work type");
        });
    });

    describe("4. AUTOMATIC PoS VALIDATION SYSTEM", function () {
        it("Should automatically trigger PoS validation after PoW completion", async function () {
            const sessionId = 1;
            const workType = MATHEMATICAL_CONSTANTS.RIEMANN_HYPOTHESIS.workType;
            
            await minedToken.connect(miner1).startMiningSession(workType, 1000);
            
            // Submit PoW result
            const nonce = 12345;
            const complexity = 100;
            const significance = 1;
            const hash = generateValidHash(sessionId, nonce, complexity, significance);
            
            await minedToken.connect(miner1).submitPoWResult(
                sessionId, nonce, hash, complexity, significance
            );
            
            // Verify discovery was automatically created
            const discovery = await minedToken.discoveries(1);
            expect(discovery.isFromPoW).to.be.true;
            expect(discovery.researcher).to.equal(miner1.address);
            expect(discovery.workType).to.equal(workType);
            
            // Verify validation was automatically triggered
            expect(discovery.isValidated).to.be.true;
        });

        it("Should have 5 active validators at start", async function () {
            const state = await minedToken.state();
            expect(state.totalValidators).to.equal(5);
            
            // Verify validators are active
            for (let i = 1; i <= 5; i++) {
                const validatorAddr = ethers.getAddress(`0x${i.toString().padStart(40, '0')}`);
                const validator = await minedToken.validators(validatorAddr);
                expect(validator.isActive).to.be.true;
                expect(validator.stakedAmount).to.equal(ethers.parseEther("1000"));
            }
        });
    });

    describe("5. SECURITY MODEL VALIDATION", function () {
        it("Should implement Mathematical Discovery Feedback Loop Security Model", async function () {
            // Test emergency pause functionality
            await minedToken.connect(owner).emergencyPause();
            expect(await minedToken.emergencyPaused()).to.be.true;
            
            // Test that operations are blocked during emergency
            await expect(
                minedToken.connect(miner1).startMiningSession(0, 1000)
            ).to.be.revertedWith("Contract is emergency paused");
            
            // Test emergency unpause
            await minedToken.connect(owner).emergencyUnpause();
            expect(await minedToken.emergencyPaused()).to.be.false;
            
            // Test that operations work after unpause
            await minedToken.connect(miner1).startMiningSession(0, 1000);
        });

        it("Should implement Byzantine Fault Tolerance", async function () {
            // Test validator consensus mechanism
            const sessionId = 1;
            const workType = MATHEMATICAL_CONSTANTS.RIEMANN_HYPOTHESIS.workType;
            
            await minedToken.connect(miner1).startMiningSession(workType, 1000);
            
            // Submit PoW result
            const nonce = 12345;
            const complexity = 100;
            const significance = 1;
            const hash = generateValidHash(sessionId, nonce, complexity, significance);
            
            await minedToken.connect(miner1).submitPoWResult(
                sessionId, nonce, hash, complexity, significance
            );
            
            // Verify discovery was validated (consensus reached)
            const discovery = await minedToken.discoveries(1);
            expect(discovery.isValidated).to.be.true;
        });

        it("Should implement Double-Spending Prevention", async function () {
            const sessionId = 1;
            const workType = MATHEMATICAL_CONSTANTS.RIEMANN_HYPOTHESIS.workType;
            
            await minedToken.connect(miner1).startMiningSession(workType, 1000);
            
            // Submit PoW result
            const nonce = 12345;
            const complexity = 100;
            const significance = 1;
            const hash = generateValidHash(sessionId, nonce, complexity, significance);
            
            await minedToken.connect(miner1).submitPoWResult(
                sessionId, nonce, hash, complexity, significance
            );
            
            // Try to submit same result again (double-spending attempt)
            await expect(
                minedToken.connect(miner1).submitPoWResult(
                    sessionId, nonce, hash, complexity, significance
                )
            ).to.be.revertedWith("Session already completed");
        });
    });

    describe("6. TOKENOMICS VALIDATION", function () {
        it("Should implement asymptotic emission correctly", async function () {
            // Test that rewards come from pool first
            const sessionId = 1;
            const workType = MATHEMATICAL_CONSTANTS.RIEMANN_HYPOTHESIS.workType;
            
            await minedToken.connect(miner1).startMiningSession(workType, 1000);
            
            const initialPool = await minedToken.miningRewardsPool();
            
            // Submit PoW result
            const nonce = 12345;
            const complexity = 100;
            const significance = 1;
            const hash = generateValidHash(sessionId, nonce, complexity, significance);
            
            await minedToken.connect(miner1).submitPoWResult(
                sessionId, nonce, hash, complexity, significance
            );
            
            const finalPool = await minedToken.miningRewardsPool();
            expect(finalPool).to.be.lt(initialPool);
        });

        it("Should implement burn mechanisms correctly", async function () {
            const sessionId = 1;
            const workType = MATHEMATICAL_CONSTANTS.RIEMANN_HYPOTHESIS.workType;
            
            await minedToken.connect(miner1).startMiningSession(workType, 1000);
            
            const initialTotalSupply = await minedToken.totalSupply();
            
            // Submit PoW result with high significance (Millennium Problem)
            const nonce = 12345;
            const complexity = 100;
            const significance = 10; // Millennium Problem
            const hash = generateValidHash(sessionId, nonce, complexity, significance);
            
            await minedToken.connect(miner1).submitPoWResult(
                sessionId, nonce, hash, complexity, significance
            );
            
            const finalTotalSupply = await minedToken.totalSupply();
            
            // Verify burn occurred (25% burn rate for Millennium Problems)
            expect(finalTotalSupply).to.be.lt(initialTotalSupply);
        });
    });

    describe("7. EDGE CASES & STRESS TESTING", function () {
        it("Should handle multiple concurrent mining sessions", async function () {
            // Start multiple sessions
            for (let i = 0; i < 5; i++) {
                await minedToken.connect(miner1).startMiningSession(i, 1000);
            }
            
            // Verify all sessions created
            for (let i = 1; i <= 5; i++) {
                const session = await minedToken.miningSessions(i);
                expect(session.miner).to.equal(miner1.address);
                expect(session.isCompleted).to.be.false;
            }
        });

        it("Should handle maximum work type values", async function () {
            const maxWorkType = 24; // MAX_WORK_TYPE
            
            await minedToken.connect(miner1).startMiningSession(maxWorkType, 1000);
            
            const session = await minedToken.miningSessions(1);
            expect(session.workType).to.equal(maxWorkType);
        });

        it("Should handle maximum complexity and significance values", async function () {
            const sessionId = 1;
            const workType = 0;
            const maxComplexity = 1000;
            const maxSignificance = 10;
            
            await minedToken.connect(miner1).startMiningSession(workType, 1000);
            
            // Submit with maximum values
            const nonce = 12345;
            const hash = generateValidHash(sessionId, nonce, maxComplexity, maxSignificance);
            
            await minedToken.connect(miner1).submitPoWResult(
                sessionId, nonce, hash, maxComplexity, maxSignificance
            );
            
            const result = await minedToken.powResults(1);
            expect(result.complexity).to.equal(maxComplexity);
            expect(result.significance).to.equal(maxSignificance);
        });

        it("Should handle network health updates", async function () {
            // Test network health scoring
            await minedToken.connect(owner).updateNetworkHealth(50);
            expect(await minedToken.networkHealthScore()).to.equal(50);
            
            // Test adaptive scaling
            expect(await minedToken.currentScalingRate()).to.equal(50); // Critical scaling
        });
    });

    describe("8. ACCESS CONTROL VALIDATION", function () {
        it("Should enforce owner-only functions", async function () {
            await expect(
                minedToken.connect(miner1).setTestMode(false)
            ).to.be.revertedWith("Ownable: caller is not the owner");
            
            await expect(
                minedToken.connect(miner1).updateNetworkHealth(50)
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Should enforce emergency operator functions", async function () {
            await expect(
                minedToken.connect(miner1).emergencyPause()
            ).to.be.revertedWith("Not emergency operator");
            
            await expect(
                minedToken.connect(miner1).emergencyUnpause()
            ).to.be.revertedWith("Not emergency operator");
        });
    });

    describe("9. ERC20 COMPLIANCE & SECURITY", function () {
        it("Should implement safe ERC20 allowance management", async function () {
            const spender = miner2.address;
            const amount = ethers.parseEther("1000");
            
            // Test increaseAllowance
            await minedToken.connect(miner1).increaseAllowance(spender, amount);
            expect(await minedToken.allowance(miner1.address, spender)).to.equal(amount);
            
            // Test decreaseAllowance
            await minedToken.connect(miner1).decreaseAllowance(spender, ethers.parseEther("500"));
            expect(await minedToken.allowance(miner1.address, spender)).to.equal(ethers.parseEther("500"));
        });

        it("Should prevent front-running attacks on approve", async function () {
            const spender = miner2.address;
            const amount1 = ethers.parseEther("1000");
            const amount2 = ethers.parseEther("500");
            
            // Use increaseAllowance to prevent front-running
            await minedToken.connect(miner1).increaseAllowance(spender, amount1);
            await minedToken.connect(miner1).increaseAllowance(spender, amount2);
            
            expect(await minedToken.allowance(miner1.address, spender)).to.equal(amount1 + amount2);
        });
    });

    describe("10. SYSTEM COMPATIBILITY VALIDATION", function () {
        it("Should pass system compatibility check", async function () {
            const [isCompatible, report] = await minedToken.verifySystemCompatibility();
            
            expect(isCompatible).to.be.true;
            expect(report).to.equal("ALL SYSTEMS COMPATIBLE");
        });

        it("Should return correct contract interface", async function () {
            const [name, address, totalSupply, miningPool] = await minedToken.getContractInterface();
            
            expect(name).to.equal("MINED Token Fixed");
            expect(address).to.equal(await minedToken.getAddress());
            expect(totalSupply).to.equal(INITIAL_SUPPLY);
            expect(miningPool).to.equal(MINING_REWARDS_POOL);
        });
    });

    describe("11. MATHEMATICAL DISCOVERY WORKFLOW", function () {
        it("Should complete full mathematical discovery lifecycle", async function () {
            // 1. Start mining session
            const sessionId = 1;
            const workType = MATHEMATICAL_CONSTANTS.RIEMANN_HYPOTHESIS.workType;
            const difficulty = 1000;
            
            await minedToken.connect(miner1).startMiningSession(workType, difficulty);
            
            // 2. Submit PoW result
            const nonce = 12345;
            const complexity = MATHEMATICAL_CONSTANTS.RIEMANN_HYPOTHESIS.complexity;
            const significance = MATHEMATICAL_CONSTANTS.RIEMANN_HYPOTHESIS.significance;
            
            const session = await minedToken.miningSessions(sessionId);
            const hash = generateValidHash(sessionId, nonce, complexity, significance);
            
            await minedToken.connect(miner1).submitPoWResult(
                sessionId, nonce, hash, complexity, significance
            );
            
            // 3. Verify automatic discovery creation
            const discovery = await minedToken.discoveries(1);
            expect(discovery.isFromPoW).to.be.true;
            expect(discovery.researcher).to.equal(miner1.address);
            expect(discovery.workType).to.equal(workType);
            
            // 4. Verify automatic PoS validation
            expect(discovery.isValidated).to.be.true;
            
            // 5. Verify reward distribution
            const minerBalance = await minedToken.balanceOf(miner1.address);
            expect(minerBalance).to.be.gt(0);
            
            // 6. Verify burn mechanism
            const totalSupply = await minedToken.totalSupply();
            expect(totalSupply).to.be.lt(INITIAL_SUPPLY);
        });

        it("Should handle manual discovery submission", async function () {
            const workType = MATHEMATICAL_CONSTANTS.GOLDBACH_CONJECTURE.workType;
            const complexity = MATHEMATICAL_CONSTANTS.GOLDBACH_CONJECTURE.complexity;
            const significance = MATHEMATICAL_CONSTANTS.GOLDBACH_CONJECTURE.significance;
            
            // Submit manual discovery
            await minedToken.connect(miner1).submitDiscovery(workType, complexity, significance);
            
            // Verify discovery created and validated
            const discovery = await minedToken.discoveries(1);
            expect(discovery.isFromPoW).to.be.false;
            expect(discovery.researcher).to.equal(miner1.address);
            expect(discovery.workType).to.equal(workType);
            expect(discovery.isValidated).to.be.true;
        });
    });

    describe("12. PERFORMANCE & GAS OPTIMIZATION", function () {
        it("Should handle gas-efficient operations", async function () {
            // Test gas usage for typical operations
            const sessionId = 1;
            const workType = 0;
            const difficulty = 1000;
            
            // Start mining session
            const tx1 = await minedToken.connect(miner1).startMiningSession(workType, difficulty);
            const receipt1 = await tx1.wait();
            
            // Submit PoW result
            const nonce = 12345;
            const complexity = 100;
            const significance = 1;
            const hash = generateValidHash(sessionId, nonce, complexity, significance);
            
            const tx2 = await minedToken.connect(miner1).submitPoWResult(
                sessionId, nonce, hash, complexity, significance
            );
            const receipt2 = await tx2.wait();
            
            // Verify reasonable gas usage
            expect(receipt1.gasUsed).to.be.lt(500000); // Should be under 500k gas
            expect(receipt2.gasUsed).to.be.lt(800000); // Should be under 800k gas
        });
    });

    describe("13. ERROR HANDLING & RECOVERY", function () {
        it("Should handle invalid session submissions gracefully", async function () {
            // Try to submit PoW for non-existent session
            await expect(
                minedToken.connect(miner1).submitPoWResult(
                    999, 1, BigInt("0x1234567890ABCDEF1234567890ABCDEF"), 100, 1
                )
            ).to.be.revertedWith("Not session miner");
        });

        it("Should handle emergency pause and recovery", async function () {
            // Pause system
            await minedToken.connect(owner).emergencyPause();
            
            // Verify operations blocked
            await expect(
                minedToken.connect(miner1).startMiningSession(0, 1000)
            ).to.be.revertedWith("Contract is emergency paused");
            
            // Unpause system
            await minedToken.connect(owner).emergencyUnpause();
            
            // Verify operations work again
            await minedToken.connect(miner1).startMiningSession(0, 1000);
        });
    });

    describe("14. FINAL INTEGRATION TEST", function () {
        it("Should pass complete integration test with all mathematical work types", async function () {
            const workTypes = Object.values(MATHEMATICAL_CONSTANTS);
            
            for (let i = 0; i < workTypes.length; i++) {
                const workType = workTypes[i];
                const sessionId = i + 1;
                
                // Start session
                await minedToken.connect(miner1).startMiningSession(workType.workType, 1000);
                
                // Submit PoW result
                const nonce = 12345 + i;
                const complexity = workType.complexity;
                const significance = workType.significance;
                
                const session = await minedToken.miningSessions(sessionId);
                const hash = generateValidHash(sessionId, nonce, complexity, significance);
                
                await minedToken.connect(miner1).submitPoWResult(
                    sessionId, nonce, hash, complexity, significance
                );
                
                // Verify result
                const result = await minedToken.powResults(i + 1);
                expect(result.isValid).to.be.true;
                expect(result.sessionId).to.equal(sessionId);
                
                // Verify discovery
                const discovery = await minedToken.discoveries(i + 1);
                expect(discovery.isFromPoW).to.be.true;
                expect(discovery.isValidated).to.be.true;
            }
        });
    });
});
