#!/bin/bash

echo "🚀 Starting ProductiveMiner Continuous Mining"
echo "=============================================="

# Start continuous mining
echo "📡 Starting continuous mining..."
curl -X POST https://api.productiveminer.org/api/mining/continuous \
  -H "Content-Type: application/json" \
  -H "x-user-id: 1" \
  -H "x-wallet-address: 0x0000000000000000000000000000000000000001"

echo ""
echo "⏳ Waiting 10 seconds for mining to start..."
sleep 10

# Check mining status
echo "📊 Checking mining status..."
curl -s https://api.productiveminer.org/api/mining/continuous/status | jq .

echo ""
echo "🔍 Checking for blocks..."
sleep 5
curl -s https://api.productiveminer.org/api/explorer/blocks | jq '.blocks | length'

echo ""
echo "💰 Checking MINED token data..."
sleep 5
curl -s https://api.productiveminer.org/api/token/data | jq '.data.realMiningData'

echo ""
echo "✅ Continuous mining started!"
echo "🌐 Check your website at: https://productiveminer.org"
echo "📊 Monitor mining at: https://productiveminer.org/mining"
echo "🔍 View blocks at: https://productiveminer.org/explorer"
echo ""
echo "To stop mining, run: curl -X POST https://api.productiveminer.org/api/mining/continuous/stop"
