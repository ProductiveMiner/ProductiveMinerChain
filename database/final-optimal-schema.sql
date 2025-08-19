-- Final optimal schema that works with existing ProductiveMiner database structure
-- This script adds the optimal research data capabilities without breaking existing data

-- =============================================================================
-- STEP 1: UPDATE EXISTING DISCOVERIES TABLE TO SUPPORT OPTIMAL STRUCTURE
-- =============================================================================

-- Add missing columns to discoveries table
ALTER TABLE discoveries 
ADD COLUMN IF NOT EXISTS block_height BIGINT,
ADD COLUMN IF NOT EXISTS researcher_address VARCHAR(42),
ADD COLUMN IF NOT EXISTS work_type_id INT,
ADD COLUMN IF NOT EXISTS problem_statement TEXT,
ADD COLUMN IF NOT EXISTS computation_time DECIMAL(10,3),
ADD COLUMN IF NOT EXISTS energy_consumed DECIMAL(12,8),
ADD COLUMN IF NOT EXISTS is_collaborative BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS novelty_score DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS algorithm_used VARCHAR(100),
ADD COLUMN IF NOT EXISTS contract_address VARCHAR(42),
ADD COLUMN IF NOT EXISTS network VARCHAR(20) DEFAULT 'sepolia';

-- Update existing data to populate new columns
UPDATE discoveries 
SET 
    researcher_address = miner_address,
    work_type_id = CASE 
        WHEN work_type = 'riemann_zeta_function' THEN 0
        WHEN work_type = 'mersenne_primes' THEN 1
        WHEN work_type = 'elliptic_curves' THEN 2
        WHEN work_type = 'lattice_problems' THEN 3
        WHEN work_type = 'quantum_resistance' THEN 4
        ELSE 0
    END,
    work_type_name = work_type,
    problem_statement = 'Mathematical discovery via PoW mining',
    complexity = CASE 
        WHEN computational_complexity ~ '^[0-9]+$' THEN CAST(computational_complexity AS INT)
        ELSE 5
    END,
    significance = CASE 
        WHEN significance ~ '^[0-9]+$' THEN CAST(significance AS INT)
        ELSE 2
    END,
    research_value = CASE 
        WHEN research_value ~ '^[0-9]+\.?[0-9]*$' THEN CAST(research_value AS DECIMAL(18,8))
        ELSE 1000.0
    END,
    transaction_hash = tx_hash,
    contract_address = '0xf7b687854bA99B4Acafa509Fc42105B2a21369A7',
    network = 'sepolia'
WHERE researcher_address IS NULL;

-- =============================================================================
-- STEP 2: CREATE OPTIMAL RESEARCH TABLES
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

-- =============================================================================
-- STEP 3: CREATE INDEXES
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

-- Research quality indexes
CREATE INDEX IF NOT EXISTS idx_research_quality_discovery ON research_quality(discovery_id);
CREATE INDEX IF NOT EXISTS idx_research_quality_peer_review ON research_quality(peer_review_status);

-- Network metrics indexes
CREATE INDEX IF NOT EXISTS idx_network_metrics_timestamp ON network_metrics(timestamp);

-- =============================================================================
-- STEP 4: INSERT SAMPLE DATA
-- =============================================================================

-- Insert sample discovery data using existing table structure
INSERT INTO discoveries (
    id,
    miner_address,
    work_type,
    difficulty,
    reward,
    computational_complexity,
    tx_hash,
    research_value,
    complexity,
    significance,
    is_from_pow,
    is_validated,
    validation_count,
    discovery_id,
    work_type_name,
    problem_statement,
    work_type_id,
    researcher_address,
    computation_time,
    energy_consumed,
    is_collaborative,
    novelty_score,
    algorithm_used,
    transaction_hash,
    contract_address,
    network
) VALUES (
    'PM_RZ_20250815_001347',
    '0x742d35Cc6634C0532925A3B8D4C9dB96C4B4d8B6',
    'riemann_zeta_function',
    '25',
    '15000',
    '8',
    '0xabc123def456789abcdef123456789abcdef123456789abcdef123456789abc',
    '1250.75',
    '8',
    '3',
    true,
    true,
    4,
    'PM_RZ_20250815_001347',
    'riemann_zeta_function',
    'Find non-trivial zeros of ζ(s) on critical line Re(s) = 1/2',
    0,
    '0x742d35Cc6634C0532925A3B8D4C9dB96C4B4d8B6',
    3847.2,
    0.0034,
    false,
    99.7,
    'critical_line_zero_analysis',
    '0xabc123def456789abcdef123456789abcdef123456789abcdef123456789abc',
    '0xf7b687854bA99B4Acafa509Fc42105B2a21369A7',
    'sepolia'
) ON CONFLICT (id) DO NOTHING;

