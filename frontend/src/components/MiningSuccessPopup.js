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
    hashrate
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
              <span className="detail-value">#{blockNumber}</span>
            </div>
            
            <div className="detail-row">
              <span className="detail-label">Engine:</span>
              <span className="detail-value">{engine}</span>
            </div>
            
            <div className="detail-row">
              <span className="detail-label">Difficulty:</span>
              <span className="detail-value">{difficulty?.toLocaleString()}</span>
            </div>
            
            <div className="detail-row">
              <span className="detail-label">Hashrate:</span>
              <span className="detail-value">{hashrate}</span>
            </div>
            
            <div className="detail-row">
              <span className="detail-label">Timestamp:</span>
              <span className="detail-value">
                {timestamp ? new Date(timestamp).toLocaleString() : 'Now'}
              </span>
            </div>
          </motion.div>

          {/* Reward section */}
          <motion.div
            className="reward-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="reward-icon">
              <FaCoins />
            </div>
            <div className="reward-amount">
              <span className="reward-label">Reward Earned</span>
              <span className="reward-value">{reward} MINED</span>
            </div>
          </motion.div>

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
                  x: (Math.random() - 0.5) * 200,
                  y: (Math.random() - 0.5) * 200,
                  opacity: 0,
                  scale: 1
                }}
                transition={{ 
                  duration: 2,
                  delay: 0.8 + Math.random() * 0.5,
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
