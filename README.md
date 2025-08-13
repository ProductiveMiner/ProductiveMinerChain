# 🚀 ProductiveMiner DApp - Complete Blockchain Mining Platform

A comprehensive decentralized application (DApp) for mathematical discovery mining with MINED token integration, featuring a React frontend, Node.js backend, smart contracts, and complete infrastructure.

## 📁 Project Structure

```
ProductiveMiner.v2/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── pages/           # Page components
│   │   ├── config/          # Configuration files
│   │   ├── services/        # API and Web3 services
│   │   └── contexts/        # React contexts
│   ├── public/              # Static assets
│   └── package.json         # Frontend dependencies
├── backend/                  # Node.js backend API
│   ├── src/
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── middleware/      # Express middleware
│   │   └── database/        # Database connections
│   └── package.json         # Backend dependencies
├── contracts/               # Smart contracts (Solidity)
│   ├── contracts/           # Solidity contract files
│   ├── scripts/             # Deployment scripts
│   ├── test/                # Contract tests
│   └── hardhat.config.js    # Hardhat configuration
├── blockchain/              # Local blockchain node
│   ├── src/                 # Blockchain implementation
│   └── package.json         # Blockchain dependencies
├── database/                # Database schema and migrations
│   ├── schema.sql           # Database schema
│   ├── seed.sql             # Initial data
│   └── init/                # Database initialization
├── monitoring/              # Monitoring and analytics
├── nginx/                   # Nginx configuration
├── ssl/                     # SSL certificates
├── docker-compose.yml       # Main Docker Compose file
├── docker-compose-asymptotic.yml  # Asymptotic deployment
├── docker.env               # Docker environment variables
└── env.example              # Environment variables template
```

## 🏗️ Core Components

### 1. **Frontend (React)**
- Modern React application with Web3 integration
- MetaMask wallet connection
- Real-time mining interface
- MINED token display and management
- Responsive design with modern UI/UX

### 2. **Backend (Node.js)**
- RESTful API for mining operations
- User authentication and session management
- Database integration (PostgreSQL)
- Redis caching for performance
- CORS and security middleware

### 3. **Smart Contracts (Solidity)**
- **ProductiveMiner**: Main mining contract
- **MINEDToken**: Asymptotic emission token
- **TokenIntegrationBridge**: Token distribution bridge
- Mathematical discovery mining algorithms
- Secure reward distribution system

### 4. **Blockchain Infrastructure**
- Local Ethereum node for development
- Hardhat development environment
- Contract deployment and verification
- Gas optimization and security audits

### 5. **Database & Storage**
- PostgreSQL for persistent data
- Redis for caching and sessions
- Automated backups and migrations
- Data analytics and reporting

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- Docker and Docker Compose
- PostgreSQL and Redis
- MetaMask browser extension

### 1. Clone and Setup
```bash
git clone <repository-url>
cd ProductiveMiner.v2
cp env.example .env
# Edit .env with your configuration
```

### 2. Start Infrastructure
```bash
# Start database, Redis, and monitoring
docker-compose up -d postgres redis grafana
```

### 3. Deploy Smart Contracts
```bash
cd contracts
npm install
npx hardhat compile
npx hardhat node --hostname 0.0.0.0
# In another terminal:
npx hardhat run scripts/deploy.js --network localhost
```

### 4. Start Backend
```bash
cd backend
npm install
npm start
```

### 5. Start Frontend
```bash
cd frontend
npm install
npm start
```

### 6. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Blockchain**: http://localhost:8545
- **Monitoring**: http://localhost:3002 (admin/admin123)

## 🔧 Configuration

### Environment Variables
Copy `env.example` to `.env` and configure:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/productiveminer

# Redis
REDIS_URL=redis://localhost:6379

# Blockchain
ETHEREUM_RPC_URL=http://localhost:8545
CONTRACT_ADDRESS=0x...

# Frontend
REACT_APP_API_URL=http://localhost:5000
REACT_APP_CONTRACT_ADDRESS=0x...
```

### Smart Contract Configuration
Update `contracts/hardhat.config.js` with your network settings:

```javascript
module.exports = {
  networks: {
    localhost: {
      url: "http://localhost:8545"
    },
    sepolia: {
      url: `https://sepolia.infura.io/v3/${INFURA_PROJECT_ID}`,
      accounts: [PRIVATE_KEY]
    }
  }
};
```

## 🎯 Key Features

### Mathematical Discovery Mining
- **Proof of Mathematical Discovery**: Users solve mathematical problems
- **Research Value Accumulation**: Mining difficulty increases with research value
- **Asymptotic Token Emission**: MINED tokens distributed based on mathematical contributions
- **Real-time Mining Interface**: Live mining progress and statistics

### MINED Token System
- **Asymptotic Emission Model**: E(t) = E₀ × e^(-λt) × (1 + α × ResearchValue(t))
- **Research Value Integration**: Token emission boosted by mathematical discoveries
- **MetaMask Integration**: Easy token management and transfers
- **Token Analytics**: Real-time emission rates and distribution statistics

### Complete Infrastructure
- **Docker Deployment**: Containerized application for easy deployment
- **Monitoring & Analytics**: Grafana dashboards for system monitoring
- **Database Management**: Automated migrations and backups
- **Security**: CORS, authentication, and input validation

## 🔒 Security Features

- **Smart Contract Audits**: All contracts audited for security
- **Input Validation**: Comprehensive validation on frontend and backend
- **Authentication**: Secure user authentication and session management
- **CORS Protection**: Proper CORS configuration for API security
- **Rate Limiting**: API rate limiting to prevent abuse

## 📊 Monitoring & Analytics

### Grafana Dashboards
- **Mining Activity**: Real-time mining statistics
- **Token Emission**: MINED token distribution metrics
- **System Performance**: Backend and database performance
- **User Engagement**: User activity and participation metrics

### Database Analytics
- **Mining Sessions**: Complete mining history and statistics
- **Token Transactions**: All MINED token transfers and distributions
- **User Research**: Mathematical discovery contributions
- **System Metrics**: Performance and usage analytics

## 🚀 Deployment

### Local Development
```bash
# Complete local setup
./rebuild.sh
```

### Production Deployment
```bash
# Deploy to production
docker-compose -f docker-compose.prod.yml up -d
```

### AWS Deployment
```bash
# Deploy to AWS ECS
./deploy-to-aws.sh
```

## 📚 Documentation

- **Deployment Guide**: `PRODUCTIVEMINER_DEPLOYMENT_GUIDE.md`
- **Docker Guide**: `DOCKER_DEPLOYMENT_README.md`
- **API Documentation**: Available at `/api/docs` when backend is running
- **Contract Documentation**: Available in `contracts/README.md`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: Create an issue on GitHub
- **Documentation**: Check the documentation files
- **Community**: Join our Discord/Telegram for support

---

**ProductiveMiner DApp v2.0** - Complete mathematical discovery mining platform with MINED token integration.
