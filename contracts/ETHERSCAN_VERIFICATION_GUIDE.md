# 🔍 ETHERSCAN VERIFICATION GUIDE - FIXED SETTINGS

## 🚨 PROBLEM SOLVED
Your contract verification was failing because of **incorrect compiler settings**. The deployed contract uses different settings than your current hardhat config.

## ✅ CORRECT SETTINGS (MATCHES DEPLOYED CONTRACT)

### Compiler Configuration
- **Compiler Type**: `Solidity (Single file)`
- **Compiler Version**: `v0.8.30+commit.a1b79de6`
- **Open Source License Type**: `MIT License (MIT)`

### Optimization Settings
- **Optimization**: `Yes` ✅
- **Runs**: `200` ✅ (NOT 1)
- **Via IR**: `No` ✅ (NOT Yes)

### Contract Information
- **Contract Name**: `OptimizedMINEDToken`
- **Constructor Arguments**: `0000000000000000000000009beb6d047ab5126bf20d9bd0940e022628276ab4`

## 📋 STEP-BY-STEP VERIFICATION PROCESS

### Step 1: Go to Etherscan
1. Navigate to: https://sepolia.etherscan.io/address/0x78916EB89CDB2Ef32758fCc41f3aef3FDf052ab3
2. Click on the **"Contract"** tab
3. Click **"Verify and Publish"**

### Step 2: Select Compiler Type
- Choose: **"Solidity (Single file)"**

### Step 3: Enter Compiler Settings
```
Compiler Version: v0.8.30+commit.a1b79de6
Open Source License Type: MIT License (MIT)
Optimization: Yes
Runs: 200
Via IR: No
```

### Step 4: Enter Contract Information
```
Contract Name: OptimizedMINEDToken
Constructor Arguments: 0000000000000000000000009beb6d047ab5126bf20d9bd0940e022628276ab4
```

### Step 5: Upload Source Code
1. Open the file: `MINEDTokenStandalone_flattened_runs200_clean.sol`
2. Select ALL content: `Ctrl+A` (Windows) or `Cmd+A` (Mac)
3. Copy: `Ctrl+C` (Windows) or `Cmd+C` (Mac)
4. Paste into the "Contract Source Code" field

### Step 6: Verify
- Click **"Verify and Publish"**
- Wait for verification to complete

## 🔧 ALTERNATIVE: HARDHAT VERIFICATION

If you prefer using hardhat-etherscan plugin:

### Step 1: Install Plugin
```bash
npm install --save-dev @nomicfoundation/hardhat-etherscan
```

### Step 2: Use Correct Config
Use the `hardhat-verify.config.js` file I created with:
- `viaIR: false`
- `runs: 200`

### Step 3: Run Verification
```bash
npx hardhat verify --config hardhat-verify.config.js 0x78916EB89CDB2Ef32758fCc41f3aef3FDf052ab3 0x9beb6d047ab5126bf20d9bd0940e022628276ab4
```

## 🚫 WHY PREVIOUS ATTEMPTS FAILED

### ❌ Wrong Settings Used:
- **Runs**: `1` (should be `200`)
- **Via IR**: `Yes` (should be `No`)
- **Import statements**: Not flattened (should be flattened)

### ✅ Correct Settings:
- **Runs**: `200` - More optimization runs
- **Via IR**: `No` - Standard compilation path
- **Source**: Flattened file with no imports

## 🎯 SUCCESS INDICATORS

After successful verification:
- ✅ Source code is visible on Etherscan
- ✅ "Write Contract" tab shows all functions
- ✅ "Events" tab shows contract events
- ✅ No bytecode mismatch errors
- ✅ No parser errors

## 📁 FILES NEEDED

1. **Source File**: `MINEDTokenStandalone_flattened_runs200_clean.sol`
2. **Config File**: `hardhat-verify.config.js` (for hardhat method)
3. **Constructor Args**: `0000000000000000000000009beb6d047ab5126bf20d9bd0940e022628276ab4`

## 🔍 VERIFICATION CHECKLIST

- [ ] Compiler Type: Solidity (Single file)
- [ ] Compiler Version: `v0.8.30+commit.a1b79de6`
- [ ] License: MIT License (MIT)
- [ ] Optimization: Yes
- [ ] Runs: 200
- [ ] Via IR: No
- [ ] Contract Name: `OptimizedMINEDToken`
- [ ] Constructor Args: `0000000000000000000000009beb6d047ab5126bf20d9bd0940e022628276ab4`
- [ ] Source File: `MINEDTokenStandalone_flattened_runs200_clean.sol`

---

**Status**: ✅ READY FOR VERIFICATION WITH CORRECT SETTINGS
