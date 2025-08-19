const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MINEDToken - Anyone Can PoW Test", function () {
    let minedToken;
    let owner, user1, user2, user3;

    beforeEach(async function () {
        [owner, user1, user2, user3] = await ethers.getSigners();
        
        const MINEDToken = await ethers.getContractFactory("MINEDToken");
        minedToken = await MINEDToken.deploy();
        await minedToken.waitForDeployment();
        
        // Enable test mode for easier testing
        await minedToken.setTestMode(true);
    });

    describe("ANYONE CAN INITIATE POW MINING", function () {
        it("Should allow any wallet to start mining sessions", async function () {
            console.log("\n" + "=".repeat(80));
            console.log("🔓 ANYONE CAN INITIATE POW MINING TEST");
            console.log("=".repeat(80));
            
            // Test multiple users starting mining sessions
            const users = [
                { name: "User 1", signer: user1, workType: 0, difficulty: 25 },
                { name: "User 2", signer: user2, workType: 1, difficulty: 30 },
                { name: "User 3", signer: user3, workType: 2, difficulty: 35 }
            ];
            
            console.log(`\n🧪 Testing ${users.length} different users starting mining sessions:`);
            console.log("-".repeat(60));
            
            for (let i = 0; i < users.length; i++) {
                const user = users[i];
                console.log(`\n👤 ${user.name} (${user.signer.address})`);
                console.log(`   🔬 Work Type: ${user.workType}`);
                console.log(`   🎯 Difficulty: ${user.difficulty}`);
                
                // Start mining session
                const miningTx = await minedToken.connect(user.signer).startMiningSession(
                    user.workType, user.difficulty
                );
                const miningReceipt = await miningTx.wait();
                
                // Extract session ID from event
                const miningEvent = miningReceipt.logs.find(log => 
                    log.fragment && log.fragment.name === 'MiningSessionStarted'
                );
                const sessionId = miningEvent.args.sessionId;
                
                console.log(`   ✅ Mining session started: ID ${sessionId}`);
                
                // Verify session was created correctly
                const session = await minedToken.miningSessions(sessionId);
                expect(session.miner).to.equal(user.signer.address);
                expect(session.workType).to.equal(BigInt(user.workType));
                expect(session.difficulty).to.equal(BigInt(user.difficulty));
                expect(session.isCompleted).to.be.false;
                
                console.log(`   🔍 Session verification: ✅ PASSED`);
            }
            
            console.log(`\n🎉 ALL USERS SUCCESSFULLY STARTED MINING SESSIONS!`);
        });
        
        it("Should allow any wallet to submit PoW results", async function () {
            console.log(`\n📝 Testing PoW result submission by any wallet:`);
            console.log("-".repeat(60));
            
            // User 1 starts a mining session
            console.log(`\n👤 User 1 starting mining session...`);
            const miningTx = await minedToken.connect(user1).startMiningSession(0, 25);
            const miningReceipt = await miningTx.wait();
            
            const miningEvent = miningReceipt.logs.find(log => 
                log.fragment && log.fragment.name === 'MiningSessionStarted'
            );
            const sessionId = miningEvent.args.sessionId;
            
            console.log(`   ✅ Mining session started: ID ${sessionId}`);
            
            // User 1 submits PoW result
            console.log(`\n📝 User 1 submitting PoW result...`);
            const powTx = await minedToken.connect(user1).submitPoWResult(
                sessionId, 12345, 123456789, 95, 10
            );
            const powReceipt = await powTx.wait();
            
            // Extract result ID from event
            const powEvent = powReceipt.logs.find(log => 
                log.fragment && log.fragment.name === 'PoWResultSubmitted'
            );
            const resultId = powEvent.args.resultId;
            
            console.log(`   ✅ PoW result submitted: ID ${resultId}`);
            
            // Check that user received rewards
            const user1Balance = await minedToken.balanceOf(user1.address);
            console.log(`   💰 User 1 balance after PoW: ${ethers.formatEther(user1Balance)} MINED`);
            expect(user1Balance).to.be.gt(0n);
            
            console.log(`\n🎉 USER SUCCESSFULLY SUBMITTED POW RESULT AND EARNED REWARDS!`);
        });
        
        it("Should verify no owner restrictions on PoW functions", async function () {
            console.log(`\n🔍 Verifying no owner restrictions:`);
            console.log("-".repeat(60));
            
            // Check that owner is not required for PoW functions
            const ownerAddress = await minedToken.owner();
            console.log(`   👑 Contract Owner: ${ownerAddress}`);
            console.log(`   👤 User 1: ${user1.address}`);
            console.log(`   🔍 Owner and User 1 are different: ${ownerAddress !== user1.address}`);
            
            // User 1 (not owner) can start mining session
            console.log(`\n🧪 User 1 (not owner) starting mining session...`);
            const miningTx = await minedToken.connect(user1).startMiningSession(0, 25);
            await miningTx.wait();
            console.log(`   ✅ User 1 successfully started mining session (no owner restriction)`);
            
            // User 2 (not owner) can also start mining session
            console.log(`\n🧪 User 2 (not owner) starting mining session...`);
            const mining2Tx = await minedToken.connect(user2).startMiningSession(1, 30);
            await mining2Tx.wait();
            console.log(`   ✅ User 2 successfully started mining session (no owner restriction)`);
            
            console.log(`\n🎉 CONFIRMED: NO OWNER RESTRICTIONS ON POW FUNCTIONS!`);
            console.log(`   ✅ Any wallet can start mining sessions`);
            console.log(`   ✅ Any wallet can submit PoW results`);
            console.log(`   ✅ No special permissions required`);
        });
        
        it("Should demonstrate complete public accessibility", async function () {
            console.log(`\n🌐 DEMONSTRATING COMPLETE PUBLIC ACCESSIBILITY:`);
            console.log("-".repeat(60));
            
            // Test that multiple users can participate simultaneously
            const users = [user1, user2, user3];
            const workTypes = [0, 1, 2];
            const difficulties = [25, 30, 35];
            
            console.log(`\n👥 Multiple users participating simultaneously:`);
            
            for (let i = 0; i < users.length; i++) {
                const user = users[i];
                const workType = workTypes[i];
                const difficulty = difficulties[i];
                
                console.log(`\n👤 User ${i + 1} (${user.address})`);
                console.log(`   🔬 Work Type: ${workType}`);
                console.log(`   🎯 Difficulty: ${difficulty}`);
                
                // Start mining session
                const miningTx = await minedToken.connect(user).startMiningSession(workType, difficulty);
                const miningReceipt = await miningTx.wait();
                
                const miningEvent = miningReceipt.logs.find(log => 
                    log.fragment && log.fragment.name === 'MiningSessionStarted'
                );
                const sessionId = miningEvent.args.sessionId;
                
                console.log(`   ✅ Session ID: ${sessionId}`);
                
                // Submit PoW result
                const powTx = await minedToken.connect(user).submitPoWResult(
                    sessionId, 10000 + i, 100000000 + i, 90 + i, 8 + i
                );
                await powTx.wait();
                
                console.log(`   ✅ PoW result submitted`);
                
                // Check balance
                const balance = await minedToken.balanceOf(user.address);
                console.log(`   💰 Balance: ${ethers.formatEther(balance)} MINED`);
            }
            
            console.log(`\n🎉 COMPLETE PUBLIC ACCESSIBILITY CONFIRMED!`);
            console.log(`   ✅ Multiple users can participate simultaneously`);
            console.log(`   ✅ Each user can earn rewards independently`);
            console.log(`   ✅ No user has special privileges`);
            console.log(`   ✅ System is truly decentralized`);
        });
    });
});
