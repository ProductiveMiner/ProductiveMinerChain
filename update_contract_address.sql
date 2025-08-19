-- Update contract address in database
UPDATE contract_configurations 
SET contract_address = '0xf7b687854bA99B4Acafa509Fc42105B2a21369A7' 
WHERE contract_address != '0xf7b687854bA99B4Acafa509Fc42105B2a21369A7';

-- Update any other tables that reference the old contract address
UPDATE discoveries 
SET contract_address = '0xf7b687854bA99B4Acafa509Fc42105B2a21369A7' 
WHERE contract_address != '0xf7b687854bA99B4Acafa509Fc42105B2a21369A7';

UPDATE mining_sessions 
SET contract_address = '0xf7b687854bA99B4Acafa509Fc42105B2a21369A7' 
WHERE contract_address != '0xf7b687854bA99B4Acafa509Fc42105B2a21369A7';

UPDATE pow_results 
SET contract_address = '0xf7b687854bA99B4Acafa509Fc42105B2a21369A7' 
WHERE contract_address != '0xf7b687854bA99B4Acafa509Fc42105B2a21369A7';

UPDATE validators 
SET contract_address = '0xf7b687854bA99B4Acafa509Fc42105B2a21369A7' 
WHERE contract_address != '0xf7b687854bA99B4Acafa509Fc42105B2a21369A7';

-- Insert new contract configuration if it doesn't exist
INSERT INTO contract_configurations (contract_address, network, version, deployed_at, status)
VALUES ('0xf7b687854bA99B4Acafa509Fc42105B2a21369A7', 'sepolia', '2.0', NOW(), 'active')
ON CONFLICT (contract_address) DO UPDATE SET
    version = '2.0',
    status = 'active',
    updated_at = NOW();

-- Verify the update
SELECT 'Contract address updated successfully' as status;
SELECT contract_address, version, status FROM contract_configurations WHERE contract_address = '0xf7b687854bA99B4Acafa509Fc42105B2a21369A7';
