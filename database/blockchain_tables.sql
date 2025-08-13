-- Blockchain-related tables for ProductiveMiner

-- Table for storing discoveries from blockchain
CREATE TABLE IF NOT EXISTS discoveries (
    id VARCHAR(255) PRIMARY KEY,
    miner_address VARCHAR(42) NOT NULL,
    work_type VARCHAR(100) NOT NULL,
    difficulty BIGINT NOT NULL,
    reward BIGINT NOT NULL,
    computational_complexity BIGINT DEFAULT 0,
    tx_hash VARCHAR(66) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_miner_address (miner_address),
    INDEX idx_work_type (work_type),
    INDEX idx_tx_hash (tx_hash)
);

-- Table for storing mining sessions from blockchain
CREATE TABLE IF NOT EXISTS mining_sessions (
    id VARCHAR(255) PRIMARY KEY,
    miner_address VARCHAR(42) NOT NULL,
    work_type VARCHAR(100) NOT NULL,
    difficulty BIGINT NOT NULL,
    quantum_security_level BIGINT DEFAULT 256,
    tx_hash VARCHAR(66) NOT NULL,
    status ENUM('active', 'completed', 'failed') DEFAULT 'active',
    reward BIGINT DEFAULT 0,
    computational_power BIGINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_miner_address (miner_address),
    INDEX idx_status (status),
    INDEX idx_tx_hash (tx_hash)
);

-- Table for storing blockchain transactions
CREATE TABLE IF NOT EXISTS blockchain_transactions (
    tx_hash VARCHAR(66) PRIMARY KEY,
    block_number BIGINT,
    from_address VARCHAR(42) NOT NULL,
    to_address VARCHAR(42) NOT NULL,
    contract_address VARCHAR(42),
    method_name VARCHAR(100),
    gas_used BIGINT,
    gas_price BIGINT,
    status ENUM('pending', 'confirmed', 'failed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP NULL,
    INDEX idx_from_address (from_address),
    INDEX idx_to_address (to_address),
    INDEX idx_contract_address (contract_address),
    INDEX idx_status (status)
);
