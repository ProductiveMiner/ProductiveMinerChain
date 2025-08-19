-- Optimal Database Schema for ProductiveMiner Research Data
-- Based on mathematical discovery framework and blockchain integration

-- =============================================================================
-- CORE DISCOVERY TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS discoveries (
    discovery_id VARCHAR(50) PRIMARY KEY,
    block_height BIGINT NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    researcher_address VARCHAR(42) NOT NULL,
    work_type_id INT NOT NULL,
    work_type_name VARCHAR(100) NOT NULL,
    problem_statement TEXT NOT NULL,
    complexity INT CHECK (complexity BETWEEN 1 AND 10),
    significance INT CHECK (significance BETWEEN 1 AND 3),
    research_value DECIMAL(18,8) NOT NULL,
    computation_time DECIMAL(10,3),
    energy_consumed DECIMAL(12,8),
    is_collaborative BOOLEAN DEFAULT false,
    is_from_pow BOOLEAN DEFAULT true,
    validation_status VARCHAR(20) DEFAULT 'pending' CHECK (validation_status IN ('pending', 'validated', 'rejected')),
    novelty_score DECIMAL(5,2),
    algorithm_used VARCHAR(100),
    transaction_hash VARCHAR(66),
    contract_address VARCHAR(42),
    network VARCHAR(20) DEFAULT 'sepolia',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- MATHEMATICAL RESULTS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS mathematical_results (
    id SERIAL PRIMARY KEY,
    discovery_id VARCHAR(50) REFERENCES discoveries(discovery_id) ON DELETE CASCADE,
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

-- =============================================================================
-- VALIDATION TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS validations (
    id SERIAL PRIMARY KEY,
    discovery_id VARCHAR(50) REFERENCES discoveries(discovery_id) ON DELETE CASCADE,
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

-- =============================================================================
-- TOKENOMICS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS discovery_tokenomics (
    id SERIAL PRIMARY KEY,
    discovery_id VARCHAR(50) REFERENCES discoveries(discovery_id) ON DELETE CASCADE,
    pow_reward DECIMAL(18,8),
    burn_amount DECIMAL(18,8),
    net_reward DECIMAL(18,8),
    research_value_multiplier DECIMAL(10,4),
    complexity_multiplier DECIMAL(18,8),
    significance_multiplier DECIMAL(18,8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- CITATIONS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS citations (
    id SERIAL PRIMARY KEY,
    discovery_id VARCHAR(50) REFERENCES discoveries(discovery_id) ON DELETE CASCADE,
    citation_count INT DEFAULT 0,
    related_discoveries JSONB, -- Array of related discovery IDs
    cross_disciplinary_connections JSONB, -- Array of related work types
    impact_score DECIMAL(10,4),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- WORK TYPE DEFINITIONS TABLE
-- =============================================================================

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

-- =============================================================================
-- NETWORK METRICS TABLE
-- =============================================================================

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

-- =============================================================================
-- RESEARCH QUALITY INDICATORS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS research_quality (
    id SERIAL PRIMARY KEY,
    discovery_id VARCHAR(50) REFERENCES discoveries(discovery_id) ON DELETE CASCADE,
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
-- MINING SESSIONS TABLE (Enhanced)
-- =============================================================================

CREATE TABLE IF NOT EXISTS mining_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    discovery_id VARCHAR(50) REFERENCES discoveries(discovery_id),
    user_address VARCHAR(42) NOT NULL,
    session_id INT,
    work_type INT NOT NULL,
    difficulty INT NOT NULL,
    target_hash VARCHAR(64) NOT NULL,
    nonce BIGINT,
    hash VARCHAR(64),
    complexity INT,
    significance INT,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    duration INTEGER, -- in seconds
    is_completed BOOLEAN DEFAULT false,
    auto_validation_requested BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- INDEXES FOR OPTIMAL PERFORMANCE
-- =============================================================================

-- Core discovery indexes
CREATE INDEX IF NOT EXISTS idx_discoveries_timestamp ON discoveries(timestamp);
CREATE INDEX IF NOT EXISTS idx_discoveries_researcher ON discoveries(researcher_address);
CREATE INDEX IF NOT EXISTS idx_discoveries_work_type ON discoveries(work_type_id);
CREATE INDEX IF NOT EXISTS idx_discoveries_validation_status ON discoveries(validation_status);
CREATE INDEX IF NOT EXISTS idx_discoveries_block_height ON discoveries(block_height);
CREATE INDEX IF NOT EXISTS idx_discoveries_research_value ON discoveries(research_value);

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

-- Mining sessions indexes
CREATE INDEX IF NOT EXISTS idx_mining_sessions_user ON mining_sessions(user_address);
CREATE INDEX IF NOT EXISTS idx_mining_sessions_discovery ON mining_sessions(discovery_id);
CREATE INDEX IF NOT EXISTS idx_mining_sessions_completed ON mining_sessions(is_completed);

-- =============================================================================
-- FUNCTIONS FOR AUTOMATIC UPDATES
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =============================================================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMP UPDATES
-- =============================================================================

CREATE TRIGGER update_discoveries_updated_at 
    BEFORE UPDATE ON discoveries 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_validations_updated_at 
    BEFORE UPDATE ON validations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_citations_updated_at 
    BEFORE UPDATE ON citations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_work_types_updated_at 
    BEFORE UPDATE ON work_types 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_research_quality_updated_at 
    BEFORE UPDATE ON research_quality 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mining_sessions_updated_at 
    BEFORE UPDATE ON mining_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- SAMPLE DATA INSERTION FOR WORK TYPES
-- =============================================================================

INSERT INTO work_types (work_type_id, name, description, millennium_problem, base_reward, difficulty_multiplier, typical_complexity, verification_method) VALUES
(0, 'riemann_zeta_function', 'Critical line zero computation for Riemann zeta function', true, 1000, 10000, '[6,7,8,9,10]', 'symbolic_computation'),
(1, 'mersenne_primes', 'Mersenne prime number discovery', false, 500, 5000, '[4,5,6,7,8]', 'primality_testing'),
(2, 'elliptic_curves', 'Elliptic curve discrete logarithm problem', false, 750, 7500, '[5,6,7,8,9]', 'point_multiplication'),
(3, 'lattice_problems', 'Lattice-based cryptography problems', false, 600, 6000, '[4,5,6,7,8]', 'lattice_reduction'),
(4, 'quantum_resistance', 'Post-quantum cryptography research', false, 800, 8000, '[6,7,8,9,10]', 'quantum_simulation')
ON CONFLICT (work_type_id) DO NOTHING;

-- =============================================================================
-- VIEWS FOR COMMON QUERIES
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

-- MINED Token Contract
INSERT INTO contracts (address, name, network, created_at) VALUES ('0x7877EFAb4aD3610792a135f6f8A241962fD2ab76', 'MINEDToken', 'sepolia', NOW());
