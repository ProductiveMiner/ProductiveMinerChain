const fs = require('fs');

try {
  const deploymentInfo = JSON.parse(fs.readFileSync('deployment-info.json', 'utf8'));
  console.log('📋 Deployment Information:');
  console.log('Contract Name:', deploymentInfo.contractName);
  console.log('Deployer:', deploymentInfo.deployer);
  console.log('Network:', deploymentInfo.network);
  console.log('Total Supply:', deploymentInfo.totalSupply, 'tokens');
  console.log('Initial Validators:', deploymentInfo.initialValidators);
  console.log('Staking Pool Balance:', deploymentInfo.stakingPoolBalance, 'tokens');
  console.log('Validator Reward Pool:', deploymentInfo.validatorRewardPool, 'tokens');
  
  if (deploymentInfo.contractAddress) {
    console.log('\n✅ Contract Address:', deploymentInfo.contractAddress);
    console.log('🌐 Etherscan URL: https://sepolia.etherscan.io/address/' + deploymentInfo.contractAddress);
    console.log('\n🔍 Verification Command:');
    console.log('npx hardhat verify --network sepolia', deploymentInfo.contractAddress);
  } else {
    console.log('\n❌ Contract address not found in deployment info');
    console.log('This might indicate the deployment failed or the address was not saved properly');
  }
} catch (error) {
  console.error('❌ Error reading deployment info:', error.message);
}
