#!/bin/bash

# Setup Infura Deployment for MINED Token
# This script helps you set up the environment for deployment

set -e

echo "=========================================="
echo "Setting up Infura Deployment for MINED Token"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Navigate to contracts directory
cd contracts

print_status "Setting up environment for Infura deployment..."

# Create .env file with Infura configuration
cat > .env << EOF
# Environment Variables for MINED Token Deployment
# Infura API Configuration
INFURA_PROJECT_ID=9d4c02e1be9d44cfa5aa7a9b8a27ad7d

# Network URLs
SEPOLIA_URL=https://sepolia.infura.io/v3/9d4c02e1be9d44cfa5aa7a9b8a27ad7d
MAINNET_URL=https://mainnet.infura.io/v3/9d4c02e1be9d44cfa5aa7a9b8a27ad7d

# Your private key (UPDATE THIS WITH YOUR ACTUAL PRIVATE KEY)
PRIVATE_KEY=your_private_key_here

# Etherscan API Key (for contract verification - optional)
ETHERSCAN_API_KEY=your_etherscan_api_key_here
EOF

print_success "Environment file created with your Infura API key!"

echo ""
echo "=========================================="
echo "🔧 Configuration Complete!"
echo "=========================================="
echo ""
echo "📋 **Your Infura Configuration:**"
echo "✅ Project ID: 9d4c02e1be9d44cfa5aa7a9b8a27ad7d"
echo "✅ Sepolia URL: https://sepolia.infura.io/v3/9d4c02e1be9d44cfa5aa7a9b8a27ad7d"
echo "✅ Mainnet URL: https://mainnet.infura.io/v3/9d4c02e1be9d44cfa5aa7a9b8a27ad7d"
echo ""
echo "⚠️  **IMPORTANT: Update the .env file with your private key!**"
echo ""
echo "📝 **Next Steps:**"
echo "1. Edit contracts/.env and replace 'your_private_key_here' with your actual private key"
echo "2. Get Sepolia testnet ETH from: https://sepoliafaucet.com/"
echo "3. Run: ./deploy-to-sepolia.sh"
echo ""
echo "🔍 **Your token will be visible on:**"
echo "🌐 Sepolia Etherscan: https://sepolia.etherscan.io/"
echo "🌐 Mainnet Etherscan: https://etherscan.io/ (after mainnet deployment)"
echo ""

print_success "Infura deployment setup completed!"

cd ..
