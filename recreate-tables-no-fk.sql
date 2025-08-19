-- Recreate enhanced scientific tables without foreign key constraints

-- Drop existing tables
DROP TABLE IF EXISTS computational_verification CASCADE;
DROP TABLE IF EXISTS mathematical_proofs CASCADE;
DROP TABLE IF EXISTS cross_validation CASCADE;
DROP TABLE IF EXISTS scientific_contributions CASCADE;
DROP TABLE IF EXISTS research_methodology CASCADE;
DROP TABLE IF EXISTS academic_integration CASCADE;
DROP TABLE IF EXISTS error_analysis CASCADE;
DROP TABLE IF EXISTS complexity_analysis CASCADE;
DROP TABLE IF EXISTS reproducibility_data CASCADE;
DROP TABLE IF EXISTS novel_discoveries CASCADE;

-- Recreate tables without foreign key constraints
CREATE TABLE computational_verification (
    id SERIAL PRIMARY KEY,
    discovery_id VARCHAR(50),
    algorithm_used VARCHAR(100) NOT NULL,
    input_parameters JSONB NOT NULL,
    computation_steps BIGINT NOT NULL,
    cpu_cycles BIGINT,
    memory_usage_mb DECIMAL(10,2),
    execution_time_ms DECIMAL(10,2),
    hash_verification VARCHAR(66),
    reproducible_seed BIGINT,
    verification_nodes JSONB,
    hardware_specs JSONB,
    software_environment JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE mathematical_proofs (
    id SERIAL PRIMARY KEY,
    discovery_id VARCHAR(50),
    theorem_statement TEXT NOT NULL,
    proof_method VARCHAR(100) NOT NULL,
    counterexamples_found INT DEFAULT 0,
    edge_cases_tested JSONB,
    mathematical_rigor_score DECIMAL(5,2) CHECK (mathematical_rigor_score BETWEEN 0 AND 1),
    proof_completeness VARCHAR(50),
    known_limitations JSONB,
    proof_steps JSONB,
    assumptions_made JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cross_validation (
    id SERIAL PRIMARY KEY,
    discovery_id VARCHAR(50),
    independent_verifiers INT NOT NULL,
    consensus_percentage DECIMAL(5,2) CHECK (consensus_percentage BETWEEN 0 AND 100),
    verification_conflicts JSONB,
    validation_method VARCHAR(100),
    external_reference_checks JSONB,
    literature_citations JSONB,
    verification_timeline JSONB,
    validator_credentials JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE scientific_contributions (
    id SERIAL PRIMARY KEY,
    discovery_id VARCHAR(50),
    new_data_points INT,
    range_extended JSONB,
    novel_patterns_discovered JSONB,
    existing_knowledge_confirmed BOOLEAN,
    computational_milestone VARCHAR(200),
    research_impact_score DECIMAL(5,2),
    novelty_contribution VARCHAR(100),
    potential_applications JSONB,
    follow_up_research_needed BOOLEAN,
    publication_potential VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE research_methodology (
    id SERIAL PRIMARY KEY,
    discovery_id VARCHAR(50),
    research_question TEXT NOT NULL,
    hypothesis TEXT,
    experimental_design VARCHAR(100),
    controls JSONB,
    variables JSONB,
    sample_size INT,
    statistical_power DECIMAL(5,2),
    methodology_type VARCHAR(50),
    data_collection_method VARCHAR(100),
    analysis_techniques JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE academic_integration (
    id SERIAL PRIMARY KEY,
    discovery_id VARCHAR(50),
    related_publications JSONB,
    citation_potential VARCHAR(100),
    peer_review_status VARCHAR(50) DEFAULT 'pending',
    research_category VARCHAR(100),
    mathematical_subject_classification VARCHAR(20),
    academic_institutions JSONB,
    research_funding JSONB,
    collaboration_network JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE error_analysis (
    id SERIAL PRIMARY KEY,
    discovery_id VARCHAR(50),
    numerical_precision VARCHAR(50),
    algorithm_correctness_proof BOOLEAN,
    implementation_testing JSONB,
    uncertainty_sources JSONB,
    confidence_interval DECIMAL(5,4),
    false_positive_rate DECIMAL(10,6),
    statistical_significance VARCHAR(50),
    error_bounds JSONB,
    reliability_metrics JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE complexity_analysis (
    id SERIAL PRIMARY KEY,
    discovery_id VARCHAR(50),
    time_complexity VARCHAR(50),
    space_complexity VARCHAR(50),
    scalability_limits JSONB,
    optimization_techniques JSONB,
    performance_benchmarks JSONB,
    computational_efficiency DECIMAL(5,2),
    resource_utilization JSONB,
    algorithm_improvements JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE reproducibility_data (
    id SERIAL PRIMARY KEY,
    discovery_id VARCHAR(50),
    deterministic_algorithm BOOLEAN,
    random_seed_used BIGINT,
    environment_details JSONB,
    reproduction_instructions TEXT,
    data_availability VARCHAR(100),
    code_repository VARCHAR(200),
    docker_image VARCHAR(200),
    dependency_versions JSONB,
    platform_independence BOOLEAN,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE novel_discoveries (
    id SERIAL PRIMARY KEY,
    discovery_id VARCHAR(50),
    discovery_type VARCHAR(100),
    significance VARCHAR(100),
    mathematical_novelty VARCHAR(100),
    potential_applications JSONB,
    follow_up_research_needed BOOLEAN,
    publication_potential VARCHAR(50),
    novelty_score DECIMAL(5,2),
    impact_assessment JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_comp_verification_discovery ON computational_verification(discovery_id);
CREATE INDEX idx_math_proofs_discovery ON mathematical_proofs(discovery_id);
CREATE INDEX idx_cross_validation_discovery ON cross_validation(discovery_id);
CREATE INDEX idx_scientific_contrib_discovery ON scientific_contributions(discovery_id);
CREATE INDEX idx_research_method_discovery ON research_methodology(discovery_id);
CREATE INDEX idx_academic_integration_discovery ON academic_integration(discovery_id);
CREATE INDEX idx_error_analysis_discovery ON error_analysis(discovery_id);
CREATE INDEX idx_complexity_analysis_discovery ON complexity_analysis(discovery_id);
CREATE INDEX idx_reproducibility_discovery ON reproducibility_data(discovery_id);
CREATE INDEX idx_novel_discoveries_discovery ON novel_discoveries(discovery_id);
