# MINED Token Deployment Guide

## Overview
This guide will help you deploy the MINED ERC20 token to Sepolia and update your backend configuration.

## Prerequisites
1. **Private Key**: You need a wallet with Sepolia ETH for gas fees
2. **Node.js**: Make sure you have Node.js installed
3. **Dependencies**: Install the required packages

## Step 1: Install Dependencies
```bash
cd contracts
npm install
```

## Step 2: Set Up Environment
Create a `.env` file in the contracts directory with your private key:

```bash
# Copy the environment template
cp env-setup.txt .env

# Edit the .env file and add your private key
# Replace 'your_private_key_here' with your actual private key (without 0x prefix)
PRIVATE_KEY=your_actual_private_key_here
```

## Step 3: Deploy MINED Token
Run the deployment script:

```bash
npx hardhat run deploy-mined-simple.js --network sepolia
```

This script will:
- Deploy the MINED token to Sepolia
- Automatically update the backend configuration
- Save deployment information to `mined-token-deployment.json`

## Step 4: Redeploy Backend
After the token is deployed, redeploy your backend to use the new token address:

```bash
cd ..
./deploy-backend-ecs.sh
```

## Step 5: Verify Deployment
Check that the token is working:

```bash
# Test the token data endpoint
curl -s https://api.productiveminer.org/api/token/data | jq .
```

## Expected Results
After deployment, you should see:
- ✅ MINED token deployed to a new address
- ✅ Backend configuration updated automatically
- ✅ Token data endpoint returning real token information
- ✅ No more "null" values in token data

## Troubleshooting

### If deployment fails:
1. **Check your private key**: Make sure it's correct and has Sepolia ETH
2. **Check network connection**: Ensure you can connect to Sepolia
3. **Check gas fees**: Make sure you have enough ETH for deployment

### If backend still shows null values:
1. **Wait for deployment**: The backend deployment takes a few minutes
2. **Check the new token address**: Verify it's correct in the backend config
3. **Test the token contract**: Make sure it's deployed and accessible

## Contract Information
- **Token Name**: MINED
- **Token Symbol**: MINED
- **Decimals**: 18
- **Total Supply**: 1,000,000,000 MINED
- **Network**: Sepolia Testnet

## Next Steps
After successful deployment:
1. Test token transfers
2. Integrate with your frontend
3. Set up liquidity pools
4. Verify contracts on Etherscan
