const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { query } = require('../database/connection');
const { get } = require('../database/redis');

const router = express.Router();

// Helper function to safely query database with timeout
async function tryQuery(text, params = [], timeoutMs = 2000) {
  try {
    const result = await Promise.race([
      query(text, params),
      new Promise((_, reject) => setTimeout(() => reject(new Error('DB query timeout')), timeoutMs))
    ]);
    return result;
  } catch (error) {
    console.log('DB query failed, using fallback:', error.message);
    return null;
  }
}

// List recent blocks with basic info
router.get('/blocks', asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit || '20', 10), 100);
  try {
    console.log('Explorer: Attempting database query for blocks, limit:', limit);
    
    // Try database first
    const result = await tryQuery(
      `SELECT block_number, block_hash, parent_hash, miner_address, difficulty, nonce, timestamp, transactions_count, block_reward, status
       FROM blocks
       ORDER BY block_number DESC
       LIMIT $1`,
      [limit],
      2000
    );
    
    if (result && result.rows) {
      console.log('Explorer: Database query successful, returned', result.rows.length, 'blocks');
      return res.json({ 
        success: true,
        blocks: result.rows,
        source: 'database'
      });
    }
    
    // Fallback to Redis cached recent blocks
    console.log('Explorer: Database failed, falling back to Redis');
    const cached = await get('recent_blocks') || [];
    console.log('Explorer: Redis fallback returned', cached.length, 'blocks');
    
    return res.json({ 
      success: true,
      blocks: cached.slice(0, limit),
      source: 'redis_cache'
    });
    
  } catch (error) {
    console.error('Explorer: All data sources failed:', error.message);
    
    // Final fallback - return empty array with status
    return res.json({ 
      success: true,
      blocks: [],
      source: 'fallback',
      note: 'No blocks found - mining may not have started yet'
    });
  }
}));

// List recent transactions
router.get('/transactions', asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit || '50', 10), 200);
  
  try {
    const result = await tryQuery(
      `SELECT tx_hash, block_number, from_address, to_address, value, status, transaction_type, created_at
       FROM transactions
       ORDER BY created_at DESC
       LIMIT $1`,
      [limit],
      2000
    );
    
    if (result && result.rows) {
      return res.json({ 
        success: true,
        transactions: result.rows,
        source: 'database'
      });
    }
    
    // Fallback to empty array
    return res.json({ 
      success: true,
      transactions: [],
      source: 'fallback',
      note: 'No transactions found - mining may not have started yet'
    });
    
  } catch (error) {
    console.error('Explorer transactions error:', error.message);
    return res.json({ 
      success: true,
      transactions: [],
      source: 'fallback',
      note: 'Unable to fetch transactions'
    });
  }
}));

// Get explorer statistics
router.get('/stats', asyncHandler(async (req, res) => {
  try {
    // Try to get stats from database
    const blocksResult = await tryQuery('SELECT COUNT(*) as total_blocks FROM blocks', [], 2000);
    const transactionsResult = await tryQuery('SELECT COUNT(*) as total_transactions FROM transactions', [], 2000);
    const confirmedBlocksResult = await tryQuery('SELECT COUNT(*) as confirmed_blocks FROM blocks WHERE status = \'confirmed\'', [], 2000);
    
    const totalBlocks = blocksResult?.rows?.[0]?.total_blocks || 0;
    const totalTransactions = transactionsResult?.rows?.[0]?.total_transactions || 0;
    const confirmedBlocks = confirmedBlocksResult?.rows?.[0]?.confirmed_blocks || 0;
    
    // Get recent blocks for average block time calculation
    const recentBlocksResult = await tryQuery(
      `SELECT timestamp FROM blocks WHERE status = 'confirmed' ORDER BY block_number DESC LIMIT 10`,
      [],
      2000
    );
    
    let averageBlockTime = 0;
    if (recentBlocksResult?.rows && recentBlocksResult.rows.length > 1) {
      const timestamps = recentBlocksResult.rows.map(row => new Date(row.timestamp).getTime()).sort((a, b) => b - a);
      const timeDiffs = [];
      for (let i = 0; i < timestamps.length - 1; i++) {
        timeDiffs.push(timestamps[i] - timestamps[i + 1]);
      }
      averageBlockTime = timeDiffs.length > 0 ? Math.floor(timeDiffs.reduce((a, b) => a + b, 0) / timeDiffs.length / 1000) : 0;
    }
    
    return res.json({
      success: true,
      stats: {
        totalBlocks: parseInt(totalBlocks),
        totalTransactions: parseInt(totalTransactions),
        confirmedBlocks: parseInt(confirmedBlocks),
        averageBlockTime: averageBlockTime,
        pendingBlocks: parseInt(totalBlocks) - parseInt(confirmedBlocks)
      },
      source: 'database'
    });
    
  } catch (error) {
    console.error('Explorer stats error:', error.message);
    
    // Fallback stats
    return res.json({
      success: true,
      stats: {
        totalBlocks: 0,
        totalTransactions: 0,
        confirmedBlocks: 0,
        averageBlockTime: 0,
        pendingBlocks: 0
      },
      source: 'fallback',
      note: 'No mining activity detected yet'
    });
  }
}));

module.exports = router;


