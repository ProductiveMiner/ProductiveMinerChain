# ProductiveMiner DApp

A complete decentralized application (DApp) for productive mining with blockchain integration, featuring a React frontend, Node.js backend, and Ethereum smart contracts.

## 🚀 Features

- **Blockchain Integration**: Ethereum smart contracts for mining operations
- **Modern Frontend**: React-based user interface with Web3 integration
- **Backend API**: Node.js/Express server with comprehensive mining functionality
- **Smart Contracts**: Solidity contracts with security features and optimization
- **Docker Support**: Containerized deployment for all components
- **Database Integration**: PostgreSQL and Redis for data persistence and caching

## 📁 Project Structure

```
ProductiveMiner.v2/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API and Web3 services
│   │   ├── contexts/       # React contexts
│   │   └── contracts/      # Contract ABIs
│   ├── public/             # Static assets
│   └── package.json
├── backend/                 # Node.js backend API
│   ├── src/
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Express middleware
│   │   ├── services/       # Business logic
│   │   ├── database/       # Database connections
│   │   └── utils/          # Utility functions
│   └── package.json
├── contracts/              # Ethereum smart contracts
│   ├── contracts/          # Solidity contract files
│   ├── scripts/            # Deployment scripts
│   ├── test/               # Contract tests
│   └── hardhat.config.js
├── blockchain/             # Local blockchain setup
├── docker-compose.yml      # Docker orchestration
└── README.md
```

## 🛠️ Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Docker and Docker Compose
- MetaMask or Web3 wallet
- Git

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd ProductiveMiner.v2
```

### 2. Environment Setup

Create environment files for each component:

**Frontend (.env)**
```bash
REACT_APP_API_URL=http://localhost:3001
REACT_APP_CONTRACT_ADDRESS=<deployed-contract-address>
REACT_APP_NETWORK_ID=1337
```

**Backend (.env)**
```bash
PORT=3001
DATABASE_URL=postgresql://username:password@localhost:5432/productiveminer
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-jwt-secret
```

**Contracts (.env)**
```bash
PRIVATE_KEY=your-private-key
INFURA_URL=your-infura-url
ETHERSCAN_API_KEY=your-etherscan-key
```

### 3. Install Dependencies

```bash
# Frontend dependencies
cd frontend
npm install

# Backend dependencies
cd ../backend
npm install

# Contract dependencies
cd ../contracts
npm install
```

### 4. Start Local Blockchain

```bash
# Start local Ethereum network
cd blockchain
npm install
npm start
```

### 5. Deploy Smart Contracts

```bash
cd contracts
npx hardhat compile
npx hardhat run scripts/deploy.js --network localhost
```

### 6. Start Backend

```bash
cd backend
npm start
```

### 7. Start Frontend

```bash
cd frontend
npm start
```

## 🐳 Docker Deployment

### Using Docker Compose

```bash
# Build and start all services
docker-compose up --build

# Run in background
docker-compose up -d --build
```

### Individual Services

```bash
# Frontend
docker build -t productiveminer-frontend ./frontend
docker run -p 3000:3000 productiveminer-frontend

# Backend
docker build -t productiveminer-backend ./backend
docker run -p 3001:3001 productiveminer-backend

# Contracts
docker build -t productiveminer-contracts ./contracts
docker run productiveminer-contracts
```

## 📋 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Mining Operations
- `POST /api/mining/start` - Start mining operation
- `POST /api/mining/stop` - Stop mining operation
- `GET /api/mining/status` - Get mining status
- `GET /api/mining/history` - Get mining history

### Contracts
- `GET /api/contracts/balance` - Get contract balance
- `POST /api/contracts/deposit` - Deposit to contract
- `POST /api/contracts/withdraw` - Withdraw from contract

## 🔧 Smart Contracts

### ProductiveMiner.sol
Main contract for mining operations with features:
- Secure mining operations
- Reward distribution
- Access control
- Emergency functions

### Key Functions
- `startMining()` - Start mining operation
- `stopMining()` - Stop mining operation
- `claimRewards()` - Claim mining rewards
- `emergencyStop()` - Emergency stop function

## 🧪 Testing

### Frontend Tests
```bash
cd frontend
npm test
```

### Backend Tests
```bash
cd backend
npm test
```

### Contract Tests
```bash
cd contracts
npx hardhat test
```

## 🔒 Security Features

- Input validation and sanitization
- Access control mechanisms
- Secure random number generation
- Emergency stop functions
- Rate limiting
- CORS protection

## 📊 Monitoring

The application includes monitoring capabilities:
- Logging with structured logs
- Error tracking
- Performance monitoring
- Health checks

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation in each component directory
- Review the troubleshooting guides

## 🔄 Version History

- **v2.0.0** - Complete dapp with all components
- **v1.0.0** - Initial release

## 🙏 Acknowledgments

- Ethereum community for blockchain infrastructure
- React team for the frontend framework
- Node.js community for backend tools
- Open source contributors
