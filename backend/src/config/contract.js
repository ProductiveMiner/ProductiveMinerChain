const fs = require('fs');
const path = require('path');

// Contract configuration for Sepolia
const CONTRACT_CONFIG = {
         SEPOLIA: {
         rpcUrl: 'https://eth-sepolia.g.alchemy.com/v2/EsD9nEjl3rvwE35tYtTZC',
         contractAddress: '0xB576afEfB7C466B0146ee81A9256a3DE1ACF2146', // ProductiveMinerFixed contract
         tokenAddress: '0x82134Fb8350C522F50282fEde9c0fAd5F76d80ae', // MINEDTokenAsymptotic contract
         chainId: 11155111,
         explorerUrl: 'https://sepolia.etherscan.io',
         tokenomics: {
           model: 'asymptotic',
           initialSupply: '1000000000000000000000000000', // 1 billion
           asymptoticTarget: '1500000000000000000000000000', // 1.5 billion
           multiChainReady: true
         }
       }
};

// Load contract ABI from backend directory
const contractABI = JSON.parse(fs.readFileSync(path.join(__dirname, '../contracts/ProductiveMinerFixed.json'), 'utf8')).abi;

module.exports = {
  CONTRACT_CONFIG,
  contractABI
};
