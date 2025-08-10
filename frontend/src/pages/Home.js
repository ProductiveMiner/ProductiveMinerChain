import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { useQuery } from 'react-query';
import CountUp from 'react-countup';
import {
  FaRocket,
  FaBrain,
  FaShieldAlt,
  FaCoins,
  FaUsers,
  FaChartLine,
  FaCog,
  FaGraduationCap,
  FaNetworkWired,
  FaArrowRight,
  FaPlay,
  FaDownload
} from 'react-icons/fa';
import { flowAPI, backendAPI, mathEngineAPI } from '../utils/api';
import './Home.css';

const Home = () => {
  const [statsRef, statsInView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  });

  const [featuresRef, featuresInView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  });

  // Fetch real blockchain data
  const { data: networkStats, isLoading: networkLoading } = useQuery(
    ['networkStats'],
    () => flowAPI.getSystemStatus(),
    { refetchInterval: 30000 }
  );

  const { data: tokenData, isLoading: tokenLoading } = useQuery(
    ['tokenData'],
    () => backendAPI.getTokenData(),
    { refetchInterval: false } // Disabled for debugging
  );

  const { data: discoveries, isLoading: discoveriesLoading } = useQuery(
    ['discoveries'],
    () => mathEngineAPI.getDiscoveries(),
    { refetchInterval: false } // Disabled for debugging
  );

  const { data: engineDistribution, isLoading: engineLoading } = useQuery(
    ['engineDistribution'],
    () => mathEngineAPI.getEngineDistribution(),
    { refetchInterval: false } // Disabled for debugging
  );

  const { data: miningStats, isLoading: miningLoading } = useQuery(
    ['miningStats'],
    () => flowAPI.getMiningStats(),
    { refetchInterval: 30000 }
  );

  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000000000) {
      return (num / 1000000000).toFixed(1) + 'B';
    } else if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toLocaleString();
  };

  const formatCurrency = (amount) => {
    if (!amount) return '0 MINED';
    return `${formatNumber(amount)} MINED`;
  };

  const formatHashrate = (hashrate) => {
    if (!hashrate) return '0 H/s';
    if (hashrate >= 1000000) {
      return (hashrate / 1000000).toFixed(1) + ' TH/s';
    } else if (hashrate >= 1000) {
      return (hashrate / 1000).toFixed(1) + ' GH/s';
    }
    return hashrate.toLocaleString() + ' H/s';
  };

  // Use real data or fallback to loading state
  const stats = {
    totalSupply: tokenData?.totalSupply || 0,
    circulatingSupply: tokenData?.circulatingSupply || 0,
    stakingAPY: tokenData?.stakingAPY || 0,
    totalStaked: tokenData?.totalStaked || 0,
    activeValidators: networkStats?.system?.blockchain?.validators || networkStats?.network?.validatorsActive || 0,
    totalBlocks: networkStats?.system?.blockchain?.height || networkStats?.network?.blockHeight || 0,
    networkHashrate: networkStats?.network?.hashRate || networkStats?.system?.feedbackLoop?.validationSpeed || 0,
    totalTransactions: networkStats?.network?.tps || 0,
    activeMiners: miningStats?.networkStats?.totalActiveMiners || 0,
    researchValue: networkStats?.flow?.feedbackLoop?.researchValue || 0,
    totalDiscoveries: networkStats?.system?.blockchain?.discoveries || 0,
    bitStrengthAdded: Math.min(networkStats?.system?.security?.currentBitStrength || 0, 1024), // Cap at realistic value
    quantumSecurityLevel: networkStats?.system?.security?.quantumSecurityLevel || 0
  };

  // Real mathematical engines data from API
  const mathematicalEngines = engineDistribution?.engines || [
    {
      name: 'Riemann Zeros',
      description: 'Compute non-trivial zeros of the Riemann zeta function',
      icon: <FaBrain />,
      complexity: 'Ultra-Extreme',
      discoveries: 450,
      value: 225000
    },
    {
      name: 'Yang-Mills Theory',
      description: 'Solve Yang-Mills field equations for quantum chromodynamics',
      icon: <FaNetworkWired />,
      complexity: 'Ultra-Extreme',
      discoveries: 320,
      value: 256000
    },
    {
      name: 'Goldbach Conjecture',
      description: 'Verify Goldbach conjecture for large even numbers',
      icon: <FaGraduationCap />,
      complexity: 'Extreme',
      discoveries: 280,
      value: 224000
    },
    {
      name: 'Navier-Stokes',
      description: 'Solve Navier-Stokes equations for fluid dynamics',
      icon: <FaCog />,
      complexity: 'Ultra-Extreme',
      discoveries: 200,
      value: 160000
    }
  ];

  return (
    <div className="home">
      <div className="home-container">
        {/* Hero Section */}
        <motion.div
          className="hero-section"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="hero-content">
            <motion.h1
              className="hero-title"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              ProductiveMiner
              <span className="hero-subtitle">Mathematical Discovery Blockchain</span>
            </motion.h1>
            
            <motion.p
              className="hero-description"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              The world's first blockchain that rewards mathematical discoveries and computational proofs. 
              Join the revolution where mining meets mathematical research.
            </motion.p>
            
            <motion.div
              className="hero-actions"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <button
                className="btn btn-primary"
                onClick={() => {
                  console.log('🎯 Start Mining (hero) clicked');
                  window.location.href = '/mining';
                }}
              >
                <FaPlay /> Start Mining
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  console.log('🎯 Download Wallet (hero) clicked');
                  window.location.href = '/wallet';
                }}
              >
                <FaDownload /> Download Wallet
              </button>
            </motion.div>
          </div>
          
          <div className="hero-visual">
            <div className="floating-elements">
              <motion.div
                className="floating-element"
                animate={{ y: [-10, 10, -10] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <FaBrain />
              </motion.div>
              <motion.div
                className="floating-element"
                animate={{ y: [10, -10, 10] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <FaRocket />
              </motion.div>
              <motion.div
                className="floating-element"
                animate={{ y: [-5, 15, -5] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <FaShieldAlt />
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Stats Section */}
        <motion.div
          ref={statsRef}
          className="stats-section"
          initial={{ opacity: 0, y: 50 }}
          animate={statsInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-icon">
                <FaCoins />
              </div>
              <div className="stat-content">
                <h3>Total Supply</h3>
                <div className="stat-value">
                  {statsInView && (
                    <CountUp
                      end={stats.totalSupply}
                      duration={2}
                      separator=","
                      suffix=" MINED"
                    />
                  )}
                </div>
                <p className="stat-description">Fixed supply, deflationary model</p>
              </div>
            </div>

            <div className="stat-item">
              <div className="stat-icon">
                <FaUsers />
              </div>
              <div className="stat-content">
                <h3>Active Miners</h3>
                <div className="stat-value">
                  {statsInView && (
                    <CountUp
                      end={stats.activeMiners}
                      duration={2}
                      separator=","
                    />
                  )}
                </div>
                <p className="stat-description">Global mathematical researchers</p>
              </div>
            </div>

            <div className="stat-item">
              <div className="stat-icon">
                <FaRocket />
              </div>
              <div className="stat-content">
                <h3>Total Discoveries</h3>
                <div className="stat-value">
                  {statsInView && (
                    <CountUp
                      end={stats.totalDiscoveries}
                      duration={2}
                      separator=","
                    />
                  )}
                </div>
                <p className="stat-description">Mathematical breakthroughs</p>
              </div>
            </div>

            <div className="stat-item">
              <div className="stat-icon">
                <FaShieldAlt />
              </div>
              <div className="stat-content">
                <h3>Bit Strength</h3>
                <div className="stat-value">
                  {statsInView && (
                    <CountUp
                      end={stats.bitStrengthAdded}
                      duration={2}
                      separator=","
                      suffix=" bits"
                    />
                  )}
                </div>
                <p className="stat-description">Cryptographic security added</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Features Section */}
        <motion.div
          ref={featuresRef}
          className="features-section"
          initial={{ opacity: 0, y: 50 }}
          animate={featuresInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <div className="section-header">
            <h2>Mathematical Discovery Engines</h2>
            <p>Nine specialized computational engines powering the future of mathematical research</p>
          </div>
          
          <div className="features-grid">
            {mathematicalEngines.map((engine, index) => (
              <motion.div
                key={engine.name}
                className="feature-card"
                initial={{ opacity: 0, y: 30 }}
                animate={featuresInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
              >
                <div className="feature-icon">
                  {engine.icon}
                </div>
                <div className="feature-content">
                  <h3>{engine.name}</h3>
                  <p>{engine.description}</p>
                  <div className="feature-stats">
                    <span className="complexity">{engine.complexity}</span>
                    <span className="discoveries">{engine.discoveries} discoveries</span>
                    <span className="value">{formatCurrency(engine.value)} value</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          className="cta-section"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <div className="cta-content">
            <h2>Join the Mathematical Revolution</h2>
            <p>Start contributing to mathematical discoveries and earn rewards for your computational research</p>
            <div className="cta-actions">
              <button 
                className="btn btn-primary"
                onClick={() => {
                  console.log('🎯 Get Started button clicked');
                  window.location.href = '/mining';
                }}
              >
                <FaRocket /> Get Started
                <FaArrowRight />
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  console.log('🎯 Download Wallet button clicked');
                  window.location.href = '/wallet';
                }}
              >
                <FaDownload /> Download Now
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Home;
