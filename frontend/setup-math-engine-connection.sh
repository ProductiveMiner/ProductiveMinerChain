#!/bin/bash

# Setup script for connecting frontend to Math Engine Backend ECS
echo "🔧 Setting up Math Engine connection for frontend..."

# Create environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOF
# Frontend Environment Configuration for Math Engine Connection

# Backend API Configuration
REACT_APP_API_URL=https://api.productiveminer.org

# Math Engine Backend ECS Configuration
REACT_APP_ENGINE_URL=http://localhost:5001
# For production ECS deployment, use the actual ECS endpoint:
# REACT_APP_ENGINE_URL=https://math-engine.productiveminer.org

# WebSocket Configuration
REACT_APP_WS_URL=wss://productiveminer.org/ws

# Blockchain Configuration
REACT_APP_BLOCKCHAIN_URL=https://eth-sepolia.g.alchemy.com/v2/EsD9nEjl3rvwE35tYtTZC

# Feature Flags
REACT_APP_SHOW_MINING_DASHBOARD=true
REACT_APP_SHOW_VALIDATORS=true
REACT_APP_SHOW_DISCOVERIES=true
REACT_APP_SHOW_RESEARCH_REPO=true
REACT_APP_SHOW_TOKENOMICS=true

# Math Engine Connection Settings
REACT_APP_MATH_ENGINE_TIMEOUT=30000
REACT_APP_MATH_ENGINE_RETRY_ATTEMPTS=3
REACT_APP_MATH_ENGINE_RETRY_DELAY=1000
EOF
    echo "✅ .env file created"
else
    echo "ℹ️ .env file already exists"
fi

# Check if math engine is running locally
echo "🔍 Checking Math Engine connection..."
if curl -s http://localhost:5001/health > /dev/null; then
    echo "✅ Math Engine is running locally on port 5001"
    echo "🔗 Frontend will connect to: http://localhost:5001"
else
    echo "⚠️ Math Engine not found on localhost:5001"
    echo "📋 To start Math Engine locally:"
    echo "   cd ../engine"
    echo "   python app.py"
    echo ""
    echo "🔗 For production, update REACT_APP_ENGINE_URL in .env to your ECS endpoint"
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
else
    echo "✅ Dependencies already installed"
fi

echo ""
echo "🎉 Math Engine connection setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Start the Math Engine backend (if not already running)"
echo "2. Update REACT_APP_ENGINE_URL in .env for production"
echo "3. Start the frontend: npm start"
echo ""
echo "🔗 Math Engine endpoints available:"
echo "   - Health: /health"
echo "   - Compute: /api/v1/compute"
echo "   - Work types: prime_pattern_discovery, riemann_zeros, yang_mills, etc."
