// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

library MINEDTokenLib {
    // Work type initialization
    function initWorkType(
        mapping(uint8 => WorkTypeInfo) storage workTypes,
        uint8 workTypeId,
        uint256 difficultyMultiplier,
        uint256 baseReward
    ) internal {
        WorkTypeInfo storage workType = workTypes[workTypeId];
        workType.difficultyMultiplier = uint16(difficultyMultiplier);
        workType.baseReward = baseReward;
        workType.isActive = true;
    }
    
    // Security calculations
    function calculateBitStrength(
        uint256 baseBitStrength,
        uint256 totalMathematicalComplexity,
        uint256 networkHealth,
        uint256 scalingRate
    ) internal pure returns (uint256) {
        uint256 mathematicalComplexity = totalMathematicalComplexity / 1000;
        uint256 currentBitStrength = baseBitStrength + mathematicalComplexity;
        uint256 scalingFactor = (scalingRate * networkHealth) / (100 * 100);
        if (scalingFactor < 100) scalingFactor = 100;
        uint256 adaptiveScaling = (currentBitStrength * scalingFactor) / 100;
        return adaptiveScaling < baseBitStrength ? baseBitStrength : adaptiveScaling;
    }
    
    // Reward calculations
    function calculatePoWReward(
        uint256 baseReward,
        uint256 complexityMultiplier,
        uint256 significanceMultiplier,
        uint256 scalingRate,
        uint256 bitStrength,
        uint256 discoveryChainSecurity,
        uint256 networkHealth
    ) internal pure returns (uint256) {
        uint256 baseRewardWithScaling = (baseReward * complexityMultiplier * significanceMultiplier * scalingRate) / (100 * 100 * 100);
        uint256 securityBonus = (baseRewardWithScaling * bitStrength) / (256 * 100);
        uint256 chainBonus = (baseRewardWithScaling * discoveryChainSecurity) / (1000 * 100);
        uint256 healthBonus = (baseRewardWithScaling * networkHealth) / 500;
        return baseRewardWithScaling + securityBonus + chainBonus + healthBonus;
    }
}

struct WorkTypeInfo {
    uint16 difficultyMultiplier;
    uint256 baseReward;
    bool isActive;
}
