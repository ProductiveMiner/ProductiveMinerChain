# Aurora RDS Setup for ProductiveMiner

This guide will help you create a new Aurora PostgreSQL RDS cluster and connect it to your ECS backend and productiveminer.org ERC20 data.

## 🚀 Quick Start

### Prerequisites

1. **AWS CLI installed and configured**
   ```bash
   aws configure
   ```

2. **Node.js and npm** (for ERC20 data sync)
   ```bash
   node --version
   npm --version
   ```

3. **PostgreSQL client** (optional, for manual database operations)
   ```bash
   # macOS
   brew install postgresql
   
   # Ubuntu
   sudo apt-get install postgresql-client
   ```

### Step 1: Create Aurora RDS Cluster

Run the comprehensive setup script:

```bash
./create-aurora-rds-with-ecs.sh
```

This script will:
- ✅ Create an Aurora PostgreSQL cluster
- ✅ Set up security groups and VPC configuration
- ✅ Initialize the database with optimal research schema
- ✅ Update ECS task definition
- ✅ Sync ERC20 data from productiveminer.org
- ✅ Generate configuration files

### Step 2: Verify Setup

Check that everything is working:

```bash
# Test database connection
node sync-erc20-to-aurora.js

# Check ECS service status
aws ecs describe-services --cluster productiveminer-cluster --services productiveminer-backend
```

## 📋 Configuration Details

### Aurora Cluster Configuration

- **Engine**: Aurora PostgreSQL 15.4
- **Instance Class**: db.t3.medium (Aurora compatible)
- **Storage**: Aurora storage (auto-scaling)
- **Backup Retention**: 7 days
- **Encryption**: Enabled
- **Multi-AZ**: Disabled (for cost savings)

### Database Schema

The setup uses the optimal research schema from `database/optimal-research-schema.sql` which includes:

- **discoveries**: Core mathematical discovery data
- **mathematical_results**: Detailed mathematical computations
- **validations**: Consensus and validation data
- **discovery_tokenomics**: Token economics and rewards
- **citations**: Academic and commercial impact
- **work_types**: Mathematical problem categories
- **network_metrics**: System performance metrics
- **research_quality**: Peer review and validation
- **mining_sessions**: Mining session tracking

### Connection Details

After setup, you'll get:

- **Writer Endpoint**: For write operations
- **Reader Endpoint**: For read operations (load balancing)
- **Database**: `productiveminer_db`
- **Username**: `productiveminer`
- **Password**: Generated securely with timestamp

## 🔧 Manual Setup (Alternative)

If you prefer to set up manually:

### 1. Create Aurora Cluster

```bash
# Create cluster
aws rds create-db-cluster \
    --db-cluster-identifier productiveminer-aurora-cluster \
    --engine aurora-postgresql \
    --engine-version 15.4 \
    --master-username productiveminer \
    --master-user-password "YourSecurePassword123!" \
    --database-name productiveminer_db \
    --storage-encrypted \
    --backup-retention-period 7

# Create instance
aws rds create-db-instance \
    --db-instance-identifier productiveminer-aurora-instance \
    --db-cluster-identifier productiveminer-aurora-cluster \
    --engine aurora-postgresql \
    --engine-version 15.4 \
    --db-instance-class db.t3.medium \
    --publicly-accessible
```

### 2. Apply Schema

```bash
# Get endpoint
DB_ENDPOINT=$(aws rds describe-db-clusters \
    --db-cluster-identifier productiveminer-aurora-cluster \
    --query "DBClusters[0].Endpoint" --output text)

# Apply schema
PGPASSWORD="YourSecurePassword123!" psql \
    -h "$DB_ENDPOINT" \
    -p 5432 \
    -U productiveminer \
    -d productiveminer_db \
    -f database/optimal-research-schema.sql
```

### 3. Update ECS Configuration

Update your ECS task definition with the new database URL:

```json
{
    "environment": [
        {
            "name": "DATABASE_URL",
            "value": "postgresql://productiveminer:YourSecurePassword123!@your-aurora-endpoint:5432/productiveminer_db"
        }
    ]
}
```

## 🔄 ERC20 Data Sync

The setup includes automatic ERC20 data synchronization from productiveminer.org:

### Automatic Sync

The setup script automatically runs:
```bash
node sync-erc20-to-aurora.js
```

### Manual Sync

To sync data manually:
```bash
# Set environment variables
export DB_HOST="your-aurora-endpoint"
export DB_PASSWORD="your-password"
export MINED_TOKEN_ADDRESS="0x016A5B5617D26b93Ec6fB8DB2DC1BA79DefB088e"

# Run sync
node sync-erc20-to-aurora.js
```

