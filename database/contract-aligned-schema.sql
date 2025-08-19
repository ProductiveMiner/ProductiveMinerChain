-- Contract-Aligned Optimal Schema for ProductiveMiner Research Data
-- This schema perfectly matches the MINEDTokenStandalone.sol contract structure

-- =============================================================================
-- STEP 1: UPDATE DISCOVERIES TABLE TO MATCH CONTRACT STRUCTURE
-- =============================================================================

-- Update discoveries table to match contract Discovery struct
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

-- Update existing data to populate new columns and align with contract
UPDATE discoveries 
SET 
    researcher_address = miner_address,
    work_type_id = CASE 
        WHEN work_type = 'riemann_zeta_function' THEN 0
        WHEN work_type = 'goldbach_conjecture' THEN 1
        WHEN work_type = 'birch_swinnerton_dyer' THEN 2
        WHEN work_type = 'prime_pattern_discovery' THEN 3
        WHEN work_type = 'twin_primes' THEN 4
        WHEN work_type = 'collatz_conjecture' THEN 5
        WHEN work_type = 'perfect_numbers' THEN 6
        WHEN work_type = 'mersenne_primes' THEN 7
        WHEN work_type = 'fibonacci_patterns' THEN 8
        WHEN work_type = 'pascal_triangle' THEN 9
        WHEN work_type = 'differential_equations' THEN 10
        WHEN work_type = 'number_theory' THEN 11
        WHEN work_type = 'yang_mills_field_theory' THEN 12
        WHEN work_type = 'navier_stokes_simulation' THEN 13
        WHEN work_type = 'elliptic_curve_cryptography' THEN 14
        WHEN work_type = 'lattice_cryptography' THEN 15
        WHEN work_type = 'crypto_hash_functions' THEN 16
        WHEN work_type = 'poincare_conjecture' THEN 17
        WHEN work_type = 'algebraic_topology' THEN 18
        WHEN work_type = 'euclidean_geometry' THEN 19
        WHEN work_type = 'quantum_computing' THEN 20
        WHEN work_type = 'machine_learning' THEN 21
        WHEN work_type = 'blockchain_protocols' THEN 22
        WHEN work_type = 'distributed_systems' THEN 23
        WHEN work_type = 'optimization_algorithms' THEN 24
        ELSE 0
    END,
    work_type_name = work_type,
    problem_statement = 'Mathematical discovery via PoW mining',
    complexity = CASE 
        WHEN computational_complexity ~ '^[0-9]+$' THEN computational_complexity
        ELSE '5'
    END,
    significance = CASE 
        WHEN significance ~ '^[0-9]+$' THEN significance
        ELSE '2'
    END,
    research_value = CASE 
        WHEN research_value ~ '^[0-9]+\.?[0-9]*$' THEN research_value
        ELSE '1000'
    END,
    transaction_hash = tx_hash,
    INSERT INTO contracts (address, name, network) VALUES ('0x7877EFAb4aD3610792a135f6f8A241962fD2ab76',
    network = 'sepolia'
WHERE researcher_address IS NULL;

-- =============================================================================
-- STEP 2: CREATE CONTRACT-ALIGNED WORK TYPES
-- =============================================================================

-- Insert work types that match the contract _initWorkTypes() function
INSERT INTO work_types (work_type_id, name, description, millennium_problem, base_reward, difficulty_multiplier, typical_complexity, verification_method) VALUES
(0, 'riemann_zeta_function', 'Riemann Zero Computation (100-500 research value)', true, 500, 10000, '[6,7,8,9,10]', 'symbolic_computation'),
(1, 'goldbach_conjecture', 'Goldbach Conjecture (75-300 research value)', false, 300, 8000, '[5,6,7,8,9]', 'number_theory_verification'),
(2, 'birch_swinnerton_dyer', 'Birch-Swinnerton-Dyer (125-400 research value)', true, 400, 8000, '[6,7,8,9,10]', 'elliptic_curve_verification'),
(3, 'prime_pattern_discovery', 'Prime Pattern Discovery (50-200 research value)', false, 200, 6000, '[4,5,6,7,8]', 'primality_testing'),
(4, 'twin_primes', 'Twin Primes (75-300 research value)', false, 300, 8000, '[5,6,7,8,9]', 'primality_testing'),
(5, 'collatz_conjecture', 'Collatz Conjecture (50-200 research value)', false, 200, 6000, '[4,5,6,7,8]', 'sequence_verification'),
(6, 'perfect_numbers', 'Perfect Numbers (75-300 research value)', false, 300, 8000, '[5,6,7,8,9]', 'divisor_verification'),
(7, 'mersenne_primes', 'Mersenne Primes (100-500 research value)', false, 500, 10000, '[6,7,8,9,10]', 'lucas_lehmer_test'),
(8, 'fibonacci_patterns', 'Fibonacci Patterns (50-150 research value)', false, 150, 4000, '[3,4,5,6,7]', 'sequence_analysis'),
(9, 'pascal_triangle', 'Pascal Triangle (50-100 research value)', false, 100, 4000, '[3,4,5,6,7]', 'combinatorial_verification'),
(10, 'differential_equations', 'Differential Equations (75-300 research value)', false, 300, 8000, '[5,6,7,8,9]', 'numerical_verification'),
(11, 'number_theory', 'Number Theory (50-200 research value)', false, 200, 6000, '[4,5,6,7,8]', 'theoretical_verification'),
(12, 'yang_mills_field_theory', 'Yang-Mills Field Theory (200-800 research value)', true, 800, 10000, '[7,8,9,10]', 'quantum_field_verification'),
(13, 'navier_stokes_simulation', 'Navier-Stokes Simulation (150-600 research value)', true, 600, 10000, '[6,7,8,9,10]', 'fluid_dynamics_verification'),
(14, 'elliptic_curve_cryptography', 'Elliptic Curve Cryptography (80-320 research value)', false, 320, 6000, '[4,5,6,7,8]', 'point_multiplication'),
(15, 'lattice_cryptography', 'Lattice Cryptography (90-360 research value)', false, 360, 10000, '[5,6,7,8,9]', 'lattice_reduction'),
(16, 'crypto_hash_functions', 'Crypto Hash Functions (50-200 research value)', false, 200, 6000, '[4,5,6,7,8]', 'hash_verification'),
(17, 'poincare_conjecture', 'Poincare Conjecture (300-1000 research value)', true, 1000, 10000, '[8,9,10]', 'topology_verification'),
(18, 'algebraic_topology', 'Algebraic Topology (100-500 research value)', false, 500, 10000, '[6,7,8,9,10]', 'homology_verification'),
(19, 'euclidean_geometry', 'Euclidean Geometry (50-200 research value)', false, 200, 6000, '[4,5,6,7,8]', 'geometric_verification'),
(20, 'quantum_computing', 'Quantum Computing (150-600 research value)', false, 600, 10000, '[6,7,8,9,10]', 'quantum_simulation'),
(21, 'machine_learning', 'Machine Learning (100-400 research value)', false, 400, 8000, '[5,6,7,8,9]', 'model_verification'),
(22, 'blockchain_protocols', 'Blockchain Protocols (50-200 research value)', false, 200, 6000, '[4,5,6,7,8]', 'protocol_verification'),
(23, 'distributed_systems', 'Distributed Systems (50-200 research value)', false, 200, 6000, '[4,5,6,7,8]', 'consensus_verification'),
(24, 'optimization_algorithms', 'Optimization Algorithms (75-300 research value)', false, 300, 8000, '[5,6,7,8,9]', 'algorithm_verification')
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
-- STEP 3: INSERT CONTRACT-ALIGNED SAMPLE DATA
-- =============================================================================

-- Insert sample discovery data that matches contract structure
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

-- Insert sample mathematical result that matches PoWResult struct
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
    '{"hash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef", "timestamp": 1755252453, "sessionId": 1, "complexity": 8, "significance": 3, "miner": "0x742d35Cc6634C0532925A3B8D4C9dB96C4B4d8B6", "isValid": true}',
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

-- Insert sample validation data that matches ValidationRequest struct
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

-- Insert sample tokenomics data that matches contract reward calculation
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

-- Insert sample mining session that matches MiningSession struct
INSERT INTO mining_sessions (
    discovery_id,
    user_address,
    session_id,
    work_type,
    difficulty,
    target_hash,
    nonce,
    hash,
    complexity,
    significance,
    start_time,
    end_time,
    duration,
    is_completed,
    auto_validation_requested
) VALUES (
    'PM_RZ_20250815_001347',
    '0x742d35Cc6634C0532925A3B8D4C9dB96C4B4d8B6',
    1,
    0,
    25,
    '0x1234567890abcdef1234567890abcdef',
    12345,
    '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    8,
    3,
    '2025-08-15T23:30:00Z'::timestamp,
    '2025-08-15T23:33:47Z'::timestamp,
    227,
    true,
    true
) ON CONFLICT DO NOTHING;

-- =============================================================================
-- STEP 4: CREATE CONTRACT-ALIGNED VIEWS
-- =============================================================================

-- View that matches contract Discovery struct
CREATE OR REPLACE VIEW contract_discovery_view AS
SELECT 
    d.id as discovery_id,
    d.researcher_address as researcher,
    d.work_type_id as workType,
    CAST(d.complexity AS INT) as complexity,
    CAST(d.significance AS INT) as significance,
    CAST(d.research_value AS DECIMAL(18,8)) as researchValue,
    d.created_at as timestamp,
    d.validation_count as validationCount,
    d.is_collaborative as isCollaborative,
    d.is_from_pow as isFromPoW,
    d.is_validated as isValidated,
    d.contract_address,
    d.network
FROM discoveries d;

-- View that matches contract MiningSession struct
CREATE OR REPLACE VIEW contract_mining_session_view AS
SELECT 
    ms.id as session_id,
    ms.target_hash as targetHash,
    ms.start_time as startTime,
    ms.end_time as endTime,
    ms.nonce,
    ms.difficulty,
    ms.work_type as workType,
    ms.user_address as miner,
    ms.is_completed as isCompleted,
    ms.auto_validation_requested as autoValidationRequested
FROM mining_sessions ms;

-- View that matches contract PoWResult struct
CREATE OR REPLACE VIEW contract_pow_result_view AS
SELECT 
    mr.id as result_id,
    mr.result_data->>'hash' as hash,
    (mr.result_data->>'timestamp')::bigint as timestamp,
    (mr.result_data->>'sessionId')::int as sessionId,
    mr.computational_steps as complexity,
    mr.verification_score as significance,
    mr.result_data->>'miner' as miner,
    (mr.result_data->>'isValid')::boolean as isValid
FROM mathematical_results mr
WHERE mr.result_type = 'pow_result';

-- =============================================================================
-- STEP 5: CREATE CONTRACT STATE VIEW
-- =============================================================================

-- View that matches contract PackedState struct
CREATE OR REPLACE VIEW contract_state_view AS
SELECT 
    COALESCE(SUM(t.burn_amount), 0) as totalBurned,
    COALESCE(SUM(CAST(d.research_value AS DECIMAL(18,8))), 0) as totalResearchValue,
    MAX(d.created_at) as lastEmissionBlock,
    COUNT(DISTINCT v.validators) as totalValidators,
    COUNT(d.id) as nextDiscoveryId
FROM discoveries d
LEFT JOIN discovery_tokenomics t ON d.id = t.discovery_id
LEFT JOIN validations v ON d.id = v.discovery_id;

-- =============================================================================
-- VERIFICATION
-- =============================================================================

-- Verify contract alignment
SELECT 'Contract-aligned schema applied successfully!' as status;
SELECT COUNT(*) as work_types_count FROM work_types;
SELECT COUNT(*) as discoveries_count FROM discoveries;
SELECT COUNT(*) as mining_sessions_count FROM mining_sessions;
SELECT COUNT(*) as mathematical_results_count FROM mathematical_results;
SELECT COUNT(*) as validations_count FROM validations;

-- Show contract-aligned data
SELECT 'Contract-aligned discovery data:' as info;
SELECT discovery_id, researcher, workType, complexity, significance, researchValue, isFromPoW, isValidated 
FROM contract_discovery_view LIMIT 5;

SELECT 'Contract-aligned mining sessions:' as info;
SELECT session_id, targetHash, workType, miner, isCompleted 
FROM contract_mining_session_view LIMIT 5;
