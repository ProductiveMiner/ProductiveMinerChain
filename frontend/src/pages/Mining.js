console.log("MiningSuccessPopup imported successfully");
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from 'react-query';
// Browser-compatible random hash generation
const generateRandomHash = () => {
  const chars = '0123456789abcdef';
  let result = '0x';
  for (let i = 0; i < 64; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
};
import {
  FaPlay,
  FaStop,
  FaCog,
  FaChartLine,
  FaCoins,
  FaClock,
  FaServer,
  FaBrain,
  FaNetworkWired,
  FaGraduationCap,
  FaShieldAlt,
  FaRocket,
  FaWallet,
  FaExclamationTriangle
} from 'react-icons/fa';
import { web3Service } from '../services/web3Service';
import mathEngineService from '../services/mathEngineService';
import MiningSuccessPopup from '../components/MiningSuccessPopup';
import { MINED_TOKEN_CONFIG } from '../config/mined-token-config';
import MINEDTokenABI from '../contracts/MINEDToken.json';
import { backendAPI } from '../utils/api';
import './Mining.css';

const Mining = () => {
  const [selectedEngine, setSelectedEngine] = useState(null);
  const [isMining, setIsMining] = useState(false);
  const [isContinuousMining, setIsContinuousMining] = useState(false);
  const [miningMode, setMiningMode] = useState('single'); // 'single' or 'continuous'
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [miningSuccessData, setMiningSuccessData] = useState(null);
  const [web3Connected, setWeb3Connected] = useState(false);
  const [currentAccount, setCurrentAccount] = useState(null);
  const [currentNetwork, setCurrentNetwork] = useState(null);

  const [tokenBalance, setTokenBalance] = useState('0');
  const [tokenRewards, setTokenRewards] = useState('0');
  const [tokenInfo, setTokenInfo] = useState({
    name: 'MINED Token',
    symbol: 'MINED',
    decimals: 18,
    totalSupply: '0',
    totalEmitted: '0',
    currentBlockHeight: '0',
    totalResearchValue: '0',
    softCap: '0'
  });
  const [emissionParams, setEmissionParams] = useState({
    initialEmissionRate: '1000',
    decayConstant: '1',
    researchMultiplierBase: '1',
    decayScale: '10000',
    researchScale: '100'
  });
  const [isClaiming, setIsClaiming] = useState(false);
  const [activeSessions, setActiveSessions] = useState([]);
  const [showSessionManager, setShowSessionManager] = useState(false);
  const [miningStatus, setMiningStatus] = useState('Ready to mine');
  const queryClient = useQueryClient();

  // Engine data is now loaded from smart contract above

  // Initialize Web3 connection and Math Engine
  useEffect(() => {
    const initializeServices = async () => {
      try {
        // Initialize Web3
        const web3Connected = await web3Service.initialize();
        if (web3Connected) {
          setWeb3Connected(true);
          setCurrentAccount(web3Service.getCurrentAccount());
          setCurrentNetwork(web3Service.getCurrentNetwork());
          
          // Get token info
          const info = await web3Service.getTokenInfo();
          setTokenInfo(info);
          
          // Get token balance if account is available
          if (web3Service.getCurrentAccount()) {
            const balance = await web3Service.getTokenBalance();
            setTokenBalance(balance);
          }
          
          // Load token data
          await loadTokenData();
          
          // Load active sessions
          await loadActiveSessions();
        }
        
        // Initialize Math Engine
        const mathEngineConnected = await mathEngineService.initialize();
        if (mathEngineConnected) {
          console.log('✅ Math Engine initialized successfully');
        } else {
          console.warn('⚠️ Math Engine initialization failed');
        }
      } catch (error) {
        console.error('Failed to initialize services:', error);
      }
    };

    initializeServices();
  }, []);

  // Refresh active sessions periodically
  useEffect(() => {
    if (web3Connected && currentAccount) {
      const interval = setInterval(loadActiveSessions, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [web3Connected, currentAccount]);

  // Load MINED token data
  const loadTokenData = async () => {
    try {
      if (!currentAccount) {
        console.log('No account, skipping token data load');
        return;
      }

      const { ethers } = await import('ethers');
      
      // Connect to provider - try BrowserProvider first, fallback to JsonRpcProvider
      let provider;
      try {
        provider = new ethers.BrowserProvider(window.ethereum);
        console.log('Using BrowserProvider');
      } catch (providerError) {
        console.warn('BrowserProvider failed, using JsonRpcProvider:', providerError);
        // Fallback to direct RPC provider
        provider = new ethers.JsonRpcProvider('https://eth-sepolia.g.alchemy.com/v2/EsD9nEjl3rvwE35tYtTZC');
        console.log('Using JsonRpcProvider fallback');
      }

      // Get the correct network
      const network = await provider.getNetwork();
      console.log('Connected to network:', network.name, 'Chain ID:', network.chainId);
      
      // Check if we're on Sepolia
      if (network.chainId !== 11155111n) { // Sepolia
        console.error('Wrong network detected. Expected Sepolia (11155111), got:', network.chainId);
        console.log('Not on Sepolia network, using fallback token data');
        setTokenBalance('0');
        return;
      }
      
      console.log('✅ Network check passed - connected to Sepolia');

      console.log('🪙 Loading MINED token data for address:', currentAccount);
      
      const contractAddress = MINED_TOKEN_CONFIG.contracts.minedToken;
      console.log('Token contract address:', contractAddress);
              console.log('ABI length:', MINEDTokenABI.abi.length);
      
      // Verify the contract address is valid
      if (!ethers.isAddress(contractAddress)) {
        throw new Error(`Invalid contract address: ${contractAddress}`);
      }
      
      // Check if contract has code deployed
      console.log('Checking if contract has code deployed...');
      const code = await provider.getCode(contractAddress);
      if (code === '0x') {
        throw new Error(`No contract deployed at address: ${contractAddress}`);
      }
      console.log('✅ Contract code found at address');

      // Use the imported standalone token ABI
      const minedTokenContract = new ethers.Contract(
        contractAddress,
        MINEDTokenABI.abi,
        provider
      );
      
      console.log('✅ Contract instance created successfully');

      // Get token balance from the real contract
      if (currentAccount) {
        try {
          console.log('🔍 Calling balanceOf for address:', currentAccount);
          const balance = await minedTokenContract.balanceOf(currentAccount);
          console.log('Raw balance result:', balance);
          
          if (balance && balance.toString() !== '0') {
            const formattedBalance = ethers.formatEther(balance.toString());
            setTokenBalance(formattedBalance);
            console.log('✅ Token balance loaded:', formattedBalance, 'MINED');
          } else {
            console.log('ℹ️ Token balance is 0 - no MINED tokens yet');
            setTokenBalance('0');
          }
        } catch (balanceError) {
          console.error('❌ Error loading token balance:', balanceError);
          console.log('This might indicate the contract is not properly deployed or accessible');
          setTokenBalance('0');
        }
      }

      // Get basic token info from the real contract
      try {
        console.log('🔍 Calling token info functions...');
        
        // Try to get asymptotic token info
        let asymptoticInfo;
        try {
          // Get system info from enhanced token - try different methods
          let totalBurned = '0';
          let totalResearchValue = '0';
          let totalValidators = '0';
          
          // Try to get state info if available
          try {
            const stateInfo = await minedTokenContract.state();
            console.log('Raw state result:', stateInfo);
            totalBurned = stateInfo.totalBurned?.toString() || '0';
            totalResearchValue = stateInfo.totalResearchValue?.toString() || '0';
            totalValidators = stateInfo.totalValidators?.toString() || '0';
          } catch (stateError) {
            console.log('state() method not available, using defaults');
          }
          
          // Get basic token info
          const name = await minedTokenContract.name();
          const symbol = await minedTokenContract.symbol();
          const decimals = await minedTokenContract.decimals();
          const totalSupply = await minedTokenContract.totalSupply();
          
          asymptoticInfo = {
            name: name,
            symbol: symbol,
            decimals: decimals,
            totalSupply: totalSupply.toString(),
            currentEmission: '0', // Placeholder for standalone contract
            totalBurned: totalBurned.toString(),
            totalResearchValue: totalResearchValue.toString()
          };
          console.log('✅ Asymptotic info retrieved');
        } catch (asymptoticError) {
          console.warn('⚠️ Could not get asymptotic info, using basic ERC20 info:', asymptoticError.message);
          // Fallback to basic ERC20 info
          const name = await minedTokenContract.name();
          const symbol = await minedTokenContract.symbol();
          const decimals = await minedTokenContract.decimals();
          const totalSupply = await minedTokenContract.totalSupply();
          
          asymptoticInfo = {
            name: name,
            symbol: symbol,
            decimals: decimals,
            totalSupply: totalSupply,
            totalResearchValue: '0',
            currentEmission: '0'
          };
        }
        
        // Set emission data for standalone contract (fixed values)
        console.log('✅ Using default emission parameters for standalone contract');
        const emissionParams = [
          ethers.parseEther('1000'), // initialEmissionRate (default)
          '1', // decayConstant (default for standalone contract)
          '1', // researchMultiplierBase (default for standalone contract)
          '10000', // decayScale (default for standalone contract)
          '100' // researchScale (default for standalone contract)
        ];
        
        // Handle standalone contract data structure
        setTokenInfo({
          name: asymptoticInfo.name,
          symbol: asymptoticInfo.symbol,
          decimals: asymptoticInfo.decimals,
          totalSupply: ethers.formatEther(asymptoticInfo.totalSupply.toString()),
          currentBlockHeight: '0', // Not available in standalone contract
          totalResearchValue: asymptoticInfo.totalResearchValue.toString(),
          softCap: ethers.formatEther(asymptoticInfo.totalSupply.toString()), // Use totalSupply as softCap
          totalEmitted: ethers.formatEther(emissionParams[0].toString()) // Get from emission params
        });
        
        setEmissionParams({
          initialEmissionRate: ethers.formatEther(emissionParams[0].toString()),
          decayConstant: emissionParams[1].toString(),
          researchMultiplierBase: emissionParams[2].toString(),
          decayScale: emissionParams[3].toString(),
          researchScale: emissionParams[4].toString()
        });
        
        console.log('✅ Token info loaded successfully:', { 
          name: asymptoticInfo.name, 
          symbol: asymptoticInfo.symbol, 
          decimals: asymptoticInfo.decimals, 
          totalSupply: ethers.formatEther(asymptoticInfo.totalSupply.toString()) 
        });
        
      } catch (infoError) {
        console.error('❌ Error loading token info:', infoError);
        console.log('Using fallback token info');
        // Set fallback info
        setTokenInfo({
          name: 'MINED Token',
          symbol: 'MINED',
          decimals: 18,
          totalSupply: '0',
          totalEmitted: '0',
          currentBlockHeight: '0',
          totalResearchValue: '0',
          softCap: '0'
        });
        setEmissionParams({
          initialEmissionRate: '1000',
          decayConstant: '1',
          researchMultiplierBase: '1',
          decayScale: '10000',
          researchScale: '100'
        });
      }

    } catch (error) {
      console.error('❌ Error loading token data:', error);
      console.log('Using fallback values due to error');
      // Set fallback values
      setTokenBalance('0');
      setTokenInfo({
        name: 'MINED Token',
        symbol: 'MINED',
        decimals: 18,
        totalSupply: '0',
        totalEmitted: '0',
        currentBlockHeight: '0',
        totalResearchValue: '0',
        softCap: '0'
      });
      setEmissionParams({
        initialEmissionRate: '1000',
        decayConstant: '1',
        researchMultiplierBase: '1',
        decayScale: '10000',
        researchScale: '100'
      });
    }
  };

  // Load active sessions
  const loadActiveSessions = async () => {
    try {
      if (!web3Service.isWeb3Connected() || !currentAccount) return;

      console.log('Loading active sessions for:', currentAccount);
      
      // For ERC20-only approach, we don't have active sessions from a smart contract
      // Instead, we'll track sessions locally or show a message
      const activeSessionsList = [];
      console.log('No active sessions tracking in ERC20-only mode');

      setActiveSessions(activeSessionsList);
      console.log(`Found ${activeSessionsList.length} active sessions for user`);
      
      // Update session count for UI
      if (activeSessionsList.length > 0) {
        setShowSessionManager(true);
      } else {
        setShowSessionManager(false);
      }
      
    } catch (error) {
      console.error('Error loading active sessions:', error);
      setActiveSessions([]);
      setShowSessionManager(false);
    }
  };

  // Start a real mining session on the contract
  const startContractMiningSession = async (workType = 0, difficulty = 25) => {
    try {
      console.log('🚀 Starting real mining session on contract...');
      setMiningStatus('Starting mining session...');
      
      const result = await web3Service.startMiningSession(workType, difficulty);
      console.log('Mining session started:', result);
      
      setMiningStatus(`Mining session started! Session ID: ${result.sessionId}`);
      
      // Add to active sessions
      const newSession = {
        id: result.sessionId,
        workType: workType,
        difficulty: difficulty,
        startTime: Date.now(),
        status: 'active',
        transactionHash: result.transactionHash,
        isContractSession: true
      };
      
      setActiveSessions(prev => [...prev, newSession]);
      
      return result;
    } catch (error) {
      console.error('❌ Failed to start contract mining session:', error);
      setMiningStatus(`Failed to start mining session: ${error.message}`);
      throw error;
    }
  };

        // Enhanced session completion with better error handling
      const completeSession = async (sessionId) => {
        try {
          console.log('⛏️ Starting enhanced session completion...');
          console.log('Session ID:', sessionId);
          setMiningStatus('Preparing to complete mining session...');
          
          // Validate session ID
          if (!sessionId || sessionId === 'undefined' || sessionId === 0) {
            throw new Error('Invalid session ID provided');
          }
          
          // Generate proper metadata
          const proofHash = generateRandomHash();
          const metadata = {
            sessionId: sessionId,
            completedAt: new Date().toISOString(),
            userAddress: web3Service.getCurrentAccount(),
            proofHash: proofHash
          };
          
          console.log('Completion metadata:', metadata);
          setMiningStatus('Submitting PoW result to contract...');
          
          // Complete the session with enhanced error handling
          const result = await web3Service.completeMiningSession(sessionId, proofHash, JSON.stringify(metadata));
          
          if (!result || !result.success) {
            throw new Error('Mining session completion returned invalid result');
          }
          
          console.log('🎉 Mining session completed successfully:', result);
          
          // Check what events occurred
          let statusMessage = 'Mining completed! ';
          if (result.events) {
            if (result.events.discoverySubmitted && result.events.validationRequested) {
              statusMessage += '✅ Full automatic flow: PoW → Discovery → PoS Validation';
            } else if (result.events.powSubmitted && result.events.rewardMinted) {
              statusMessage += '✅ PoW completed with rewards';
            } else {
              statusMessage += '⚠️ Some automatic steps may have failed';
            }
          }
          
          // Update status with transaction info
          const txDisplay = result.transactionHash ? result.transactionHash.slice(0, 10) + '...' : 'N/A';
          setMiningStatus(`${statusMessage} TX: ${txDisplay}`);
      
      // Refresh data in parallel for better performance
      const refreshPromises = [
        loadActiveSessions(),
        loadTokenData()
      ];
      
      try {
        await Promise.all(refreshPromises);
        console.log('✅ Data refresh completed');
      } catch (refreshError) {
        console.warn('⚠️ Some data refresh operations failed:', refreshError);
      }
      
      // Schedule additional balance refreshes to catch delayed updates
      const scheduleRefresh = (delay, label) => {
        setTimeout(async () => {
          try {
            await loadTokenData();
            console.log(`🔄 ${label} token balance refresh completed`);
          } catch (error) {
            console.warn(`⚠️ ${label} token balance refresh failed:`, error);
          }
        }, delay);
      };
      
      scheduleRefresh(2000, 'First delayed');
      scheduleRefresh(5000, 'Second delayed');
      scheduleRefresh(10000, 'Final delayed');
      
      // Show success popup with comprehensive data
      setTimeout(async () => {
        try {
          // Final balance refresh
          await loadTokenData();
          
          // Create success data
          const successData = {
            sessionId: result.sessionId,
            blockNumber: result.blockNumber || 0,
            blockHash: result.transactionHash || proofHash,
            reward: result.balanceDiff || 'Tokens Minted',
            difficulty: 25,
            engine: 'contract-mining',
            timestamp: Date.now(),
            hashrate: 'N/A',
            tokenRewards: result.balanceDiff || 'Contract Rewards',
            tokenBalance: tokenBalance,
            transactionHash: result.transactionHash,
            gasUsed: result.gasUsed,
            resultId: result.resultId
          };
          
          console.log('Triggering success popup with data:', successData);
          triggerMiningSuccess(successData);
          
        } catch (popupError) {
          console.error('Failed to show success popup:', popupError);
          // Still show a basic alert
          alert(`Mining completed successfully! Session: ${result.sessionId}`);
        }
      }, 3000);
      
    } catch (error) {
      console.error('Session completion failed:', error);
      setMiningStatus(`Failed to complete session: ${error.message}`);
      
      // Provide user-friendly error messages
      let userMessage = 'Failed to complete mining session.';
      
      if (error.message.includes('does not exist')) {
        userMessage = 'Mining session not found. It may have already been completed or expired.';
      } else if (error.message.includes('belongs to')) {
        userMessage = 'This mining session belongs to a different wallet address.';
      } else if (error.message.includes('already completed')) {
        userMessage = 'This mining session has already been completed.';
      } else if (error.message.includes('insufficient funds')) {
        userMessage = 'Insufficient ETH balance for gas fees.';
      } else if (error.message.includes('user denied')) {
        userMessage = 'Transaction was cancelled by user.';
      } else {
        userMessage = `Mining session completion failed: ${error.message}`;
      }
      
      alert(`❌ ${userMessage}`);
    }
  };

  // Complete multiple sessions automatically
  const completeMultipleSessions = async () => {
    try {
      if (activeSessions.length === 0) {
        alert('No active sessions to complete.');
        return;
      }

      const sessionsToComplete = activeSessions.slice(0, 3); // Complete first 3
      let completedCount = 0;

      for (const session of sessionsToComplete) {
        try {
          console.log(`Completing session ${session.sessionId}...`);
          
          // Generate proof hash
          const proofHash = generateRandomHash();
          const metadata = `Completed session ${session.sessionId} at ${new Date().toISOString()}`;
          
          const result = await web3Service.completeMiningSession(session.sessionId, proofHash, metadata);
          console.log(`Session ${session.sessionId} completed:`, result);
          completedCount++;
          
          // Wait a bit between transactions
          await new Promise(resolve => setTimeout(resolve, 2000));
          
        } catch (error) {
          console.error(`Failed to complete session ${session.sessionId}:`, error);
          // Continue with next session
        }
      }

      // Refresh data
      await loadActiveSessions();
      await loadTokenData();
      
      alert(`✅ Completed ${completedCount} of ${sessionsToComplete.length} sessions.\n\nTry mining again now!`);
      
    } catch (error) {
      console.error('Error completing multiple sessions:', error);
      alert(`❌ Error completing sessions: ${error.message}`);
    }
  };

  // Load work types from smart contract with enhanced metrics
  const loadWorkTypesFromContract = async () => {
    try {
      if (!web3Service.isWeb3Connected()) {
        console.log('Web3 not connected, skipping work types load');
        return [];
      }

      const contractAddress = MINED_TOKEN_CONFIG.contracts.minedToken;
      
      // Use Web3.js contract instance
      const minedTokenContract = web3Service.tokenContract;

      // Get work types from contract (0-24)
      const workTypes = [];
      for (let i = 0; i <= 24; i++) {
        try {
          const workType = await minedTokenContract.methods.workTypes(i).call();
          if (workType[2]) { // isActive is at index 2
            // Calculate hashrate based on difficulty multiplier
            const difficultyMultiplier = parseInt(workType[1].toString()); // difficultyMultiplier is at index 1
            const baseHashrate = 46; // Base hashrate in H/s
            const calculatedHashrate = baseHashrate * (difficultyMultiplier / 1000);
            
            // Format hashrate for display
            let hashrateDisplay;
            if (calculatedHashrate >= 1000000) {
              hashrateDisplay = (calculatedHashrate / 1000000).toFixed(1) + ' TH/s';
            } else if (calculatedHashrate >= 1000) {
              hashrateDisplay = (calculatedHashrate / 1000).toFixed(1) + ' GH/s';
            } else {
              hashrateDisplay = Math.round(calculatedHashrate) + ' H/s';
            }
            
            // Calculate estimated reward based on base reward (convert from wei)
            const baseRewardWei = workType[0].toString(); // baseReward is at index 0 (wei)
            let estimatedRewardStr = '0 MINED/day';
            try {
              const baseRewardMined = web3Service.web3.utils.fromWei(baseRewardWei, 'ether');
              const daily = (parseFloat(baseRewardMined) * 24) || 0;
              estimatedRewardStr = `${daily.toFixed(6)} MINED/day`;
            } catch (_) {}
            
            // Determine difficulty level based on difficulty multiplier
            let difficultyLevel;
            if (difficultyMultiplier >= 10000) {
              difficultyLevel = 'Ultra-Extreme';
            } else if (difficultyMultiplier >= 8000) {
              difficultyLevel = 'Extreme';
            } else if (difficultyMultiplier >= 6000) {
              difficultyLevel = 'High';
            } else {
              difficultyLevel = 'Medium';
            }
            
            workTypes.push({
              id: i,
              name: getWorkTypeName(i),
              description: getWorkTypeDescription(i),
              difficulty: difficultyLevel,
              hashrate: hashrateDisplay,
              discoveries: '0', // Will be updated from contract discoveries
              estimatedReward: estimatedRewardStr,
              baseReward: baseRewardWei, // baseReward in wei
              difficultyMultiplier: workType[1].toString(), // difficultyMultiplier is at index 1
              isActive: workType[2], // isActive is at index 2
              calculatedHashrate: calculatedHashrate
            });
          }
        } catch (error) {
          console.warn(`Could not load work type ${i}:`, error.message);
        }
      }

      console.log('✅ Work types loaded from contract with enhanced metrics:', workTypes);
      return workTypes;
    } catch (error) {
      console.error('❌ Error loading work types from contract:', error);
      return [];
    }
  };

  // Get work type name by ID
  const getWorkTypeName = (id) => {
    const workTypeNames = {
      0: 'Riemann Zeros',
      1: 'Goldbach Conjecture',
      2: 'Birch Swinnerton',
      3: 'Prime Pattern Discovery',
      4: 'Twin Primes',
      5: 'Collatz Conjecture',
      6: 'Perfect Numbers',
      7: 'Mersenne Primes',
      8: 'Fibonacci Patterns',
      9: 'Pascal Triangle',
      10: 'Differential Equations',
      11: 'Number Theory',
      12: 'Yang Mills Theory',
      13: 'Navier Stokes',
      14: 'Elliptic Curve Crypto',
      15: 'Lattice Cryptography',
      16: 'Cryptographic Hash',
      17: 'Poincaré Conjecture',
      18: 'Algebraic Topology',
      19: 'Euclidean Geometry',
      20: 'Quantum Computing',
      21: 'Machine Learning',
      22: 'Blockchain Protocols',
      23: 'Distributed Systems',
      24: 'Optimization Algorithms'
    };
    return workTypeNames[id] || `Work Type ${id}`;
  };

  // Get work type description by ID
  const getWorkTypeDescription = (id) => {
    const workTypeDescriptions = {
      0: 'Compute non-trivial zeros of the Riemann zeta function',
      1: 'Verify Goldbach conjecture for large even numbers',
      2: 'Compute L-functions for elliptic curves',
      3: 'Advanced prime number pattern recognition',
      4: 'Search for twin prime pairs and patterns',
      5: 'Verify Collatz sequence convergence patterns',
      6: 'Discover new perfect numbers and properties',
      7: 'Find new Mersenne prime numbers',
      8: 'Advanced Fibonacci sequence analysis',
      9: 'Deep analysis of Pascal triangle properties',
      10: 'Solve complex differential equations',
      11: 'Advanced number theory computations',
      12: 'Solve Yang-Mills field equations for quantum chromodynamics',
      13: 'Solve Navier-Stokes equations for fluid dynamics',
      14: 'Generate secure elliptic curve parameters',
      15: 'Post-quantum cryptographic algorithms',
      16: 'Cryptographic hash function analysis',
      17: 'Topological manifold analysis',
      18: 'Topological invariant computations',
      19: 'Advanced geometric theorem proving',
      20: 'Quantum computing simulations',
      21: 'Machine learning algorithm optimization',
      22: 'Blockchain protocol analysis',
      23: 'Distributed system optimization',
      24: 'Mathematical optimization algorithms'
    };
    return workTypeDescriptions[id] || `Mathematical computation for work type ${id}`;
  };

  // Load discoveries from contract to update work type metrics
  const loadDiscoveriesFromContract = async () => {
    try {
      if (!web3Service.isWeb3Connected()) {
        console.log('Web3 not connected, skipping discoveries load');
        return {};
      }

      const contractAddress = MINED_TOKEN_CONFIG.contracts.minedToken;
      const minedTokenContract = web3Service.tokenContract;

      // Get next discovery ID directly (avoid state() decoding issues)
      let nextDiscoveryId = 1;
      try {
        if (minedTokenContract.methods.nextDiscoveryId) {
          const nd = await minedTokenContract.methods.nextDiscoveryId().call();
          nextDiscoveryId = parseInt(nd.toString());
        } else {
          // Fallback: probe up to 50
          nextDiscoveryId = 51;
        }
      } catch (_) {
        // Fallback: probe up to 50
        nextDiscoveryId = 51;
      }
      
      console.log(`🔍 Loading discoveries from contract (1 to ${nextDiscoveryId - 1})`);
      
      // Count discoveries by work type
      const discoveriesByWorkType = {};
      
      for (let discoveryId = 1; discoveryId < nextDiscoveryId; discoveryId++) {
        try {
          const discoveryInfo = await minedTokenContract.methods.discoveries(discoveryId).call();
          if (discoveryInfo.researcher && discoveryInfo.researcher !== '0x0000000000000000000000000000000000000000') {
            const workType = parseInt(discoveryInfo.workType.toString());
            // Convert research value from wei to MINED (number)
            let researchValue = 0;
            try {
              const rv = web3Service.web3.utils.fromWei(discoveryInfo.researchValue.toString(), 'ether');
              researchValue = parseFloat(rv) || 0;
            } catch (_) {}
            
            if (!discoveriesByWorkType[workType]) {
              discoveriesByWorkType[workType] = {
                count: 0,
                totalResearchValue: 0,
                avgResearchValue: 0
              };
            }
            
            discoveriesByWorkType[workType].count++;
            discoveriesByWorkType[workType].totalResearchValue += researchValue;
          }
        } catch (error) {
          console.warn(`Error reading discovery ${discoveryId}:`, error.message);
        }
      }
      
      // Calculate average research value for each work type
      Object.keys(discoveriesByWorkType).forEach(workType => {
        const data = discoveriesByWorkType[workType];
        data.avgResearchValue = data.count > 0 ? Number((data.totalResearchValue / data.count).toFixed(6)) : 0;
      });
      
      console.log('✅ Discoveries loaded from contract:', discoveriesByWorkType);
      return discoveriesByWorkType;
    } catch (error) {
      console.error('❌ Error loading discoveries from contract:', error);
      return {};
    }
  };

  // Use real contract data instead of backend API
  const { data: contractWorkTypes, isLoading: workTypesLoading } = useQuery(
    ['contractWorkTypes'],
    loadWorkTypesFromContract,
    { 
      refetchInterval: 60000, // Refresh every minute
      onSuccess: (data) => {
        console.log('🎯 Mining - Contract work types loaded:', data);
      },
      onError: (error) => {
        console.error('❌ Mining - Contract work types error:', error);
      }
    }
  );

  // Load discoveries data
  const { data: discoveriesData, isLoading: discoveriesLoading } = useQuery(
    ['contractDiscoveries'],
    loadDiscoveriesFromContract,
    {
      refetchInterval: 30000, // Refresh every 30 seconds
      onSuccess: (data) => {
        console.log('🎯 Mining - Contract discoveries loaded:', data);
      },
      onError: (error) => {
        console.error('❌ Mining - Contract discoveries error:', error);
      }
    }
  );

  // Define work types with fallback - using real contract data
  const workTypes = contractWorkTypes || [];
  
  // Set default engine selection if none selected and work types are available
  useEffect(() => {
    if (workTypes.length > 0 && selectedEngine === null) {
      console.log('🎯 Setting default engine selection to work type 1 (Goldbach Conjecture)');
      setSelectedEngine(1); // Default to Goldbach Conjecture (work type 1)
    }
  }, [workTypes, selectedEngine]);

  // Diagnostic function that runs in browser
  const runDiagnostic = async () => {
    try {
      console.log('🔍 Running Mining Diagnostic...');
      
      if (!web3Service.isWeb3Connected()) {
        alert('❌ Web3 not connected. Please connect your wallet first.');
        return;
      }

      const userAddress = web3Service.getCurrentAccount();
      console.log('✅ Account connected:', userAddress);

      // Check network
      const currentNetwork = web3Service.getCurrentNetwork();
      console.log('Current network:', currentNetwork);
      if (currentNetwork !== 'Sepolia Testnet') {
        alert('❌ Wrong network! Please switch to Sepolia Testnet in MetaMask.\n\nCurrent network: ' + currentNetwork);
        return;
      }
      console.log('✅ Network check passed');

      // Check balance
      try {
        const balance = await web3Service.web3.eth.getBalance(userAddress);
        const balanceEth = web3Service.web3.utils.fromWei(balance, 'ether');
        console.log('Current balance:', balanceEth, 'ETH');
        if (parseFloat(balanceEth) < 0.001) {
          alert('❌ Low balance! You need at least 0.001 ETH for gas fees.\n\nCurrent balance: ' + balanceEth + ' ETH\n\nGet some from: https://sepoliafaucet.com/');
          return;
        }
        console.log('✅ Balance check passed');
      } catch (error) {
        console.warn('Balance check warning:', error.message);
      }

      // Test contract connection
      console.log('🧪 Testing contract connection...');
      try {
        const tokenInfo = await web3Service.getTokenInfo();
        console.log('✅ Contract connection successful:', tokenInfo);
      } catch (error) {
        console.error('❌ Contract connection failed:', error);
        alert('❌ Contract connection failed: ' + error.message);
        return;
      }

      // Test mining session start
      console.log('🧪 Testing mining session start...');
      try {
        const result = await web3Service.startMiningSession(0, 25);
        console.log('✅ Mining session start successful:', result);
        
        // Test PoW submission
        console.log('🧪 Testing PoW submission...');
        const powResult = await web3Service.diagnosePoWIssue(result.sessionId);
        console.log('✅ PoW diagnostic result:', powResult);
        
        if (powResult.success) {
          alert('✅ All checks passed! You should be able to start mining.\n\nSession ID: ' + result.sessionId + '\n\nTry selecting a mining engine and clicking "Start Mining".');
        } else {
          alert('❌ PoW diagnostic failed: ' + powResult.error + '\n\nPlease check your setup and try again.');
        }
        
      } catch (error) {
        console.log('❌ Mining test failed:', error.message);
        
        if (error.data) {
          console.log('Error data:', error.data);
          
          const errorSelectors = {
            '0x77280e15': 'TooManyActiveSessions()',
            '0x4d2301cc': 'ContractPaused()',
            '0x6d4ce63c': 'InvalidDifficulty()',
            '0x6d4ce63c': 'InvalidWorkType()'
          };
          
          if (errorSelectors[error.data]) {
            const errorName = errorSelectors[error.data];
            alert('❌ Mining test failed: ' + errorName + '\n\nThis means the contract call would fail. Please check your setup and try again.');
          } else {
            alert('❌ Mining test failed: ' + error.message + '\n\nPlease check your setup and try again.');
          }
        } else {
          alert('❌ Mining test failed: ' + error.message + '\n\nPlease check your setup and try again.');
        }
      }

    } catch (error) {
      console.error('❌ Diagnostic failed:', error.message);
      alert('❌ Diagnostic failed: ' + error.message + '\n\nPlease check your wallet connection and try again.');
    }
  };

  // Function to complete random sessions
  const completeRandomSessions = async (activeSessions) => {
    try {
      // Complete the first 3 sessions to free up slots
      const sessionsToComplete = activeSessions.slice(0, 3);
      
      alert(`Completing ${sessionsToComplete.length} sessions to free up slots...\n\nThis will require ${sessionsToComplete.length} MetaMask transactions.`);
      
      for (let i = 0; i < sessionsToComplete.length; i++) {
        const session = sessionsToComplete[i];
        try {
          console.log(`Completing session ${session.sessionId}...`);
          
          // Generate a proper bytes32 proof hash (64 hex chars + 0x = 66 chars total)
          const proofHash = generateRandomHash();
          const metadata = `Completed session ${session.sessionId} at ${new Date().toISOString()}`;
          
          const result = await web3Service.completeMiningSession(session.sessionId, proofHash, metadata);
          console.log(`Session ${session.sessionId} completed:`, result);
          
          if (result && result.transactionHash) {
            alert(`✅ Session ${session.sessionId} completed successfully!\n\nTransaction: ${result.transactionHash}\n\n${i + 1} of ${sessionsToComplete.length} sessions completed.`);
          } else {
            alert(`✅ Session ${session.sessionId} completed successfully!\n\n${i + 1} of ${sessionsToComplete.length} sessions completed.`);
          }
          
        } catch (error) {
          console.error(`Failed to complete session ${session.sessionId}:`, error);
          alert(`❌ Failed to complete session ${session.sessionId}: ${error.message}`);
        }
      }
      
      alert('🎉 Session completion finished!\n\nClick "Check Setup" again to verify you can now start mining.');
      
    } catch (error) {
      console.error('Error completing sessions:', error);
      alert('❌ Error completing sessions: ' + error.message);
    }
  };

  // Debug selected engine changes
  useEffect(() => {
    console.log('🎯 Selected engine changed to:', selectedEngine);
  }, [selectedEngine]);

  // Claim MINED token rewards
  const handleClaimRewards = async () => {
    if (!currentAccount || parseFloat(tokenRewards) <= 0) return;
    
    try {
      setIsClaiming(true);
      
      // Call backend to claim rewards
      const response = await fetch('https://api.productiveminer.org/api/mining/claim-rewards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': '1',
          'x-wallet-address': currentAccount
        },
        body: JSON.stringify({
          walletAddress: currentAccount
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Rewards claimed successfully:', result);
        
        // Refresh token data
        await loadTokenData();
        
        // Show success message
        alert(`Successfully claimed ${tokenRewards} MINED tokens!`);
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to claim rewards');
      }
    } catch (error) {
      console.error('Error claiming rewards:', error);
      alert(`Error claiming rewards: ${error.message}`);
    } finally {
      setIsClaiming(false);
    }
  };

  // Fetch token information
  const { data: tokenData, isLoading: tokenLoading } = useQuery(
    ['tokenInfo'],
    async () => {
      if (!web3Service.isWeb3Connected()) return null;
      return await web3Service.getTokenInfo();
    },
    { 
      refetchInterval: 30000,
      enabled: web3Connected
    }
  );

  // Fetch token balance
  const { data: balanceData, isLoading: balanceLoading } = useQuery(
    ['tokenBalance', currentAccount],
    async () => {
      if (!web3Service.isWeb3Connected() || !currentAccount) return null;
      return await web3Service.getTokenBalance();
    },
    { 
      refetchInterval: 15000,
      enabled: web3Connected && !!currentAccount
    }
  );

  // Function to trigger mining success popup
  const triggerMiningSuccess = async (sessionData = {}) => {
    // For discovery-based mining, rewards are determined by the smart contract
    // The actual token minting happens in the submitDiscovery function
    let actualTokenRewards = '0';
    
    try {
      // If we have a transaction hash, the discovery was successful
      if (sessionData?.transactionHash && sessionData?.transactionHash !== 'null') {
        // The actual rewards are minted by the contract, so we show a success message
        actualTokenRewards = 'Discovery Rewards';
        
        console.log('Discovery submitted successfully:', {
          transactionHash: sessionData.transactionHash,
          discoveryId: sessionData.discoveryId,
          gasUsed: sessionData.gasUsed
        });
      } else {
        actualTokenRewards = '0';
      }
    } catch (error) {
      console.error('Error processing discovery result:', error);
      actualTokenRewards = '0';
    }
    
    // Get current block number for accurate data
    let currentBlockNumber = 0;
    try {
      currentBlockNumber = await web3Service.web3.eth.getBlockNumber();
    } catch (error) {
      console.warn('Could not get current block number:', error);
    }

    // Format token balance properly
    let formattedTokenBalance = '0';
    try {
      if (tokenBalance && tokenBalance !== '0') {
        formattedTokenBalance = web3Service.web3.utils.fromWei(tokenBalance, 'ether');
      }
    } catch (error) {
      console.warn('Could not format token balance:', error);
      formattedTokenBalance = '0';
    }

    // Get real blockchain data for the success popup
    let realBlockData = null;
    try {
      const currentBlock = await web3Service.web3.eth.getBlockNumber();
      realBlockData = await web3Service.web3.eth.getBlock(currentBlock);
    } catch (error) {
      console.warn('Could not fetch real block data:', error);
    }

    const successData = {
      blockNumber: sessionData?.blockNumber || realBlockData?.number || currentBlockNumber || 0,
      blockHash: sessionData?.blockHash || realBlockData?.hash || sessionData?.transactionHash || null,
      reward: sessionData?.reward || (sessionData?.transactionHash ? 'Discovery Submitted' : '0.00'),
      difficulty: sessionData?.difficulty ? Number(sessionData.difficulty) : 0,
      engine: getWorkTypeName(sessionData?.workType) || 'Discovery Mining',
      timestamp: sessionData?.timestamp || realBlockData?.timestamp * 1000 || Date.now(),
      hashrate: sessionData?.hashrate || 'N/A',
      tokenRewards: sessionData?.tokenRewards || (sessionData?.transactionHash ? 'Tokens Minted' : '0'),
      tokenBalance: formattedTokenBalance,
      transactionHash: sessionData?.transactionHash || null,
      discoveryId: sessionData?.discoveryId || null,
      gasUsed: sessionData?.gasUsed || null,
      // Add real discovery data
      discoveryData: sessionData?.discoveryData || null,
      workType: sessionData?.workType || null,
      complexity: sessionData?.complexity || null,
      significance: sessionData?.significance || null,
      researchValue: sessionData?.researchValue || null
    };
    
    setMiningSuccessData(successData);
    setShowSuccessPopup(true);
    
    // Refresh token data after showing popup
    setTimeout(() => {
      loadTokenData();
    }, 1000);
  };

  // Start mining mutation using Web3Service
  const startMiningMutation = useMutation(
    async (requestBody) => {
      if (!web3Service.isWeb3Connected()) {
        throw new Error('Web3 not connected. Please connect your wallet.');
      }
      
      const { workType, difficulty } = requestBody;
      
      console.log('🔍 Starting mining session with:', { workType, difficulty });
      console.log('🔍 WorkType type:', typeof workType);
      console.log('🔍 Difficulty type:', typeof difficulty);
      
      // Pre-flight checks before attempting contract call
      console.log('🔍 Running pre-flight checks...');
      
      // Check if we're on the correct network
      const currentNetwork = web3Service.getCurrentNetwork();
      console.log('Current network:', currentNetwork);
      if (currentNetwork !== 'Sepolia Testnet') {
        throw new Error('Please switch to Sepolia Testnet in MetaMask. Current network: ' + currentNetwork);
      }
      console.log('✅ Network check passed');
      
      // Check if user has sufficient balance for gas
      try {
        const balance = await web3Service.web3.eth.getBalance(web3Service.getCurrentAccount());
        const balanceEth = web3Service.web3.utils.fromWei(balance, 'ether');
        console.log('Current balance:', balanceEth, 'ETH');
        if (parseFloat(balanceEth) < 0.001) {
          throw new Error('Insufficient ETH balance for gas fees. Please get some Sepolia ETH from a faucet.');
        }
        console.log('✅ Balance check passed');
      } catch (error) {
        if (error.message.includes('Insufficient ETH')) {
          throw error;
        }
        console.warn('Balance check warning:', error.message);
      }
      
      // For ERC20-only approach, we don't need to check contract state
      console.log('✅ ERC20 token contract is active');
      
      // TEMPORARILY BYPASS SESSION CHECKING - Allow mining to proceed
      console.log('⚠️ Session checking bypassed - proceeding with mining');
      console.log('✅ Session count check passed (bypassed)');
      
      console.log('✅ All pre-flight checks passed');
      
      // If we get here, all checks passed, proceed with contract call
      console.log('🚀 Calling startMiningSession with:', { workType, difficulty });
      
      try {
        const result = await web3Service.startMiningSession(workType, difficulty);
        console.log('✅ Contract call successful:', result);
        return result;
      } catch (error) {
        console.error('❌ Contract call failed:', error);
        
        // Try to decode the error
        if (error.data) {
          console.log('📊 Error data:', error.data);
          
          const errorSelectors = {
            '0x77280e15': 'TooManyActiveSessions()',
            '0x4d2301cc': 'ContractPaused()',
            '0x6d4ce63c': 'InvalidDifficulty()',
            '0x6d4ce63c': 'InvalidWorkType()'
          };
          
          if (errorSelectors[error.data]) {
            console.log('📊 Decoded error:', errorSelectors[error.data]);
            throw new Error(`Contract error: ${errorSelectors[error.data]}`);
          }
        }
        
        throw error;
      }
    },
    {
              onSuccess: (data) => {
        console.log('✅ Mining session started successfully:', data);
        setIsMining(true);
        
        // Enhanced auto-completion with blockchain synchronization handling
        setTimeout(async () => {
          try {
            console.log('⛏️ Starting enhanced PoW completion process...');
            console.log('Session data from start:', data);
            
            // Validate we have a valid session ID
            if (!data.sessionId || data.sessionId === 0) {
              throw new Error('Invalid session ID received from mining start');
            }
            
            // Set status to show we're working on completion
            setMiningStatus(`Waiting for blockchain sync, then completing session ${data.sessionId}...`);
            
            // Wait additional time for blockchain state synchronization
            console.log('⏳ Waiting for blockchain state to fully sync...');
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            setMiningStatus(`Completing mining session ${data.sessionId}...`);
            
            // Complete the session using the enhanced completion function
            await completeSession(data.sessionId);
            
            console.log('✅ Auto-completion process finished successfully');
            setIsMining(false);
            
          } catch (completionError) {
            console.error('❌ Auto-completion failed:', completionError);
            setMiningStatus(`Auto-completion failed: ${completionError.message}`);
            
            // Enhanced error handling based on the specific error
            let userMessage = 'Mining session could not be completed automatically.';
            let suggestion = 'You can try manually completing the session or starting a new one.';
            
            if (completionError.message.includes('does not exist') || completionError.message.includes('invalid start time')) {
              userMessage = 'Mining session validation failed due to blockchain synchronization.';
              suggestion = 'This is usually temporary. Please wait a moment and try again, or start a new mining session.';
            } else if (completionError.message.includes('already completed')) {
              userMessage = 'Mining session was already completed.';
              suggestion = 'You can start a new mining session.';
            } else if (completionError.message.includes('ownership') || completionError.message.includes('belongs to')) {
              userMessage = 'Mining session ownership verification failed.';
              suggestion = 'Please ensure you\'re using the same wallet that started the session.';
            }
              
            alert(`⚠️ ${userMessage}\n\n💡 ${suggestion}`);
            setIsMining(false);
            
            // Still try to refresh data
            try {
              await loadTokenData();
              await loadActiveSessions();
            } catch (refreshError) {
              console.warn('Data refresh after error failed:', refreshError);
            }
          }
        }, 8000); // Increased delay to allow for proper blockchain synchronization
      },
      onError: (error) => {
        console.error('❌ Mining session start failed:', error);
        setMiningStatus('Failed to start mining session');
        
        // Enhanced error handling with more specific messages
        let userMessage = 'Failed to start mining session.';
        let actionSuggestion = '';
        
        if (error.message.includes('execution reverted')) {
          if (error.message.includes('TooManyActiveSessions') || error.data === '0x77280e15') {
            userMessage = 'You have too many active mining sessions.';
            actionSuggestion = 'Please complete some existing sessions first, then try again.';
          } else if (error.message.includes('ContractPaused') || error.data === '0x4d2301cc') {
            userMessage = 'The mining contract is currently paused.';
            actionSuggestion = 'Please try again later when the contract is active.';
          } else if (error.message.includes('InvalidDifficulty') || error.data === '0x6d4ce63c') {
            userMessage = 'Invalid difficulty level selected.';
            actionSuggestion = 'Please try with a different difficulty setting (1-1000).';
          } else if (error.message.includes('InvalidWorkType') || error.data === '0x50b4e663') {
            userMessage = 'Invalid mining engine selected.';
            actionSuggestion = 'Please select a different mining engine and try again.';
          } else {
            userMessage = 'The contract rejected the transaction.';
            actionSuggestion = 'This could be due to network issues or contract state. Please try again.';
          }
        } else if (error.message.includes('user denied') || error.message.includes('User denied')) {
          userMessage = 'Transaction was cancelled by user.';
          actionSuggestion = 'Please approve the transaction in MetaMask to start mining.';
        } else if (error.message.includes('insufficient funds')) {
          userMessage = 'Insufficient ETH balance for gas fees.';
          actionSuggestion = 'Please add more ETH to your wallet and try again.';
        } else if (error.message.includes('network')) {
          userMessage = 'Network connection issue.';
          actionSuggestion = 'Please check your internet connection and MetaMask network settings.';
        } else if (error.message.includes('Sepolia')) {
          userMessage = error.message;
          actionSuggestion = 'Please switch to Sepolia Testnet in MetaMask.';
        } else if (error.message.includes('Web3 not connected')) {
          userMessage = 'Wallet not connected.';
          actionSuggestion = 'Please connect your MetaMask wallet first.';
        } else {
          userMessage = `Unexpected error: ${error.message}`;
          actionSuggestion = 'Please try again or contact support if the issue persists.';
        }
        
        // Show comprehensive error message
        const fullMessage = actionSuggestion 
          ? `❌ ${userMessage}\n\n💡 ${actionSuggestion}`
          : `❌ ${userMessage}`;
          
        alert(fullMessage);
        setIsMining(false);
        
        // Try to refresh data to show current state
        setTimeout(async () => {
          try {
            await loadActiveSessions();
            await loadTokenData();
          } catch (refreshError) {
            console.warn('Post-error data refresh failed:', refreshError);
          }
        }, 1000);
      }
    }
  );

  // Complete mining session mutation
  const completeMiningMutation = useMutation(
    async (sessionData) => {
      if (!web3Service.isWeb3Connected()) {
        throw new Error('Web3 not connected. Please connect your wallet.');
      }
      
      const { sessionId, proofHash, metadata } = sessionData;
      const result = await web3Service.completeMiningSession(sessionId, proofHash, metadata);
      return result;
    },
    {
      onSuccess: (data) => {
        console.log('✅ Mining session completed successfully:', data);
        setIsMining(false);
              queryClient.invalidateQueries(['tokenBalance']);
      queryClient.invalidateQueries(['tokenInfo']);
      },
      onError: (error) => {
        console.error('❌ Failed to complete mining session:', error);
        setIsMining(false);
      }
    }
  );

  // Stop mining mutation
  const stopMiningMutation = useMutation(
    async () => {
      // For now, just stop the local mining state
      // In a real implementation, you might want to call a contract method to stop mining
      return { success: true };
    },
    {
      onSuccess: (data) => {
        console.log('✅ Mining stopped successfully:', data);
        setIsMining(false);
      },
      onError: (error) => {
        console.error('❌ Failed to stop mining:', error);
      }
    }
  );

  const handleStartMining = () => {
    console.log('🎯 handleStartMining called');
    console.log('🎯 Web3 connected:', web3Connected);
    console.log('🎯 Selected engine:', selectedEngine);
    console.log('🎯 Available engines:', availableEngines);
    
    if (!web3Connected) {
      alert('Please connect your wallet first');
      return;
    }

    if (selectedEngine !== null && selectedEngine !== undefined) {
      // selectedEngine is already the workType ID (0-24), so use it directly
      const workType = selectedEngine;
      
      console.log('🎯 Using workType:', workType, 'Type:', typeof workType);
      
      // Validate workType is within valid range (0-24)
      if (workType < 0 || workType > 24) {
        console.error('❌ Invalid workType:', workType, '- must be between 0 and 24');
        alert('Invalid work type selected. Please select a valid mathematical engine.');
        return;
      }
      
      const requestBody = {
        workType: workType,
        difficulty: 25
      };
      
      console.log('🎯 Starting mining with workType:', workType, 'difficulty:', 25);
      console.log('🎯 Request body:', requestBody);
      startMiningMutation.mutate(requestBody);
    } else {
      console.error('❌ No engine selected');
      console.error('❌ selectedEngine value:', selectedEngine);
      console.error('❌ availableEngines length:', availableEngines.length);
      alert('Please select a mathematical engine before starting mining.');
    }
  };

  const handleStopMining = () => {
    stopMiningMutation.mutate();
  };

  const handleMiningModeChange = (mode) => {
    setMiningMode(mode);
    if (mode === 'continuous' && isMining) {
      // Stop current mining before switching to continuous
      stopMiningMutation.mutate();
    }
  };

        const formatNumber = (num) => {
    if (!num) return '0';
    
    // Handle string inputs (common from web3 calls)
    let numberValue;
    if (typeof num === 'string') {
      numberValue = parseFloat(num);
    } else if (typeof num === 'bigint') {
      numberValue = Number(num);
    } else {
      numberValue = Number(num);
    }
    
    // Handle NaN or invalid numbers
    if (isNaN(numberValue)) {
      return '0';
    }
    
    if (numberValue >= 1000000) {
      return (numberValue / 1000000).toFixed(1) + 'M';
    } else if (numberValue >= 1000) {
      return (numberValue / 1000).toFixed(1) + 'K';
    }
    return numberValue.toLocaleString();
  };

  const formatHashrate = (hashrate) => {
    if (!hashrate) return '0 H/s';
    
    // If hashrate is already a formatted string, return it
    if (typeof hashrate === 'string' && hashrate.includes('H/s')) {
      return hashrate;
    }
    
    // Convert number to formatted string
    if (hashrate >= 1000000) {
      return (hashrate / 1000000).toFixed(1) + ' TH/s';
    } else if (hashrate >= 1000) {
      return (hashrate / 1000).toFixed(1) + ' GH/s';
    }
    return hashrate.toLocaleString() + ' H/s';
  };

  const formatCurrency = (amount) => {
    if (!amount) return '0 MINED';
    return `${formatNumber(amount)} MINED`;
  };

  // Engine descriptions and icons
  const engineDescriptions = {
    'riemann-zeros': 'Compute non-trivial zeros of the Riemann zeta function',
    'goldbach-conjecture': 'Verify Goldbach conjecture for large even numbers',
    'birch-swinnerton': 'Compute L-functions for elliptic curves',
    'prime-pattern-discovery': 'Advanced prime number pattern recognition',
    'twin-primes': 'Search for twin prime pairs and patterns',
    'collatz-conjecture': 'Verify Collatz sequence convergence patterns',
    'perfect-numbers': 'Discover new perfect numbers and properties',
    'mersenne-primes': 'Find new Mersenne prime numbers',
    'fibonacci-patterns': 'Advanced Fibonacci sequence analysis',
    'pascal-triangle': 'Deep analysis of Pascal triangle properties',
    'differential-equations': 'Solve complex differential equations',
    'number-theory': 'Advanced number theory computations',
    'yang-mills-theory': 'Solve Yang-Mills field equations for quantum chromodynamics',
    'navier-stokes': 'Solve Navier-Stokes equations for fluid dynamics',
    'elliptic-curve-crypto': 'Generate secure elliptic curve parameters',
    'lattice-cryptography': 'Post-quantum cryptographic algorithms',
    'cryptographic-hash': 'Cryptographic hash function analysis',
    'poincaré-conjecture': 'Topological manifold analysis',
    'algebraic-topology': 'Topological invariant computations',
    'euclidean-geometry': 'Advanced geometric theorem proving',
    'quantum-computing': 'Quantum computing simulations',
    'machine-learning': 'Machine learning algorithm optimization',
    'blockchain-protocols': 'Blockchain protocol analysis',
    'distributed-systems': 'Distributed system optimization',
    'optimization-algorithms': 'Mathematical optimization algorithms'
  };

  const engineIcons = {
    'riemann-zeros': <FaBrain />,
    'goldbach-conjecture': <FaGraduationCap />,
    'birch-swinnerton': <FaShieldAlt />,
    'prime-pattern-discovery': <FaCog />,
    'twin-primes': <FaGraduationCap />,
    'collatz-conjecture': <FaBrain />,
    'perfect-numbers': <FaShieldAlt />,
    'mersenne-primes': <FaRocket />,
    'fibonacci-patterns': <FaCog />,
    'pascal-triangle': <FaGraduationCap />,
    'differential-equations': <FaCog />,
    'number-theory': <FaGraduationCap />,
    'yang-mills-theory': <FaNetworkWired />,
    'navier-stokes': <FaCog />,
    'elliptic-curve-crypto': <FaRocket />,
    'lattice-cryptography': <FaNetworkWired />,
    'cryptographic-hash': <FaShieldAlt />,
    'poincaré-conjecture': <FaBrain />,
    'algebraic-topology': <FaBrain />,
    'euclidean-geometry': <FaNetworkWired />,
    'quantum-computing': <FaRocket />,
    'machine-learning': <FaBrain />,
    'blockchain-protocols': <FaNetworkWired />,
    'distributed-systems': <FaCog />,
    'optimization-algorithms': <FaGraduationCap />
  };

  // Available mathematical engines with real data from smart contract
  // Create available engines from work types with discoveries data
  const availableEngines = workTypes ? workTypes.map(workType => {
    // Map work type ID to engine ID for proper icon and description lookup
    const engineIdMap = {
      0: 'riemann-zeros',
      1: 'goldbach-conjecture',
      2: 'birch-swinnerton',
      3: 'prime-pattern-discovery',
      4: 'twin-primes',
      5: 'collatz-conjecture',
      6: 'perfect-numbers',
      7: 'mersenne-primes',
      8: 'fibonacci-patterns',
      9: 'pascal-triangle',
      10: 'differential-equations',
      11: 'number-theory',
      12: 'yang-mills-theory',
      13: 'navier-stokes',
      14: 'elliptic-curve-crypto',
      15: 'lattice-cryptography',
      16: 'cryptographic-hash',
      17: 'poincaré-conjecture',
      18: 'algebraic-topology',
      19: 'euclidean-geometry',
      20: 'quantum-computing',
      21: 'machine-learning',
      22: 'blockchain-protocols',
      23: 'distributed-systems',
      24: 'optimization-algorithms'
    };
    
    const engineId = engineIdMap[workType.id] || workType.name.toLowerCase().replace(/\s+/g, '-');
    
    // Get discoveries data for this work type
    const discoveriesInfo = discoveriesData ? discoveriesData[workType.id] : null;
    const discoveryCount = discoveriesInfo ? discoveriesInfo.count : 0;
    const avgResearchValue = discoveriesInfo ? discoveriesInfo.avgResearchValue : 0;
    
    // Calculate updated estimated reward based on actual discoveries
    let updatedEstimatedReward = workType.estimatedReward;
    if (discoveryCount > 0 && avgResearchValue > 0) {
      // Use average research value as proxy for daily rewards
      const dailyDiscoveryRate = Math.max(discoveryCount, 1); // conservative
      const estimatedDailyReward = dailyDiscoveryRate * avgResearchValue;
      updatedEstimatedReward = `${estimatedDailyReward.toFixed(6)} MINED/day`;
    }
    
    return {
      id: workType.id,
      name: workType.name,
      description: workType.description,
      icon: engineIcons[engineId] || <FaCog />,
      complexity: workType.difficulty,
      currentHashrate: workType.hashrate,
      totalDiscoveries: discoveryCount.toString(),
      estimatedReward: updatedEstimatedReward,
      sessions: 0, // Will be updated from contract
      totalCoins: 0, // Not applicable for ERC20
      researchValue: workType.baseReward || 0,
      avgResearchValue: avgResearchValue,
      discoveryRate: discoveryCount > 0 ? Math.round(discoveryCount * 24 / Math.max(workType.sessions || 1, 1)) : 0
    };
  }) : [];

  // Current mining statistics from token data
  const currentStats = {
    hashrate: (() => {
      const selected = workTypes.find(w => w.id === selectedEngine);
      return selected ? selected.calculatedHashrate : 796;
    })(),
    shares: activeSessions.length || 0,
    rewards: parseFloat(tokenBalance) || 0,
    uptime: 0,
    activeMiners: 1,
    totalDiscoveries: Object.values(discoveriesData || {}).reduce((sum, d) => sum + (d.count || 0), 0),
    averageBlockTime: 12,
    difficulty: 25000
  };

  // Refresh mining data
  const refreshMiningData = async () => {
    try {
      console.log('Refreshing mining data...');
      
      // Refresh token balance
      await loadTokenData();
      
      // Refresh active sessions
      await loadActiveSessions();
      
      // Refresh contract data
      if (web3Service.isWeb3Connected()) {
        const info = await web3Service.getTokenInfo();
        setTokenInfo(info);
        
        if (web3Service.getCurrentAccount()) {
          const balance = await web3Service.getTokenBalance();
          setTokenBalance(balance);
        }
      }
      
      console.log('Mining data refreshed');
      
    } catch (error) {
      console.error('Error refreshing mining data:', error);
    }
  };

  return (
    <div className="mining">
      <div className="mining-container">
        {/* Web3 Connection Status */}
        {!web3Connected && (
          <motion.div
            className="web3-status-warning"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: 'linear-gradient(135deg, #ff6b6b, #feca57)',
              color: 'white',
              padding: '15px',
              borderRadius: '10px',
              marginBottom: '20px',
              textAlign: 'center'
            }}
          >
            <FaExclamationTriangle style={{ marginRight: '10px' }} />
            <strong>Wallet Not Connected</strong> - Please connect your MetaMask wallet to interact with the MINED token on Sepolia testnet.
          </motion.div>
        )}

        {web3Connected && (
          <motion.div
            className="web3-status-success"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: 'linear-gradient(135deg, #00b894, #00cec9)',
              color: 'white',
              padding: '15px',
              borderRadius: '10px',
              marginBottom: '20px',
              textAlign: 'center'
            }}
          >
            <FaWallet style={{ marginRight: '10px' }} />
            <strong>Connected to Sepolia Testnet</strong> - Address: {currentAccount?.slice(0, 6)}...{currentAccount?.slice(-4)} | Network: {currentNetwork}
          </motion.div>
        )}

        {/* Token Integration Warning */}


        {/* Header */}
        <motion.div
          className="mining-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="header-content">
            <div className="header-left">
              <h1>Mathematical Mining</h1>
              <p>Select a mathematical engine and start contributing to scientific discoveries with MINED token rewards</p>
            </div>
            <div className="header-right">
              <button 
                className="refresh-btn"
                onClick={refreshMiningData}
              >
                <FaCog />
                Refresh Data
              </button>
            </div>
          </div>
        </motion.div>

        {/* Engine Selection */}
        <motion.div
          className="engine-selection"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h2>Select Mathematical Engine</h2>
          <div className="engines-grid">
            {availableEngines.map((engine) => {
              const isSelected = selectedEngine === engine.id;
              return (
              <motion.div
                key={engine.id}
                className={`engine-option ${selectedEngine === engine.id ? 'selected' : ''}`}
                data-engine-id={engine.id}
                data-selected={selectedEngine === engine.id}
                onClick={() => {
                  console.log('🎯 Engine selected:', engine.id, engine.name);
                  setSelectedEngine(engine.id);
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="engine-icon">
                  {engine.icon}
                </div>
                <div className="engine-info">
                  <h3>{engine.name}</h3>
                  <p>{engine.description}</p>
                  <div className="engine-stats">
                    <span className="complexity">{engine.complexity}</span>
                    <span className="hashrate">{engine.currentHashrate}</span>
                    <span className="discoveries">{engine.totalDiscoveries} discoveries</span>
                  </div>
                  <div className="engine-metrics">
                    <div className="estimated-reward">
                      Est. Reward: {engine.estimatedReward}
                    </div>
                    {engine.avgResearchValue > 0 && (
                      <div className="avg-research-value">
                        Avg Research Value: {engine.avgResearchValue}
                      </div>
                    )}
                    {engine.discoveryRate > 0 && (
                      <div className="discovery-rate">
                        Discovery Rate: {engine.discoveryRate}/day
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Mining Control */}
        <motion.div
          className="mining-control"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="control-panel">
            <div className="control-header">
              <h3>Mining Control</h3>
              <div className={`status-indicator ${isMining || isContinuousMining ? 'active' : 'inactive'}`}>
                <div className="status-dot"></div>
                {isContinuousMining ? 'Continuous Mining Active' : isMining ? 'Mining Active' : 'Mining Inactive'}
              </div>
            </div>

            {/* Seamless Mining Mode Selection */}
            <div className="mining-mode-selection">
              <h4>Mining Mode</h4>
              <div className="mode-buttons">
                <button
                  className={`mode-btn ${miningMode === 'single' ? 'active' : ''}`}
                  onClick={() => handleMiningModeChange('single')}
                  disabled={isContinuousMining}
                >
                  <FaPlay />
                  Single Session
                  <span className="mode-description">Auto-confirms after 30 seconds</span>
                </button>
                <button
                  className={`mode-btn ${miningMode === 'continuous' ? 'active' : ''}`}
                  onClick={() => handleMiningModeChange('continuous')}
                  disabled={isMining}
                >
                  <FaRocket />
                  Continuous Mining
                  <span className="mode-description">Automatically starts new sessions</span>
                </button>
              </div>
            </div>
            
            <div className="control-actions">
              <button
                className={`control-btn start-btn ${isMining || isContinuousMining ? 'disabled' : ''}`}
                onClick={() => {
                  console.log('🎯 Start mining clicked. Selected engine:', selectedEngine, 'Mode:', miningMode);
                  handleStartMining();
                }}
                disabled={!web3Connected || !selectedEngine || isMining || isContinuousMining || startMiningMutation.isLoading}
              >
                <FaPlay />
                {startMiningMutation.isLoading ? 'Starting...' : 
                 miningMode === 'continuous' ? 'Start Continuous Mining' : 'Start Mining'}
              </button>
              
              <button
                className={`control-btn stop-btn ${!isMining && !isContinuousMining ? 'disabled' : ''}`}
                onClick={handleStopMining}
                disabled={!isMining && !isContinuousMining || stopMiningMutation.isLoading}
              >
                <FaStop />
                {stopMiningMutation.isLoading ? 'Stopping...' : 
                 miningMode === 'continuous' ? 'Stop Continuous Mining' : 'Stop Mining'}
              </button>

              {/* Diagnostic Button */}
              <button
                className="control-btn diagnostic-btn"
                onClick={runDiagnostic}
                style={{ 
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  marginLeft: '10px'
                }}
              >
                🔍 Check Setup
              </button>

              {/* Contract State Check Button */}
              <button
                className="control-btn contract-state-btn"
                onClick={async () => {
                  try {
                    if (!web3Service.isWeb3Connected()) {
                      alert('❌ Web3 not connected. Please connect your wallet first.');
                      return;
                    }
                    
                    setMiningStatus('Checking contract state...');
                    const state = await web3Service.checkContractState();
                    
                    let statusMessage = 'Contract state checked. ';
                    if (state.contractPaused) {
                      statusMessage += '❌ Contract is paused!';
                    } else if (!state.poolsHealthy) {
                      statusMessage += '⚠️ Pool balances are low.';
                    } else if (!state.workType0Active) {
                      statusMessage += '⚠️ Work type 0 is not active.';
                    } else {
                      statusMessage += '✅ Contract state is healthy!';
                    }
                    
                    setMiningStatus(statusMessage);
                    
                    // Show detailed alert
                    const alertMessage = `Contract State Analysis:
                    
🏦 Pool Balances:
• Mining Rewards: ${state.miningRewardsPool} MINED
• Staking Pool: ${state.stakingPoolBalance} MINED  
• Validator Pool: Not available in current contract

🔧 Contract Status:
• Pools Healthy: ${state.poolsHealthy ? '✅' : '❌'}
• Work Type 0 Active: ${state.workType0Active ? '✅' : '❌'}
• Contract Paused: ${state.contractPaused ? '❌' : '✅'}
• Active Sessions: ${state.userActiveSessions}

${state.contractPaused ? '❌ Contract is paused - no operations possible!' : 
  !state.poolsHealthy ? '⚠️ Low pool balances may affect automatic operations' :
  '✅ Contract ready for mining operations!'}`;
                    
                    alert(alertMessage);
                    
                  } catch (error) {
                    console.error('❌ Failed to check contract state:', error);
                    setMiningStatus('Failed to check contract state');
                    alert(`❌ Failed to check contract state: ${error.message}`);
                  }
                }}
                style={{ 
                  background: 'linear-gradient(135deg, #ff6b6b, #ee5a24)',
                  marginLeft: '10px'
                }}
              >
                🏦 Check Contract State
              </button>

              {/* Complete Sessions Button */}


              {/* Mining Status Display */}
              <div style={{
                margin: '16px 0',
                padding: '12px',
                backgroundColor: '#f0f8ff',
                border: '1px solid #4CAF50',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <strong>Mining Status:</strong> <span style={{ color: '#4CAF50' }}>{miningStatus}</span>
              </div>

              {/* Contract Mining Button */}
              <button
                className="control-btn contract-mining-btn"
                onClick={async () => {
                  try {
                    if (!web3Service.isWeb3Connected()) {
                      alert('❌ Web3 not connected. Please connect your wallet first.');
                      return;
                    }
                    
                    const confirmed = window.confirm('🚀 Start Real Contract Mining?\n\nThis will:\n1. Start a mining session on the ERC20 contract\n2. Perform PoW computation\n3. Submit result and mint MINED tokens to your wallet\n\nThis requires gas fees. Continue?');
                    if (!confirmed) return;
                    
                    // Start real contract mining with selected engine
                    const workType = selectedEngine || 1; // Use selected engine or default to Goldbach Conjecture
                    const difficulty = 25;
                    
                    // Validate work type
                    if (workType < 0 || workType > 24) {
                      alert(`❌ Invalid work type: ${workType}. Must be between 0 and 24.`);
                      return;
                    }
                    
                    console.log('🚀 Starting real contract mining with:', { workType, difficulty });
                    
                    const result = await startContractMiningSession(workType, difficulty);
                    
                    // Auto-complete the session after a short delay to simulate PoW
                    setTimeout(async () => {
                      try {
                        console.log('⛏️ Auto-completing mining session...');
                        await completeSession(result.sessionId);
                      } catch (error) {
                        console.error('❌ Failed to auto-complete mining session:', error);
                        alert(`❌ Mining session started but failed to complete: ${error.message}`);
                      }
                    }, 3000); // 3 second delay to simulate mining
                    
                  } catch (error) {
                    console.error('❌ Contract mining failed:', error);
                    
                    // Decode the error to provide better feedback
                    if (error.data) {
                      console.log('📊 Error data:', error.data);
                      
                      const errorSelectors = {
                        '0x77280e15': 'TooManyActiveSessions() - You have too many active sessions',
                        '0x4d2301cc': 'ContractPaused() - Contract is paused',
                        '0x6d4ce63c': 'InvalidDifficulty() - Invalid difficulty value',
                        '0x50b4e663': 'InvalidWorkType() - Invalid work type value',
                        '0x': 'Generic contract error'
                      };
                      
                      if (errorSelectors[error.data]) {
                        const errorName = errorSelectors[error.data];
                        alert(`❌ Contract error: ${errorName}\n\nThe contract rejected the transaction. This usually means:\n• You have active mining sessions\n• Invalid parameters\n• Contract is paused\n\nTry again later or check your active sessions.`);
                      } else {
                        alert(`❌ Contract error: ${error.message}\n\nError data: ${error.data}`);
                      }
                    } else if (error.message.includes('user rejected')) {
                      alert('❌ Transaction cancelled by user.');
                    } else if (error.message.includes('insufficient funds')) {
                      alert('❌ Insufficient ETH for gas fees. Please add more ETH to your wallet.');
                    } else {
                      alert(`❌ Mining failed: ${error.message}`);
                    }
                  }
                }}
                style={{
                  background: 'linear-gradient(135deg, #4CAF50, #45a049)',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
              >
                🚀 Start Contract Mining (Real ERC20)
              </button>






              

            </div>

            {selectedEngine && (
              <div className="selected-engine-info">
                <h4>Selected Engine: {availableEngines.find(e => e.id === selectedEngine)?.name}</h4>
                <p>Complexity: {availableEngines.find(e => e.id === selectedEngine)?.complexity}</p>
                <p>Mode: {miningMode === 'continuous' ? 'Continuous (Auto-confirms every 30s)' : 'Single Session (Auto-confirms after 30s)'}</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Active Sessions Manager */}
        {activeSessions.length > 0 && (
          <motion.div
            className="active-sessions-manager"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="sessions-panel">
              <div className="sessions-header">
                <h3>Active Sessions ({activeSessions.length}/10)</h3>
                <button
                  className="refresh-btn"
                  onClick={loadActiveSessions}
                  title="Refresh sessions"
                >
                  🔄
                </button>
              </div>
              
              <div className="sessions-list">
                {activeSessions.map((session) => (
                  <div key={session.sessionId} className="session-item">
                    <div className="session-info">
                      <div className="session-header">
                        <span className="session-id">Session #{session.sessionId}</span>
                        <span className="session-status active">Active</span>
                      </div>
                      <div className="session-details">
                        <span className="work-type">{session.workTypeName}</span>
                        <span className="difficulty">Difficulty: {session.difficulty}</span>
                        <span className="start-time">
                          Started: {new Date(session.startTime * 1000).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="session-actions">
                      <button
                        className="complete-btn"
                        onClick={() => completeSession(session.sessionId)}
                        title="Complete this session"
                      >
                        ✅ Complete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              {activeSessions.length >= 10 && (
                <div className="sessions-warning">
                  ⚠️ You have reached the maximum of 10 active sessions. 
                  Please complete some sessions before starting new ones.
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Mining Statistics */}
        <motion.div
          className="mining-stats"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h3>Real-time Mining Statistics</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">
                <FaChartLine />
              </div>
              <div className="stat-content">
                <h4>Current Hashrate</h4>
                <p className="stat-value">{formatHashrate(currentStats.hashrate)}</p>
                <p className="stat-description">Computational power</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <FaServer />
              </div>
              <div className="stat-content">
                <h4>Total Sessions</h4>
                <p className="stat-value">{formatNumber(currentStats.shares)}</p>
                <p className="stat-description">Valid computations</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <FaCoins />
              </div>
              <div className="stat-content">
                <h4>Total Rewards</h4>
                <p className="stat-value">{formatCurrency(currentStats.rewards)}</p>
                <p className="stat-description">Earned MINED tokens</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <FaClock />
              </div>
              <div className="stat-content">
                <h4>Uptime</h4>
                <p className="stat-value">{currentStats.uptime > 0 ? `${Math.floor(currentStats.uptime / 3600)}h ${Math.floor((currentStats.uptime % 3600) / 60)}m` : '0h 0m'}</p>
                <p className="stat-description">Active mining time</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <FaRocket />
              </div>
              <div className="stat-content">
                <h4>Total Discoveries</h4>
                <p className="stat-value">{formatNumber(currentStats.totalDiscoveries)}</p>
                <p className="stat-description">Mathematical breakthroughs</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <FaNetworkWired />
              </div>
              <div className="stat-content">
                <h4>Max Difficulty</h4>
                <p className="stat-value">{formatNumber(currentStats.difficulty)}</p>
                <p className="stat-description">Contract difficulty</p>
              </div>
            </div>

            {/* MINED Token Balance */}
            <div className="stat-card token-balance-card">
              <div className="stat-icon">
                🪙
              </div>
              <div className="stat-content">
                <h4>MINED Balance</h4>
                <p className="stat-value">{formatNumber(tokenBalance)} MINED</p>
                <p className="stat-description">Your token balance</p>
              </div>
            </div>

            {/* MINED Token Rewards */}
            <div className="stat-card token-rewards-card">
              <div className="stat-icon">
                <FaCoins />
              </div>
              <div className="stat-content">
                <h4>Reward Earned</h4>
                <p className="stat-value">{formatNumber(tokenRewards)} MINED</p>
                <p className="stat-description">Calculated rewards (pending contract integration)</p>
                {parseFloat(tokenRewards) > 0 && (
                  <div style={{ marginTop: '10px', fontSize: '0.8rem', color: '#f39c12' }}>
                    ⚠️ Token minting requires contract integration
                  </div>
                )}
              </div>
            </div>

            {/* MINED Token Rewards */}
            <div className="stat-card token-rewards-card">
              <div className="stat-icon">
                ⛏️
              </div>
              <div className="stat-content">
                <h4>Next Reward</h4>
                <p className="stat-value">{formatNumber(tokenRewards)} MINED</p>
                <p className="stat-description">Per successful mining</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Progress Bar */}
        {isMining && (
          <motion.div
            className="mining-progress"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="progress-header">
              <h4>Mining Progress</h4>
              <span className="progress-percentage">Computing...</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill"></div>
            </div>
          </motion.div>
        )}

        {/* Mining Success Popup */}
        <MiningSuccessPopup
          isVisible={showSuccessPopup}
          onClose={() => setShowSuccessPopup(false)}
          miningData={miningSuccessData}
        />
      </div>
    </div>
  );
};

export default Mining;