-- Insert sample mathematical result
INSERT INTO mathematical_results (
    discovery_id,
    result_type,
    result_data,
    verification_score,
    computational_steps,
    convergence_rate,
    precision_bits,
    algorithm_used,
    zero_location_real,
    zero_location_imaginary,
    zero_location_precision,
    related_zeros
) VALUES (
    'PM_RZ_20250815_001347',
    'riemann_zero',
    '{"zeroLocation": {"real": 0.5, "imaginary": 14.134725141734693, "precision": 50}}',
    99.7,
    2847291,
    0.000001,
    50,
    'critical_line_zero_analysis',
    0.5,
    14.134725141734693,
    50,
    '["14.134725", "21.022040", "25.010856"]'
) ON CONFLICT DO NOTHING;

-- Insert sample validation data
INSERT INTO validations (
    discovery_id,
    status,
    consensus_count,
    required_consensus,
    validation_fee,
    validators,
    validation_time,
    security_enhancement
) VALUES (
    'PM_RZ_20250815_001347',
    'validated',
    4,
    3,
    12.5,
    '["0x742d35Cc6634C0532925A3B8D4C9dB96C4B4d8B6", "0x1234567890123456789012345678901234567890"]',
    24.7,
    10006.0
) ON CONFLICT DO NOTHING;

-- Insert sample tokenomics data
INSERT INTO discovery_tokenomics (
    discovery_id,
    pow_reward,
    burn_amount,
    net_reward,
    research_value_multiplier,
    complexity_multiplier,
    significance_multiplier
) VALUES (
    'PM_RZ_20250815_001347',
    15000,
    3750,
    11250,
    2.5,
    8000,
    1500
) ON CONFLICT DO NOTHING;

-- Insert sample citation data
INSERT INTO citations (
    discovery_id,
    citation_count,
    related_discoveries,
    cross_disciplinary_connections,
    impact_score
) VALUES (
    'PM_RZ_20250815_001347',
    0,
    '["PM_RZ_20250814_002156"]',
    '["yang_mills", "elliptic_curves"]',
    45.2
) ON CONFLICT DO NOTHING;

-- Insert sample research quality data
INSERT INTO research_quality (
    discovery_id,
    peer_review_status,
    academic_validation,
    commercial_applications,
    reproducibility_score,
    academic_citations,
    commercial_usage_count
) VALUES (
    'PM_RZ_20250815_001347',
    'pending',
    false,
    '["cryptography", "number_theory"]',
    85.5,
    0,
    0
) ON CONFLICT DO NOTHING;

-- Insert sample network metrics
INSERT INTO network_metrics (
    timestamp,
    active_miners,
    discoveries_per_hour,
    average_validation_time,
    bit_strength,
    security_enhancement_rate,
    total_research_value,
    total_burned_tokens
) VALUES (
    '2025-08-15T23:33:47.390Z'::timestamp,
    247,
    130.0,
    18.5,
    768,
    0.025,
    1250000.0,
    50000.0
) ON CONFLICT DO NOTHING;

-- =============================================================================
-- STEP 5: CREATE VIEWS
-- =============================================================================

-- View for discovery summary with all related data
CREATE OR REPLACE VIEW discovery_summary AS
SELECT 
    d.id as discovery_id,
    d.created_at as timestamp,
    d.researcher_address,
    d.work_type_name,
    CAST(d.complexity AS INT) as complexity,
    CAST(d.significance AS INT) as significance,
    CAST(d.research_value AS DECIMAL(18,8)) as research_value,
    CASE WHEN d.is_validated THEN 'validated' ELSE 'pending' END as validation_status,
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
LEFT JOIN validations v ON d.id = v.discovery_id
LEFT JOIN discovery_tokenomics t ON d.id = t.discovery_id
LEFT JOIN citations c ON d.id = c.discovery_id
LEFT JOIN research_quality rq ON d.id = rq.discovery_id;

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
    COUNT(d.id) as total_discoveries,
    AVG(CAST(d.research_value AS DECIMAL(18,8))) as avg_research_value
FROM network_metrics nm
LEFT JOIN discoveries d ON DATE_TRUNC('hour', d.created_at) = DATE_TRUNC('hour', nm.timestamp)
GROUP BY nm.id, nm.timestamp, nm.active_miners, nm.discoveries_per_hour, nm.average_validation_time, 
         nm.bit_strength, nm.security_enhancement_rate, nm.total_research_value, nm.total_burned_tokens;

-- =============================================================================
-- VERIFICATION
-- =============================================================================

-- Verify the schema
SELECT 'Optimal research schema applied successfully!' as status;
SELECT COUNT(*) as discoveries_count FROM discoveries;
SELECT COUNT(*) as work_types_count FROM work_types;
SELECT COUNT(*) as mathematical_results_count FROM mathematical_results;
SELECT COUNT(*) as validations_count FROM validations;
SELECT COUNT(*) as tokenomics_count FROM discovery_tokenomics;
SELECT COUNT(*) as citations_count FROM citations;
SELECT COUNT(*) as research_quality_count FROM research_quality;
SELECT COUNT(*) as network_metrics_count FROM network_metrics;

-- Show sample data
SELECT 'Sample discovery data:' as info;
SELECT id, work_type_name, complexity, significance, research_value, is_validated FROM discoveries LIMIT 5;
