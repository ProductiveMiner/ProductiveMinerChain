-- Update Aurora Database with New MINED Token Contract Address
-- Generated on: 2025-08-18T20:52:46.651Z

-- Update existing contract record or insert new one
INSERT INTO contracts (address, name, network, created_at, updated_at) 
VALUES ('0x7877EFAb4aD3610792a135f6f8A241962fD2ab76', 'MINEDToken', 'sepolia', NOW(), NOW())
ON DUPLICATE KEY UPDATE 
    address = VALUES(address),
    updated_at = NOW();

-- Update any existing mining sessions with new contract
UPDATE mining_sessions 
SET contract_address = '0x7877EFAb4aD3610792a135f6f8A241962fD2ab76' 
WHERE contract_address IS NOT NULL;

-- Update any existing discoveries with new contract
UPDATE discoveries 
SET contract_address = '0x7877EFAb4aD3610792a135f6f8A241962fD2ab76' 
WHERE contract_address IS NOT NULL;

-- Update any existing staking records with new contract
UPDATE staking_records 
SET contract_address = '0x7877EFAb4aD3610792a135f6f8A241962fD2ab76' 
WHERE contract_address IS NOT NULL;

-- Update any existing validator records with new contract
UPDATE validators 
SET contract_address = '0x7877EFAb4aD3610792a135f6f8A241962fD2ab76' 
WHERE contract_address IS NOT NULL;

-- Update any existing research submissions with new contract
UPDATE research_submissions 
SET contract_address = '0x7877EFAb4aD3610792a135f6f8A241962fD2ab76' 
WHERE contract_address IS NOT NULL;

-- Update any existing token transfers with new contract
UPDATE token_transfers 
SET contract_address = '0x7877EFAb4aD3610792a135f6f8A241962fD2ab76' 
WHERE contract_address IS NOT NULL;

-- Update any existing pool balances with new contract
UPDATE pool_balances 
SET contract_address = '0x7877EFAb4aD3610792a135f6f8A241962fD2ab76' 
WHERE contract_address IS NOT NULL;

-- Update any existing asymptotic data with new contract
UPDATE asymptotic_data 
SET contract_address = '0x7877EFAb4aD3610792a135f6f8A241962fD2ab76' 
WHERE contract_address IS NOT NULL;

-- Update any existing security metrics with new contract
UPDATE security_metrics 
SET contract_address = '0x7877EFAb4aD3610792a135f6f8A241962fD2ab76' 
WHERE contract_address IS NOT NULL;

-- Update any existing mathematical complexity records with new contract
UPDATE mathematical_complexity 
SET contract_address = '0x7877EFAb4aD3610792a135f6f8A241962fD2ab76' 
WHERE contract_address IS NOT NULL;

-- Update any existing cross-chain transfers with new contract
UPDATE cross_chain_transfers 
SET contract_address = '0x7877EFAb4aD3610792a135f6f8A241962fD2ab76' 
WHERE contract_address IS NOT NULL;

-- Verify the update
SELECT 'Contract updated successfully' as status, 
       '0x7877EFAb4aD3610792a135f6f8A241962fD2ab76' as new_address, 
       NOW() as updated_at;
