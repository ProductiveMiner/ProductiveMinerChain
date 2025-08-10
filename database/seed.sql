-- Seed data for ProductiveMiner v2
-- This includes initial data for blockchain, mathematical engines, and research features

-- Insert default admin user (password: admin123)
INSERT INTO users (email, username, password_hash, role, is_active, wallet_address) 
VALUES (
    'admin@productiveminer.com',
    'admin',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3bp.gS.Oi',
    'admin',
    true,
    '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'
) ON CONFLICT (email) DO NOTHING;

-- Insert default validator user
INSERT INTO users (email, username, password_hash, role, is_active, wallet_address, staked_amount) 
VALUES (
    'validator@productiveminer.com',
    'validator',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3bp.gS.Oi',
    'validator',
    true,
    '0x8ba1f109551bD432803012645Hac136c772c3c7b',
    100000
) ON CONFLICT (email) DO NOTHING;

-- Insert default researcher user
INSERT INTO users (email, username, password_hash, role, is_active, wallet_address) 
VALUES (
    'researcher@productiveminer.com',
    'researcher',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3bp.gS.Oi',
    'researcher',
    true,
    '0x1234567890123456789012345678901234567890'
) ON CONFLICT (email) DO NOTHING;

-- Insert genesis block
INSERT INTO blocks (block_number, block_hash, parent_hash, miner_address, difficulty, nonce, timestamp, gas_limit, gas_used, transactions_count, block_reward, status) 
VALUES (
    0,
    '0x0000000000000000000000000000000000000000000000000000000000000000',
    '0x0000000000000000000000000000000000000000000000000000000000000000',
    '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
    1,
    0,
    CURRENT_TIMESTAMP,
    30000000,
    0,
    0,
    1000.0,
    'confirmed'
);

-- Insert initial tokenomics data
INSERT INTO tokenomics (total_supply, circulating_supply, staked_supply, burned_supply, emission_rate, burn_rate, staking_apy, block_reward) 
VALUES (
    1000000000.0,
    500000000.0,
    100000.0,
    0.0,
    1000.0,
    0.1,
    0.12,
    1000.0
);

-- Insert initial ML models
INSERT INTO ml_models (model_name, model_type, mathematical_type, model_version, accuracy, is_active) VALUES
('Prime Pattern Detector', 'neural_network', 'prime_pattern', '1.0.0', 95.5, true),
('Riemann Zero Finder', 'transformer', 'riemann_zero', '1.0.0', 92.3, true),
('Yang-Mills Solver', 'cnn', 'yang_mills', '1.0.0', 88.7, true),
('Goldbach Conjecture', 'lstm', 'goldbach', '1.0.0', 94.1, true),
('Navier-Stokes Solver', 'rnn', 'navier_stokes', '1.0.0', 89.4, true),
('Birch-Swinnerton', 'transformer', 'birch_swinnerton', '1.0.0', 91.2, true),
('ECC Cryptography', 'cnn', 'ecc', '1.0.0', 96.8, true),
('Lattice Problems', 'neural_network', 'lattice', '1.0.0', 93.6, true),
('Poincaré Conjecture', 'transformer', 'poincare', '1.0.0', 90.9, true);

-- Insert sample research papers
INSERT INTO research_papers (title, abstract, author_id, mathematical_type, difficulty_level, research_value, access_tier, status) VALUES
('Advanced Prime Number Patterns in Cryptography', 'This paper explores the relationship between prime number patterns and cryptographic security...', 1, 'prime_pattern', 8, 1500.0, 'premium', 'published'),
('Riemann Zeta Function Zero Distribution', 'Analysis of the distribution of non-trivial zeros of the Riemann zeta function...', 1, 'riemann_zero', 9, 2000.0, 'enterprise', 'published'),
('Yang-Mills Theory and Quantum Field Theory', 'Connections between Yang-Mills theory and modern quantum field theory applications...', 1, 'yang_mills', 9, 1800.0, 'enterprise', 'published'),
('Goldbach Conjecture: New Approaches', 'Novel computational methods for approaching the Goldbach conjecture...', 1, 'goldbach', 7, 1200.0, 'premium', 'published'),
('Navier-Stokes Equations: Numerical Solutions', 'Advanced numerical methods for solving the Navier-Stokes equations...', 1, 'navier_stokes', 8, 1600.0, 'premium', 'published');

-- Insert sample mathematical discoveries
INSERT INTO mathematical_discoveries (session_id, user_id, discovery_type, problem_statement, solution_approach, accuracy_percentage, research_value, publication_status, verification_status) VALUES
(
    gen_random_uuid(),
    1,
    'prime_pattern',
    'Find patterns in prime number distribution that could improve cryptographic algorithms',
    'Using machine learning to identify recurring patterns in prime number sequences',
    87.5,
    500.0,
    'public',
    'verified'
),
(
    gen_random_uuid(),
    1,
    'riemann_zero',
    'Locate non-trivial zeros of the Riemann zeta function in the critical strip',
    'Computational approach using advanced numerical methods',
    92.3,
    750.0,
    'public',
    'verified'
),
(
    gen_random_uuid(),
    1,
    'yang_mills',
    'Solve Yang-Mills equations for quantum field theory applications',
    'Numerical solution using finite element methods',
    89.1,
    600.0,
    'private',
    'pending'
);

-- Insert system metrics
INSERT INTO system_metrics (metric_name, metric_value, metric_unit) VALUES
('total_blocks_mined', 1, 'blocks'),
('total_transactions', 0, 'transactions'),
('active_miners', 0, 'users'),
('active_validators', 1, 'validators'),
('total_discoveries', 3, 'discoveries'),
('research_papers_published', 5, 'papers'),
('ml_models_active', 9, 'models'),
('average_difficulty', 25, 'difficulty'),
('network_hashrate', 0, 'hash/s'),
('total_staked', 100000, 'tokens');

-- Log the seeding
INSERT INTO system_logs (level, message) VALUES ('info', 'Database seeding completed successfully');
