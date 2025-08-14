#!/bin/bash

# Database Initialization Script for ProductiveMiner v2
# This script sets up the production database with all necessary tables

set -e

echo "🔧 Initializing ProductiveMiner Database..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable is not set"
    echo "Please set DATABASE_URL to your PostgreSQL connection string"
    echo "Example: postgresql://username:password@host:port/database"
    exit 1
fi

echo "📊 Database URL: $DATABASE_URL"

# Function to execute SQL file
execute_sql() {
    local file=$1
    echo "📝 Executing SQL file: $file"
    
    if [ -f "$file" ]; then
        psql "$DATABASE_URL" -f "$file"
        echo "✅ Successfully executed $file"
    else
        echo "❌ SQL file not found: $file"
        exit 1
    fi
}

# Function to execute SQL command
execute_sql_command() {
    local command=$1
    echo "🔧 Executing SQL command: $command"
    psql "$DATABASE_URL" -c "$command"
}

# Test database connection
echo "🔍 Testing database connection..."
if psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ Database connection successful"
else
    echo "❌ Database connection failed"
    echo "Please check your DATABASE_URL and ensure the database is accessible"
    exit 1
fi

# Create database schema
echo "🏗️  Creating database schema..."

# Execute main schema
execute_sql "database/schema.sql"

# Execute blockchain tables
execute_sql "database/blockchain_tables.sql"

# Create additional tables if they don't exist
echo "📋 Creating additional tables..."

# Create discoveries table (if not exists)
execute_sql_command "
CREATE TABLE IF NOT EXISTS discoveries (
    id VARCHAR(255) PRIMARY KEY,
    miner_address VARCHAR(42) NOT NULL,
    work_type VARCHAR(100) NOT NULL,
    difficulty BIGINT NOT NULL,
    reward BIGINT NOT NULL,
    computational_complexity BIGINT DEFAULT 0,
    tx_hash VARCHAR(66) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_discoveries_miner_address ON discoveries(miner_address);
CREATE INDEX IF NOT EXISTS idx_discoveries_work_type ON discoveries(work_type);
CREATE INDEX IF NOT EXISTS idx_discoveries_tx_hash ON discoveries(tx_hash);
CREATE INDEX IF NOT EXISTS idx_discoveries_created_at ON discoveries(created_at);
"

# Create research_stats table
execute_sql_command "
CREATE TABLE IF NOT EXISTS research_stats (
    id SERIAL PRIMARY KEY,
    total_discoveries BIGINT DEFAULT 0,
    total_research_value DECIMAL(20,8) DEFAULT 0,
    active_researchers INTEGER DEFAULT 0,
    discoveries_24h INTEGER DEFAULT 0,
    discoveries_7d INTEGER DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
"

# Insert initial research stats
execute_sql_command "
INSERT INTO research_stats (total_discoveries, total_research_value, active_researchers, discoveries_24h, discoveries_7d)
VALUES (0, 0, 0, 0, 0)
ON CONFLICT DO NOTHING;
"

# Create system_info table
execute_sql_command "
CREATE TABLE IF NOT EXISTS system_info (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
"

# Insert initial system info
execute_sql_command "
INSERT INTO system_info (key, value, description) VALUES
('database_version', '2.0', 'Database schema version'),
('last_initialized', NOW()::text, 'Last database initialization'),
('total_tables', '15', 'Total number of tables in schema')
ON CONFLICT (key) DO UPDATE SET 
    value = EXCLUDED.value,
    description = EXCLUDED.description,
    updated_at = CURRENT_TIMESTAMP;
"

# Create database health check function
execute_sql_command "
CREATE OR REPLACE FUNCTION check_database_health()
RETURNS TABLE(
    table_name TEXT,
    record_count BIGINT,
    last_updated TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'discoveries'::TEXT as table_name,
        COUNT(*)::BIGINT as record_count,
        MAX(created_at) as last_updated
    FROM discoveries
    UNION ALL
    SELECT 
        'mathematical_discoveries'::TEXT,
        COUNT(*)::BIGINT,
        MAX(created_at)
    FROM mathematical_discoveries
    UNION ALL
    SELECT 
        'mining_sessions'::TEXT,
        COUNT(*)::BIGINT,
        MAX(created_at)
    FROM mining_sessions
    UNION ALL
    SELECT 
        'users'::TEXT,
        COUNT(*)::BIGINT,
        MAX(created_at)
    FROM users;
END;
$$ LANGUAGE plpgsql;
"

echo "✅ Database initialization completed successfully!"

# Display database health
echo "📊 Database Health Check:"
psql "$DATABASE_URL" -c "SELECT * FROM check_database_health();"

echo "🎉 Database is ready for ProductiveMiner v2!"
echo ""
echo "📋 Available tables:"
psql "$DATABASE_URL" -c "\dt"

echo ""
echo "🔧 Next steps:"
echo "1. Update your DATABASE_URL environment variable in production"
echo "2. Restart your backend application"
echo "3. Test the research endpoints"
