-- Enhanced Scientific Database Schema for ProductiveMiner Research Platform
-- Includes comprehensive scientific validation and academic integration

-- =============================================================================
-- CORE DISCOVERY TABLE (Enhanced)
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
-- COMPUTATIONAL VERIFICATION DETAILS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS computational_verification (
    id SERIAL PRIMARY KEY,
    discovery_id VARCHAR(50) REFERENCES discoveries(discovery_id) ON DELETE CASCADE,
    algorithm_used VARCHAR(100) NOT NULL,
    input_parameters JSONB NOT NULL, -- {"limit": 10000, "difficulty": 5, "precision": 64}
    computation_steps BIGINT NOT NULL,
    cpu_cycles BIGINT,
    memory_usage_mb DECIMAL(10,2),
    execution_time_ms DECIMAL(10,2),
    hash_verification VARCHAR(66),
    reproducible_seed BIGINT,
    verification_nodes JSONB, -- Array of validator addresses
    hardware_specs JSONB, -- {"cpu": "Intel i7", "ram": "16GB", "architecture": "x86_64"}
    software_environment JSONB, -- {"compiler": "python 3.9", "libraries": ["numpy", "scipy"]}
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- MATHEMATICAL PROOF VERIFICATION TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS mathematical_proofs (
    id SERIAL PRIMARY KEY,
    discovery_id VARCHAR(50) REFERENCES discoveries(discovery_id) ON DELETE CASCADE,
    theorem_statement TEXT NOT NULL,
    proof_method VARCHAR(100) NOT NULL, -- "exhaustive_verification", "induction", "contradiction"
    counterexamples_found INT DEFAULT 0,
    edge_cases_tested JSONB, -- Array of edge case values
    mathematical_rigor_score DECIMAL(5,2) CHECK (mathematical_rigor_score BETWEEN 0 AND 1),
    proof_completeness VARCHAR(50), -- "complete", "partial_verification", "heuristic"
    known_limitations JSONB, -- Array of limitations
    proof_steps JSONB, -- Detailed proof steps
    assumptions_made JSONB, -- Array of mathematical assumptions
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- CROSS-VALIDATION RESULTS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS cross_validation (
    id SERIAL PRIMARY KEY,
    discovery_id VARCHAR(50) REFERENCES discoveries(discovery_id) ON DELETE CASCADE,
    independent_verifiers INT NOT NULL,
    consensus_percentage DECIMAL(5,2) CHECK (consensus_percentage BETWEEN 0 AND 100),
    verification_conflicts JSONB, -- Array of conflicts found
    validation_method VARCHAR(100), -- "distributed_consensus", "peer_review", "automated"
    external_reference_checks JSONB, -- {"oeis_sequence_match": true, "known_results_confirmation": true}
    literature_citations JSONB, -- Array of academic citations
    verification_timeline JSONB, -- Timeline of verification events
    validator_credentials JSONB, -- Academic/professional credentials of validators
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- SCIENTIFIC CONTRIBUTION METRICS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS scientific_contributions (
    id SERIAL PRIMARY KEY,
    discovery_id VARCHAR(50) REFERENCES discoveries(discovery_id) ON DELETE CASCADE,
    new_data_points INT,
    range_extended JSONB, -- {"from": 1000, "to": 10000}
    novel_patterns_discovered JSONB, -- Array of pattern objects
    existing_knowledge_confirmed BOOLEAN,
    computational_milestone VARCHAR(200),
    research_impact_score DECIMAL(5,2),
    novelty_contribution VARCHAR(100), -- "incremental", "significant", "breakthrough"
    potential_applications JSONB, -- Array of application areas
    follow_up_research_needed BOOLEAN,
    publication_potential VARCHAR(50), -- "conference_poster", "journal_article", "preprint"
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- RESEARCH METHODOLOGY DOCUMENTATION TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS research_methodology (
    id SERIAL PRIMARY KEY,
    discovery_id VARCHAR(50) REFERENCES discoveries(discovery_id) ON DELETE CASCADE,
    research_question TEXT NOT NULL,
    hypothesis TEXT,
    experimental_design VARCHAR(100),
    controls JSONB, -- Array of control measures
    variables JSONB, -- {"independent": "...", "dependent": "...", "controlled": [...]}
    sample_size INT,
    statistical_power DECIMAL(5,2),
    methodology_type VARCHAR(50), -- "computational", "theoretical", "experimental"
    data_collection_method VARCHAR(100),
    analysis_techniques JSONB, -- Array of analysis methods used
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- ACADEMIC INTEGRATION TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS academic_integration (
    id SERIAL PRIMARY KEY,
    discovery_id VARCHAR(50) REFERENCES discoveries(discovery_id) ON DELETE CASCADE,
    related_publications JSONB, -- Array of publication objects
    citation_potential VARCHAR(100),
    peer_review_status VARCHAR(50) DEFAULT 'pending',
    research_category VARCHAR(100),
    mathematical_subject_classification VARCHAR(20), -- MSC codes
    academic_institutions JSONB, -- Array of involved institutions
    research_funding JSONB, -- Funding information
    collaboration_network JSONB, -- Network of collaborators
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- ERROR ANALYSIS AND UNCERTAINTY TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS error_analysis (
    id SERIAL PRIMARY KEY,
    discovery_id VARCHAR(50) REFERENCES discoveries(discovery_id) ON DELETE CASCADE,
    numerical_precision VARCHAR(50), -- "32_bit", "64_bit", "arbitrary_precision"
    algorithm_correctness_proof BOOLEAN,
    implementation_testing JSONB, -- {"unit_tests_passed": 847, "edge_case_coverage": 0.98}
    uncertainty_sources JSONB, -- Array of uncertainty sources
    confidence_interval DECIMAL(5,4),
    false_positive_rate DECIMAL(10,6),
    statistical_significance VARCHAR(50), -- "p < 0.001", "p < 0.01", "p < 0.05"
    error_bounds JSONB, -- {"lower": 0.001, "upper": 0.999}
    reliability_metrics JSONB, -- {"reproducibility": 0.99, "consistency": 0.95}
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- COMPUTATIONAL COMPLEXITY ANALYSIS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS complexity_analysis (
    id SERIAL PRIMARY KEY,
    discovery_id VARCHAR(50) REFERENCES discoveries(discovery_id) ON DELETE CASCADE,
    time_complexity VARCHAR(50), -- "O(n)", "O(n log n)", "O(n^2)"
    space_complexity VARCHAR(50),
    scalability_limits JSONB, -- {"max_n": 10000000, "memory_constraint": "1GB"}
    optimization_techniques JSONB, -- Array of optimization methods
    performance_benchmarks JSONB, -- {"vs_naive_algorithm": "1000x_faster"}
    computational_efficiency DECIMAL(5,2),
    resource_utilization JSONB, -- {"cpu_usage": 0.85, "memory_usage": 0.60}
    algorithm_improvements JSONB, -- Array of improvements made
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- REPRODUCIBILITY DATA TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS reproducibility_data (
    id SERIAL PRIMARY KEY,
    discovery_id VARCHAR(50) REFERENCES discoveries(discovery_id) ON DELETE CASCADE,
    deterministic_algorithm BOOLEAN,
    random_seed_used BIGINT,
    environment_details JSONB, -- {"compiler": "python 3.9", "libraries": [...]}
    reproduction_instructions TEXT,
    data_availability VARCHAR(100), -- "raw_results_published", "available_on_request"
    code_repository VARCHAR(200),
    docker_image VARCHAR(200),
    dependency_versions JSONB, -- {"numpy": "1.21.0", "scipy": "1.7.0"}
    platform_independence BOOLEAN,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- NOVEL DISCOVERY TRACKING TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS novel_discoveries (
    id SERIAL PRIMARY KEY,
    discovery_id VARCHAR(50) REFERENCES discoveries(discovery_id) ON DELETE CASCADE,
    discovery_type VARCHAR(100), -- "computational_verification", "theoretical_proof"
    significance VARCHAR(100), -- "extends_known_verification_range"
    mathematical_novelty VARCHAR(100), -- "incremental_contribution", "breakthrough"
    potential_applications JSONB, -- Array of application areas
    follow_up_research_needed BOOLEAN,
    publication_potential VARCHAR(50),
    novelty_score DECIMAL(5,2),
    impact_assessment JSONB, -- {"short_term": "...", "long_term": "..."}
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- RESEARCH PAPERS TABLE (Enhanced)
-- =============================================================================

CREATE TABLE IF NOT EXISTS research_papers (
    id SERIAL PRIMARY KEY,
    discovery_id VARCHAR(50) REFERENCES discoveries(discovery_id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    abstract TEXT,
    authors JSONB, -- Array of author objects
    keywords JSONB, -- Array of keywords
    paper_type VARCHAR(50), -- "conference", "journal", "preprint", "technical_report"
    publication_status VARCHAR(50), -- "draft", "submitted", "accepted", "published"
    doi VARCHAR(100),
    arxiv_id VARCHAR(100),
    journal_name VARCHAR(200),
    conference_name VARCHAR(200),
    publication_date DATE,
    citation_count INT DEFAULT 0,
    impact_factor DECIMAL(5,2),
    peer_review_comments JSONB,
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

-- Scientific validation indexes
CREATE INDEX IF NOT EXISTS idx_comp_verification_discovery ON computational_verification(discovery_id);
CREATE INDEX IF NOT EXISTS idx_math_proofs_discovery ON mathematical_proofs(discovery_id);
CREATE INDEX IF NOT EXISTS idx_cross_validation_discovery ON cross_validation(discovery_id);
CREATE INDEX IF NOT EXISTS idx_scientific_contrib_discovery ON scientific_contributions(discovery_id);

-- Research methodology indexes
CREATE INDEX IF NOT EXISTS idx_research_method_discovery ON research_methodology(discovery_id);
CREATE INDEX IF NOT EXISTS idx_academic_integration_discovery ON academic_integration(discovery_id);
CREATE INDEX IF NOT EXISTS idx_error_analysis_discovery ON error_analysis(discovery_id);
CREATE INDEX IF NOT EXISTS idx_complexity_analysis_discovery ON complexity_analysis(discovery_id);

-- Reproducibility and novelty indexes
CREATE INDEX IF NOT EXISTS idx_reproducibility_discovery ON reproducibility_data(discovery_id);
CREATE INDEX IF NOT EXISTS idx_novel_discoveries_discovery ON novel_discoveries(discovery_id);
CREATE INDEX IF NOT EXISTS idx_research_papers_discovery ON research_papers(discovery_id);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_comp_verification_algorithm ON computational_verification(algorithm_used);
CREATE INDEX IF NOT EXISTS idx_math_proofs_method ON mathematical_proofs(proof_method);
CREATE INDEX IF NOT EXISTS idx_cross_validation_consensus ON cross_validation(consensus_percentage);
CREATE INDEX IF NOT EXISTS idx_scientific_contrib_impact ON scientific_contributions(research_impact_score);

-- =============================================================================
-- VIEWS FOR EASY DATA ACCESS
-- =============================================================================

-- Comprehensive discovery view with all scientific data
CREATE OR REPLACE VIEW comprehensive_discoveries AS
SELECT 
    d.*,
    cv.algorithm_used as computation_algorithm,
    cv.computation_steps,
    cv.execution_time_ms,
    cv.hash_verification,
    mp.theorem_statement,
    mp.proof_method,
    mp.mathematical_rigor_score,
    cv.consensus_percentage,
    cv.independent_verifiers,
    sc.research_impact_score,
    sc.novel_patterns_discovered,
    rm.research_question,
    rm.hypothesis,
    ai.peer_review_status,
    ai.research_category,
    ea.confidence_interval,
    ea.statistical_significance,
    ca.time_complexity,
    ca.space_complexity,
    rd.deterministic_algorithm,
    rd.code_repository,
    nd.discovery_type,
    nd.mathematical_novelty
FROM discoveries d
LEFT JOIN computational_verification cv ON d.discovery_id = cv.discovery_id
LEFT JOIN mathematical_proofs mp ON d.discovery_id = mp.discovery_id
LEFT JOIN cross_validation cv ON d.discovery_id = cv.discovery_id
LEFT JOIN scientific_contributions sc ON d.discovery_id = sc.discovery_id
LEFT JOIN research_methodology rm ON d.discovery_id = rm.discovery_id
LEFT JOIN academic_integration ai ON d.discovery_id = ai.discovery_id
LEFT JOIN error_analysis ea ON d.discovery_id = ea.discovery_id
LEFT JOIN complexity_analysis ca ON d.discovery_id = ca.discovery_id
LEFT JOIN reproducibility_data rd ON d.discovery_id = rd.discovery_id
LEFT JOIN novel_discoveries nd ON d.discovery_id = nd.discovery_id;

-- Research quality summary view
CREATE OR REPLACE VIEW research_quality_summary AS
SELECT 
    d.discovery_id,
    d.work_type_name,
    d.research_value,
    cv.consensus_percentage,
    mp.mathematical_rigor_score,
    sc.research_impact_score,
    ea.confidence_interval,
    ai.peer_review_status,
    rd.deterministic_algorithm,
    nd.mathematical_novelty,
    (cv.consensus_percentage * mp.mathematical_rigor_score * sc.research_impact_score * ea.confidence_interval) as overall_quality_score
FROM discoveries d
LEFT JOIN cross_validation cv ON d.discovery_id = cv.discovery_id
LEFT JOIN mathematical_proofs mp ON d.discovery_id = mp.discovery_id
LEFT JOIN scientific_contributions sc ON d.discovery_id = sc.discovery_id
LEFT JOIN error_analysis ea ON d.discovery_id = ea.discovery_id
LEFT JOIN academic_integration ai ON d.discovery_id = ai.discovery_id
LEFT JOIN reproducibility_data rd ON d.discovery_id = rd.discovery_id
LEFT JOIN novel_discoveries nd ON d.discovery_id = nd.discovery_id;
