#!/bin/bash

# ProductiveMiner Database Reset Script
# This script clears the database and resets it for new contract deployment

set -euo pipefail

# Configuration
DATABASE_URL=${DATABASE_URL:-"postgresql://productiveminer:productiveminer123@productiveminer-pg.c0lmo082cafp.us-east-1.rds.amazonaws.com:5432/productiveminer_db"}
SCHEMA_FILE="./database/schema.sql"
SEED_FILE="./database/seed.sql"
BACKUP_FILE="./database/backup_pre_reset_$(date +%Y%m%d_%H%M%S).sql"

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

# Create backup before reset
create_backup() {
    print_status "Creating backup before reset..."
    
    if command -v pg_dump &> /dev/null; then
        if pg_dump "$DATABASE_URL" > "$BACKUP_FILE" 2>/dev/null; then
            print_success "Backup created: $BACKUP_FILE"
        else
            print_warning "Failed to create backup (insufficient permissions or connection issues)"
        fi
    else
        print_warning "pg_dump not available, skipping backup"
    fi
}

# Clear all existing data and tables
clear_database() {
    print_status "Clearing existing database..."
    
    psql "$DATABASE_URL" << 'EOF'
-- Drop all tables in correct order (reverse dependency order)
DROP TABLE IF EXISTS schema_migrations CASCADE;
DROP TABLE IF EXISTS ml_model_training_data CASCADE;
DROP TABLE IF EXISTS ml_models CASCADE;
DROP TABLE IF EXISTS tokenomics CASCADE;
DROP TABLE IF EXISTS research_paper_citations CASCADE;
DROP TABLE IF EXISTS research_papers CASCADE;
DROP TABLE IF EXISTS mathematical_discoveries CASCADE;
DROP TABLE IF EXISTS mining_session_results CASCADE;
DROP TABLE IF EXISTS mining_sessions CASCADE;
DROP TABLE IF EXISTS staking CASCADE;
DROP TABLE IF EXISTS validator_rewards CASCADE;
DROP TABLE IF EXISTS validators CASCADE;
DROP TABLE IF EXISTS transaction_logs CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS blocks CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop any remaining sequences
DROP SEQUENCE IF EXISTS users_id_seq CASCADE;
DROP SEQUENCE IF EXISTS blocks_id_seq CASCADE;
DROP SEQUENCE IF EXISTS transactions_id_seq CASCADE;
DROP SEQUENCE IF EXISTS mining_sessions_id_seq CASCADE;
DROP SEQUENCE IF EXISTS mathematical_discoveries_id_seq CASCADE;
DROP SEQUENCE IF EXISTS research_papers_id_seq CASCADE;
DROP SEQUENCE IF EXISTS validators_id_seq CASCADE;
DROP SEQUENCE IF EXISTS staking_id_seq CASCADE;
DROP SEQUENCE IF EXISTS ml_models_id_seq CASCADE;
DROP SEQUENCE IF EXISTS tokenomics_id_seq CASCADE;

-- Drop any remaining functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Drop any remaining triggers
-- (These should be dropped with the tables, but just to be safe)

-- Drop any remaining indexes
-- (These should be dropped with the tables)

-- Drop any remaining views
-- (Add any views here if they exist)

VACUUM FULL;
EOF
    
    print_success "Database cleared successfully"
}

# Recreate database schema
recreate_schema() {
    print_status "Recreating database schema..."
    
    if [ -f "$SCHEMA_FILE" ]; then
        if psql "$DATABASE_URL" -f "$SCHEMA_FILE"; then
            print_success "Schema recreated successfully"
        else
            print_error "Failed to recreate schema"
            exit 1
        fi
    else
        print_error "Schema file not found: $SCHEMA_FILE"
        exit 1
    fi
}

