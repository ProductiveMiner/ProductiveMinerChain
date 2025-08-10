#!/bin/bash

echo "🔧 Setting up ProductiveMiner contract verification environment..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOF
# Etherscan API Key - Get from https://etherscan.io/myapikey
ETHERSCAN_API_KEY=your_etherscan_api_key_here

# Deployment Private Key (without 0x prefix)
PRIVATE_KEY=your_deployment_private_key_here

# RPC URLs
TESTNET_RPC_URL=https://sepolia.infura.io/v3/YOUR-PROJECT-ID
MAINNET_RPC_URL=https://mainnet.infura.io/v3/YOUR-PROJECT-ID

# Optional: CoinMarketCap API for gas reporting
COINMARKETCAP_API_KEY=your_coinmarketcap_api_key_here
EOF
    echo "✅ .env file created"
    echo "⚠️  Please update the .env file with your actual API keys and private key"
else
    echo "ℹ️  .env file already exists"
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
else
    echo "ℹ️  Dependencies already installed"
fi

# Check if hardhat is installed
if ! command -v npx &> /dev/null; then
    echo "❌ npx not found. Please install Node.js and npm first."
    exit 1
fi

echo ""
echo "🎉 Setup completed!"
echo ""
echo "📋 Next steps:"
echo "   1. Update .env file with your API keys and private key"
echo "   2. Get testnet ETH from https://sepoliafaucet.com/"
echo "   3. Deploy to testnet: npx hardhat run deploy-testnet.js --network testnet"
echo "   4. Verify on Etherscan: npx hardhat run verify-existing.js --network testnet"
echo ""
echo "📚 For detailed instructions, see CONTRACT_VERIFICATION_GUIDE.md"
