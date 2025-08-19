const express = require('express');
const router = express.Router();
const blockchainSyncService = require('../services/blockchainSyncService');
const { authMiddleware } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

// Get sync service status
router.get('/status', asyncHandler(async (req, res) => {
  const status = blockchainSyncService.getStatus();
  
  // Add additional health information
  const healthInfo = {
    ...status,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    nodeVersion: process.version
  };
  
  res.json({
    success: true,
    data: healthInfo
  });
}));

// Start sync service (admin only)
router.post('/start', authMiddleware, asyncHandler(async (req, res) => {
  try {
    await blockchainSyncService.start();
    res.json({
      success: true,
      message: 'Blockchain sync service started successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
}));

// Stop sync service (admin only)
router.post('/stop', authMiddleware, asyncHandler(async (req, res) => {
  try {
    await blockchainSyncService.stop();
    res.json({
      success: true,
      message: 'Blockchain sync service stopped successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
}));

// Force manual sync (admin only)
router.post('/sync', authMiddleware, asyncHandler(async (req, res) => {
  try {
    await blockchainSyncService.manualSync();
    res.json({
      success: true,
      message: 'Manual sync completed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}));

// Get sync statistics
router.get('/stats', asyncHandler(async (req, res) => {
  const { query } = require('../database/connection');
  
  try {
    // Get event counts by type
    const eventStatsResult = await query(`
      SELECT 
        event_type,
        COUNT(*) as count,
        MIN(created_at) as first_event,
        MAX(created_at) as latest_event,
        MAX(CAST(block_number AS BIGINT)) as latest_block
      FROM blockchain_events 
      GROUP BY event_type 
      ORDER BY latest_event DESC
    `);
    
    // Get sync activity over time (last 24 hours)
    const activityResult = await query(`
      SELECT 
        DATE_TRUNC('hour', created_at) as hour,
        event_type,
        COUNT(*) as events
      FROM blockchain_events 
      WHERE created_at >= NOW() - INTERVAL '24 hours'
      GROUP BY DATE_TRUNC('hour', created_at), event_type
      ORDER BY hour DESC
    `);
    
    // Get overall database stats
    const overallStatsResult = await query(`
      SELECT 
        COUNT(*) as total_events,
        COUNT(DISTINCT transaction_hash) as unique_transactions,
        COUNT(DISTINCT discovery_id) as unique_discoveries,
        COUNT(DISTINCT miner) as unique_miners,
        MIN(created_at) as first_sync,
        MAX(created_at) as latest_sync
      FROM blockchain_events
    `);
    
    res.json({
      success: true,
      data: {
        eventStats: eventStatsResult.rows,
        recentActivity: activityResult.rows,
        overallStats: overallStatsResult.rows[0],
        syncService: blockchainSyncService.getStatus()
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}));

// Health check endpoint
router.get('/health', asyncHandler(async (req, res) => {
  const status = blockchainSyncService.getStatus();
  const isHealthy = status.isRunning;
  
  res.status(isHealthy ? 200 : 503).json({
    success: isHealthy,
    status: isHealthy ? 'healthy' : 'unhealthy',
    service: 'blockchain-sync',
    data: status
  });
}));

module.exports = router;
