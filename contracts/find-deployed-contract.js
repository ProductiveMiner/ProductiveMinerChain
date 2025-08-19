const { ethers } = require('hardhat');
require('dotenv').config();

async function findDeployedContract() {
  console.log('🔍 Finding Deployed Contract...\n');

  try {
    // Connect to Sepolia testnet
    const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_URL || 'https://sepolia.infura.io/v3/3f2349b3beef4a0f86c7a8596fef5c00');
    
    // Deployer address from deployment info
    const deployerAddress = '0x6fF6dD4E5974B92d64C4068d83095AC1d7c1EC18';
    
    console.log('Deployer Address:', deployerAddress);
    
    // Get the latest block number
    const latestBlock = await provider.getBlockNumber();
    console.log('Latest Block:', latestBlock);
    
    // Check recent blocks for contract creation transactions
    console.log('\n🔍 Checking recent blocks for contract creation...');
    
    for (let blockNumber = latestBlock; blockNumber > latestBlock - 10; blockNumber--) {
      try {
        const block = await provider.getBlock(blockNumber, true);
        
        if (block && block.transactions) {
          for (const tx of block.transactions) {
            if (tx.from && tx.from.toLowerCase() === deployerAddress.toLowerCase()) {
              console.log(`\n📋 Found transaction in block ${blockNumber}:`);
              console.log('  Transaction Hash:', tx.hash);
              console.log('  From:', tx.from);
              console.log('  To:', tx.to);
              console.log('  Value:', ethers.formatEther(tx.value), 'ETH');
              console.log('  Gas Used:', tx.gasLimit.toString());
              
              // Check if this is a contract creation (to is null)
              if (!tx.to) {
                console.log('  ✅ This appears to be a contract creation transaction!');
                
                // Get the contract address from the transaction receipt
                const receipt = await provider.getTransactionReceipt(tx.hash);
                if (receipt && receipt.contractAddress) {
                  console.log('  🎉 Contract Address:', receipt.contractAddress);
                  console.log('  🌐 Etherscan URL: https://sepolia.etherscan.io/address/' + receipt.contractAddress);
                  
                  // Verify it's our contract by checking the total supply
                  try {
                    const contractABI = [
                      "function totalSupply() external view returns (uint256)",
                      "function name() external view returns (string)",
                      "function symbol() external view returns (string)"
                    ];
                    
                    const contract = new ethers.Contract(receipt.contractAddress, contractABI, provider);
                    const totalSupply = await contract.totalSupply();
                    const name = await contract.name();
                    const symbol = await contract.symbol();
                    
                    console.log('  📊 Contract Verification:');
                    console.log('    Name:', name);
                    console.log('    Symbol:', symbol);
                    console.log('    Total Supply:', ethers.formatEther(totalSupply), 'tokens');
                    
                    if (name === 'MINED Token' && symbol === 'MINED') {
                      console.log('  ✅ Confirmed: This is our MINEDTokenStandalone contract!');
                      
                      // Save the contract address
                      const fs = require('fs');
                      const deploymentInfo = JSON.parse(fs.readFileSync('deployment-info.json', 'utf8'));
                      deploymentInfo.contractAddress = receipt.contractAddress;
                      fs.writeFileSync('deployment-info.json', JSON.stringify(deploymentInfo, null, 2));
                      
                      console.log('\n🔍 Verification Command:');
                      console.log('npx hardhat verify --network sepolia', receipt.contractAddress);
                      
                      return receipt.contractAddress;
                    }
                  } catch (error) {
                    console.log('  ❌ Error verifying contract:', error.message);
                  }
                }
              }
            }
          }
        }
      } catch (error) {
        console.log(`Error checking block ${blockNumber}:`, error.message);
      }
    }
    
    console.log('\n❌ Contract creation transaction not found in recent blocks');
    console.log('Try checking more blocks or verify the deployment was successful');
    
  } catch (error) {
    console.error('❌ Error finding deployed contract:', error);
  }
}

// Run the search
findDeployedContract()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