### Sync Features

- **Token Information**: MINED token details
- **Discovery Events**: Mathematical discoveries from blockchain
- **Tokenomics Data**: Reward calculations and burn rates
- **Network Metrics**: System performance indicators

## 📊 Monitoring and Maintenance

### CloudWatch Alarms

Set up monitoring for:
- CPU utilization
- Database connections
- Storage space
- Read/write latency

### Backup Strategy

- **Automated Backups**: 7-day retention
- **Manual Snapshots**: Before major changes
- **Point-in-time Recovery**: Available for Aurora

### Scaling

- **Read Replicas**: Add for read-heavy workloads
- **Instance Scaling**: Upgrade instance class as needed
- **Storage Scaling**: Aurora auto-scales storage

## 🔒 Security

### Network Security

- **VPC**: Default VPC with security groups
- **Security Groups**: PostgreSQL port 5432 open
- **SSL**: Enabled for production connections

### Access Control

- **IAM**: Use IAM database authentication
- **Secrets Manager**: Store credentials securely
- **Parameter Groups**: Configure database parameters

## 💰 Cost Optimization

### Aurora Cost Factors

- **Instance Hours**: db.t3.medium pricing
- **Storage**: Aurora storage per GB
- **I/O**: Storage I/O operations
- **Backup Storage**: Beyond free tier

### Cost Reduction Tips

- Use Reserved Instances for predictable workloads
- Enable Aurora Serverless for variable workloads
- Monitor and optimize query performance
- Use read replicas for read-heavy workloads

## 🚨 Troubleshooting

### Common Issues

1. **Connection Timeout**
   ```bash
   # Check security group rules
   aws ec2 describe-security-groups --group-ids sg-xxxxx
   ```

2. **Schema Application Failed**
   ```bash
   # Check database connectivity
   PGPASSWORD="password" psql -h endpoint -U username -d database -c "SELECT version();"
   ```

3. **ECS Service Not Starting**
   ```bash
   # Check ECS logs
   aws logs describe-log-groups --log-group-name-prefix "/ecs/productiveminer"
   ```

### Support Commands

```bash
# Check Aurora cluster status
aws rds describe-db-clusters --db-cluster-identifier productiveminer-aurora-cluster

# Check ECS service status
aws ecs describe-services --cluster productiveminer-cluster --services productiveminer-backend

# Test database connection
node -e "
const { Pool } = require('pg');
const pool = new Pool({
  host: 'your-endpoint',
  user: 'productiveminer',
  password: 'your-password',
  database: 'productiveminer_db',
  ssl: { rejectUnauthorized: false }
});
pool.query('SELECT NOW()').then(res => console.log('Connected:', res.rows[0])).catch(console.error);
"
```

## 📁 Generated Files

After setup, these files will be created:

- `aurora-rds-config.env`: Environment variables
- `new-task-definition.json`: ECS task definition
- `docker.env.backup.*`: Backup of original configuration
- `current-task-def-full.json`: Current ECS task definition

## 🔗 Integration Points

### ECS Backend

The Aurora database is configured to work with your existing ECS backend:

- **Environment Variables**: Updated in task definition
- **Connection Pooling**: Optimized for Aurora
- **Read/Write Splitting**: Uses reader endpoint for reads

### productiveminer.org

ERC20 data is synced from your blockchain contracts:

- **MINED Token**: Token economics and transfers
- **ProductiveMiner**: Discovery events and rewards
- **Network Metrics**: System performance data

## 📈 Performance Optimization

### Aurora Optimizations

- **Connection Pooling**: Use connection pooling
- **Read Replicas**: Distribute read load
- **Query Optimization**: Monitor slow queries
- **Indexing**: Ensure proper indexes exist

### Application Optimizations

- **Batch Operations**: Use batch inserts for bulk data
- **Caching**: Implement application-level caching
- **Connection Management**: Reuse connections
- **Query Planning**: Use prepared statements

## 🎯 Next Steps

1. **Monitor Performance**: Set up CloudWatch dashboards
2. **Scale as Needed**: Add read replicas or upgrade instances
3. **Backup Strategy**: Implement automated backup testing
4. **Security Hardening**: Enable IAM database authentication
5. **Cost Monitoring**: Set up billing alerts

---

**Note**: This setup creates a production-ready Aurora RDS cluster. Remember to:
- Save credentials securely
- Monitor costs regularly
- Test backups periodically
- Update security groups as needed
