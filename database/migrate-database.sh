#!/bin/bash

# ProductiveMiner Database Migration Script
# This script applies database changes and ensures the schema is up to date

set -euo pipefail

# Configuration
DATABASE_URL=${DATABASE_URL:-"postgresql://productiveminer:changeme123@localhost:5432/productiveminer_db"}
SCHEMA_FILE="./database/schema.sql"
SEED_FILE="./database/seed.sql"
MIGRATION_LOG="./database/migration.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if PostgreSQL client is available
check_postgres_client() {
    if ! command -v psql &> /dev/null; then
        print_error "PostgreSQL client (psql) is not installed. Please install it first."
        exit 1
    fi
}

# Test database connection
test_connection() {
    print_status "Testing database connection..."
    
    if psql "$DATABASE_URL" -c "SELECT 1;" &> /dev/null; then
        print_success "Database connection successful"
    else
        print_error "Failed to connect to database. Please check your DATABASE_URL."
        exit 1
    fi
}

# Create migration log table if it doesn't exist
create_migration_table() {
    print_status "Creating migration tracking table..."
    
    psql "$DATABASE_URL" << 'EOF'
CREATE TABLE IF NOT EXISTS schema_migrations (
    id SERIAL PRIMARY KEY,
    migration_name VARCHAR(255) NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    checksum VARCHAR(64),
    status VARCHAR(20) DEFAULT 'applied'
);
EOF
    
    print_success "Migration tracking table created"
}

# Calculate file checksum
calculate_checksum() {
    local file="$1"
    if command -v sha256sum &> /dev/null; then
        sha256sum "$file" | cut -d' ' -f1
    elif command -v shasum &> /dev/null; then
        shasum -a 256 "$file" | cut -d' ' -f1
    else
        echo "no-checksum-available"
    fi
}

# Check if migration has been applied
is_migration_applied() {
    local migration_name="$1"
    local checksum="$2"
    
    local result=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM schema_migrations WHERE migration_name = '$migration_name' AND checksum = '$checksum';")
    echo "$result" | tr -d ' '
}

# Apply schema migration
apply_schema() {
    print_status "Applying database schema..."
    
    local schema_checksum=$(calculate_checksum "$SCHEMA_FILE")
    local migration_name="schema_$(date +%Y%m%d_%H%M%S)"
    
    if [ "$(is_migration_applied "$migration_name" "$schema_checksum")" = "0" ]; then
        print_status "Applying schema changes..."
        
        # Apply schema with error handling
        if psql "$DATABASE_URL" -f "$SCHEMA_FILE" 2>&1 | tee -a "$MIGRATION_LOG"; then
            # Record successful migration
            psql "$DATABASE_URL" -c "INSERT INTO schema_migrations (migration_name, checksum) VALUES ('$migration_name', '$schema_checksum');"
            print_success "Schema migration applied successfully"
        else
            print_error "Schema migration failed. Check $MIGRATION_LOG for details."
            exit 1
        fi
    else
        print_warning "Schema migration already applied (checksum matches)"
    fi
}

# Apply seed data
apply_seed_data() {
    print_status "Applying seed data..."
    
    local seed_checksum=$(calculate_checksum "$SEED_FILE")
    local migration_name="seed_$(date +%Y%m%d_%H%M%S)"
    
    if [ "$(is_migration_applied "$migration_name" "$seed_checksum")" = "0" ]; then
        print_status "Applying seed data..."
        
        # Apply seed data with error handling
        if psql "$DATABASE_URL" -f "$SEED_FILE" 2>&1 | tee -a "$MIGRATION_LOG"; then
            # Record successful migration
            psql "$DATABASE_URL" -c "INSERT INTO schema_migrations (migration_name, checksum) VALUES ('$migration_name', '$seed_checksum');"
            print_success "Seed data applied successfully"
        else
            print_error "Seed data application failed. Check $MIGRATION_LOG for details."
            exit 1
        fi
    else
        print_warning "Seed data already applied (checksum matches)"
    fi
}

