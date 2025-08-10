# 🔍 Correct Verification Settings for ProductiveMiner

## 📋 **Exact Deployment Settings Used**

Based on the `hardhat.config.js`, the contract was deployed with these settings:

```javascript
solidity: {
  version: "0.8.20",
  settings: {
    optimizer: {
      enabled: true,  // ← OPTIMIZATION WAS ENABLED
      runs: 200,
    },
    viaIR: true,      // ← VIA IR WAS ENABLED
  },
}
```

## ✅ **Correct Etherscan Verification Settings**

Use these **exact** settings on Etherscan:

### **Basic Settings**
- **Contract Address:** `0x151EcB946F8D6a6cBaC1F41443A1503c39ACAD3B`
- **Compiler Type:** Solidity (Single file)
- **Compiler Version:** `0.8.20+commit.a1b79de6`
- **Open Source License Type:** MIT License (MIT)

### **Advanced Settings**
- **Optimization:** `Yes` ← **This was the key issue!**
- **Runs:** `200`
- **Constructor Arguments:** `0000000000000000000000000000000000000000`

### **Additional Settings**
- **EVM Version:** `paris` (default)
- **Via IR:** `Yes` ← **Important!**

## 🔧 **Step-by-Step Verification**

1. **Go to:** https://sepolia.etherscan.io/verifyContract

2. **Enter Contract Details:**
   - Contract Address: `0x151EcB946F8D6a6cBaC1F41443A1503c39ACAD3B`
   - Compiler Type: Solidity (Single file)
   - Compiler Version: `0.8.20+commit.a1b79de6`
   - Open Source License Type: MIT License (MIT)

3. **Advanced Settings:**
   - ✅ **Optimization: Yes**
   - ✅ **Runs: 200**
   - ✅ **Via IR: Yes**
   - Constructor Arguments: `0000000000000000000000000000000000000000`

4. **Source Code:**
   - Copy the entire content from `contracts/ProductiveMiner.sol`
   - Paste it in the source code field

5. **Submit for verification**

## 🎯 **Why This Will Work**

The key differences from the previous attempts:
- ✅ **Optimization: Yes** (was "No" before)
- ✅ **Via IR: Yes** (was missing before)
- ✅ **Fixed variable shadowing** in the source code

## 📊 **Contract Information**

- **Address:** `0x151EcB946F8D6a6cBaC1F41443A1503c39ACAD3B`
- **Network:** Sepolia Testnet
- **Transaction:** `0xdf0e5b9e9389f0dd0f1a18ca13171a4bc6813ef801295a171067724bf10b1c8d`

## 🔗 **Useful Links**

- **Contract on Etherscan:** https://sepolia.etherscan.io/address/0x151EcB946F8D6a6cBaC1F41443A1503c39ACAD3B
- **Verification Page:** https://sepolia.etherscan.io/verifyContract

---

**These settings should match the deployed bytecode exactly!** 🚀
