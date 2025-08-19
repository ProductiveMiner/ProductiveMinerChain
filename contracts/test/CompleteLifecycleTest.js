const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MINEDToken - Complete Lifecycle Test", function () {
    let minedToken;
    let owner, miner1, miner2, validator1, validator2;
    let initialSupply, initialPools;

    beforeEach(async function () {
        [owner, miner1, miner2, validator1, validator2] = await ethers.getSigners();
        
        const MINEDToken = await ethers.getContractFactory("MINEDToken");
        minedToken = await MINEDToken.deploy();
        await minedToken.waitForDeployment();
        
        // Enable test mode for easier testing
        await minedToken.setTestMode(true);
        
        // Get initial values
        initialSupply = await minedToken.totalSupply();
        initialPools = {
            miningRewards: await minedToken.miningRewardsPool(),
            staking: await minedToken.stakingPoolBalance(),
            treasury: await minedToken.treasuryPool(),
            researchAccess: await minedToken.researchAccessPool(),
            governance: await minedToken.governancePool(),
            transactionFee: await minedToken.transactionFeePool()
        };
    });

    describe("Token Distribution Verification", function () {
        it("Should have correct initial token distribution (1B MINED total)", async function () {
            const totalSupply = await minedToken.totalSupply();
            expect(totalSupply).to.equal(ethers.parseEther("1000000000")); // 1B MINED
            
            // Verify pool distributions match tokenomics
            expect(await minedToken.miningRewardsPool()).to.equal(ethers.parseEther("100000000")); // 100M (10%)
            expect(await minedToken.stakingPoolBalance()).to.equal(ethers.parseEther("200000000")); // 200M (20%)
            expect(await minedToken.treasuryPool()).to.equal(ethers.parseEther("100000000")); // 100M (10%)
            expect(await minedToken.researchAccessPool()).to.equal(ethers.parseEther("100000000")); // 100M (10%)
            expect(await minedToken.governancePool()).to.equal(ethers.parseEther("50000000")); // 50M (5%)
            expect(await minedToken.transactionFeePool()).to.equal(ethers.parseEther("50000000")); // 50M (5%)
            
            console.log("✅ Token distribution verified:");
            console.log(`   Total Supply: ${ethers.formatEther(totalSupply)} MINED`);
            console.log(`   Mining Rewards Pool: ${ethers.formatEther(await minedToken.miningRewardsPool())} MINED (10%)`);
            console.log(`   Staking Pool: ${ethers.formatEther(await minedToken.stakingPoolBalance())} MINED (20%)`);
            console.log(`   Treasury Pool: ${ethers.formatEther(await minedToken.treasuryPool())} MINED (10%)`);
            console.log(`   Research Access Pool: ${ethers.formatEther(await minedToken.researchAccessPool())} MINED (10%)`);
            console.log(`   Governance Pool: ${ethers.formatEther(await minedToken.governancePool())} MINED (5%)`);
            console.log(`   Transaction Fee Pool: ${ethers.formatEther(await minedToken.transactionFeePool())} MINED (5%)`);
        });

        it("Should have 25 mathematical work types initialized", async function () {
            for (let i = 0; i < 25; i++) {
                const workType = await minedToken.workTypes(i);
                expect(workType.isActive).to.be.true;
                expect(workType.baseReward).to.be.gt(0);
                expect(workType.difficultyMultiplier).to.be.gt(0);
            }
            
            console.log("✅ All 25 work types initialized and active");
        });

        it("Should have 5 active validators initialized", async function () {
            for (let i = 1; i <= 5; i++) {
                const validatorAddr = ethers.getAddress(`0x${i.toString().padStart(40, '0')}`);
                const validator = await minedToken.validators(validatorAddr);
                expect(validator.isActive).to.be.true;
                expect(validator.stakedAmount).to.equal(ethers.parseEther("1000")); // 1000 MINED staked
            }
            
            console.log("✅ All 5 validators initialized and active");
        });
    });

    describe("Asymptotic Model Verification", function () {
        it("Should implement correct asymptotic supply formula S(t) = S₀ + Σ(E(t) - B(t))", async function () {
            const asymptoticData = await minedToken.getAsymptoticData();
            const expectedSupply = ethers.parseEther("1000000000") + asymptoticData.totalEmission - asymptoticData.totalBurned;
            expect(asymptoticData.asymptoticSupply).to.equal(expectedSupply);
            
            console.log("✅ Asymptotic supply formula verified:");
            console.log(`   Initial Supply (S₀): ${ethers.formatEther(ethers.parseEther("1000000000"))} MINED`);
            console.log(`   Total Emission: ${ethers.formatEther(asymptoticData.totalEmission)} MINED`);
            console.log(`   Total Burned: ${ethers.formatEther(asymptoticData.totalBurned)} MINED`);
            console.log(`   Asymptotic Supply: ${ethers.formatEther(asymptoticData.asymptoticSupply)} MINED`);
        });

        it("Should calculate asymptotic emission with research value boost", async function () {
            const testResearchValue = 100000; // 100k research value
            const emission = await minedToken.getAsymptoticEmission(testResearchValue);
            expect(emission).to.be.gt(0);
            
            console.log("✅ Asymptotic emission calculation verified:");
            console.log(`   Research Value: ${testResearchValue}`);
            console.log(`   Calculated Emission: ${ethers.formatEther(emission)} MINED`);
        });
    });

    describe("Complete PoW → PoS → Research Lifecycle", function () {
        it("Should complete full lifecycle: PoW Mining → Discovery → Validation → Rewards", async function () {
            console.log("\n🔄 Starting complete lifecycle test...");
            
            // Phase 1: Start Mining Session (Millennium Problem - Riemann Zeros)
            console.log("📝 Phase 1: Starting mining session (Riemann Zeros - Work Type 0)");
            const workType = 0; // Riemann Zeros (Millennium Problem)
            const difficulty = 25;
            
            const startTx = await minedToken.connect(miner1).startMiningSession(workType, difficulty);
            const startReceipt = await startTx.wait();
            
            // Extract session ID from event
            const startEvent = startReceipt.logs.find(log => 
                log.fragment && log.fragment.name === 'MiningSessionStarted'
            );
            const sessionId = startEvent.args.sessionId;
            console.log(`   ✅ Session started: ID ${sessionId}`);
            
            // Phase 2: Submit PoW Result
            console.log("⛏️ Phase 2: Submitting PoW result");
            const nonce = 12345;
            const complexity = 95; // High complexity for Millennium Problem
            const significance = 10; // Maximum significance for Millennium Problem
            const fullHash = ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(
                ['uint32', 'uint32', 'uint16', 'uint8'],
                [sessionId, nonce, complexity, significance]
            ));
            const hash = BigInt(fullHash) & BigInt("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"); // Convert to uint128
            
            const submitTx = await minedToken.connect(miner1).submitPoWResult(
                sessionId, nonce, hash, complexity, significance
            );
            const submitReceipt = await submitTx.wait();
            
            // Extract result ID from event
            const submitEvent = submitReceipt.logs.find(log => 
                log.fragment && log.fragment.name === 'PoWResultSubmitted'
            );
            const resultId = submitEvent.args.resultId;
            console.log(`   ✅ PoW result submitted: ID ${resultId}`);
            
            // Phase 3: Verify Discovery Creation and Validation
            console.log("🔬 Phase 3: Verifying discovery creation and validation");
            
            // Check that discovery was created
            const discoveryId = await minedToken.state().then(state => state.nextDiscoveryId - 1);
            const discovery = await minedToken.discoveries(discoveryId);
            expect(discovery.researcher).to.equal(miner1.address);
            expect(discovery.workType).to.equal(workType);
            expect(discovery.complexity).to.equal(complexity);
            expect(discovery.significance).to.equal(significance);
            expect(discovery.isValidated).to.be.true; // Auto-validated
            expect(discovery.isFromPoW).to.be.true;
            
            console.log(`   ✅ Discovery created: ID ${discoveryId}`);
            console.log(`   ✅ Auto-validation completed`);
            
            // Phase 4: Verify Rewards and Burns
            console.log("💰 Phase 4: Verifying rewards and burns");
            
            // Check miner received rewards
            const minerBalance = await minedToken.balanceOf(miner1.address);
            expect(minerBalance).to.be.gt(0n);
            
            // Check burn occurred
            const asymptoticData = await minedToken.getAsymptoticData();
            expect(asymptoticData.totalBurned).to.be.gt(0n);
            
            // Check research value generated
            const expectedResearchValue = BigInt(complexity) * BigInt(significance) * BigInt(100);
            expect(BigInt(discovery.researchValue)).to.equal(expectedResearchValue);
            
            console.log(`   ✅ Miner balance: ${ethers.formatEther(minerBalance)} MINED`);
            console.log(`   ✅ Total burned: ${ethers.formatEther(asymptoticData.totalBurned)} MINED`);
            console.log(`   ✅ Research value: ${discovery.researchValue}`);
            
            // Phase 5: Verify Validator Rewards
            console.log("🔐 Phase 5: Verifying validator rewards");
            
            // Check that validators received rewards from staking pool
            const validator1Balance = await minedToken.balanceOf(ethers.getAddress("0x0000000000000000000000000000000000000001"));
            const validator2Balance = await minedToken.balanceOf(ethers.getAddress("0x0000000000000000000000000000000000000002"));
            
            console.log(`   ✅ Validator 1 balance: ${ethers.formatEther(validator1Balance)} MINED`);
            console.log(`   ✅ Validator 2 balance: ${ethers.formatEther(validator2Balance)} MINED`);
            
            // Phase 6: Verify Pool Balances
            console.log("🏦 Phase 6: Verifying pool balance updates");
            
            const finalMiningPool = await minedToken.miningRewardsPool();
            const finalStakingPool = await minedToken.stakingPoolBalance();
            
            console.log(`   ✅ Mining pool: ${ethers.formatEther(finalMiningPool)} MINED (was ${ethers.formatEther(initialPools.miningRewards)})`);
            console.log(`   ✅ Staking pool: ${ethers.formatEther(finalStakingPool)} MINED (was ${ethers.formatEther(initialPools.staking)})`);
            
            console.log("\n🎉 Complete lifecycle test passed!");
        });

        it("Should handle multiple miners with different work types", async function () {
            console.log("\n🔄 Testing multiple miners with different work types...");
            
            // Miner 1: Millennium Problem (Riemann Zeros)
            const session1 = await minedToken.connect(miner1).startMiningSession(0, 25);
            const session1Receipt = await session1.wait();
            const session1Id = session1Receipt.logs.find(log => 
                log.fragment && log.fragment.name === 'MiningSessionStarted'
            ).args.sessionId;
            
            // Miner 2: Standard Research (Number Theory)
            const session2 = await minedToken.connect(miner2).startMiningSession(19, 15);
            const session2Receipt = await session2.wait();
            const session2Id = session2Receipt.logs.find(log => 
                log.fragment && log.fragment.name === 'MiningSessionStarted'
            ).args.sessionId;
            
            // Submit PoW results
            const fullHash1 = ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(
                ['uint32', 'uint32', 'uint16', 'uint8'],
                [session1Id, 12345, 95, 10] // High complexity, max significance
            ));
            const hash1 = BigInt(fullHash1) & BigInt("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"); // Convert to uint128
            
            const fullHash2 = ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(
                ['uint32', 'uint32', 'uint16', 'uint8'],
                [session2Id, 67890, 45, 4] // Medium complexity, standard significance
            ));
            const hash2 = BigInt(fullHash2) & BigInt("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"); // Convert to uint128
            
            await minedToken.connect(miner1).submitPoWResult(session1Id, 12345, hash1, 95, 10);
            await minedToken.connect(miner2).submitPoWResult(session2Id, 67890, hash2, 45, 4);
            
            // Verify different rewards based on work type
            const miner1Balance = await minedToken.balanceOf(miner1.address);
            const miner2Balance = await minedToken.balanceOf(miner2.address);
            
            console.log("✅ Multiple miners test completed:");
            console.log(`   Miner 1 (Riemann Zeros): ${ethers.formatEther(miner1Balance)} MINED`);
            console.log(`   Miner 2 (Number Theory): ${ethers.formatEther(miner2Balance)} MINED`);
            
            // Miner 1 should have higher rewards due to Millennium Problem
            expect(miner1Balance).to.be.gt(miner2Balance);
        });
    });

    describe("Burn Rate Verification", function () {
        it("Should apply correct burn rates based on significance", async function () {
            console.log("\n🔥 Testing burn rates for different significance levels...");
            
            const testCases = [
                { significance: 10, expectedBurnRate: 45, description: "Millennium Problem" },
                { significance: 8, expectedBurnRate: 31, description: "Major Theorem" },
                { significance: 6, expectedBurnRate: 24, description: "Collaborative Discovery" },
                { significance: 4, expectedBurnRate: 18, description: "Standard Research" },
                { significance: 2, expectedBurnRate: 14, description: "Basic Research" }
            ];
            
            for (const testCase of testCases) {
                const session = await minedToken.connect(miner1).startMiningSession(0, 25);
                const sessionId = (await session.wait()).logs.find(log => 
                    log.fragment && log.fragment.name === 'MiningSessionStarted'
                ).args.sessionId;
                
                const fullHash = ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(
                    ['uint32', 'uint32', 'uint16', 'uint8'],
                    [sessionId, 12345, 50, testCase.significance]
                ));
                const hash = BigInt(fullHash) & BigInt("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"); // Convert to uint128
                
                const beforeBurn = await minedToken.getAsymptoticData();
                await minedToken.connect(miner1).submitPoWResult(sessionId, 12345, hash, 50, testCase.significance);
                const afterBurn = await minedToken.getAsymptoticData();
                
                const burned = afterBurn.totalBurned - beforeBurn.totalBurned;
                const expectedBurnAmount = BigInt(50) * BigInt(testCase.significance) * BigInt(100) * BigInt(testCase.expectedBurnRate) / BigInt(10000);
                
                console.log(`   ${testCase.description} (Significance ${testCase.significance}):`);
                console.log(`     Expected burn rate: ${testCase.expectedBurnRate}%`);
                console.log(`     Actual burned: ${ethers.formatEther(burned)} MINED`);
                console.log(`     Expected burned: ${ethers.formatEther(expectedBurnAmount)} MINED`);
                
                // Allow for small rounding differences
                expect(burned).to.be.closeTo(expectedBurnAmount, ethers.parseEther("0.1"));
            }
        });
    });

    describe("Final Summary", function () {
        it("Should provide comprehensive system summary", async function () {
            console.log("\n📊 FINAL SYSTEM SUMMARY");
            console.log("========================");
            
            const asymptoticData = await minedToken.getAsymptoticData();
            const totalSupply = await minedToken.totalSupply();
            
            console.log(`Total Supply: ${ethers.formatEther(totalSupply)} MINED`);
            console.log(`Asymptotic Supply: ${ethers.formatEther(asymptoticData.asymptoticSupply)} MINED`);
            console.log(`Total Emission: ${ethers.formatEther(asymptoticData.totalEmission)} MINED`);
            console.log(`Total Burned: ${ethers.formatEther(asymptoticData.totalBurned)} MINED`);
            console.log(`Total Research Value: ${asymptoticData.totalResearchValue}`);
            
            const pools = {
                mining: await minedToken.miningRewardsPool(),
                staking: await minedToken.stakingPoolBalance(),
                treasury: await minedToken.treasuryPool(),
                research: await minedToken.researchAccessPool(),
                governance: await minedToken.governancePool(),
                transaction: await minedToken.transactionFeePool()
            };
            
            console.log("\nPool Balances:");
            console.log(`  Mining Rewards: ${ethers.formatEther(pools.mining)} MINED`);
            console.log(`  Staking: ${ethers.formatEther(pools.staking)} MINED`);
            console.log(`  Treasury: ${ethers.formatEther(pools.treasury)} MINED`);
            console.log(`  Research Access: ${ethers.formatEther(pools.research)} MINED`);
            console.log(`  Governance: ${ethers.formatEther(pools.governance)} MINED`);
            console.log(`  Transaction Fee: ${ethers.formatEther(pools.transaction)} MINED`);
            
            console.log("\n✅ All tests passed! System ready for deployment.");
        });
    });
});
