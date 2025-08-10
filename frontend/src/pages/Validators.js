import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from 'react-query';
import {
  FaUsers,
  FaCoins,
  FaShieldAlt,
  FaChartLine,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaNetworkWired,
  FaRocket,
  FaCrown,
  FaStar,
  FaArrowUp,
  FaArrowDown
} from 'react-icons/fa';
import { flowAPI, backendAPI } from '../utils/api';
import './Validators.css';

const Validators = () => {
  const [sortBy, setSortBy] = useState('stake');
  const [filterStatus, setFilterStatus] = useState('all');

  // Fetch validators information
  const { data: validators, isLoading: validatorsLoading } = useQuery(
    ['validators'],
    () => flowAPI.getValidators(),
    { 
      refetchInterval: 45000,
      onSuccess: (data) => {
        console.log('🎯 Validators - Validators received:', data);
      },
      onError: (error) => {
        console.error('❌ Validators - Validators error:', error);
      }
    }
  );

  // Fetch network statistics
  const { data: networkStats, isLoading: networkLoading } = useQuery(
    ['networkStats'],
    () => flowAPI.getHashrateData(),
    { 
      refetchInterval: 60000,
      onSuccess: (data) => {
        console.log('🎯 Validators - Network stats received:', data);
      },
      onError: (error) => {
        console.error('❌ Validators - Network stats error:', error);
      }
    }
  );

  // Fetch staking information
  const { data: stakingInfo, isLoading: stakingLoading } = useQuery(
    ['stakingInfo'],
    () => backendAPI.getStakingInfo(),
    { 
      refetchInterval: 45000,
      onSuccess: (data) => {
        console.log('🎯 Validators - Staking info received:', data);
      },
      onError: (error) => {
        console.error('❌ Validators - Staking info error:', error);
      }
    }
  );

  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000000) {
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

  const formatAddress = (address) => {
    if (!address) return 'Unknown';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatPercentage = (value, total) => {
    if (!total || total === 0) return '0%';
    return ((value / total) * 100).toFixed(2) + '%';
  };

  // Use real data or fallback
  const validatorStats = {
    totalValidators: validators?.totalValidators || validators?.validators?.length || 0,
    activeValidators: validators?.validators?.filter(v => v.status === 'active')?.length || 0,
    totalStaked: validators?.totalStake || stakingInfo?.totalStaked || 0,
    averageStake: validators?.totalStake && validators?.totalValidators ? validators.totalStake / validators.totalValidators : 0,
    totalRewards: stakingInfo?.totalRewards || 0,
    averageAPY: stakingInfo?.averageAPY || 12.5
  };

  // Real validators data from API or fallback
  const validatorsList = validators?.validators || [
    {
      id: 1,
      address: '0x1234567890abcdef1234567890abcdef12345678',
      name: 'Validator Alpha',
      status: 'active',
      stake: 1000000,
      commission: 5.0,
      uptime: 99.8,
      blocksProduced: 1250,
      rewards: 45000,
      rank: 1
    },
    {
      id: 2,
      address: '0x2345678901bcdef2345678901bcdef2345678901',
      name: 'Validator Beta',
      status: 'active',
      stake: 850000,
      commission: 4.5,
      uptime: 99.5,
      blocksProduced: 1180,
      rewards: 38000,
      rank: 2
    },
    {
      id: 3,
      address: '0x3456789012cdef3456789012cdef3456789012cd',
      name: 'Validator Gamma',
      status: 'active',
      stake: 720000,
      commission: 6.0,
      uptime: 98.9,
      blocksProduced: 1050,
      rewards: 32000,
      rank: 3
    },
    {
      id: 4,
      address: '0x4567890123def4567890123def4567890123def4',
      name: 'Validator Delta',
      status: 'inactive',
      stake: 500000,
      commission: 7.0,
      uptime: 85.2,
      blocksProduced: 750,
      rewards: 15000,
      rank: 4
    },
    {
      id: 5,
      address: '0x5678901234ef5678901234ef5678901234ef5678',
      name: 'Validator Epsilon',
      status: 'active',
      stake: 650000,
      commission: 5.5,
      uptime: 99.2,
      blocksProduced: 920,
      rewards: 28000,
      rank: 5
    }
  ];

  // Sort and filter validators
  const sortedValidators = validatorsList
    .filter(validator => {
      if (filterStatus === 'all') return true;
      return validator.status === filterStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'stake':
          return b.stake - a.stake;
        case 'rewards':
          return b.rewards - a.rewards;
        case 'uptime':
          return b.uptime - a.uptime;
        case 'blocks':
          return b.blocksProduced - a.blocksProduced;
        case 'rank':
          return a.rank - b.rank;
        default:
          return b.stake - a.stake;
      }
    });

  const getStatusIcon = (status) => {
    return status === 'active' ? <FaCheckCircle /> : <FaTimesCircle />;
  };

  const getStatusColor = (status) => {
    return status === 'active' ? 'active' : 'inactive';
  };

  return (
    <div className="validators">
      <div className="validators-container">
        {/* Header */}
        <motion.div
          className="validators-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="header-content">
            <h1>Network Validators</h1>
            <p>Proof-of-Stake validators securing the ProductiveMiner blockchain</p>
          </div>
        </motion.div>

        {/* Validator Statistics */}
        <motion.div
          className="validator-stats"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">
                <FaUsers />
              </div>
              <div className="stat-content">
                <h3>Total Validators</h3>
                <p className="stat-value">{validatorStats.totalValidators}</p>
                <p className="stat-description">Registered validators</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <FaCheckCircle />
              </div>
              <div className="stat-content">
                <h3>Active Validators</h3>
                <p className="stat-value">{validatorStats.activeValidators}</p>
                <p className="stat-description">Currently validating</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <FaCoins />
              </div>
              <div className="stat-content">
                <h3>Total Staked</h3>
                <p className="stat-value">{formatCurrency(validatorStats.totalStaked)}</p>
                <p className="stat-description">MINED tokens staked</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <FaChartLine />
              </div>
              <div className="stat-content">
                <h3>Average APY</h3>
                <p className="stat-value">{validatorStats.averageAPY}%</p>
                <p className="stat-description">Annual yield</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <FaRocket />
              </div>
              <div className="stat-content">
                <h3>Total Rewards</h3>
                <p className="stat-value">{formatCurrency(validatorStats.totalRewards)}</p>
                <p className="stat-description">Distributed rewards</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <FaClock />
              </div>
              <div className="stat-content">
                <h3>Average Stake</h3>
                <p className="stat-value">{formatCurrency(validatorStats.averageStake)}</p>
                <p className="stat-description">Per validator</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Validators List */}
        <motion.div
          className="validators-list"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="list-header">
            <h2>Validator Rankings</h2>
            <div className="list-controls">
              <div className="filter-controls">
                <button
                  className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
                  onClick={() => setFilterStatus('all')}
                >
                  All
                </button>
                <button
                  className={`filter-btn ${filterStatus === 'active' ? 'active' : ''}`}
                  onClick={() => setFilterStatus('active')}
                >
                  Active
                </button>
                <button
                  className={`filter-btn ${filterStatus === 'inactive' ? 'active' : ''}`}
                  onClick={() => setFilterStatus('inactive')}
                >
                  Inactive
                </button>
              </div>
              
              <div className="sort-controls">
                <select
                  id="sort-validators"
                  name="sortBy"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="sort-select"
                >
                  <option value="rank">Rank</option>
                  <option value="stake">Stake</option>
                  <option value="rewards">Rewards</option>
                  <option value="uptime">Uptime</option>
                  <option value="blocks">Blocks</option>
                </select>
              </div>
            </div>
          </div>

          <div className="validators-table">
            <div className="table-header">
              <div className="header-cell rank">Rank</div>
              <div className="header-cell validator">Validator</div>
              <div className="header-cell status">Status</div>
              <div className="header-cell stake">Stake</div>
              <div className="header-cell commission">Commission</div>
              <div className="header-cell uptime">Uptime</div>
              <div className="header-cell blocks">Blocks</div>
              <div className="header-cell rewards">Rewards</div>
            </div>

            <div className="table-body">
              {sortedValidators.map((validator, index) => (
                <motion.div
                  key={validator.id}
                  className="table-row"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                >
                  <div className="cell rank">
                    {validator.rank <= 3 ? (
                      <span className={`rank-badge rank-${validator.rank}`}>
                        {validator.rank === 1 && <FaCrown />}
                        {validator.rank === 2 && <FaStar />}
                        {validator.rank === 3 && <FaRocket />}
                        {validator.rank}
                      </span>
                    ) : (
                      <span className="rank-number">{validator.rank}</span>
                    )}
                  </div>
                  
                  <div className="cell validator">
                    <div className="validator-info">
                      <h4>{validator.name}</h4>
                      <p>{formatAddress(validator.address)}</p>
                    </div>
                  </div>
                  
                  <div className="cell status">
                    <span className={`status-badge ${getStatusColor(validator.status)}`}>
                      {getStatusIcon(validator.status)}
                      {validator.status}
                    </span>
                  </div>
                  
                  <div className="cell stake">
                    <div className="stake-info">
                      <span className="stake-amount">{formatCurrency(validator.stake)}</span>
                      <span className="stake-percentage">
                        {formatPercentage(validator.stake, validatorStats.totalStaked)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="cell commission">
                    <span className="commission-rate">{validator.commission}%</span>
                  </div>
                  
                  <div className="cell uptime">
                    <div className="uptime-info">
                      <span className="uptime-percentage">{validator.uptime}%</span>
                      <div className="uptime-bar">
                        <div 
                          className="uptime-fill" 
                          style={{ width: `${validator.uptime}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="cell blocks">
                    <span className="blocks-count">{formatNumber(validator.blocksProduced)}</span>
                  </div>
                  
                  <div className="cell rewards">
                    <span className="rewards-amount">{formatCurrency(validator.rewards)}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Staking Information */}
        <motion.div
          className="staking-info"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h3>Become a Validator</h3>
          <div className="staking-content">
            <div className="staking-requirements">
              <h4>Requirements</h4>
              <ul>
                <li>Minimum stake: 100,000 MINED</li>
                <li>99%+ uptime requirement</li>
                <li>Valid server infrastructure</li>
                <li>Community approval</li>
              </ul>
            </div>
            
            <div className="staking-benefits">
              <h4>Benefits</h4>
              <ul>
                <li>Earn staking rewards (5-15% APY)</li>
                <li>Participate in network governance</li>
                <li>Contribute to blockchain security</li>
                <li>Build reputation in the community</li>
              </ul>
            </div>
          </div>
          
          <div className="staking-actions">
            <button
              className="btn btn-primary"
              onClick={() => {
                console.log('🎯 Apply to Become Validator clicked');
                window.location.href = '/wallet';
              }}
            >
              <FaShieldAlt />
              Apply to Become Validator
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => {
                console.log('🎯 View Staking Guide clicked');
                window.location.href = '/staking';
              }}
            >
              <FaChartLine />
              View Staking Guide
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Validators;
