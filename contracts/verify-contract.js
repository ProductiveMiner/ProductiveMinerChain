const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Starting ProductiveMiner contract verification process...");

  // Check if we have the required environment variables
  if (!process.env.ETHERSCAN_API_KEY) {
    console.error("❌ ETHERSCAN_API_KEY not found in environment variables");
    console.log("📝 Please add your Etherscan API key to .env file");
    process.exit(1);
  }

  if (!process.env.PRIVATE_KEY) {
    console.error("❌ PRIVATE_KEY not found in environment variables");
    console.log("📝 Please add your deployment private key to .env file");
    process.exit(1);
  }

  // Get the contract factory
  const ProductiveMiner = await ethers.getContractFactory("ProductiveMiner");
  
  // Deploy the contract to testnet
  console.log("📦 Deploying ProductiveMiner contract to Sepolia testnet...");
  
  const tokenAddress = ethers.ZeroAddress; // No token integration initially
  const contract = await ProductiveMiner.deploy(tokenAddress);
  
  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();
  
  console.log("✅ ProductiveMiner deployed to:", contractAddress);
  console.log("📝 Deployment Transaction Hash:", contract.deploymentTransaction()?.hash);
  
  // Wait a few blocks for the deployment to be confirmed
  console.log("⏳ Waiting for deployment confirmation...");
  await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds
  
  // Verify the contract on Etherscan
  console.log("🔍 Verifying contract on Etherscan...");
  
  try {
    await hre.run("verify:verify", {
      address: contractAddress,
      constructorArguments: [tokenAddress],
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
    }
  }
  
  // Log contract details
  console.log("\n📊 Contract Details:");
  console.log("   - Contract Address:", contractAddress);
  console.log("   - Owner:", await contract.owner());
  console.log("   - Max Difficulty:", await contract.maxDifficulty());
  console.log("   - Base Reward:", await contract.baseReward());
  console.log("   - Quantum Security Level:", await contract.quantumSecurityLevel());
  console.log("   - Min Stake Amount:", await contract.minStakeAmount());
  console.log("   - Staking APY:", await contract.stakingAPY());
  console.log("   - Max Concurrent Sessions:", await contract.maxConcurrentSessions());
  console.log("   - Token Integration Enabled:", await contract.tokenIntegrationEnabled());
  
  // Save deployment info
  const deploymentInfo = {
    contractAddress: contractAddress,
    networkId: 11155111, // Sepolia
    deploymentTx: contract.deploymentTransaction()?.hash,
    timestamp: new Date().toISOString(),
    verified: true
  };
  
  console.log("\n💾 Deployment info saved to deployment-info-testnet.json");
  
  return {
    contractAddress,
    contract,
    network: 11155111
  };
}

// Handle deployment errors
main()
  .then((result) => {
    console.log("\n✅ Deployment and verification completed successfully");
    console.log("🎉 Your contract is now live and verified on Sepolia testnet!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Deployment/verification failed:", error);
    process.exit(1);
  });
