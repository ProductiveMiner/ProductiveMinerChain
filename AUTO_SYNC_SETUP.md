# Automatic Blockchain Sync Setup Guide

This guide shows you how to set up automatic blockchain event syncing so your Aurora database stays updated with new discoveries and mining sessions without manual intervention.

## 🎯 Overview

The automatic sync system will:
- ✅ Monitor the blockchain for new events every 5 minutes
- ✅ Sync all 5 event types: DiscoverySubmitted, DiscoveryValidated, MathematicalDiscoveryAdded, MiningSessionCompleted, MiningSessionStarted
- ✅ Only sync new events (incremental updates)
- ✅ Handle errors gracefully and continue running
- ✅ Log all activities for monitoring

## 🚀 Setup Options

### Option 1: Cron Job (Recommended for Linux/Mac)

**Quick Setup:**
```bash
# Run the setup script
./setup-auto-sync.sh
```

**Manual Setup:**
```bash
# Make scripts executable
chmod +x auto-sync.js
chmod +x setup-auto-sync.sh

# Set up cron job to run every 5 minutes
crontab -e
# Add this line:
*/5 * * * * cd /path/to/ProductiveMiner.v2 && node auto-sync.js >> logs/auto-sync.log 2>&1
```

**Monitor the sync:**
```bash
# View live logs
tail -f logs/auto-sync.log

# Check cron jobs
crontab -l

# Test manually
node auto-sync.js
```

### Option 2: Continuous Service

**Start the service:**
```bash
# Start continuous sync service
node auto-sync-service.js

# Or run in background
nohup node auto-sync-service.js > logs/service.log 2>&1 &
```

**Stop the service:**
```bash
# Find and kill the process
ps aux | grep auto-sync-service
kill <process_id>

# Or use Ctrl+C if running in foreground
```

### Option 3: Backend Integration

**Add to your backend server:**
```javascript
// In backend/src/server.js
const blockchainSyncService = require('./services/blockchainSyncService');

// Start sync service when server starts
app.listen(port, async () => {
    console.log(`Server running on port ${port}`);
    
    // Start blockchain sync service
    await blockchainSyncService.start();
});

// Add status endpoint
app.get('/api/sync/status', (req, res) => {
    res.json(blockchainSyncService.getStatus());
});
```

## 📊 Monitoring

### Check Sync Status
```bash
# View recent sync logs
tail -20 logs/auto-sync.log

# Check database for latest events
psql -h your-aurora-host -U your-user -d your-db -c "
SELECT 
    event_type,
    COUNT(*) as count,
    MAX(created_at) as latest_event
FROM blockchain_events 
GROUP BY event_type 
ORDER BY latest_event DESC;
"
```

### API Status Endpoint
If using backend integration, check sync status:
```bash
curl https://your-api.com/api/sync/status
```

## 🔧 Configuration

### Sync Intervals
- **Default**: Every 5 minutes
- **Custom**: Edit `SYNC_INTERVAL_MS` in the scripts
- **Cron**: Change `*/5` to your preferred interval

### Block Range
- **Default**: Last 100 blocks
- **Custom**: Edit `SYNC_INTERVAL_BLOCKS` in the scripts

### Contract Address
- **Current**: `0x7877EFAb4aD3610792a135f6f8A241962fD2ab76`
- **Update**: Edit `CONTRACT_ADDRESS` in the scripts if needed

## 🛠️ Troubleshooting

### Common Issues

**1. Script not found:**
```bash
# Check if script exists
ls -la auto-sync.js

# Make executable
chmod +x auto-sync.js
```

**2. Database connection failed:**
```bash
# Check environment variables
cat aurora-rds-config.env

# Test connection
node -e "
const { query } = require('./backend/src/database/connection');
query('SELECT NOW()').then(r => console.log('DB OK:', r.rows[0]));
"
```

**3. No new events found:**
```bash
# Check if database is up to date
node auto-sync.js

# Manual sync from specific block
node -e "
const { autoSync } = require('./auto-sync.js');
// Modify fromBlock in autoSync() function
"
```

**4. Cron job not running:**
```bash
# Check cron service
sudo service cron status

# Check cron logs
sudo tail -f /var/log/cron

# Test cron manually
crontab -l
```

### Log Analysis

**Check for errors:**
```bash
grep -i error logs/auto-sync.log
grep -i failed logs/auto-sync.log
```

**Check sync frequency:**
```bash
grep "Auto-sync completed" logs/auto-sync.log | tail -10
```

**Check event counts:**
```bash
grep "Total new events synced" logs/auto-sync.log | tail -10
```

## 🔄 Maintenance

### Regular Tasks

**1. Monitor disk space:**
```bash
# Check log file size
du -h logs/auto-sync.log

# Rotate logs if needed
mv logs/auto-sync.log logs/auto-sync.log.$(date +%Y%m%d)
```

**2. Verify sync is working:**
```bash
# Check last sync time
tail -1 logs/auto-sync.log

# Verify database has recent events
psql -h your-aurora-host -U your-user -d your-db -c "
SELECT 
    event_type,
    MAX(created_at) as latest,
    COUNT(*) as total
FROM blockchain_events 
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY event_type;
"
```

**3. Update contract address if needed:**
```bash
# If contract is redeployed, update address in scripts
sed -i 's/old-address/new-address/g' auto-sync.js
```

## 🚨 Alerts

Set up monitoring alerts for:
- Sync failures (check logs for errors)
- No new events for extended periods
- Database connection issues
- High log file sizes

## 📈 Performance

The sync system is designed to be lightweight:
- **Memory**: ~50MB per sync
- **Network**: Minimal (only queries new blocks)
- **Database**: Efficient incremental updates
- **CPU**: Low usage (mostly I/O bound)

## 🔐 Security

- Uses read-only blockchain queries
- No private keys required
- Database credentials stored securely
- Logs don't contain sensitive data

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review logs in `logs/auto-sync.log`
3. Test manual sync: `node auto-sync.js`
4. Verify database connectivity
5. Check blockchain RPC endpoint status

---

**Happy Mining! 🚀**
