import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from 'react-query';
import {
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  FaChartLine,
  FaCoins,
  FaUsers,
  FaRocket,
  FaNetworkWired,
  FaServer,
  FaClock,
  FaArrowUp,
  FaArrowDown,
  FaCog,
  FaShieldAlt,
  FaBrain,
  FaWallet,
  FaExclamationTriangle,
  FaCheckCircle
} from 'react-icons/fa';
import web3Service from '../services/web3Service';
import { backendAPI, mathEngineAPI } from '../utils/api';
import './Dashboard.css';

const Dashboard = () => {
  try {
    const [timeRange, setTimeRange] = useState('24h');
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
        return await web3Service.getContractInfo();
      },
      { 
        refetchInterval: 30000,
        enabled: web3Connected
      }
    );

    // Fetch miner statistics from Web3Service
    const { data: minerStats, isLoading: minerLoading } = useQuery(
      ['minerStats', currentAccount],
      async () => {
        if (!web3Service.isWeb3Connected() || !currentAccount) return null;
        return await web3Service.getMinerStats(currentAccount);
      },
      { 
        refetchInterval: 30000,
        enabled: web3Connected && !!currentAccount
      }
    );

    // Fetch staking information from Web3Service
    const { data: stakingInfo, isLoading: stakingLoading } = useQuery(
      ['stakingInfo', currentAccount],
      async () => {
        if (!web3Service.isWeb3Connected() || !currentAccount) return null;
        return await web3Service.getStakingInfo(currentAccount);
      },
      { 
        refetchInterval: 30000,
        enabled: web3Connected && !!currentAccount
      }
    );

    // Fetch dashboard data from backend (combined endpoint)
    const { data: dashboardData, isLoading: dashboardLoading } = useQuery(
      ['dashboardData'],
      () => backendAPI.getDashboardData(),
      { 
        refetchInterval: 30000,
        onSuccess: (data) => {
          console.log('🎯 Dashboard - Dashboard data received:', data);
        },
        onError: (error) => {
          console.error('❌ Dashboard - Dashboard data error:', error);
        }
      }
    );

    // Fetch real token data from backend (non-blockchain data)
    const { data: tokenData, isLoading: tokenLoading } = useQuery(
      ['tokenData'],
      () => backendAPI.getTokenData(),
      { 
        refetchInterval: 30000,
        onSuccess: (data) => {
          console.log('🎯 Dashboard - Token data received:', data);
        },
        onError: (error) => {
          console.error('❌ Dashboard - Token data error:', error);
        }
      }
    );

    // Fetch real engine distribution from mathematical engine
    const { data: engineDistribution, isLoading: engineLoading } = useQuery(
      ['engineDistribution'],
      () => mathEngineAPI.getEngineDistribution(),
      { 
        refetchInterval: 30000,
        onSuccess: (data) => {
          console.log('🎯 Dashboard - Engine distribution received:', data);
        },
        onError: (error) => {
          console.error('❌ Dashboard - Engine distribution error:', error);
        }
      }
    );

    // Fetch discoveries from backend (non-blockchain data)
    const { data: discoveries, isLoading: discoveriesLoading } = useQuery(
      ['discoveries'],
      () => mathEngineAPI.getDiscoveries(),
      { 
        refetchInterval: 30000,
        onSuccess: (data) => {
          console.log('🎯 Dashboard - Discoveries received:', data);
        },
        onError: (error) => {
          console.error('❌ Dashboard - Discoveries error:', error);
        }
      }
    );

    // Format data for charts
    const formatNumber = (num) => {
      if (!num) return '0';
      
      // Handle string inputs (from web3Service BigInt conversions)
      let numberValue;
      if (typeof num === 'string') {
        numberValue = parseFloat(num);
      } else if (typeof num === 'bigint') {
        numberValue = Number(num);
      } else {
        numberValue = num;
      }
      
      // Handle NaN or invalid values
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

    const formatCurrency = (amount) => {
      if (!amount) return '0 MINED';
      
      // Handle string inputs
      let numberValue;
      if (typeof amount === 'string') {
        numberValue = parseFloat(amount);
      } else if (typeof amount === 'bigint') {
        numberValue = Number(amount);
      } else {
        numberValue = amount;
      }
      
      if (isNaN(numberValue)) {
        return '0 MINED';
      }
      
      return `${formatNumber(numberValue)} MINED`;
    };

    const formatHashrate = (hashrate) => {
      if (!hashrate) return '0 H/s';
      
      if (typeof hashrate === 'string' && hashrate.includes('H/s')) {
        return hashrate;
      }
      
      // Handle string inputs
      let numberValue;
      if (typeof hashrate === 'string') {
        numberValue = parseFloat(hashrate);
      } else if (typeof hashrate === 'bigint') {
        numberValue = Number(hashrate);
      } else {
        numberValue = hashrate;
      }
      
      if (isNaN(numberValue)) {
        return '0 H/s';
      }
      
      if (numberValue >= 1000000) {
        return (numberValue / 1000000).toFixed(1) + ' TH/s';
      } else if (numberValue >= 1000) {
        return (numberValue / 1000).toFixed(1) + ' GH/s';
      }
      return numberValue.toLocaleString() + ' H/s';
    };

    const formatAddress = (addr) => {
      if (!addr) return '';
      return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };

    // Prepare chart data
    const networkStats = {
      totalStaked: contractInfo?.totalStaked || 0,
      maxDifficulty: contractInfo?.maxDifficulty || 0,
      baseReward: contractInfo?.baseReward || 0,
      paused: contractInfo?.paused || false,
      owner: contractInfo?.owner || '0x0000...0000'
    };

    // Use dashboard data for critical statistics
    const dashboardStats = {
      activeMiners: dashboardData?.activeMiners || 0,
      totalUsers: dashboardData?.users?.total || 0,
      totalSessions: dashboardData?.mining?.totalSessions || 0,
      totalCoinsEarned: dashboardData?.mining?.totalCoinsEarned || 0,
      totalPapers: dashboardData?.research?.totalPapers || 0,
      totalDiscoveries: dashboardData?.research?.totalDiscoveries || 0,
      totalCitations: dashboardData?.research?.totalCitations || 0,
      avgComplexity: dashboardData?.research?.avgComplexity || 0
    };

    const userStats = {
      totalSessions: minerStats?.totalSessions || 0,
      totalDiscoveries: minerStats?.totalDiscoveries || 0,
      totalRewards: minerStats?.totalRewards || 0,
      stakedAmount: minerStats?.stakedAmount || 0,
      pendingRewards: stakingInfo?.rewards || 0
    };

    const tokenStats = tokenData?.data || {
      totalSupply: 1000000000,
      circulatingSupply: 500000000,
      marketCap: 25000000,
      price: 0.05
    };

    const engineStats = engineDistribution?.engines || [];

    return (
      <div className="dashboard">
        <div className="dashboard-container">
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
              <strong>Wallet Not Connected</strong> - Connect your MetaMask wallet to view your personal dashboard data.
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
            className="dashboard-header"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="header-content">
              <h1>Dashboard</h1>
              <p>Real-time overview of the ProductiveMiner platform</p>
            </div>
          </motion.div>

          {/* Network Statistics */}
          <motion.div
            className="network-stats"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h3>Network Statistics</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">
                  <FaShieldAlt />
                </div>
                <div className="stat-content">
                  <h4>Total Staked</h4>
                  <p className="stat-value">{formatCurrency(networkStats.totalStaked)}</p>
                  <p className="stat-description">Total tokens staked in contract</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  <FaCog />
                </div>
                <div className="stat-content">
                  <h4>Max Difficulty</h4>
                  <p className="stat-value">{formatNumber(networkStats.maxDifficulty)}</p>
                  <p className="stat-description">Maximum mining difficulty</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  <FaCoins />
                </div>
                <div className="stat-content">
                  <h4>Base Reward</h4>
                  <p className="stat-value">{formatCurrency(networkStats.baseReward)}</p>
                  <p className="stat-description">Base mining reward</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  <FaServer />
                </div>
                <div className="stat-content">
                  <h4>Contract Status</h4>
                  <p className="stat-value">{networkStats.paused ? 'Paused' : 'Active'}</p>
                  <p className="stat-description">Contract operational status</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Platform Statistics */}
          <motion.div
            className="platform-stats"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <h3>Platform Statistics</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">
                  <FaUsers />
                </div>
                <div className="stat-content">
                  <h4>Active Miners</h4>
                  <p className="stat-value">{formatNumber(dashboardStats.activeMiners)}</p>
                  <p className="stat-description">Miners active in last 24 hours</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  <FaBrain />
                </div>
                <div className="stat-content">
                  <h4>Global Mathematical Researchers</h4>
                  <p className="stat-value">{formatNumber(dashboardStats.totalUsers)}</p>
                  <p className="stat-description">Total registered researchers</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  <FaRocket />
                </div>
                <div className="stat-content">
                  <h4>Total Discoveries</h4>
                  <p className="stat-value">{formatNumber(dashboardStats.totalDiscoveries)}</p>
                  <p className="stat-description">Mathematical breakthroughs</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  <FaShieldAlt />
                </div>
                <div className="stat-content">
                  <h4>Bit Strength</h4>
                  <p className="stat-value">{formatNumber(dashboardStats.avgComplexity)} bits</p>
                  <p className="stat-description">Cryptographic security added</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Research Statistics */}
          <motion.div
            className="research-stats"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h3>Research Statistics</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">
                  <FaChartLine />
                </div>
                <div className="stat-content">
                  <h4>Total Papers</h4>
                  <p className="stat-value">{formatNumber(dashboardStats.totalPapers)}</p>
                  <p className="stat-description">Published research papers</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  <FaBrain />
                </div>
                <div className="stat-content">
                  <h4>Total Discoveries</h4>
                  <p className="stat-value">{formatNumber(dashboardStats.totalDiscoveries)}</p>
                  <p className="stat-description">Mathematical discoveries</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  <FaArrowUp />
                </div>
                <div className="stat-content">
                  <h4>Total Citations</h4>
                  <p className="stat-value">{formatNumber(dashboardStats.totalCitations)}</p>
                  <p className="stat-description">Research citations</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  <FaCog />
                </div>
                <div className="stat-content">
                  <h4>Avg Complexity</h4>
                  <p className="stat-value">{formatNumber(dashboardStats.avgComplexity)}</p>
                  <p className="stat-description">Average computational complexity</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* User Statistics (only show if connected) */}
          {web3Connected && (
            <motion.div
              className="user-stats"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h3>Your Statistics</h3>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">
                    <FaRocket />
                  </div>
                  <div className="stat-content">
                    <h4>Total Sessions</h4>
                    <p className="stat-value">{userStats.totalSessions}</p>
                    <p className="stat-description">Your mining sessions</p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">
                    <FaBrain />
                  </div>
                  <div className="stat-content">
                    <h4>Total Discoveries</h4>
                    <p className="stat-value">{userStats.totalDiscoveries}</p>
                    <p className="stat-description">Your mathematical discoveries</p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">
                    <FaCoins />
                  </div>
                  <div className="stat-content">
                    <h4>Total Rewards</h4>
                    <p className="stat-value">{formatCurrency(userStats.totalRewards)}</p>
                    <p className="stat-description">Your earned rewards</p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">
                    <FaShieldAlt />
                  </div>
                  <div className="stat-content">
                    <h4>Staked Amount</h4>
                    <p className="stat-value">{formatCurrency(userStats.stakedAmount)}</p>
                    <p className="stat-description">Your staked tokens</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Token Statistics */}
          <motion.div
            className="token-stats"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h3>Token Statistics</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">
                  <FaChartLine />
                </div>
                <div className="stat-content">
                  <h4>Total Supply</h4>
                  <p className="stat-value">{formatNumber(tokenStats.totalSupply)}</p>
                  <p className="stat-description">Total MINED tokens</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  <FaUsers />
                </div>
                <div className="stat-content">
                  <h4>Circulating Supply</h4>
                  <p className="stat-value">{formatNumber(tokenStats.circulatingSupply)}</p>
                  <p className="stat-description">Tokens in circulation</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  <FaCoins />
                </div>
                <div className="stat-content">
                  <h4>Market Cap</h4>
                  <p className="stat-value">${formatNumber(tokenStats.marketCap)}</p>
                  <p className="stat-description">Total market capitalization</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  <FaArrowUp />
                </div>
                <div className="stat-content">
                  <h4>Token Price</h4>
                  <p className="stat-value">${tokenStats.price}</p>
                  <p className="stat-description">Current MINED price</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Mathematical Engine Distribution */}
          {engineStats.length > 0 && (
            <motion.div
              className="engine-distribution"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <h3>Mathematical Engine Distribution</h3>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={engineStats}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="totalDiscoveries"
                    >
                      {engineStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`hsl(${index * 30}, 70%, 60%)`} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}

          {/* Recent Discoveries */}
          {discoveries && discoveries.length > 0 && (
            <motion.div
              className="recent-discoveries"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <h3>Recent Mathematical Discoveries</h3>
              <div className="discoveries-grid">
                {discoveries.slice(0, 6).map((discovery, index) => (
                  <div key={index} className="discovery-card">
                    <div className="discovery-icon">
                      <FaBrain />
                    </div>
                    <div className="discovery-content">
                      <h4>{discovery.title || `Discovery ${index + 1}`}</h4>
                      <p>{discovery.description || 'Mathematical breakthrough'}</p>
                      <span className="discovery-type">{discovery.type || 'Research'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    );
  } catch (error) {
    console.error('Dashboard error:', error);
    return (
      <div className="dashboard">
        <div className="dashboard-container">
          <div className="error-message">
            <h2>Dashboard Error</h2>
            <p>Something went wrong loading the dashboard. Please try refreshing the page.</p>
            <p>Error: {error.message}</p>
          </div>
        </div>
      </div>
    );
  }
};

export default Dashboard;
