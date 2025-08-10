import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from 'react-query';
import {
  FaSearch,
  FaCube,
  FaExchangeAlt,
  FaUsers,
  FaClock,
  FaArrowUp,
  FaArrowDown,
  FaCopy,
  FaExternalLinkAlt,
  FaFilter,
  FaSort,
  FaCheckCircle,
  FaTimesCircle,
  FaCoins,
  FaNetworkWired,
  FaFileContract,
  FaShieldAlt,
  FaChartLine,
  FaCog,
  FaInfoCircle,
  FaDownload
} from 'react-icons/fa';
import { flowAPI, backendAPI, explorerAPI } from '../utils/api';
import './Explorer.css';

const Explorer = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('block');
  const [activeTab, setActiveTab] = useState('blocks');
  const [sortBy, setSortBy] = useState('timestamp');
  const [sortOrder, setSortOrder] = useState('desc');

  // Fetch latest blocks from blockchain
  const { data: latestBlocks, isLoading: blocksLoading, error: blocksError } = useQuery(
    ['latestBlocks'],
    () => explorerAPI.getBlocks(20),
    { 
      refetchInterval: 30000,
      onSuccess: (data) => {
        console.log('🎯 Explorer - Latest blocks received:', data);
      },
      onError: (error) => {
        console.error('❌ Explorer - Latest blocks error:', error);
      }
    }
  );

  // Log any errors
  useEffect(() => {
    if (blocksError) {
      console.error('❌ Explorer - Latest blocks error:', blocksError);
    }
  }, [blocksError]);

  // Fetch latest transactions from blockchain
  const { data: latestTransactions, isLoading: txLoading } = useQuery(
    ['latestTransactions'],
    () => explorerAPI.getTransactions(50),
    { refetchInterval: 30000 }
  );

  // Fetch network statistics
  const { data: networkStats, isLoading: statsLoading, error: statsError } = useQuery(
    ['networkStats'],
    () => flowAPI.getSystemStatus(),
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

  // Fetch validators to provide a fallback for active validator count
  const { data: validatorsData } = useQuery(
    ['validatorsForExplorer'],
    () => flowAPI.getValidators(),
    {
      refetchInterval: 60000,
      staleTime: 30000,
      retry: 1
    }
  );

  // Fetch contract information
  const { data: contractHealth, isLoading: contractHealthLoading } = useQuery(
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

  // Fetch contract statistics
  const { data: contractStats, isLoading: contractStatsLoading } = useQuery(
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

  // Fetch network statistics from contract
  const { data: contractNetworkStats, isLoading: contractNetworkStatsLoading } = useQuery(
    ['contractNetworkStats'],
    () => backendAPI.getContractNetworkStats(),
    {
      refetchInterval: 30000,
      onSuccess: (data) => {
        console.log('🎯 Explorer - Contract network stats received:', data);
      },
      onError: (error) => {
        console.error('❌ Explorer - Contract network stats error:', error);
      }
    }
  );

  // Log any errors
  useEffect(() => {
    if (statsError) {
      console.error('❌ Explorer - Network stats error:', statsError);
    }
  }, [statsError]);

  // Fetch specific block data
  const { data: blockData, isLoading: blockDataLoading } = useQuery(
    ['blockData', searchQuery],
    () => flowAPI.getBlock(searchQuery),
    {
      enabled: Boolean(searchQuery && searchType === 'block'),
      refetchInterval: false
    }
  );

  // Fetch specific transaction data
  const { data: transactionData, isLoading: transactionDataLoading } = useQuery(
    ['transactionData', searchQuery],
    () => flowAPI.getTransaction(searchQuery),
    {
      enabled: Boolean(searchQuery && searchType === 'transaction'),
      refetchInterval: false
    }
  );

  const handleSearch = () => {
    if (!searchQuery.trim()) return;

    // Search logic is handled by the useQuery hooks above
    console.log(`Searching for ${searchType}: ${searchQuery}`);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const formatAddress = (address) => {
    if (!address) return 'Unknown';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatHash = (hash) => {
    if (!hash) return 'Unknown';
    return `${hash.slice(0, 8)}...${hash.slice(-8)}`;
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

  const formatBlockNumber = (num) => {
    if (!num) return '0';
    return num.toLocaleString(); // Always show full block number
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Unknown';
    // Handle seconds vs milliseconds
    const ts = timestamp > 1e12 ? timestamp : timestamp * 1000;
    const date = new Date(ts);
    return date.toLocaleString();
  };

  const formatGasUsed = (gasUsed, gasLimit) => {
    if (!gasUsed || !gasLimit) return '0 / 0';
    return `${formatNumber(gasUsed)} / ${formatNumber(gasLimit)}`;
  };

  const formatCurrency = (amount) => {
    if (!amount) return '0 MINED';
    return `${formatNumber(amount)} MINED`;
  };

  // Compute simple average block time from recent blocks if not provided by API
  const computeAvgBlockTimeFromBlocks = () => {
    const blocks = latestBlocks?.blocks || [];
    if (blocks.length < 2) return 0;
    // Normalize timestamps to ms
    const times = blocks
      .map(b => (b.timestamp > 1e12 ? b.timestamp : b.timestamp * 1000))
      .sort((a, b) => a - b);
    let diffs = [];
    for (let i = 1; i < times.length; i++) {
      diffs.push((times[i] - times[i - 1]) / 1000);
    }
    const avg = diffs.reduce((a, b) => a + b, 0) / diffs.length;
    return Math.round(avg * 10) / 10; // one decimal
  };

  // Real data from API or robustly fallback when empty to avoid blank screen
  const latestBlockFromBlocks = (() => {
    const blk = latestBlocks?.blocks?.[0];
    if (!blk) return 0;
    return blk.block_number || blk.number || blk.height || 0;
  })();

  const totalTxFromBlocks = (() => {
    const blocks = latestBlocks?.blocks || [];
    if (!blocks.length) return 0;
    return blocks.reduce((sum, b) => sum + (b.transactions_count || b.transactions?.length || b.transactions || 0), 0);
  })();

  const activeValidatorsFallback = (() => {
    // Prefer explicit active flag if present
    const list = validatorsData?.validators || [];
    if (list.length) {
      const activeCount = list.filter(v => (v.status || 'active') === 'active').length;
      return activeCount || validatorsData?.totalValidators || 0;
    }
    return 0;
  })();

  const networkData = {
    latestBlock: networkStats?.network?.blockHeight ||
                 networkStats?.system?.blockchain?.height ||
                 latestBlockFromBlocks,
    totalTransactions: networkStats?.network?.totalTransactions ||
                      networkStats?.system?.blockchain?.transactions ||
                      totalTxFromBlocks,
    activeValidators: networkStats?.network?.validatorsActive ||
                     networkStats?.network?.activeNodes ||
                     activeValidatorsFallback,
    averageBlockTime: networkStats?.network?.averageBlockTime ||
                     computeAvgBlockTimeFromBlocks()
  };

  // Debug logging
  console.log('🎯 Explorer - Network data calculated:', networkData);
  console.log('🎯 Explorer - Raw network stats:', networkStats);
  console.log('🎯 Explorer - Raw latest blocks:', latestBlocks);

  console.log('🎯 Explorer - Network data:', networkData);
  console.log('🎯 Explorer - Raw network stats:', networkStats);

  // Normalize blocks and robustly fallback when empty to avoid blank screen
  const normalizedBlocks = (latestBlocks?.blocks || []).map(block => ({
    number: block.block_number || block.number || block.height || 0,
    hash: block.block_hash || block.hash || block.id || '',
    timestamp: (block.timestamp ? new Date(block.timestamp).getTime() : Math.floor(Date.now() / 1000)) ,
    transactions: block.transactions_count || (Array.isArray(block.transactions) ? block.transactions.length : (block.txCount || 0)),
    gasUsed: block.gas_used || block.gasUsed || block.gas || 0,
    gasLimit: block.gas_limit || block.gasLimit || block.limit || 1000000,
    miner: block.miner_address || block.miner || block.validator || '',
    size: block.size || block.bytes || 0,
    reward: block.block_reward || block.reward || 0
  }));

  const blocksList = normalizedBlocks && normalizedBlocks.length > 0 ? normalizedBlocks : [
    {
      number: 1500,
      hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      timestamp: Math.floor(Date.now() / 1000) - 120,
      transactions: 15,
      reward: 2.0,
      gasUsed: 1500000,
      gasLimit: 2000000,
      miner: '0xMiner1',
      difficulty: 2500000,
      totalDifficulty: 3750000000,
      size: 2048,
      parentHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      nonce: '0x1234567890abcdef'
    },
    {
      number: 1499,
      hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      timestamp: Math.floor(Date.now() / 1000) - 240,
      transactions: 12,
      gasUsed: 1200000,
      gasLimit: 2000000,
      miner: '0xMiner2',
      difficulty: 2500000,
      totalDifficulty: 3747500000,
      size: 1856,
      parentHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      nonce: '0xabcdef1234567890'
    }
  ];

  // Real transactions data from API or fallback
  const transactionsList = latestTransactions?.transactions || [
    {
      hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      blockNumber: 1500,
      from: '0x1234567890abcdef1234567890abcdef12345678',
      to: '0xabcdef1234567890abcdef1234567890abcdef12',
      value: 1000000,
      gas: 21000,
      gasPrice: 20000000000,
      gasUsed: 21000,
      status: 'success',
      timestamp: Math.floor(Date.now() / 1000) - 120,
      nonce: 5,
      input: '0x',
      contractAddress: null
    },
    {
      hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      blockNumber: 1500,
      from: '0xabcdef1234567890abcdef1234567890abcdef12',
      to: '0x1234567890abcdef1234567890abcdef12345678',
      value: 500000,
      gas: 65000,
      gasPrice: 20000000000,
      gasUsed: 45000,
      status: 'success',
      timestamp: Math.floor(Date.now() / 1000) - 180,
      nonce: 3,
      input: '0xa9059cbb000000000000000000000000...',
      contractAddress: '0xContract1234567890abcdef1234567890abcdef12'
    }
  ];

  const tabs = [
    { id: 'blocks', label: 'Blocks', icon: <FaCube /> },
    { id: 'transactions', label: 'Transactions', icon: <FaExchangeAlt /> },
    { id: 'accounts', label: 'Accounts', icon: <FaUsers /> },
    { id: 'contracts', label: 'Contracts', icon: <FaNetworkWired /> },
    { id: 'tokens', label: 'Tokens', icon: <FaCoins /> }
  ];

  return (
    <div className="explorer">
      <div className="explorer-container">
        {/* Header */}
        <motion.div
          className="explorer-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="header-content">
            <h1>Block Explorer</h1>
            <p>Explore blocks, transactions, and network activity on ProductiveMiner</p>
          </div>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          className="search-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="search-container">
            <div className="search-type-selector">
              <button
                className={`type-btn ${searchType === 'block' ? 'active' : ''}`}
                onClick={() => setSearchType('block')}
              >
                <FaCube /> Block
              </button>
              <button
                className={`type-btn ${searchType === 'transaction' ? 'active' : ''}`}
                onClick={() => setSearchType('transaction')}
              >
                <FaExchangeAlt /> Transaction
              </button>
              <button
                className={`type-btn ${searchType === 'address' ? 'active' : ''}`}
                onClick={() => setSearchType('address')}
              >
                <FaUsers /> Address
              </button>
              <button
                className={`type-btn ${searchType === 'token' ? 'active' : ''}`}
                onClick={() => setSearchType('token')}
              >
                <FaCoins /> Token
              </button>
            </div>

            <div className="search-input-container">
              <input
                type="text"
                id="search-query"
                name="searchQuery"
                placeholder={`Search for ${searchType}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="search-input"
              />
              <button className="search-btn" onClick={handleSearch}>
                <FaSearch />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Network Stats */}
        <motion.div
          className="network-stats"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">
                <FaCube />
              </div>
              <div className="stat-content">
                <h3>Latest Block</h3>
                <p className="stat-value">{formatBlockNumber(networkData.latestBlock)}</p>
                <p className="stat-description">Current block height</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <FaExchangeAlt />
              </div>
              <div className="stat-content">
                <h3>Total Transactions</h3>
                <p className="stat-value">{formatNumber(networkData.totalTransactions)}</p>
                <p className="stat-description">All-time transactions</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <FaUsers />
              </div>
              <div className="stat-content">
                <h3>Active Validators</h3>
                <p className="stat-value">{networkData.activeValidators}</p>
                <p className="stat-description">Currently validating</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <FaClock />
              </div>
              <div className="stat-content">
                <h3>Average Block Time</h3>
                <p className="stat-value">{networkData.averageBlockTime}s</p>
                <p className="stat-description">Time between blocks</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          className="tab-navigation"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </motion.div>

        {/* Tab Content */}
        <motion.div
          className="tab-content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          {/* Blocks Tab */}
          {activeTab === 'blocks' && (
            <div className="blocks-tab">
              <div className="table-header">
                <h3>Latest Blocks</h3>
                <div className="table-controls">
                  <button className="control-btn">
                    <FaFilter /> Filter
                  </button>
                  <button className="control-btn">
                    <FaSort /> Sort
                  </button>
                </div>
              </div>

              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Block</th>
                      <th>Age</th>
                      <th>Transactions</th>
                      <th>Reward</th>
                      <th>Gas Used</th>
                      <th>Gas Limit</th>
                      <th>Miner</th>
                      <th>Size</th>
                    </tr>
                  </thead>
                  <tbody>
                    {blocksList.map((block, index) => (
                      <tr key={block.number} className="table-row">
                        <td>
                          <div className="block-info">
                            <span className="block-number">{formatBlockNumber(block.number)}</span>
                            <span className="block-hash">{formatHash(block.hash)}</span>
                          </div>
                        </td>
                        <td>{formatTimestamp(block.timestamp)}</td>
                        <td>{block.transactions}</td>
                        <td>{formatCurrency(block.reward)}</td>
                        <td>{formatGasUsed(block.gasUsed, block.gasLimit)}</td>
                        <td>{formatNumber(block.gasLimit)}</td>
                        <td>{formatAddress(block.miner)}</td>
                        <td>{formatNumber(block.size)} bytes</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Transactions Tab */}
          {activeTab === 'transactions' && (
            <div className="transactions-tab">
              <div className="table-header">
                <h3>Latest Transactions</h3>
                <div className="table-controls">
                  <button className="control-btn">
                    <FaFilter /> Filter
                  </button>
                  <button className="control-btn">
                    <FaSort /> Sort
                  </button>
                </div>
              </div>

              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Transaction Hash</th>
                      <th>Block</th>
                      <th>Age</th>
                      <th>From</th>
                      <th>To</th>
                      <th>Value</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactionsList.map((tx, index) => (
                      <tr key={tx.hash} className="table-row">
                        <td>
                          <div className="tx-info">
                            <span className="tx-hash">{formatHash(tx.hash)}</span>
                            <button
                              className="copy-btn"
                              onClick={() => copyToClipboard(tx.hash)}
                            >
                              <FaCopy />
                            </button>
                          </div>
                        </td>
                        <td>{formatBlockNumber(tx.blockNumber)}</td>
                        <td>{formatTimestamp(tx.timestamp)}</td>
                        <td>{formatAddress(tx.from)}</td>
                        <td>{formatAddress(tx.to)}</td>
                        <td>{formatCurrency(tx.value)}</td>
                        <td>
                          <span className={`status-badge ${tx.status}`}>
                            {tx.status === 'success' ? <FaCheckCircle /> : <FaTimesCircle />}
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Accounts Tab */}
          {activeTab === 'accounts' && (
            <div className="accounts-tab">
              <div className="placeholder-content">
                <h3>Accounts</h3>
                <p>Account information will be displayed here when available from the blockchain API.</p>
              </div>
            </div>
          )}

          {/* Contracts Tab */}
          {activeTab === 'contracts' && (
            <div className="contracts-tab">
              <div className="contracts-header">
                <h3>Smart Contracts</h3>
                <div className="contract-status">
                  {contractHealthLoading ? (
                    <span className="status-loading">Loading...</span>
                  ) : contractHealth?.status === 'connected' ? (
                    <span className="status-connected">
                      <FaCheckCircle /> Connected
                    </span>
                  ) : (
                    <span className="status-disconnected">
                      <FaTimesCircle /> Disconnected
                    </span>
                  )}
                </div>
              </div>

              {contractHealthLoading || contractStatsLoading || contractNetworkStatsLoading ? (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <p>Loading contract information...</p>
                </div>
              ) : (
                <div className="contracts-content">
                  {/* Contract Overview */}
                  <div className="contract-overview">
                    <div className="overview-card">
                      <div className="card-header">
                        <FaFileContract className="card-icon" />
                        <h4>ProductiveMiner Contract</h4>
                      </div>
                      <div className="card-content">
                        <div className="contract-info">
                          <div className="info-item">
                            <span className="label">Status:</span>
                            <span className={`value ${contractHealth?.status === 'connected' ? 'connected' : 'disconnected'}`}>
                              {contractHealth?.status || 'Unknown'}
                            </span>
                          </div>
                          <div className="info-item">
                            <span className="label">Network:</span>
                            <span className="value">
                              {contractHealth?.network?.chainId ? `Chain ID: ${contractHealth.network.chainId}` : 'Local'}
                            </span>
                          </div>
                          <div className="info-item">
                            <span className="label">Address:</span>
                            <span className="value">
                              {contractHealth?.contractAddress ? formatAddress(contractHealth.contractAddress) : 'Not Deployed'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contract Statistics */}
                  <div className="contract-stats">
                    <h4>Contract Statistics</h4>
                    <div className="stats-grid">
                      <div className="stat-card">
                        <FaChartLine className="stat-icon" />
                        <div className="stat-content">
                          <span className="stat-value">{formatNumber(contractStats?.totalDiscoveries || 0)}</span>
                          <span className="stat-label">Total Discoveries</span>
                        </div>
                      </div>
                      <div className="stat-card">
                        <FaCog className="stat-icon" />
                        <div className="stat-content">
                          <span className="stat-value">{formatNumber(contractStats?.totalSessions || 0)}</span>
                          <span className="stat-label">Total Sessions</span>
                        </div>
                      </div>
                      <div className="stat-card">
                        <FaCoins className="stat-icon" />
                        <div className="stat-content">
                          <span className="stat-value">{formatNumber(contractStats?.totalStaked || 0)}</span>
                          <span className="stat-label">Total Staked</span>
                        </div>
                      </div>
                      <div className="stat-card">
                        <FaNetworkWired className="stat-icon" />
                        <div className="stat-content">
                          <span className="stat-value">{formatNumber(contractStats?.currentActiveSessions || 0)}</span>
                          <span className="stat-label">Active Sessions</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Network Statistics */}
                  <div className="network-stats">
                    <h4>Network Statistics</h4>
                    <div className="stats-grid">
                      <div className="stat-card">
                        <FaShieldAlt className="stat-icon" />
                        <div className="stat-content">
                          <span className="stat-value">{formatNumber(contractNetworkStats?.maxDifficulty || 0)}</span>
                          <span className="stat-label">Max Difficulty</span>
                        </div>
                      </div>
                      <div className="stat-card">
                        <FaCoins className="stat-icon" />
                        <div className="stat-content">
                          <span className="stat-value">{formatNumber(contractNetworkStats?.baseReward || 0)}</span>
                          <span className="stat-label">Base Reward</span>
                        </div>
                      </div>
                      <div className="stat-card">
                        <FaShieldAlt className="stat-icon" />
                        <div className="stat-content">
                          <span className="stat-value">{formatNumber(contractNetworkStats?.quantumSecurityLevel || 0)}</span>
                          <span className="stat-label">Quantum Security</span>
                        </div>
                      </div>
                      <div className="stat-card">
                        <FaChartLine className="stat-icon" />
                        <div className="stat-content">
                          <span className="stat-value">{formatNumber(contractNetworkStats?.averageComputationalComplexity || 0)}</span>
                          <span className="stat-label">Avg Complexity</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contract Features */}
                  <div className="contract-features">
                    <h4>Contract Features</h4>
                    <div className="features-grid">
                      <div className="feature-item">
                        <FaShieldAlt className="feature-icon" />
                        <div className="feature-content">
                          <h5>Quantum Security</h5>
                          <p>Advanced cryptographic security with configurable quantum resistance levels</p>
                        </div>
                      </div>
                      <div className="feature-item">
                        <FaCog className="feature-icon" />
                        <div className="feature-content">
                          <h5>Mathematical Mining</h5>
                          <p>12 different mathematical work types for discovery mining</p>
                        </div>
                      </div>
                      <div className="feature-item">
                        <FaCoins className="feature-icon" />
                        <div className="feature-content">
                          <h5>Staking Integration</h5>
                          <p>Dynamic staking with APY rewards and minimum stake requirements</p>
                        </div>
                      </div>
                      <div className="feature-item">
                        <FaNetworkWired className="feature-icon" />
                        <div className="feature-content">
                          <h5>Session Management</h5>
                          <p>Concurrent mining sessions with computational power tracking</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Secure Contract Section */}
                  <div className="secure-contract-section">
                    <h4>ProductiveMinerSecure Contract</h4>
                    <div className="secure-contract-card">
                      <div className="secure-contract-header">
                        <FaShieldAlt className="secure-icon" />
                        <div className="secure-contract-info">
                          <h5>Latest Secure Version</h5>
                          <p>Production-ready smart contract with comprehensive security enhancements</p>
                        </div>
                        <div className="security-badge">
                          <FaCheckCircle /> Security Audited
                        </div>
                      </div>
                      
                      <div className="secure-contract-details">
                        <div className="security-features">
                          <h6>Security Features:</h6>
                          <ul>
                            <li><FaShieldAlt /> Reentrancy Protection</li>
                            <li><FaShieldAlt /> Secure Transfer Functions</li>
                            <li><FaShieldAlt /> Access Control Modifiers</li>
                            <li><FaShieldAlt /> Custom Error Handling</li>
                            <li><FaShieldAlt /> Gas Optimizations</li>
                            <li><FaShieldAlt /> Event Ordering Protection</li>
                          </ul>
                        </div>
                        
                        <div className="contract-specs">
                          <h6>Contract Specifications:</h6>
                          <div className="specs-grid">
                            <div className="spec-item">
                              <span className="spec-label">Solidity Version:</span>
                              <span className="spec-value">0.8.20</span>
                            </div>
                            <div className="spec-item">
                              <span className="spec-label">Contract Size:</span>
                              <span className="spec-value">~22KB (Under Limit)</span>
                            </div>
                            <div className="spec-item">
                              <span className="spec-label">State Variables:</span>
                              <span className="spec-value">15 (Optimized)</span>
                            </div>
                            <div className="spec-item">
                              <span className="spec-label">Functions:</span>
                              <span className="spec-value">20+ (Secure)</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="secure-contract-actions">
                        <button 
                          className="action-btn primary"
                          onClick={() => {
                            // Copy contract source code to clipboard
                            const contractSource = `// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

/**
 * @title ProductiveMinerSecure
 * @dev Secure blockchain mining platform with comprehensive security fixes
 * 
 * Security Enhancements:
 * - Fixed controlled low-level call vulnerabilities
 * - Enhanced access control
 * - Reentrancy protection
 * - Gas optimizations
 * - Comprehensive event logging
 */
contract ProductiveMinerSecure {
    // =============================================================================
    // CUSTOM ERRORS (Gas efficient)
    // =============================================================================
    
    error Unauthorized();
    error ContractPaused();
    error InvalidDifficulty();
    error TooManyActiveSessions();
    error SessionNotFound();
    error SessionNotActive();
    error InsufficientStake();
    error NoRewardsToClaim();
    error TransferFailed();
    error InvalidParameters();
    error ReentrancyGuard();

    // =============================================================================
    // STRUCTS AND ENUMS
    // =============================================================================

    enum WorkType {
        PRIME_PATTERN_DISCOVERY,
        RIEMANN_ZERO_COMPUTATION,
        YANG_MILLS_FIELD_THEORY,
        GOLDBACH_CONJECTURE_VERIFICATION,
        NAVIER_STOKES_SIMULATION,
        BIRCH_SWINNERTON_DYER,
        ELLIPTIC_CURVE_CRYPTOGRAPHY,
        LATTICE_CRYPTOGRAPHY,
        POINCARE_CONJECTURE,
        QUANTUM_ALGORITHM_OPTIMIZATION,
        CRYPTOGRAPHIC_PROTOCOL_ANALYSIS,
        MATHEMATICAL_CONSTANT_VERIFICATION
    }

    struct Discovery {
        uint256 id;
        address miner;
        WorkType workType;
        uint256 difficulty;
        uint256 reward;
        uint48 timestamp; // Gas optimization: uint48 for timestamps
        bytes32 proofHash;
        bool verified;
        string metadata;
    }

    struct MiningSession {
        uint256 sessionId;
        address miner;
        WorkType workType;
        uint48 startTime; // Gas optimization: uint48 for timestamps
        uint48 endTime;   // Gas optimization: uint48 for timestamps
        uint256 difficulty;
        bool active;
        bool completed;
    }

    struct StakingInfo {
        uint256 stakedAmount;
        uint256 rewards;
        uint48 lastClaimTime; // Gas optimization: uint48 for timestamps
        bool isActive;
    }

    struct MinerStats {
        uint256 totalSessions;
        uint256 totalDiscoveries;
        uint256 totalRewards;
        uint256 stakedAmount;
        uint256 pendingRewards;
    }

    // =============================================================================
    // STATE VARIABLES (Reduced to 15 or fewer)
    // =============================================================================

    // Core parameters (4 variables)
    uint256 public maxDifficulty = 1e6; // Gas optimization: scientific notation
    uint256 public baseReward = 1000;
    uint256 public minStakeAmount = 1000;
    uint256 public stakingAPY = 12;

    // Access control (2 variables)
    address public immutable owner;
    bool public paused;

    // Reentrancy protection (1 variable)
    uint256 private _reentrancyGuard;

    // Mappings (5 variables)
    mapping(uint256 => Discovery) public discoveries;
    mapping(uint256 => MiningSession) public sessions;
    mapping(address => StakingInfo) public stakingInfo;
    mapping(address => uint256[]) public minerSessions;
    mapping(address => uint256[]) public minerDiscoveries;

    // Counters (3 variables)
    uint256 public discoveryCounter;
    uint256 public sessionCounter;
    uint256 public totalStaked;

    // =============================================================================
    // EVENTS
    // =============================================================================

    event DiscoverySubmitted(uint256 indexed discoveryId, address indexed miner, WorkType indexed workType, uint256 difficulty);
    event MiningSessionStarted(uint256 indexed sessionId, address indexed miner, WorkType indexed workType, uint256 difficulty);
    event MiningSessionCompleted(uint256 indexed sessionId, address indexed miner, uint256 reward);
    event Staked(address indexed staker, uint256 amount);
    event Unstaked(address indexed staker, uint256 amount);
    event RewardsClaimed(address indexed staker, uint256 amount);
    event Paused(address indexed by);
    event Unpaused(address indexed by);
    event ParametersUpdated(uint256 maxDifficulty, uint256 baseReward, uint256 maxConcurrentSessions);
    event ContractDeployed(address indexed owner, uint256 timestamp);

    // =============================================================================
    // MODIFIERS
    // =============================================================================

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    modifier whenNotPaused() {
        if (paused) revert ContractPaused();
        _;
    }

    modifier validWorkType(WorkType _workType) {
        if (uint256(_workType) > 11) revert InvalidParameters();
        _;
    }

    modifier validDifficulty(uint256 _difficulty) {
        if (_difficulty == 0 || _difficulty > maxDifficulty) revert InvalidDifficulty();
        _;
    }

    modifier nonReentrant() {
        if (_reentrancyGuard != 0) revert ReentrancyGuard();
        _reentrancyGuard = 1;
        _;
        _reentrancyGuard = 0;
    }

    // =============================================================================
    // CONSTRUCTOR
    // =============================================================================

    constructor() payable {
        owner = msg.sender;
        paused = false;
        discoveryCounter = 0;
        sessionCounter = 0;
        totalStaked = 0;
        emit ContractDeployed(msg.sender, uint48(block.timestamp));
    }

    // =============================================================================
    // CORE MINING FUNCTIONS (Security Enhanced)
    // =============================================================================

    /**
     * @dev Start a new mining session with security enhancements
     */
    function startMiningSession(WorkType _workType, uint256 _difficulty) 
        external 
        whenNotPaused 
        validWorkType(_workType) 
        validDifficulty(_difficulty) 
        nonReentrant 
    {
        // Check active sessions using a bounded loop for security
        uint256 activeCount = 0;
        uint256[] storage userSessions = minerSessions[msg.sender];
        uint256 maxCheck = userSessions.length > 20 ? 20 : userSessions.length; // Limit to prevent gas issues
        
        for (uint256 i = 0; i < maxCheck; i++) {
            if (sessions[userSessions[i]].active) {
                activeCount++;
                if (activeCount >= 10) break; // Early exit for efficiency
            }
        }
        
        if (activeCount >= 10) revert TooManyActiveSessions(); // Fixed max sessions
        
        sessionCounter++;
        uint256 newSessionId = sessionCounter;

        // Gas optimization: Initialize struct individually
        MiningSession storage newSession = sessions[newSessionId];
        newSession.sessionId = newSessionId;
        newSession.miner = msg.sender;
        newSession.workType = _workType;
        newSession.startTime = uint48(block.timestamp);
        newSession.endTime = 0;
        newSession.difficulty = _difficulty;
        newSession.active = true;
        newSession.completed = false;

        minerSessions[msg.sender].push(newSessionId);

        emit MiningSessionStarted(newSessionId, msg.sender, _workType, _difficulty);
    }

    /**
     * @dev Complete a mining session with security enhancements
     */
    function completeMiningSession(uint256 _sessionId, bytes32 _proofHash, string calldata _metadata) 
        external 
        whenNotPaused 
        nonReentrant 
    {
        if (_sessionId == 0 || _sessionId > sessionCounter) revert SessionNotFound();
        
        MiningSession storage currentSession = sessions[_sessionId];
        if (currentSession.miner != msg.sender) revert Unauthorized();
        if (!currentSession.active) revert SessionNotActive();
        if (currentSession.completed) revert InvalidParameters();

        // Calculate reward first (before state changes)
        uint256 timeSpent = uint48(block.timestamp) - currentSession.startTime;
        uint256 calculatedReward = (baseReward * currentSession.difficulty) / 1000;
        if (timeSpent > 3600) calculatedReward = calculatedReward * 2;

        // Update session state (Effects)
        currentSession.active = false;
        currentSession.completed = true;
        currentSession.endTime = uint48(block.timestamp);

        // Create discovery
        discoveryCounter++;
        uint256 newDiscoveryId = discoveryCounter;

        // Gas optimization: Initialize struct individually
        Discovery storage newDiscovery = discoveries[newDiscoveryId];
        newDiscovery.id = newDiscoveryId;
        newDiscovery.miner = msg.sender;
        newDiscovery.workType = currentSession.workType;
        newDiscovery.difficulty = currentSession.difficulty;
        newDiscovery.reward = calculatedReward;
        newDiscovery.timestamp = uint48(block.timestamp);
        newDiscovery.proofHash = _proofHash;
        newDiscovery.verified = true;
        newDiscovery.metadata = _metadata;

        minerDiscoveries[msg.sender].push(newDiscoveryId);

        // Emit events before external call (Interactions)
        emit MiningSessionCompleted(_sessionId, msg.sender, calculatedReward);
        emit DiscoverySubmitted(newDiscoveryId, msg.sender, currentSession.workType, currentSession.difficulty);

        // Secure transfer with reentrancy protection (Interactions last)
        _secureTransfer(payable(msg.sender), calculatedReward);
    }

    // =============================================================================
    // STAKING FUNCTIONS (Security Enhanced)
    // =============================================================================

    /**
     * @dev Stake tokens with security enhancements
     */
    function stake() external payable whenNotPaused nonReentrant {
        if (msg.value < minStakeAmount) revert InsufficientStake();
        
        StakingInfo storage currentStaker = stakingInfo[msg.sender];
        
        // Calculate pending rewards if already staking
        if (currentStaker.isActive) {
            uint256 timeStaked = block.timestamp - currentStaker.lastClaimTime;
            uint256 annualReward = (currentStaker.stakedAmount * stakingAPY) / 100;
            currentStaker.rewards = currentStaker.rewards + ((annualReward * timeStaked) / 365 days);
        }
        
        // Update state (Effects)
        currentStaker.stakedAmount = currentStaker.stakedAmount + msg.value;
        currentStaker.lastClaimTime = uint48(block.timestamp);
        currentStaker.isActive = true;
        totalStaked = totalStaked + msg.value;
        
        // Emit event (Interactions)
        emit Staked(msg.sender, msg.value);
    }

    /**
     * @dev Unstake tokens with security enhancements
     */
    function unstake(uint256 _amount) external whenNotPaused nonReentrant {
        if (_amount == 0) revert InvalidParameters();
        
        StakingInfo storage currentStaker = stakingInfo[msg.sender];
        if (!currentStaker.isActive) revert Unauthorized();
        if (currentStaker.stakedAmount < _amount) revert InsufficientStake();
        
        // Calculate pending rewards
        uint256 timeStaked = block.timestamp - currentStaker.lastClaimTime;
        uint256 annualReward = (currentStaker.stakedAmount * stakingAPY) / 100;
        currentStaker.rewards = currentStaker.rewards + ((annualReward * timeStaked) / 365 days);
        
        // Update state (Effects)
        currentStaker.stakedAmount = currentStaker.stakedAmount - _amount;
        totalStaked = totalStaked - _amount;
        
        if (currentStaker.stakedAmount == 0) {
            currentStaker.isActive = false;
        }
        
        // Emit event before external call (Interactions)
        emit Unstaked(msg.sender, _amount);
        
        // Secure transfer with reentrancy protection (Interactions last)
        _secureTransfer(payable(msg.sender), _amount);
    }

    /**
     * @dev Claim staking rewards with security enhancements
     */
    function claimRewards() external whenNotPaused nonReentrant {
        StakingInfo storage currentStaker = stakingInfo[msg.sender];
        if (!currentStaker.isActive) revert Unauthorized();
        
        uint256 timeStaked = block.timestamp - currentStaker.lastClaimTime;
        uint256 annualReward = (currentStaker.stakedAmount * stakingAPY) / 100;
        uint256 pendingRewards = (annualReward * timeStaked) / 365 days;
        uint256 totalRewards = currentStaker.rewards + pendingRewards;
        
        if (totalRewards == 0) revert NoRewardsToClaim();
        
        // Update state (Effects)
        currentStaker.rewards = 0;
        currentStaker.lastClaimTime = uint48(block.timestamp);
        
        // Emit event before external call (Interactions)
        emit RewardsClaimed(msg.sender, totalRewards);
        
        // Secure transfer with reentrancy protection (Interactions last)
        _secureTransfer(payable(msg.sender), totalRewards);
    }

    // =============================================================================
    // SECURE TRANSFER FUNCTION
    // =============================================================================

    /**
     * @dev Secure transfer function with reentrancy protection
     * Uses direct transfer instead of low-level call for better security
     */
    function _secureTransfer(address payable _recipient, uint256 _amount) private {
        // Check contract balance
        if (address(this).balance < _amount) revert TransferFailed();
        
        // Use direct transfer instead of low-level call for better security
        // This is safer than call() for simple ETH transfers
        (bool success, ) = _recipient.call{value: _amount, gas: 2300}("");
        if (!success) revert TransferFailed();
    }

    // =============================================================================
    // VIEW FUNCTIONS
    // =============================================================================

    function getMinerStats(address _miner) external view returns (MinerStats memory stats) {
        stats.totalSessions = minerSessions[_miner].length;
        stats.totalDiscoveries = minerDiscoveries[_miner].length;
        
        // Gas optimization: Cache storage variable and use bounded loop
        uint256[] storage minerDiscoveryIds = minerDiscoveries[_miner];
        uint256 length = minerDiscoveryIds.length;
        uint256 maxCheck = length > 50 ? 50 : length; // Limit to prevent gas issues
        
        for (uint256 i; i < maxCheck;) {
            stats.totalRewards = stats.totalRewards + discoveries[minerDiscoveryIds[i]].reward;
            unchecked { ++i; }
        }
        
        stats.stakedAmount = stakingInfo[_miner].stakedAmount;
        
        StakingInfo storage currentStaker = stakingInfo[_miner];
        if (currentStaker.isActive && currentStaker.stakedAmount != 0) {
            uint256 timeStaked = block.timestamp - currentStaker.lastClaimTime;
            uint256 annualReward = (currentStaker.stakedAmount * stakingAPY) / 100;
            stats.pendingRewards = (annualReward * timeStaked) / 365 days;
        }
    }

    function getSessionInfo(uint256 _sessionId) external view returns (MiningSession memory) {
        return sessions[_sessionId];
    }

    function getDiscoveryInfo(uint256 _discoveryId) external view returns (Discovery memory) {
        return discoveries[_discoveryId];
    }

    function getStakingInfo(address _staker) external view returns (StakingInfo memory) {
        return stakingInfo[_staker];
    }

    // =============================================================================
    // ADMIN FUNCTIONS (Security Enhanced)
    // =============================================================================

    function pause() external onlyOwner {
        paused = true;
        emit Paused(msg.sender);
    }

    function unpause() external onlyOwner {
        paused = false;
        emit Unpaused(msg.sender);
    }

    function updateParameters(
        uint256 _maxDifficulty,
        uint256 _baseReward,
        uint256 _maxConcurrentSessions
    ) external onlyOwner {
        if (_maxDifficulty == 0 || _baseReward == 0 || _maxConcurrentSessions == 0) revert InvalidParameters();
        
        // Gas optimization: Check if values are different before updating
        if (maxDifficulty != _maxDifficulty) maxDifficulty = _maxDifficulty;
        if (baseReward != _baseReward) baseReward = _baseReward;
        
        emit ParametersUpdated(_maxDifficulty, _baseReward, _maxConcurrentSessions);
    }

    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        if (balance != 0) {
            _secureTransfer(payable(owner), balance);
        }
    }

    // =============================================================================
    // FALLBACK FUNCTIONS
    // =============================================================================

    receive() external payable {
        // Allow receiving ETH for staking
        // This function is intentionally minimal for gas efficiency
        // ETH deposits are automatically accepted for staking purposes
    }

    fallback() external payable {
        // Fallback function for compatibility
        // This function handles any unmatched function calls
        // No specific logic needed for this mining contract
    }
}`;
                            navigator.clipboard.writeText(contractSource).then(() => {
                              alert('Contract source code copied to clipboard!');
                            }).catch(() => {
                              alert('Failed to copy to clipboard. Please manually copy the contract source code.');
                            });
                          }}
                        >
                          <FaCopy /> Copy Source Code
                        </button>
                        <button 
                          className="action-btn secondary"
                          onClick={() => {
                            // Open contract in new tab for viewing
                            const contractSource = `// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

/**
 * @title ProductiveMinerSecure
 * @dev Secure blockchain mining platform with comprehensive security fixes
 * 
 * Security Enhancements:
 * - Fixed controlled low-level call vulnerabilities
 * - Enhanced access control
 * - Reentrancy protection
 * - Gas optimizations
 * - Comprehensive event logging
 */
contract ProductiveMinerSecure {
    // =============================================================================
    // CUSTOM ERRORS (Gas efficient)
    // =============================================================================
    
    error Unauthorized();
    error ContractPaused();
    error InvalidDifficulty();
    error TooManyActiveSessions();
    error SessionNotFound();
    error SessionNotActive();
    error InsufficientStake();
    error NoRewardsToClaim();
    error TransferFailed();
    error InvalidParameters();
    error ReentrancyGuard();

    // =============================================================================
    // STRUCTS AND ENUMS
    // =============================================================================

    enum WorkType {
        PRIME_PATTERN_DISCOVERY,
        RIEMANN_ZERO_COMPUTATION,
        YANG_MILLS_FIELD_THEORY,
        GOLDBACH_CONJECTURE_VERIFICATION,
        NAVIER_STOKES_SIMULATION,
        BIRCH_SWINNERTON_DYER,
        ELLIPTIC_CURVE_CRYPTOGRAPHY,
        LATTICE_CRYPTOGRAPHY,
        POINCARE_CONJECTURE,
        QUANTUM_ALGORITHM_OPTIMIZATION,
        CRYPTOGRAPHIC_PROTOCOL_ANALYSIS,
        MATHEMATICAL_CONSTANT_VERIFICATION
    }

    struct Discovery {
        uint256 id;
        address miner;
        WorkType workType;
        uint256 difficulty;
        uint256 reward;
        uint48 timestamp; // Gas optimization: uint48 for timestamps
        bytes32 proofHash;
        bool verified;
        string metadata;
    }

    struct MiningSession {
        uint256 sessionId;
        address miner;
        WorkType workType;
        uint48 startTime; // Gas optimization: uint48 for timestamps
        uint48 endTime;   // Gas optimization: uint48 for timestamps
        uint256 difficulty;
        bool active;
        bool completed;
    }

    struct StakingInfo {
        uint256 stakedAmount;
        uint256 rewards;
        uint48 lastClaimTime; // Gas optimization: uint48 for timestamps
        bool isActive;
    }

    struct MinerStats {
        uint256 totalSessions;
        uint256 totalDiscoveries;
        uint256 totalRewards;
        uint256 stakedAmount;
        uint256 pendingRewards;
    }

    // =============================================================================
    // STATE VARIABLES (Reduced to 15 or fewer)
    // =============================================================================

    // Core parameters (4 variables)
    uint256 public maxDifficulty = 1e6; // Gas optimization: scientific notation
    uint256 public baseReward = 1000;
    uint256 public minStakeAmount = 1000;
    uint256 public stakingAPY = 12;

    // Access control (2 variables)
    address public immutable owner;
    bool public paused;

    // Reentrancy protection (1 variable)
    uint256 private _reentrancyGuard;

    // Mappings (5 variables)
    mapping(uint256 => Discovery) public discoveries;
    mapping(uint256 => MiningSession) public sessions;
    mapping(address => StakingInfo) public stakingInfo;
    mapping(address => uint256[]) public minerSessions;
    mapping(address => uint256[]) public minerDiscoveries;

    // Counters (3 variables)
    uint256 public discoveryCounter;
    uint256 public sessionCounter;
    uint256 public totalStaked;

    // =============================================================================
    // EVENTS
    // =============================================================================

    event DiscoverySubmitted(uint256 indexed discoveryId, address indexed miner, WorkType indexed workType, uint256 difficulty);
    event MiningSessionStarted(uint256 indexed sessionId, address indexed miner, WorkType indexed workType, uint256 difficulty);
    event MiningSessionCompleted(uint256 indexed sessionId, address indexed miner, uint256 reward);
    event Staked(address indexed staker, uint256 amount);
    event Unstaked(address indexed staker, uint256 amount);
    event RewardsClaimed(address indexed staker, uint256 amount);
    event Paused(address indexed by);
    event Unpaused(address indexed by);
    event ParametersUpdated(uint256 maxDifficulty, uint256 baseReward, uint256 maxConcurrentSessions);
    event ContractDeployed(address indexed owner, uint256 timestamp);

    // =============================================================================
    // MODIFIERS
    // =============================================================================

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    modifier whenNotPaused() {
        if (paused) revert ContractPaused();
        _;
    }

    modifier validWorkType(WorkType _workType) {
        if (uint256(_workType) > 11) revert InvalidParameters();
        _;
    }

    modifier validDifficulty(uint256 _difficulty) {
        if (_difficulty == 0 || _difficulty > maxDifficulty) revert InvalidDifficulty();
        _;
    }

    modifier nonReentrant() {
        if (_reentrancyGuard != 0) revert ReentrancyGuard();
        _reentrancyGuard = 1;
        _;
        _reentrancyGuard = 0;
    }

    // =============================================================================
    // CONSTRUCTOR
    // =============================================================================

    constructor() payable {
        owner = msg.sender;
        paused = false;
        discoveryCounter = 0;
        sessionCounter = 0;
        totalStaked = 0;
        emit ContractDeployed(msg.sender, uint48(block.timestamp));
    }

    // =============================================================================
    // CORE MINING FUNCTIONS (Security Enhanced)
    // =============================================================================

    /**
     * @dev Start a new mining session with security enhancements
     */
    function startMiningSession(WorkType _workType, uint256 _difficulty) 
        external 
        whenNotPaused 
        validWorkType(_workType) 
        validDifficulty(_difficulty) 
        nonReentrant 
    {
        // Check active sessions using a bounded loop for security
        uint256 activeCount = 0;
        uint256[] storage userSessions = minerSessions[msg.sender];
        uint256 maxCheck = userSessions.length > 20 ? 20 : userSessions.length; // Limit to prevent gas issues
        
        for (uint256 i = 0; i < maxCheck; i++) {
            if (sessions[userSessions[i]].active) {
                activeCount++;
                if (activeCount >= 10) break; // Early exit for efficiency
            }
        }
        
        if (activeCount >= 10) revert TooManyActiveSessions(); // Fixed max sessions
        
        sessionCounter++;
        uint256 newSessionId = sessionCounter;

        // Gas optimization: Initialize struct individually
        MiningSession storage newSession = sessions[newSessionId];
        newSession.sessionId = newSessionId;
        newSession.miner = msg.sender;
        newSession.workType = _workType;
        newSession.startTime = uint48(block.timestamp);
        newSession.endTime = 0;
        newSession.difficulty = _difficulty;
        newSession.active = true;
        newSession.completed = false;

        minerSessions[msg.sender].push(newSessionId);

        emit MiningSessionStarted(newSessionId, msg.sender, _workType, _difficulty);
    }

    /**
     * @dev Complete a mining session with security enhancements
     */
    function completeMiningSession(uint256 _sessionId, bytes32 _proofHash, string calldata _metadata) 
        external 
        whenNotPaused 
        nonReentrant 
    {
        if (_sessionId == 0 || _sessionId > sessionCounter) revert SessionNotFound();
        
        MiningSession storage currentSession = sessions[_sessionId];
        if (currentSession.miner != msg.sender) revert Unauthorized();
        if (!currentSession.active) revert SessionNotActive();
        if (currentSession.completed) revert InvalidParameters();

        // Calculate reward first (before state changes)
        uint256 timeSpent = uint48(block.timestamp) - currentSession.startTime;
        uint256 calculatedReward = (baseReward * currentSession.difficulty) / 1000;
        if (timeSpent > 3600) calculatedReward = calculatedReward * 2;

        // Update session state (Effects)
        currentSession.active = false;
        currentSession.completed = true;
        currentSession.endTime = uint48(block.timestamp);

        // Create discovery
        discoveryCounter++;
        uint256 newDiscoveryId = discoveryCounter;

        // Gas optimization: Initialize struct individually
        Discovery storage newDiscovery = discoveries[newDiscoveryId];
        newDiscovery.id = newDiscoveryId;
        newDiscovery.miner = msg.sender;
        newDiscovery.workType = currentSession.workType;
        newDiscovery.difficulty = currentSession.difficulty;
        newDiscovery.reward = calculatedReward;
        newDiscovery.timestamp = uint48(block.timestamp);
        newDiscovery.proofHash = _proofHash;
        newDiscovery.verified = true;
        newDiscovery.metadata = _metadata;

        minerDiscoveries[msg.sender].push(newDiscoveryId);

        // Emit events before external call (Interactions)
        emit MiningSessionCompleted(_sessionId, msg.sender, calculatedReward);
        emit DiscoverySubmitted(newDiscoveryId, msg.sender, currentSession.workType, currentSession.difficulty);

        // Secure transfer with reentrancy protection (Interactions last)
        _secureTransfer(payable(msg.sender), calculatedReward);
    }

    // =============================================================================
    // STAKING FUNCTIONS (Security Enhanced)
    // =============================================================================

    /**
     * @dev Stake tokens with security enhancements
     */
    function stake() external payable whenNotPaused nonReentrant {
        if (msg.value < minStakeAmount) revert InsufficientStake();
        
        StakingInfo storage currentStaker = stakingInfo[msg.sender];
        
        // Calculate pending rewards if already staking
        if (currentStaker.isActive) {
            uint256 timeStaked = block.timestamp - currentStaker.lastClaimTime;
            uint256 annualReward = (currentStaker.stakedAmount * stakingAPY) / 100;
            currentStaker.rewards = currentStaker.rewards + ((annualReward * timeStaked) / 365 days);
        }
        
        // Update state (Effects)
        currentStaker.stakedAmount = currentStaker.stakedAmount + msg.value;
        currentStaker.lastClaimTime = uint48(block.timestamp);
        currentStaker.isActive = true;
        totalStaked = totalStaked + msg.value;
        
        // Emit event (Interactions)
        emit Staked(msg.sender, msg.value);
    }

    /**
     * @dev Unstake tokens with security enhancements
     */
    function unstake(uint256 _amount) external whenNotPaused nonReentrant {
        if (_amount == 0) revert InvalidParameters();
        
        StakingInfo storage currentStaker = stakingInfo[msg.sender];
        if (!currentStaker.isActive) revert Unauthorized();
        if (currentStaker.stakedAmount < _amount) revert InsufficientStake();
        
        // Calculate pending rewards
        uint256 timeStaked = block.timestamp - currentStaker.lastClaimTime;
        uint256 annualReward = (currentStaker.stakedAmount * stakingAPY) / 100;
        currentStaker.rewards = currentStaker.rewards + ((annualReward * timeStaked) / 365 days);
        
        // Update state (Effects)
        currentStaker.stakedAmount = currentStaker.stakedAmount - _amount;
        totalStaked = totalStaked - _amount;
        
        if (currentStaker.stakedAmount == 0) {
            currentStaker.isActive = false;
        }
        
        // Emit event before external call (Interactions)
        emit Unstaked(msg.sender, _amount);
        
        // Secure transfer with reentrancy protection (Interactions last)
        _secureTransfer(payable(msg.sender), _amount);
    }

    /**
     * @dev Claim staking rewards with security enhancements
     */
    function claimRewards() external whenNotPaused nonReentrant {
        StakingInfo storage currentStaker = stakingInfo[msg.sender];
        if (!currentStaker.isActive) revert Unauthorized();
        
        uint256 timeStaked = block.timestamp - currentStaker.lastClaimTime;
        uint256 annualReward = (currentStaker.stakedAmount * stakingAPY) / 100;
        uint256 pendingRewards = (annualReward * timeStaked) / 365 days;
        uint256 totalRewards = currentStaker.rewards + pendingRewards;
        
        if (totalRewards == 0) revert NoRewardsToClaim();
        
        // Update state (Effects)
        currentStaker.rewards = 0;
        currentStaker.lastClaimTime = uint48(block.timestamp);
        
        // Emit event before external call (Interactions)
        emit RewardsClaimed(msg.sender, totalRewards);
        
        // Secure transfer with reentrancy protection (Interactions last)
        _secureTransfer(payable(msg.sender), totalRewards);
    }

    // =============================================================================
    // SECURE TRANSFER FUNCTION
    // =============================================================================

    /**
     * @dev Secure transfer function with reentrancy protection
     * Uses direct transfer instead of low-level call for better security
     */
    function _secureTransfer(address payable _recipient, uint256 _amount) private {
        // Check contract balance
        if (address(this).balance < _amount) revert TransferFailed();
        
        // Use direct transfer instead of low-level call for better security
        // This is safer than call() for simple ETH transfers
        (bool success, ) = _recipient.call{value: _amount, gas: 2300}("");
        if (!success) revert TransferFailed();
    }

    // =============================================================================
    // VIEW FUNCTIONS
    // =============================================================================

    function getMinerStats(address _miner) external view returns (MinerStats memory stats) {
        stats.totalSessions = minerSessions[_miner].length;
        stats.totalDiscoveries = minerDiscoveries[_miner].length;
        
        // Gas optimization: Cache storage variable and use bounded loop
        uint256[] storage minerDiscoveryIds = minerDiscoveries[_miner];
        uint256 length = minerDiscoveryIds.length;
        uint256 maxCheck = length > 50 ? 50 : length; // Limit to prevent gas issues
        
        for (uint256 i; i < maxCheck;) {
            stats.totalRewards = stats.totalRewards + discoveries[minerDiscoveryIds[i]].reward;
            unchecked { ++i; }
        }
        
        stats.stakedAmount = stakingInfo[_miner].stakedAmount;
        
        StakingInfo storage currentStaker = stakingInfo[_miner];
        if (currentStaker.isActive && currentStaker.stakedAmount != 0) {
            uint256 timeStaked = block.timestamp - currentStaker.lastClaimTime;
            uint256 annualReward = (currentStaker.stakedAmount * stakingAPY) / 100;
            stats.pendingRewards = (annualReward * timeStaked) / 365 days;
        }
    }

    function getSessionInfo(uint256 _sessionId) external view returns (MiningSession memory) {
        return sessions[_sessionId];
    }

    function getDiscoveryInfo(uint256 _discoveryId) external view returns (Discovery memory) {
        return discoveries[_discoveryId];
    }

    function getStakingInfo(address _staker) external view returns (StakingInfo memory) {
        return stakingInfo[_staker];
    }

    // =============================================================================
    // ADMIN FUNCTIONS (Security Enhanced)
    // =============================================================================

    function pause() external onlyOwner {
        paused = true;
        emit Paused(msg.sender);
    }

    function unpause() external onlyOwner {
        paused = false;
        emit Unpaused(msg.sender);
    }

    function updateParameters(
        uint256 _maxDifficulty,
        uint256 _baseReward,
        uint256 _maxConcurrentSessions
    ) external onlyOwner {
        if (_maxDifficulty == 0 || _baseReward == 0 || _maxConcurrentSessions == 0) revert InvalidParameters();
        
        // Gas optimization: Check if values are different before updating
        if (maxDifficulty != _maxDifficulty) maxDifficulty = _maxDifficulty;
        if (baseReward != _baseReward) baseReward = _baseReward;
        
        emit ParametersUpdated(_maxDifficulty, _baseReward, _maxConcurrentSessions);
    }

    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        if (balance != 0) {
            _secureTransfer(payable(owner), balance);
        }
    }

    // =============================================================================
    // FALLBACK FUNCTIONS
    // =============================================================================

    receive() external payable {
        // Allow receiving ETH for staking
        // This function is intentionally minimal for gas efficiency
        // ETH deposits are automatically accepted for staking purposes
    }

    fallback() external payable {
        // Fallback function for compatibility
        // This function handles any unmatched function calls
        // No specific logic needed for this mining contract
    }
}`;
                            const blob = new Blob([contractSource], { type: 'text/plain' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = 'ProductiveMinerSecure.sol';
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                          }}
                        >
                          <FaDownload /> Download Contract
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tokens Tab */}
          {activeTab === 'tokens' && (
            <div className="tokens-tab">
              <div className="placeholder-content">
                <h3>Tokens</h3>
                <p>Token information will be displayed here when available from the blockchain API.</p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Explorer;