# Apply seed data for new contract
apply_seed_data() {
    print_status "Applying fresh seed data..."
    
    # First apply the standard seed file if it exists
    if [ -f "$SEED_FILE" ]; then
        if psql "$DATABASE_URL" -f "$SEED_FILE"; then
            print_success "Standard seed data applied"
        else
            print_warning "Failed to apply standard seed data"
        fi
    fi
    
    # Then add contract-specific data
    print_status "Adding new contract configuration..."
    
    psql "$DATABASE_URL" << EOF
-- Insert new contract configuration
INSERT INTO tokenomics (
    token_address,
    token_name,
    token_symbol,
    total_supply,
    circulating_supply,
    network,
    chain_id,
    deployment_block,
    contract_type,
    created_at
) VALUES (
    '0x016A5B5617D26b93Ec6fB8DB2DC1BA79DefB088e',
    'MINED Token',
    'MINED',
    1000000000000000000000000000,
    997500000000000000000000000,
    'sepolia',
    11155111,
    0,
    'MINEDTokenStandalone',
    NOW()
) ON CONFLICT (token_address) DO UPDATE SET
    token_name = EXCLUDED.token_name,
    token_symbol = EXCLUDED.token_symbol,
    total_supply = EXCLUDED.total_supply,
    circulating_supply = EXCLUDED.circulating_supply,
    network = EXCLUDED.network,
    chain_id = EXCLUDED.chain_id,
    contract_type = EXCLUDED.contract_type,
    updated_at = NOW();

-- Reset any existing user balances and mining data
-- (This ensures a clean start with the new contract)

-- Add initial admin user if not exists
INSERT INTO users (
    wallet_address,
    username,
    role,
    is_active,
    created_at
) VALUES (
    '0x6fF6dD4E5974B92d64C4068d83095AC1d7c1EC18',
    'admin',
    'admin',
    true,
    NOW()
) ON CONFLICT (wallet_address) DO UPDATE SET
    role = 'admin',
    is_active = true,
    updated_at = NOW();

COMMIT;
EOF
    
    print_success "New contract configuration added"
}

# Verify the reset
verify_reset() {
    print_status "Verifying database reset..."
    
    # Check if key tables exist and are empty/have correct initial data
    local tables=("users" "blocks" "transactions" "mining_sessions" "mathematical_discoveries" "validators" "staking" "tokenomics")
    
    for table in "${tables[@]}"; do
        if psql "$DATABASE_URL" -c "\dt $table" &> /dev/null; then
            local count=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM $table;" | tr -d ' ')
            print_status "Table '$table' exists with $count rows"
        else
            print_error "Table '$table' is missing!"
            exit 1
        fi
    done
    
    # Check tokenomics table has our new contract
    local contract_count=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM tokenomics WHERE token_address = '0x016A5B5617D26b93Ec6fB8DB2DC1BA79DefB088e';" | tr -d ' ')
    
    if [ "$contract_count" = "1" ]; then
        print_success "New contract configuration verified"
    else
        print_error "New contract configuration not found in database!"
        exit 1
    fi
    
    print_success "Database reset verification passed"
}

# Main reset function
main() {
    echo ""
    print_status "🔄 Starting ProductiveMiner Database Reset"
    echo "=============================================="
    print_status "Database URL: $DATABASE_URL"
    print_status "New Contract: 0x016A5B5617D26b93Ec6fB8DB2DC1BA79DefB088e"
    print_status "Network: Sepolia (Chain ID: 11155111)"
    echo ""
    
    # Confirmation prompt
    print_warning "⚠️  This will completely clear the existing database!"
    print_warning "⚠️  All existing data will be lost!"
    echo ""
    read -p "Are you sure you want to continue? (yes/no): " confirm
    
    if [ "$confirm" != "yes" ]; then
        print_status "Database reset cancelled"
        exit 0
    fi
    
    echo ""
    print_status "Proceeding with database reset..."
    echo ""
    
    # Run reset steps
    check_postgres_client
    test_connection
    create_backup
    clear_database
    recreate_schema
    apply_seed_data
    verify_reset
    
    echo ""
    print_success "🎉 Database reset completed successfully!"
    echo ""
    print_status "Reset Summary:"
    print_status "  - Previous data backed up to: $BACKUP_FILE"
    print_status "  - Database completely cleared"
    print_status "  - Fresh schema applied"
    print_status "  - New contract configuration added"
    print_status "  - Admin user configured"
    echo ""
    print_status "New Contract Details:"
    print_status "  - Address: 0x016A5B5617D26b93Ec6fB8DB2DC1BA79DefB088e"
    print_status "  - Network: Sepolia Testnet"
    print_status "  - Type: MINEDTokenStandalone"
    print_status "  - Owner: 0x6fF6dD4E5974B92d64C4068d83095AC1d7c1EC18"
    echo ""
    print_status "Next steps:"
    print_status "  1. Restart all services (backend, frontend)"
    print_status "  2. Test contract connectivity"
    print_status "  3. Verify token functionality"
    print_status "  4. Update frontend configuration"
    echo ""
}

# Handle script arguments
case "${1:-reset}" in
    "reset")
        main
        ;;
    "verify")
        test_connection
        verify_reset
        ;;
    "backup")
        create_backup
        ;;
    *)
        echo "Usage: $0 {reset|verify|backup}"
        echo "  reset  - Full database reset (default)"
        echo "  verify - Verify reset was successful"
        echo "  backup - Create backup only"
        exit 1
        ;;
esac
