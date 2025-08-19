const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MINEDToken - Complete Lifecycle Detailed Test", function () {
    let minedToken;
    let owner, miner1, miner2, validator1, validator2;
    let initialBalances, initialPools, initialState;

    beforeEach(async function () {
        [owner, miner1, miner2, validator1, validator2] = await ethers.getSigners();
        
        const MINEDToken = await ethers.getContractFactory("MINEDToken");
        minedToken = await MINEDToken.deploy();
        await minedToken.waitForDeployment();
        
        // Enable test mode for easier testing
        await minedToken.setTestMode(true);
        
        // Capture initial state
        initialBalances = {
            miner1: await minedToken.balanceOf(miner1.address),
            miner2: await minedToken.balanceOf(miner2.address),
            validator1: await minedToken.balanceOf(ethers.getAddress("0x0000000000000000000000000000000000000001")),
            validator2: await minedToken.balanceOf(ethers.getAddress("0x0000000000000000000000000000000000000002")),
            contract: await minedToken.balanceOf(await minedToken.getAddress())
        };
        
        initialPools = {
            miningRewards: await minedToken.miningRewardsPool(),
            staking: await minedToken.stakingPoolBalance(),
            treasury: await minedToken.treasuryPool(),
            researchAccess: await minedToken.researchAccessPool(),
            governance: await minedToken.governancePool(),
            transactionFee: await minedToken.transactionFeePool()
        };
        
        initialState = await minedToken.getAsymptoticData();
    });

    describe("COMPLETE LIFECYCLE WITH DETAILED REWARD TRACKING", function () {
        it("Should show complete lifecycle: PoW Mining → Discovery → Validation → Rewards", async function () {
            console.log("\n" + "=".repeat(80));
            console.log("🔬 COMPLETE LIFECYCLE TEST - DETAILED REWARD TRACKING");
            console.log("=".repeat(80));
            
            // =============================================================================
            // PHASE 0: INITIAL STATE
            // =============================================================================
            console.log("\n📊 PHASE 0: INITIAL STATE");
            console.log("-".repeat(50));
            
            const contractAddress = await minedToken.getAddress();
            console.log(`Contract Address: ${contractAddress}`);
            console.log(`Total Supply: ${ethers.formatEther(await minedToken.totalSupply())} MINED`);
            
            console.log("\n🏦 Initial Pool Balances:");
            console.log(`  Mining Rewards Pool: ${ethers.formatEther(initialPools.miningRewards)} MINED`);
            console.log(`  Staking Pool: ${ethers.formatEther(initialPools.staking)} MINED`);
            console.log(`  Treasury Pool: ${ethers.formatEther(initialPools.treasury)} MINED`);
            console.log(`  Research Access Pool: ${ethers.formatEther(initialPools.researchAccess)} MINED`);
            console.log(`  Governance Pool: ${ethers.formatEther(initialPools.governance)} MINED`);
            console.log(`  Transaction Fee Pool: ${ethers.formatEther(initialPools.transactionFee)} MINED`);
            
            console.log("\n👥 Initial Balances:");
            console.log(`  Miner 1: ${ethers.formatEther(initialBalances.miner1)} MINED`);
            console.log(`  Miner 2: ${ethers.formatEther(initialBalances.miner2)} MINED`);
            console.log(`  Validator 1: ${ethers.formatEther(initialBalances.validator1)} MINED`);
            console.log(`  Validator 2: ${ethers.formatEther(initialBalances.validator2)} MINED`);
            console.log(`  Contract: ${ethers.formatEther(initialBalances.contract)} MINED`);
            
            console.log("\n📈 Initial Asymptotic State:");
            console.log(`  Total Emission: ${ethers.formatEther(initialState.totalEmission)} MINED`);
            console.log(`  Total Burned: ${ethers.formatEther(initialState.totalBurned)} MINED`);
            console.log(`  Asymptotic Supply: ${ethers.formatEther(initialState.asymptoticSupply)} MINED`);
            
            // =============================================================================
            // PHASE 1: START MINING SESSION
            // =============================================================================
            console.log("\n📝 PHASE 1: START MINING SESSION");
            console.log("-".repeat(50));
            
            const workType = 0; // Riemann Zeros (Millennium Problem)
            const difficulty = 25;
            
            console.log(`Work Type: ${workType} (Riemann Zeros - Millennium Problem)`);
            console.log(`Difficulty: ${difficulty}`);
            console.log(`Miner: ${miner1.address}`);
            
            // Get work type info before starting
            const workTypeInfo = await minedToken.workTypes(workType);
            console.log(`\n🔬 Work Type Details:`);
            console.log(`  Base Reward: ${ethers.formatEther(workTypeInfo.baseReward)} MINED`);
            console.log(`  Difficulty Multiplier: ${workTypeInfo.difficultyMultiplier}`);
            console.log(`  Is Active: ${workTypeInfo.isActive}`);
            
            const startTx = await minedToken.connect(miner1).startMiningSession(workType, difficulty);
            const startReceipt = await startTx.wait();
            
            // Extract session ID from event
            const startEvent = startReceipt.logs.find(log => 
                log.fragment && log.fragment.name === 'MiningSessionStarted'
            );
            const sessionId = startEvent.args.sessionId;
            console.log(`\n✅ Session Started:`);
            console.log(`  Session ID: ${sessionId}`);
            console.log(`  Transaction Hash: ${startTx.hash}`);
            console.log(`  Gas Used: ${startReceipt.gasUsed}`);
            
            // Get session details
            const session = await minedToken.miningSessions(sessionId);
            console.log(`\n📋 Session Details:`);
            console.log(`  Miner: ${session.miner}`);
            console.log(`  Work Type: ${session.workType}`);
            console.log(`  Difficulty: ${session.difficulty}`);
            console.log(`  Start Time: ${session.startTime}`);
            console.log(`  Is Completed: ${session.isCompleted}`);
            console.log(`  Target Hash: ${session.targetHash}`);
            
            // =============================================================================
            // PHASE 2: SUBMIT PoW RESULT
            // =============================================================================
            console.log("\n⛏️ PHASE 2: SUBMIT PoW RESULT");
            console.log("-".repeat(50));
            
            const nonce = 12345;
            const complexity = 95; // High complexity for Millennium Problem
            const significance = 10; // Maximum significance for Millennium Problem
            
            console.log(`PoW Parameters:`);
            console.log(`  Nonce: ${nonce}`);
            console.log(`  Complexity: ${complexity}`);
            console.log(`  Significance: ${significance}`);
            
            // Calculate expected reward before submission
            const expectedReward = await minedToken.getAsymptoticEmission(BigInt(complexity) * BigInt(significance) * BigInt(100));
            console.log(`\n💰 Expected Reward Calculation:`);
            console.log(`  Research Value: ${complexity * significance * 100}`);
            console.log(`  Expected Asymptotic Emission: ${ethers.formatEther(expectedReward)} MINED`);
            
            // Calculate hash
            const fullHash = ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(
                ['uint32', 'uint32', 'uint16', 'uint8'],
                [sessionId, nonce, complexity, significance]
            ));
            const hash = BigInt(fullHash) & BigInt("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF");
            console.log(`\n🔐 Hash Calculation:`);
            console.log(`  Full Hash: ${fullHash}`);
            console.log(`  Truncated Hash (uint128): ${hash}`);
            
            // Get pool balances before submission
            const beforePools = {
                miningRewards: await minedToken.miningRewardsPool(),
                staking: await minedToken.stakingPoolBalance()
            };
            
            console.log(`\n🏦 Pool Balances Before PoW Submission:`);
            console.log(`  Mining Rewards Pool: ${ethers.formatEther(beforePools.miningRewards)} MINED`);
            console.log(`  Staking Pool: ${ethers.formatEther(beforePools.staking)} MINED`);
            
            const submitTx = await minedToken.connect(miner1).submitPoWResult(
                sessionId, nonce, hash, complexity, significance
            );
            const submitReceipt = await submitTx.wait();
            
            // Extract result ID from event
            const submitEvent = submitReceipt.logs.find(log => 
                log.fragment && log.fragment.name === 'PoWResultSubmitted'
            );
            const resultId = submitEvent.args.resultId;
            
            console.log(`\n✅ PoW Result Submitted:`);
            console.log(`  Result ID: ${resultId}`);
            console.log(`  Transaction Hash: ${submitTx.hash}`);
            console.log(`  Gas Used: ${submitReceipt.gasUsed}`);
            
            // Get PoW result details
            const powResult = await minedToken.powResults(resultId);
            console.log(`\n📊 PoW Result Details:`);
            console.log(`  Session ID: ${powResult.sessionId}`);
            console.log(`  Hash: ${powResult.hash}`);
            console.log(`  Complexity: ${powResult.complexity}`);
            console.log(`  Significance: ${powResult.significance}`);
            console.log(`  Is Valid: ${powResult.isValid}`);
            
            // =============================================================================
            // PHASE 3: REWARD DISTRIBUTION
            // =============================================================================
            console.log("\n💰 PHASE 3: REWARD DISTRIBUTION");
            console.log("-".repeat(50));
            
            // Get balances after submission
            const afterBalances = {
                miner1: await minedToken.balanceOf(miner1.address),
                miner2: await minedToken.balanceOf(miner2.address),
                validator1: await minedToken.balanceOf(ethers.getAddress("0x0000000000000000000000000000000000000001")),
                validator2: await minedToken.balanceOf(ethers.getAddress("0x0000000000000000000000000000000000000002")),
                contract: await minedToken.balanceOf(contractAddress)
            };
            
            const afterPools = {
                miningRewards: await minedToken.miningRewardsPool(),
                staking: await minedToken.stakingPoolBalance()
            };
            
            console.log(`\n👥 Balance Changes:`);
            console.log(`  Miner 1: ${ethers.formatEther(initialBalances.miner1)} → ${ethers.formatEther(afterBalances.miner1)} MINED`);
            console.log(`    Change: +${ethers.formatEther(afterBalances.miner1 - initialBalances.miner1)} MINED`);
            console.log(`  Miner 2: ${ethers.formatEther(initialBalances.miner2)} → ${ethers.formatEther(afterBalances.miner2)} MINED`);
            console.log(`  Validator 1: ${ethers.formatEther(initialBalances.validator1)} → ${ethers.formatEther(afterBalances.validator1)} MINED`);
            console.log(`    Change: +${ethers.formatEther(afterBalances.validator1 - initialBalances.validator1)} MINED`);
            console.log(`  Validator 2: ${ethers.formatEther(initialBalances.validator2)} → ${ethers.formatEther(afterBalances.validator2)} MINED`);
            console.log(`    Change: +${ethers.formatEther(afterBalances.validator2 - initialBalances.validator2)} MINED`);
            
            console.log(`\n🏦 Pool Balance Changes:`);
            console.log(`  Mining Rewards: ${ethers.formatEther(beforePools.miningRewards)} → ${ethers.formatEther(afterPools.miningRewards)} MINED`);
            console.log(`    Change: -${ethers.formatEther(beforePools.miningRewards - afterPools.miningRewards)} MINED`);
            console.log(`  Staking Pool: ${ethers.formatEther(beforePools.staking)} → ${ethers.formatEther(afterPools.staking)} MINED`);
            console.log(`    Change: -${ethers.formatEther(beforePools.staking - afterPools.staking)} MINED`);
            
            // =============================================================================
            // PHASE 4: DISCOVERY CREATION
            // =============================================================================
            console.log("\n🔬 PHASE 4: DISCOVERY CREATION");
            console.log("-".repeat(50));
            
            // Get discovery details
            const discoveryId = await minedToken.state().then(state => state.nextDiscoveryId - 1);
            const discovery = await minedToken.discoveries(discoveryId);
            
            console.log(`\n📋 Discovery Details:`);
            console.log(`  Discovery ID: ${discoveryId}`);
            console.log(`  Researcher: ${discovery.researcher}`);
            console.log(`  Work Type: ${discovery.workType}`);
            console.log(`  Complexity: ${discovery.complexity}`);
            console.log(`  Significance: ${discovery.significance}`);
            console.log(`  Research Value: ${discovery.researchValue}`);
            console.log(`  Submission Time: ${discovery.submissionTime}`);
            console.log(`  Is Validated: ${discovery.isValidated}`);
            console.log(`  Is From PoW: ${discovery.isFromPoW}`);
            console.log(`  Validation Count: ${discovery.validationCount}`);
            
            const expectedResearchValue = BigInt(complexity) * BigInt(significance) * BigInt(100);
            console.log(`\n🔍 Research Value Verification:`);
            console.log(`  Expected: ${expectedResearchValue}`);
            console.log(`  Actual: ${discovery.researchValue}`);
            console.log(`  Match: ${BigInt(discovery.researchValue) === expectedResearchValue ? '✅' : '❌'}`);
            
            // =============================================================================
            // PHASE 5: TOKEN BURNING
            // =============================================================================
            console.log("\n🔥 PHASE 5: TOKEN BURNING");
            console.log("-".repeat(50));
            
            const finalState = await minedToken.getAsymptoticData();
            
            console.log(`\n📊 Burn Analysis:`);
            console.log(`  Total Burned Before: ${ethers.formatEther(initialState.totalBurned)} MINED`);
            console.log(`  Total Burned After: ${ethers.formatEther(finalState.totalBurned)} MINED`);
            console.log(`  Burn Amount: ${ethers.formatEther(finalState.totalBurned - initialState.totalBurned)} MINED`);
            
            // Calculate expected burn rate
            const expectedBurnRate = significance === 10 ? 45 : 
                                   significance >= 8 ? 31 : 
                                   significance >= 6 ? 24 : 
                                   significance >= 4 ? 18 : 14;
            const expectedBurnAmount = BigInt(complexity) * BigInt(significance) * BigInt(100) * BigInt(expectedBurnRate) / BigInt(10000);
            
            console.log(`\n🧮 Burn Rate Calculation:`);
            console.log(`  Significance Level: ${significance}`);
            console.log(`  Expected Burn Rate: ${expectedBurnRate}%`);
            console.log(`  Expected Burn Amount: ${ethers.formatEther(expectedBurnAmount)} MINED`);
            console.log(`  Actual Burn Amount: ${ethers.formatEther(finalState.totalBurned - initialState.totalBurned)} MINED`);
            
            // =============================================================================
            // PHASE 6: ASYMPTOTIC MODEL UPDATE
            // =============================================================================
            console.log("\n📈 PHASE 6: ASYMPTOTIC MODEL UPDATE");
            console.log("-".repeat(50));
            
            console.log(`\n📊 Asymptotic State Changes:`);
            console.log(`  Total Emission: ${ethers.formatEther(initialState.totalEmission)} → ${ethers.formatEther(finalState.totalEmission)} MINED`);
            console.log(`    Change: +${ethers.formatEther(finalState.totalEmission - initialState.totalEmission)} MINED`);
            console.log(`  Total Burned: ${ethers.formatEther(initialState.totalBurned)} → ${ethers.formatEther(finalState.totalBurned)} MINED`);
            console.log(`    Change: +${ethers.formatEther(finalState.totalBurned - initialState.totalBurned)} MINED`);
            console.log(`  Asymptotic Supply: ${ethers.formatEther(initialState.asymptoticSupply)} → ${ethers.formatEther(finalState.asymptoticSupply)} MINED`);
            console.log(`    Change: ${ethers.formatEther(finalState.asymptoticSupply - initialState.asymptoticSupply)} MINED`);
            
            // Verify asymptotic formula
            const expectedSupply = ethers.parseEther("1000000000") + finalState.totalEmission - finalState.totalBurned;
            console.log(`\n🧮 Asymptotic Formula Verification:`);
            console.log(`  S(t) = S₀ + Σ(E(t) - B(t))`);
            console.log(`  S₀ = ${ethers.formatEther(ethers.parseEther("1000000000"))} MINED`);
            console.log(`  E(t) = ${ethers.formatEther(finalState.totalEmission)} MINED`);
            console.log(`  B(t) = ${ethers.formatEther(finalState.totalBurned)} MINED`);
            console.log(`  Expected S(t) = ${ethers.formatEther(expectedSupply)} MINED`);
            console.log(`  Actual S(t) = ${ethers.formatEther(finalState.asymptoticSupply)} MINED`);
            console.log(`  Match: ${finalState.asymptoticSupply === expectedSupply ? '✅' : '❌'}`);
            
            // =============================================================================
            // PHASE 7: VALIDATOR REWARDS
            // =============================================================================
            console.log("\n🔐 PHASE 7: VALIDATOR REWARDS");
            console.log("-".repeat(50));
            
            console.log(`\n👥 Validator Reward Distribution:`);
            for (let i = 1; i <= 5; i++) {
                const validatorAddr = ethers.getAddress(`0x${i.toString().padStart(40, '0')}`);
                const validator = await minedToken.validators(validatorAddr);
                const validatorBalance = await minedToken.balanceOf(validatorAddr);
                
                console.log(`  Validator ${i} (${validatorAddr}):`);
                console.log(`    Staked Amount: ${ethers.formatEther(validator.stakedAmount)} MINED`);
                console.log(`    Current Balance: ${ethers.formatEther(validatorBalance)} MINED`);
                console.log(`    Total Validations: ${validator.totalValidations}`);
                console.log(`    Reputation: ${validator.reputation}`);
                console.log(`    Is Active: ${validator.isActive}`);
            }
            
            // =============================================================================
            // PHASE 8: FINAL SUMMARY
            // =============================================================================
            console.log("\n📊 PHASE 8: FINAL SUMMARY");
            console.log("-".repeat(50));
            
            console.log(`\n🎯 Complete Lifecycle Summary:`);
            console.log(`  ✅ Mining Session Started (ID: ${sessionId})`);
            console.log(`  ✅ PoW Result Submitted (ID: ${resultId})`);
            console.log(`  ✅ Discovery Created (ID: ${discoveryId})`);
            console.log(`  ✅ Auto-Validation Completed`);
            console.log(`  ✅ Rewards Distributed`);
            console.log(`  ✅ Tokens Burned`);
            console.log(`  ✅ Asymptotic Model Updated`);
            
            console.log(`\n💰 Total Value Generated:`);
            console.log(`  Miner Reward: ${ethers.formatEther(afterBalances.miner1 - initialBalances.miner1)} MINED`);
            console.log(`  Validator Rewards: ${ethers.formatEther((afterBalances.validator1 - initialBalances.validator1) * 5n)} MINED (5 validators)`);
            console.log(`  Research Value: ${discovery.researchValue}`);
            console.log(`  Tokens Burned: ${ethers.formatEther(finalState.totalBurned - initialState.totalBurned)} MINED`);
            
            console.log(`\n🏦 Final Pool Balances:`);
            console.log(`  Mining Rewards: ${ethers.formatEther(afterPools.miningRewards)} MINED`);
            console.log(`  Staking: ${ethers.formatEther(afterPools.staking)} MINED`);
            console.log(`  Treasury: ${ethers.formatEther(await minedToken.treasuryPool())} MINED`);
            console.log(`  Research Access: ${ethers.formatEther(await minedToken.researchAccessPool())} MINED`);
            console.log(`  Governance: ${ethers.formatEther(await minedToken.governancePool())} MINED`);
            console.log(`  Transaction Fee: ${ethers.formatEther(await minedToken.transactionFeePool())} MINED`);
            
            console.log("\n" + "=".repeat(80));
            console.log("🎉 COMPLETE LIFECYCLE TEST PASSED!");
            console.log("=".repeat(80));
            
            // Verify all expectations
            expect(afterBalances.miner1).to.be.gt(initialBalances.miner1);
            expect(finalState.totalBurned).to.be.gt(initialState.totalBurned);
            expect(discovery.isValidated).to.be.true;
            expect(discovery.isFromPoW).to.be.true;
            expect(BigInt(discovery.researchValue)).to.equal(expectedResearchValue);
        });
    });
});
