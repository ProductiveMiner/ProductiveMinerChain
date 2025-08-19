const { ethers } = require('hardhat');

async function simpleDeploy() {
  console.log('🚀 Simple Contract Deployment...\n');

  try {
    // Get the deployer account
    const [deployer] = await ethers.getSigners();
    console.log('Deploying contracts with account:', deployer.address);
    
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log('Account balance:', ethers.formatEther(balance), 'ETH');

    // Deploy the contract
    const MINEDTokenStandalone = await ethers.getContractFactory('MINEDTokenStandalone');
    console.log('\n📦 Deploying MINEDTokenStandalone...');
    
    const contract = await MINEDTokenStandalone.deploy();
    await contract.waitForDeployment();
    
    const contractAddress = await contract.getAddress();
    console.log('✅ MINEDTokenStandalone deployed to:', contractAddress);
    
    // Basic verification
    const totalSupply = await contract.totalSupply();
    console.log('Total Supply:', ethers.formatEther(totalSupply), 'tokens');
    
    const name = await contract.name();
    const symbol = await contract.symbol();
    console.log('Name:', name);
    console.log('Symbol:', symbol);
    
    console.log('\n🌐 Etherscan URL: https://sepolia.etherscan.io/address/' + contractAddress);
    console.log('🔍 Verification Command: npx hardhat verify --network sepolia', contractAddress);
    
    // Save deployment info
    const deploymentInfo = {
      contractName: 'MINEDTokenStandalone',
      contractAddress: contractAddress,
      deployer: deployer.address,
      network: 'sepolia',
      totalSupply: ethers.formatEther(totalSupply),
      deploymentTimestamp: new Date().toISOString()
    };
    
    const fs = require('fs');
    fs.writeFileSync('deployment-info.json', JSON.stringify(deploymentInfo, null, 2));
    console.log('\n✅ Deployment info saved to deployment-info.json');
    
    return contractAddress;

  } catch (error) {
    console.error('❌ Deployment failed:', error);
    throw error;
  }
}

// Run deployment
simpleDeploy()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
