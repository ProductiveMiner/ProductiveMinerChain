-- Enhanced Database Schema for ProductiveMiner v2
-- This schema supports blockchain, mathematical computations, and research features

-- Users table (enhanced)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'validator', 'researcher')),
    is_active BOOLEAN DEFAULT true,
    wallet_address VARCHAR(42) UNIQUE,
    public_key TEXT,
    private_key_encrypted TEXT,
    total_mining_sessions INTEGER DEFAULT 0,
    total_mining_time INTEGER DEFAULT 0,
    total_coins_earned DECIMAL(20,8) DEFAULT 0,
    staked_amount DECIMAL(20,8) DEFAULT 0,
    validator_score DECIMAL(10,4) DEFAULT 0,
    research_contributions INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Blockchain blocks table
CREATE TABLE IF NOT EXISTS blocks (
    id SERIAL PRIMARY KEY,
    block_number BIGINT UNIQUE NOT NULL,
    block_hash VARCHAR(66) UNIQUE NOT NULL,
    parent_hash VARCHAR(66) NOT NULL,
    miner_address VARCHAR(42),
    difficulty BIGINT NOT NULL,
    nonce BIGINT,
    timestamp TIMESTAMP NOT NULL,
    gas_limit BIGINT,
    gas_used BIGINT,
    transactions_count INTEGER DEFAULT 0,
    block_reward DECIMAL(20,8),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'orphaned')),
    auto_confirm_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    tx_hash VARCHAR(66) UNIQUE NOT NULL,
    block_number BIGINT REFERENCES blocks(block_number),
    from_address VARCHAR(42) NOT NULL,
    to_address VARCHAR(42),
    value DECIMAL(20,8) NOT NULL,
    gas_price BIGINT,
    gas_used BIGINT,
    nonce BIGINT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
    transaction_type VARCHAR(20) DEFAULT 'transfer' CHECK (transaction_type IN ('transfer', 'mining_reward', 'staking', 'unstaking', 'research_reward')),
    data TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Mining sessions (enhanced)
