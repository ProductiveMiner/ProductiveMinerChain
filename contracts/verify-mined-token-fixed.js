const { ethers } = require('hardhat');

async function verifyMINEDTokenFixed() {
  console.log('🔍 Verifying MINEDTokenFixed on Etherscan...\n');

  try {
    // Read deployment info
    const fs = require('fs');
    const deploymentInfo = JSON.parse(fs.readFileSync('MINEDTokenFixed-deployment.json', 'utf8'));
    
    const contractAddress = deploymentInfo.contractAddress;
    console.log('📋 Contract Address:', contractAddress);
    console.log('🌐 Network: Sepolia');
    
    // Verify the contract on Etherscan
    console.log('\n🔍 Running verification...');
    
    await hre.run("verify:verify", {
      address: contractAddress,
      contract: "contracts/MINEDTokenFixed.sol:MINEDTokenFixed",
      constructorArguments: [],
    });
    
    console.log('✅ Contract verified successfully on Etherscan!');
    console.log('🌐 Etherscan URL: https://sepolia.etherscan.io/address/' + contractAddress);
    
    // Display verification summary
    console.log('\n📊 Verification Summary:');
    console.log('Contract Name:', deploymentInfo.contractName);
    console.log('Total Supply:', deploymentInfo.totalSupply, 'MINED');
    console.log('Network:', deploymentInfo.network);
    console.log('Deployer:', deploymentInfo.deployer);
    
    console.log('\n🏦 Pool Distributions:');
    Object.entries(deploymentInfo.pools).forEach(([pool, amount]) => {
      console.log(`  ${pool}: ${amount} MINED`);
    });
    
    console.log('\n🔬 Features:');
    console.log(`  Work Types: ${deploymentInfo.features.workTypes}`);
    console.log(`  Validators: ${deploymentInfo.features.validators}`);
    console.log(`  Network Health: ${deploymentInfo.features.networkHealth}%`);
    console.log(`  System Compatible: ${deploymentInfo.features.systemCompatible ? 'Yes' : 'No'}`);
    
    console.log('\n🎉 MINEDTokenFixed is now live and verified on Sepolia!');
    console.log('📋 Ready for mathematical research and discovery!');
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
    
    if (error.message.includes('Already Verified')) {
      console.log('ℹ️ Contract is already verified on Etherscan');
      console.log('🌐 Etherscan URL: https://sepolia.etherscan.io/address/' + contractAddress);
    } else {
      throw error;
    }
  }
}

// Run verification
verifyMINEDTokenFixed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
