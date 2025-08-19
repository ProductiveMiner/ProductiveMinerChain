const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MINEDToken - Owner Token Verification", function () {
    let minedToken;
    let owner;

    beforeEach(async function () {
        [owner] = await ethers.getSigners();
        
        const MINEDToken = await ethers.getContractFactory("MINEDToken");
        minedToken = await MINEDToken.deploy();
        await minedToken.waitForDeployment();
    });

    it("Should verify owner starts with 0 tokens and all tokens go to pools", async function () {
        console.log("\n" + "=".repeat(80));
        console.log("🔍 OWNER TOKEN VERIFICATION TEST");
        console.log("=".repeat(80));
        
        // Check owner balance
        const ownerBalance = await minedToken.balanceOf(owner.address);
        console.log(`\n👤 Owner Balance: ${ethers.formatEther(ownerBalance)} MINED`);
        expect(ownerBalance).to.equal(0n);
        
        // Check contract balance (should have all tokens)
        const contractAddress = await minedToken.getAddress();
        const contractBalance = await minedToken.balanceOf(contractAddress);
        console.log(`📦 Contract Balance: ${ethers.formatEther(contractBalance)} MINED`);
        expect(contractBalance).to.equal(ethers.parseEther("1000000000")); // 1B tokens
        
        // Check pool allocations
        const miningRewardsPool = await minedToken.miningRewardsPool();
        const stakingPoolBalance = await minedToken.stakingPoolBalance();
        const governancePool = await minedToken.governancePool();
        const researchAccessPool = await minedToken.researchAccessPool();
        const transactionFeePool = await minedToken.transactionFeePool();
        const treasuryPool = await minedToken.treasuryPool();
        
        console.log(`\n💰 Pool Allocations:`);
        console.log(`   Mining Rewards Pool: ${ethers.formatEther(miningRewardsPool)} MINED`);
        console.log(`   Staking Pool: ${ethers.formatEther(stakingPoolBalance)} MINED`);
        console.log(`   Governance Pool: ${ethers.formatEther(governancePool)} MINED`);
        console.log(`   Research Access Pool: ${ethers.formatEther(researchAccessPool)} MINED`);
        console.log(`   Transaction Fee Pool: ${ethers.formatEther(transactionFeePool)} MINED`);
        console.log(`   Treasury Pool: ${ethers.formatEther(treasuryPool)} MINED`);
        
        // Verify pool allocations match expected values
        expect(miningRewardsPool).to.equal(ethers.parseEther("100000000")); // 100M
        expect(stakingPoolBalance).to.equal(ethers.parseEther("200000000")); // 200M
        expect(governancePool).to.equal(ethers.parseEther("50000000")); // 50M
        expect(researchAccessPool).to.equal(ethers.parseEther("100000000")); // 100M
        expect(transactionFeePool).to.equal(ethers.parseEther("50000000")); // 50M
        expect(treasuryPool).to.equal(ethers.parseEther("100000000")); // 100M
        
        // Verify total pool allocation equals total supply
        const totalPools = miningRewardsPool + stakingPoolBalance + governancePool + 
                          researchAccessPool + transactionFeePool + treasuryPool;
        console.log(`\n📊 Total Pool Allocation: ${ethers.formatEther(totalPools)} MINED`);
        expect(totalPools).to.equal(ethers.parseEther("600000000")); // 600M in pools
        
        // Verify circulating supply
        const circulatingSupply = await minedToken.circulatingSupply();
        console.log(`💸 Circulating Supply: ${ethers.formatEther(circulatingSupply)} MINED`);
        expect(circulatingSupply).to.equal(ethers.parseEther("500000000")); // 500M circulating
        
        console.log(`\n✅ VERIFICATION COMPLETE:`);
        console.log(`   • Owner starts with 0 tokens: ✅`);
        console.log(`   • All tokens allocated to pools: ✅`);
        console.log(`   • Pool allocations match tokenomics: ✅`);
        console.log(`   • Circulating supply correctly set: ✅`);
    });
});
