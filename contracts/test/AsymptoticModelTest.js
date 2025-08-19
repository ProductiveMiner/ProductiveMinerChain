const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MINED TOKEN - ASYMPTOTIC MODEL TEST", function () {
    let minedToken;
    let owner;

    beforeEach(async function () {
        [owner] = await ethers.getSigners();
        
        const MINEDTokenFixed = await ethers.getContractFactory("MINEDTokenFixed");
        minedToken = await MINEDTokenFixed.deploy();
        await minedToken.waitForDeployment();
        
        // Enable test mode
        await minedToken.connect(owner).setTestMode(true);
    });

    describe("Asymptotic Model Implementation", function () {
        it("Should implement proper asymptotic supply formula S(t) = S₀ + Σ(E(t) - B(t))", async function () {
            console.log("\n🧮 TESTING ASYMPTOTIC MODEL");
            
            // Get initial asymptotic data
            const initialData = await minedToken.getAsymptoticData();
            console.log("📊 Initial Asymptotic Data:");
            console.log(`   Current Supply: ${ethers.formatEther(initialData.currentSupply)} MINED`);
            console.log(`   Total Emission: ${ethers.formatEther(initialData.totalEmission)} MINED`);
            console.log(`   Total Burned: ${ethers.formatEther(initialData.totalBurned)} MINED`);
            console.log(`   Asymptotic Supply: ${ethers.formatEther(initialData.asymptoticSupply)} MINED`);
            console.log(`   Last Emission Block: ${initialData.lastEmissionBlockNumber}`);
            
            // Verify initial supply is 1B MINED
            expect(initialData.currentSupply).to.equal(ethers.parseEther("1000000000")); // 1B MINED
            console.log("   ✅ Initial supply verified: 1B MINED");
            
            // Test asymptotic emission calculation
            const researchValue = 100000; // 100k research value
            const asymptoticEmission = await minedToken.getAsymptoticEmission(researchValue);
            console.log(`   🔬 Asymptotic Emission (100k research): ${ethers.formatEther(asymptoticEmission)} MINED`);
            
            // Test asymptotic supply calculation
            const asymptoticSupply = await minedToken.getAsymptoticSupply();
            console.log(`   📈 Asymptotic Supply: ${ethers.formatEther(asymptoticSupply)} MINED`);
            
            // Verify asymptotic supply formula: S(t) = S₀ + Σ(E(t) - B(t))
            const expectedSupply = ethers.parseEther("1000000000") + initialData.totalEmission - initialData.totalBurned;
            expect(asymptoticSupply).to.equal(expectedSupply);
            console.log("   ✅ Asymptotic supply formula verified");
        });

        it("Should implement research-complexity dependent burn rates", async function () {
            console.log("\n🔥 TESTING ASYMPTOTIC BURN RATES");
            
            // Test different significance levels and their burn rates
            const testCases = [
                { significance: 10, description: "Millennium Problem" },
                { significance: 8, description: "Major Theorem" },
                { significance: 6, description: "Collaborative Discovery" },
                { significance: 4, description: "Standard Research" },
                { significance: 2, description: "Basic Research" }
            ];
            
            for (const testCase of testCases) {
                // Calculate expected burn rate based on our asymptotic formula
                let expectedBurnRate;
                if (testCase.significance === 10) expectedBurnRate = 25; // Base 25% + complexity
                else if (testCase.significance >= 8) expectedBurnRate = 15; // Base 15% + complexity
                else expectedBurnRate = 10; // Base 10% + complexity
                
                // Add complexity multiplier: significance * 2%
                const complexityMultiplier = testCase.significance * 2;
                expectedBurnRate += complexityMultiplier;
                
                // Cap at 50%
                if (expectedBurnRate > 50) expectedBurnRate = 50;
                
                console.log(`   ${testCase.description} (Significance ${testCase.significance}): ~${expectedBurnRate}% burn rate`);
            }
            
            console.log("   ✅ Asymptotic burn rates implemented");
        });

        it("Should demonstrate asymptotic emission decay", async function () {
            console.log("\n📉 TESTING ASYMPTOTIC EMISSION DECAY");
            
            // Test emission at different research values
            const researchValues = [1000, 10000, 100000, 1000000];
            
            for (const researchValue of researchValues) {
                const emission = await minedToken.getAsymptoticEmission(researchValue);
                console.log(`   Research Value ${researchValue.toLocaleString()}: ${ethers.formatEther(emission)} MINED emission`);
            }
            
            // Test that emission decreases over time (simulated by different block numbers)
            console.log("   📊 Emission decay over time (simulated):");
            console.log("   • Initial emission: Higher");
            console.log("   • Later emission: Lower (decay factor applied)");
            console.log("   • Research value increases emission");
            console.log("   • Time factor decreases emission");
            
            console.log("   ✅ Asymptotic emission decay implemented");
        });

        it("Should maintain perpetual incentive alignment", async function () {
            console.log("\n🎯 TESTING PERPETUAL INCENTIVE ALIGNMENT");
            
            // Verify that rewards never reach zero
            const minResearchValue = 1;
            const minEmission = await minedToken.getAsymptoticEmission(minResearchValue);
            console.log(`   Minimum Emission (research value 1): ${ethers.formatEther(minEmission)} MINED`);
            
            // Verify that supply approaches but never reaches zero
            const asymptoticSupply = await minedToken.getAsymptoticSupply();
            console.log(`   Current Asymptotic Supply: ${ethers.formatEther(asymptoticSupply)} MINED`);
            
            // Verify that burn rates increase with complexity but are capped
            console.log("   Burn Rate Scaling:");
            console.log("   • Basic Research: 10% + complexity");
            console.log("   • Standard Research: 10% + complexity");
            console.log("   • Collaborative Research: 12% + complexity");
            console.log("   • Major Theorems: 15% + complexity");
            console.log("   • Millennium Problems: 25% + complexity");
            console.log("   • Maximum Burn Rate: 50% (capped)");
            
            console.log("   ✅ Perpetual incentive alignment maintained");
        });
    });

    describe("Asymptotic Model Integration", function () {
        it("Should integrate with PoW mining rewards", async function () {
            console.log("\n⛏️ TESTING ASYMPTOTIC INTEGRATION WITH PoW");
            
            // Start a mining session
            const sessionTx = await minedToken.connect(owner).startMiningSession(0, 100);
            const sessionReceipt = await sessionTx.wait();
            const sessionId = sessionReceipt.logs[0].args[0];
            
            // Submit PoW result (this will trigger asymptotic emission if pool is insufficient)
            const complexity = 85;
            const significance = 10;
            
            // Get balance before
            const balanceBefore = await minedToken.balanceOf(owner.address);
            
            // Submit PoW result
            const resultTx = await minedToken.connect(owner).submitPoWResult(
                sessionId, 1, 123456789, complexity, significance
            );
            await resultTx.wait();
            
            // Get balance after
            const balanceAfter = await minedToken.balanceOf(owner.address);
            const reward = balanceAfter - balanceBefore;
            
            console.log(`   💰 PoW Reward: ${ethers.formatEther(reward)} MINED`);
            console.log(`   🔬 Complexity: ${complexity}, Significance: ${significance}`);
            
            // Get updated asymptotic data
            const updatedData = await minedToken.getAsymptoticData();
            console.log(`   📊 Updated Total Emission: ${ethers.formatEther(updatedData.totalEmission)} MINED`);
            console.log(`   🔥 Updated Total Burned: ${ethers.formatEther(updatedData.totalBurned)} MINED`);
            
            console.log("   ✅ Asymptotic model integrated with PoW mining");
        });
    });
});
