const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Verifying deployed ProductiveMiner contract on Etherscan...");

  const contractAddress = "0x151EcB946F8D6a6cBaC1F41443A1503c39ACAD3B";
  const constructorArguments = ["0x0000000000000000000000000000000000000000"]; // zero address

  console.log("📋 Contract Address:", contractAddress);
  console.log("🔧 Constructor Arguments:", constructorArguments);

  try {
    await hre.run("verify:verify", {
      address: contractAddress,
      constructorArguments: constructorArguments,
      network: "testnet"
    });
    
    console.log("✅ Contract verified successfully on Etherscan!");
    console.log("🌐 View contract at: https://sepolia.etherscan.io/address/" + contractAddress);
    
  } catch (error) {
    console.error("❌ Verification failed:", error.message);
    
    if (error.message.includes("Already Verified")) {
      console.log("ℹ️  Contract is already verified on Etherscan");
      console.log("🌐 View contract at: https://sepolia.etherscan.io/address/" + contractAddress);
    } else {
      console.log("📝 Manual verification may be required");
      console.log("🔧 Please verify manually at: https://sepolia.etherscan.io/verifyContract");
      console.log("📋 Manual verification details:");
      console.log("   - Contract Address:", contractAddress);
      console.log("   - Compiler Version: 0.8.20");
      console.log("   - Optimization: Yes, 200 runs");
      console.log("   - Constructor Arguments:", constructorArguments[0]);
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
