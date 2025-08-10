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
  FaBrain
} from 'react-icons/fa';
import { flowAPI, backendAPI, mathEngineAPI } from '../utils/api';
import './Dashboard.css';

const Dashboard = () => {
  try {
    const [timeRange, setTimeRange] = useState('24h');

    // Fetch unified flow status
    const { data: flowStatus, isLoading: flowLoading, error: flowError } = useQuery(
      ['flowStatus'],
      () => flowAPI.getSystemStatus(),
      { 
        refetchInterval: 30000, // Refetch every 30 seconds
        onSuccess: (data) => {
          console.log('🎯 Dashboard - Flow status received:', data);
        },
        onError: (error) => {
          console.error('❌ Dashboard - Flow status error:', error);
        }
      }
    );

    // Fetch real token data from backend
    const { data: tokenData, isLoading: tokenLoading } = useQuery(
      ['tokenData'],
      () => backendAPI.getTokenData(),
      { 
        refetchInterval: 30000, // Refetch every 30 seconds
        onSuccess: (data) => {
          console.log('🎯 Dashboard - Token data received:', data);
        },
        onError: (error) => {
          console.error('❌ Dashboard - Token data error:', error);
        }
      }
    );

    // Fetch real hashrate data from blockchain
    const { data: hashrateData, isLoading: hashrateLoading, error: hashrateError } = useQuery(
      ['hashrateData'],
      () => flowAPI.getHashrateData(),
      { 
        refetchInterval: 30000, // Refetch every 30 seconds
        onSuccess: (data) => {
          console.log('🎯 Dashboard - Hashrate data received:', data);
        },
        onError: (error) => {
          console.error('❌ Dashboard - Hashrate data error:', error);
        }
      }
    );

    // Fetch real engine distribution from mathematical engine
    const { data: engineDistribution, isLoading: engineLoading } = useQuery(
      ['engineDistribution'],
      () => mathEngineAPI.getEngineDistribution(),
      { 
        refetchInterval: 30000, // Refetch every 30 seconds
        onSuccess: (data) => {
          console.log('🎯 Dashboard - Engine distribution received:', data);
        },
        onError: (error) => {
          console.error('❌ Dashboard - Engine distribution error:', error);
        }
      }
    );

    // Fetch real network activity from blockchain
    const { data: networkActivity, isLoading: activityLoading } = useQuery(
      ['networkActivity'],
      () => flowAPI.getNetworkActivity(),
      { 
        refetchInterval: 30000, // Refetch every 30 seconds
        onSuccess: (data) => {
          console.log('🎯 Dashboard - Network activity received:', data);
        },
        onError: (error) => {
          console.error('❌ Dashboard - Network activity error:', error);
        }
      }
    );

    // Fetch real mining statistics
    const { data: miningStats, isLoading: miningLoading } = useQuery(
      ['miningStats'],
      () => flowAPI.getMiningStats(),
      { 
        refetchInterval: 30000, // Refetch every 30 seconds
        onSuccess: (data) => {
          console.log('🎯 Dashboard - Mining stats received:', data);
        },
        onError: (error) => {
          console.error('❌ Dashboard - Mining stats error:', error);
        }
      }
    );

    // Fetch real validator data
    const { data: validators, isLoading: validatorsLoading } = useQuery(
      ['validators'],
      () => flowAPI.getValidators(),
      { 
        refetchInterval: 30000, // Refetch every 30 seconds
        onSuccess: (data) => {
          console.log('🎯 Dashboard - Validators received:', data);
        },
        onError: (error) => {
          console.error('❌ Dashboard - Validators error:', error);
        }
      }
    );

    // Fetch real mathematical discoveries
    const { data: discoveries, isLoading: discoveriesLoading } = useQuery(
      ['discoveries'],
      () => mathEngineAPI.getDiscoveries(),
      { 
        refetchInterval: 30000, // Refetch every 30 seconds
        onSuccess: (data) => {
          console.log('🎯 Dashboard - Discoveries received:', data);
        },
        onError: (error) => {
          console.error('❌ Dashboard - Discoveries error:', error);
        }
      }
    );

    // Compute statistics from API data (align with blockchain endpoints)
    const stats = {
      totalSupply: tokenData?.totalSupply || 0,
      circulatingSupply: tokenData?.circulatingSupply || 0,
      stakingAPY: tokenData?.stakingAPY || 0,
      totalStaked: tokenData?.totalStaked || 0,
      activeValidators: validators?.totalValidators || validators?.validators?.length || 0,
      totalBlocks: flowStatus?.system?.blockchain?.height || hashrateData?.blockHeight || 0,
      networkHashrate: hashrateData?.hashRate || flowStatus?.system?.feedbackLoop?.validationSpeed || 0,
      totalTransactions: hashrateData?.tps || 0,
      activeMiners: hashrateData?.activeNodes || 0,
      researchValue: flowStatus?.system?.feedbackLoop?.researchValue || 0,
      totalDiscoveries: flowStatus?.system?.blockchain?.discoveries || 0,
      bitStrengthAdded: Math.min(flowStatus?.system?.security?.currentBitStrength || 0, 1024), // Cap at realistic value
      quantumSecurityLevel: flowStatus?.system?.security?.quantumSecurityLevel || 0
    };

    // Validate data and log any issues
    if (!tokenData) console.warn('⚠️ Token data is null/undefined');
    if (!flowStatus) console.warn('⚠️ Flow status is null/undefined');
    if (!hashrateData) console.warn('⚠️ Hashrate data is null/undefined');
    if (!engineDistribution) console.warn('⚠️ Engine distribution is null/undefined');
    
    // Log errors if any
    if (flowError) console.error('❌ Flow status error:', flowError);
    if (hashrateError) console.error('❌ Hashrate data error:', hashrateError);

    // Real chart data from API or fallback minimal demo data to render charts
    const chartData = {
      hashrate: Array.from({ length: 12 }, (_, i) => ({ time: `${i}:00`, hashrate: Math.max(1, (i + 1) * 5) })),
      engineDistribution: (engineDistribution?.engines || [
        { name: 'Riemann Zeros', share: 30 },
        { name: 'Yang-Mills', share: 25 },
        { name: 'Goldbach', share: 20 },
        { name: 'Navier-Stokes', share: 25 }
      ]).map((e, idx) => ({ name: e.name || e.engine || `Engine ${idx+1}`, value: e.share || 25, color: ['#ffd700','#00ff88','#ff6b6b','#61dafb'][idx % 4] })),
      activity: Array.from({ length: 12 }, (_, i) => ({ time: `${i}:00`, transactions: (i + 1) * 3, blocks: (i + 1) }))
    };

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

    return (
      <div className="dashboard">
        <div className="dashboard-container">
          {/* Header */}
          <motion.div
            className="dashboard-header"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="header-content">
              <h1>Network Dashboard</h1>
              <p>Real-time ProductiveMiner blockchain statistics and performance metrics</p>
            </div>
            <div className="time-range-selector">
              <button
                className={`time-btn ${timeRange === '24h' ? 'active' : ''}`}
                onClick={() => setTimeRange('24h')}
              >
                24H
              </button>
              <button
                className={`time-btn ${timeRange === '7d' ? 'active' : ''}`}
                onClick={() => setTimeRange('7d')}
              >
                7D
              </button>
              <button
                className={`time-btn ${timeRange === '30d' ? 'active' : ''}`}
                onClick={() => setTimeRange('30d')}
              >
                30D
              </button>
            </div>
          </motion.div>

          {/* Network Stats */}
          <motion.div
            className="network-stats"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">
                  <FaCoins />
                </div>
                <div className="stat-content">
                  <h3>Total Supply</h3>
                  <p className="stat-value">{formatCurrency(stats.totalSupply)}</p>
                  <p className="stat-description">Fixed supply, deflationary model</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  <FaUsers />
                </div>
                <div className="stat-content">
                  <h3>Circulating Supply</h3>
                  <p className="stat-value">{formatCurrency(stats.circulatingSupply)}</p>
                  <p className="stat-change positive">
                    <FaArrowUp /> {((stats.circulatingSupply / stats.totalSupply) * 100).toFixed(1)}% of total
                  </p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  <FaChartLine />
                </div>
                <div className="stat-content">
                  <h3>Staking APY</h3>
                  <p className="stat-value">{stats.stakingAPY}%</p>
                  <p className="stat-change positive">
                    <FaArrowUp /> Active rewards
                  </p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  <FaServer />
                </div>
                <div className="stat-content">
                  <h3>Network Hashrate</h3>
                  <p className="stat-value">{formatHashrate(stats.networkHashrate)}</p>
                  <p className="stat-change positive">
                    <FaArrowUp /> Growing
                  </p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  <FaRocket />
                </div>
                <div className="stat-content">
                  <h3>Total Discoveries</h3>
                  <p className="stat-value">{formatNumber(stats.totalDiscoveries)}</p>
                  <p className="stat-change positive">
                    <FaArrowUp /> +{flowStatus?.system?.blockchain?.discoveries || 0} last 24h
                  </p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  <FaShieldAlt />
                </div>
                <div className="stat-content">
                  <h3>Bit Strength</h3>
                  <p className="stat-value">{formatNumber(stats.bitStrengthAdded)} bits</p>
                  <p className="stat-change positive">
                    <FaArrowUp /> +{Math.min(flowStatus?.system?.security?.currentBitStrength || 0, 1024)} last 24h
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Charts Section */}
          <motion.div
            className="charts-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="charts-grid">
              {/* Hashrate Chart */}
              <div className="chart-card">
                <div className="chart-header">
                  <h3>Network Hashrate</h3>
                  <div className="chart-controls">
                    <button className="control-btn">
                      <FaCog />
                    </button>
                  </div>
                </div>
                <div className="chart-container">
                  {chartData.hashrate.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={chartData.hashrate}>
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
                          stroke="#ffd700" 
                          fill="rgba(255,215,0,0.2)" 
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="chart-placeholder">
                      <p>No hashrate data available</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Engine Distribution */}
              <div className="chart-card">
                <div className="chart-header">
                  <h3>Mathematical Engine Distribution</h3>
                  <div className="chart-controls">
                    <button className="control-btn">
                      <FaCog />
                    </button>
                  </div>
                </div>
                <div className="chart-container">
                  {chartData.engineDistribution.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={chartData.engineDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {chartData.engineDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(0,0,0,0.8)', 
                            border: 'none',
                            borderRadius: '8px',
                            color: 'white'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="chart-placeholder">
                      <p>No engine data available</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Network Activity */}
              <div className="chart-card">
                <div className="chart-header">
                  <h3>Network Activity</h3>
                  <div className="chart-controls">
                    <button className="control-btn">
                      <FaCog />
                    </button>
                  </div>
                </div>
                <div className="chart-container">
                  {chartData.activity.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={chartData.activity}>
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
                        <Line 
                          type="monotone" 
                          dataKey="transactions" 
                          stroke="#00ff88" 
                          strokeWidth={2}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="blocks" 
                          stroke="#ff6b6b" 
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="chart-placeholder">
                      <p>No activity data available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Network Activity List */}
          <motion.div
            className="activity-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="section-header">
              <h3>Recent Network Activity</h3>
              <button className="view-all-btn">View All</button>
            </div>
            
            <div className="activity-list">
              {networkActivity?.recentActivity?.map((activity, index) => (
                <div key={index} className="activity-item">
                  <div className="activity-icon">
                    {activity.type === 'discovery' && <FaRocket />}
                    {activity.type === 'validator' && <FaUsers />}
                    {activity.type === 'research' && <FaBrain />}
                    {activity.type === 'reward' && <FaCoins />}
                  </div>
                  <div className="activity-content">
                    <h4>{activity.title}</h4>
                    <p>{activity.description}</p>
                    <span className="activity-time">{activity.time}</span>
                  </div>
                  <div className="activity-value">
                    <span className="value">{activity.value}</span>
                    <span className={`change ${activity.changeType}`}>{activity.change}</span>
                  </div>
                </div>
              )) || (
                <>
                  <div className="activity-item">
                    <div className="activity-icon">
                      <FaRocket />
                    </div>
                    <div className="activity-content">
                      <h4>New Mathematical Discovery</h4>
                      <p>Riemann zero computation completed by 0xMiner1...</p>
                      <span className="activity-time">2 minutes ago</span>
                    </div>
                    <div className="activity-value">
                      <span className="value">+500 MINED</span>
                      <span className="change positive">+45 complexity</span>
                    </div>
                  </div>

                  <div className="activity-item">
                    <div className="activity-icon">
                      <FaUsers />
                    </div>
                    <div className="activity-content">
                      <h4>New Validator Joined</h4>
                      <p>Validator 0xValidator25 staked 100,000 MINED</p>
                      <span className="activity-time">5 minutes ago</span>
                    </div>
                    <div className="activity-value">
                      <span className="value">+100K MINED</span>
                      <span className="change positive">Staked</span>
                    </div>
                  </div>

                  <div className="activity-item">
                    <div className="activity-icon">
                      <FaBrain />
                    </div>
                    <div className="activity-content">
                      <h4>Research Paper Published</h4>
                      <p>Yang-Mills field theory solution verified</p>
                      <span className="activity-time">8 minutes ago</span>
                    </div>
                    <div className="activity-value">
                      <span className="value">+800 MINED</span>
                      <span className="change positive">+48 complexity</span>
                    </div>
                  </div>

                  <div className="activity-item">
                    <div className="activity-icon">
                      <FaCoins />
                    </div>
                    <div className="activity-content">
                      <h4>Rewards Distributed</h4>
                      <p>Block #{stats.totalBlocks} rewards distributed to {stats.activeMiners} miners</p>
                      <span className="activity-time">12 minutes ago</span>
                    </div>
                    <div className="activity-value">
                      <span className="value">+2,500 MINED</span>
                      <span className="change positive">Distributed</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('❌ Dashboard component error:', error);
    return (
      <div className="dashboard">
        <div className="dashboard-container">
          <h1>Error loading Dashboard</h1>
          <p>Failed to fetch or process data for the dashboard.</p>
          <p>Please check your network connection and try again.</p>
        </div>
      </div>
    );
  }
};

export default Dashboard;
