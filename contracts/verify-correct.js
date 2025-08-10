const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Verifying deployed ProductiveMiner contract with correct settings...");

  const contractAddress = "0x151EcB946F8D6a6cBaC1F41443A1503c39ACAD3B";
  const constructorArguments = ["0x0000000000000000000000000000000000000000"]; // zero address

  console.log("📋 Contract Address:", contractAddress);
  console.log("🔧 Constructor Arguments:", constructorArguments);
  console.log("⚙️  Compiler Settings: 0.8.20, No Optimization, 200 runs");

  try {
    await hre.run("verify:verify", {
      address: contractAddress,
      constructorArguments: constructorArguments,
      network: "testnet",
      contract: "contracts/ProductiveMiner.sol:ProductiveMiner"
    });
    
    console.log("✅ Contract verified successfully on Etherscan!");
    console.log("🌐 View contract at: https://sepolia.etherscan.io/address/" + contractAddress);
    
  } catch (error) {
    console.error("❌ Verification failed:", error.message);
    
    if (error.message.includes("Already Verified")) {
      console.log("ℹ️  Contract is already verified on Etherscan");
      console.log("🌐 View contract at: https://sepolia.etherscan.io/address/" + contractAddress);
    } else {
      console.log("📝 Manual verification required with these settings:");
      console.log("   - Contract Address:", contractAddress);
      console.log("   - Compiler Version: 0.8.20+commit.a1b79de6");
      console.log("   - Optimization: No");
      console.log("   - Runs: 200");
      console.log("   - Constructor Arguments:", constructorArguments[0]);
      console.log("   - License: MIT");
      console.log("");
      console.log("🔧 Manual verification URL:");
      console.log("   https://sepolia.etherscan.io/verifyContract");
    }
  }
}

main()
  .then(() => {
    console.log("\n✅ Verification process completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Verification failed:", error);
    process.exit(1);
  });
