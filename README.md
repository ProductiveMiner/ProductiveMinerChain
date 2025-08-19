# 🚀 ProductiveMiner DApp - Mathematical Discovery Mining Platform

A fully functional decentralized application (DApp) for mathematical discovery mining with MINED token integration, featuring a React frontend, Node.js backend, smart contracts, and complete infrastructure. **Successfully deployed to production at [productiveminer.org](https://productiveminer.org).**

## 🎯 MVP Status: **FULLY FUNCTIONAL**

✅ **Frontend**: React application with Web3 integration  
✅ **Backend**: Node.js API with PostgreSQL database  
✅ **Smart Contracts**: MINEDToken and ProductiveMiner deployed and verified  
✅ **Math Engine**: Python-based mathematical computation engine  
✅ **Database**: Aurora RDS with optimized schema  
✅ **Infrastructure**: AWS ECS, CloudFront, Route53  
✅ **Production**: Live at productiveminer.org  

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
├── engine/                  # Mathematical computation engine
│   ├── engine.py            # Core mathematical algorithms
│   ├── app.py               # Flask API server
│   └── requirements.txt     # Python dependencies
├── database/                # Database schema and migrations
│   ├── final-optimal-schema.sql  # Production database schema
│   ├── seed.sql             # Initial data
│   └── init/                # Database initialization
├── blockchain/              # Local blockchain node
├── monitoring/              # Monitoring and analytics
├── nginx/                   # Nginx configuration
├── ssl/                     # SSL certificates
├── docker-compose.yml       # Main Docker Compose file
├── docker-compose-asymptotic.yml  # Asymptotic deployment
├── docker.env               # Docker environment variables
└── env.example              # Environment variables template
```

## 🏗️ Core Components

### 1\. **Frontend (React)**
- Modern React application with Web3 integration
- MetaMask wallet connection
- Real-time mining interface
- MINED token display and management
- Responsive design with modern UI/UX
- **Status**: ✅ Production Ready

### 2\. **Backend (Node.js)**
- RESTful API for mining operations
- User authentication and session management
- Database integration (PostgreSQL)
- Redis caching for performance
- CORS and security middleware
- **Status**: ✅ Production Ready

### 3\. **Smart Contracts (Solidity)**
- **MINEDToken**: Asymptotic emission token with mathematical discovery rewards
- **ProductiveMiner**: Main mining contract with PoW/PoS validation
- Mathematical discovery mining algorithms
- Secure reward distribution system
- **Status**: ✅ Deployed and Verified

### 4\. **Math Engine (Python)**
- Python-based mathematical computation engine
- Flask API for mathematical operations
- Integration with mining algorithms
- **Status**: ✅ Production Ready

### 5\. **Database & Storage**
- PostgreSQL (Aurora RDS) for persistent data
- Redis for caching and sessions
- Optimized schema for mathematical discoveries
- **Status**: ✅ Production Ready

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- Docker and Docker Compose
- PostgreSQL and Redis
- MetaMask browser extension

### 1\. Clone and Setup
```bash
git clone https://github.com/ProductiveMiner/ProductiveMinerChain.git
cd ProductiveMiner.v2
cp env.example .env
# Edit .env with your configuration
```

### 2\. Start Infrastructure
```bash
# Start database, Redis, and monitoring
docker-compose up -d postgres redis grafana
```

### 3\. Deploy Smart Contracts
```bash
cd contracts
npm install
npx hardhat compile
npx hardhat node --hostname 0.0.0.0
# In another terminal:
npx hardhat run scripts/deploy.js --network localhost
```

### 4\. Start Backend
```bash
cd backend
npm install
npm start
```

### 5\. Start Frontend
```bash
cd frontend
npm install
npm start
```

### 6\. Start Math Engine
```bash
cd engine
pip install -r requirements.txt
python app.py
```

## 🔗 Production Deployment

The application is currently deployed and running at:
- **Frontend**: https://productiveminer.org
- **Backend API**: AWS ECS
- **Database**: Aurora RDS
- **CDN**: CloudFront
- **Domain**: Route53

## 📊 Key Features

### Mathematical Discovery Mining
- 25 mathematical work types supported
- PoW (Proof of Work) validation
- PoS (Proof of Stake) validation
- Real-time reward calculation
- Asymptotic token emission

### MINED Token Integration
- ERC-20 compliant token
- Asymptotic emission model
- Mathematical discovery rewards
- Validator incentives
- Research value maximization

### Research Validation
- Peer review system
- Citation tracking
- Academic integration
- International collaborations
- Scientific quality scoring

## 🛠️ Development

### Contract Development
```bash
cd contracts
npm install
npx hardhat test
npx hardhat compile
```

### Backend Development
```bash
cd backend
npm install
npm run dev
```

### Frontend Development
```bash
cd frontend
npm install
npm start
```

## 📚 Documentation

- **API Guide**: `PRODUCTIVEMINER_API_GUIDE.md`
- **Contract Documentation**: `ERC_CONTRACT_DOCUMENTATION.md`
- **Deployment Guide**: `AWS_DEPLOYMENT_GUIDE.md`
- **Database Setup**: `DATABASE_SETUP_GUIDE.md`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- **Website**: https://productiveminer.org
- **Documentation**: See docs/ directory
- **Issues**: GitHub Issues

---

**ProductiveMiner DApp** - Revolutionizing mathematical discovery through blockchain technology.
