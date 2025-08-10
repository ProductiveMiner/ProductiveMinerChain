import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useWallet } from '../contexts/WalletContext';
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
  FaPlay
} from 'react-icons/fa';
import './Wallet.css';

const Wallet = () => {
  const {
    isConnected,
    address,
    balance,
    transactions,
    stakingInfo,
    miningInfo,
    loading,
    error,
    connectWallet,
    disconnectWallet,
    sendTransaction,
    stakeTokens,
    unstakeTokens,
    claimRewards,
    startMining,
    stopMining,
    refreshWalletData,
    clearError,
  } = useWallet();

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

  // Auto-refresh wallet data every 30 seconds
  useEffect(() => {
    if (isConnected) {
      const interval = setInterval(refreshWalletData, 30000);
      return () => clearInterval(interval);
    }
  }, [isConnected, refreshWalletData]);

  const handleSendTransaction = async (e) => {
    e.preventDefault();
    try {
      await sendTransaction({
        to: sendForm.toAddress,
        amount: parseFloat(sendForm.amount),
        gasPrice: undefined
      });
      setShowSendModal(false);
      setSendForm({ toAddress: '', amount: '', gasLimit: '21000' });
    } catch (error) {
      console.error('Transaction failed:', error);
    }
  };

  const handleStakeTokens = async (e) => {
    e.preventDefault();
    try {
      await stakeTokens({ amount: parseFloat(stakeForm.amount), validator: stakeForm.validatorAddress });
      setShowStakeModal(false);
      setStakeForm({ amount: '', validatorAddress: '' });
    } catch (error) {
      console.error('Staking failed:', error);
    }
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(address);
  };

  const formatAddress = (addr) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatBalance = (balance) => {
    return parseFloat(balance).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    });
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <FaWallet /> },
    { id: 'transactions', label: 'Transactions', icon: <FaHistory /> },
    { id: 'staking', label: 'Staking', icon: <FaCoins /> },
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
        {/* Wallet Header */}
        <motion.div
          className="wallet-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="wallet-info">
            <h1>Wallet</h1>
            <div className="address-info">
                              <span className="address">{address ? formatAddress(address) : 'Not connected'}</span>
              <button className="copy-btn" onClick={copyAddress}>
                <FaCopy />
              </button>
            </div>
          </div>
          <div className="wallet-actions">
            <button className="btn btn-secondary" onClick={refreshWalletData}>
              <FaDownload /> Refresh
            </button>
            <button className="btn btn-secondary" onClick={disconnectWallet}>
              Disconnect
            </button>
          </div>
        </motion.div>

        {/* Balance Cards */}
        <motion.div
          className="balance-cards"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="balance-card">
            <div className="balance-icon">
              <FaCoins />
            </div>
            <div className="balance-info">
              <h3>Available Balance</h3>
                              <p className="balance-amount">{formatBalance(balance?.MINED || 0)} $MINED</p>
                <p className="balance-usd">≈ ${formatBalance(balance?.USD || 0)} USD</p>
            </div>
          </div>

          <div className="balance-card">
            <div className="balance-icon">
              <FaStickyNote />
            </div>
            <div className="balance-info">
              <h3>Staked Balance</h3>
              <p className="balance-amount">{formatBalance(stakingInfo.staked)} $MINED</p>
              <p className="balance-usd">Rewards: {formatBalance(stakingInfo.rewards)} $MINED</p>
            </div>
          </div>

          <div className="balance-card">
            <div className="balance-icon">
              <FaRocket />
            </div>
            <div className="balance-info">
              <h3>Mining Rewards</h3>
              <p className="balance-amount">{formatBalance(miningInfo.rewards)} $MINED</p>
              <p className="balance-usd">Hashrate: {miningInfo.hashrate} H/s</p>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          className="quick-actions"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <button className="action-btn" onClick={() => setShowSendModal(true)}>
            <FaExchangeAlt />
            <span>Send</span>
          </button>
          <button className="action-btn" onClick={() => setShowStakeModal(true)}>
            <FaCoins />
            <span>Stake</span>
          </button>
          <button className="action-btn" onClick={claimRewards}>
            <FaChartLine />
            <span>Claim Rewards</span>
          </button>
          <button 
            className="action-btn"
            onClick={() => miningInfo.isMining ? stopMining() : startMining('prime_pattern')}
          >
            {miningInfo.isMining ? <FaPause /> : <FaPlay />}
            <span>{miningInfo.isMining ? 'Stop Mining' : 'Start Mining'}</span>
          </button>
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
                <button className="btn btn-secondary" onClick={claimRewards}>
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
                    placeholder="Enter amount"
                    required
                  />
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

        {/* Error Display */}
        {error && (
          <motion.div
            className="error-banner"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span>{error}</span>
            <button onClick={clearError}>×</button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Wallet;
