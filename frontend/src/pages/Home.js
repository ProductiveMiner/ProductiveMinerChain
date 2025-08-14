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

  // Fetch real blockchain data - Updated to use correct endpoints
  const { data: tokenData, isLoading: tokenLoading } = useQuery(
    ['tokenData'],
    () => backendAPI.getTokenData(),
    { refetchInterval: 30000 }
  );

  const { data: contractStats, isLoading: contractLoading } = useQuery(
    ['contractStats'],
    () => backendAPI.getContractStats(),
    { refetchInterval: 30000 }
  );

  const { data: validators, isLoading: validatorsLoading } = useQuery(
    ['validators'],
    () => backendAPI.getValidators(),
    { refetchInterval: 30000 }
  );

  const { data: researchStats, isLoading: researchLoading } = useQuery(
    ['researchStats'],
    () => backendAPI.getResearchStats(),
    { refetchInterval: 30000 }
  );

  const { data: engineStats, isLoading: engineLoading } = useQuery(
    ['engineStats'],
    () => backendAPI.getEngineStats(),
    { refetchInterval: 30000 }
  );

  const formatNumber = (num) => {
    if (!num) return '0';
    const numberValue = typeof num === 'bigint' ? Number(num) : num;
    if (numberValue >= 1000000000) {
      return (numberValue / 1000000000).toFixed(1) + 'B';
    } else if (numberValue >= 1000000) {
      return (numberValue / 1000000).toFixed(1) + 'M';
    } else if (numberValue >= 1000) {
      return (numberValue / 1000).toFixed(1) + 'K';
    }
    return numberValue.toLocaleString();
  };

  const formatCurrency = (amount) => {
    if (!amount) return '0 MINED';
    return `${formatNumber(amount)} MINED`;
  };

  // Use real data from updated backend APIs
  const stats = {
    totalSupply: tokenData?.data?.totalSupply || 0,
    circulatingSupply: tokenData?.data?.circulatingSupply || 0,
    stakingAPY: tokenData?.data?.stakingAPY || 0,
    totalStaked: tokenData?.data?.totalStaked || 0,
    activeValidators: validators?.data?.activeValidators || 0,
    totalBlocks: contractStats?.data?.totalBlocks || 0,
    networkHashrate: engineStats?.totalHashrate || 0,
    totalTransactions: contractStats?.data?.totalTransactions || 0,
    activeMiners: engineStats?.totalActiveMiners || 0,
    researchValue: researchStats?.data?.totalResearchValue || 0,
    totalDiscoveries: researchStats?.data?.totalDiscoveries || 0,
    bitStrengthAdded: Math.min(parseInt(contractStats?.data?.quantumSecurityLevel) || 0, 1024),
    quantumSecurityLevel: parseInt(contractStats?.data?.quantumSecurityLevel) || 0
  };

  // Real mathematical engines data from API
  const mathematicalEngines = engineStats?.engines || [];

  return (
    <div className="home">
      <div className="home-container">
        {/* Hero Section */}
        <section className="hero-section">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="hero-content"
          >
            <div className="hero-title">
              <span>ProductiveMiner</span>
            </div>
            <p className="hero-description">Revolutionary Mathematical Discovery Mining Protocol</p>
            <div className="hero-actions">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn btn-primary"
              >
                <FaRocket /> Start Mining
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn btn-secondary"
              >
                <FaDownload /> Learn More
              </motion.button>
            </div>
          </motion.div>
        </section>

        {/* Statistics Section */}
        <section ref={statsRef} className="stats-section">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={statsInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="stats-grid"
          >
            <div className="stat-item">
              <FaCoins className="stat-icon" />
              <div className="stat-content">
                <h3>Total Supply</h3>
                <div className="stat-value">
                  <CountUp end={stats.totalSupply} duration={2} separator="," />
                </div>
                <div className="stat-description">MINED</div>
              </div>
            </div>
            <div className="stat-item">
              <FaUsers className="stat-icon" />
              <div className="stat-content">
                <h3>Active Validators</h3>
                <div className="stat-value">
                  <CountUp end={stats.activeValidators} duration={2} />
                </div>
                <div className="stat-description">Active network validators</div>
              </div>
            </div>
            <div className="stat-item">
              <FaBrain className="stat-icon" />
              <div className="stat-content">
                <h3>Research Value</h3>
                <div className="stat-value">
                  <CountUp end={stats.researchValue} duration={2} separator="," />
                </div>
                <div className="stat-description">Total research value</div>
              </div>
            </div>
            <div className="stat-item">
              <FaNetworkWired className="stat-icon" />
              <div className="stat-content">
                <h3>Total Blocks</h3>
                <div className="stat-value">
                  <CountUp end={stats.totalBlocks} duration={2} separator="," />
                </div>
                <div className="stat-description">Blocks mined</div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Features Section */}
        <section ref={featuresRef} className="features-section">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={featuresInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="features-grid"
          >
            <div className="feature-card">
              <FaBrain className="feature-icon" />
              <div className="feature-content">
                <h3>Mathematical Mining</h3>
                <p>Solve complex mathematical problems and earn MINED tokens</p>
              </div>
            </div>
            <div className="feature-card">
              <FaShieldAlt className="feature-icon" />
              <div className="feature-content">
                <h3>Quantum Security</h3>
                <p>Advanced cryptographic protocols ensure network security</p>
              </div>
            </div>
            <div className="feature-card">
              <FaChartLine className="feature-icon" />
              <div className="feature-content">
                <h3>Research Rewards</h3>
                <p>Contribute to scientific discoveries and earn rewards</p>
              </div>
            </div>
          </motion.div>
        </section>
      </div>
    </div>
  );
};

export default Home;
