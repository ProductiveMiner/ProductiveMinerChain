import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from 'react-query';
import {
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  FaFlask,
  FaMicroscope,
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
  FaNetworkWired,
  FaFileAlt,
  FaDownload,
  FaShare,
  FaStar,
  FaShieldAlt
} from 'react-icons/fa';
import web3Service from '../services/web3Service';
import { backendAPI, mathEngineAPI } from '../utils/api';
import './Research.css';

const Research = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
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

  // Fetch research papers from backend (non-blockchain data)
  const { data: researchPapers, isLoading: papersLoading } = useQuery(
    ['researchPapers'],
    () => backendAPI.getResearchPapers(),
    { 
      refetchInterval: 30000,
      onSuccess: (data) => {
        console.log('🎯 Research - Research papers received:', data);
      },
      onError: (error) => {
        console.error('❌ Research - Research papers error:', error);
      }
    }
  );

  // Fetch discoveries from mathematical engine (non-blockchain data)
  const { data: discoveries, isLoading: discoveriesLoading } = useQuery(
    ['discoveries'],
    () => mathEngineAPI.getDiscoveries(),
    { 
      refetchInterval: 30000,
      onSuccess: (data) => {
        console.log('🎯 Research - Discoveries received:', data);
      },
      onError: (error) => {
        console.error('❌ Research - Discoveries error:', error);
      }
    }
  );

  // Fetch user's personal miner stats
  const { data: userMinerStats, isLoading: userStatsLoading } = useQuery(
    ['userMinerStats', currentAccount],
    async () => {
      if (!web3Service.isWeb3Connected() || !currentAccount) return null;
      return await web3Service.getMinerStats(currentAccount);
    },
    { 
      refetchInterval: 30000,
      enabled: web3Connected && !!currentAccount,
      onSuccess: (data) => {
        console.log('🎯 Research - User miner stats received:', data);
      },
      onError: (error) => {
        console.error('❌ Research - User miner stats error:', error);
      }
    }
  );

  // Fetch network stats from backend (non-blockchain data)
  const { data: networkStats, isLoading: networkLoading } = useQuery(
    ['networkStats'],
    () => backendAPI.getContractNetworkStats(),
    { 
      refetchInterval: 30000,
      onSuccess: (data) => {
        console.log('🎯 Research - Network stats received:', data);
      },
      onError: (error) => {
        console.error('❌ Research - Network stats error:', error);
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

  // Prepare data for charts
  const networkData = {
    totalStaked: contractInfo?.totalStaked || 0,
    maxDifficulty: contractInfo?.maxDifficulty || 0,
    baseReward: contractInfo?.baseReward || 0,
    paused: contractInfo?.paused || false,
    owner: contractInfo?.owner || '0x0000...0000'
  };

  const researchData = {
    totalPapers: researchPapers?.papers?.length || 0,
    totalDiscoveries: userMinerStats?.totalDiscoveries || contractInfo?.totalDiscoveries || networkStats?.data?.totalDiscoveries || 0,
    totalCitations: 0, // No citations endpoint available
    averageComplexity: parseInt(contractInfo?.quantumSecurityLevel || networkStats?.data?.quantumSecurityLevel) || 0
  };

  const discoveriesData = discoveries?.discoveries || [];

  const papersData = researchPapers?.papers || [];

  const categories = [
    { id: 'all', name: 'All Research', icon: <FaFlask /> },
    { id: 'mathematics', name: 'Mathematics', icon: <FaBrain /> },
    { id: 'cryptography', name: 'Cryptography', icon: <FaShieldAlt /> },
    { id: 'physics', name: 'Physics', icon: <FaMicroscope /> },
    { id: 'computer-science', name: 'Computer Science', icon: <FaCog /> }
  ];

  // Sample research papers for each category
  const samplePapers = [
    {
      title: 'Riemann Hypothesis Computational Analysis',
      authors: 'ProductiveMiner Research Team',
      category: 'mathematics',
      abstract: 'Advanced computational analysis of the Riemann Hypothesis using distributed computing techniques and novel mathematical approaches.',
      citations: 45,
      publishDate: '2024'
    },
    {
      title: 'Quantum-Resistant Cryptographic Protocols',
      authors: 'ProductiveMiner Security Team',
      category: 'cryptography',
      abstract: 'Development of post-quantum cryptographic protocols using lattice-based cryptography and mathematical optimization techniques.',
      citations: 32,
      publishDate: '2024'
    },
    {
      title: 'Yang-Mills Field Theory Solutions',
      authors: 'ProductiveMiner Physics Division',
      category: 'physics',
      abstract: 'Breakthrough solutions to Yang-Mills field theory equations with practical applications in particle physics.',
      citations: 28,
      publishDate: '2024'
    },
    {
      title: 'Distributed Computing Optimization Algorithms',
      authors: 'ProductiveMiner CS Team',
      category: 'computer-science',
      abstract: 'Novel algorithms for optimizing distributed computing systems with applications in blockchain and cloud computing.',
      citations: 38,
      publishDate: '2024'
    },
    {
      title: 'Goldbach Conjecture Verification',
      authors: 'ProductiveMiner Mathematics Lab',
      category: 'mathematics',
      abstract: 'Computational verification of the Goldbach conjecture for large numbers using advanced number theory techniques.',
      citations: 52,
      publishDate: '2024'
    },
    {
      title: 'Zero-Knowledge Proof Systems',
      authors: 'ProductiveMiner Cryptography Lab',
      category: 'cryptography',
      abstract: 'Implementation and analysis of zero-knowledge proof systems for blockchain privacy and security applications.',
      citations: 41,
      publishDate: '2024'
    }
  ];

  const filteredPapers = selectedCategory === 'all' 
    ? (papersData.length > 0 ? papersData : samplePapers)
    : (papersData.length > 0 ? papersData.filter(paper => paper.category === selectedCategory) : samplePapers.filter(paper => paper.category === selectedCategory));

  return (
    <div className="research">
      <div className="research-container">
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
            <strong>Wallet Not Connected</strong> - Connect your MetaMask wallet to view detailed research data.
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
          className="research-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="header-content">
            <h1>Research & Discoveries</h1>
            <p>Explore mathematical discoveries and research papers from the ProductiveMiner platform</p>
          </div>
        </motion.div>

        {/* Research Statistics */}
        <motion.div
          className="research-stats"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h3>Research Statistics</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">
                <FaFileAlt />
              </div>
              <div className="stat-content">
                <h4>Total Papers</h4>
                <p className="stat-value">{formatNumber(researchData.totalPapers)}</p>
                <p className="stat-description">Published research papers</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <FaBrain />
              </div>
              <div className="stat-content">
                <h4>Total Discoveries</h4>
                <p className="stat-value">{formatNumber(researchData.totalDiscoveries)}</p>
                <p className="stat-description">Mathematical discoveries</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <FaShare />
              </div>
              <div className="stat-content">
                <h4>Total Citations</h4>
                <p className="stat-value">{formatNumber(researchData.totalCitations)}</p>
                <p className="stat-description">Research citations</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <FaCog />
              </div>
              <div className="stat-content">
                <h4>Avg Complexity</h4>
                <p className="stat-value">{researchData.averageComplexity || 0}</p>
                <p className="stat-description">Average computational complexity</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Network Overview */}
        <motion.div
          className="network-overview"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
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

        {/* Category Filter */}
        <motion.div
          className="category-filter"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h3>Research Categories</h3>
          <div className="category-buttons">
            {categories.map((category) => (
              <button
                key={category.id}
                className={`category-btn ${selectedCategory === category.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.icon}
                {category.name}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Research Papers */}
        <motion.div
          className="research-papers"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h3>Research Papers</h3>
          <div className="papers-grid">
            {filteredPapers.map((paper, index) => (
              <div key={index} className="paper-card">
                <div className="paper-header">
                  <div className="paper-icon">
                    <FaFileAlt />
                  </div>
                  <div className="paper-meta">
                    <h4>{paper.title}</h4>
                    <p className="paper-authors">{paper.authors}</p>
                    <span className="paper-category">{paper.category}</span>
                  </div>
                </div>
                <div className="paper-content">
                  <p>{paper.abstract}</p>
                </div>
                <div className="paper-footer">
                  <div className="paper-stats">
                    <span className="stat">
                      <FaStar />
                      {paper.citations} citations
                    </span>
                    <span className="stat">
                      <FaClock />
                      {paper.publishDate}
                    </span>
                  </div>
                  <div className="paper-actions">
                    <button className="action-btn">
                      <FaDownload />
                      Download
                    </button>
                    <button className="action-btn">
                      <FaShare />
                      Share
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent Discoveries */}
        <motion.div
          className="recent-discoveries"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <h3>Recent Mathematical Discoveries</h3>
          <div className="discoveries-grid">
            {discoveriesData.length > 0 ? (
              discoveriesData.slice(0, 6).map((discovery, index) => (
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
              ))
            ) : (
              <>
                <div className="discovery-card">
                  <div className="discovery-icon">
                    <FaBrain />
                  </div>
                  <div className="discovery-content">
                    <h4>New Prime Number Pattern</h4>
                    <p>Discovery of a novel pattern in prime number distribution using advanced computational methods.</p>
                    <span className="discovery-type">Mathematics</span>
                  </div>
                </div>

                <div className="discovery-card">
                  <div className="discovery-icon">
                    <FaBrain />
                  </div>
                  <div className="discovery-content">
                    <h4>Yang-Mills Field Solution</h4>
                    <p>Breakthrough solution to Yang-Mills field theory equations with practical applications.</p>
                    <span className="discovery-type">Physics</span>
                  </div>
                </div>

                <div className="discovery-card">
                  <div className="discovery-icon">
                    <FaBrain />
                  </div>
                  <div className="discovery-content">
                    <h4>Goldbach Conjecture Verification</h4>
                    <p>Computational verification of the Goldbach conjecture for large numbers.</p>
                    <span className="discovery-type">Mathematics</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </motion.div>

        {/* Research Performance Charts */}
        <motion.div
          className="research-charts"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <h3>Research Performance</h3>
          <div className="charts-grid">
            <div className="chart-card">
              <h4>Discoveries Over Time</h4>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={[
                    { month: 'Jan', discoveries: 12 },
                    { month: 'Feb', discoveries: 15 },
                    { month: 'Mar', discoveries: 18 },
                    { month: 'Apr', discoveries: 22 },
                    { month: 'May', discoveries: 25 },
                    { month: 'Jun', discoveries: 28 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="month" stroke="rgba(255,255,255,0.6)" />
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
                      dataKey="discoveries" 
                      stroke="#ffd700" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="chart-card">
              <h4>Research Categories Distribution</h4>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Mathematics', value: 40 },
                        { name: 'Cryptography', value: 25 },
                        { name: 'Physics', value: 20 },
                        { name: 'Computer Science', value: 15 }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[
                        { name: 'Mathematics', value: 40 },
                        { name: 'Cryptography', value: 25 },
                        { name: 'Physics', value: 20 },
                        { name: 'Computer Science', value: 15 }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`hsl(${index * 90}, 70%, 60%)`} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Research;
