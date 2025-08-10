const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { query } = require('../database/connection');
const { get } = require('../database/redis');

const router = express.Router();

// List recent blocks with basic info
router.get('/blocks', asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit || '20', 10), 100);
  try {
    console.log('Explorer: Attempting database query for blocks, limit:', limit);
    const rows = await query(
      `SELECT block_number, block_hash, parent_hash, miner_address, difficulty, nonce, timestamp, transactions_count, block_reward, status
       FROM blocks
       ORDER BY block_number DESC
       LIMIT $1`,
      [limit]
    );
    console.log('Explorer: Database query successful, returned', rows.rows.length, 'blocks');
    return res.json({ blocks: rows.rows });
  } catch (e) {
    console.error('Explorer: Database query failed, falling back to Redis:', e.message);
    // Fallback to Redis cached recent blocks
    const cached = (await get('recent_blocks')) || [];
    console.log('Explorer: Redis fallback returned', cached.length, 'blocks');
    return res.json({ blocks: cached.slice(0, limit) });
  }
}));

// List recent transactions
router.get('/transactions', asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit || '50', 10), 200);
  const rows = await query(
    `SELECT tx_hash, block_number, from_address, to_address, value, status, transaction_type, created_at
     FROM transactions
     ORDER BY created_at DESC
     LIMIT $1`,
    [limit]
  );
  res.json({ transactions: rows.rows });
}));

module.exports = router;


