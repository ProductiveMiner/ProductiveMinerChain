# ProductiveMiner Asymptotic Token System - Docker Deployment

This guide explains how to deploy the complete ProductiveMiner Asymptotic Token System using Docker.

## 🎯 Overview

The Docker deployment includes:
- **MINED Token (Asymptotic)**: ERC-20 token with asymptotic emission model
- **ProductiveMiner (Asymptotic)**: Enhanced mining contract with token integration
- **Frontend**: React application with asymptotic model visualization
- **Backend**: Node.js API server with token integration
- **Database**: PostgreSQL for data persistence
- **Cache**: Redis for performance optimization
- **Monitoring**: Grafana for analytics and monitoring
- **Reverse Proxy**: Nginx for routing and SSL termination

## 🚀 Quick Start

### Prerequisites

1. **Docker**: Install Docker Desktop or Docker Engine
2. **Docker Compose**: Install Docker Compose
3. **Git**: Clone the repository
4. **OpenSSL**: For SSL certificate generation (optional)

### 1. Clone and Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd ProductiveMiner.v2

# Make the deployment script executable
chmod +x deploy-docker.sh
```

### 2. Deploy the System

```bash
# Deploy the complete system
./deploy-docker.sh

# Or use docker-compose directly
docker-compose -f docker-compose-asymptotic.yml --env-file docker.env up -d --build
```

### 3. Access the System

After deployment, you can access:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Hardhat Node**: http://localhost:8545
- **Grafana Monitoring**: http://localhost:3002
- **Database**: localhost:5432
- **Redis**: localhost:6379

## 📋 Deployment Script Commands

The `deploy-docker.sh` script provides several commands:

```bash
# Deploy the complete system (default)
./deploy-docker.sh deploy

# Show service logs
./deploy-docker.sh logs

# Stop all services
./deploy-docker.sh stop

# Clean up everything (containers, volumes, networks)
./deploy-docker.sh cleanup

# Restart the complete system
./deploy-docker.sh restart
```

## 🏗️ Architecture

### Service Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Hardhat Node  │
│   (React)       │    │   (Node.js)     │    │   (Local Chain) │
│   Port: 3000    │    │   Port: 3001    │    │   Port: 8545    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Nginx Proxy   │
                    │   Port: 80/443  │
                    └─────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   PostgreSQL    │    │   Redis Cache   │    │   Grafana       │
│   Port: 5432    │    │   Port: 6379    │    │   Port: 3002    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Container Details

| Service | Container Name | Port | Description |
|---------|----------------|------|-------------|
| Frontend | productiveminer-frontend | 3000 | React application |
| Backend | productiveminer-backend | 3001 | Node.js API server |
| Hardhat Node | productiveminer-hardhat-node | 8545 | Local blockchain |
| Contract Deployer | productiveminer-contract-deployer | - | Deploys contracts |
| Database | productiveminer-database | 5432 | PostgreSQL database |
| Redis | productiveminer-redis | 6379 | Cache server |
| Nginx | productiveminer-nginx | 80/443 | Reverse proxy |
| Monitoring | productiveminer-monitoring | 3002 | Grafana dashboard |

## 🔧 Configuration

### Environment Variables

The system uses `docker.env` for configuration. Key variables:

```bash
# Deployment
DEPLOYER_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# Database
DB_USER=productiveminer
DB_PASSWORD=productiveminer123
DATABASE_URL=postgresql://productiveminer:productiveminer123@database:5432/productiveminer

# Redis
REDIS_URL=redis://redis:6379

# Network
HARDHAT_NODE_URL=http://hardhat-node:8545
NETWORK=localhost
CHAIN_ID=31337

# Asymptotic Model
ASYMPTOTIC_MODEL_ENABLED=true
INITIAL_EMISSION_RATE=1000
DECAY_CONSTANT=0.0001
RESEARCH_MULTIPLIER_BASE=0.01
SOFT_CAP=1500000000
```

### Contract Addresses

After deployment, contract addresses are automatically extracted and updated in `docker.env`:

```bash
MINED_TOKEN_ADDRESS=0x...  # Automatically populated
PRODUCTIVE_MINER_ADDRESS=0x...  # Automatically populated
```

## 🔍 Monitoring and Analytics

### Grafana Dashboard

Access Grafana at http://localhost:3002
- **Username**: admin
- **Password**: admin123

### Key Metrics

1. **Token Emission**: Real-time asymptotic emission rates
2. **Research Value**: Accumulated research contributions
3. **Mining Activity**: Active sessions and discoveries
4. **Network Stats**: Blockchain and contract metrics
5. **User Activity**: Mining and staking statistics

### Logs

View service logs:

```bash
# All services
./deploy-docker.sh logs

