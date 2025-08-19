const { ethers } = require('ethers');

// Analyze the deployed contract state
async function analyzeContractState() {
  console.log('🔍 Analyzing Contract State on Sepolia\n');

  // Contract address on Sepolia
  const contractAddress = '0x0b65A7a2DF7C6DB7Fe9AF8D0731C3c9ee4094883';
  const rpcUrl = 'https://eth-sepolia.g.alchemy.com/v2/EsD9nEjl3rvwE35tYtTZC';
  
  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    
    // Load contract ABI (simplified for analysis)
    const contractABI = [
      "function state() view returns (uint128 totalBurned, uint128 totalResearchValue, uint64 lastEmissionBlock, uint32 totalValidators, uint32 nextDiscoveryId)",
      "function totalSupply() view returns (uint256)",
      "function nextSessionId() view returns (uint32)",
      "function nextPowResultId() view returns (uint32)",
      "function stakingPoolBalance() view returns (uint256)",
      "function validatorRewardPool() view returns (uint256)",
      "function totalStaked() view returns (uint256)",
      "function workTypes(uint8) view returns (uint16 difficultyMultiplier, uint16 baseReward, bool isActive)",
      "function discoveries(uint32) view returns (uint128 researchValue, uint64 timestamp, uint32 validationCount, uint16 complexity, uint8 significance, uint8 workType, address researcher, bool isValidated, bool isCollaborative, bool isFromPoW)",
      "function miningSessions(uint32) view returns (uint128 targetHash, uint64 startTime, uint64 endTime, uint32 nonce, uint16 difficulty, uint8 workType, address miner, bool isCompleted, bool autoValidationRequested)",
      "function powResults(uint32) view returns (uint128 hash, uint64 timestamp, uint32 sessionId, uint16 complexity, uint8 significance, address miner, bool isValid)"
    ];
    
    const contract = new ethers.Contract(contractAddress, contractABI, provider);
    
    console.log('📊 Contract State Analysis:');
    
    // Get current state
    const state = await contract.state();
    console.log(`Total Burned: ${ethers.formatEther(state.totalBurned)} MINED`);
    console.log(`Total Research Value: ${ethers.formatEther(state.totalResearchValue)}`);
    console.log(`Last Emission Block: ${state.lastEmissionBlock}`);
    console.log(`Total Validators: ${state.totalValidators}`);
    console.log(`Next Discovery ID: ${state.nextDiscoveryId}`);
    console.log('');
    
    // Get total supply
    const totalSupply = await contract.totalSupply();
    console.log(`Total Supply: ${ethers.formatEther(totalSupply)} MINED`);
    console.log('');
    
    // Get session and result counts
    const nextSessionId = await contract.nextSessionId();
    const nextPowResultId = await contract.nextPowResultId();
    console.log(`Total Mining Sessions: ${nextSessionId}`);
    console.log(`Total PoW Results: ${nextPowResultId}`);
    console.log('');
    
    // Get staking info
    const stakingPoolBalance = await contract.stakingPoolBalance();
    const validatorRewardPool = await contract.validatorRewardPool();
    const totalStaked = await contract.totalStaked();
    console.log(`Staking Pool Balance: ${ethers.formatEther(stakingPoolBalance)} MINED`);
    console.log(`Validator Reward Pool: ${ethers.formatEther(validatorRewardPool)} MINED`);
    console.log(`Total Staked: ${ethers.formatEther(totalStaked)} MINED`);
    console.log('');
    
    // Analyze work types
    console.log('📋 Work Type Analysis:');
    for (let i = 0; i <= 24; i++) {
      try {
        const workType = await contract.workTypes(i);
        if (workType.isActive) {
          console.log(`Work Type ${i}: Base Reward = ${workType.baseReward}, Difficulty Multiplier = ${workType.difficultyMultiplier}`);
        }
      } catch (error) {
        // Work type doesn't exist
      }
    }
    console.log('');
    
    // Analyze recent discoveries
    console.log('📋 Recent Discoveries Analysis:');
    const discoveryCount = Math.min(Number(state.nextDiscoveryId), 10);
    for (let i = 0; i < discoveryCount; i++) {
      try {
        const discovery = await contract.discoveries(i);
        console.log(`Discovery ${i}:`);
        console.log(`  Research Value: ${ethers.formatEther(discovery.researchValue)}`);
        console.log(`  Complexity: ${discovery.complexity}`);
        console.log(`  Significance: ${discovery.significance}`);
        console.log(`  Work Type: ${discovery.workType}`);
        console.log(`  From PoW: ${discovery.isFromPoW}`);
        console.log(`  Validated: ${discovery.isValidated}`);
        console.log('');
      } catch (error) {
        console.log(`Discovery ${i}: Error reading - ${error.message}`);
      }
    }
    
    // Analyze recent mining sessions
    console.log('📋 Recent Mining Sessions Analysis:');
    const sessionCount = Math.min(Number(nextSessionId), 10);
    for (let i = 0; i < sessionCount; i++) {
      try {
        const session = await contract.miningSessions(i);
        console.log(`Session ${i}:`);
        console.log(`  Work Type: ${session.workType}`);
        console.log(`  Difficulty: ${session.difficulty}`);
        console.log(`  Completed: ${session.isCompleted}`);
        console.log(`  Miner: ${session.miner}`);
        console.log('');
      } catch (error) {
        console.log(`Session ${i}: Error reading - ${error.message}`);
      }
    }
    
    // Analyze recent PoW results
    console.log('📋 Recent PoW Results Analysis:');
    const resultCount = Math.min(Number(nextPowResultId), 10);
    for (let i = 0; i < resultCount; i++) {
      try {
        const result = await contract.powResults(i);
        console.log(`PoW Result ${i}:`);
        console.log(`  Complexity: ${result.complexity}`);
        console.log(`  Significance: ${result.significance}`);
        console.log(`  Miner: ${result.miner}`);
        console.log(`  Valid: ${result.isValid}`);
        console.log('');
      } catch (error) {
        console.log(`PoW Result ${i}: Error reading - ${error.message}`);
      }
    }
    
    // Calculate current emission rate
    console.log('💰 Current Emission Analysis:');
    const currentBlock = await provider.getBlockNumber();
    const blocksSinceLastEmission = currentBlock - Number(state.lastEmissionBlock);
    console.log(`Current Block: ${currentBlock}`);
    console.log(`Blocks Since Last Emission: ${blocksSinceLastEmission}`);
    
    // Simulate current emission rate
    const INITIAL_EMISSION_RATE = 1000;
    const DECAY_CONSTANT = 1;
    const timeFactor = blocksSinceLastEmission * DECAY_CONSTANT / 10000;
    let emissionDecay = INITIAL_EMISSION_RATE;
    
    for (let i = 0; i < timeFactor && i < 100; i++) {
      emissionDecay = emissionDecay * 9999 / 10000;
    }
    
    console.log(`Current Emission Rate: ${emissionDecay.toFixed(2)} tokens/block`);
    console.log(`Emission Decay Factor: ${(emissionDecay/INITIAL_EMISSION_RATE*100).toFixed(2)}% of original`);
    console.log('');
    
    // Identify potential issues
    console.log('🚨 POTENTIAL ISSUES IDENTIFIED:');
    
    if (emissionDecay < 100) {
      console.log('1. ❌ Emission rate is too low - rewards will be minimal');
    }
    
    if (blocksSinceLastEmission > 10000) {
      console.log('2. ❌ Too many blocks since last emission - decay is severe');
    }
    
    if (Number(state.nextDiscoveryId) === 0) {
      console.log('3. ❌ No discoveries found - PoW system may not be working');
    }
    
    if (Number(nextPowResultId) === 0) {
      console.log('4. ❌ No PoW results found - mining may not be active');
    }
    
    console.log('');
    console.log('🔧 RECOMMENDATIONS:');
    console.log('1. Reset lastEmissionBlock to current block to restore emission rate');
    console.log('2. Increase initial emission rate for better rewards');
    console.log('3. Reduce decay constant to slow down emission reduction');
    console.log('4. Add minimum reward guarantees');
    console.log('5. Test PoW submission with current parameters');
    
  } catch (error) {
    console.error('❌ Error analyzing contract:', error.message);
  }
}

// Run the analysis
analyzeContractState().catch(console.error);
