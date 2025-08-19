import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { web3Service } from '../services/web3Service';
import minedTokenService from '../services/minedTokenService';
import CONTRACT_CONFIG from '../config/contracts';
import { 
  FaWallet, 
  FaExchangeAlt, 
  FaStickyNote, 
  FaCoins, 
  FaChartLine, 
  FaCog, 
  FaCopy, 
  FaQrcode,
  FaDownload,
  FaUpload,
  FaHistory,
  FaShieldAlt,
  FaRocket,
  FaPause,
  FaPlay,
  FaExclamationTriangle,
  FaCheckCircle
} from 'react-icons/fa';
import './Wallet.css';

const Wallet = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState(null);
  const [balance, setBalance] = useState(0);
  const [minedBalance, setMinedBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [stakingInfo, setStakingInfo] = useState({
    staked: 0,
    rewards: 0,
    apy: 0,
    validators: []
  });
  const [miningInfo, setMiningInfo] = useState({
    isMining: false,
    currentEngine: null,
    hashrate: 0,
    rewards: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [contractInfo, setContractInfo] = useState(null);
  const [tokenInfo, setTokenInfo] = useState(null);


  const [activeTab, setActiveTab] = useState('overview');
  const [showSendModal, setShowSendModal] = useState(false);
  const [showStakeModal, setShowStakeModal] = useState(false);
  const [sendForm, setSendForm] = useState({
    toAddress: '',
    amount: '',
    gasLimit: '21000',
  });
  const [stakeForm, setStakeForm] = useState({
    amount: '',
    validatorAddress: '',
  });

  // Refresh wallet data
  const refreshWalletData = async () => {
    try {
      if (!web3Service.getCurrentAccount()) return;
      
      console.log('Refreshing wallet data...');
      
      // Get balance directly from blockchain instead of API
      const tokenBalance = await web3Service.getTokenBalance();
      const balanceInEther = web3Service.web3.utils.fromWei(tokenBalance, 'ether');
      setMinedBalance(balanceInEther);
      console.log('Updated MINED token balance from blockchain:', balanceInEther);
      
      // Refresh token information
      const info = await web3Service.getTokenInfo();
      setTokenInfo(info);
      
      // Refresh staking info
      const staking = await web3Service.getStakingInfo(web3Service.getCurrentAccount());
      setStakingInfo({
        staked: staking?.stakedAmount || 0,
        rewards: staking?.rewards || 0,
        apy: staking?.apy || 0,
        validators: []
      });
      
    } catch (error) {
      console.error('Error refreshing wallet data:', error);
    }
  };

  // Initialize Web3 connection
  useEffect(() => {
    const initializeWeb3 = async () => {
      try {
        setLoading(true);
        const connected = await web3Service.initialize();
        if (connected) {
          setIsConnected(true);
          setAddress(web3Service.getCurrentAccount());
          
          // Get contract info
          const info = await web3Service.getTokenInfo();
          setContractInfo(info);
          setTokenInfo(info);
          
          // Initialize MINED token service
          await minedTokenService.initialize();
          
          // Get miner stats if account is available
          if (web3Service.getCurrentAccount()) {

            
            // Get staking info
            const staking = await web3Service.getStakingInfo(web3Service.getCurrentAccount());
            setStakingInfo({
              staked: staking?.stakedAmount || 0,
              rewards: staking?.rewards || 0,
              apy: 0, // Would need to calculate from contract
              validators: []
            });
            
            // Get MINED token balance directly from blockchain
            const tokenBalance = await web3Service.getTokenBalance();
            const balanceInEther = web3Service.web3.utils.fromWei(tokenBalance, 'ether');
            setMinedBalance(balanceInEther);
            console.log('Initial MINED token balance from blockchain:', balanceInEther);
          }
          
          // Setup listeners
          web3Service.setupAccountListener((account) => {
            setAddress(account);
            if (account) {
              // Get balance directly from blockchain
              web3Service.getTokenBalance().then((balance) => {
                const balanceInEther = web3Service.web3.utils.fromWei(balance, 'ether');
                setMinedBalance(balanceInEther);
              });
              web3Service.getStakingInfo(account).then((staking) => {
                setStakingInfo({
                  staked: staking?.stakedAmount || 0,
                  rewards: staking?.rewards || 0,
                  apy: staking?.apy || 0,
                  validators: []
                });
              });
            }
          });
          
          web3Service.setupNetworkListener((network) => {
            console.log('Network changed:', network);
          });
        }
      } catch (error) {
        console.error('Failed to initialize Web3:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    initializeWeb3();
  }, []);

  // Auto-refresh wallet data every 30 seconds
  useEffect(() => {
    if (isConnected) {
      const interval = setInterval(refreshWalletData, 30000);
      return () => clearInterval(interval);
    }
  }, [isConnected]);

  const connectWallet = async () => {
    try {
      setLoading(true);
      const connected = await web3Service.initialize();
      if (connected) {
        setIsConnected(true);
        setAddress(web3Service.getCurrentAccount());
        setError(null);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const disconnectWallet = () => {
    web3Service.disconnect();
    setIsConnected(false);
    setAddress(null);
    setBalance(0);
    setTransactions([]);
    setStakingInfo({ staked: 0, rewards: 0, apy: 0, validators: [] });
    setMiningInfo({ isMining: false, currentEngine: null, hashrate: 0, rewards: 0 });
    setContractInfo(null);
    
    setError(null);
  };

  const handleSendTransaction = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      // This would need to be implemented based on your contract's transfer function
      // For now, we'll just show an error
      throw new Error('Transfer functionality not yet implemented');
    } catch (error) {
      console.error('Transaction failed:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStakeTokens = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const amount = web3Service.web3.utils.toWei(stakeForm.amount, 'ether');
      const result = await web3Service.stakeTokens(stakeForm.amount);
      console.log('Staking successful:', result);
      
      // Refresh data
      await refreshWalletData();
      setShowStakeModal(false);
      setStakeForm({ amount: '', validatorAddress: '' });
    } catch (error) {
      console.error('Staking failed:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUnstakeTokens = async (amount) => {
    try {
      setLoading(true);
      const weiAmount = web3Service.web3.utils.toWei(amount.toString(), 'ether');
      const result = await web3Service.unstakeTokens(amount);
      console.log('Unstaking successful:', result);
      
      // Refresh data
      await refreshWalletData();
    } catch (error) {
      console.error('Unstaking failed:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimRewards = async () => {
    try {
      setLoading(true);
      const result = await web3Service.claimStakingRewards();
      console.log('Claim rewards successful:', result);
      
      // Refresh data
      await refreshWalletData();
    } catch (error) {
      console.error('Claim rewards failed:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(address);
  };

  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatBalance = (balance) => {
    if (!balance) return '0 MINED';
    
    // If balance is in wei (large number), convert to ether first
    let num = parseFloat(balance);
    if (num > 1e15) { // If it's likely in wei (more than 0.001 ether)
      num = num / 1e18; // Convert wei to ether
    }
    
    return `${num.toFixed(2)} MINED`;
  };

  const formatCurrency = (amount) => {
    if (!amount) return '0 MINED';
    return `${parseFloat(amount).toFixed(2)} MINED`;
  };

  const clearError = () => {
    setError(null);
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <FaWallet /> },
    { id: 'mined-tokens', label: 'MINED Tokens', icon: <FaCoins /> },
    { id: 'transactions', label: 'Transactions', icon: <FaHistory /> },
    { id: 'staking', label: 'Staking', icon: <FaShieldAlt /> },
    { id: 'mining', label: 'Mining', icon: <FaRocket /> },
    { id: 'settings', label: 'Settings', icon: <FaCog /> },
  ];

  if (!isConnected) {
    return (
      <div className="wallet">
        <div className="wallet-container">
          <motion.div
            className="wallet-connect"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="connect-card">
              <div className="connect-icon">
                <FaWallet />
              </div>
              <h2>Connect Your Wallet</h2>
              <p>Connect your wallet to access your $MINED tokens and manage your account</p>
              
              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}
              
              <button 
                className="btn btn-primary btn-large"
                onClick={connectWallet}
                disabled={loading}
              >
                {loading ? 'Connecting...' : 'Connect Wallet'}
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="wallet">
        <div className="wallet-container">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading wallet data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="wallet">
      <div className="wallet-container">
        {/* Web3 Connection Status */}
        {!isConnected && (
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
            <strong>Wallet Not Connected</strong> - Please connect your MetaMask wallet to interact with the ProductiveMiner contract on Sepolia testnet.
            <button 
              onClick={connectWallet}
              style={{
                background: 'white',
                color: '#ff6b6b',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '5px',
                marginLeft: '10px',
                cursor: 'pointer'
              }}
            >
              Connect Wallet
            </button>
          </motion.div>
        )}

        {isConnected && (
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
            <strong>Connected to Sepolia Testnet</strong> - Address: {formatAddress(address)} | Network: {web3Service.getCurrentNetwork()}
            <button 
              onClick={disconnectWallet}
              style={{
                background: 'white',
                color: '#00b894',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '5px',
                marginLeft: '10px',
                cursor: 'pointer'
              }}
            >
              Disconnect
            </button>
          </motion.div>
        )}

        {/* Error Display */}
        {error && (
          <motion.div
            className="error-message"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: 'linear-gradient(135deg, #ff6b6b, #ee5a52)',
              color: 'white',
              padding: '15px',
              borderRadius: '10px',
              marginBottom: '20px',
              textAlign: 'center'
            }}
          >
            <FaExclamationTriangle style={{ marginRight: '10px' }} />
            {error}
            <button 
              onClick={clearError}
              style={{
                background: 'white',
                color: '#ff6b6b',
                border: 'none',
                padding: '4px 8px',
                borderRadius: '3px',
                marginLeft: '10px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              ×
            </button>
          </motion.div>
        )}

        {/* Header */}
        <motion.div
          className="wallet-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="header-content">
            <div className="header-left">
              <h1>ProductiveMiner Wallet</h1>
              <p>Manage your MINED tokens and interact with the ProductiveMiner contract</p>
            </div>
            <div className="header-right">
              <button 
                className="refresh-btn"
                onClick={refreshWalletData}
                disabled={loading}
              >
                <FaCog className={loading ? 'spinning' : ''} />
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Wallet Overview */}
        <motion.div
          className="wallet-overview"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="overview-grid">
            <div className="overview-card">
              <div className="card-icon">
                <FaWallet />
              </div>
              <div className="card-content">
                <h3>Wallet Address</h3>
                <p className="address">{address ? formatAddress(address) : 'Not Connected'}</p>
                {address && (
                  <button className="copy-btn" onClick={copyAddress}>
                    <FaCopy /> Copy
                  </button>
                )}
              </div>
            </div>

            <div className="overview-card">
              <div className="card-icon">
                <FaCoins />
              </div>
              <div className="card-content">
                <h3>MINED Token Balance</h3>
                <p className="balance">{minedTokenService.formatAmount(minedBalance)} MINED</p>
                <p className="description">Your $MINED token balance</p>
              </div>
            </div>

            <div className="overview-card">
              <div className="card-icon">
                <FaChartLine />
              </div>
              <div className="card-content">
                <h3>Token Balance</h3>
                <p className="balance">{formatBalance(minedBalance || 0)} MINED</p>
                <p className="description">Current MINED token balance</p>
              </div>
            </div>

            <div className="overview-card">
              <div className="card-icon">
                <FaShieldAlt />
              </div>
              <div className="card-content">
                <h3>Staked Amount</h3>
                <p className="balance">{formatCurrency(stakingInfo.staked)}</p>
                <p className="description">Currently staked</p>
              </div>
            </div>

            <div className="overview-card">
              <div className="card-icon">
                <FaChartLine />
              </div>
              <div className="card-content">
                <h3>Pending Rewards</h3>
                <p className="balance">{formatCurrency(stakingInfo.rewards)}</p>
                <p className="description">Available to claim</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Token Statistics */}
        <motion.div
          className="token-stats"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h3>Token Statistics</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">
                <FaCoins />
              </div>
              <div className="stat-content">
                <h4>Token Balance</h4>
                <p className="stat-value">{formatBalance(minedBalance || 0)} MINED</p>
                <p className="stat-description">Current MINED token balance</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <FaShieldAlt />
              </div>
              <div className="stat-content">
                <h4>Staked Amount</h4>
                <p className="stat-value">{formatCurrency(stakingInfo.staked)}</p>
                <p className="stat-description">Currently staked tokens</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <FaChartLine />
              </div>
              <div className="stat-content">
                <h4>Pending Rewards</h4>
                <p className="stat-value">{formatCurrency(stakingInfo.rewards)}</p>
                <p className="stat-description">Available to claim</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <FaRocket />
              </div>
              <div className="stat-content">
                <h4>APY Rate</h4>
                <p className="stat-value">{stakingInfo.apy || 12.5}%</p>
                <p className="stat-description">Annual percentage yield</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          className="wallet-actions"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="actions-grid">
            <button
              className="action-btn stake-btn"
              onClick={() => setShowStakeModal(true)}
              disabled={!isConnected || loading}
            >
              <FaShieldAlt />
              Stake Tokens
            </button>

            {stakingInfo.staked > 0 && (
              <button
                className="action-btn unstake-btn"
                onClick={() => handleUnstakeTokens(stakingInfo.staked)}
                disabled={!isConnected || loading}
              >
                <FaDownload />
                Unstake All
              </button>
            )}

            {stakingInfo.rewards > 0 && (
              <button
                className="action-btn claim-btn"
                onClick={handleClaimRewards}
                disabled={!isConnected || loading}
              >
                <FaCoins />
                Claim Rewards
              </button>
            )}

            <button
              className="action-btn refresh-btn"
              onClick={refreshWalletData}
              disabled={!isConnected || loading}
            >
              <FaCog />
              Refresh Data
            </button>
          </div>
        </motion.div>

        {/* Contract Information */}
        {contractInfo && (
          <motion.div
            className="contract-info"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <h3>Contract Information</h3>
            <div className="contract-details">
              <div className="contract-detail">
                <strong>Contract Address:</strong> {formatAddress(contractInfo.address)}
              </div>
              <div className="contract-detail">
                <strong>Owner:</strong> {formatAddress(contractInfo.owner)}
              </div>
              <div className="contract-detail">
                <strong>Paused:</strong> {contractInfo.paused ? 'Yes' : 'No'}
              </div>
              <div className="contract-detail">
                <strong>Max Difficulty:</strong> {contractInfo.maxDifficulty || 0}
              </div>
              <div className="contract-detail">
                <strong>Base Reward:</strong> {formatCurrency(contractInfo.baseReward || 0)}
              </div>
              <div className="contract-detail">
                <strong>Total Staked:</strong> {formatCurrency(contractInfo.totalStaked || 0)}
              </div>
            </div>
          </motion.div>
        )}

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
              <span>{tab.label}</span>
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
          {activeTab === 'overview' && (
            <div className="overview-tab">
              <div className="overview-grid">
                <div className="overview-card">
                  <h3>Recent Transactions</h3>
                  <div className="transaction-list">
                    {(transactions || []).slice(0, 5).map((tx, index) => (
                      <div key={index} className="transaction-item">
                        <div className="tx-info">
                          <span className="tx-type">{tx.type}</span>
                          <span className="tx-amount">{tx.amount} $MINED</span>
                        </div>
                        <span className="tx-status">{tx.status}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="overview-card">
                  <h3>Staking Summary</h3>
                  <div className="staking-summary">
                    <div className="staking-item">
                      <span>Total Staked</span>
                      <span>{formatBalance(stakingInfo?.userStaked || 0)} $MINED</span>
                    </div>
                    <div className="staking-item">
                      <span>Available Rewards</span>
                      <span>{formatBalance(stakingInfo?.userRewards || 0)} $MINED</span>
                    </div>
                    <div className="staking-item">
                      <span>Active Validators</span>
                      <span>{stakingInfo?.validators ? stakingInfo.validators.length : 0}</span>
                    </div>
                  </div>
                </div>

                <div className="overview-card">
                  <h3>Mining Status</h3>
                  <div className="mining-summary">
                    <div className="mining-item">
                      <span>Status</span>
                      <span className={miningInfo?.isMining ? 'mining-active' : 'mining-inactive'}>
                        {miningInfo?.isMining ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="mining-item">
                      <span>Current Engine</span>
                      <span>{miningInfo?.currentEngine || 'None'}</span>
                    </div>
                    <div className="mining-item">
                      <span>Hashrate</span>
                      <span>{miningInfo?.hashrate || 0} H/s</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'transactions' && (
            <div className="transactions-tab">
              <h3>Transaction History</h3>
              <div className="transaction-table">
                <div className="table-header">
                  <span>Type</span>
                  <span>Amount</span>
                  <span>Status</span>
                  <span>Date</span>
                </div>
                {(transactions || []).map((tx, index) => (
                  <div key={index} className="table-row">
                    <span className="tx-type">{tx?.type || 'Unknown'}</span>
                    <span className="tx-amount">{tx?.amount || 0} $MINED</span>
                    <span className={`tx-status ${(tx?.status || 'pending').toLowerCase()}`}>{tx?.status || 'pending'}</span>
                    <span className="tx-date">{tx?.timestamp ? new Date(tx.timestamp).toLocaleDateString() : 'Unknown'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'staking' && (
            <div className="staking-tab">
              <div className="staking-actions">
                <button className="btn btn-primary" onClick={() => setShowStakeModal(true)}>
                  <FaCoins /> Stake Tokens
                </button>
                <button className="btn btn-secondary" onClick={handleClaimRewards}>
                  <FaChartLine /> Claim Rewards
                </button>
              </div>
              
              <div className="staking-details">
                <h3>Staking Details</h3>
                <div className="staking-grid">
                  <div className="staking-card">
                    <h4>Total Staked</h4>
                    <p>{formatBalance(stakingInfo?.userStaked || 0)} $MINED</p>
                  </div>
                  <div className="staking-card">
                    <h4>Available Rewards</h4>
                    <p>{formatBalance(stakingInfo?.userRewards || 0)} $MINED</p>
                  </div>
                  <div className="staking-card">
                    <h4>Active Validators</h4>
                    <p>{stakingInfo?.validators ? stakingInfo.validators.length : 0}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'mining' && (
            <div className="mining-tab">
              <div className="mining-status">
                <h3>Mining Status</h3>
                <div className={`status-indicator ${miningInfo?.isMining ? 'active' : 'inactive'}`}>
                  <div className="status-dot"></div>
                  <span>{miningInfo?.isMining ? 'Mining Active' : 'Mining Inactive'}</span>
                </div>
              </div>

              <div className="mining-controls">
                <button 
                  className={`btn ${miningInfo?.isMining ? 'btn-secondary' : 'btn-primary'}`}
                  onClick={() => miningInfo?.isMining ? stopMining() : startMining('prime_pattern')}
                  disabled={loading}
                >
                  {miningInfo?.isMining ? <FaPause /> : <FaPlay />}
                  {miningInfo?.isMining ? 'Stop Mining' : 'Start Mining'}
                </button>
              </div>

              <div className="mining-stats">
                <div className="mining-stat">
                  <h4>Current Engine</h4>
                  <p>{miningInfo?.currentEngine || 'None'}</p>
                </div>
                <div className="mining-stat">
                  <h4>Hashrate</h4>
                  <p>{miningInfo?.hashrate || 0} H/s</p>
                </div>
                <div className="mining-stat">
                  <h4>Mining Rewards</h4>
                  <p>{formatBalance(miningInfo?.rewards || 0)} $MINED</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'mined-tokens' && (
            <div className="mined-tokens-tab">
              <h3>MINED Token Management</h3>
              <div className="token-overview">
                <div className="token-balance-card">
                  <h4>Your MINED Token Balance</h4>
                  <div className="balance-display">
                    <span className="balance-amount">{minedTokenService.formatAmount(minedBalance)}</span>
                    <span className="balance-symbol">MINED</span>
                  </div>
                  <p className="balance-description">
                    {minedTokenService.isTokenDeployed() 
                      ? 'Your actual MINED token balance from the blockchain'
                      : 'Balance not available'
                    }
                  </p>
                </div>

                <div className="token-actions">
                  <button 
                    className="btn btn-primary"
                    onClick={() => setShowSendModal(true)}
                    disabled={!minedTokenService.isTokenDeployed()}
                  >
                    <FaExchangeAlt /> Send MINED Tokens
                  </button>
                  
                  <button 
                    className="btn btn-secondary"
                    onClick={() => {
                      // Refresh MINED balance
                      minedTokenService.getBalance(address).then(setMinedBalance);
                    }}
                  >
                    <FaDownload /> Refresh Balance
                  </button>
                </div>

                <div className="token-info">
                  <h4>Token Information</h4>
                  <div className="info-grid">
                    <div className="info-item">
                      <span>Token Name:</span>
                      <span>{tokenInfo?.name || 'MINED'}</span>
                    </div>
                    <div className="info-item">
                      <span>Token Symbol:</span>
                      <span>{tokenInfo?.symbol || 'MINED'}</span>
                    </div>
                    <div className="info-item">
                      <span>Decimals:</span>
                      <span>{tokenInfo?.decimals || '18'}</span>
                    </div>
                    <div className="info-item">
                      <span>Total Supply:</span>
                      <span>{tokenInfo?.totalSupply ? 
                        `${web3Service.web3?.utils?.fromWei ? 
                          web3Service.web3.utils.fromWei(tokenInfo.totalSupply, 'ether') : 
                          (parseInt(tokenInfo.totalSupply) / 1e18).toLocaleString()
                        } MINED` : 
                        'Loading...'
                      }</span>
                    </div>
                    <div className="info-item">
                      <span>Contract Address:</span>
                      <span className="address">{tokenInfo?.address || CONTRACT_CONFIG.MINED_TOKEN.address}</span>
                    </div>
                    <div className="info-item">
                      <span>Status:</span>
                      <span className={`status ${tokenInfo ? 'connected' : 'deployed_not_connected'}`}>
                        {tokenInfo ? 'Connected' : 'Deployed'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="settings-tab">
              <h3>Wallet Settings</h3>
              <div className="settings-grid">
                <div className="setting-item">
                  <h4>Export Private Key</h4>
                  <p>Export your private key for backup purposes</p>
                  <button className="btn btn-secondary">
                    <FaDownload /> Export
                  </button>
                </div>
                <div className="setting-item">
                  <h4>Show QR Code</h4>
                  <p>Display QR code for your wallet address</p>
                  <button className="btn btn-secondary">
                    <FaQrcode /> Show QR
                  </button>
                </div>
                <div className="setting-item">
                  <h4>Security Settings</h4>
                  <p>Configure wallet security options</p>
                  <button className="btn btn-secondary">
                    <FaShieldAlt /> Configure
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Send Transaction Modal */}
        {showSendModal && (
          <div className="modal-overlay" onClick={() => setShowSendModal(false)}>
            <motion.div
              className="modal"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3>Send Transaction</h3>
              <form onSubmit={handleSendTransaction}>
                <div className="form-group">
                  <label htmlFor="to-address">To Address</label>
                  <input
                    type="text"
                    id="to-address"
                    name="toAddress"
                    value={sendForm.toAddress}
                    onChange={(e) => setSendForm({ ...sendForm, toAddress: e.target.value })}
                    placeholder="Enter recipient address"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="send-amount">Amount ($MINED)</label>
                  <input
                    type="number"
                    id="send-amount"
                    name="amount"
                    value={sendForm.amount}
                    onChange={(e) => setSendForm({ ...sendForm, amount: e.target.value })}
                    placeholder="Enter amount"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="gas-limit">Gas Limit</label>
                  <input
                    type="number"
                    id="gas-limit"
                    name="gasLimit"
                    value={sendForm.gasLimit}
                    onChange={(e) => setSendForm({ ...sendForm, gasLimit: e.target.value })}
                    placeholder="21000"
                  />
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowSendModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Send Transaction
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Stake Tokens Modal */}
        {showStakeModal && (
          <div className="modal-overlay" onClick={() => setShowStakeModal(false)}>
            <motion.div
              className="modal"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3>Stake Tokens</h3>
              <div className="stake-info">
                <p className="info-text">
                  <strong>Minimum Stake:</strong> 100 MINED tokens
                </p>
                <p className="info-text">
                  <strong>Current Balance:</strong> {formatBalance(tokenBalance)}
                </p>
              </div>
              <form onSubmit={handleStakeTokens}>
                <div className="form-group">
                  <label htmlFor="validator-address">Validator Address</label>
                  <input
                    type="text"
                    id="validator-address"
                    name="validatorAddress"
                    value={stakeForm.validatorAddress}
                    onChange={(e) => setStakeForm({ ...stakeForm, validatorAddress: e.target.value })}
                    placeholder="Enter validator address"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="stake-amount">Amount to Stake ($MINED)</label>
                  <input
                    type="number"
                    id="stake-amount"
                    name="stakeAmount"
                    value={stakeForm.amount}
                    onChange={(e) => setStakeForm({ ...stakeForm, amount: e.target.value })}
                    placeholder="Enter amount (minimum 100)"
                    min="100"
                    required
                  />
                  <small className="form-help">Minimum stake amount is 100 MINED tokens</small>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowStakeModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Stake Tokens
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Loading Overlay */}
        {loading && (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
            <p>Processing...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Wallet;
