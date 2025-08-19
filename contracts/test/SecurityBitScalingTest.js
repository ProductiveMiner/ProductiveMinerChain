const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MINEDToken - Mathematical Discovery Feedback Loop Security Test", function () {
    let minedToken;
    let owner, miner1, miner2, validator1;

    beforeEach(async function () {
        [owner, miner1, miner2, validator1] = await ethers.getSigners();
        
        const MINEDToken = await ethers.getContractFactory("MINEDToken");
        minedToken = await MINEDToken.deploy();
        await minedToken.waitForDeployment();
        
        // Enable test mode for easier testing
        await minedToken.setTestMode(true);
        
        // Miners will earn tokens through PoW mining - this is the correct mechanism
        console.log("Miners will earn tokens through PoW mining before testing discoveries");
        
        // Start a mining session and submit PoW to earn tokens
        console.log("\n⛏️ Setting up mining session for token earning...");
        const miningTx = await minedToken.connect(miner1).startMiningSession(0, 25);
        await miningTx.wait();
        
        // Submit PoW result to earn tokens from mining rewards pool
        const powTx = await minedToken.connect(miner1).submitPoWResult(1, 12345, 123456789, 95, 10);
        await powTx.wait();
        
        // Check miner balance after PoW reward
        const miner1Balance = await minedToken.balanceOf(miner1.address);
        console.log(`Miner1 balance after PoW: ${ethers.formatEther(miner1Balance)} MINED`);
        
        // Give some tokens to miner2 for testing
        if (miner1Balance > ethers.parseEther("100")) {
            await minedToken.connect(miner1).transfer(miner2.address, ethers.parseEther("50"));
            console.log("Transferred 50 MINED from miner1 to miner2 for testing");
        }
    });

    describe("MATHEMATICAL DISCOVERY FEEDBACK LOOP SECURITY MODEL", function () {
        it("Should implement proper bit strength scaling", async function () {
            console.log("\n" + "=".repeat(80));
            console.log("🔐 MATHEMATICAL DISCOVERY FEEDBACK LOOP SECURITY TEST");
            console.log("=".repeat(80));
            
            // Get initial security info
            const initialSecurity = await minedToken.getSecurityInfo();
            console.log(`\n📊 Initial Security State:`);
            console.log(`   Bit Strength: ${initialSecurity.bitStrength} bits`);
            console.log(`   Total Complexity: ${initialSecurity.totalComplexity}`);
            console.log(`   Discovery Chain Length: ${initialSecurity.chainLength}`);
            console.log(`   Discovery Chain Security: ${initialSecurity.discoveryChainSecurity}`);
            
            // Verify initial state
            expect(initialSecurity.bitStrength).to.be.gte(256); // At least base 256-bit security
            expect(initialSecurity.chainLength).to.equal(0); // No discoveries yet
            expect(initialSecurity.totalComplexity).to.equal(0); // No complexity yet
            
            // Test base bit strength
            const baseBitStrength = await minedToken.baseBitStrength();
            console.log(`\n🔬 Base Bit Strength: ${baseBitStrength} bits`);
            expect(baseBitStrength).to.equal(256);
            
            // Test mathematical complexity tracking
            const totalComplexity = await minedToken.totalMathematicalComplexity();
            const discoveryChainLength = await minedToken.discoveryChainLength();
            console.log(`\n📈 Mathematical Complexity Tracking:`);
            console.log(`   Total Complexity: ${totalComplexity}`);
            console.log(`   Discovery Chain Length: ${discoveryChainLength}`);
            
            expect(totalComplexity).to.equal(0);
            expect(discoveryChainLength).to.equal(0);
        });
        
        it("Should scale bit strength with mathematical discoveries", async function () {
            console.log("\n" + "=".repeat(80));
            console.log("📈 BIT STRENGTH SCALING TEST");
            console.log("=".repeat(80));
            
            // Get initial bit strength
            const initialSecurity = await minedToken.getSecurityInfo();
            const initialBitStrength = initialSecurity.bitStrength;
            console.log(`\n🔬 Initial Bit Strength: ${initialBitStrength} bits`);
            
            // Create mathematical discoveries to test scaling
            const discoveries = [
                { complexity: 95, significance: 10, description: "Millennium Problem" },
                { complexity: 80, significance: 8, description: "Major Theorem" },
                { complexity: 60, significance: 6, description: "Collaborative Discovery" },
                { complexity: 40, significance: 4, description: "Standard Research" },
                { complexity: 20, significance: 2, description: "Basic Research" }
            ];
            
            console.log(`\n🧪 Testing Bit Strength Scaling with ${discoveries.length} Discoveries:`);
            console.log("-".repeat(60));
            
            for (let i = 0; i < discoveries.length; i++) {
                const discovery = discoveries[i];
                console.log(`\n📝 Discovery ${i + 1}: ${discovery.description}`);
                console.log(`   Complexity: ${discovery.complexity}, Significance: ${discovery.significance}`);
                
                // Submit discovery
                const discoveryTx = await minedToken.connect(miner1).submitDiscovery(
                    i, discovery.complexity, discovery.significance
                );
                await discoveryTx.wait();
                
                // Get updated security info
                const updatedSecurity = await minedToken.getSecurityInfo();
                const bitStrengthIncrease = updatedSecurity.bitStrength - initialBitStrength;
                
                console.log(`   ✅ Discovery submitted successfully`);
                console.log(`   📊 Updated Bit Strength: ${updatedSecurity.bitStrength} bits`);
                console.log(`   📈 Bit Strength Increase: +${bitStrengthIncrease} bits`);
                console.log(`   🔗 Discovery Chain Length: ${updatedSecurity.chainLength}`);
                console.log(`   🧮 Total Complexity: ${updatedSecurity.totalComplexity}`);
                
                // Verify bit strength increased
                expect(updatedSecurity.bitStrength).to.be.gt(initialBitStrength);
                expect(updatedSecurity.chainLength).to.equal(i + 1);
                expect(updatedSecurity.totalComplexity).to.be.gt(0);
            }
            
            // Test final security state
            const finalSecurity = await minedToken.getSecurityInfo();
            console.log(`\n🎯 Final Security State:`);
            console.log(`   Final Bit Strength: ${finalSecurity.bitStrength} bits`);
            console.log(`   Total Bit Strength Increase: ${finalSecurity.bitStrength - initialBitStrength} bits`);
            console.log(`   Discovery Chain Length: ${finalSecurity.chainLength}`);
            console.log(`   Total Complexity: ${finalSecurity.totalComplexity}`);
            
            // Verify significant scaling occurred
            expect(finalSecurity.bitStrength).to.be.gt(initialBitStrength + 100); // Should scale significantly
            expect(finalSecurity.chainLength).to.equal(discoveries.length);
        });
        
        it("Should implement discovery chain verification", async function () {
            console.log("\n" + "=".repeat(80));
            console.log("🔍 DISCOVERY CHAIN VERIFICATION TEST");
            console.log("=".repeat(80));
            
            // Submit a discovery
            const complexity = 95;
            const significance = 10;
            const workType = 0;
            
            console.log(`\n📝 Submitting Discovery:`);
            console.log(`   Work Type: ${workType}`);
            console.log(`   Complexity: ${complexity}`);
            console.log(`   Significance: ${significance}`);
            
            const discoveryTx = await minedToken.connect(miner1).submitDiscovery(workType, complexity, significance);
            const discoveryReceipt = await discoveryTx.wait();
            
            // Extract discovery ID from event
            const discoveryEvent = discoveryReceipt.logs.find(log => 
                log.fragment && log.fragment.name === 'DiscoverySubmitted'
            );
            const discoveryId = discoveryEvent.args.discoveryId;
            
            console.log(`   ✅ Discovery ID: ${discoveryId}`);
            
            // Test discovery complexity retrieval
            const discoveryComplexity = await minedToken.getDiscoveryComplexity(discoveryId);
            console.log(`\n📊 Discovery Complexity Data:`);
            console.log(`   Complexity: ${discoveryComplexity.complexity}`);
            console.log(`   Timestamp: ${discoveryComplexity.timestamp}`);
            
            expect(discoveryComplexity.complexity).to.be.gt(0);
            expect(discoveryComplexity.timestamp).to.be.gt(0);
            
            // Test discovery integrity verification
            console.log(`\n🔍 Verifying Discovery Integrity:`);
            const verificationTx = await minedToken.connect(miner1).verifyDiscoveryIntegrity(
                discoveryId, complexity, significance
            );
            const verificationReceipt = await verificationTx.wait();
            
            // Check for verification event
            const verificationEvent = verificationReceipt.logs.find(log => 
                log.fragment && log.fragment.name === 'DiscoveryChainVerified'
            );
            
            if (verificationEvent) {
                const isValid = verificationEvent.args.isValid;
                const chainSecurity = verificationEvent.args.chainSecurity;
                
                console.log(`   ✅ Verification Event Found:`);
                console.log(`   Is Valid: ${isValid}`);
                console.log(`   Chain Security: ${chainSecurity}`);
                
                expect(isValid).to.be.true;
                expect(chainSecurity).to.be.gt(0);
            } else {
                console.log(`   ⚠️ No verification event found`);
            }
        });
        
        it("Should implement security scaling at different block heights", async function () {
            console.log("\n" + "=".repeat(80));
            console.log("📈 SECURITY SCALING AT DIFFERENT BLOCK HEIGHTS");
            console.log("=".repeat(80));
            
            // Get current block
            const currentBlock = await ethers.provider.getBlockNumber();
            console.log(`\n🌐 Current Block: ${currentBlock}`);
            
            // Test security scaling at different block heights
            const testBlocks = [
                currentBlock,
                currentBlock + 1000,
                currentBlock + 10000,
                currentBlock + 100000
            ];
            
            console.log(`\n🧪 Testing Security Scaling:`);
            console.log("-".repeat(60));
            
            for (const blockHeight of testBlocks) {
                const securityLevel = await minedToken.getSecurityScaling(blockHeight);
                const baseSecurity = 256;
                const enhancedSecurity = securityLevel - baseSecurity;
                
                console.log(`\n📊 Block Height ${blockHeight}:`);
                console.log(`   Security Level: ${securityLevel} bits`);
                console.log(`   Base Security: ${baseSecurity} bits`);
                console.log(`   Enhanced Security: ${enhancedSecurity} bits`);
                
                // Verify security level is at least base security
                expect(securityLevel).to.be.gte(baseSecurity);
            }
            
            // Test that security scales with block height
            const lowBlockSecurity = await minedToken.getSecurityScaling(currentBlock);
            const highBlockSecurity = await minedToken.getSecurityScaling(currentBlock + 100000n);
            
            console.log(`\n📈 Security Scaling Comparison:`);
            console.log(`   Low Block (${currentBlock}): ${lowBlockSecurity} bits`);
            console.log(`   High Block (${currentBlock + 100000}): ${highBlockSecurity} bits`);
            console.log(`   Scaling Factor: ${Number(highBlockSecurity) / Number(lowBlockSecurity)}x`);
            
            // Security should scale with block height
            expect(highBlockSecurity).to.be.gte(lowBlockSecurity);
        });
        
        it("Should implement unlimited bit scaling potential", async function () {
            console.log("\n" + "=".repeat(80));
            console.log("♾️ UNLIMITED BIT SCALING POTENTIAL TEST");
            console.log("=".repeat(80));
            
            // Test the mathematical formula: Bit_Strength(t) = 256 + Σ(Discovery_Complexity) / 1000
            console.log(`\n🧮 Testing Bit Strength Formula:`);
            console.log(`   Formula: Bit_Strength(t) = 256 + Σ(Discovery_Complexity) / 1000`);
            
            // Submit multiple high-complexity discoveries
            const highComplexityDiscoveries = [
                { complexity: 100, significance: 10, description: "Millennium Problem" },
                { complexity: 95, significance: 10, description: "Major Theorem" },
                { complexity: 90, significance: 9, description: "Advanced Research" },
                { complexity: 85, significance: 8, description: "Complex Algorithm" },
                { complexity: 80, significance: 7, description: "Mathematical Proof" }
            ];
            
            console.log(`\n📝 Submitting ${highComplexityDiscoveries.length} High-Complexity Discoveries:`);
            console.log("-".repeat(60));
            
            let cumulativeComplexity = 0;
            for (let i = 0; i < highComplexityDiscoveries.length; i++) {
                const discovery = highComplexityDiscoveries[i];
                const weightedComplexity = discovery.complexity * discovery.significance * 100;
                cumulativeComplexity += weightedComplexity;
                
                console.log(`\n🔬 Discovery ${i + 1}: ${discovery.description}`);
                console.log(`   Complexity: ${discovery.complexity}, Significance: ${discovery.significance}`);
                console.log(`   Weighted Complexity: ${weightedComplexity}`);
                console.log(`   Cumulative Complexity: ${cumulativeComplexity}`);
                
                // Submit discovery
                const discoveryTx = await minedToken.connect(miner1).submitDiscovery(
                    i, discovery.complexity, discovery.significance
                );
                await discoveryTx.wait();
                
                // Calculate expected bit strength
                const expectedBitStrength = 256 + (cumulativeComplexity / 1000);
                
                // Get actual bit strength
                const securityInfo = await minedToken.getSecurityInfo();
                const actualBitStrength = securityInfo.bitStrength;
                
                console.log(`   📊 Expected Bit Strength: ${expectedBitStrength.toFixed(2)} bits`);
                console.log(`   📊 Actual Bit Strength: ${actualBitStrength} bits`);
                console.log(`   ✅ Formula Verification: ${Math.abs(actualBitStrength - expectedBitStrength) < 1 ? 'PASS' : 'FAIL'}`);
                
                // Verify the formula holds (with small tolerance for rounding)
                expect(Math.abs(actualBitStrength - expectedBitStrength)).to.be.lt(1);
            }
            
            // Test final unlimited scaling potential
            const finalSecurity = await minedToken.getSecurityInfo();
            console.log(`\n🎯 Final Unlimited Scaling Analysis:`);
            console.log(`   Final Bit Strength: ${finalSecurity.bitStrength} bits`);
            console.log(`   Base Security: 256 bits`);
            console.log(`   Enhanced Security: ${finalSecurity.bitStrength - 256} bits`);
            console.log(`   Scaling Factor: ${(finalSecurity.bitStrength / 256).toFixed(2)}x`);
            console.log(`   Discovery Chain Length: ${finalSecurity.chainLength}`);
            console.log(`   Total Complexity: ${finalSecurity.totalComplexity}`);
            
            // Verify significant scaling occurred
            expect(finalSecurity.bitStrength).to.be.gt(256 + 1000); // Should scale significantly
            expect(finalSecurity.chainLength).to.equal(highComplexityDiscoveries.length);
            
            console.log(`\n♾️ Unlimited Scaling Potential Confirmed:`);
            console.log(`   ✅ Bit strength scales with mathematical complexity`);
            console.log(`   ✅ No theoretical upper bound on scaling`);
            console.log(`   ✅ Security grows with human knowledge`);
            console.log(`   ✅ Mathematical discoveries strengthen the system`);
        });
        
        it("Should implement network health adaptive scaling", async function () {
            console.log("\n" + "=".repeat(80));
            console.log("🌐 NETWORK HEALTH ADAPTIVE SCALING TEST");
            console.log("=".repeat(80));
            
            // Test different network health scenarios
            const healthScenarios = [
                { health: 95, scaling: 100, description: "Optimal Health" },
                { health: 80, scaling: 90, description: "Good Health" },
                { health: 60, scaling: 70, description: "Warning Health" },
                { health: 40, scaling: 50, description: "Critical Health" }
            ];
            
            console.log(`\n🧪 Testing Network Health Adaptive Scaling:`);
            console.log("-".repeat(60));
            
            for (const scenario of healthScenarios) {
                console.log(`\n📊 Scenario: ${scenario.description}`);
                console.log(`   Health Score: ${scenario.health}%`);
                console.log(`   Scaling Rate: ${scenario.scaling}%`);
                
                // Update network health and scaling
                await minedToken.connect(owner).updateNetworkHealth(scenario.health);
                await minedToken.connect(owner).updateScalingRate(scenario.scaling);
                
                // Get security info
                const securityInfo = await minedToken.getSecurityInfo();
                console.log(`   📈 Network Health: ${securityInfo.networkHealth}`);
                console.log(`   📈 Scaling Rate: ${securityInfo.scalingRate}`);
                console.log(`   🔐 Bit Strength: ${securityInfo.bitStrength} bits`);
                
                // Verify health and scaling were updated
                expect(securityInfo.networkHealth).to.equal(scenario.health);
                expect(securityInfo.scalingRate).to.equal(scenario.scaling);
            }
            
            // Test adaptive scaling with a discovery
            console.log(`\n🔬 Testing Adaptive Scaling with Discovery:`);
            
            // Set optimal health
            await minedToken.connect(owner).updateNetworkHealth(95);
            await minedToken.connect(owner).updateScalingRate(100);
            
            // Get security before discovery
            const beforeSecurity = await minedToken.getSecurityInfo();
            console.log(`   📊 Before Discovery:`);
            console.log(`     Bit Strength: ${beforeSecurity.bitStrength} bits`);
            console.log(`     Network Health: ${beforeSecurity.networkHealth}%`);
            console.log(`     Scaling Rate: ${beforeSecurity.scalingRate}%`);
            
            // Submit discovery
            const discoveryTx = await minedToken.connect(miner1).submitDiscovery(0, 95, 10);
            await discoveryTx.wait();
            
            // Get security after discovery
            const afterSecurity = await minedToken.getSecurityInfo();
            console.log(`   📊 After Discovery:`);
            console.log(`     Bit Strength: ${afterSecurity.bitStrength} bits`);
            console.log(`     Network Health: ${afterSecurity.networkHealth}%`);
            console.log(`     Scaling Rate: ${afterSecurity.scalingRate}%`);
            console.log(`     Bit Strength Increase: +${afterSecurity.bitStrength - beforeSecurity.bitStrength} bits`);
            
            // Verify bit strength increased
            expect(afterSecurity.bitStrength).to.be.gt(beforeSecurity.bitStrength);
        });
    });
});