CREATE TABLE IF NOT EXISTS mining_sessions (
    id UUID PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    block_number BIGINT REFERENCES blocks(block_number),
    difficulty INTEGER NOT NULL CHECK (difficulty >= 1 AND difficulty <= 100),
    target VARCHAR(64) NOT NULL,
    nonce BIGINT,
    hash VARCHAR(64),
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    duration INTEGER, -- in seconds
    coins_earned DECIMAL(20,8) DEFAULT 0,
    mathematical_type VARCHAR(50),
    computation_complexity DECIMAL(10,4),
    research_value DECIMAL(10,4) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'stopped', 'failed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Mathematical discoveries table
CREATE TABLE IF NOT EXISTS mathematical_discoveries (
    id SERIAL PRIMARY KEY,
    session_id UUID REFERENCES mining_sessions(id),
    user_id INTEGER REFERENCES users(id),
    discovery_type VARCHAR(50) NOT NULL,
    problem_statement TEXT NOT NULL,
    solution_approach TEXT,
    partial_solution TEXT,
    accuracy_percentage DECIMAL(5,2),
    research_value DECIMAL(10,4),
    publication_status VARCHAR(20) DEFAULT 'private' CHECK (publication_status IN ('private', 'public', 'peer_reviewed')),
    verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
    verified_by INTEGER REFERENCES users(id),
    verification_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Research repository table
CREATE TABLE IF NOT EXISTS research_papers (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    abstract TEXT,
    content TEXT,
    author_id INTEGER REFERENCES users(id),
    co_authors TEXT[], -- Array of user IDs
    mathematical_type VARCHAR(50),
    difficulty_level INTEGER,
    research_value DECIMAL(10,4),
    citation_count INTEGER DEFAULT 0,
    publication_date TIMESTAMP,
    access_tier VARCHAR(20) DEFAULT 'basic' CHECK (access_tier IN ('basic', 'premium', 'enterprise')),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Validators table
CREATE TABLE IF NOT EXISTS validators (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(id),
    validator_address VARCHAR(42) UNIQUE NOT NULL,
    stake_amount DECIMAL(20,8) NOT NULL,
    commission_rate DECIMAL(5,4) DEFAULT 0.05,
    total_rewards DECIMAL(20,8) DEFAULT 0,
    uptime_percentage DECIMAL(5,2) DEFAULT 0,
    performance_score DECIMAL(10,4) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_validated_at TIMESTAMP
);

-- Staking table
CREATE TABLE IF NOT EXISTS staking (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    validator_id INTEGER REFERENCES validators(id),
    stake_amount DECIMAL(20,8) NOT NULL,
    reward_rate DECIMAL(10,8),
    staking_period INTEGER, -- in days
    start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    total_rewards DECIMAL(20,8) DEFAULT 0
);

-- ML models table
CREATE TABLE IF NOT EXISTS ml_models (
    id SERIAL PRIMARY KEY,
    model_name VARCHAR(100) NOT NULL,
    model_type VARCHAR(50) NOT NULL,
    mathematical_type VARCHAR(50),
    model_version VARCHAR(20),
    model_path TEXT,
    accuracy DECIMAL(5,2),
    training_data_size INTEGER,
    last_trained_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Model training sessions
CREATE TABLE IF NOT EXISTS model_training_sessions (
    id SERIAL PRIMARY KEY,
    model_id INTEGER REFERENCES ml_models(id),
    user_id INTEGER REFERENCES users(id),
    training_data_size INTEGER,
    epochs INTEGER,
    learning_rate DECIMAL(10,8),
    final_accuracy DECIMAL(5,2),
    training_duration INTEGER, -- in seconds
    status VARCHAR(20) DEFAULT 'training' CHECK (status IN ('training', 'completed', 'failed')),
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Tokenomics table
CREATE TABLE IF NOT EXISTS tokenomics (
    id SERIAL PRIMARY KEY,
    total_supply DECIMAL(20,8) NOT NULL,
    circulating_supply DECIMAL(20,8) NOT NULL,
    staked_supply DECIMAL(20,8) DEFAULT 0,
    burned_supply DECIMAL(20,8) DEFAULT 0,
    emission_rate DECIMAL(20,8),
    burn_rate DECIMAL(5,4),
    staking_apy DECIMAL(5,4),
    block_reward DECIMAL(20,8),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- System metrics table
CREATE TABLE IF NOT EXISTS system_metrics (
    id SERIAL PRIMARY KEY,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(20,8),
    metric_unit VARCHAR(20),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_blocks_number ON blocks(block_number);
CREATE INDEX IF NOT EXISTS idx_blocks_hash ON blocks(block_hash);
CREATE INDEX IF NOT EXISTS idx_transactions_hash ON transactions(tx_hash);
CREATE INDEX IF NOT EXISTS idx_transactions_from ON transactions(from_address);
CREATE INDEX IF NOT EXISTS idx_transactions_to ON transactions(to_address);
CREATE INDEX IF NOT EXISTS idx_mining_sessions_user ON mining_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_mining_sessions_type ON mining_sessions(mathematical_type);
CREATE INDEX IF NOT EXISTS idx_discoveries_type ON mathematical_discoveries(discovery_type);
CREATE INDEX IF NOT EXISTS idx_discoveries_user ON mathematical_discoveries(user_id);
CREATE INDEX IF NOT EXISTS idx_validators_address ON validators(validator_address);
CREATE INDEX IF NOT EXISTS idx_staking_user ON staking(user_id);
CREATE INDEX IF NOT EXISTS idx_ml_models_type ON ml_models(mathematical_type);

-- Create functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mining_sessions_updated_at BEFORE UPDATE ON mining_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_discoveries_updated_at BEFORE UPDATE ON mathematical_discoveries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_papers_updated_at BEFORE UPDATE ON research_papers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- MINED Token Contract
INSERT INTO contracts (address, name, network, created_at) VALUES ('0x7877EFAb4aD3610792a135f6f8A241962fD2ab76', 'MINEDToken', 'sepolia', NOW());