# Specific service
docker-compose -f docker-compose-asymptotic.yml logs -f backend
docker-compose -f docker-compose-asymptotic.yml logs -f frontend
docker-compose -f docker-compose-asymptotic.yml logs -f hardhat-node
```

## 🧪 Testing the System

### 1. Connect MetaMask

1. Open MetaMask
2. Add network:
   - **Network Name**: ProductiveMiner Local
   - **RPC URL**: http://localhost:8545
   - **Chain ID**: 31337
   - **Currency Symbol**: ETH

### 2. Add MINED Token

1. Get the token address from deployment logs
2. In MetaMask: Import Token → Add Token Address
3. **Token Address**: (from deployment)
4. **Token Symbol**: MINED
5. **Token Decimals**: 18

### 3. Test Mining

1. Open http://localhost:3000
2. Connect your wallet
3. Start a mining session
4. Complete mathematical work
5. Receive asymptotic token rewards

### 4. Monitor Emission

1. Check token balance in MetaMask
2. View emission curves in Grafana
3. Monitor research value accumulation

## 🔒 Security Considerations

### Development Environment

- **Self-signed SSL**: Generated automatically for HTTPS
- **Default credentials**: Change in production
- **Local network**: Isolated Docker network
- **No external access**: Services only accessible locally

### Production Deployment

For production deployment:

1. **Change default passwords**
2. **Use proper SSL certificates**
3. **Configure firewall rules**
4. **Set up proper backups**
5. **Enable monitoring and alerting**

## 🚨 Troubleshooting

### Common Issues

1. **Port conflicts**
   ```bash
   # Check if ports are in use
   netstat -tulpn | grep :3000
   netstat -tulpn | grep :8545
   
   # Stop conflicting services
   sudo systemctl stop apache2  # if needed
   ```

2. **Docker not running**
   ```bash
   # Start Docker
   sudo systemctl start docker
   sudo systemctl enable docker
   ```

3. **Permission issues**
   ```bash
   # Fix file permissions
   sudo chown -R $USER:$USER .
   chmod +x deploy-docker.sh
   ```

4. **Contract deployment fails**
   ```bash
   # Check deployment logs
   docker-compose -f docker-compose-asymptotic.yml logs contract-deployer
   
   # Restart deployment
   ./deploy-docker.sh restart
   ```

### Debug Commands

```bash
# Check service status
docker-compose -f docker-compose-asymptotic.yml ps

# Check service health
docker-compose -f docker-compose-asymptotic.yml exec backend curl -f http://localhost:3001/health

# View container logs
docker-compose -f docker-compose-asymptotic.yml logs -f [service-name]

# Access container shell
docker-compose -f docker-compose-asymptotic.yml exec [service-name] sh
```

## 📊 Performance Optimization

### Resource Allocation

Default resource limits can be adjusted in `docker-compose-asymptotic.yml`:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '0.5'
        reservations:
          memory: 512M
          cpus: '0.25'
```

### Scaling

Scale services as needed:

```bash
# Scale backend instances
docker-compose -f docker-compose-asymptotic.yml up -d --scale backend=3

# Scale frontend instances
docker-compose -f docker-compose-asymptotic.yml up -d --scale frontend=2
```

## 🔄 Updates and Maintenance

### Updating the System

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
./deploy-docker.sh restart
```

### Backup and Restore

```bash
# Backup database
docker-compose -f docker-compose-asymptotic.yml exec database pg_dump -U productiveminer productiveminer > backup.sql

# Restore database
docker-compose -f docker-compose-asymptotic.yml exec -T database psql -U productiveminer productiveminer < backup.sql
```

### Cleanup

```bash
# Remove all containers and volumes
./deploy-docker.sh cleanup

# Remove images
docker rmi $(docker images -q productiveminer*)
```

## 📚 Additional Resources

- [Asymptotic Token Guide](./contracts/ASYMPTOTIC_TOKEN_GUIDE.md)
- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [ProductiveMiner Documentation](./README.md)

## 🆘 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review service logs: `./deploy-docker.sh logs`
3. Verify Docker and Docker Compose installation
4. Check system resources and port availability
5. Review the asymptotic token guide for contract details

---

**Note**: This Docker deployment is designed for development and testing. For production deployment, additional security measures and configuration changes are required.
