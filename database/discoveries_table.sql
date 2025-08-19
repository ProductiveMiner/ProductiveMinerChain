-- Discoveries table for blockchain events
-- This table stores discoveries from smart contract events

CREATE TABLE IF NOT EXISTS discoveries (
    id VARCHAR(50) PRIMARY KEY, -- discoveryId from contract
    miner_address VARCHAR(42) NOT NULL,
    work_type VARCHAR(100) NOT NULL,
    difficulty VARCHAR(20) NOT NULL,
    reward VARCHAR(50) DEFAULT '0',
    computational_complexity VARCHAR(20) DEFAULT '0',
    tx_hash VARCHAR(66) NOT NULL,
    research_value VARCHAR(50) DEFAULT '0',
    complexity VARCHAR(20) DEFAULT '0',
    significance VARCHAR(20) DEFAULT '0',
    is_from_pow BOOLEAN DEFAULT false,
    is_validated BOOLEAN DEFAULT false,
    validation_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_discoveries_miner ON discoveries(miner_address);
CREATE INDEX IF NOT EXISTS idx_discoveries_work_type ON discoveries(work_type);
CREATE INDEX IF NOT EXISTS idx_discoveries_tx_hash ON discoveries(tx_hash);
CREATE INDEX IF NOT EXISTS idx_discoveries_created_at ON discoveries(created_at);
CREATE INDEX IF NOT EXISTS idx_discoveries_is_from_pow ON discoveries(is_from_pow);

-- Update trigger
CREATE OR REPLACE FUNCTION update_discoveries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_discoveries_updated_at 
    BEFORE UPDATE ON discoveries 
    FOR EACH ROW 
    EXECUTE FUNCTION update_discoveries_updated_at();