# Verify database schema
verify_schema() {
    print_status "Verifying database schema..."
    
    # Check if key tables exist
    local tables=("users" "blocks" "transactions" "mining_sessions" "mathematical_discoveries" "research_papers" "validators" "staking" "ml_models" "tokenomics")
    
    for table in "${tables[@]}"; do
        if psql "$DATABASE_URL" -c "\dt $table" &> /dev/null; then
            print_success "Table '$table' exists"
        else
            print_error "Table '$table' is missing!"
            exit 1
        fi
    done
    
    # Check if we have initial data
    local user_count=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM users;" | tr -d ' ')
    local block_count=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM blocks;" | tr -d ' ')
    
    print_status "Database contains $user_count users and $block_count blocks"
    
    if [ "$user_count" -gt 0 ] && [ "$block_count" -gt 0 ]; then
        print_success "Database verification passed"
    else
        print_warning "Database appears to be empty or missing initial data"
    fi
}

# Create database indexes for performance
create_indexes() {
    print_status "Creating database indexes for performance..."
    
    psql "$DATABASE_URL" << 'EOF'
-- Create indexes if they don't exist
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_wallet ON users(wallet_address);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_blocks_number ON blocks(block_number);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_blocks_hash ON blocks(block_hash);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_hash ON transactions(tx_hash);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_from ON transactions(from_address);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_to ON transactions(to_address);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mining_sessions_user ON mining_sessions(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mining_sessions_type ON mining_sessions(mathematical_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_discoveries_type ON mathematical_discoveries(discovery_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_discoveries_user ON mathematical_discoveries(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_validators_address ON validators(validator_address);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_staking_user ON staking(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ml_models_type ON ml_models(mathematical_type);
EOF
    
    print_success "Database indexes created"
}

# Backup database
backup_database() {
    print_status "Creating database backup..."
    
    local backup_file="./database/backup_$(date +%Y%m%d_%H%M%S).sql"
    
    if pg_dump "$DATABASE_URL" > "$backup_file" 2>/dev/null; then
        print_success "Database backup created: $backup_file"
    else
        print_warning "Failed to create database backup (pg_dump not available or insufficient permissions)"
    fi
}

# Show migration history
show_migration_history() {
    print_status "Migration history:"
    
    psql "$DATABASE_URL" -c "SELECT migration_name, applied_at, status FROM schema_migrations ORDER BY applied_at DESC;" 2>/dev/null || print_warning "Could not retrieve migration history"
}

# Main migration function
main() {
    echo ""
    print_status "🗄️ Starting ProductiveMiner Database Migration"
    echo "=================================================="
    print_status "Database URL: $DATABASE_URL"
    print_status "Schema file: $SCHEMA_FILE"
    print_status "Seed file: $SEED_FILE"
    echo ""
    
    # Run migration steps
    check_postgres_client
    test_connection
    backup_database
    create_migration_table
    apply_schema
    apply_seed_data
    create_indexes
    verify_schema
    show_migration_history
    
    echo ""
    print_success "🎉 Database migration completed successfully!"
    echo ""
    print_status "Migration Summary:"
    print_status "  - Database schema updated"
    print_status "  - Seed data applied"
    print_status "  - Performance indexes created"
    print_status "  - Database verification passed"
    echo ""
    print_status "Next steps:"
    print_status "  1. Restart the backend service"
    print_status "  2. Test database connectivity"
    print_status "  3. Verify application functionality"
    print_status "  4. Monitor database performance"
    echo ""
}

# Handle script arguments
case "${1:-migrate}" in
    "migrate")
        main
        ;;
    "check")
        check_postgres_client
        test_connection
        verify_schema
        show_migration_history
        print_success "Database check completed"
        ;;
    "backup")
        backup_database
        ;;
    "verify")
        verify_schema
        ;;
    "indexes")
        create_indexes
        ;;
    *)
        echo "Usage: $0 {migrate|check|backup|verify|indexes}"
        echo "  migrate - Full database migration (default)"
        echo "  check   - Check database connection and schema"
        echo "  backup  - Create database backup only"
        echo "  verify  - Verify database schema only"
        echo "  indexes - Create performance indexes only"
        exit 1
        ;;
esac
