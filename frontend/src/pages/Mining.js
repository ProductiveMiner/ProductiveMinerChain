console.log("MiningSuccessPopup imported successfully");
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from 'react-query';
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
  FaRocket
} from 'react-icons/fa';
import { flowAPI, mathEngineAPI, backendAPI } from '../utils/api';
import MiningSuccessPopup from '../components/MiningSuccessPopup';
import './Mining.css';

const Mining = () => {
  const [selectedEngine, setSelectedEngine] = useState(null);
  const [isMining, setIsMining] = useState(false);
  const [isContinuousMining, setIsContinuousMining] = useState(false);
  const [miningMode, setMiningMode] = useState('single'); // 'single' or 'continuous'
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [miningSuccessData, setMiningSuccessData] = useState(null);
  const queryClient = useQueryClient();

  // Debug selected engine changes
  useEffect(() => {
    console.log('🎯 Selected engine changed to:', selectedEngine);
  }, [selectedEngine]);

  // Fetch available mathematical engines
  const { data: engines, isLoading: enginesLoading } = useQuery(
    ['miningEngines'],
    () => mathEngineAPI.getEngineDistribution(),
    { refetchInterval: 30000 }
  );

  // Fetch current mining status
  const { data: miningStatus, isLoading: statusLoading } = useQuery(
    ['miningStatus'],
    async () => {
      try {
        // Get the latest block to determine if mining is active
        const response = await flowAPI.getLatestBlock();
        const latestBlock = response?.blocks?.[0];
        
        // Check if there's been recent mining activity (within last 5 minutes)
        const now = Date.now();
          const ts = latestBlock?.timestamp || latestBlock?.time;
          const blockTime = ts ? (ts > 1e12 ? ts : ts * 1000) : 0; // Normalize to ms
        const isActive = blockTime && (now - blockTime) < 5 * 60 * 1000; // 5 minutes
        
        return {
          isMining: isActive,
          currentEngine: latestBlock?.workType || null,
           hashrate: latestBlock?.difficulty || 0,
          rewards: latestBlock?.reward || 0,
           uptime: isActive && blockTime > 0 ? Math.floor((now - blockTime) / 1000) : 0,
          activeMiners: response?.totalCount || 0,
          totalDiscoveries: response?.totalDiscoveries || 0,
          averageBlockTime: response?.averageBlockTime || 0,
           currentDifficulty: latestBlock?.difficulty || 0
        };
      } catch (error) {
        console.error('❌ Error fetching mining status:', error);
        return {
          isMining: false,
          currentEngine: null,
          hashrate: 0,
          rewards: 0,
          uptime: 0,
          activeMiners: 0,
          totalDiscoveries: 0,
          averageBlockTime: 0,
          currentDifficulty: 0
        };
      }
    },
    { 
      refetchInterval: 10000, // Check every 10 seconds
      onSuccess: (data) => {
        console.log('🎯 Mining - Mining status received:', data);
        setIsMining(data.isMining);
      },
      onError: (error) => {
        console.error('❌ Mining - Mining status error:', error);
      }
    }
  );

  // Fetch continuous mining status
  const { data: continuousMiningStatus, isLoading: continuousStatusLoading } = useQuery(
    ['continuousMiningStatus'],
    async () => {
      try {
        const response = await fetch('/api/mining/continuous/status');
        const data = await response.json();
        return data;
      } catch (error) {
        console.error('❌ Error fetching continuous mining status:', error);
        return { status: 'inactive' };
      }
    },
    { 
      refetchInterval: 5000, // Check every 5 seconds
      onSuccess: (data) => {
        console.log('🎯 Mining - Continuous mining status received:', data);
        setIsContinuousMining(data.status === 'active');
      },
      onError: (error) => {
        console.error('❌ Mining - Continuous mining status error:', error);
      }
    }
  );

  // Fetch mining statistics
  const { data: miningStats, isLoading: statsLoading } = useQuery(
    ['miningStats'],
    async () => {
      try {
        // Get mining statistics from blockchain
        const data = await flowAPI.getHashrateData();
        
        return {
          networkStats: {
            totalHashrate: data?.hashRate || 0,
            totalTransactions: data?.tps || 0,
            blockHeight: data?.blockHeight || 0
          },
          globalStats: {
            totalSessionsCompleted: data?.totalDiscoveries || 0,
            totalCoinsMined: data?.totalResearchValue || 0
          },
          userStats: {
            totalCoinsEarned: 0, // Would need user-specific data
            totalMiningTime: 0, // Would need user-specific data
            currentHashrate: data?.hashRate || 0
          }
        };
      } catch (error) {
        console.error('❌ Error fetching mining stats:', error);
        return {
          networkStats: { totalHashrate: 0, totalTransactions: 0, blockHeight: 0 },
          globalStats: { totalSessionsCompleted: 0, totalCoinsMined: 0 },
          userStats: { totalCoinsEarned: 0, totalMiningTime: 0, currentHashrate: 0 }
        };
      }
    },
    { 
      refetchInterval: 30000,
      onSuccess: (data) => {
        console.log('🎯 Mining - Mining stats received:', data);
      },
      onError: (error) => {
        console.error('❌ Mining - Mining stats error:', error);
      }
    }
  );

  // Fetch engine statistics
  const { data: engineStats, isLoading: engineStatsLoading } = useQuery(
    ['engineStats'],
    () => mathEngineAPI.getEngineStats(),
    { 
      refetchInterval: 30000,
      onSuccess: (data) => {
        console.log('🎯 Mining - Engine stats received:', data);
      },
      onError: (error) => {
        console.error('❌ Mining - Engine stats error:', error);
      }
    }
  );

  // Fetch network statistics for mining stats
  const { data: networkStats, isLoading: networkStatsLoading } = useQuery(
    ['networkStats'],
    async () => {
      try {
        // Get network statistics from blockchain
        const response = await flowAPI.getHashrateData();
        
        return {
          hashRate: response?.hashRate || '0 H/s',
          validatorsActive: response?.validatorsActive || 0,
          totalDiscoveries: response?.totalDiscoveries || 0,
          averageBlockTime: response?.averageBlockTime || 0,
          currentDifficulty: response?.currentDifficulty || 0
        };
      } catch (error) {
        console.error('❌ Error fetching network stats:', error);
        return {
          hashRate: '0 H/s',
          validatorsActive: 0,
          totalDiscoveries: 0,
          averageBlockTime: 0,
          currentDifficulty: 0
        };
      }
    },
    { 
      refetchInterval: 30000,
      onSuccess: (data) => {
        console.log('🎯 Mining - Network stats received:', data);
      },
      onError: (error) => {
        console.error('❌ Mining - Network stats error:', error);
      }
    }
  );

  // Function to trigger mining success popup
  const triggerMiningSuccess = (blockData) => {
    const successData = {
      blockNumber: blockData?.blockNumber || Math.floor(Math.random() * 1000) + 1,
      blockHash: blockData?.blockHash || `0x${Math.random().toString(16).slice(2, 66)}`,
      reward: blockData?.reward || (Math.random() * 10 + 2).toFixed(2),
      difficulty: blockData?.difficulty || Math.floor(Math.random() * 1000000) + 2500000,
      engine: blockData?.engine || selectedEngine || 'Prime Pattern Discovery',
      timestamp: blockData?.timestamp || Date.now(),
      hashrate: blockData?.hashrate || `${(Math.random() * 1000 + 100).toFixed(0)} H/s`
    };
    
    setMiningSuccessData(successData);
    setShowSuccessPopup(true);
  };

  // Start mining mutation
  const startMiningMutation = useMutation(
    async (requestBody) => {
      const response = await backendAPI.startMining(requestBody);
      return response;
    },
    {
      onSuccess: (data) => {
        console.log('✅ Mining started successfully:', data);
        queryClient.invalidateQueries(['miningStatus']);
        queryClient.invalidateQueries(['latestBlocks']);
        setIsMining(true);
        
        // Simulate mining success after a delay (in real implementation, this would be triggered by actual block discovery)
        setTimeout(() => {
          triggerMiningSuccess(data);
        }, 3000 + Math.random() * 5000); // Random delay between 3-8 seconds
      },
      onError: (error) => {
        console.error('❌ Failed to start mining:', error);
      }
    }
  );

  // Stop mining mutation
  const stopMiningMutation = useMutation(
    async () => {
      const response = await backendAPI.stopMining();
      return response;
    },
    {
      onSuccess: (data) => {
        console.log('✅ Mining stopped successfully:', data);
        queryClient.invalidateQueries(['miningStatus']);
        queryClient.invalidateQueries(['latestBlocks']);
        setIsMining(false);
      },
      onError: (error) => {
        console.error('❌ Failed to stop mining:', error);
      }
    }
  );

  // Start continuous mining mutation
  const startContinuousMiningMutation = useMutation(
    async () => {
      const response = await fetch('/api/mining/continuous', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      return response.json();
    },
    {
      onSuccess: (data) => {
        console.log('✅ Continuous mining started successfully:', data);
        queryClient.invalidateQueries(['continuousMiningStatus']);
        queryClient.invalidateQueries(['miningStatus']);
        queryClient.invalidateQueries(['latestBlocks']);
        setIsContinuousMining(true);
        setMiningMode('continuous');
      },
      onError: (error) => {
        console.error('❌ Failed to start continuous mining:', error);
      }
    }
  );

  // Stop continuous mining mutation
  const stopContinuousMiningMutation = useMutation(
    async () => {
      const response = await fetch('/api/mining/continuous/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      return response.json();
    },
    {
      onSuccess: (data) => {
        console.log('✅ Continuous mining stopped successfully:', data);
        queryClient.invalidateQueries(['continuousMiningStatus']);
        queryClient.invalidateQueries(['miningStatus']);
        queryClient.invalidateQueries(['latestBlocks']);
        setIsContinuousMining(false);
        setMiningMode('single');
      },
      onError: (error) => {
        console.error('❌ Failed to stop continuous mining:', error);
      }
    }
  );

  const handleStartMining = () => {
    if (selectedEngine) {
      // Map engine ID to work type
      const workTypeMap = {
        'riemann-zeros': 'Riemann Zero Computation',
        'yang-mills': 'Yang-Mills Field Theory',
        'goldbach': 'Goldbach Conjecture Verification',
        'navier-stokes': 'Navier-Stokes Simulation',
        'birch-swinnerton': 'Birch-Swinnerton-Dyer',
        'ecc': 'Elliptic Curve Cryptography',
        'lattice': 'Lattice Cryptography',
        'poincare': 'Poincaré Conjecture',
        'prime-pattern': 'Prime Pattern Discovery',
        'twin-primes': 'Twin Prime Conjecture',
        'collatz': 'Collatz Conjecture',
        'perfect-numbers': 'Perfect Number Search',
        'mersenne-primes': 'Mersenne Prime Search',
        'fibonacci-patterns': 'Fibonacci Pattern Analysis',
        'pascal-triangle': 'Pascal Triangle Research',
        'euclidean-geometry': 'Euclidean Geometry',
        'algebraic-topology': 'Algebraic Topology'
      };
      
      const workType = workTypeMap[selectedEngine] || 'Prime Pattern Discovery';
      const requestBody = {
        workType: workType,
        difficulty: 25,
        action: 'start'
      };
      
      // Attach demo user id/address for persistence
      try {
        window.localStorage.setItem('USER_ID', '1');
        const addr = window.localStorage.getItem('WALLET_ADDRESS') || '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6';
        window.localStorage.setItem('WALLET_ADDRESS', addr);
      } catch {}
      
      if (miningMode === 'continuous') {
        startContinuousMiningMutation.mutate();
      } else {
        startMiningMutation.mutate(requestBody);
      }
    }
  };

  const handleStopMining = () => {
    if (miningMode === 'continuous') {
      stopContinuousMiningMutation.mutate();
    } else {
      stopMiningMutation.mutate();
    }
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
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toLocaleString();
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

  // Available mathematical engines from API or fallback
  const availableEngines = (engines?.engines || []).map((engine, index) => ({
    ...engine,
    id: engine.id || engine.name?.toLowerCase().replace(/\s+/g, '-') || `engine-${index}`,
    icon: engine.icon || <FaCog />,
    complexity: engine.complexity || 'High',
    currentHashrate: engine.currentHashrate || 50000,
    totalDiscoveries: engine.totalDiscoveries || 100,
    estimatedReward: engine.estimatedReward || 20000
  })).length > 0 ? (engines?.engines || []).map((engine, index) => ({
    ...engine,
    id: engine.id || engine.name?.toLowerCase().replace(/\s+/g, '-') || `engine-${index}`,
    icon: engine.icon || <FaCog />,
    complexity: engine.complexity || 'High',
    currentHashrate: engine.currentHashrate || 50000,
    totalDiscoveries: engine.totalDiscoveries || 100,
    estimatedReward: engine.estimatedReward || 20000
  })) : [
    {
      id: 'riemann-zeros',
      name: 'Riemann Zeros',
      description: 'Compute non-trivial zeros of the Riemann zeta function',
      icon: <FaBrain />,
      complexity: 'Ultra-Extreme',
      currentHashrate: 125000,
      totalDiscoveries: 450,
      estimatedReward: 50000
    },
    {
      id: 'yang-mills',
      name: 'Yang-Mills Theory',
      description: 'Solve Yang-Mills field equations for quantum chromodynamics',
      icon: <FaNetworkWired />,
      complexity: 'Ultra-Extreme',
      currentHashrate: 98000,
      totalDiscoveries: 320,
      estimatedReward: 45000
    },
    {
      id: 'goldbach',
      name: 'Goldbach Conjecture',
      description: 'Verify Goldbach conjecture for large even numbers',
      icon: <FaGraduationCap />,
      complexity: 'Extreme',
      currentHashrate: 75000,
      totalDiscoveries: 280,
      estimatedReward: 38000
    },
    {
      id: 'navier-stokes',
      name: 'Navier-Stokes',
      description: 'Solve Navier-Stokes equations for fluid dynamics',
      icon: <FaCog />,
      complexity: 'Ultra-Extreme',
      currentHashrate: 110000,
      totalDiscoveries: 200,
      estimatedReward: 42000
    },
    {
      id: 'birch-swinnerton',
      name: 'Birch-Swinnerton',
      description: 'Compute L-functions for elliptic curves',
      icon: <FaShieldAlt />,
      complexity: 'Extreme',
      currentHashrate: 85000,
      totalDiscoveries: 180,
      estimatedReward: 35000
    },
    {
      id: 'ecc',
      name: 'Elliptic Curve Crypto',
      description: 'Generate secure elliptic curve parameters',
      icon: <FaRocket />,
      complexity: 'High',
      currentHashrate: 65000,
      totalDiscoveries: 150,
      estimatedReward: 28000
    },
    {
      id: 'lattice',
      name: 'Lattice Cryptography',
      description: 'Post-quantum cryptographic algorithms',
      icon: <FaNetworkWired />,
      complexity: 'Ultra-Extreme',
      currentHashrate: 95000,
      totalDiscoveries: 120,
      estimatedReward: 40000
    },
    {
      id: 'poincare',
      name: 'Poincaré Conjecture',
      description: 'Topological manifold analysis',
      icon: <FaBrain />,
      complexity: 'Ultra-Extreme',
      currentHashrate: 105000,
      totalDiscoveries: 90,
      estimatedReward: 48000
    },
    {
      id: 'prime-pattern',
      name: 'Prime Pattern Discovery',
      description: 'Advanced prime number pattern recognition',
      icon: <FaCog />,
      complexity: 'High',
      currentHashrate: 55000,
      totalDiscoveries: 200,
      estimatedReward: 25000
    },
    {
      id: 'twin-primes',
      name: 'Twin Prime Conjecture',
      description: 'Search for twin prime pairs and patterns',
      icon: <FaGraduationCap />,
      complexity: 'Extreme',
      currentHashrate: 68000,
      totalDiscoveries: 95,
      estimatedReward: 32000
    },
    {
      id: 'collatz',
      name: 'Collatz Conjecture',
      description: 'Verify Collatz sequence convergence patterns',
      icon: <FaBrain />,
      complexity: 'High',
      currentHashrate: 72000,
      totalDiscoveries: 160,
      estimatedReward: 30000
    },
    {
      id: 'perfect-numbers',
      name: 'Perfect Number Search',
      description: 'Discover new perfect numbers and properties',
      icon: <FaShieldAlt />,
      complexity: 'Extreme',
      currentHashrate: 88000,
      totalDiscoveries: 75,
      estimatedReward: 36000
    },
    {
      id: 'mersenne-primes',
      name: 'Mersenne Prime Search',
      description: 'Find new Mersenne prime numbers',
      icon: <FaRocket />,
      complexity: 'Ultra-Extreme',
      currentHashrate: 115000,
      totalDiscoveries: 45,
      estimatedReward: 52000
    },
    {
      id: 'fibonacci-patterns',
      name: 'Fibonacci Pattern Analysis',
      description: 'Advanced Fibonacci sequence analysis',
      icon: <FaCog />,
      complexity: 'Medium',
      currentHashrate: 45000,
      totalDiscoveries: 220,
      estimatedReward: 22000
    },
    {
      id: 'pascal-triangle',
      name: 'Pascal Triangle Research',
      description: 'Deep analysis of Pascal triangle properties',
      icon: <FaGraduationCap />,
      complexity: 'Medium',
      currentHashrate: 38000,
      totalDiscoveries: 180,
      estimatedReward: 20000
    },
    {
      id: 'euclidean-geometry',
      name: 'Euclidean Geometry',
      description: 'Advanced geometric theorem proving',
      icon: <FaNetworkWired />,
      complexity: 'High',
      currentHashrate: 62000,
      totalDiscoveries: 140,
      estimatedReward: 28000
    },
    {
      id: 'algebraic-topology',
      name: 'Algebraic Topology',
      description: 'Topological invariant computations',
      icon: <FaBrain />,
      complexity: 'Ultra-Extreme',
      currentHashrate: 102000,
      totalDiscoveries: 85,
      estimatedReward: 46000
    },
    {
      id: 'differential-equations',
      name: 'Differential Equations',
      description: 'Solve complex differential equation systems',
      icon: <FaCog />,
      complexity: 'Extreme',
      currentHashrate: 92000,
      totalDiscoveries: 110,
      estimatedReward: 38000
    },
    {
      id: 'number-theory',
      name: 'Number Theory Research',
      description: 'Advanced number theory problem solving',
      icon: <FaGraduationCap />,
      complexity: 'High',
      currentHashrate: 78000,
      totalDiscoveries: 130,
      estimatedReward: 32000
    },
    {
      id: 'cryptographic-hash',
      name: 'Cryptographic Hash Analysis',
      description: 'Analysis of cryptographic hash functions',
      icon: <FaShieldAlt />,
      complexity: 'High',
      currentHashrate: 85000,
      totalDiscoveries: 95,
      estimatedReward: 34000
    }
  ];

  // Current mining statistics from API
  const currentStats = {
    hashrate: miningStatus?.hashrate || networkStats?.hashRate || 0,
    shares: engineStats?.totalDiscoveries || 0,
    rewards: miningStatus?.rewards || 0,
    uptime: miningStatus?.uptime || 0,
    activeMiners: networkStats?.activeNodes || 0,
    totalDiscoveries: engineStats?.totalDiscoveries || 0,
    averageBlockTime: networkStats?.averageBlockTime || 0,
    difficulty: networkStats?.currentDifficulty || 0
  };

  return (
    <div className="mining">
      <div className="mining-container">
        {/* Header */}
        <motion.div
          className="mining-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="header-content">
            <h1>Mathematical Mining</h1>
            <p>Select a mathematical engine and start contributing to scientific discoveries</p>
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
              console.log(`🎯 Rendering engine ${engine.id}: selected=${isSelected}, selectedEngine=${selectedEngine}`);
              return (
              <motion.div
                key={engine.id}
                className={`engine-option ${selectedEngine === engine.id ? 'selected' : ''}`}
                data-engine-id={engine.id}
                data-selected={selectedEngine === engine.id}
                onClick={() => {
                  console.log('🎯 Engine selected:', engine.id, engine.name);
                  console.log('🎯 Current selectedEngine state:', selectedEngine);
                  console.log('🎯 Is this engine currently selected?', selectedEngine === engine.id);
                  setSelectedEngine(engine.id);
                  console.log('🎯 Selected engine state updated to:', engine.id);
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
                    <span className="hashrate">{formatHashrate(engine.currentHashrate)}</span>
                    <span className="discoveries">{engine.totalDiscoveries} discoveries</span>
                  </div>
                  <div className="estimated-reward">
                    Est. Reward: {formatCurrency(engine.estimatedReward)}/day
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
                disabled={!selectedEngine || isMining || isContinuousMining || startMiningMutation.isLoading || startContinuousMiningMutation.isLoading}
              >
                <FaPlay />
                {startMiningMutation.isLoading || startContinuousMiningMutation.isLoading ? 'Starting...' : 
                 miningMode === 'continuous' ? 'Start Continuous Mining' : 'Start Mining'}
              </button>
              
              <button
                className={`control-btn stop-btn ${!isMining && !isContinuousMining ? 'disabled' : ''}`}
                onClick={handleStopMining}
                disabled={!isMining && !isContinuousMining || stopMiningMutation.isLoading || stopContinuousMiningMutation.isLoading}
              >
                <FaStop />
                {stopMiningMutation.isLoading || stopContinuousMiningMutation.isLoading ? 'Stopping...' : 
                 miningMode === 'continuous' ? 'Stop Continuous Mining' : 'Stop Mining'}
              </button>
              
              {/* Test popup button for development */}
              <button
                className="control-btn test-btn"
                onClick={() => triggerMiningSuccess()}
                style={{ 
                  background: 'linear-gradient(135deg, #ff6b6b, #feca57)',
                  marginLeft: '10px'
                }}
              >
                🎉 Test Success Popup
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
                <h4>Total Shares</h4>
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
                <h4>Network Difficulty</h4>
                <p className="stat-value">{formatNumber(currentStats.difficulty)}</p>
                <p className="stat-description">Current difficulty</p>
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
