const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Verifying existing ProductiveMiner contract on Etherscan...");

  // Check if we have the required environment variables
  if (!process.env.ETHERSCAN_API_KEY) {
    console.error("❌ ETHERSCAN_API_KEY not found in environment variables");
    console.log("📝 Please add your Etherscan API key to .env file");
    process.exit(1);
  }

  // Contract address to verify (replace with your deployed contract address)
  const contractAddress = process.env.CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  
  console.log("📋 Contract Address:", contractAddress);
  
  // Constructor arguments (zero address for token integration)
  const constructorArguments = ["0x0000000000000000000000000000000000000000"];
  
  console.log("🔧 Constructor Arguments:", constructorArguments);
  
  // Verify the contract on Etherscan
  console.log("🔍 Starting verification process...");
  
  try {
    await hre.run("verify:verify", {
      address: contractAddress,
      constructorArguments: constructorArguments,
      network: "testnet" // Change to "mainnet" for mainnet verification
    });
    
    console.log("✅ Contract verified successfully on Etherscan!");
    console.log("🌐 View contract at: https://sepolia.etherscan.io/address/" + contractAddress);
    
  } catch (error) {
    console.error("❌ Verification failed:", error.message);
    
    if (error.message.includes("Already Verified")) {
      console.log("ℹ️  Contract is already verified on Etherscan");
      console.log("🌐 View contract at: https://sepolia.etherscan.io/address/" + contractAddress);
    } else if (error.message.includes("Contract not found")) {
      console.log("❌ Contract not found on the specified network");
      console.log("📝 Please ensure the contract is deployed on the correct network");
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

// Handle verification errors
main()
  .then(() => {
    console.log("\n✅ Verification process completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Verification failed:", error);
    process.exit(1);
  });
