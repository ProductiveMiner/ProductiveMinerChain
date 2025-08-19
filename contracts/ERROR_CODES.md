# Error Code Mapping

This document maps the error codes used in the optimized `MINEDTokenStandalone.sol` contract to their meanings.

## Error Codes

| Code | Meaning | Function |
|------|---------|----------|
| E1 | Too many validators | `_initializeValidators()` |
| E2 | Insufficient staking pool | `_initializeValidators()` |
| E3 | Invalid work type | `submitDiscovery()` |
| E4 | Work type inactive | `submitDiscovery()` |
| E5 | Complexity must be non-zero | `submitDiscovery()` |
| E6 | Complexity too high | `submitDiscovery()` |
| E7 | Significance must be non-zero | `submitDiscovery()` |
| E8 | Significance too high | `submitDiscovery()` |
| E9 | Research value must be non-zero | `submitDiscovery()` |
| E10 | Discovery not found | `requestValidation()` |
| E11 | Fee too low | `requestValidation()` |
| E12 | Insufficient stake | `requestValidation()` |
| E13 | Not a validator | `validateDiscovery()` |
| E14 | Already validated | `validateDiscovery()` |
| E15 | Validation completed | `validateDiscovery()` |
| E16 | Amount must be non-zero | `stake()` |
| E17 | Insufficient balance | `stake()` |
| E18 | Amount must be non-zero | `unstake()` |
| E19 | Insufficient stake | `unstake()` |
| E20 | No rewards to claim | `claimStakingRewards()` |
| E21 | Invalid work type | `startMiningSession()` |
| E22 | Work type inactive | `startMiningSession()` |
| E23 | Invalid difficulty | `startMiningSession()` |
| E24 | Not the miner | `_submitPoWResultInternal()` |
| E25 | Session completed | `_submitPoWResultInternal()` |
| E26 | Session not started | `_submitPoWResultInternal()` |
| E27 | Invalid nonce | `_submitPoWResultInternal()` |
| E28 | Nonce too low | `_submitPoWResultInternal()` |
| E29 | Invalid hash | `_verifyPoWResult()` |
| E30 | Difficulty not met | `_verifyPoWResult()` |
| E31 | Invalid PoW result | `_autoRequestValidation()` |
| E32 | Discovery not found | `_requestValidationInternal()` |

## Usage

When a transaction reverts with one of these error codes, refer to this mapping to understand what went wrong. For example:

```solidity
// If you get error "E3", it means "Invalid work type" in submitDiscovery()
// This happens when workType > MAX_WORK_TYPE (24)
```

## Benefits of Error Codes

1. **Size Reduction**: Short error codes save significant bytecode space
2. **Gas Efficiency**: Shorter revert strings cost less gas
3. **Maintainability**: Centralized error mapping for easy reference
4. **Deployment**: Enables mainnet deployment by staying under 24KB limit

## Error Handling Best Practices

1. Always check the error code first
2. Refer to this mapping for the specific issue
3. Validate inputs before calling functions
4. Check contract state before operations
5. Ensure sufficient balances and permissions
