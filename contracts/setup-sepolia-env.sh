#!/bin/bash

echo "🔧 Setting up Sepolia deployment environment..."

# Create .env file with Alchemy credentials
cat > .env << EOF
# Network Configuration
NETWORK=sepolia

# Private Key (REPLACE WITH YOUR ACTUAL PRIVATE KEY)
PRIVATE_KEY=your_private_key_here

# RPC URL (Alchemy Sepolia)
RPC_URL=https://eth-sepolia.g.alchemy.com/v2/EsD9nEjl3rvwE35tYtTZC

# WebSocket URL (Alchemy Sepolia)
WSS_URL=wss://eth-sepolia.g.alchemy.com/v2/EsD9nEjl3rvwE35tYtTZC

# Etherscan API Key (for verification)
ETHERSCAN_API_KEY=your_etherscan_api_key_here

# Gas settings
GAS_LIMIT=3000000
GAS_PRICE=20
EOF

echo "✅ Environment file created!"
echo ""
echo "📝 IMPORTANT: Please edit .env file with your actual credentials:"
echo "   1. Replace 'your_private_key_here' with your wallet private key"
echo "   2. Replace 'your_etherscan_api_key_here' with your Etherscan API key"
echo ""
echo "🔐 SECURITY: Never commit your private key to version control!"
echo ""
echo "🚀 Ready to deploy to Sepolia!"
