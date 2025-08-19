-- ProductiveMiner Optimal Database Schema
-- Designed to maximize research value and tokenomic efficiency

-- 1. Core Discovery Table
CREATE TABLE discoveries (
    discovery_id VARCHAR(50) PRIMARY KEY,
    block_height BIGINT NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    researcher_address VARCHAR(42) NOT NULL,
    work_type_id INT NOT NULL CHECK (work_type_id BETWEEN 0 AND 24),
    complexity INT NOT NULL CHECK (complexity BETWEEN 1 AND 10),
    significance INT NOT NULL CHECK (significance BETWEEN 1 AND 3),
    research_value DECIMAL(18,8) NOT NULL,
    computation_time DECIMAL(10,3),
    energy_consumed DECIMAL(12,8),
    is_collaborative BOOLEAN DEFAULT FALSE,
    is_from_pow BOOLEAN DEFAULT TRUE,
    validation_status ENUM('pending', 'validated', 'rejected') DEFAULT 'pending',
    novelty_score DECIMAL(5,2),
    transaction_hash VARCHAR(66),
    contract_address VARCHAR(42),
    network VARCHAR(20) DEFAULT 'Sepolia Testnet',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Mathematical Results Table
CREATE TABLE mathematical_results (
    discovery_id VARCHAR(50) PRIMARY KEY,
    result_type VARCHAR(50) NOT NULL,
    result_data JSON NOT NULL,
    verification_score DECIMAL(5,2),
    computational_steps BIGINT,
    convergence_rate DECIMAL(15,10),
    precision_bits INT,
    algorithm_used VARCHAR(100),
    zero_location_real DECIMAL(20,15),
    zero_location_imaginary DECIMAL(20,15),
    related_zeros JSON,
    novelty_indicators JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (discovery_id) REFERENCES discoveries(discovery_id)
);

-- 3. Validation Records Table
CREATE TABLE validations (
    validation_id VARCHAR(50) PRIMARY KEY,
    discovery_id VARCHAR(50) NOT NULL,
    validator_address VARCHAR(42) NOT NULL,
    validation_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    consensus_count INT DEFAULT 0,
    required_consensus INT DEFAULT 4,
    validation_fee DECIMAL(18,8),
    validation_time DECIMAL(10,3),
    security_enhancement DECIMAL(18,8),
    validator_reward DECIMAL(18,8),
    validation_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (discovery_id) REFERENCES discoveries(discovery_id)
);

-- 4. Tokenomics Records Table
CREATE TABLE tokenomics (
    discovery_id VARCHAR(50) PRIMARY KEY,
    pow_reward DECIMAL(18,8) NOT NULL,
    burn_amount DECIMAL(18,8) NOT NULL,
    net_reward DECIMAL(18,8) NOT NULL,
    research_value_multiplier DECIMAL(10,4),
    complexity_multiplier INT,
    significance_multiplier INT,
    burn_rate DECIMAL(5,2),
    emission_decay DECIMAL(18,8),
    research_bonus DECIMAL(18,8),
    collaborative_bonus DECIMAL(18,8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (discovery_id) REFERENCES discoveries(discovery_id)
);

-- 5. Citations and Impact Table
CREATE TABLE citations (
    citation_id VARCHAR(50) PRIMARY KEY,
    discovery_id VARCHAR(50) NOT NULL,
    citation_count INT DEFAULT 0,
    impact_score DECIMAL(10,4),
    academic_citations JSON,
    commercial_applications JSON,
    cross_disciplinary_connections JSON,
    related_discoveries JSON,
    peer_review_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    reproducibility_score DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (discovery_id) REFERENCES discoveries(discovery_id)
);

-- 6. Work Type Definitions Table
CREATE TABLE work_types (
    work_type_id INT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    millennium_problem BOOLEAN DEFAULT FALSE,
    base_reward INT NOT NULL,
    difficulty_multiplier INT NOT NULL,
    typical_complexity JSON,
    verification_method VARCHAR(100),
    research_value_range JSON,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Network Metrics Table
CREATE TABLE network_metrics (
    metric_id VARCHAR(50) PRIMARY KEY,
    timestamp TIMESTAMP NOT NULL,
    active_miners INT,
    discoveries_per_hour DECIMAL(10,2),
    average_validation_time DECIMAL(10,3),
    bit_strength INT,
    security_enhancement_rate DECIMAL(10,6),
    total_staked DECIMAL(18,8),
    total_burned DECIMAL(18,8),
    total_research_value BIGINT,
    staking_apy DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Researcher Profiles Table
CREATE TABLE researchers (
    researcher_address VARCHAR(42) PRIMARY KEY,
    total_discoveries INT DEFAULT 0,
    total_research_value BIGINT DEFAULT 0,
    total_rewards DECIMAL(18,8) DEFAULT 0,
    reputation_score DECIMAL(10,4) DEFAULT 100,
    specialization JSON,
    collaboration_count INT DEFAULT 0,
    validation_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP
);

-- Indexes for Performance
CREATE INDEX idx_discoveries_timestamp ON discoveries(timestamp);
CREATE INDEX idx_discoveries_work_type ON discoveries(work_type_id);
CREATE INDEX idx_discoveries_researcher ON discoveries(researcher_address);
CREATE INDEX idx_discoveries_validation_status ON discoveries(validation_status);
CREATE INDEX idx_discoveries_complexity ON discoveries(complexity);
CREATE INDEX idx_discoveries_significance ON discoveries(significance);
CREATE INDEX idx_mathematical_results_verification ON mathematical_results(verification_score);
CREATE INDEX idx_tokenomics_rewards ON tokenomics(net_reward);
CREATE INDEX idx_citations_impact ON citations(impact_score);

-- Views for Common Queries
CREATE VIEW high_value_discoveries AS
SELECT 
    d.discovery_id,
    d.work_type_id,
    d.complexity,
    d.significance,
    d.research_value,
    t.net_reward,
    c.impact_score
FROM discoveries d
JOIN tokenomics t ON d.discovery_id = t.discovery_id
JOIN citations c ON d.discovery_id = c.discovery_id
WHERE d.validation_status = 'validated'
AND t.net_reward > 1000
ORDER BY t.net_reward DESC;

CREATE VIEW millennium_problem_progress AS
SELECT 
    wt.name,
    COUNT(d.discovery_id) as discovery_count,
    SUM(d.research_value) as total_research_value,
    AVG(d.complexity) as avg_complexity,
    AVG(t.net_reward) as avg_reward
FROM work_types wt
JOIN discoveries d ON wt.work_type_id = d.work_type_id
JOIN tokenomics t ON d.discovery_id = t.discovery_id
WHERE wt.millennium_problem = TRUE
AND d.validation_status = 'validated'
GROUP BY wt.work_type_id, wt.name;

-- Sample Data Insertion
INSERT INTO work_types (work_type_id, name, description, millennium_problem, base_reward, difficulty_multiplier, research_value_range) VALUES
(0, 'Riemann Zero Computation', 'Critical line zero computation for Riemann zeta function', TRUE, 500, 10000, '[100, 500]'),
(1, 'Goldbach Conjecture', 'Even number representation as sum of two primes', FALSE, 300, 8000, '[75, 300]'),
(2, 'Birch-Swinnerton-Dyer', 'Elliptic curve L-function behavior', TRUE, 400, 8000, '[125, 400]'),
(12, 'Yang-Mills Field Theory', 'Quantum field theory mathematical foundations', TRUE, 800, 10000, '[200, 800]'),
(17, 'Poincare Conjecture', 'Topological classification of 3-manifolds', TRUE, 1000, 10000, '[300, 1000]');
