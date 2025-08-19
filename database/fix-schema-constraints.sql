-- Fix schema constraints and add missing primary key
-- This script fixes the foreign key constraint issues

-- =============================================================================
-- STEP 1: ADD PRIMARY KEY TO DISCOVERIES TABLE
-- =============================================================================

-- First, let's see what columns exist in the discoveries table
\d discoveries;

-- Add discovery_id as primary key if it doesn't exist
ALTER TABLE discoveries 
ADD CONSTRAINT discoveries_pkey PRIMARY KEY (discovery_id);

-- If discovery_id column doesn't exist, create it
ALTER TABLE discoveries 
ADD COLUMN IF NOT EXISTS discovery_id VARCHAR(50);

-- Make discovery_id unique and not null
ALTER TABLE discoveries 
ALTER COLUMN discovery_id SET NOT NULL;

-- Add unique constraint
ALTER TABLE discoveries 
ADD CONSTRAINT discoveries_discovery_id_unique UNIQUE (discovery_id);

-- =============================================================================
-- STEP 2: FIX FOREIGN KEY CONSTRAINTS
-- =============================================================================

-- Drop existing foreign key constraints if they exist
ALTER TABLE mathematical_results DROP CONSTRAINT IF EXISTS fk_math_results_discovery;
ALTER TABLE validations DROP CONSTRAINT IF EXISTS fk_validations_discovery;
ALTER TABLE discovery_tokenomics DROP CONSTRAINT IF EXISTS fk_tokenomics_discovery;
ALTER TABLE citations DROP CONSTRAINT IF EXISTS fk_citations_discovery;
ALTER TABLE research_quality DROP CONSTRAINT IF EXISTS fk_research_quality_discovery;
ALTER TABLE mining_sessions DROP CONSTRAINT IF EXISTS fk_mining_sessions_discovery;

-- Add foreign key constraints
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
-- STEP 3: FIX VIEWS
-- =============================================================================

-- Drop existing views
DROP VIEW IF EXISTS discovery_summary;
DROP VIEW IF EXISTS network_health;

-- Recreate discovery_summary view with correct column names
CREATE OR REPLACE VIEW discovery_summary AS
SELECT 
    d.discovery_id,
    d.created_at as timestamp,
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

-- Recreate network_health view with correct column names
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
LEFT JOIN discoveries d ON DATE_TRUNC('hour', d.created_at) = DATE_TRUNC('hour', nm.timestamp)
GROUP BY nm.id, nm.timestamp, nm.active_miners, nm.discoveries_per_hour, nm.average_validation_time, 
         nm.bit_strength, nm.security_enhancement_rate, nm.total_research_value, nm.total_burned_tokens;

-- =============================================================================
-- STEP 4: INSERT SAMPLE DATA
-- =============================================================================

-- Insert sample discovery data
INSERT INTO discoveries (
    discovery_id, 
    block_height, 
    created_at, 
    researcher_address, 
    work_type_id, 
    work_type_name, 
    problem_statement, 
    complexity, 
    significance, 
    research_value, 
    computation_time, 
    energy_consumed, 
    is_collaborative, 
    is_from_pow, 
    validation_status, 
    novelty_score, 
    algorithm_used, 
    transaction_hash, 
    contract_address, 
    network
) VALUES (
    'PM_RZ_20250815_001347',
    8988702,
    '2025-08-15T23:33:47.390Z'::timestamp,
    '0x742d35Cc6634C0532925A3B8D4C9dB96C4B4d8B6',
    0,
    'riemann_zeta_function',
    'Find non-trivial zeros of ζ(s) on critical line Re(s) = 1/2',
    8,
    3,
    1250.75,
    3847.2,
    0.0034,
    false,
    true,
    'validated',
    99.7,
    'critical_line_zero_analysis',
    '0xabc123def456789abcdef123456789abcdef123456789abcdef123456789abc',
    '0x016A5B5617D26b93Ec6fB8DB2DC1BA79DefB088e',
    'sepolia'
) ON CONFLICT (discovery_id) DO NOTHING;

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

-- =============================================================================
-- VERIFICATION
-- =============================================================================

-- Verify the schema
SELECT 'Schema verification completed!' as status;
SELECT COUNT(*) as discoveries_count FROM discoveries;
SELECT COUNT(*) as work_types_count FROM work_types;
SELECT COUNT(*) as mathematical_results_count FROM mathematical_results;
SELECT COUNT(*) as validations_count FROM validations;
SELECT COUNT(*) as tokenomics_count FROM discovery_tokenomics;
SELECT COUNT(*) as citations_count FROM citations;
SELECT COUNT(*) as research_quality_count FROM research_quality;
