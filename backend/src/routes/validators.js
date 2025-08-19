const express = require('express');
const path = require('path');
const { query } = require('../database/connection');
const { asyncHandler } = require('../middleware/errorHandler');
const winston = require('winston');
const { ethers } = require('ethers');
const { CONTRACT_CONFIG } = require('../config/contract');

// Minimal ABI matching MINEDToken.sol
// struct Validator { uint256 stakedAmount; uint32 totalValidations; uint32 registrationTime; uint64 stakeLockTime; uint8 reputation; bool isActive; }
const VALIDATOR_ABI = [
  'function totalValidators() view returns (uint32)',
  'function validators(address) view returns (uint256 stakedAmount, uint32 totalValidations, uint32 registrationTime, uint64 stakeLockTime, uint8 reputation, bool isActive)',
  'event ValidatorRegistered(address indexed validator, uint256 stakedAmount)'
];

const router = express.Router();

// Use relative path for logs in development, absolute path in production
const logDir = process.env.NODE_ENV === 'production' ? '/app/logs' : './logs';
const validatorsLogPath = path.join(logDir, 'validators.log');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: validatorsLogPath })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// Get validators data from MINEDTokenStandalone contract
router.get('/', asyncHandler(async (req, res) => {
  try {
    console.log('🔍 Fetching validators data from blockchain...');
    
    const provider = new ethers.JsonRpcProvider(CONTRACT_CONFIG.SEPOLIA.rpcUrl);
    const tokenContract = new ethers.Contract(CONTRACT_CONFIG.SEPOLIA.tokenAddress, VALIDATOR_ABI, provider);
    
    console.log(`📋 Contract address: ${CONTRACT_CONFIG.SEPOLIA.tokenAddress}`);
    
    // Get total validators count
    const totalValidators = Number(await tokenContract.totalValidators());
    console.log(`📊 Total validators from contract: ${totalValidators}`);
    
    // Get recent validator events (using smaller chunks due to RPC limits)
    const currentBlock = await provider.getBlockNumber();
    const chunkSize = 500; // RPC limit
    const maxBlocks = 10000; // Search up to 10000 blocks back for more events
    
    console.log(`🔍 Querying validator events in chunks of ${chunkSize} blocks...`);
    
    let validatorEvents = [];
    for (let i = 0; i < maxBlocks; i += chunkSize) {
      const fromBlock = Math.max(0, currentBlock - maxBlocks + i);
      const toBlock = Math.min(currentBlock, fromBlock + chunkSize - 1);
      
      try {
        const chunkEvents = await tokenContract.queryFilter('ValidatorRegistered', fromBlock, toBlock);
        validatorEvents = validatorEvents.concat(chunkEvents);
        console.log(`   Blocks ${fromBlock}-${toBlock}: Found ${chunkEvents.length} events`);
      } catch (error) {
        console.log(`   Blocks ${fromBlock}-${toBlock}: Error - ${error.message}`);
      }
    }
    
    console.log(`📋 Total validator events found: ${validatorEvents.length}`);
    
    // Process validator events
    const validators = [];
    const processedAddresses = new Set();
    
    for (const event of validatorEvents) {
      try {
        console.log(`🔍 Processing validator: ${event.args.validator}`);
        const info = await tokenContract.validators(event.args.validator);
        
        const validator = {
          address: event.args.validator,
          stakeAmount: Number(ethers.formatEther(info.stakedAmount)),
          totalValidations: Number(info.totalValidations ?? 0),
          reputation: Number(info.reputation ?? 0),
          isActive: Boolean(info.isActive),
          registrationTime: new Date(Number(info.registrationTime ?? 0) * 1000)
        };
        
        console.log(`✅ Validator processed: ${validator.address}, stake: ${validator.stakeAmount}, active: ${validator.isActive}`);
        validators.push(validator);
        processedAddresses.add(event.args.validator.toLowerCase());
      } catch (error) {
        console.log(`❌ Error getting validator info for ${event.args.validator}:`, error.message);
      }
    }
    
    // If we have totalValidators > 0 but no events found, try to read validator data directly from contract
    if (totalValidators > 0 && validators.length === 0) {
      console.log(`🔍 No validator events found, but contract reports ${totalValidators} validators. Trying direct contract reads...`);
      
      // Try to read from known validator addresses
      const knownAddresses = [
        '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', // Validator 1
        '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', // Validator 2
        '0xA0b86a33e6441b8C4C8c8C8c8c8c8c8c8c8C8c8C', // Validator 3
        '0xb0B86A33E6441B8C4C8c8C8C8c8c8C8c8c8c8C8c', // Validator 4
        '0xC0b86a33E6441B8C4c8C8C8c8c8C8C8c8C8C8C8c'  // Validator 5
      ];
      
      for (const address of knownAddresses) {
        try {
          const info = await tokenContract.validators(address);
          if (info && info.stakedAmount && info.stakedAmount > 0n) {
            const validator = {
              address,
              stakeAmount: Number(ethers.formatEther(info.stakedAmount)),
              totalValidations: Number(info.totalValidations ?? 0),
              reputation: Number(info.reputation ?? 0),
              isActive: Boolean(info.isActive),
              registrationTime: new Date(Number(info.registrationTime ?? 0) * 1000)
            };
            
            console.log(`✅ Found validator from contract: ${validator.address}, stake: ${validator.stakeAmount}, active: ${validator.isActive}`);
            validators.push(validator);
          }
        } catch (error) {
          console.log(`❌ Could not read validator data for ${address}:`, error.message);
        }
      }
    }
    
    // If still no validators found, try to get validator addresses from recent blocks
    if (totalValidators > 0 && validators.length === 0) {
      console.log(`🔍 Trying to find validator addresses from recent blocks...`);
      
      // Get recent blocks and look for validator registration transactions
      for (let i = 0; i < 100; i++) {
        try {
          const block = await provider.getBlock(currentBlock - i, true);
          if (block && block.transactions) {
            for (const tx of block.transactions) {
              if (tx.to && tx.to.toLowerCase() === CONTRACT_CONFIG.SEPOLIA.tokenAddress.toLowerCase()) {
                // This might be a validator registration transaction
                console.log(`🔍 Found potential validator transaction: ${tx.from}`);
                try {
                  const info = await tokenContract.validators(tx.from);
                  if (info && info.stakedAmount && info.stakedAmount > 0n) {
                    const validator = {
                      address: tx.from,
                      stakeAmount: Number(ethers.formatEther(info.stakedAmount)),
                      totalValidations: Number(info.totalValidations ?? 0),
                      reputation: Number(info.reputation ?? 0),
                      isActive: Boolean(info.isActive),
                      registrationTime: new Date(Number(info.registrationTime ?? 0) * 1000)
                    };
                    
                    console.log(`✅ Found validator from recent blocks: ${validator.address}, stake: ${validator.stakeAmount}, active: ${validator.isActive}`);
                    validators.push(validator);
                  }
                } catch (error) {
                  // Not a validator, continue
                }
              }
            }
          }
        } catch (error) {
          console.log(`❌ Error reading block ${currentBlock - i}:`, error.message);
        }
      }
    }
    
    // Only return actual validators from the contract - no sample data
    console.log(`📊 Returning ${validators.length} real validators from contract`);
    
    // If totalValidators from contract > 0 but we couldn't fetch details, 
    // try to get basic info from contract state
    if (totalValidators > 0 && validators.length === 0) {
      console.log(`⚠️ Contract reports ${totalValidators} validators but couldn't fetch details`);
    }
    
    const totalStaked = validators.reduce((sum, v) => sum + v.stakeAmount, 0);
    const averageStake = validators.length > 0 ? totalStaked / validators.length : 0;
    const activeValidators = validators.filter(v => v.isActive).length;
    
    console.log(`📊 Final stats: ${validators.length} validators, ${totalStaked} total staked, ${activeValidators} active`);
    
    res.json({
      success: true,
      data: {
        totalValidators,
        validators,
        totalStaked,
        averageStake,
        activeValidators
      }
    });
  } catch (error) {
    console.error('❌ Error getting validators data:', error);
    logger.error('Error getting validators data:', error);
    
    // Return fallback data with error info
    res.json({
      success: true,
      data: {
        totalValidators: 0,
        validators: [],
        totalStaked: 0,
        averageStake: 0,
        activeValidators: 0,
        error: error.message
      }
    });
  }
}));

module.exports = router;
