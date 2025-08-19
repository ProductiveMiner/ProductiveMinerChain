# 🏗️ ProductiveMiner ERC Contract Documentation

## 📋 Overview

This document provides a comprehensive mapping of all ERC contract locations, ABI files, and deployment addresses across the ProductiveMiner.org ecosystem. This serves as the definitive reference for future deployments and contract management.

**Last Updated:** January 2025  
**Project:** ProductiveMiner.v2  
**Production URL:** https://productiveminer.org

---

## 🎯 Current Production Contracts

### Primary MINED Token Contract (ERC20)
- **Contract Name:** `MINEDTokenStandalone`
- **Address:** `0x016A5B5617D26b93Ec6fB8DB2DC1BA79DefB088e`
- **Network:** Sepolia Testnet (Chain ID: 11155111)
- **Etherscan:** https://sepolia.etherscan.io/address/0x016A5B5617D26b93Ec6fB8DB2DC1BA79DefB088e#code
- **Status:** ✅ Verified and Active

### ProductiveMiner Integration Contract
- **Contract Name:** `ProductiveMinerSecure`
- **Address:** `0x305a5217D8e4f2d8C02e0345da739713EF386068`
- **Network:** Sepolia Testnet (Chain ID: 11155111)
- **Etherscan:** https://sepolia.etherscan.io/address/0x305a5217D8e4f2d8C02e0345da739713EF386068
- **Status:** ✅ Verified and Active

### Legacy MINED Token Contract
- **Contract Name:** `MINEDTokenStandalone` (Legacy)
- **Address:** `0x08498d4a6Db9f2f97196c89Bf4B26f13Add16316`
- **Network:** Sepolia Testnet (Chain ID: 11155111)
- **Etherscan:** https://sepolia.etherscan.io/address/0x08498d4a6Db9f2f97196c89Bf4B26f13Add16316
- **Status:** ⚠️ Deprecated (Replaced by primary contract)

---

## 📁 Contract Source Files

### Primary Contract Sources
```
contracts/contracts/
├── MINEDTokenStandalone.sol          # Main ERC20 token contract (851 lines)
├── MINEDTokenAsymptotic.sol          # Asymptotic emission variant (480 lines)
└── ProductiveMinerSecure.sol         # Mining integration contract
```

### Flattened Contract Files (For Verification)
```
contracts/
├── MINEDTokenStandalone_flattened_clean.sol
├── MINEDTokenStandalone_VERIFICATION_READY.sol
└── MINEDTokenStandalone_flattened_runs200_clean.sol
```

---

## 🔧 ABI File Locations

### Backend ABI Files
```
backend/src/contracts/
├── MINEDTokenStandalone.json         # Primary token ABI (84KB, 1587 lines)
├── MINEDTokenAsymptotic.json         # Asymptotic variant ABI (65KB, 1413 lines)
├── MINEDTokenFixed.json              # Fixed version ABI (57KB, 1250 lines)
├── MINEDTokenAsymptoticEnhanced.json # Enhanced variant ABI (58KB, 1226 lines)
├── ProductiveMinerFixed.json         # Fixed mining contract ABI (67KB, 991 lines)
├── ProductiveMinerAsymptotic.json    # Asymptotic mining ABI (61KB, 1017 lines)
└── ProductiveMinerSecure.json        # Secure mining contract ABI (20KB, 926 lines)
```

### Frontend ABI Files
```
frontend/src/contracts/
├── MINEDTokenStandalone.json         # Primary token ABI (84KB, 1587 lines)
├── MINEDTokenAsymptotic.json         # Asymptotic variant ABI (65KB, 1413 lines)
├── MINEDTokenFixed.json              # Fixed version ABI (57KB, 1250 lines)
├── MINEDTokenAsymptoticEnhanced.json # Enhanced variant ABI (57KB, 1213 lines)
├── ProductiveMiner.json              # Base mining contract ABI (53KB, 873 lines)
├── ProductiveMinerFixed.json         # Fixed mining contract ABI (67KB, 991 lines)
├── ProductiveMinerAsymptotic.json    # Asymptotic mining ABI (61KB, 1017 lines)
└── ProductiveMinerSecure.json        # Secure mining contract ABI (20KB, 926 lines)
```

### Hardhat Artifacts
```
contracts/artifacts/contracts/
├── MINEDTokenStandalone.sol/
│   ├── MINEDTokenStandalone.json     # Compiled ABI (84KB, 1587 lines)
│   └── MINEDTokenStandalone.dbg.json # Debug info (105B, 5 lines)
└── MINEDTokenAsymptotic.sol/
    ├── OptimizedMINEDToken.json      # Compiled ABI (72KB, 1334 lines)
    └── OptimizedMINEDToken.dbg.json  # Debug info (105B, 5 lines)
```

---

## ⚙️ Configuration Files

### Backend Configuration
```
backend/src/config/
└── contract.js                       # Contract configuration with addresses
```

### Frontend Configuration
```
frontend/src/config/
├── contracts.js                      # Main contract configuration
├── mined-token-config.js             # MINED token specific config
└── api.js                           # API configuration with contract addresses
```

### Environment Configuration
```
├── docker.env                        # Docker environment variables
├── docker.env.bak                    # Backup environment file
├── docker.env.backup.1755252830      # Timestamped backup
├── new-rds-config.env                # RDS configuration
└── env.example                       # Environment template
```

