-- Migration script to update existing ProductiveMiner database to optimal research schema
-- This script handles existing tables and adds new ones for optimal research data structure

-- =============================================================================
-- STEP 1: BACKUP EXISTING DATA (if needed)
-- =============================================================================

-- Create backup tables for existing data
CREATE TABLE IF NOT EXISTS discoveries_backup AS SELECT * FROM discoveries;
CREATE TABLE IF NOT EXISTS mining_sessions_backup AS SELECT * FROM mining_sessions;

-- =============================================================================
-- STEP 2: DROP EXISTING TABLES THAT NEED RESTRUCTURING
-- =============================================================================

-- Drop dependent tables first
DROP TABLE IF EXISTS mathematical_discoveries CASCADE;
DROP TABLE IF EXISTS research_papers CASCADE;
DROP TABLE IF EXISTS model_training_sessions CASCADE;

-- =============================================================================
-- STEP 3: CREATE NEW OPTIMAL TABLES
-- =============================================================================

-- Create mathematical_results table
CREATE TABLE IF NOT EXISTS mathematical_results (
    id SERIAL PRIMARY KEY,
    discovery_id VARCHAR(50),
    result_type VARCHAR(50) NOT NULL,
    result_data JSONB NOT NULL,
    verification_score DECIMAL(5,2),
    computational_steps BIGINT,
    convergence_rate DECIMAL(15,10),
    precision_bits INT,
    algorithm_used VARCHAR(100),
    zero_location_real DECIMAL(20,15),
    zero_location_imaginary DECIMAL(20,15),
    zero_location_precision INT,
    related_zeros JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create validations table
CREATE TABLE IF NOT EXISTS validations (
    id SERIAL PRIMARY KEY,
    discovery_id VARCHAR(50),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'validated', 'rejected')),
    consensus_count INT DEFAULT 0,
    required_consensus INT DEFAULT 3,
    validation_fee DECIMAL(18,8),
    validators JSONB, -- Array of validator addresses
    validation_time DECIMAL(10,3),
    security_enhancement DECIMAL(18,8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create discovery_tokenomics table
CREATE TABLE IF NOT EXISTS discovery_tokenomics (
    id SERIAL PRIMARY KEY,
    discovery_id VARCHAR(50),
    pow_reward DECIMAL(18,8),
    burn_amount DECIMAL(18,8),
    net_reward DECIMAL(18,8),
    research_value_multiplier DECIMAL(10,4),
    complexity_multiplier DECIMAL(18,8),
    significance_multiplier DECIMAL(18,8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create citations table
CREATE TABLE IF NOT EXISTS citations (
    id SERIAL PRIMARY KEY,
    discovery_id VARCHAR(50),
    citation_count INT DEFAULT 0,
    related_discoveries JSONB, -- Array of related discovery IDs
    cross_disciplinary_connections JSONB, -- Array of related work types
    impact_score DECIMAL(10,4),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create work_types table
CREATE TABLE IF NOT EXISTS work_types (
    work_type_id INT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    millennium_problem BOOLEAN DEFAULT false,
    base_reward DECIMAL(18,8),
    difficulty_multiplier DECIMAL(18,8),
    typical_complexity JSONB, -- Array of typical complexity values
    verification_method VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create network_metrics table
CREATE TABLE IF NOT EXISTS network_metrics (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP NOT NULL,
    active_miners INT,
    discoveries_per_hour DECIMAL(10,2),
    average_validation_time DECIMAL(10,3),
    bit_strength INT,
    security_enhancement_rate DECIMAL(10,6),
    total_research_value DECIMAL(18,8),
    total_burned_tokens DECIMAL(18,8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create research_quality table
CREATE TABLE IF NOT EXISTS research_quality (
    id SERIAL PRIMARY KEY,
    discovery_id VARCHAR(50),
    peer_review_status VARCHAR(20) DEFAULT 'pending' CHECK (peer_review_status IN ('pending', 'reviewed', 'accepted', 'rejected')),
    academic_validation BOOLEAN DEFAULT false,
    commercial_applications JSONB,
    reproducibility_score DECIMAL(5,2),
    academic_citations INT DEFAULT 0,
    commercial_usage_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- STEP 4: UPDATE EXISTING TABLES
-- =============================================================================

-- Update discoveries table to match optimal structure
ALTER TABLE discoveries 
ADD COLUMN IF NOT EXISTS discovery_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS work_type_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS problem_statement TEXT,
ADD COLUMN IF NOT EXISTS complexity INT CHECK (complexity BETWEEN 1 AND 10),
ADD COLUMN IF NOT EXISTS significance INT CHECK (significance BETWEEN 1 AND 3),
ADD COLUMN IF NOT EXISTS research_value DECIMAL(18,8),
ADD COLUMN IF NOT EXISTS computation_time DECIMAL(10,3),
ADD COLUMN IF NOT EXISTS energy_consumed DECIMAL(12,8),
ADD COLUMN IF NOT EXISTS is_collaborative BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_from_pow BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS novelty_score DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS algorithm_used VARCHAR(100),
ADD COLUMN IF NOT EXISTS transaction_hash VARCHAR(66),
ADD COLUMN IF NOT EXISTS contract_address VARCHAR(42),
ADD COLUMN IF NOT EXISTS network VARCHAR(20) DEFAULT 'sepolia';

-- Update mining_sessions table to match optimal structure
ALTER TABLE mining_sessions 
ADD COLUMN IF NOT EXISTS discovery_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS user_address VARCHAR(42),
ADD COLUMN IF NOT EXISTS session_id INT,
ADD COLUMN IF NOT EXISTS work_type INT,
ADD COLUMN IF NOT EXISTS target_hash VARCHAR(64),
ADD COLUMN IF NOT EXISTS complexity INT,
ADD COLUMN IF NOT EXISTS significance INT,
ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS auto_validation_requested BOOLEAN DEFAULT false;

-- =============================================================================
-- STEP 5: CREATE INDEXES
-- =============================================================================

-- Mathematical results indexes
CREATE INDEX IF NOT EXISTS idx_math_results_discovery ON mathematical_results(discovery_id);
CREATE INDEX IF NOT EXISTS idx_math_results_type ON mathematical_results(result_type);
CREATE INDEX IF NOT EXISTS idx_math_results_verification ON mathematical_results(verification_score);

-- Validation indexes
CREATE INDEX IF NOT EXISTS idx_validations_discovery ON validations(discovery_id);
CREATE INDEX IF NOT EXISTS idx_validations_status ON validations(status);

-- Tokenomics indexes
CREATE INDEX IF NOT EXISTS idx_tokenomics_discovery ON discovery_tokenomics(discovery_id);
CREATE INDEX IF NOT EXISTS idx_tokenomics_reward ON discovery_tokenomics(pow_reward);

-- Citations indexes
CREATE INDEX IF NOT EXISTS idx_citations_discovery ON citations(discovery_id);
CREATE INDEX IF NOT EXISTS idx_citations_impact ON citations(impact_score);

-- Work types indexes
CREATE INDEX IF NOT EXISTS idx_work_types_active ON work_types(is_active);
CREATE INDEX IF NOT EXISTS idx_work_types_millennium ON work_types(millennium_problem);

-- Network metrics indexes
CREATE INDEX IF NOT EXISTS idx_network_metrics_timestamp ON network_metrics(timestamp);

-- Research quality indexes
CREATE INDEX IF NOT EXISTS idx_research_quality_discovery ON research_quality(discovery_id);
CREATE INDEX IF NOT EXISTS idx_research_quality_peer_review ON research_quality(peer_review_status);

-- =============================================================================
-- STEP 6: ADD FOREIGN KEY CONSTRAINTS
-- =============================================================================

-- Add foreign key constraints after tables are created
ALTER TABLE mathematical_results 
ADD CONSTRAINT fk_math_results_discovery 
FOREIGN KEY (discovery_id) REFERENCES discoveries(discovery_id) ON DELETE CASCADE;

ALTER TABLE validations 
ADD CONSTRAINT fk_validations_discovery 
FOREIGN KEY (discovery_id) REFERENCES discoveries(discovery_id) ON DELETE CASCADE;

ALTER TABLE discovery_tokenomics 
ADD CONSTRAINT fk_tokenomics_discovery 
FOREIGN KEY (discovery_id) REFERENCES discoveries(discovery_id) ON DELETE CASCADE;

ALTER TABLE citations 
ADD CONSTRAINT fk_citations_discovery 
FOREIGN KEY (discovery_id) REFERENCES discoveries(discovery_id) ON DELETE CASCADE;

ALTER TABLE research_quality 
ADD CONSTRAINT fk_research_quality_discovery 
FOREIGN KEY (discovery_id) REFERENCES discoveries(discovery_id) ON DELETE CASCADE;

ALTER TABLE mining_sessions 
ADD CONSTRAINT fk_mining_sessions_discovery 
FOREIGN KEY (discovery_id) REFERENCES discoveries(discovery_id) ON DELETE SET NULL;

-- =============================================================================
-- STEP 7: INSERT SAMPLE WORK TYPES
-- =============================================================================

INSERT INTO work_types (work_type_id, name, description, millennium_problem, base_reward, difficulty_multiplier, typical_complexity, verification_method) VALUES
(0, 'riemann_zeta_function', 'Critical line zero computation for Riemann zeta function', true, 1000, 10000, '[6,7,8,9,10]', 'symbolic_computation'),
(1, 'mersenne_primes', 'Mersenne prime number discovery', false, 500, 5000, '[4,5,6,7,8]', 'primality_testing'),
(2, 'elliptic_curves', 'Elliptic curve discrete logarithm problem', false, 750, 7500, '[5,6,7,8,9]', 'point_multiplication'),
(3, 'lattice_problems', 'Lattice-based cryptography problems', false, 600, 6000, '[4,5,6,7,8]', 'lattice_reduction'),
(4, 'quantum_resistance', 'Post-quantum cryptography research', false, 800, 8000, '[6,7,8,9,10]', 'quantum_simulation')
ON CONFLICT (work_type_id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    millennium_problem = EXCLUDED.millennium_problem,
    base_reward = EXCLUDED.base_reward,
    difficulty_multiplier = EXCLUDED.difficulty_multiplier,
    typical_complexity = EXCLUDED.typical_complexity,
    verification_method = EXCLUDED.verification_method,
    updated_at = CURRENT_TIMESTAMP;

-- =============================================================================
-- STEP 8: CREATE VIEWS
-- =============================================================================

-- View for discovery summary with all related data
CREATE OR REPLACE VIEW discovery_summary AS
SELECT 
    d.discovery_id,
    d.timestamp,
    d.researcher_address,
    d.work_type_name,
    d.complexity,
    d.significance,
    d.research_value,
    d.validation_status,
    v.consensus_count,
    v.required_consensus,
    t.pow_reward,
    t.burn_amount,
    t.net_reward,
    c.citation_count,
    c.impact_score,
    rq.reproducibility_score,
    rq.academic_validation
FROM discoveries d
LEFT JOIN validations v ON d.discovery_id = v.discovery_id
LEFT JOIN discovery_tokenomics t ON d.discovery_id = t.discovery_id
LEFT JOIN citations c ON d.discovery_id = c.discovery_id
LEFT JOIN research_quality rq ON d.discovery_id = rq.discovery_id;

-- View for network health metrics
CREATE OR REPLACE VIEW network_health AS
SELECT 
    nm.timestamp,
    nm.active_miners,
    nm.discoveries_per_hour,
    nm.average_validation_time,
    nm.bit_strength,
    nm.security_enhancement_rate,
    nm.total_research_value,
    nm.total_burned_tokens,
    COUNT(d.discovery_id) as total_discoveries,
    AVG(d.research_value) as avg_research_value
FROM network_metrics nm
LEFT JOIN discoveries d ON DATE_TRUNC('hour', d.timestamp) = DATE_TRUNC('hour', nm.timestamp)
GROUP BY nm.id, nm.timestamp, nm.active_miners, nm.discoveries_per_hour, nm.average_validation_time, 
         nm.bit_strength, nm.security_enhancement_rate, nm.total_research_value, nm.total_burned_tokens;

-- =============================================================================
-- STEP 9: CLEANUP
-- =============================================================================

-- Drop backup tables if migration was successful
-- DROP TABLE IF EXISTS discoveries_backup;
-- DROP TABLE IF EXISTS mining_sessions_backup;

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================

-- Verify migration
SELECT 'Migration completed successfully!' as status;
SELECT COUNT(*) as work_types_count FROM work_types;
SELECT COUNT(*) as discoveries_count FROM discoveries;
