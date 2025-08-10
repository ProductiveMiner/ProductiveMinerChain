-- ProductiveMiner Database Initialization Script
-- This script creates all necessary tables and indexes for the application

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    is_active BOOLEAN DEFAULT true,
    total_mining_sessions INTEGER DEFAULT 0,
    total_mining_time INTEGER DEFAULT 0,
    total_coins_earned INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Create mining_sessions table
CREATE TABLE IF NOT EXISTS mining_sessions (
    id UUID PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    difficulty INTEGER NOT NULL CHECK (difficulty >= 1 AND difficulty <= 100),
    target VARCHAR(64) NOT NULL,
    nonce BIGINT,
    hash VARCHAR(64),
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    duration INTEGER, -- in seconds
    coins_earned INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'stopped')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create user_sessions table for session management
CREATE TABLE IF NOT EXISTS user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL
);

-- Create system_logs table for audit trail
CREATE TABLE IF NOT EXISTS system_logs (
    id SERIAL PRIMARY KEY,
    level VARCHAR(10) NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error')),
    message TEXT NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

CREATE INDEX IF NOT EXISTS idx_mining_sessions_user_id ON mining_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_mining_sessions_status ON mining_sessions(status);
CREATE INDEX IF NOT EXISTS idx_mining_sessions_created_at ON mining_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_mining_sessions_difficulty ON mining_sessions(difficulty);
CREATE INDEX IF NOT EXISTS idx_mining_sessions_start_time ON mining_sessions(start_time);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level);
CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON system_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at);

-- Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_mining_sessions_user_status ON mining_sessions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_mining_sessions_user_created ON mining_sessions(user_id, created_at);

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

-- Create function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM user_sessions WHERE expires_at < CURRENT_TIMESTAMP;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ language 'plpgsql';

-- Create function to get user statistics
CREATE OR REPLACE FUNCTION get_user_stats(user_id_param INTEGER)
RETURNS TABLE(
    total_sessions INTEGER,
    completed_sessions INTEGER,
    stopped_sessions INTEGER,
    total_mining_time INTEGER,
    total_coins_earned INTEGER,
    avg_difficulty NUMERIC,
    avg_session_duration NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_sessions,
        COUNT(CASE WHEN status = 'completed' THEN 1 END)::INTEGER as completed_sessions,
        COUNT(CASE WHEN status = 'stopped' THEN 1 END)::INTEGER as stopped_sessions,
        COALESCE(SUM(duration), 0)::INTEGER as total_mining_time,
        COALESCE(SUM(coins_earned), 0)::INTEGER as total_coins_earned,
        COALESCE(AVG(difficulty), 0)::NUMERIC as avg_difficulty,
        COALESCE(AVG(duration), 0)::NUMERIC as avg_session_duration
    FROM mining_sessions
    WHERE user_id = user_id_param;
END;
$$ language 'plpgsql';

-- Create function to get leaderboard data
CREATE OR REPLACE FUNCTION get_mining_leaderboard(limit_count INTEGER DEFAULT 10, time_filter TEXT DEFAULT 'all')
RETURNS TABLE(
    rank INTEGER,
    username VARCHAR(50),
    sessions BIGINT,
    total_time BIGINT,
    total_coins BIGINT,
    avg_difficulty NUMERIC
) AS $$
DECLARE
    time_condition TEXT;
BEGIN
    -- Set time filter condition
    CASE time_filter
        WHEN 'week' THEN time_condition := "AND created_at >= NOW() - INTERVAL '7 days'";
        WHEN 'month' THEN time_condition := "AND created_at >= NOW() - INTERVAL '30 days'";
        ELSE time_condition := '';
    END CASE;

    RETURN QUERY
    SELECT 
        ROW_NUMBER() OVER (ORDER BY SUM(ms.coins_earned) DESC, SUM(ms.duration) DESC)::INTEGER as rank,
        u.username,
        COUNT(ms.id) as sessions,
        COALESCE(SUM(ms.duration), 0) as total_time,
        COALESCE(SUM(ms.coins_earned), 0) as total_coins,
        COALESCE(AVG(ms.difficulty), 0) as avg_difficulty
    FROM users u
    LEFT JOIN mining_sessions ms ON u.id = ms.user_id AND ms.status = 'completed' 
        AND (time_condition = '' OR ms.created_at >= CASE 
            WHEN time_filter = 'week' THEN NOW() - INTERVAL '7 days'
            WHEN time_filter = 'month' THEN NOW() - INTERVAL '30 days'
            ELSE '1970-01-01'::timestamp
        END)
    WHERE u.is_active = true
    GROUP BY u.id, u.username
    HAVING COUNT(ms.id) > 0
    ORDER BY SUM(ms.coins_earned) DESC, SUM(ms.duration) DESC
    LIMIT limit_count;
END;
$$ language 'plpgsql';

-- Insert default admin user (password: admin123)
-- Note: In production, change this password immediately
INSERT INTO users (email, username, password_hash, role, is_active) 
VALUES (
    'admin@productiveminer.com',
    'admin',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3bp.gS.Oi', -- bcrypt hash of 'admin123'
    'admin',
    true
) ON CONFLICT (email) DO NOTHING;

-- Create a view for active mining sessions
CREATE OR REPLACE VIEW active_mining_sessions AS
SELECT 
    ms.id,
    ms.user_id,
    u.username,
    ms.difficulty,
    ms.target,
    ms.start_time,
    EXTRACT(EPOCH FROM (NOW() - ms.start_time))::INTEGER as duration_seconds
FROM mining_sessions ms
JOIN users u ON ms.user_id = u.id
WHERE ms.status = 'active';

-- Create a view for user mining statistics
CREATE OR REPLACE VIEW user_mining_stats AS
SELECT 
    u.id,
    u.username,
    u.email,
    u.total_mining_sessions,
    u.total_mining_time,
    u.total_coins_earned,
    COUNT(ms.id) as total_sessions,
    COUNT(CASE WHEN ms.status = 'completed' THEN 1 END) as completed_sessions,
    COUNT(CASE WHEN ms.status = 'stopped' THEN 1 END) as stopped_sessions,
    COALESCE(AVG(ms.difficulty), 0) as avg_difficulty,
    COALESCE(AVG(ms.duration), 0) as avg_session_duration,
    u.last_login,
    u.created_at
FROM users u
LEFT JOIN mining_sessions ms ON u.id = ms.user_id
WHERE u.is_active = true
GROUP BY u.id, u.username, u.email, u.total_mining_sessions, u.total_mining_time, u.total_coins_earned, u.last_login, u.created_at;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO productiveminer;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO productiveminer;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO productiveminer;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO productiveminer;

-- Set up automatic cleanup of expired sessions (runs every hour)
-- Note: This requires pg_cron extension to be installed
-- SELECT cron.schedule('cleanup-expired-sessions', '0 * * * *', 'SELECT cleanup_expired_sessions();');

-- Log the initialization
INSERT INTO system_logs (level, message) VALUES ('info', 'Database initialization completed successfully');
