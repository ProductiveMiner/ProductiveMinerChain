import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCheckCircle, FaCoins, FaTrophy, FaTimes, FaShare } from 'react-icons/fa';
import './MiningSuccessPopup.css';

const MiningSuccessPopup = ({ isVisible, onClose, miningData }) => {
  if (!isVisible) return null;

  const {
    blockNumber,
    blockHash,
    reward,
    difficulty,
    engine,
    timestamp,
    hashrate,
    tokenRewards,
    tokenBalance,
    discoveryData,
    workType,
    complexity,
    significance,
    researchValue,
    transactionHash
  } = miningData || {};

  const handleShare = () => {
    const shareText = `🎉 Just successfully mined block #${blockNumber} on ProductiveMiner! Earned ${reward} MINED tokens. #ProductiveMining #Blockchain`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Mining Success!',
        text: shareText,
        url: window.location.href
      });
    } else {
      // Fallback to copying to clipboard
      navigator.clipboard.writeText(shareText);
      // You could add a toast notification here
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  return (
    <AnimatePresence>
      <motion.div
        className="mining-success-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="mining-success-popup"
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 50 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button className="popup-close-btn" onClick={onClose}>
            <FaTimes />
          </button>

          {/* Success icon */}
          <motion.div
            className="success-icon"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <FaCheckCircle />
          </motion.div>

          {/* Success title */}
          <motion.h2
            className="success-title"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Mining Success! 🎉
          </motion.h2>

          {/* Block details */}
          <motion.div
            className="block-details"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="detail-row">
              <span className="detail-label">Block Number:</span>
              <span className="detail-value">#{typeof blockNumber === 'bigint' ? Number(blockNumber).toLocaleString() : (typeof blockNumber === 'number' ? blockNumber.toLocaleString() : String(blockNumber || 0))}</span>
            </div>
            
            <div className="detail-row">
              <span className="detail-label">Engine:</span>
              <span className="detail-value">{engine ? engine.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Unknown'}</span>
            </div>
            
            <div className="detail-row">
              <span className="detail-label">Difficulty:</span>
              <span className="detail-value">{difficulty ? Number(difficulty).toLocaleString() : '0'}</span>
            </div>
            
            <div className="detail-row">
              <span className="detail-label">Hashrate:</span>
              <span className="detail-value">{hashrate ? Number(hashrate).toLocaleString() : '0'} H/s</span>
            </div>
            
            <div className="detail-row">
              <span className="detail-label">Timestamp:</span>
              <span className="detail-value">
                {timestamp ? new Date(timestamp).toLocaleString() : 'Now'}
              </span>
            </div>
          </motion.div>

          {/* Discovery Details */}
          {(workType || complexity || significance || researchValue) && (
            <motion.div
              className="discovery-details"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
            >
              <h3 className="discovery-title">🔬 Discovery Details</h3>
              {workType && (
                <div className="detail-row">
                  <span className="detail-label">Work Type:</span>
                  <span className="detail-value">{workType}</span>
                </div>
              )}
              {complexity && (
                <div className="detail-row">
                  <span className="detail-label">Complexity:</span>
                  <span className="detail-value">{Number(complexity).toFixed(2)}</span>
                </div>
              )}
              {significance && (
                <div className="detail-row">
                  <span className="detail-label">Significance:</span>
                  <span className="detail-value">{Number(significance).toFixed(2)}</span>
                </div>
              )}
              {researchValue && (
                <div className="detail-row">
                  <span className="detail-label">Research Value:</span>
                  <span className="detail-value">{Number(researchValue).toFixed(2)} MINED</span>
                </div>
              )}
            </motion.div>
          )}

          {/* MINED Token Reward section */}
          <motion.div
            className="reward-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="reward-icon">
              🪙
            </div>
            <div className="reward-amount">
              <span className="reward-label">MINED Tokens Earned</span>
              <span className="reward-value">{reward} MINED</span>
            </div>
          </motion.div>

          {/* MINED Token Rewards Section */}
          {tokenRewards && parseFloat(tokenRewards) > 0 && (
            <motion.div
              className="token-rewards-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
            >
              <div className="token-rewards-header">
                <span className="token-icon">🪙</span>
                <span className="token-title">MINED Token Rewards</span>
              </div>
              <div className="token-rewards-content">
                <div className="token-reward-item">
                  <span className="token-label">Tokens Earned:</span>
                  <span className="token-value">{tokenRewards} MINED</span>
                </div>
                <div className="token-reward-item">
                  <span className="token-label">Current Balance:</span>
                  <span className="token-value">{tokenBalance} MINED</span>
                </div>
                <div className="token-reward-item">
                  <span className="token-label">Status:</span>
                  <span className="token-value" style={{ color: '#4CAF50', fontWeight: 'bold' }}>
                    ✅ Tokens Minted Successfully
                  </span>
                </div>
              </div>
              <div className="token-note">
                MINED tokens have been minted to your wallet. Check your MetaMask or wallet app to see the updated balance.
              </div>
            </motion.div>
          )}

          {/* Block hash */}
          {blockHash && (
            <motion.div
              className="block-hash-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <span className="hash-label">Block Hash:</span>
              <div className="hash-container">
                <span className="block-hash">
                  {blockHash.slice(0, 12)}...{blockHash.slice(-12)}
                </span>
                <button
                  className="copy-btn"
                  onClick={() => copyToClipboard(blockHash)}
                  title="Copy block hash"
                >
                  <FaTimes />
                </button>
              </div>
            </motion.div>
          )}

          {/* Action buttons */}
          <motion.div
            className="action-buttons"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <button className="share-btn" onClick={handleShare}>
              <FaShare />
              Share Success
            </button>
            
            <button className="continue-btn" onClick={onClose}>
              Continue Mining
            </button>
          </motion.div>

          {/* Celebration particles */}
          <div className="celebration-particles">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="particle"
                initial={{ 
                  x: 0, 
                  y: 0, 
                  opacity: 1,
                  scale: 0
                }}
                animate={{ 
                          x: 0,
        y: 0,
                  opacity: 0,
                  scale: 1
                }}
                transition={{ 
                  duration: 2,
                  delay: 1.0,
                  ease: "easeOut"
                }}
              />
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MiningSuccessPopup;