---

## 🔗 Contract Address References

### Primary MINED Token Address (`0x016A5B5617D26b93Ec6fB8DB2DC1BA79DefB088e`)

**Backend References:**
- `backend/src/config/contract.js` (Line 3)
- `backend/src/routes/explorer.js` (Line 13)
- `backend/src/routes/contract.js` (Lines 19-20)
- `backend/src/services/contractService.js` (Lines 8-9)

**Frontend References:**
- `frontend/src/config/contracts.js` (Lines 40, 64)
- `frontend/src/config/mined-token-config.js` (Line 14)
- `frontend/src/config/api.js` (Line 70)
- `frontend/src/pages/Research.js` (Lines 124, 214)

**Environment Files:**
- `docker.env` (Lines 26, 70)
- `docker.env.bak` (Lines 26, 70)
- `docker.env.backup.1755252830` (Lines 26, 70)
- `new-rds-config.env` (Line 11)
- `create-new-rds.sh` (Line 231)

**Deployment Files:**
- `task-def-37.json` (Line 39)
- `new-task-def.json` (Line 37)
- `verify-deployment.sh` (Lines 172, 174)
- `populate-database.js` (Line 14)
- `database/reset-database.sh` (Lines 173, 238, 256, 295)
- `contracts/comprehensive-research-tracker.js` (Line 529)
- `contracts/optimal-json-structure.json` (Line 11)

### ProductiveMiner Contract Address (`0x305a5217D8e4f2d8C02e0345da739713EF386068`)

**Deployment Records:**
- `contracts/ProductiveMinerSecure-MINED-Integration-sepolia.json` (Line 4, 20)

### Legacy MINED Token Address (`0x08498d4a6Db9f2f97196c89Bf4B26f13Add16316`)

**Deployment Records:**
- `contracts/ProductiveMinerSecure-MINED-Integration-sepolia.json` (Line 5, 21)

---

## 🚀 Deployment Information

### Current Production Deployment
- **Network:** Sepolia Testnet
- **Chain ID:** 11155111
- **RPC URL:** https://sepolia.infura.io/v3/3f2349b3beef4a0f86c7a8596fef5c00
- **Explorer:** https://sepolia.etherscan.io
- **Deployer:** `0x9bEb6D047aB5126bF20D9BD0940e022628276ab4`

### Contract Features
- **Token Standard:** ERC20
- **Initial Supply:** 1,000,000,000 MINED tokens
- **Decimals:** 18
- **Features:** Hybrid PoW/PoS, Asymptotic Emission, Research Rewards
- **Multi-Chain Ready:** Yes (L2 compatibility hooks)

---

## 📊 Contract Variants

### MINED Token Variants
1. **MINEDTokenStandalone** (Primary) - Full-featured ERC20 with mining integration
2. **MINEDTokenAsymptotic** - Asymptotic emission model variant
3. **MINEDTokenFixed** - Fixed supply variant
4. **MINEDTokenAsymptoticEnhanced** - Enhanced asymptotic features

### ProductiveMiner Variants
1. **ProductiveMinerSecure** (Primary) - Secure mining integration
2. **ProductiveMinerFixed** - Fixed mining contract
3. **ProductiveMinerAsymptotic** - Asymptotic mining model
4. **ProductiveMiner** - Base mining contract

---

## 🔄 Future Deployment Checklist

### Pre-Deployment
- [ ] Update contract addresses in all configuration files
- [ ] Update ABI files in both frontend and backend
- [ ] Update environment variables
- [ ] Update deployment scripts
- [ ] Update database seed data
- [ ] Update verification scripts

### Post-Deployment
- [ ] Verify contracts on Etherscan
- [ ] Update this documentation
- [ ] Test all integrations
- [ ] Update production environment
- [ ] Monitor contract interactions

---

## 📝 Notes

1. **Primary Contract:** `MINEDTokenStandalone` at `0x016A5B5617D26b93Ec6fB8DB2DC1BA79DefB088e` is the main production contract
2. **ABI Synchronization:** Frontend and backend ABI files should be kept in sync
3. **Environment Variables:** Multiple environment files contain contract addresses - update all when deploying
4. **Legacy Contracts:** Previous deployments are maintained for reference but not actively used
5. **Multi-Chain Ready:** Contracts include hooks for future multi-chain integration

---

## 🆘 Troubleshooting

### Common Issues
1. **ABI Mismatch:** Ensure frontend and backend ABI files are identical
2. **Address Mismatch:** Check all configuration files for correct contract addresses
3. **Network Issues:** Verify RPC URLs and network configurations
4. **Environment Variables:** Ensure all environment files are updated

### Verification Commands
```bash
# Check contract verification
npx hardhat verify --network sepolia 0x016A5B5617D26b93Ec6fB8DB2DC1BA79DefB088e

# Validate ABI files
diff backend/src/contracts/MINEDTokenStandalone.json frontend/src/contracts/MINEDTokenStandalone.json

# Check environment consistency
grep -r "0x016A5B5617D26b93Ec6fB8DB2DC1BA79DefB088e" .
```

---

**Document Version:** 1.0  
**Maintained By:** ProductiveMiner Development Team  
**Last Review:** January 2025
