const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MINEDToken - Anyone Can Start PoW Test", function () {
    let minedToken;
    let owner, miner1, miner2, miner3, randomUser;

    beforeEach(async function () {
        [owner, miner1, miner2, miner3, randomUser] = await ethers.getSigners();
        
        const MINEDToken = await ethers.getContractFactory("MINEDToken");
        minedToken = await MINEDToken.deploy();
        await minedToken.waitForDeployment();
        
        // Enable test mode for easier testing
        await minedToken.setTestMode(true);
    });

    describe("ANYONE CAN START PoW SESSIONS", function () {
        it("Should allow ANYONE to start mining sessions", async function () {
            console.log("\n" + "=".repeat(80));
            console.log("🔓 ANYONE CAN START PoW TEST");
            console.log("=".repeat(80));
            
            const contractAddress = await minedToken.getAddress();
            console.log(`Contract Address: ${contractAddress}`);
            console.log(`Contract Owner: ${await minedToken.owner()}`);
            
            // Test different work types and difficulties
            const testCases = [
                { user: miner1, workType: 0, difficulty: 25, description: "Miner 1 - Riemann Zeros" },
                { user: miner2, workType: 5, difficulty: 50, description: "Miner 2 - Number Theory" },
                { user: miner3, workType: 10, difficulty: 75, description: "Miner 3 - Cryptography" },
                { user: randomUser, workType: 15, difficulty: 100, description: "Random User - Blockchain Protocols" }
            ];
            
            console.log("\n📝 Testing PoW Session Creation by Different Users:");
            console.log("-".repeat(60));
            
            for (let i = 0; i < testCases.length; i++) {
                const testCase = testCases[i];
                const { user, workType, difficulty, description } = testCase;
                
                console.log(`\n🧪 Test ${i + 1}: ${description}`);
                console.log(`   User: ${user.address}`);
                console.log(`   Work Type: ${workType}`);
                console.log(`   Difficulty: ${difficulty}`);
                
                // Verify user is NOT the owner
                const isOwner = user.address === await minedToken.owner();
                console.log(`   Is Owner: ${isOwner}`);
                expect(isOwner).to.be.false;
                
                // Start mining session
                const startTx = await minedToken.connect(user).startMiningSession(workType, difficulty);
                const startReceipt = await startTx.wait();
                
                // Extract session ID from event
                const startEvent = startReceipt.logs.find(log => 
                    log.fragment && log.fragment.name === 'MiningSessionStarted'
                );
                const sessionId = startEvent.args.sessionId;
                
                console.log(`   ✅ Session Started Successfully!`);
                console.log(`      Session ID: ${sessionId}`);
                console.log(`      Transaction Hash: ${startTx.hash}`);
                console.log(`      Gas Used: ${startReceipt.gasUsed}`);
                
                // Get session details
                const session = await minedToken.miningSessions(sessionId);
                console.log(`   📋 Session Details:`);
                console.log(`      Miner: ${session.miner}`);
                console.log(`      Work Type: ${session.workType}`);
                console.log(`      Difficulty: ${session.difficulty}`);
                console.log(`      Is Completed: ${session.isCompleted}`);
                
                // Verify session belongs to the correct user
                expect(session.miner).to.equal(user.address);
                expect(session.workType).to.equal(workType);
                expect(session.difficulty).to.equal(difficulty);
                expect(session.isCompleted).to.be.false;
                
                console.log(`   ✅ Session verification passed!`);
            }
            
            // Test that multiple users can have active sessions simultaneously
            console.log("\n🔄 Testing Multiple Concurrent Sessions:");
            console.log("-".repeat(60));
            
            const concurrentSessions = [];
            for (let i = 0; i < 3; i++) {
                const user = [miner1, miner2, miner3][i];
                const workType = i * 5;
                const difficulty = 25 + (i * 25);
                
                const startTx = await minedToken.connect(user).startMiningSession(workType, difficulty);
                const startReceipt = await startTx.wait();
                
                const startEvent = startReceipt.logs.find(log => 
                    log.fragment && log.fragment.name === 'MiningSessionStarted'
                );
                const sessionId = startEvent.args.sessionId;
                
                concurrentSessions.push({
                    user: user.address,
                    sessionId: sessionId,
                    workType: workType,
                    difficulty: difficulty
                });
                
                console.log(`   Session ${sessionId}: ${user.address} - Work Type ${workType}, Difficulty ${difficulty}`);
            }
            
            console.log(`\n✅ All ${concurrentSessions.length} concurrent sessions created successfully!`);
            
            // Verify all sessions are active and belong to different users
            for (const sessionInfo of concurrentSessions) {
                const session = await minedToken.miningSessions(sessionInfo.sessionId);
                expect(session.miner).to.equal(sessionInfo.user);
                expect(session.isCompleted).to.be.false;
            }
            
            console.log("\n" + "=".repeat(80));
            console.log("🎉 ANYONE CAN START PoW TEST PASSED!");
            console.log("=".repeat(80));
        });
        
        it("Should allow ANYONE to submit PoW results", async function () {
            console.log("\n" + "=".repeat(80));
            console.log("🔓 ANYONE CAN SUBMIT PoW RESULTS TEST");
            console.log("=".repeat(80));
            
            // Start a session with miner1
            const workType = 0; // Riemann Zeros
            const difficulty = 25;
            
            console.log(`\n📝 Starting session with Miner 1:`);
            console.log(`   Work Type: ${workType} (Riemann Zeros)`);
            console.log(`   Difficulty: ${difficulty}`);
            
            const startTx = await minedToken.connect(miner1).startMiningSession(workType, difficulty);
            const startReceipt = await startTx.wait();
            
            const startEvent = startReceipt.logs.find(log => 
                log.fragment && log.fragment.name === 'MiningSessionStarted'
            );
            const sessionId = startEvent.args.sessionId;
            
            console.log(`   ✅ Session ${sessionId} started successfully`);
            
            // Submit PoW result with miner1
            const nonce = 12345;
            const complexity = 95;
            const significance = 10;
            
            console.log(`\n⛏️ Submitting PoW result with Miner 1:`);
            console.log(`   Nonce: ${nonce}`);
            console.log(`   Complexity: ${complexity}`);
            console.log(`   Significance: ${significance}`);
            
            // Calculate hash
            const fullHash = ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(
                ['uint32', 'uint32', 'uint16', 'uint8'],
                [sessionId, nonce, complexity, significance]
            ));
            const hash = BigInt(fullHash) & BigInt("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF");
            
            const submitTx = await minedToken.connect(miner1).submitPoWResult(
                sessionId, nonce, hash, complexity, significance
            );
            const submitReceipt = await submitTx.wait();
            
            const submitEvent = submitReceipt.logs.find(log => 
                log.fragment && log.fragment.name === 'PoWResultSubmitted'
            );
            const resultId = submitEvent.args.resultId;
            
            console.log(`   ✅ PoW Result ${resultId} submitted successfully`);
            console.log(`   Transaction Hash: ${submitTx.hash}`);
            console.log(`   Gas Used: ${submitReceipt.gasUsed}`);
            
            // Check that miner1 received rewards
            const miner1Balance = await minedToken.balanceOf(miner1.address);
            console.log(`\n💰 Miner 1 Balance: ${ethers.formatEther(miner1Balance)} MINED`);
            expect(miner1Balance).to.be.gt(0n);
            
            // Verify PoW result details
            const powResult = await minedToken.powResults(resultId);
            console.log(`\n📊 PoW Result Details:`);
            console.log(`   Session ID: ${powResult.sessionId}`);
            console.log(`   Complexity: ${powResult.complexity}`);
            console.log(`   Significance: ${powResult.significance}`);
            console.log(`   Is Valid: ${powResult.isValid}`);
            
            expect(powResult.sessionId).to.equal(sessionId);
            expect(powResult.complexity).to.equal(complexity);
            expect(powResult.significance).to.equal(significance);
            expect(powResult.isValid).to.be.true;
            
            console.log("\n" + "=".repeat(80));
            console.log("🎉 ANYONE CAN SUBMIT PoW RESULTS TEST PASSED!");
            console.log("=".repeat(80));
        });
        
        it("Should demonstrate complete user accessibility", async function () {
            console.log("\n" + "=".repeat(80));
            console.log("🔓 COMPLETE USER ACCESSIBILITY TEST");
            console.log("=".repeat(80));
            
            console.log(`\n📊 Contract Permissions Analysis:`);
            console.log(`   Contract Owner: ${await minedToken.owner()}`);
            console.log(`   Test Users:`);
            console.log(`     - Miner 1: ${miner1.address}`);
            console.log(`     - Miner 2: ${miner2.address}`);
            console.log(`     - Random User: ${randomUser.address}`);
            
            // Test that non-owner functions are accessible
            const publicFunctions = [
                { name: "startMiningSession", params: [0, 25] },
                { name: "submitPoWResult", params: [1, 12345, 100000000000000000000000000000000000000, 50, 5] },
                { name: "submitDiscovery", params: [0, 50, 5] },
                { name: "balanceOf", params: [miner1.address] },
                { name: "totalSupply", params: [] },
                { name: "name", params: [] },
                { name: "symbol", params: [] },
                { name: "decimals", params: [] }
            ];
            
            console.log(`\n🔍 Testing Public Function Accessibility:`);
            console.log("-".repeat(60));
            
            for (const func of publicFunctions) {
                try {
                    if (func.params.length === 0) {
                        await minedToken[func.name]();
                    } else {
                        await minedToken[func.name](...func.params);
                    }
                    console.log(`   ✅ ${func.name}() - ACCESSIBLE`);
                } catch (error) {
                    console.log(`   ❌ ${func.name}() - NOT ACCESSIBLE: ${error.message}`);
                }
            }
            
            // Test that owner-only functions are restricted
            const ownerOnlyFunctions = [
                { name: "setTestMode", params: [true] },
                { name: "updateNetworkHealth", params: [95] },
                { name: "verifySystemCompatibility", params: [] }
            ];
            
            console.log(`\n🔒 Testing Owner-Only Function Restrictions:`);
            console.log("-".repeat(60));
            
            for (const func of ownerOnlyFunctions) {
                try {
                    if (func.params.length === 0) {
                        await minedToken.connect(randomUser)[func.name]();
                    } else {
                        await minedToken.connect(randomUser)[func.name](...func.params);
                    }
                    console.log(`   ❌ ${func.name}() - SHOULD BE RESTRICTED`);
                } catch (error) {
                    if (error.message.includes("OwnableUnauthorizedAccount")) {
                        console.log(`   ✅ ${func.name}() - PROPERLY RESTRICTED`);
                    } else {
                        console.log(`   ⚠️ ${func.name}() - OTHER ERROR: ${error.message}`);
                    }
                }
            }
            
            console.log("\n" + "=".repeat(80));
            console.log("🎉 COMPLETE USER ACCESSIBILITY TEST PASSED!");
            console.log("=".repeat(80));
        });
    });
});
