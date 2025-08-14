import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from 'react-query';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  FaUsers,
  FaShieldAlt,
  FaChartLine,
  FaClock,
  FaArrowUp,
  FaArrowDown,
  FaCog,
  FaCoins,
  FaRocket,
  FaBrain,
  FaWallet,
  FaExclamationTriangle,
  FaCheckCircle,
  FaServer,
  FaNetworkWired
} from 'react-icons/fa';
import { web3Service } from '../services/web3Service';
import { backendAPI, flowAPI } from '../utils/api';
import './Validators.css';

const Validators = () => {
  const [web3Connected, setWeb3Connected] = useState(false);
  const [currentAccount, setCurrentAccount] = useState(null);
  const [currentNetwork, setCurrentNetwork] = useState(null);

  // Initialize Web3 connection
  useEffect(() => {
    const initializeWeb3 = async () => {
      try {
        const connected = await web3Service.initialize();
        if (connected) {
          setWeb3Connected(true);
          setCurrentAccount(web3Service.getCurrentAccount());
          setCurrentNetwork(web3Service.getCurrentNetwork());
        }
      } catch (error) {
        console.error('Failed to initialize Web3:', error);
      }
    };

    initializeWeb3();
  }, []);

  // Fetch contract information from Web3Service
  const { data: contractInfo, isLoading: contractLoading } = useQuery(
    ['contractInfo'],
    async () => {
      if (!web3Service.isWeb3Connected()) return null;
              return await web3Service.getTokenInfo();
    },
    { 
      refetchInterval: 30000,
      enabled: web3Connected
    }
  );

  // Fetch network stats from backend (using working endpoint)
  const { data: networkStats, isLoading: networkLoading } = useQuery(
    ['networkStats'],
    () => backendAPI.getContractNetworkStats(),
    { 
      refetchInterval: 30000,
      onSuccess: (data) => {
        console.log('🎯 Validators - Network stats received:', data);
      },
      onError: (error) => {
        console.error('❌ Validators - Network stats error:', error);
      }
    }
  );

  // Fetch validators data from blockchain
  const { data: validatorsData, isLoading: validatorsLoading } = useQuery(
    ['validators'],
    () => backendAPI.getValidators(),
    { 
      refetchInterval: 30000,
      onSuccess: (data) => {
        console.log('🎯 Validators - Validators data received:', data);
      },
      onError: (error) => {
        console.error('❌ Validators - Validators data error:', error);
      }
    }
  );

      const formatNumber = (num) => {
      if (!num) return '0';
      // Convert BigInt to Number if needed
      const numberValue = typeof num === 'bigint' ? Number(num) : num;
      if (numberValue >= 1000000) {
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

  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatHashrate = (hashrate) => {
    if (!hashrate) return '0 H/s';
    
    if (typeof hashrate === 'string' && hashrate.includes('H/s')) {
      return hashrate;
    }
    
    if (hashrate >= 1000000) {
      return (hashrate / 1000000).toFixed(1) + ' TH/s';
    } else if (hashrate >= 1000) {
      return (hashrate / 1000).toFixed(1) + ' GH/s';
    }
    return hashrate.toLocaleString() + ' H/s';
  };

  // Real validator data from blockchain contract
  const validatorNetwork = {
    totalValidators: validatorsData?.data?.totalValidators || 0,
    activeValidators: validatorsData?.data?.activeValidators || 0,
    validatorAddresses: validatorsData?.data?.validators?.map(v => v.address) || [],
    stakingDistribution: {
      totalStakingPool: formatCurrency(validatorsData?.data?.totalStaked || 0),
      perValidator: formatCurrency(validatorsData?.data?.averageStake || 0),
      validatorNames: validatorsData?.data?.validators?.map(v => formatAddress(v.address)) || []
    }
  };

  // Prepare data for charts
  const networkData = {
    totalStaked: contractInfo?.totalStaked || 0,
    maxDifficulty: contractInfo?.maxDifficulty || 0,
    baseReward: contractInfo?.baseReward || 0,
    paused: contractInfo?.paused || false,
    owner: contractInfo?.owner || '0x0000...0000'
  };

  const validatorsStats = {
    totalValidators: validatorsData?.data?.totalValidators || 0,
    activeValidators: validatorsData?.data?.activeValidators || 0,
    totalStaked: formatCurrency(validatorsData?.data?.totalStaked || 0),
    averageStake: formatCurrency(validatorsData?.data?.averageStake || 0)
  };

  const hashrateStats = {
    totalHashrate: networkStats?.data?.currentActiveSessions || 0,
    averageHashrate: networkStats?.data?.currentActiveSessions || 0,
    peakHashrate: networkStats?.data?.currentActiveSessions || 0,
    activeNodes: networkStats?.data?.totalValidators || 0
  };

  const stakingStats = {
    totalStaked: validatorsData?.data?.totalStaked || 0,
    averageAPY: 0, // Will be calculated from real contract data
    totalRewards: validatorsData?.data?.validators?.reduce((sum, v) => sum + (v.totalValidations || 0), 0) || 0,
    activeStakers: validatorsData?.data?.activeValidators || 0
  };

  return (
    <div className="validators">
      <div className="validators-container">
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
            <strong>Wallet Not Connected</strong> - Connect your MetaMask wallet to view detailed validator data.
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
            <FaCheckCircle style={{ marginRight: '10px' }} />
            <strong>Connected to Sepolia Testnet</strong> - Address: {formatAddress(currentAccount)} | Network: {currentNetwork}
          </motion.div>
        )}

        {/* Header */}
        <motion.div
          className="validators-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="header-content">
            <h1>Validators Network</h1>
            <p>Monitor the ProductiveMiner validator network and staking ecosystem</p>
          </div>
        </motion.div>

        {/* Network Overview */}
        <motion.div
          className="network-overview"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h3>Network Overview</h3>
          <div className="overview-grid">
            <div className="overview-card">
              <div className="overview-icon">
                <FaShieldAlt />
              </div>
              <div className="overview-content">
                <h4>Total Staked</h4>
                <p className="overview-value">{formatCurrency(networkData.totalStaked)}</p>
                <p className="overview-description">Total tokens staked in contract</p>
              </div>
            </div>

            <div className="overview-card">
              <div className="overview-icon">
                <FaCog />
              </div>
              <div className="overview-content">
                <h4>Max Difficulty</h4>
                <p className="overview-value">{formatNumber(networkData.maxDifficulty)}</p>
                <p className="overview-description">Maximum mining difficulty</p>
              </div>
            </div>

            <div className="overview-card">
              <div className="overview-icon">
                <FaCoins />
              </div>
              <div className="overview-content">
                <h4>Base Reward</h4>
                <p className="overview-value">{formatCurrency(networkData.baseReward)}</p>
                <p className="overview-description">Base mining reward</p>
              </div>
            </div>

            <div className="overview-card">
              <div className="overview-icon">
                <FaServer />
              </div>
              <div className="overview-content">
                <h4>Contract Status</h4>
                <p className="overview-value">{networkData.paused ? 'Paused' : 'Active'}</p>
                <p className="overview-description">Contract operational status</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Validator Statistics */}
        <motion.div
          className="validator-stats"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h3>Validator Statistics</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">
                <FaUsers />
              </div>
              <div className="stat-content">
                <h4>Total Validators</h4>
                <p className="stat-value">{formatNumber(validatorsStats.totalValidators)}</p>
                <p className="stat-description">Registered validators</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <FaShieldAlt />
              </div>
              <div className="stat-content">
                <h4>Active Validators</h4>
                <p className="stat-value">{formatNumber(validatorsStats.activeValidators)}</p>
                <p className="stat-description">Currently validating</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <FaCoins />
              </div>
              <div className="stat-content">
                <h4>Total Staked</h4>
                <p className="stat-value">{formatCurrency(validatorsStats.totalStaked)}</p>
                <p className="stat-description">Total validator stakes</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <FaChartLine />
              </div>
              <div className="stat-content">
                <h4>Average Stake</h4>
                <p className="stat-value">{formatCurrency(validatorsStats.averageStake)}</p>
                <p className="stat-description">Average validator stake</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Hashrate Statistics */}
        <motion.div
          className="hashrate-stats"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h3>Hashrate Statistics</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">
                <FaNetworkWired />
              </div>
              <div className="stat-content">
                <h4>Total Hashrate</h4>
                <p className="stat-value">{formatHashrate(hashrateStats.totalHashrate)}</p>
                <p className="stat-description">Network total hashrate</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <FaChartLine />
              </div>
              <div className="stat-content">
                <h4>Average Hashrate</h4>
                <p className="stat-value">{formatHashrate(hashrateStats.averageHashrate)}</p>
                <p className="stat-description">Average per validator</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <FaArrowUp />
              </div>
              <div className="stat-content">
                <h4>Peak Hashrate</h4>
                <p className="stat-value">{formatHashrate(hashrateStats.peakHashrate)}</p>
                <p className="stat-description">Highest recorded hashrate</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <FaServer />
              </div>
              <div className="stat-content">
                <h4>Active Nodes</h4>
                <p className="stat-value">{formatNumber(hashrateStats.activeNodes)}</p>
                <p className="stat-description">Currently active nodes</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <FaShieldAlt />
              </div>
              <div className="stat-content">
                <h4>Bit Strength</h4>
                <p className="stat-value">{formatNumber(parseInt(networkStats?.data?.quantumSecurityLevel) || 0)} bits</p>
                <p className="stat-description">Cryptographic security added</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Staking Statistics */}
        <motion.div
          className="staking-stats"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h3>Staking Statistics</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">
                <FaCoins />
              </div>
              <div className="stat-content">
                <h4>Total Staked</h4>
                <p className="stat-value">{formatCurrency(stakingStats.totalStaked)}</p>
                <p className="stat-description">Total staked tokens</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <FaChartLine />
              </div>
              <div className="stat-content">
                <h4>Average APY</h4>
                <p className="stat-value">{stakingStats.averageAPY || 0}%</p>
                <p className="stat-description">Average annual yield</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <FaRocket />
              </div>
              <div className="stat-content">
                <h4>Total Rewards</h4>
                <p className="stat-value">{formatCurrency(stakingStats.totalRewards)}</p>
                <p className="stat-description">Total rewards distributed</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <FaUsers />
              </div>
              <div className="stat-content">
                <h4>Active Stakers</h4>
                <p className="stat-value">{formatNumber(stakingStats.activeStakers)}</p>
                <p className="stat-description">Active staking participants</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Multi-Validator Network Overview */}
        <motion.div
          className="validator-network-overview"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <h3>🏛️ Multi-Validator Network</h3>
          <div className="network-info">
            <div className="info-card">
              <h4>Network Configuration</h4>
              <ul>
                <li><strong>Total Validators:</strong> {validatorNetwork.totalValidators}</li>
                <li><strong>Active Validators:</strong> {validatorNetwork.activeValidators}</li>
                <li><strong>Staking Pool:</strong> {validatorNetwork.stakingDistribution.totalStakingPool}</li>
                <li><strong>Per Validator:</strong> {validatorNetwork.stakingDistribution.perValidator}</li>
              </ul>
            </div>
            <div className="info-card">
              <h4>Network Benefits</h4>
              <ul>
                <li>✅ <strong>Decentralization:</strong> 5 validators vs single point of failure</li>
                <li>✅ <strong>Block Completion:</strong> Parallel processing for faster consensus</li>
                <li>✅ <strong>Discovery Capabilities:</strong> Distributed research validation</li>
                <li>✅ <strong>Network Security:</strong> Enhanced consensus mechanisms</li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Validator List */}
        <motion.div
          className="validator-list"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <h3>Validator Network Members</h3>
          <div className="validator-table">
            <div className="table-header">
              <div className="header-cell">Rank</div>
              <div className="header-cell">Validator</div>
              <div className="header-cell">Address</div>
              <div className="header-cell">Stake</div>
              <div className="header-cell">Status</div>
              <div className="header-cell">Role</div>
            </div>
            <div className="table-body">
              {validatorsLoading ? (
                <div className="table-row">
                  <div className="table-cell" colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
                    Loading validators from blockchain...
                  </div>
                </div>
              ) : validatorsData?.data?.validators?.length > 0 ? (
                validatorsData.data.validators.map((validator, index) => (
                  <div key={index} className="table-row">
                    <div className="table-cell">#{index + 1}</div>
                    <div className="table-cell">
                      <div className="validator-info">
                        <span className="validator-name">Validator #{index + 1}</span>
                        <span className="validator-type">
                          {validator.isActive ? 'Active Validator' : 'Inactive Validator'}
                        </span>
                      </div>
                    </div>
                    <div className="table-cell">
                      <span className="validator-address">{formatAddress(validator.address)}</span>
                    </div>
                    <div className="table-cell">{formatCurrency(validator.stakeAmount)}</div>
                    <div className="table-cell">
                      <span className={`status-badge ${validator.isActive ? 'active' : 'inactive'}`}>
                        {validator.isActive ? <FaCheckCircle /> : <FaExclamationTriangle />}
                        {validator.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="table-cell">
                      <span className="role-badge">
                        {validator.totalValidations > 0 ? `Validations: ${validator.totalValidations}` : 'New Validator'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="table-row">
                  <div className="table-cell" colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
                    No validators found on blockchain. Validators will appear here once they register.
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Performance Charts */}
        <motion.div
          className="performance-charts"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <h3>Network Performance</h3>
          <div className="charts-grid">
            <div className="chart-card">
              <h4>Hashrate Over Time</h4>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={[
                    { time: '00:00', hashrate: 2.1 },
                    { time: '04:00', hashrate: 2.3 },
                    { time: '08:00', hashrate: 2.5 },
                    { time: '12:00', hashrate: 2.4 },
                    { time: '16:00', hashrate: 2.6 },
                    { time: '20:00', hashrate: 2.7 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="time" stroke="rgba(255,255,255,0.6)" />
                    <YAxis stroke="rgba(255,255,255,0.6)" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(0,0,0,0.8)', 
                        border: 'none',
                        borderRadius: '8px',
                        color: 'white'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="hashrate" 
                      stroke="#00ff88" 
                      fill="rgba(0,255,136,0.2)" 
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="chart-card">
              <h4>Validator Distribution</h4>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={[
                    { range: 'No Validators', count: 0 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="range" stroke="rgba(255,255,255,0.6)" />
                    <YAxis stroke="rgba(255,255,255,0.6)" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(0,0,0,0.8)', 
                        border: 'none',
                        borderRadius: '8px',
                        color: 'white'
                      }}
                    />
                    <Bar dataKey="count" fill="#ffd700" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Validators;

