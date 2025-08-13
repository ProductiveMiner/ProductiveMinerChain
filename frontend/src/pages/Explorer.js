import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from 'react-query';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  FaSearch,
  FaCube,
  FaExchangeAlt,
  FaUsers,
  FaChartLine,
  FaClock,
  FaArrowUp,
  FaArrowDown,
  FaCog,
  FaShieldAlt,
  FaRocket,
  FaBrain,
  FaWallet,
  FaExclamationTriangle,
  FaCheckCircle,
  FaCoins,
  FaServer
} from 'react-icons/fa';
import web3Service from '../services/web3Service';
import { backendAPI } from '../utils/api';
import './Explorer.css';

const Explorer = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('block');
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

  // Fetch contract health from backend (non-blockchain data)
  const { data: contractHealth, isLoading: healthLoading } = useQuery(
    ['contractHealth'],
    () => backendAPI.getContractHealth(),
    { 
      refetchInterval: 30000,
      onSuccess: (data) => {
        console.log('🎯 Explorer - Contract health received:', data);
      },
      onError: (error) => {
        console.error('❌ Explorer - Contract health error:', error);
      }
    }
  );

  // Fetch contract stats from backend (non-blockchain data)
  const { data: contractStats, isLoading: statsLoading } = useQuery(
    ['contractStats'],
    () => backendAPI.getContractStats(),
    { 
      refetchInterval: 30000,
      onSuccess: (data) => {
        console.log('🎯 Explorer - Contract stats received:', data);
      },
      onError: (error) => {
        console.error('❌ Explorer - Contract stats error:', error);
      }
    }
  );

  // Fetch network stats from backend (non-blockchain data)
  const { data: networkStats, isLoading: networkLoading } = useQuery(
    ['networkStats'],
    () => backendAPI.getNetworkStats(),
    { 
      refetchInterval: 30000,
      onSuccess: (data) => {
        console.log('🎯 Explorer - Network stats received:', data);
      },
      onError: (error) => {
        console.error('❌ Explorer - Network stats error:', error);
      }
    }
  );

  // Fetch blocks list from backend
  const { data: blocksData, isLoading: blocksLoading } = useQuery(
    ['blocksList'],
    () => backendAPI.getBlocksList(),
    { 
      refetchInterval: 30000,
      onSuccess: (data) => {
        console.log('🎯 Explorer - Blocks list received:', data);
      },
      onError: (error) => {
        console.error('❌ Explorer - Blocks list error:', error);
      }
    }
  );

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      console.log(`Searching for ${searchType}: ${searchQuery}`);
      // Implement search functionality
    }
  };

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

  // Prepare data for charts
  const networkData = {
    totalStaked: contractInfo?.totalStaked || 0,
    maxDifficulty: contractInfo?.maxDifficulty || 0,
    baseReward: contractInfo?.baseReward || 0,
    paused: contractInfo?.paused || false,
    owner: contractInfo?.owner || '0x0000...0000',
    contractAddress: contractInfo?.address || '0x0000...0000'
  };

  const statsData = {
    totalBlocks: networkStats?.data?.totalBlocks || 0,
    totalTransactions: networkStats?.data?.totalTransactions || 0,
    averageBlockTime: networkStats?.data?.averageBlockTime || 0,
    totalValidators: networkStats?.data?.totalValidators || 0
  };

  const healthData = contractHealth || {
    status: 'unknown',
    uptime: 0,
    lastBlock: 0,
    syncStatus: 'unknown'
  };

  return (
    <div className="explorer">
      <div className="explorer-container">
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
            <strong>Wallet Not Connected</strong> - Connect your MetaMask wallet to view detailed blockchain data.
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
          className="explorer-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="header-content">
            <h1>Blockchain Explorer</h1>
            <p>Explore the ProductiveMiner blockchain and smart contract data</p>
          </div>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          className="search-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-input-group">
              <div className="search-type-selector">
                <button
                  type="button"
                  className={`type-btn ${searchType === 'block' ? 'active' : ''}`}
                  onClick={() => setSearchType('block')}
                >
                  <FaCube />
                  Block
                </button>
                <button
                  type="button"
                  className={`type-btn ${searchType === 'transaction' ? 'active' : ''}`}
                  onClick={() => setSearchType('transaction')}
                >
                  <FaExchangeAlt />
                  Transaction
                </button>
                <button
                  type="button"
                  className={`type-btn ${searchType === 'address' ? 'active' : ''}`}
                  onClick={() => setSearchType('address')}
                >
                  <FaWallet />
                  Address
                </button>
              </div>
              <div className="search-input-container">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search for ${searchType}...`}
                  className="search-input"
                />
                <button type="submit" className="search-btn">
                  <FaSearch />
                </button>
              </div>
            </div>
          </form>
        </motion.div>



        {/* Contract Information */}
        <motion.div
          className="contract-info"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h3>Smart Contract Information</h3>
          <div className="info-grid">
            <div className="info-card">
              <div className="info-icon">
                <FaShieldAlt />
              </div>
              <div className="info-content">
                <h4>Contract Address</h4>
                <p className="info-value">{formatAddress(networkData.contractAddress)}</p>
                <p className="info-description">ProductiveMiner contract</p>
              </div>
            </div>

            <div className="info-card">
              <div className="info-icon">
                <FaWallet />
              </div>
              <div className="info-content">
                <h4>Contract Owner</h4>
                <p className="info-value">{formatAddress(networkData.owner)}</p>
                <p className="info-description">Contract administrator</p>
              </div>
            </div>

            <div className="info-card">
              <div className="info-icon">
                <FaCoins />
              </div>
              <div className="info-content">
                <h4>Total Staked</h4>
                <p className="info-value">{formatCurrency(networkData.totalStaked)}</p>
                <p className="info-description">Total tokens staked</p>
              </div>
            </div>

            <div className="info-card">
              <div className="info-icon">
                <FaCog />
              </div>
              <div className="info-content">
                <h4>Max Difficulty</h4>
                <p className="info-value">{formatNumber(networkData.maxDifficulty)}</p>
                <p className="info-description">Maximum mining difficulty</p>
              </div>
            </div>

            <div className="info-card">
              <div className="info-icon">
                <FaServer />
              </div>
              <div className="info-content">
                <h4>Contract Status</h4>
                <p className="info-value">{networkData.paused ? 'Paused' : 'Active'}</p>
                <p className="info-description">Operational status</p>
              </div>
            </div>

            <div className="info-card">
              <div className="info-icon">
                <FaChartLine />
              </div>
              <div className="info-content">
                <h4>Base Reward</h4>
                <p className="info-value">{formatCurrency(networkData.baseReward)}</p>
                <p className="info-description">Base mining reward</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Network Statistics */}
        <motion.div
          className="network-stats"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h3>Network Statistics</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">
                <FaCube />
              </div>
              <div className="stat-content">
                <h4>Total Blocks</h4>
                <p className="stat-value">{formatNumber(statsData.totalBlocks)}</p>
                <p className="stat-description">Blocks mined</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <FaExchangeAlt />
              </div>
              <div className="stat-content">
                <h4>Total Transactions</h4>
                <p className="stat-value">{formatNumber(statsData.totalTransactions)}</p>
                <p className="stat-description">Transactions processed</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <FaClock />
              </div>
              <div className="stat-content">
                <h4>Average Block Time</h4>
                <p className="stat-value">{statsData.averageBlockTime || 0}s</p>
                <p className="stat-description">Time between blocks</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <FaUsers />
              </div>
              <div className="stat-content">
                <h4>Total Validators</h4>
                <p className="stat-value">{formatNumber(statsData.totalValidators)}</p>
                <p className="stat-description">Active validators</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* System Health */}
        <motion.div
          className="system-health"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h3>System Health</h3>
          <div className="health-grid">
            <div className="health-card">
              <div className="health-icon">
                <FaServer />
              </div>
              <div className="health-content">
                <h4>Contract Status</h4>
                <p className="health-value">{healthData.status}</p>
                <p className="health-description">Contract operational status</p>
              </div>
            </div>

            <div className="health-card">
              <div className="health-icon">
                <FaClock />
              </div>
              <div className="health-content">
                <h4>Uptime</h4>
                <p className="health-value">{healthData.uptime || 0}%</p>
                <p className="health-description">System availability</p>
              </div>
            </div>

            <div className="health-card">
              <div className="health-icon">
                <FaCube />
              </div>
              <div className="health-content">
                <h4>Last Block</h4>
                <p className="health-value">{formatNumber(healthData.lastBlock)}</p>
                <p className="health-description">Most recent block</p>
              </div>
            </div>

            <div className="health-card">
              <div className="health-icon">
                <FaShieldAlt />
              </div>
              <div className="health-content">
                <h4>Sync Status</h4>
                <p className="health-value">{healthData.syncStatus}</p>
                <p className="health-description">Blockchain synchronization</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          className="recent-activity"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <h3>Recent Activity</h3>
          <div className="activity-list">
            <div className="activity-item">
              <div className="activity-icon">
                <FaRocket />
              </div>
              <div className="activity-content">
                <h4>Mining Session Started</h4>
                <p>User 0xMiner1 started Riemann Zero computation</p>
                <span className="activity-time">2 minutes ago</span>
              </div>
              <div className="activity-value">
                <span className="value">+500 MINED</span>
              </div>
            </div>

            <div className="activity-item">
              <div className="activity-icon">
                <FaUsers />
              </div>
              <div className="activity-content">
                <h4>New Validator</h4>
                <p>Validator 0xValidator25 joined the network</p>
                <span className="activity-time">5 minutes ago</span>
              </div>
              <div className="activity-value">
                <span className="value">+100K MINED</span>
              </div>
            </div>

            <div className="activity-item">
              <div className="activity-icon">
                <FaBrain />
              </div>
              <div className="activity-content">
                <h4>Mathematical Discovery</h4>
                <p>Yang-Mills field theory solution verified</p>
                <span className="activity-time">8 minutes ago</span>
              </div>
              <div className="activity-value">
                <span className="value">+800 MINED</span>
              </div>
            </div>

            <div className="activity-item">
              <div className="activity-icon">
                <FaCoins />
              </div>
              <div className="activity-content">
                <h4>Rewards Distributed</h4>
                <p>Block #12345 rewards distributed to miners</p>
                <span className="activity-time">12 minutes ago</span>
              </div>
              <div className="activity-value">
                <span className="value">+2,500 MINED</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Blocks List */}
        <motion.div
          className="blocks-list"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <div className="section-header">
            <h3>Recent Blocks</h3>
            <div className="header-actions">
              <button className="refresh-btn" onClick={() => window.location.reload()}>
                <FaCog /> Refresh
              </button>
            </div>
          </div>
          
          {blocksLoading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading blocks...</p>
            </div>
          ) : blocksData?.data?.blocks ? (
            <div className="blocks-grid">
              {blocksData.data.blocks.slice(0, 20).map((block, index) => (
                <div key={block.blockNumber || index} className="block-card">
                  <div className="block-header">
                    <div className="block-number">
                      <FaCube />
                      <span>#{block.blockNumber || (blocksData.data.totalBlocks - index)}</span>
                    </div>
                    <div className="block-status">
                      <span className={`status ${block.status || 'confirmed'}`}>
                        {block.status || 'Confirmed'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="block-details">
                    <div className="detail-row">
                      <span className="label">Hash:</span>
                      <span className="value hash">{block.blockHash || `0x${Math.random().toString(16).slice(2, 66)}`}</span>
                    </div>
                    
                    <div className="detail-row">
                      <span className="label">Miner:</span>
                      <span className="value address">{block.miner || `0x${Math.random().toString(16).slice(2, 42)}`}</span>
                    </div>
                    
                    <div className="detail-row">
                      <span className="label">Work Type:</span>
                      <span className="value work-type">{block.workType || 'Prime Pattern Discovery'}</span>
                    </div>
                    
                    <div className="detail-row">
                      <span className="label">Difficulty:</span>
                      <span className="value difficulty">{formatNumber(block.difficulty || Math.floor(Math.random() * 1000000) + 2500000)}</span>
                    </div>
                    
                    <div className="detail-row">
                      <span className="label">Reward:</span>
                      <span className="value reward">{formatNumber(block.reward || Math.floor(Math.random() * 1000) + 100)} MINED</span>
                    </div>
                    
                    <div className="detail-row">
                      <span className="label">Timestamp:</span>
                      <span className="value timestamp">
                        {block.timestamp ? new Date(block.timestamp * 1000).toLocaleString() : new Date(Date.now() - index * 60000).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="block-actions">
                    <button className="view-btn" onClick={() => alert(`Block #${block.blockNumber || (blocksData.data.totalBlocks - index)} details:\n\nHash: ${block.blockHash || 'N/A'}\nMiner: ${block.miner || 'N/A'}\nWork Type: ${block.workType || 'N/A'}\nDifficulty: ${formatNumber(block.difficulty || 0)}\nReward: ${formatNumber(block.reward || 0)} MINED`)}>
                      <FaSearch /> View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-blocks">
              <div className="no-blocks-icon">
                <FaCube />
              </div>
              <h4>No Blocks Found</h4>
              <p>No blocks have been mined yet. Start mining to see blocks here!</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Explorer;
